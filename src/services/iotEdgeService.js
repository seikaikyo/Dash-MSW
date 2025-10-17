/**
 * IoTEdge RestfulAPI Service
 * 整合 IoT Edge 裝置的 RESTful API
 * 提供即時設備資料、狀態同步、警報通知等功能
 */

import { deviceService } from './deviceService.js';
import { rfidService } from './rfidService.js';

/**
 * IoTEdge 裝置狀態
 */
export const IOTEDGE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  WARNING: 'warning',
  ERROR: 'error',
  MAINTENANCE: 'maintenance'
};

/**
 * 資料流類型
 */
export const STREAM_TYPE = {
  SENSOR_DATA: 'sensor_data',
  DEVICE_STATUS: 'device_status',
  ALERT: 'alert',
  RFID_EVENT: 'rfid_event',
  PRODUCTION_DATA: 'production_data'
};

/**
 * 警報等級
 */
export const ALERT_LEVEL = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

class IoTEdgeService {
  constructor() {
    // IoT Edge 設備列表
    this.edgeDevices = new Map();

    // 資料流訂閱器
    this.subscribers = new Map();

    // 警報列表
    this.alerts = [];

    // API 基礎 URL
    this.baseUrls = new Map();

    // 連線狀態
    this.connectionStatus = new Map();

    // 輪詢定時器
    this.pollingTimers = new Map();

    // 預設配置
    this.defaultConfig = {
      pollingInterval: 5000,  // 5秒輪詢一次
      timeout: 10000,         // 10秒超時
      retryAttempts: 3,       // 重試3次
      enableAutoReconnect: true
    };

    // 模擬模式
    this.mockMode = true;

    // 從 localStorage 載入配置
    this._loadFromStorage();

    // 啟動自動同步
    this._startAutoSync();
  }

  /**
   * 註冊 IoT Edge 裝置
   */
  async registerEdgeDevice(deviceId, config) {
    try {
      const edgeDevice = {
        deviceId,
        name: config.name || deviceId,
        apiUrl: config.apiUrl,
        type: config.type || 'generic',
        location: config.location,
        capabilities: config.capabilities || [],
        pollingInterval: config.pollingInterval || this.defaultConfig.pollingInterval,
        registeredAt: new Date().toISOString(),
        status: IOTEDGE_STATUS.OFFLINE,
        lastHeartbeat: null,
        metadata: config.metadata || {}
      };

      this.edgeDevices.set(deviceId, edgeDevice);
      this.baseUrls.set(deviceId, config.apiUrl);

      // 嘗試連線
      await this.connectEdgeDevice(deviceId);

      this._saveToStorage();

      return { success: true, deviceId, device: edgeDevice };
    } catch (error) {
      console.error(`Failed to register edge device ${deviceId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 連線到 IoT Edge 裝置
   */
  async connectEdgeDevice(deviceId) {
    const device = this.edgeDevices.get(deviceId);
    if (!device) {
      throw new Error(`Edge device ${deviceId} not found`);
    }

    try {
      if (this.mockMode) {
        // 模擬模式：直接標記為在線
        device.status = IOTEDGE_STATUS.ONLINE;
        device.lastHeartbeat = new Date().toISOString();
        this.connectionStatus.set(deviceId, {
          connected: true,
          connectedAt: new Date().toISOString()
        });

        // 啟動輪詢
        this._startPolling(deviceId);

        return { success: true, status: 'connected' };
      }

      // 實際模式：測試連線
      const response = await this._apiRequest(deviceId, '/health', 'GET');

      if (response.success) {
        device.status = IOTEDGE_STATUS.ONLINE;
        device.lastHeartbeat = new Date().toISOString();
        this.connectionStatus.set(deviceId, {
          connected: true,
          connectedAt: new Date().toISOString()
        });

        // 啟動輪詢
        this._startPolling(deviceId);

        return { success: true, status: 'connected' };
      } else {
        device.status = IOTEDGE_STATUS.OFFLINE;
        return { success: false, status: 'offline', error: response.error };
      }
    } catch (error) {
      device.status = IOTEDGE_STATUS.ERROR;
      console.error(`Failed to connect to edge device ${deviceId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 斷線 IoT Edge 裝置
   */
  disconnectEdgeDevice(deviceId) {
    const device = this.edgeDevices.get(deviceId);
    if (!device) {
      return { success: false, error: 'Device not found' };
    }

    // 停止輪詢
    this._stopPolling(deviceId);

    // 更新狀態
    device.status = IOTEDGE_STATUS.OFFLINE;
    this.connectionStatus.delete(deviceId);

    return { success: true };
  }

  /**
   * 取得即時感測器資料
   */
  async getSensorData(deviceId, sensorIds = []) {
    try {
      if (this.mockMode) {
        return this._generateMockSensorData(deviceId, sensorIds);
      }

      const endpoint = sensorIds.length > 0
        ? `/sensors?ids=${sensorIds.join(',')}`
        : '/sensors';

      const response = await this._apiRequest(deviceId, endpoint, 'GET');

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error(`Failed to get sensor data from ${deviceId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 取得裝置狀態
   */
  async getDeviceStatus(deviceId) {
    try {
      if (this.mockMode) {
        return this._generateMockDeviceStatus(deviceId);
      }

      const response = await this._apiRequest(deviceId, '/status', 'GET');

      if (response.success) {
        return { success: true, status: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error(`Failed to get device status from ${deviceId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 取得生產資料
   */
  async getProductionData(deviceId, timeRange = {}) {
    try {
      if (this.mockMode) {
        return this._generateMockProductionData(deviceId, timeRange);
      }

      const { startTime, endTime } = timeRange;
      let endpoint = '/production';

      if (startTime || endTime) {
        const params = new URLSearchParams();
        if (startTime) params.append('start', startTime);
        if (endTime) params.append('end', endTime);
        endpoint += `?${params.toString()}`;
      }

      const response = await this._apiRequest(deviceId, endpoint, 'GET');

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error(`Failed to get production data from ${deviceId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 取得警報
   */
  async getAlerts(deviceId, filters = {}) {
    try {
      if (this.mockMode) {
        return this._getMockAlerts(deviceId, filters);
      }

      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.startTime) params.append('start', filters.startTime);
      if (filters.endTime) params.append('end', filters.endTime);

      const endpoint = `/alerts${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this._apiRequest(deviceId, endpoint, 'GET');

      if (response.success) {
        return { success: true, alerts: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error(`Failed to get alerts from ${deviceId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 確認警報
   */
  async acknowledgeAlert(deviceId, alertId) {
    try {
      if (this.mockMode) {
        const alert = this.alerts.find(a => a.id === alertId && a.deviceId === deviceId);
        if (alert) {
          alert.acknowledged = true;
          alert.acknowledgedAt = new Date().toISOString();
          return { success: true };
        }
        return { success: false, error: 'Alert not found' };
      }

      const response = await this._apiRequest(
        deviceId,
        `/alerts/${alertId}/acknowledge`,
        'POST'
      );

      return response;
    } catch (error) {
      console.error(`Failed to acknowledge alert ${alertId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 發送控制命令
   */
  async sendCommand(deviceId, command, params = {}) {
    try {
      if (this.mockMode) {
        console.log(`[Mock] Sending command to ${deviceId}:`, command, params);

        // 同步到 deviceService
        if (deviceService.devices.has(deviceId)) {
          switch (command) {
            case 'start':
              await deviceService.startProcess(deviceId, params);
              break;
            case 'stop':
              await deviceService.stopProcess(deviceId, params.emergency || false);
              break;
            case 'pause':
              await deviceService.pauseProcess(deviceId);
              break;
            case 'resume':
              await deviceService.resumeProcess(deviceId);
              break;
          }
        }

        return {
          success: true,
          commandId: `cmd_${Date.now()}`,
          status: 'executed'
        };
      }

      const response = await this._apiRequest(
        deviceId,
        '/commands',
        'POST',
        { command, params }
      );

      return response;
    } catch (error) {
      console.error(`Failed to send command to ${deviceId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 訂閱資料流
   */
  subscribe(streamType, callback) {
    if (!this.subscribers.has(streamType)) {
      this.subscribers.set(streamType, []);
    }

    this.subscribers.get(streamType).push(callback);

    // 返回取消訂閱函數
    return () => {
      const callbacks = this.subscribers.get(streamType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * 發布資料到訂閱者
   */
  _publish(streamType, data) {
    const callbacks = this.subscribers.get(streamType) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  /**
   * 啟動輪詢
   */
  _startPolling(deviceId) {
    // 停止現有的輪詢
    this._stopPolling(deviceId);

    const device = this.edgeDevices.get(deviceId);
    if (!device) return;

    const pollingInterval = device.pollingInterval;

    const timer = setInterval(async () => {
      try {
        // 輪詢感測器資料
        const sensorData = await this.getSensorData(deviceId);
        if (sensorData.success) {
          this._publish(STREAM_TYPE.SENSOR_DATA, {
            deviceId,
            timestamp: new Date().toISOString(),
            data: sensorData.data
          });

          // 同步到 deviceService
          if (deviceService.devices.has(deviceId)) {
            const deviceData = deviceService.devices.get(deviceId);
            deviceData.lastUpdate = new Date().toISOString();
            deviceData.sensorData = sensorData.data;
          }
        }

        // 輪詢裝置狀態
        const statusData = await this.getDeviceStatus(deviceId);
        if (statusData.success) {
          this._publish(STREAM_TYPE.DEVICE_STATUS, {
            deviceId,
            timestamp: new Date().toISOString(),
            status: statusData.status
          });

          // 更新心跳
          device.lastHeartbeat = new Date().toISOString();
        }

        // 輪詢警報
        const alertsData = await this.getAlerts(deviceId);
        if (alertsData.success && alertsData.alerts.length > 0) {
          alertsData.alerts.forEach(alert => {
            this._publish(STREAM_TYPE.ALERT, {
              deviceId,
              timestamp: new Date().toISOString(),
              alert
            });

            // 儲存到本地警報列表
            if (!this.alerts.find(a => a.id === alert.id)) {
              this.alerts.push({ ...alert, deviceId });
            }
          });
        }
      } catch (error) {
        console.error(`Polling error for device ${deviceId}:`, error);

        // 連線失敗，標記為離線
        device.status = IOTEDGE_STATUS.OFFLINE;
        this._publish(STREAM_TYPE.DEVICE_STATUS, {
          deviceId,
          timestamp: new Date().toISOString(),
          status: { online: false, error: error.message }
        });
      }
    }, pollingInterval);

    this.pollingTimers.set(deviceId, timer);
  }

  /**
   * 停止輪詢
   */
  _stopPolling(deviceId) {
    const timer = this.pollingTimers.get(deviceId);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(deviceId);
    }
  }

  /**
   * API 請求
   */
  async _apiRequest(deviceId, endpoint, method = 'GET', data = null) {
    const baseUrl = this.baseUrls.get(deviceId);
    if (!baseUrl) {
      throw new Error(`No API URL configured for device ${deviceId}`);
    }

    const url = `${baseUrl}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, {
        ...config,
        signal: AbortSignal.timeout(this.defaultConfig.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return { success: true, data: responseData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 生成模擬感測器資料
   */
  _generateMockSensorData(deviceId, sensorIds = []) {
    const device = this.edgeDevices.get(deviceId);
    if (!device) {
      return { success: false, error: 'Device not found' };
    }

    // 從 deviceService 取得感測器資料（如果有連線）
    if (deviceService.devices.has(deviceId)) {
      const deviceData = deviceService.devices.get(deviceId);
      if (deviceData.sensorData) {
        return {
          success: true,
          data: {
            deviceId,
            timestamp: new Date().toISOString(),
            sensors: deviceData.sensorData
          }
        };
      }
    }

    // 否則生成隨機資料
    const mockSensors = {
      temperature: 25 + Math.random() * 10,
      humidity: 40 + Math.random() * 30,
      pressure: 100 + Math.random() * 5,
      vibration: Math.random() * 2,
      power: 5 + Math.random() * 10
    };

    return {
      success: true,
      data: {
        deviceId,
        timestamp: new Date().toISOString(),
        sensors: mockSensors
      }
    };
  }

  /**
   * 生成模擬裝置狀態
   */
  _generateMockDeviceStatus(deviceId) {
    const device = this.edgeDevices.get(deviceId);
    if (!device) {
      return { success: false, error: 'Device not found' };
    }

    // 從 deviceService 取得狀態
    let runningStatus = 'idle';
    let processInfo = null;

    if (deviceService.devices.has(deviceId)) {
      const deviceData = deviceService.devices.get(deviceId);
      runningStatus = deviceData.runningStatus || 'idle';
      processInfo = deviceData.currentProcess || null;
    }

    return {
      success: true,
      status: {
        deviceId,
        online: device.status === IOTEDGE_STATUS.ONLINE,
        status: device.status,
        runningStatus,
        uptime: Math.floor(Math.random() * 86400),
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        processInfo,
        lastUpdate: new Date().toISOString()
      }
    };
  }

  /**
   * 生成模擬生產資料
   */
  _generateMockProductionData(deviceId, timeRange = {}) {
    const now = Date.now();
    const records = [];

    for (let i = 0; i < 10; i++) {
      records.push({
        timestamp: new Date(now - i * 3600000).toISOString(),
        deviceId,
        output: Math.floor(Math.random() * 100),
        quality: 95 + Math.random() * 5,
        downtime: Math.floor(Math.random() * 60),
        cycleTime: 30 + Math.random() * 10
      });
    }

    return {
      success: true,
      data: {
        deviceId,
        timeRange,
        records,
        summary: {
          totalOutput: records.reduce((sum, r) => sum + r.output, 0),
          avgQuality: records.reduce((sum, r) => sum + r.quality, 0) / records.length,
          totalDowntime: records.reduce((sum, r) => sum + r.downtime, 0)
        }
      }
    };
  }

  /**
   * 取得模擬警報
   */
  _getMockAlerts(deviceId, filters = {}) {
    let alerts = this.alerts.filter(a => a.deviceId === deviceId);

    if (filters.level) {
      alerts = alerts.filter(a => a.level === filters.level);
    }

    if (filters.startTime) {
      alerts = alerts.filter(a => new Date(a.timestamp) >= new Date(filters.startTime));
    }

    if (filters.endTime) {
      alerts = alerts.filter(a => new Date(a.timestamp) <= new Date(filters.endTime));
    }

    return { success: true, alerts };
  }

  /**
   * 啟動自動同步
   */
  _startAutoSync() {
    // 每 30 秒同步一次 RFID 事件
    setInterval(() => {
      if (rfidService.readers && rfidService.readers.size > 0) {
        rfidService.readers.forEach((reader, readerId) => {
          if (reader.connected) {
            this._publish(STREAM_TYPE.RFID_EVENT, {
              readerId,
              timestamp: new Date().toISOString(),
              status: 'active'
            });
          }
        });
      }
    }, 30000);

    // 每 60 秒檢查裝置連線狀態
    setInterval(() => {
      this.edgeDevices.forEach((device, deviceId) => {
        if (device.status === IOTEDGE_STATUS.ONLINE) {
          const lastHeartbeat = device.lastHeartbeat ? new Date(device.lastHeartbeat) : null;
          const now = new Date();

          if (lastHeartbeat && (now - lastHeartbeat) > 60000) {
            // 超過 60 秒沒有心跳，標記為離線
            device.status = IOTEDGE_STATUS.OFFLINE;
            this._publish(STREAM_TYPE.DEVICE_STATUS, {
              deviceId,
              timestamp: new Date().toISOString(),
              status: { online: false, reason: 'heartbeat_timeout' }
            });
          }
        }
      });
    }, 60000);
  }

  /**
   * 從 localStorage 載入
   */
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem('msw_iotedge_devices');
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach(device => {
          this.edgeDevices.set(device.deviceId, device);
          this.baseUrls.set(device.deviceId, device.apiUrl);
        });
      }
    } catch (error) {
      console.error('Failed to load IoT Edge devices from storage:', error);
    }
  }

  /**
   * 儲存到 localStorage
   */
  _saveToStorage() {
    try {
      const data = Array.from(this.edgeDevices.values());
      localStorage.setItem('msw_iotedge_devices', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save IoT Edge devices to storage:', error);
    }
  }

  /**
   * 取得所有註冊的裝置
   */
  getAllDevices() {
    return Array.from(this.edgeDevices.values());
  }

  /**
   * 取得裝置資訊
   */
  getDevice(deviceId) {
    return this.edgeDevices.get(deviceId);
  }

  /**
   * 取得所有警報
   */
  getAllAlerts(filters = {}) {
    let alerts = [...this.alerts];

    if (filters.deviceId) {
      alerts = alerts.filter(a => a.deviceId === filters.deviceId);
    }

    if (filters.level) {
      alerts = alerts.filter(a => a.level === filters.level);
    }

    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(a => !!a.acknowledged === filters.acknowledged);
    }

    return alerts;
  }

  /**
   * 清除警報
   */
  clearAlerts(deviceId = null) {
    if (deviceId) {
      this.alerts = this.alerts.filter(a => a.deviceId !== deviceId);
    } else {
      this.alerts = [];
    }
  }

  /**
   * 設定模擬模式
   */
  setMockMode(enabled) {
    this.mockMode = enabled;
    console.log(`IoT Edge mock mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 生成測試警報（用於開發測試）
   */
  generateTestAlert(deviceId, level = ALERT_LEVEL.WARNING) {
    const alertMessages = {
      [ALERT_LEVEL.INFO]: ['設備已啟動', '參數已更新', '校正完成'],
      [ALERT_LEVEL.WARNING]: ['溫度偏高', '濕度偏低', '震動異常'],
      [ALERT_LEVEL.ERROR]: ['感測器失效', '通訊中斷', '參數超出範圍'],
      [ALERT_LEVEL.CRITICAL]: ['緊急停機', '安全異常', '嚴重過熱']
    };

    const messages = alertMessages[level];
    const message = messages[Math.floor(Math.random() * messages.length)];

    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      level,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.push(alert);

    this._publish(STREAM_TYPE.ALERT, {
      deviceId,
      timestamp: alert.timestamp,
      alert
    });

    return alert;
  }
}

// 建立單例
const iotEdgeService = new IoTEdgeService();

// 開發模式下暴露到 window
if (typeof window !== 'undefined') {
  window.iotEdgeService = iotEdgeService;
}

export default iotEdgeService;
