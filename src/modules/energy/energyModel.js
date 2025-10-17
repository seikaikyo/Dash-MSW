/**
 * 能源管理系統數據模型
 * 整合研華 IoTSuite ECU 數據，監控烘箱、AOI、MAU、FFU 等設備能耗
 */

/**
 * 設備能耗記錄
 */
export class EnergyRecord {
  constructor(data = {}) {
    this.id = data.id || `ENR-${Date.now()}`;
    this.deviceId = data.deviceId; // 設備 ID
    this.deviceType = data.deviceType; // oven, aoi, mau, ffu, packaging
    this.deviceName = data.deviceName; // 設備名稱
    this.workOrderNo = data.workOrderNo; // 關聯工單號
    this.startTime = data.startTime || new Date().toISOString();
    this.endTime = data.endTime || null;
    this.energyConsumption = data.energyConsumption || 0; // kWh
    this.peakPower = data.peakPower || 0; // kW
    this.averagePower = data.averagePower || 0; // kW
    this.temperature = data.temperature || null; // °C (烘箱專用)
    this.processTime = data.processTime || 0; // 分鐘
    this.filterQuantity = data.filterQuantity || 0; // 處理濾網數量
    this.energyCostPerUnit = data.energyCostPerUnit || 0; // 單位能源成本 (元/kWh)
    this.totalCost = data.totalCost || 0; // 總成本 (元)
    this.efficiency = data.efficiency || null; // 能源效率指標
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.source = data.source || 'manual'; // iot-edge, manual, simulation
  }

  // 完成記錄並計算成本
  complete(endData) {
    this.endTime = endData.endTime || new Date().toISOString();
    this.energyConsumption = endData.energyConsumption || 0;
    this.peakPower = endData.peakPower || 0;
    this.averagePower = endData.averagePower || 0;

    // 計算總成本
    this.totalCost = (this.energyConsumption * this.energyCostPerUnit).toFixed(2);

    // 計算能源效率（每片濾網耗電）
    if (this.filterQuantity > 0) {
      this.efficiency = (this.energyConsumption / this.filterQuantity).toFixed(4);
    }

    this.updatedAt = new Date().toISOString();
  }

  // 更新溫度數據（烘箱專用）
  updateTemperature(temp) {
    this.temperature = temp;
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * 能源管理器
 */
class EnergyManager {
  constructor() {
    this.storageKey = 'msw_energy_data';
    this.defaultEnergyCost = 3.5; // 預設電價 3.5 元/kWh
    this.init();
  }

  init() {
    const data = this.loadFromStorage();
    this.records = data.records || [];
    this.energyCostPerUnit = data.energyCostPerUnit || this.defaultEnergyCost;
    this.deviceBaselines = data.deviceBaselines || this.getDefaultBaselines();
  }

  // 取得預設設備基準能耗
  getDefaultBaselines() {
    return {
      'oven': {
        baselinePower: 12, // kW
        baselineEfficiency: 0.24, // kWh/片
        targetEfficiency: 0.20 // 目標效率
      },
      'aoi': {
        baselinePower: 2.5,
        baselineEfficiency: 0.05,
        targetEfficiency: 0.04
      },
      'mau': {
        baselinePower: 15,
        baselineEfficiency: 0.30,
        targetEfficiency: 0.25
      },
      'ffu': {
        baselinePower: 8,
        baselineEfficiency: 0.16,
        targetEfficiency: 0.12
      },
      'packaging': {
        baselinePower: 3,
        baselineEfficiency: 0.06,
        targetEfficiency: 0.05
      }
    };
  }

  // 建立新能耗記錄
  createRecord(data) {
    const record = new EnergyRecord({
      ...data,
      energyCostPerUnit: this.energyCostPerUnit
    });
    this.records.push(record);
    this.saveToStorage();
    return record;
  }

  // 完成能耗記錄
  completeRecord(recordId, endData) {
    const record = this.records.find(r => r.id === recordId);
    if (!record) {
      throw new Error(`能耗記錄 ${recordId} 不存在`);
    }

    record.complete(endData);
    this.saveToStorage();
    return record;
  }

  // 取得記錄
  getRecord(recordId) {
    return this.records.find(r => r.id === recordId);
  }

  // 取得所有記錄
  getAllRecords() {
    return this.records;
  }

  // 根據工單號查詢
  getRecordsByWorkOrder(workOrderNo) {
    return this.records.filter(r => r.workOrderNo === workOrderNo);
  }

  // 根據設備類型查詢
  getRecordsByDeviceType(deviceType) {
    return this.records.filter(r => r.deviceType === deviceType);
  }

  // 計算工單總能耗與成本
  calculateWorkOrderEnergy(workOrderNo) {
    const records = this.getRecordsByWorkOrder(workOrderNo);

    if (records.length === 0) {
      return null;
    }

    const totalEnergy = records.reduce((sum, r) => sum + r.energyConsumption, 0);
    const totalCost = records.reduce((sum, r) => sum + parseFloat(r.totalCost), 0);

    const breakdown = {};
    ['oven', 'aoi', 'mau', 'ffu', 'packaging'].forEach(type => {
      const typeRecords = records.filter(r => r.deviceType === type);
      if (typeRecords.length > 0) {
        breakdown[type] = {
          energy: typeRecords.reduce((sum, r) => sum + r.energyConsumption, 0),
          cost: typeRecords.reduce((sum, r) => sum + parseFloat(r.totalCost), 0),
          count: typeRecords.length
        };
      }
    });

    return {
      workOrderNo,
      totalEnergy: totalEnergy.toFixed(2),
      totalCost: totalCost.toFixed(2),
      recordCount: records.length,
      breakdown,
      perFilterEnergy: records[0]?.filterQuantity > 0
        ? (totalEnergy / records[0].filterQuantity).toFixed(4)
        : null
    };
  }

  // 取得能耗統計（按設備類型）
  getEnergyStatsByDeviceType(startDate, endDate) {
    const filtered = this.filterRecordsByDateRange(startDate, endDate);

    const stats = {};
    ['oven', 'aoi', 'mau', 'ffu', 'packaging'].forEach(type => {
      const typeRecords = filtered.filter(r => r.deviceType === type);

      if (typeRecords.length > 0) {
        const totalEnergy = typeRecords.reduce((sum, r) => sum + r.energyConsumption, 0);
        const totalCost = typeRecords.reduce((sum, r) => sum + parseFloat(r.totalCost), 0);
        const avgEfficiency = typeRecords
          .filter(r => r.efficiency)
          .reduce((sum, r, _, arr) => sum + parseFloat(r.efficiency) / arr.length, 0);

        const baseline = this.deviceBaselines[type];

        stats[type] = {
          recordCount: typeRecords.length,
          totalEnergy: totalEnergy.toFixed(2),
          totalCost: totalCost.toFixed(2),
          avgEfficiency: avgEfficiency.toFixed(4),
          baselineEfficiency: baseline?.baselineEfficiency || null,
          targetEfficiency: baseline?.targetEfficiency || null,
          performanceRatio: baseline
            ? ((baseline.baselineEfficiency - avgEfficiency) / baseline.baselineEfficiency * 100).toFixed(2)
            : null
        };
      }
    });

    return stats;
  }

  // 能耗異常偵測
  detectAnomalies() {
    const anomalies = [];

    this.records.forEach(record => {
      if (!record.efficiency || !record.deviceType) return;

      const baseline = this.deviceBaselines[record.deviceType];
      if (!baseline) return;

      const efficiency = parseFloat(record.efficiency);
      const threshold = baseline.baselineEfficiency * 1.2; // 超過基準 20% 視為異常

      if (efficiency > threshold) {
        anomalies.push({
          recordId: record.id,
          workOrderNo: record.workOrderNo,
          deviceType: record.deviceType,
          deviceName: record.deviceName,
          efficiency,
          baseline: baseline.baselineEfficiency,
          deviation: ((efficiency - baseline.baselineEfficiency) / baseline.baselineEfficiency * 100).toFixed(2),
          severity: efficiency > threshold * 1.5 ? 'high' : 'medium',
          timestamp: record.createdAt
        });
      }
    });

    return anomalies.sort((a, b) => b.deviation - a.deviation);
  }

  // 節能建議
  getEnergySavingRecommendations() {
    const stats = this.getEnergyStatsByDeviceType();
    const recommendations = [];

    Object.entries(stats).forEach(([deviceType, stat]) => {
      const baseline = this.deviceBaselines[deviceType];
      if (!baseline) return;

      const avgEff = parseFloat(stat.avgEfficiency);
      const target = baseline.targetEfficiency;
      const current = avgEff;

      if (current > target) {
        const savingPotential = ((current - target) / current * 100).toFixed(1);
        const estimatedSaving = (parseFloat(stat.totalEnergy) * (current - target) / current).toFixed(2);

        recommendations.push({
          deviceType,
          priority: savingPotential > 15 ? 'high' : savingPotential > 10 ? 'medium' : 'low',
          currentEfficiency: current,
          targetEfficiency: target,
          savingPotential: `${savingPotential}%`,
          estimatedEnergySaving: `${estimatedSaving} kWh`,
          estimatedCostSaving: `${(estimatedSaving * this.energyCostPerUnit).toFixed(2)} 元`,
          recommendation: this.getRecommendationText(deviceType, current, target)
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });
  }

  getRecommendationText(deviceType, current, target) {
    const texts = {
      'oven': '建議檢查烘箱保溫效果，優化溫度曲線設定，減少空轉時間',
      'aoi': '建議優化 AOI 檢測流程，減少重複檢測次數，調整設備待機模式',
      'mau': '建議檢查 MAU 空調系統，優化新鮮空氣引入量，調整運轉時段',
      'ffu': '建議檢查 FFU 濾網清潔度，優化風量設定，減少非必要運轉時間',
      'packaging': '建議優化包裝線作業流程，減少設備空轉，提升批次處理效率'
    };
    return texts[deviceType] || '建議優化設備使用效率';
  }

  // 日期範圍過濾
  filterRecordsByDateRange(startDate, endDate) {
    if (!startDate && !endDate) {
      return this.records;
    }

    return this.records.filter(r => {
      const recordDate = new Date(r.createdAt);
      if (startDate && recordDate < new Date(startDate)) return false;
      if (endDate && recordDate > new Date(endDate)) return false;
      return true;
    });
  }

  // 更新電價
  updateEnergyCost(costPerUnit) {
    this.energyCostPerUnit = costPerUnit;
    this.saveToStorage();
  }

  // 儲存到 LocalStorage
  saveToStorage() {
    const data = {
      records: this.records,
      energyCostPerUnit: this.energyCostPerUnit,
      deviceBaselines: this.deviceBaselines,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // 從 LocalStorage 載入
  loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        records: parsed.records?.map(r => new EnergyRecord(r)) || [],
        energyCostPerUnit: parsed.energyCostPerUnit,
        deviceBaselines: parsed.deviceBaselines
      };
    }
    return {};
  }

  // 清除所有數據
  clearAll() {
    this.records = [];
    this.energyCostPerUnit = this.defaultEnergyCost;
    this.deviceBaselines = this.getDefaultBaselines();
    this.saveToStorage();
  }
}

// 單例模式
export const energyManager = new EnergyManager();
