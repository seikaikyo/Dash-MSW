/**
 * 製程站點服務層
 * 提供業務邏輯與操作介面
 */

import { stationManager, STATION_STATUS, STATION_TYPES } from './stationModel.js';

export class StationService {
  /**
   * 智能分配站點（找到最合適的可用站點）
   */
  static allocateStation(type, quantity) {
    const availableStations = stationManager.getAvailableStations(type);

    if (availableStations.length === 0) {
      throw new Error(`沒有可用的 ${STATION_TYPES[type.toUpperCase()]?.name || type} 站點`);
    }

    // 選擇負載最低的站點
    availableStations.sort((a, b) => {
      const loadRateA = a.currentLoad / a.capacity;
      const loadRateB = b.currentLoad / b.capacity;
      return loadRateA - loadRateB;
    });

    const station = availableStations[0];

    if (station.currentLoad + quantity > station.capacity) {
      throw new Error(`站點 ${station.name} 容量不足（需要: ${quantity}, 可用: ${station.capacity - station.currentLoad}）`);
    }

    return station;
  }

  /**
   * 分配工單到站點
   */
  static assignJobToStation(stationId, jobId, quantity) {
    const station = stationManager.getStation(stationId);
    if (!station) {
      throw new Error(`站點 ${stationId} 不存在`);
    }

    const job = station.assignJob(jobId, quantity);
    stationManager.saveToStorage();

    return {
      station,
      job,
      message: `工單 ${jobId} 已分配到 ${station.name}，預計完成時間: ${new Date(job.estimatedEndTime).toLocaleString('zh-TW')}`
    };
  }

  /**
   * 完成工單
   */
  static completeJob(stationId, jobId, success = true, qualityData = null) {
    const station = stationManager.getStation(stationId);
    if (!station) {
      throw new Error(`站點 ${stationId} 不存在`);
    }

    const job = station.completeJob(jobId, success);
    stationManager.saveToStorage();

    return {
      station,
      job,
      qualityData,
      message: success
        ? `工單 ${jobId} 已完成，處理 ${job.quantity} 件`
        : `工單 ${jobId} 失敗`
    };
  }

  /**
   * 設定站點維護
   */
  static setStationMaintenance(stationId, isMaintenance, reason = '') {
    const station = stationManager.getStation(stationId);
    if (!station) {
      throw new Error(`站點 ${stationId} 不存在`);
    }

    station.setMaintenance(isMaintenance);
    stationManager.saveToStorage();

    return {
      station,
      message: isMaintenance
        ? `站點 ${station.name} 已進入維護模式${reason ? ': ' + reason : ''}`
        : `站點 ${station.name} 維護完成，已恢復運行`
    };
  }

  /**
   * 暫停/恢復站點
   */
  static toggleStationPause(stationId, isPaused) {
    const station = stationManager.getStation(stationId);
    if (!station) {
      throw new Error(`站點 ${stationId} 不存在`);
    }

    station.setPaused(isPaused);
    stationManager.saveToStorage();

    return {
      station,
      message: isPaused
        ? `站點 ${station.name} 已暫停`
        : `站點 ${station.name} 已恢復運行`
    };
  }

  /**
   * 取得站點效能報告
   */
  static getStationPerformanceReport(stationId) {
    const station = stationManager.getStation(stationId);
    if (!station) {
      throw new Error(`站點 ${stationId} 不存在`);
    }

    const { metrics } = station;
    const successRate = metrics.totalProcessed > 0
      ? ((metrics.successCount / metrics.totalProcessed) * 100).toFixed(2)
      : 0;

    const failureRate = metrics.totalProcessed > 0
      ? ((metrics.failureCount / metrics.totalProcessed) * 100).toFixed(2)
      : 0;

    return {
      station: station.getSummary(),
      metrics: {
        ...metrics,
        successRate: successRate + '%',
        failureRate: failureRate + '%'
      },
      currentJobs: station.currentJobs,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 取得整體製程狀態
   */
  static getOverallProcessStatus() {
    const stats = stationManager.getStationStats();
    const typeStats = stationManager.getStatsByType();

    return {
      summary: stats,
      byType: typeStats,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 取得產能預測
   */
  static getCapacityForecast() {
    const stations = stationManager.getAllStations();
    const forecast = {};

    Object.values(STATION_TYPES).forEach(type => {
      const typeStations = stations.filter(s => s.type === type.code);
      const totalCapacity = typeStations.reduce((sum, s) => s.status !== STATION_STATUS.MAINTENANCE ? sum + s.capacity : sum, 0);
      const currentLoad = typeStations.reduce((sum, s) => sum + s.currentLoad, 0);
      const available = totalCapacity - currentLoad;

      const avgProcessTime = typeStations.length > 0
        ? typeStations.reduce((sum, s) => sum + s.processTime, 0) / typeStations.length
        : 0;

      // 預估未來 8 小時產能
      const hoursPerDay = 8;
      const estimatedDailyCapacity = totalCapacity > 0
        ? Math.floor((hoursPerDay * 60) / avgProcessTime * totalCapacity)
        : 0;

      forecast[type.code] = {
        name: type.name,
        totalCapacity,
        currentLoad,
        available,
        utilizationRate: totalCapacity > 0 ? ((currentLoad / totalCapacity) * 100).toFixed(1) + '%' : '0%',
        avgProcessTime: Math.round(avgProcessTime),
        estimatedDailyCapacity
      };
    });

    return forecast;
  }

  /**
   * 找出瓶頸站點
   */
  static findBottlenecks() {
    const typeStats = stationManager.getStatsByType();
    const bottlenecks = [];

    Object.entries(typeStats).forEach(([typeCode, stats]) => {
      const utilization = parseFloat(stats.utilization);
      if (utilization > 80) {
        bottlenecks.push({
          type: typeCode,
          name: stats.name,
          utilization: stats.utilization,
          currentLoad: stats.currentLoad,
          capacity: stats.capacity,
          severity: utilization > 95 ? 'critical' : 'warning'
        });
      }
    });

    bottlenecks.sort((a, b) => parseFloat(b.utilization) - parseFloat(a.utilization));

    return bottlenecks;
  }

  /**
   * 重新平衡工作負載
   */
  static rebalanceWorkload(type) {
    const stations = stationManager.getStationsByType(type)
      .filter(s => s.status !== STATION_STATUS.MAINTENANCE && s.status !== STATION_STATUS.ERROR);

    if (stations.length < 2) {
      return { message: '站點數量不足，無法平衡' };
    }

    const totalLoad = stations.reduce((sum, s) => sum + s.currentLoad, 0);
    const avgLoad = Math.floor(totalLoad / stations.length);

    const rebalancePlan = stations.map(s => ({
      stationId: s.id,
      name: s.name,
      currentLoad: s.currentLoad,
      targetLoad: avgLoad,
      adjustment: avgLoad - s.currentLoad
    }));

    return {
      plan: rebalancePlan,
      message: `已生成 ${STATION_TYPES[type.toUpperCase()]?.name} 負載平衡方案`
    };
  }

  /**
   * 站點健康檢查
   */
  static healthCheck() {
    const stations = stationManager.getAllStations();
    const issues = [];

    stations.forEach(station => {
      // 檢查錯誤狀態
      if (station.status === STATION_STATUS.ERROR) {
        issues.push({
          stationId: station.id,
          name: station.name,
          type: 'error',
          severity: 'critical',
          message: `站點處於錯誤狀態`
        });
      }

      // 檢查長時間維護
      if (station.status === STATION_STATUS.MAINTENANCE && station.metrics.lastMaintenanceDate) {
        const daysSinceMaintenance = Math.floor(
          (Date.now() - new Date(station.metrics.lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceMaintenance > 7) {
          issues.push({
            stationId: station.id,
            name: station.name,
            type: 'maintenance_overdue',
            severity: 'warning',
            message: `維護時間已超過 ${daysSinceMaintenance} 天`
          });
        }
      }

      // 檢查高失敗率
      const { totalProcessed, failureCount } = station.metrics;
      if (totalProcessed > 10) {
        const failureRate = (failureCount / totalProcessed) * 100;
        if (failureRate > 10) {
          issues.push({
            stationId: station.id,
            name: station.name,
            type: 'high_failure_rate',
            severity: failureRate > 20 ? 'critical' : 'warning',
            message: `失敗率過高: ${failureRate.toFixed(1)}%`
          });
        }
      }

      // 檢查超載
      if (station.currentLoad > station.capacity) {
        issues.push({
          stationId: station.id,
          name: station.name,
          type: 'overload',
          severity: 'critical',
          message: `負載超過容量 (${station.currentLoad}/${station.capacity})`
        });
      }
    });

    return {
      totalStations: stations.length,
      healthyStations: stations.length - issues.length,
      issues,
      status: issues.length === 0 ? 'healthy' : issues.some(i => i.severity === 'critical') ? 'critical' : 'warning'
    };
  }

  /**
   * 清除所有數據（測試用）
   */
  static clearAllData() {
    stationManager.clearAll();
    stationManager.generateDefaultStations();
    return { message: '製程站點數據已重置' };
  }
}

export default StationService;
