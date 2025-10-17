/**
 * 製程站點管理模型
 * 管理濾網再生製程中的各個工作站
 */

/**
 * 工作站類型定義（柳營再生濾網製程站點）
 */
export const STATION_TYPES = {
  DEGUM: { code: 'degum', name: '除膠站', icon: '🧪', color: '#06b6d4' },
  OVEN: { code: 'oven', name: '烘箱處理', icon: '🔥', color: '#f59e0b' },
  OQC_RELEASE: { code: 'oqc_release', name: 'OQC檢驗-釋氣', icon: '💨', color: '#8b5cf6' },
  OQC_AOI: { code: 'oqc_aoi', name: 'OQC檢驗-AOI', icon: '🔬', color: '#10b981' },
  RFID: { code: 'rfid', name: 'RFID標籤更換', icon: '🏷️', color: '#ec4899' },
  PACKAGING: { code: 'packaging', name: '包裝堆棧', icon: '📦', color: '#6366f1' },
  WAREHOUSE_IN: { code: 'warehouse_in', name: '成品入庫', icon: '📥', color: '#8b5cf6' },
  WAREHOUSE_OUT: { code: 'warehouse_out', name: '出庫出貨', icon: '📤', color: '#f59e0b' }
};

/**
 * 工作站狀態
 */
export const STATION_STATUS = {
  IDLE: 'idle',           // 閒置
  RUNNING: 'running',     // 運行中
  PAUSED: 'paused',       // 暫停
  MAINTENANCE: 'maintenance', // 維護中
  ERROR: 'error'          // 故障
};

/**
 * 工作站數據結構
 */
export class Station {
  constructor(data = {}) {
    this.id = data.id || `STN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    this.name = data.name || '';
    this.type = data.type || 'cleaning';
    this.location = data.location || ''; // 實體位置
    this.status = data.status || STATION_STATUS.IDLE;
    this.capacity = data.capacity || 10; // 容量（可同時處理的濾網數）
    this.currentLoad = data.currentLoad || 0; // 當前負載
    this.equipmentId = data.equipmentId || null; // 關聯的設備 ID
    this.processTime = data.processTime || 60; // 標準處理時間（分鐘）
    this.qualityCheckRequired = data.qualityCheckRequired !== false; // 是否需要品質檢查
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();

    // 效能指標
    this.metrics = data.metrics || {
      totalProcessed: 0,      // 總處理量
      successCount: 0,        // 成功數
      failureCount: 0,        // 失敗數
      averageTime: 0,         // 平均處理時間
      utilizationRate: 0,     // 使用率
      lastMaintenanceDate: null
    };

    // 當前工單列表
    this.currentJobs = data.currentJobs || [];
  }

  /**
   * 檢查站點是否可用
   */
  isAvailable() {
    return this.status === STATION_STATUS.IDLE &&
           this.currentLoad < this.capacity;
  }

  /**
   * 分配工單到站點
   */
  assignJob(jobId, quantity) {
    if (!this.isAvailable()) {
      throw new Error(`工作站 ${this.name} 目前不可用`);
    }

    if (this.currentLoad + quantity > this.capacity) {
      throw new Error(`工作站 ${this.name} 容量不足`);
    }

    const job = {
      jobId,
      quantity,
      startTime: new Date().toISOString(),
      estimatedEndTime: this.calculateEndTime(quantity),
      status: 'processing'
    };

    this.currentJobs.push(job);
    this.currentLoad += quantity;
    this.status = STATION_STATUS.RUNNING;
    this.updatedAt = new Date().toISOString();

    return job;
  }

  /**
   * 完成工單
   */
  completeJob(jobId, success = true) {
    const jobIndex = this.currentJobs.findIndex(j => j.jobId === jobId);
    if (jobIndex === -1) {
      throw new Error(`找不到工單 ${jobId}`);
    }

    const job = this.currentJobs[jobIndex];
    job.endTime = new Date().toISOString();
    job.status = success ? 'completed' : 'failed';

    // 更新負載
    this.currentLoad -= job.quantity;
    this.currentJobs.splice(jobIndex, 1);

    // 更新指標
    this.metrics.totalProcessed += job.quantity;
    if (success) {
      this.metrics.successCount += job.quantity;
    } else {
      this.metrics.failureCount += job.quantity;
    }

    // 更新狀態
    if (this.currentJobs.length === 0) {
      this.status = STATION_STATUS.IDLE;
    }

    this.updatedAt = new Date().toISOString();
    return job;
  }

  /**
   * 計算預計完成時間
   */
  calculateEndTime(quantity) {
    const totalMinutes = (quantity / this.capacity) * this.processTime;
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + totalMinutes);
    return endTime.toISOString();
  }

  /**
   * 設定維護狀態
   */
  setMaintenance(isMaintenance) {
    if (isMaintenance) {
      if (this.currentJobs.length > 0) {
        throw new Error(`工作站 ${this.name} 有進行中的工單，無法進入維護`);
      }
      this.status = STATION_STATUS.MAINTENANCE;
      this.metrics.lastMaintenanceDate = new Date().toISOString();
    } else {
      this.status = STATION_STATUS.IDLE;
    }
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 暫停/恢復
   */
  setPaused(isPaused) {
    if (isPaused && this.status === STATION_STATUS.RUNNING) {
      this.status = STATION_STATUS.PAUSED;
    } else if (!isPaused && this.status === STATION_STATUS.PAUSED) {
      this.status = STATION_STATUS.RUNNING;
    }
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 計算使用率
   */
  calculateUtilization() {
    return ((this.currentLoad / this.capacity) * 100).toFixed(1);
  }

  /**
   * 取得站點資訊摘要
   */
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      currentLoad: this.currentLoad,
      capacity: this.capacity,
      utilization: this.calculateUtilization() + '%',
      activeJobs: this.currentJobs.length
    };
  }
}

/**
 * 製程站點管理器
 */
class StationManager {
  constructor() {
    this.storageKey = 'msw_station_data';
    this.init();
  }

  init() {
    const data = this.loadFromStorage();
    this.stations = data.stations || [];

    // 如果沒有站點，生成預設站點
    if (this.stations.length === 0) {
      this.generateDefaultStations();
    }
  }

  /**
   * 生成預設站點配置（柳營再生濾網製程）
   */
  generateDefaultStations() {
    const defaultStations = [
      {
        name: '除膠站',
        type: STATION_TYPES.DEGUM.code,
        location: '除膠區',
        capacity: 50,
        processTime: 60,
        qualityCheckRequired: false
      },
      {
        name: '烘箱處理',
        type: STATION_TYPES.OVEN.code,
        location: '烘箱區',
        capacity: 40,
        processTime: 180,
        qualityCheckRequired: false
      },
      {
        name: 'OQC檢驗-釋氣',
        type: STATION_TYPES.OQC_RELEASE.code,
        location: '檢驗區',
        capacity: 18,
        processTime: 30,
        qualityCheckRequired: true
      },
      {
        name: 'OQC檢驗-AOI',
        type: STATION_TYPES.OQC_AOI.code,
        location: '檢驗區',
        capacity: 30,
        processTime: 15,
        qualityCheckRequired: true
      },
      {
        name: 'RFID標籤更換',
        type: STATION_TYPES.RFID.code,
        location: 'RFID區',
        capacity: 100,
        processTime: 5,
        qualityCheckRequired: false
      },
      {
        name: '包裝堆棧',
        type: STATION_TYPES.PACKAGING.code,
        location: '包裝區',
        capacity: 200,
        processTime: 10,
        qualityCheckRequired: false
      },
      {
        name: '成品入庫',
        type: STATION_TYPES.WAREHOUSE_IN.code,
        location: '成品倉',
        capacity: 500,
        processTime: 5,
        qualityCheckRequired: false
      },
      {
        name: '出庫出貨',
        type: STATION_TYPES.WAREHOUSE_OUT.code,
        location: '出貨區',
        capacity: 500,
        processTime: 10,
        qualityCheckRequired: false
      }
    ];

    this.stations = defaultStations.map(config => new Station(config));
    this.saveToStorage();
  }

  /**
   * 建立新站點
   */
  createStation(data) {
    const station = new Station(data);
    this.stations.push(station);
    this.saveToStorage();
    return station;
  }

  /**
   * 取得站點
   */
  getStation(stationId) {
    return this.stations.find(s => s.id === stationId);
  }

  /**
   * 取得所有站點
   */
  getAllStations() {
    return this.stations;
  }

  /**
   * 依類型取得站點
   */
  getStationsByType(type) {
    return this.stations.filter(s => s.type === type);
  }

  /**
   * 取得可用站點
   */
  getAvailableStations(type = null) {
    let stations = this.stations.filter(s => s.isAvailable());
    if (type) {
      stations = stations.filter(s => s.type === type);
    }
    return stations;
  }

  /**
   * 更新站點
   */
  updateStation(stationId, updates) {
    const station = this.getStation(stationId);
    if (!station) {
      throw new Error(`站點 ${stationId} 不存在`);
    }

    Object.assign(station, updates);
    station.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return station;
  }

  /**
   * 刪除站點
   */
  deleteStation(stationId) {
    const station = this.getStation(stationId);
    if (!station) {
      throw new Error(`站點 ${stationId} 不存在`);
    }

    if (station.currentJobs.length > 0) {
      throw new Error(`站點 ${station.name} 有進行中的工單，無法刪除`);
    }

    const index = this.stations.findIndex(s => s.id === stationId);
    this.stations.splice(index, 1);
    this.saveToStorage();
  }

  /**
   * 取得站點統計
   */
  getStationStats() {
    const total = this.stations.length;
    const idle = this.stations.filter(s => s.status === STATION_STATUS.IDLE).length;
    const running = this.stations.filter(s => s.status === STATION_STATUS.RUNNING).length;
    const paused = this.stations.filter(s => s.status === STATION_STATUS.PAUSED).length;
    const maintenance = this.stations.filter(s => s.status === STATION_STATUS.MAINTENANCE).length;
    const error = this.stations.filter(s => s.status === STATION_STATUS.ERROR).length;

    const totalCapacity = this.stations.reduce((sum, s) => sum + s.capacity, 0);
    const totalLoad = this.stations.reduce((sum, s) => sum + s.currentLoad, 0);
    const overallUtilization = totalCapacity > 0 ? ((totalLoad / totalCapacity) * 100).toFixed(1) : 0;

    const totalProcessed = this.stations.reduce((sum, s) => sum + s.metrics.totalProcessed, 0);
    const totalSuccess = this.stations.reduce((sum, s) => sum + s.metrics.successCount, 0);
    const totalFailure = this.stations.reduce((sum, s) => sum + s.metrics.failureCount, 0);

    return {
      total,
      byStatus: { idle, running, paused, maintenance, error },
      capacity: { total: totalCapacity, current: totalLoad, utilization: overallUtilization + '%' },
      performance: {
        totalProcessed,
        successCount: totalSuccess,
        failureCount: totalFailure,
        successRate: totalProcessed > 0 ? ((totalSuccess / totalProcessed) * 100).toFixed(1) + '%' : '0%'
      }
    };
  }

  /**
   * 按類型分組統計
   */
  getStatsByType() {
    const typeStats = {};

    Object.values(STATION_TYPES).forEach(type => {
      const stations = this.getStationsByType(type.code);
      const totalCapacity = stations.reduce((sum, s) => sum + s.capacity, 0);
      const totalLoad = stations.reduce((sum, s) => sum + s.currentLoad, 0);
      const running = stations.filter(s => s.status === STATION_STATUS.RUNNING).length;

      typeStats[type.code] = {
        name: type.name,
        icon: type.icon,
        color: type.color,
        count: stations.length,
        running,
        capacity: totalCapacity,
        currentLoad: totalLoad,
        utilization: totalCapacity > 0 ? ((totalLoad / totalCapacity) * 100).toFixed(1) + '%' : '0%'
      };
    });

    return typeStats;
  }

  /**
   * 儲存到 LocalStorage
   */
  saveToStorage() {
    const data = {
      stations: this.stations,
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
      const parsed = JSON.parse(data);
      return {
        stations: parsed.stations.map(s => new Station(s))
      };
    }
    return {};
  }

  /**
   * 清除所有數據
   */
  clearAll() {
    this.stations = [];
    this.saveToStorage();
  }
}

// 單例模式
export const stationManager = new StationManager();
