/**
 * 設備通訊服務
 * 負責與濾網再生製程設備進行通訊
 * 改造自 EAP 的 ECU 服務，適用於 MSW 系統
 *
 * 支援設備類型：
 * - 清洗站設備
 * - 烘乾站設備
 * - 檢測站設備
 * - 包裝站設備
 *
 * 通訊協議：
 * - Modbus TCP (預設)
 * - Restful API (IoTEdge)
 * - WebSocket (即時監控)
 */

/**
 * 設備連線狀態
 */
export const DEVICE_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  TIMEOUT: 'timeout'
};

/**
 * 設備類型
 */
export const DEVICE_TYPE = {
  CLEANING: 'cleaning',       // 清洗站設備
  DRYING: 'drying',           // 烘乾站設備
  INSPECTION: 'inspection',   // 檢測站設備
  PACKAGING: 'packaging',     // 包裝站設備
  RFID_READER: 'rfid_reader', // RFID 讀取器
  CONVEYOR: 'conveyor'        // 輸送帶
};

/**
 * 設備指令類型
 */
export const DEVICE_COMMAND = {
  READ_STATUS: 'read_status',
  READ_SENSORS: 'read_sensors',
  START_PROCESS: 'start_process',
  STOP_PROCESS: 'stop_process',
  PAUSE_PROCESS: 'pause_process',
  RESUME_PROCESS: 'resume_process',
  SET_PARAMETERS: 'set_parameters',
  GET_PARAMETERS: 'get_parameters',
  EMERGENCY_STOP: 'emergency_stop',
  RESET: 'reset'
};

/**
 * 設備運行狀態
 */
export const DEVICE_RUNNING_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  ERROR: 'error',
  MAINTENANCE: 'maintenance',
  EMERGENCY_STOP: 'emergency_stop'
};

/**
 * Device Service Class
 */
export class DeviceService {
  constructor() {
    this.connections = new Map(); // 存儲設備連線
    this.mockMode = true; // 開發階段使用 Mock 模式
    this.ws = null; // WebSocket 連線
    this.wsUrl = 'ws://localhost:8080'; // WebSocket 代理服務位址
    this.pendingRequests = new Map(); // 待處理的請求
    this.requestId = 0; // 請求 ID 計數器
    this.sensorDataCallbacks = new Map(); // 感測器數據回調
  }

  /**
   * 連線到設備
   * @param {string} deviceId - 設備 ID
   * @param {string} deviceType - 設備類型
   * @param {Object} config - 連線配置 { ip, port, protocol }
   * @returns {Promise<Object>} 連線結果
   */
  async connect(deviceId, deviceType, config = {}) {
    try {
      const { ip, port = 502, protocol = 'modbus' } = config;

      if (this.mockMode) {
        return this._mockConnect(deviceId, deviceType, config);
      }

      // 確保 WebSocket 已連線
      await this._ensureWebSocketConnected();

      // 發送連線請求
      const response = await this._sendWebSocketRequest({
        action: 'connect',
        deviceId,
        deviceType,
        config: { ip, port, protocol }
      });

      if (response.success) {
        this.connections.set(deviceId, {
          deviceId,
          deviceType,
          ip,
          port,
          protocol,
          status: DEVICE_STATUS.CONNECTED,
          runningStatus: DEVICE_RUNNING_STATUS.IDLE,
          connectedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          errorCount: 0,
          metadata: {}
        });

        console.log(`[Device Service] Connected to ${deviceType} device ${deviceId} at ${ip}:${port}`);
      }

      return response;
    } catch (error) {
      console.error(`Failed to connect to device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 中斷設備連線
   * @param {string} deviceId - 設備 ID
   */
  async disconnect(deviceId) {
    try {
      if (!this.mockMode && this.ws) {
        await this._sendWebSocketRequest({
          action: 'disconnect',
          deviceId
        });
      }

      if (this.connections.has(deviceId)) {
        const connection = this.connections.get(deviceId);
        connection.status = DEVICE_STATUS.DISCONNECTED;
        this.connections.delete(deviceId);

        console.log(`[Device Service] Disconnected from device ${deviceId}`);
        return { success: true };
      }
      return { success: false, error: 'Connection not found' };
    } catch (error) {
      console.error(`Failed to disconnect device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 檢查設備連線狀態
   * @param {string} deviceId - 設備 ID
   * @returns {string} 連線狀態
   */
  getConnectionStatus(deviceId) {
    if (!this.connections.has(deviceId)) {
      return DEVICE_STATUS.DISCONNECTED;
    }
    return this.connections.get(deviceId).status;
  }

  /**
   * 讀取設備狀態
   * @param {string} deviceId - 設備 ID
   * @returns {Promise<Object>} 設備狀態資料
   */
  async readStatus(deviceId) {
    try {
      this._ensureConnected(deviceId);

      if (this.mockMode) {
        return this._mockReadStatus(deviceId);
      }

      const connection = this.connections.get(deviceId);

      // 根據設備類型讀取不同的寄存器
      const registerMap = this._getRegisterMap(connection.deviceType);

      const response = await this._sendWebSocketRequest({
        action: 'read',
        deviceId,
        data: {
          functionCode: 3, // Read Holding Registers
          startAddress: registerMap.status.start,
          quantity: registerMap.status.length
        }
      });

      if (response.success) {
        const status = this._parseStatusData(connection.deviceType, response.data.values);

        // 更新連線資訊
        connection.lastActivity = new Date().toISOString();
        connection.runningStatus = status.runningStatus;

        return {
          success: true,
          deviceId,
          deviceType: connection.deviceType,
          status,
          timestamp: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      console.error(`Failed to read status from device ${deviceId}:`, error);
      this._handleError(deviceId, error);
      throw error;
    }
  }

  /**
   * 讀取感測器數據
   * @param {string} deviceId - 設備 ID
   * @returns {Promise<Object>} 感測器數據
   */
  async readSensors(deviceId) {
    try {
      this._ensureConnected(deviceId);

      if (this.mockMode) {
        return this._mockReadSensors(deviceId);
      }

      const connection = this.connections.get(deviceId);
      const registerMap = this._getRegisterMap(connection.deviceType);

      const response = await this._sendWebSocketRequest({
        action: 'read',
        deviceId,
        data: {
          functionCode: 3,
          startAddress: registerMap.sensors.start,
          quantity: registerMap.sensors.length
        }
      });

      if (response.success) {
        const sensors = this._parseSensorData(connection.deviceType, response.data.values);

        connection.lastActivity = new Date().toISOString();

        return {
          success: true,
          deviceId,
          deviceType: connection.deviceType,
          sensors,
          timestamp: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      console.error(`Failed to read sensors from device ${deviceId}:`, error);
      this._handleError(deviceId, error);
      throw error;
    }
  }

  /**
   * 啟動製程
   * @param {string} deviceId - 設備 ID
   * @param {Object} processParams - 製程參數
   * @returns {Promise<Object>} 執行結果
   */
  async startProcess(deviceId, processParams = {}) {
    try {
      this._ensureConnected(deviceId);

      if (this.mockMode) {
        return this._mockStartProcess(deviceId, processParams);
      }

      const connection = this.connections.get(deviceId);

      // 先寫入參數
      if (Object.keys(processParams).length > 0) {
        await this.setParameters(deviceId, processParams);
      }

      // 寫入啟動線圈
      const response = await this._sendWebSocketRequest({
        action: 'write',
        deviceId,
        data: {
          functionCode: 5, // Write Single Coil
          startAddress: 1,
          values: [0xFF00] // ON
        }
      });

      if (response.success) {
        connection.runningStatus = DEVICE_RUNNING_STATUS.RUNNING;

        return {
          success: true,
          deviceId,
          message: 'Process started successfully',
          timestamp: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      console.error(`Failed to start process on device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 停止製程
   * @param {string} deviceId - 設備 ID
   * @param {boolean} emergency - 是否為緊急停止
   * @returns {Promise<Object>} 執行結果
   */
  async stopProcess(deviceId, emergency = false) {
    try {
      this._ensureConnected(deviceId);

      if (this.mockMode) {
        return this._mockStopProcess(deviceId, emergency);
      }

      const connection = this.connections.get(deviceId);

      // 寫入停止線圈（緊急停止使用不同的線圈位址）
      const coilAddress = emergency ? 3 : 2;

      const response = await this._sendWebSocketRequest({
        action: 'write',
        deviceId,
        data: {
          functionCode: 5,
          startAddress: coilAddress,
          values: [0xFF00]
        }
      });

      if (response.success) {
        connection.runningStatus = emergency
          ? DEVICE_RUNNING_STATUS.EMERGENCY_STOP
          : DEVICE_RUNNING_STATUS.IDLE;

        return {
          success: true,
          deviceId,
          message: emergency ? 'Emergency stop executed' : 'Process stopped successfully',
          timestamp: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      console.error(`Failed to stop process on device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 暫停製程
   * @param {string} deviceId - 設備 ID
   * @returns {Promise<Object>} 執行結果
   */
  async pauseProcess(deviceId) {
    try {
      this._ensureConnected(deviceId);

      if (this.mockMode) {
        return this._mockPauseProcess(deviceId);
      }

      const connection = this.connections.get(deviceId);

      const response = await this._sendWebSocketRequest({
        action: 'write',
        deviceId,
        data: {
          functionCode: 5,
          startAddress: 4, // Pause coil
          values: [0xFF00]
        }
      });

      if (response.success) {
        connection.runningStatus = DEVICE_RUNNING_STATUS.PAUSED;

        return {
          success: true,
          deviceId,
          message: 'Process paused successfully',
          timestamp: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      console.error(`Failed to pause process on device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 恢復製程
   * @param {string} deviceId - 設備 ID
   * @returns {Promise<Object>} 執行結果
   */
  async resumeProcess(deviceId) {
    try {
      this._ensureConnected(deviceId);

      if (this.mockMode) {
        return this._mockResumeProcess(deviceId);
      }

      const connection = this.connections.get(deviceId);

      const response = await this._sendWebSocketRequest({
        action: 'write',
        deviceId,
        data: {
          functionCode: 5,
          startAddress: 5, // Resume coil
          values: [0xFF00]
        }
      });

      if (response.success) {
        connection.runningStatus = DEVICE_RUNNING_STATUS.RUNNING;

        return {
          success: true,
          deviceId,
          message: 'Process resumed successfully',
          timestamp: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      console.error(`Failed to resume process on device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 設定參數
   * @param {string} deviceId - 設備 ID
   * @param {Object} parameters - 參數鍵值對
   * @returns {Promise<Object>} 設定結果
   */
  async setParameters(deviceId, parameters) {
    try {
      this._ensureConnected(deviceId);

      if (this.mockMode) {
        return this._mockSetParameters(deviceId, parameters);
      }

      const connection = this.connections.get(deviceId);
      const registerMap = this._getRegisterMap(connection.deviceType);

      // 將參數轉換為寄存器值
      const values = this._encodeParameters(connection.deviceType, parameters);

      const response = await this._sendWebSocketRequest({
        action: 'write',
        deviceId,
        data: {
          functionCode: 16, // Write Multiple Registers
          startAddress: registerMap.parameters.start,
          values
        }
      });

      if (response.success) {
        return {
          success: true,
          deviceId,
          parameters: Object.keys(parameters),
          message: 'Parameters set successfully',
          timestamp: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      console.error(`Failed to set parameters on device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 取得參數
   * @param {string} deviceId - 設備 ID
   * @returns {Promise<Object>} 參數資料
   */
  async getParameters(deviceId) {
    try {
      this._ensureConnected(deviceId);

      if (this.mockMode) {
        return this._mockGetParameters(deviceId);
      }

      const connection = this.connections.get(deviceId);
      const registerMap = this._getRegisterMap(connection.deviceType);

      const response = await this._sendWebSocketRequest({
        action: 'read',
        deviceId,
        data: {
          functionCode: 3,
          startAddress: registerMap.parameters.start,
          quantity: registerMap.parameters.length
        }
      });

      if (response.success) {
        const parameters = this._decodeParameters(connection.deviceType, response.data.values);

        return {
          success: true,
          deviceId,
          parameters,
          timestamp: new Date().toISOString()
        };
      }

      return response;
    } catch (error) {
      console.error(`Failed to get parameters from device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * 確保設備已連線
   * @private
   */
  _ensureConnected(deviceId) {
    const status = this.getConnectionStatus(deviceId);
    if (status !== DEVICE_STATUS.CONNECTED) {
      throw new Error(`Device ${deviceId} is not connected (status: ${status})`);
    }
  }

  /**
   * 處理錯誤
   * @private
   */
  _handleError(deviceId, error) {
    if (this.connections.has(deviceId)) {
      const connection = this.connections.get(deviceId);
      connection.errorCount++;

      // 如果錯誤次數過多，自動斷線
      if (connection.errorCount >= 5) {
        connection.status = DEVICE_STATUS.ERROR;
        console.warn(`Device ${deviceId} marked as ERROR due to repeated failures`);
      }
    }
  }

  /**
   * 取得暫存器映射表（根據設備類型）
   * @private
   */
  _getRegisterMap(deviceType) {
    const maps = {
      [DEVICE_TYPE.CLEANING]: {
        status: { start: 40001, length: 10 },
        sensors: { start: 40101, length: 8 },
        parameters: { start: 40201, length: 6 }
      },
      [DEVICE_TYPE.DRYING]: {
        status: { start: 40001, length: 10 },
        sensors: { start: 40101, length: 6 },
        parameters: { start: 40201, length: 4 }
      },
      [DEVICE_TYPE.INSPECTION]: {
        status: { start: 40001, length: 8 },
        sensors: { start: 40101, length: 10 },
        parameters: { start: 40201, length: 5 }
      },
      [DEVICE_TYPE.PACKAGING]: {
        status: { start: 40001, length: 6 },
        sensors: { start: 40101, length: 4 },
        parameters: { start: 40201, length: 3 }
      }
    };

    return maps[deviceType] || maps[DEVICE_TYPE.CLEANING];
  }

  /**
   * 解析狀態數據
   * @private
   */
  _parseStatusData(deviceType, values) {
    // 基本狀態解析（可根據設備類型擴展）
    return {
      runningStatus: this._mapRunningStatus(values[0]),
      online: true,
      errorCode: values[1],
      currentCycle: values[2],
      totalCycles: values[3],
      completedItems: values[4],
      qualityOK: values[5],
      qualityNG: values[6],
      uptime: values[7],
      lastError: values[8] || null,
      maintenanceRequired: values[9] > 0
    };
  }

  /**
   * 映射運行狀態碼
   * @private
   */
  _mapRunningStatus(statusCode) {
    const statusMap = {
      0: DEVICE_RUNNING_STATUS.IDLE,
      1: DEVICE_RUNNING_STATUS.RUNNING,
      2: DEVICE_RUNNING_STATUS.PAUSED,
      3: DEVICE_RUNNING_STATUS.ERROR,
      4: DEVICE_RUNNING_STATUS.MAINTENANCE,
      5: DEVICE_RUNNING_STATUS.EMERGENCY_STOP
    };
    return statusMap[statusCode] || DEVICE_RUNNING_STATUS.IDLE;
  }

  /**
   * 解析感測器數據
   * @private
   */
  _parseSensorData(deviceType, values) {
    switch (deviceType) {
      case DEVICE_TYPE.CLEANING:
        return {
          temperature: values[0] / 10,
          pressure: values[1] / 10,
          waterFlow: values[2] / 10,
          detergentLevel: values[3],
          ph: values[4] / 10,
          turbidity: values[5],
          vibration: values[6] / 10,
          power: values[7] / 10
        };

      case DEVICE_TYPE.DRYING:
        return {
          temperature: values[0] / 10,
          humidity: values[1] / 10,
          airFlow: values[2] / 10,
          heaterPower: values[3] / 10,
          fanSpeed: values[4],
          doorStatus: values[5] > 0
        };

      case DEVICE_TYPE.INSPECTION:
        return {
          sensorCount: values[0],
          passCount: values[1],
          failCount: values[2],
          cameraStatus: values[3] > 0,
          lightIntensity: values[4],
          focusQuality: values[5] / 10,
          imageQuality: values[6] / 10,
          calibrationStatus: values[7] > 0,
          defectTypes: values[8],
          confidence: values[9] / 10
        };

      default:
        return { raw: values };
    }
  }

  /**
   * 編碼參數為寄存器值
   * @private
   */
  _encodeParameters(deviceType, parameters) {
    const values = [];

    // 根據設備類型編碼參數（示例）
    if (deviceType === DEVICE_TYPE.CLEANING) {
      values.push(Math.round((parameters.temperature || 30) * 10));
      values.push(Math.round((parameters.pressure || 120) * 10));
      values.push(Math.round((parameters.waterFlow || 50) * 10));
      values.push(parameters.duration || 600); // 秒
      values.push(parameters.detergentRatio || 5); // %
      values.push(parameters.rinseCount || 3);
    } else if (deviceType === DEVICE_TYPE.DRYING) {
      values.push(Math.round((parameters.temperature || 80) * 10));
      values.push(Math.round((parameters.humidity || 30) * 10));
      values.push(parameters.duration || 1800);
      values.push(parameters.fanSpeed || 1500);
    }

    return values;
  }

  /**
   * 解碼寄存器值為參數
   * @private
   */
  _decodeParameters(deviceType, values) {
    if (deviceType === DEVICE_TYPE.CLEANING) {
      return {
        temperature: values[0] / 10,
        pressure: values[1] / 10,
        waterFlow: values[2] / 10,
        duration: values[3],
        detergentRatio: values[4],
        rinseCount: values[5]
      };
    } else if (deviceType === DEVICE_TYPE.DRYING) {
      return {
        temperature: values[0] / 10,
        humidity: values[1] / 10,
        duration: values[2],
        fanSpeed: values[3]
      };
    }

    return {};
  }

  // ==================== WebSocket 通訊實作 ====================

  async _ensureWebSocketConnected() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('[Device Service] WebSocket connected to proxy');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('[Device Service] WebSocket error:', error);
        reject(new Error('Failed to connect to WebSocket proxy'));
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          this._handleWebSocketResponse(response);
        } catch (error) {
          console.error('[Device Service] Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('[Device Service] WebSocket connection closed');
        this.ws = null;
      };
    });
  }

  _sendWebSocketRequest(request) {
    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, 10000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      const message = {
        ...request,
        requestId
      };

      this.ws.send(JSON.stringify(message));
    });
  }

  _handleWebSocketResponse(response) {
    const { requestId } = response;
    const pending = this.pendingRequests.get(requestId);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(requestId);

      if (response.success) {
        pending.resolve(response);
      } else {
        pending.reject(new Error(response.error || 'Unknown error'));
      }
    }
  }

  closeWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.pendingRequests.clear();
  }

  // ==================== Mock 模式實作 ====================

  _mockConnect(deviceId, deviceType, config) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connections.set(deviceId, {
          deviceId,
          deviceType,
          ip: config.ip,
          port: config.port,
          protocol: config.protocol,
          status: DEVICE_STATUS.CONNECTED,
          runningStatus: DEVICE_RUNNING_STATUS.IDLE,
          connectedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          errorCount: 0,
          metadata: {}
        });

        console.log(`[Device Service] Connected to ${deviceType} device ${deviceId} (Mock Mode)`);

        resolve({
          success: true,
          deviceId,
          deviceType,
          status: DEVICE_STATUS.CONNECTED,
          message: 'Connected successfully (Mock Mode)'
        });
      }, 500);
    });
  }

  _mockReadStatus(deviceId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const connection = this.connections.get(deviceId);

        resolve({
          success: true,
          deviceId,
          deviceType: connection?.deviceType || DEVICE_TYPE.CLEANING,
          status: {
            runningStatus: connection?.runningStatus || DEVICE_RUNNING_STATUS.IDLE,
            online: true,
            errorCode: 0,
            currentCycle: Math.floor(Math.random() * 100),
            totalCycles: 1000,
            completedItems: Math.floor(Math.random() * 500),
            qualityOK: Math.floor(Math.random() * 450),
            qualityNG: Math.floor(Math.random() * 50),
            uptime: Math.floor(Math.random() * 86400),
            lastError: null,
            maintenanceRequired: false
          },
          timestamp: new Date().toISOString()
        });
      }, 300);
    });
  }

  _mockReadSensors(deviceId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const connection = this.connections.get(deviceId);
        let sensors = {};

        switch (connection?.deviceType) {
          case DEVICE_TYPE.CLEANING:
            sensors = {
              temperature: 30 + Math.random() * 10,
              pressure: 100 + Math.random() * 20,
              waterFlow: 40 + Math.random() * 20,
              detergentLevel: Math.floor(Math.random() * 100),
              ph: 7 + Math.random() * 2,
              turbidity: Math.floor(Math.random() * 100),
              vibration: Math.random() * 5,
              power: 2 + Math.random() * 3
            };
            break;

          case DEVICE_TYPE.DRYING:
            sensors = {
              temperature: 70 + Math.random() * 20,
              humidity: 20 + Math.random() * 30,
              airFlow: 50 + Math.random() * 30,
              heaterPower: 3 + Math.random() * 2,
              fanSpeed: 1200 + Math.floor(Math.random() * 600),
              doorStatus: Math.random() > 0.9
            };
            break;

          default:
            sensors = { value: Math.random() * 100 };
        }

        resolve({
          success: true,
          deviceId,
          deviceType: connection?.deviceType,
          sensors,
          timestamp: new Date().toISOString()
        });
      }, 300);
    });
  }

  _mockStartProcess(deviceId, processParams) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const connection = this.connections.get(deviceId);
        if (connection) {
          connection.runningStatus = DEVICE_RUNNING_STATUS.RUNNING;
        }

        resolve({
          success: true,
          deviceId,
          processParams,
          message: 'Process started successfully (Mock Mode)',
          timestamp: new Date().toISOString()
        });
      }, 500);
    });
  }

  _mockStopProcess(deviceId, emergency) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const connection = this.connections.get(deviceId);
        if (connection) {
          connection.runningStatus = emergency
            ? DEVICE_RUNNING_STATUS.EMERGENCY_STOP
            : DEVICE_RUNNING_STATUS.IDLE;
        }

        resolve({
          success: true,
          deviceId,
          message: emergency ? 'Emergency stop executed (Mock)' : 'Process stopped (Mock)',
          timestamp: new Date().toISOString()
        });
      }, 300);
    });
  }

  _mockPauseProcess(deviceId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const connection = this.connections.get(deviceId);
        if (connection) {
          connection.runningStatus = DEVICE_RUNNING_STATUS.PAUSED;
        }

        resolve({
          success: true,
          deviceId,
          message: 'Process paused (Mock)',
          timestamp: new Date().toISOString()
        });
      }, 300);
    });
  }

  _mockResumeProcess(deviceId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const connection = this.connections.get(deviceId);
        if (connection) {
          connection.runningStatus = DEVICE_RUNNING_STATUS.RUNNING;
        }

        resolve({
          success: true,
          deviceId,
          message: 'Process resumed (Mock)',
          timestamp: new Date().toISOString()
        });
      }, 300);
    });
  }

  _mockSetParameters(deviceId, parameters) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          deviceId,
          parameters: Object.keys(parameters),
          message: 'Parameters set successfully (Mock Mode)',
          timestamp: new Date().toISOString()
        });
      }, 400);
    });
  }

  _mockGetParameters(deviceId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const connection = this.connections.get(deviceId);
        let parameters = {};

        if (connection?.deviceType === DEVICE_TYPE.CLEANING) {
          parameters = {
            temperature: 35,
            pressure: 120,
            waterFlow: 50,
            duration: 600,
            detergentRatio: 5,
            rinseCount: 3
          };
        } else if (connection?.deviceType === DEVICE_TYPE.DRYING) {
          parameters = {
            temperature: 80,
            humidity: 30,
            duration: 1800,
            fanSpeed: 1500
          };
        }

        resolve({
          success: true,
          deviceId,
          parameters,
          timestamp: new Date().toISOString()
        });
      }, 300);
    });
  }

  /**
   * 設定模式（Mock / Production）
   * @param {boolean} mockMode - 是否使用 Mock 模式
   */
  setMockMode(mockMode) {
    this.mockMode = mockMode;
    console.log(`Device Service mode set to: ${mockMode ? 'Mock' : 'Production'}`);
  }

  /**
   * 取得所有連線
   * @returns {Array} 連線列表
   */
  getAllConnections() {
    return Array.from(this.connections.values());
  }

  /**
   * 取得連線統計
   * @returns {Object} 統計資料
   */
  getConnectionStats() {
    const connections = this.getAllConnections();
    const byType = {};
    const byStatus = {};

    connections.forEach(conn => {
      byType[conn.deviceType] = (byType[conn.deviceType] || 0) + 1;
      byStatus[conn.status] = (byStatus[conn.status] || 0) + 1;
    });

    return {
      total: connections.length,
      byType,
      byStatus,
      mockMode: this.mockMode
    };
  }
}

// 匯出單例
export const deviceService = new DeviceService();
