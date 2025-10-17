/**
 * 能源管理服務層
 * 整合 IoTEdge 數據，提供能耗分析與節能建議
 */

import { energyManager } from './energyModel.js';

export class EnergyService {
  /**
   * 開始記錄設備能耗
   */
  static startEnergyTracking(deviceId, deviceType, deviceName, workOrderNo, filterQuantity) {
    const record = energyManager.createRecord({
      deviceId,
      deviceType,
      deviceName,
      workOrderNo,
      filterQuantity,
      startTime: new Date().toISOString(),
      source: 'manual' // 未來改為 'iot-edge'
    });

    return {
      record,
      message: `已開始追蹤 ${deviceName} 能耗`
    };
  }

  /**
   * 完成能耗記錄（手動輸入）
   */
  static completeEnergyTracking(recordId, energyData) {
    const record = energyManager.completeRecord(recordId, {
      endTime: energyData.endTime || new Date().toISOString(),
      energyConsumption: energyData.energyConsumption,
      peakPower: energyData.peakPower,
      averagePower: energyData.averagePower
    });

    return {
      record,
      message: `能耗記錄已完成，總耗電：${record.energyConsumption} kWh，成本：${record.totalCost} 元`
    };
  }

  /**
   * 從 IoTEdge 同步能耗數據（模擬）
   */
  static async syncFromIoTEdge(workOrderNo) {
    // TODO: 實際整合 IoTEdge RestfulAPI
    // 目前使用模擬數據

    console.log(`正在從 IoTEdge 同步工單 ${workOrderNo} 的能耗數據...`);

    // 模擬烘箱數據
    const ovenRecord = energyManager.createRecord({
      deviceId: 'OVEN-01',
      deviceType: 'oven',
      deviceName: '烘箱-01',
      workOrderNo,
      filterQuantity: 50,
      startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3小時前
      source: 'simulation'
    });

    energyManager.completeRecord(ovenRecord.id, {
      endTime: new Date().toISOString(),
      energyConsumption: 36, // kWh
      peakPower: 15,
      averagePower: 12,
      temperature: 120
    });

    // 模擬 AOI 數據
    const aoiRecord = energyManager.createRecord({
      deviceId: 'AOI-01',
      deviceType: 'aoi',
      deviceName: '所羅門 AOI-01',
      workOrderNo,
      filterQuantity: 50,
      startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分鐘前
      source: 'simulation'
    });

    energyManager.completeRecord(aoiRecord.id, {
      endTime: new Date().toISOString(),
      energyConsumption: 1.25, // kWh
      peakPower: 3,
      averagePower: 2.5
    });

    return {
      records: [ovenRecord, aoiRecord],
      message: `已從 IoTEdge 同步 ${2} 筆能耗記錄`
    };
  }

  /**
   * 取得工單能耗報告
   */
  static getWorkOrderEnergyReport(workOrderNo) {
    const report = energyManager.calculateWorkOrderEnergy(workOrderNo);

    if (!report) {
      throw new Error(`找不到工單 ${workOrderNo} 的能耗記錄`);
    }

    // 計算效率評級
    const perFilterEnergy = parseFloat(report.perFilterEnergy);
    let grade = 'C';
    if (perFilterEnergy < 0.75) grade = 'A';
    else if (perFilterEnergy < 1.0) grade = 'B';

    return {
      ...report,
      efficiencyGrade: grade,
      recommendations: this.getWorkOrderRecommendations(report)
    };
  }

  /**
   * 取得工單節能建議
   */
  static getWorkOrderRecommendations(report) {
    const recommendations = [];

    // 烘箱能耗檢查
    if (report.breakdown.oven) {
      const ovenEnergy = parseFloat(report.breakdown.oven.energy);
      if (ovenEnergy > 40) {
        recommendations.push({
          type: 'oven',
          priority: 'high',
          message: '烘箱能耗偏高，建議檢查保溫效果與溫度設定'
        });
      }
    }

    // MAU/FFU 能耗檢查
    if (report.breakdown.mau && report.breakdown.ffu) {
      const totalFacilityEnergy = parseFloat(report.breakdown.mau.energy) +
                                  parseFloat(report.breakdown.ffu.energy);
      if (totalFacilityEnergy > 20) {
        recommendations.push({
          type: 'facility',
          priority: 'medium',
          message: '廠務設備能耗偏高，建議優化 MAU/FFU 運轉時段'
        });
      }
    }

    return recommendations;
  }

  /**
   * 取得能耗統計分析
   */
  static getEnergyAnalytics(startDate, endDate) {
    const stats = energyManager.getEnergyStatsByDeviceType(startDate, endDate);
    const anomalies = energyManager.detectAnomalies();
    const recommendations = energyManager.getEnergySavingRecommendations();

    // 計算總計
    let totalEnergy = 0;
    let totalCost = 0;
    Object.values(stats).forEach(stat => {
      totalEnergy += parseFloat(stat.totalEnergy);
      totalCost += parseFloat(stat.totalCost);
    });

    return {
      period: {
        startDate: startDate || '全部',
        endDate: endDate || '全部'
      },
      summary: {
        totalEnergy: totalEnergy.toFixed(2),
        totalCost: totalCost.toFixed(2),
        recordCount: energyManager.records.length
      },
      deviceStats: stats,
      anomalies: anomalies.slice(0, 10), // 前10個異常
      recommendations: recommendations.slice(0, 5), // 前5個建議
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 能耗對比分析（本月 vs 上月）
   */
  static getEnergyComparison() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonth = energyManager.filterRecordsByDateRange(
      thisMonthStart.toISOString(),
      now.toISOString()
    );

    const lastMonth = energyManager.filterRecordsByDateRange(
      lastMonthStart.toISOString(),
      lastMonthEnd.toISOString()
    );

    const thisMonthEnergy = thisMonth.reduce((sum, r) => sum + r.energyConsumption, 0);
    const lastMonthEnergy = lastMonth.reduce((sum, r) => sum + r.energyConsumption, 0);

    const changeRate = lastMonthEnergy > 0
      ? ((thisMonthEnergy - lastMonthEnergy) / lastMonthEnergy * 100).toFixed(2)
      : null;

    return {
      thisMonth: {
        energy: thisMonthEnergy.toFixed(2),
        records: thisMonth.length,
        cost: (thisMonthEnergy * energyManager.energyCostPerUnit).toFixed(2)
      },
      lastMonth: {
        energy: lastMonthEnergy.toFixed(2),
        records: lastMonth.length,
        cost: (lastMonthEnergy * energyManager.energyCostPerUnit).toFixed(2)
      },
      comparison: {
        energyChange: (thisMonthEnergy - lastMonthEnergy).toFixed(2),
        changeRate: changeRate ? `${changeRate}%` : 'N/A',
        trend: thisMonthEnergy > lastMonthEnergy ? 'up' : 'down'
      }
    };
  }

  /**
   * 設備能效排名
   */
  static getDeviceEfficiencyRanking() {
    const records = energyManager.getAllRecords()
      .filter(r => r.efficiency && r.endTime);

    const deviceGroups = {};
    records.forEach(r => {
      const key = `${r.deviceType}-${r.deviceId}`;
      if (!deviceGroups[key]) {
        deviceGroups[key] = {
          deviceId: r.deviceId,
          deviceType: r.deviceType,
          deviceName: r.deviceName,
          records: []
        };
      }
      deviceGroups[key].records.push(r);
    });

    const ranking = Object.values(deviceGroups).map(group => {
      const avgEfficiency = group.records.reduce(
        (sum, r, _, arr) => sum + parseFloat(r.efficiency) / arr.length,
        0
      );

      const baseline = energyManager.deviceBaselines[group.deviceType];

      return {
        deviceId: group.deviceId,
        deviceType: group.deviceType,
        deviceName: group.deviceName,
        avgEfficiency: avgEfficiency.toFixed(4),
        recordCount: group.records.length,
        baseline: baseline?.baselineEfficiency || null,
        performanceRatio: baseline
          ? ((baseline.baselineEfficiency - avgEfficiency) / baseline.baselineEfficiency * 100).toFixed(2)
          : null
      };
    });

    return ranking.sort((a, b) => parseFloat(a.avgEfficiency) - parseFloat(b.avgEfficiency));
  }

  /**
   * 更新電價
   */
  static updateEnergyCost(costPerUnit) {
    if (costPerUnit <= 0) {
      throw new Error('電價必須大於 0');
    }

    energyManager.updateEnergyCost(costPerUnit);

    return {
      energyCostPerUnit: costPerUnit,
      message: `電價已更新為 ${costPerUnit} 元/kWh`
    };
  }

  /**
   * 清除所有能耗數據（測試用）
   */
  static clearAllData() {
    energyManager.clearAll();
    return { message: '能源管理數據已清除' };
  }
}

export default EnergyService;
