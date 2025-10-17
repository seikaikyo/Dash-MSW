/**
 * RFID 追蹤服務
 * 負責濾網 RFID 標籤的讀取、追蹤、記錄
 *
 * 功能：
 * - RFID 標籤讀取
 * - 濾網位置追蹤
 * - 製程歷史記錄
 * - 批次掃描
 * - 異常檢測
 */

import { deviceService, DEVICE_TYPE } from './deviceService.js';

/**
 * RFID 事件類型
 */
export const RFID_EVENT = {
  TAG_READ: 'tag_read',
  TAG_WRITE: 'tag_write',
  TAG_ENTERED: 'tag_entered',
  TAG_EXITED: 'tag_exited',
  BATCH_SCAN: 'batch_scan',
  TAG_ERROR: 'tag_error'
};

/**
 * RFID 標籤狀態
 */
export const TAG_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ERROR: 'error',
  LOST: 'lost'
};

/**
 * RFID Service Class
 */
export class RFIDService {
  constructor() {
    this.readers = new Map(); // RFID 讀取器連線
    this.tagCache = new Map(); // 標籤快取
    this.tagHistory = new Map(); // 標籤歷史記錄
    this.eventListeners = new Map(); // 事件監聽器
    this.storageKey = 'msw_rfid_data';
    this.scanningInterval = null;
    this.init();
  }

  /**
   * 初始化服務
   */
  init() {
    const data = this.loadFromStorage();
    if (data.tagHistory) {
      this.tagHistory = new Map(Object.entries(data.tagHistory));
    }
  }

  /**
   * 註冊 RFID 讀取器
   * @param {string} readerId - 讀取器 ID
   * @param {Object} config - 配置 { location, stationId, ip, port }
   * @returns {Promise<Object>} 註冊結果
   */
  async registerReader(readerId, config) {
    try {
      // 使用設備服務連線 RFID 讀取器
      const result = await deviceService.connect(
        readerId,
        DEVICE_TYPE.RFID_READER,
        { ip: config.ip, port: config.port || 502 }
      );

      if (result.success) {
        this.readers.set(readerId, {
          readerId,
          location: config.location,
          stationId: config.stationId,
          ip: config.ip,
          port: config.port,
          status: 'active',
          lastScan: null,
          tagCount: 0,
          errorCount: 0,
          registeredAt: new Date().toISOString()
        });

        console.log(`[RFID Service] Reader ${readerId} registered at ${config.location}`);

        return {
          success: true,
          readerId,
          message: 'RFID reader registered successfully'
        };
      }

      return result;
    } catch (error) {
      console.error(`Failed to register RFID reader ${readerId}:`, error);
      throw error;
    }
  }

  /**
   * 取消註冊 RFID 讀取器
   * @param {string} readerId - 讀取器 ID
   */
  async unregisterReader(readerId) {
    try {
      await deviceService.disconnect(readerId);
      this.readers.delete(readerId);

      console.log(`[RFID Service] Reader ${readerId} unregistered`);

      return { success: true };
    } catch (error) {
      console.error(`Failed to unregister RFID reader ${readerId}:`, error);
      throw error;
    }
  }

  /**
   * 讀取單一標籤
   * @param {string} readerId - 讀取器 ID
   * @returns {Promise<Object>} 標籤資料
   */
  async readTag(readerId) {
    try {
      const reader = this.readers.get(readerId);
      if (!reader) {
        throw new Error(`RFID reader ${readerId} not found`);
      }

      // 透過設備服務讀取感測器數據（RFID 標籤資訊）
      const result = await deviceService.readSensors(readerId);

      if (result.success) {
        const tagData = this._parseTRFIDData(result.sensors);

        // 更新讀取器統計
        reader.lastScan = new Date().toISOString();
        reader.tagCount++;

        // 快取標籤
        if (tagData.tagId) {
          this._cacheTag(tagData, reader);
          this._recordTagHistory(tagData, reader, RFID_EVENT.TAG_READ);
          this._emitEvent(RFID_EVENT.TAG_READ, { readerId, tagData, reader });
        }

        return {
          success: true,
          readerId,
          tagData,
          timestamp: new Date().toISOString()
        };
      }

      return result;
    } catch (error) {
      console.error(`Failed to read tag from reader ${readerId}:`, error);

      const reader = this.readers.get(readerId);
      if (reader) {
        reader.errorCount++;
      }

      throw error;
    }
  }

  /**
   * 批次掃描（持續掃描模式）
   * @param {string} readerId - 讀取器 ID
   * @param {number} duration - 掃描持續時間（秒）
   * @returns {Promise<Object>} 掃描結果
   */
  async batchScan(readerId, duration = 10) {
    try {
      const reader = this.readers.get(readerId);
      if (!reader) {
        throw new Error(`RFID reader ${readerId} not found`);
      }

      const scannedTags = new Map();
      const startTime = Date.now();
      const endTime = startTime + duration * 1000;

      console.log(`[RFID Service] Starting batch scan on reader ${readerId} for ${duration}s`);

      // 持續掃描直到時間結束
      while (Date.now() < endTime) {
        try {
          const result = await this.readTag(readerId);

          if (result.success && result.tagData.tagId) {
            const tagId = result.tagData.tagId;

            if (!scannedTags.has(tagId)) {
              scannedTags.set(tagId, result.tagData);
            } else {
              // 更新已存在標籤的最後掃描時間
              const existing = scannedTags.get(tagId);
              existing.lastSeen = new Date().toISOString();
              existing.scanCount = (existing.scanCount || 1) + 1;
            }
          }

          // 等待一小段時間再掃描下一個（避免過於頻繁）
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`Error during batch scan:`, error);
        }
      }

      const tags = Array.from(scannedTags.values());

      this._emitEvent(RFID_EVENT.BATCH_SCAN, {
        readerId,
        tagCount: tags.length,
        tags,
        duration
      });

      return {
        success: true,
        readerId,
        location: reader.location,
        tagCount: tags.length,
        tags,
        duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Batch scan failed on reader ${readerId}:`, error);
      throw error;
    }
  }

  /**
   * 寫入標籤資料
   * @param {string} readerId - 讀取器 ID
   * @param {string} tagId - 標籤 ID
   * @param {Object} data - 要寫入的資料
   * @returns {Promise<Object>} 寫入結果
   */
  async writeTag(readerId, tagId, data) {
    try {
      const reader = this.readers.get(readerId);
      if (!reader) {
        throw new Error(`RFID reader ${readerId} not found`);
      }

      // 將資料寫入 RFID 標籤（透過設備服務）
      const result = await deviceService.setParameters(readerId, {
        tagId,
        ...data
      });

      if (result.success) {
        this._recordTagHistory({ tagId, ...data }, reader, RFID_EVENT.TAG_WRITE);
        this._emitEvent(RFID_EVENT.TAG_WRITE, { readerId, tagId, data });

        return {
          success: true,
          readerId,
          tagId,
          message: 'Tag data written successfully',
          timestamp: new Date().toISOString()
        };
      }

      return result;
    } catch (error) {
      console.error(`Failed to write tag ${tagId} on reader ${readerId}:`, error);
      throw error;
    }
  }

  /**
   * 追蹤濾網位置
   * @param {string} tagId - 標籤 ID（濾網 ID）
   * @returns {Object} 濾網追蹤資訊
   */
  trackFilter(tagId) {
    const history = this.tagHistory.get(tagId);

    if (!history) {
      return {
        found: false,
        tagId,
        message: 'Tag not found in system'
      };
    }

    // 取得最近的記錄
    const recentRecords = history.slice(-10).reverse();
    const latestRecord = recentRecords[0];

    return {
      found: true,
      tagId,
      currentLocation: latestRecord.location,
      currentStation: latestRecord.stationId,
      lastSeen: latestRecord.timestamp,
      status: this._determineTagStatus(history),
      totalScans: history.length,
      recentHistory: recentRecords.map(r => ({
        location: r.location,
        station: r.stationId,
        event: r.event,
        timestamp: r.timestamp
      })),
      firstSeen: history[0].timestamp,
      journey: this._buildFilterJourney(history)
    };
  }

  /**
   * 取得製程歷史
   * @param {string} tagId - 標籤 ID
   * @returns {Array} 製程歷史記錄
   */
  getProcessHistory(tagId) {
    const history = this.tagHistory.get(tagId);

    if (!history) {
      return [];
    }

    return history.map(record => ({
      location: record.location,
      station: record.stationId,
      event: record.event,
      timestamp: record.timestamp,
      filterId: record.filterId,
      batchId: record.batchId
    }));
  }

  /**
   * 檢測異常標籤
   * @returns {Array} 異常標籤列表
   */
  detectAnomalies() {
    const anomalies = [];
    const now = Date.now();
    const LOST_THRESHOLD = 24 * 60 * 60 * 1000; // 24 小時

    this.tagHistory.forEach((history, tagId) => {
      const latestRecord = history[history.length - 1];
      const lastSeenTime = new Date(latestRecord.timestamp).getTime();
      const timeSinceLastSeen = now - lastSeenTime;

      // 檢測長時間未掃描
      if (timeSinceLastSeen > LOST_THRESHOLD) {
        anomalies.push({
          type: 'lost',
          tagId,
          lastLocation: latestRecord.location,
          lastSeen: latestRecord.timestamp,
          daysSinceLastSeen: Math.floor(timeSinceLastSeen / (24 * 60 * 60 * 1000)),
          severity: 'high'
        });
      }

      // 檢測異常移動（快速連續在不同站點出現）
      if (history.length >= 2) {
        const last2Records = history.slice(-2);
        const timeDiff = new Date(last2Records[1].timestamp) - new Date(last2Records[0].timestamp);

        if (timeDiff < 60000 && last2Records[0].stationId !== last2Records[1].stationId) {
          // 1 分鐘內在不同站點
          anomalies.push({
            type: 'suspicious_movement',
            tagId,
            from: last2Records[0].location,
            to: last2Records[1].location,
            timeDiff: timeDiff / 1000,
            severity: 'medium'
          });
        }
      }

      // 檢測重複掃描（在同一站點停留過久）
      const stationDurations = this._calculateStationDurations(history);
      const MAX_DURATION = 48 * 60 * 60 * 1000; // 48 小時

      stationDurations.forEach(({ stationId, duration }) => {
        if (duration > MAX_DURATION) {
          anomalies.push({
            type: 'stuck',
            tagId,
            station: stationId,
            durationHours: Math.floor(duration / (60 * 60 * 1000)),
            severity: 'medium'
          });
        }
      });
    });

    return anomalies;
  }

  /**
   * 取得讀取器統計
   * @returns {Object} 統計資料
   */
  getReaderStats() {
    const readers = Array.from(this.readers.values());

    return {
      totalReaders: readers.length,
      activeReaders: readers.filter(r => r.status === 'active').length,
      totalScans: readers.reduce((sum, r) => sum + r.tagCount, 0),
      totalErrors: readers.reduce((sum, r) => sum + r.errorCount, 0),
      readers: readers.map(r => ({
        readerId: r.readerId,
        location: r.location,
        station: r.stationId,
        status: r.status,
        tagCount: r.tagCount,
        errorCount: r.errorCount,
        lastScan: r.lastScan
      }))
    };
  }

  /**
   * 取得標籤統計
   * @returns {Object} 統計資料
   */
  getTagStats() {
    const tags = Array.from(this.tagHistory.keys());
    const now = Date.now();

    const activeCount = tags.filter(tagId => {
      const history = this.tagHistory.get(tagId);
      const latestRecord = history[history.length - 1];
      const lastSeenTime = new Date(latestRecord.timestamp).getTime();
      return (now - lastSeenTime) < 24 * 60 * 60 * 1000; // 24 小時內
    }).length;

    return {
      totalTags: tags.length,
      activeTags: activeCount,
      inactiveTags: tags.length - activeCount,
      totalRecords: Array.from(this.tagHistory.values()).reduce((sum, h) => sum + h.length, 0)
    };
  }

  /**
   * 監聽 RFID 事件
   * @param {string} eventType - 事件類型
   * @param {Function} callback - 回調函數
   * @returns {Function} 取消監聽函數
   */
  addEventListener(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    this.eventListeners.get(eventType).push(callback);

    // 返回取消監聽函數
    return () => {
      const listeners = this.eventListeners.get(eventType);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * 發送事件
   * @private
   */
  _emitEvent(eventType, data) {
    if (this.eventListeners.has(eventType)) {
      this.eventListeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in RFID event listener:`, error);
        }
      });
    }
  }

  /**
   * 解析 RFID 數據
   * @private
   */
  _parseRFIDData(sensors) {
    // 模擬解析 RFID 感測器數據
    // 實際實作會依照硬體規格解析
    return {
      tagId: sensors.tagId || this._generateMockTagId(),
      filterId: sensors.filterId || null,
      batchId: sensors.batchId || null,
      rssi: sensors.rssi || -50, // 信號強度
      quality: sensors.quality || 100 // 讀取品質
    };
  }

  /**
   * 快取標籤
   * @private
   */
  _cacheTag(tagData, reader) {
    this.tagCache.set(tagData.tagId, {
      ...tagData,
      location: reader.location,
      stationId: reader.stationId,
      lastSeen: new Date().toISOString()
    });
  }

  /**
   * 記錄標籤歷史
   * @private
   */
  _recordTagHistory(tagData, reader, event) {
    if (!this.tagHistory.has(tagData.tagId)) {
      this.tagHistory.set(tagData.tagId, []);
    }

    const history = this.tagHistory.get(tagData.tagId);
    history.push({
      ...tagData,
      location: reader.location,
      stationId: reader.stationId,
      event,
      timestamp: new Date().toISOString()
    });

    // 限制歷史記錄長度
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }

    this.saveToStorage();
  }

  /**
   * 判斷標籤狀態
   * @private
   */
  _determineTagStatus(history) {
    const latestRecord = history[history.length - 1];
    const lastSeenTime = new Date(latestRecord.timestamp).getTime();
    const now = Date.now();
    const hoursSinceLastSeen = (now - lastSeenTime) / (60 * 60 * 1000);

    if (hoursSinceLastSeen > 48) {
      return TAG_STATUS.LOST;
    } else if (hoursSinceLastSeen > 24) {
      return TAG_STATUS.INACTIVE;
    } else {
      return TAG_STATUS.ACTIVE;
    }
  }

  /**
   * 建立濾網旅程
   * @private
   */
  _buildFilterJourney(history) {
    const journey = [];
    let currentStation = null;
    let stationEntry = null;

    history.forEach(record => {
      if (record.stationId !== currentStation) {
        if (currentStation !== null) {
          journey.push({
            station: currentStation,
            location: stationEntry.location,
            entryTime: stationEntry.timestamp,
            exitTime: record.timestamp,
            duration: new Date(record.timestamp) - new Date(stationEntry.timestamp)
          });
        }

        currentStation = record.stationId;
        stationEntry = record;
      }
    });

    // 加入當前站點（未離開）
    if (currentStation !== null) {
      journey.push({
        station: currentStation,
        location: stationEntry.location,
        entryTime: stationEntry.timestamp,
        exitTime: null,
        duration: Date.now() - new Date(stationEntry.timestamp),
        current: true
      });
    }

    return journey;
  }

  /**
   * 計算站點停留時間
   * @private
   */
  _calculateStationDurations(history) {
    const durations = new Map();

    history.forEach((record, index) => {
      if (index < history.length - 1) {
        const nextRecord = history[index + 1];
        const duration = new Date(nextRecord.timestamp) - new Date(record.timestamp);

        if (!durations.has(record.stationId)) {
          durations.set(record.stationId, 0);
        }

        durations.set(record.stationId, durations.get(record.stationId) + duration);
      }
    });

    return Array.from(durations.entries()).map(([stationId, duration]) => ({
      stationId,
      duration
    }));
  }

  /**
   * 生成模擬標籤 ID
   * @private
   */
  _generateMockTagId() {
    return `RFID-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  /**
   * 儲存到 LocalStorage
   */
  saveToStorage() {
    const data = {
      tagHistory: Object.fromEntries(this.tagHistory),
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  /**
   * 從 LocalStorage 載入
   */
  loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  }

  /**
   * 清除所有數據
   */
  clearAll() {
    this.tagCache.clear();
    this.tagHistory.clear();
    this.saveToStorage();
  }
}

// 匯出單例
export const rfidService = new RFIDService();
