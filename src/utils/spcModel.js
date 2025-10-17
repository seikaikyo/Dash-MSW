/**
 * SPC (Statistical Process Control) 數據模型
 * 管理統計製程管制相關的數據存儲和計算
 */

const STORAGE_KEY = 'rms_spc_data';
const LIMITS_KEY = 'rms_spc_limits';

export class SPCModel {
  /**
   * 獲取所有 SPC 數據點
   */
  static getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get SPC data:', error);
      return [];
    }
  }

  /**
   * 根據 ID 獲取單筆數據
   */
  static getById(id) {
    const allData = this.getAll();
    return allData.find(item => item.id === id);
  }

  /**
   * 根據配方 ID 獲取數據
   */
  static getByRecipeId(recipeId) {
    const allData = this.getAll();
    return allData.filter(item => item.recipeId === recipeId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * 根據批號獲取數據
   */
  static getByBatchNo(batchNo) {
    const allData = this.getAll();
    return allData.find(item => item.batchNo === batchNo);
  }

  /**
   * 新增 SPC 數據點
   */
  static create(data) {
    const allData = this.getAll();
    const newData = {
      id: `spc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipeId: data.recipeId,
      batchNo: data.batchNo,
      timestamp: data.timestamp || new Date().toISOString(),
      measurements: data.measurements || {},
      sampleSize: data.sampleSize || 1,
      operator: data.operator || '',
      shift: data.shift || '',
      status: data.status || 'normal',
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    allData.push(newData);
    this.save(allData);
    return newData;
  }

  /**
   * 更新 SPC 數據
   */
  static update(id, updates) {
    const allData = this.getAll();
    const index = allData.findIndex(item => item.id === id);

    if (index === -1) {
      throw new Error('SPC data not found');
    }

    allData[index] = {
      ...allData[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.save(allData);
    return allData[index];
  }

  /**
   * 刪除 SPC 數據
   */
  static delete(id) {
    const allData = this.getAll();
    const filtered = allData.filter(item => item.id !== id);
    this.save(filtered);
    return true;
  }

  /**
   * 批次新增數據
   */
  static bulkCreate(dataArray) {
    const allData = this.getAll();
    const newDataArray = dataArray.map(data => ({
      id: `spc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipeId: data.recipeId,
      batchNo: data.batchNo,
      timestamp: data.timestamp || new Date().toISOString(),
      measurements: data.measurements || {},
      sampleSize: data.sampleSize || 1,
      operator: data.operator || '',
      shift: data.shift || '',
      status: data.status || 'normal',
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    }));

    allData.push(...newDataArray);
    this.save(allData);
    return newDataArray;
  }

  /**
   * 獲取管制限設定
   */
  static getAllLimits() {
    try {
      const data = localStorage.getItem(LIMITS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get control limits:', error);
      return [];
    }
  }

  /**
   * 獲取特定配方的管制限
   */
  static getLimitsByRecipeId(recipeId) {
    const allLimits = this.getAllLimits();
    return allLimits.filter(limit => limit.recipeId === recipeId);
  }

  /**
   * 設定管制限
   */
  static setLimit(limitData) {
    const allLimits = this.getAllLimits();
    const existing = allLimits.findIndex(
      l => l.recipeId === limitData.recipeId && l.parameter === limitData.parameter
    );

    const newLimit = {
      id: limitData.id || `limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipeId: limitData.recipeId,
      parameter: limitData.parameter,
      ucl: limitData.ucl,           // Upper Control Limit
      lcl: limitData.lcl,           // Lower Control Limit
      cl: limitData.cl,             // Center Line
      usl: limitData.usl,           // Upper Specification Limit
      lsl: limitData.lsl,           // Lower Specification Limit
      target: limitData.target,     // Target Value
      createdAt: limitData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existing !== -1) {
      allLimits[existing] = newLimit;
    } else {
      allLimits.push(newLimit);
    }

    this.saveLimits(allLimits);
    return newLimit;
  }

  /**
   * 刪除管制限
   */
  static deleteLimit(id) {
    const allLimits = this.getAllLimits();
    const filtered = allLimits.filter(limit => limit.id !== id);
    this.saveLimits(filtered);
    return true;
  }

  /**
   * 計算管制限（基於歷史數據）
   */
  static calculateControlLimits(recipeId, parameter, data = null) {
    const dataPoints = data || this.getByRecipeId(recipeId);

    if (dataPoints.length < 20) {
      throw new Error('需要至少 20 筆數據才能計算管制限');
    }

    const values = dataPoints
      .map(d => d.measurements[parameter])
      .filter(v => v !== undefined && v !== null);

    if (values.length < 20) {
      throw new Error(`參數 ${parameter} 的數據不足`);
    }

    // 計算平均值和標準差
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // 使用 3-sigma 法則計算管制限
    const ucl = mean + 3 * stdDev;
    const lcl = mean - 3 * stdDev;

    return {
      cl: mean,
      ucl: ucl,
      lcl: lcl,
      stdDev: stdDev,
      sampleSize: values.length
    };
  }

  /**
   * 計算製程能力指標 Cp, Cpk
   */
  static calculateProcessCapability(recipeId, parameter, usl, lsl, target = null) {
    const dataPoints = this.getByRecipeId(recipeId);

    if (dataPoints.length < 30) {
      throw new Error('需要至少 30 筆數據才能計算製程能力');
    }

    const values = dataPoints
      .map(d => d.measurements[parameter])
      .filter(v => v !== undefined && v !== null);

    if (values.length < 30) {
      throw new Error(`參數 ${parameter} 的數據不足`);
    }

    // 計算統計值
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // 計算 Cp (Process Capability)
    const cp = (usl - lsl) / (6 * stdDev);

    // 計算 Cpk (Process Capability Index)
    const cpkUpper = (usl - mean) / (3 * stdDev);
    const cpkLower = (mean - lsl) / (3 * stdDev);
    const cpk = Math.min(cpkUpper, cpkLower);

    // 計算 Pp, Ppk (Performance indices) - 使用樣本標準差
    const sampleVariance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
    const sampleStdDev = Math.sqrt(sampleVariance);

    const pp = (usl - lsl) / (6 * sampleStdDev);
    const ppkUpper = (usl - mean) / (3 * sampleStdDev);
    const ppkLower = (mean - lsl) / (3 * sampleStdDev);
    const ppk = Math.min(ppkUpper, ppkLower);

    // 評估等級
    let grade = '';
    if (cpk >= 1.67) grade = '優秀';
    else if (cpk >= 1.33) grade = '良好';
    else if (cpk >= 1.00) grade = '尚可';
    else grade = '不足';

    return {
      mean,
      stdDev,
      cp: parseFloat(cp.toFixed(3)),
      cpk: parseFloat(cpk.toFixed(3)),
      pp: parseFloat(pp.toFixed(3)),
      ppk: parseFloat(ppk.toFixed(3)),
      grade,
      sampleSize: values.length,
      target: target || mean,
      usl,
      lsl
    };
  }

  /**
   * 檢查數據點是否超出管制限
   */
  static checkOutOfControl(value, limits) {
    if (!limits) return { status: 'unknown', message: '未設定管制限' };

    if (value > limits.ucl) {
      return { status: 'alert', message: `超出管制上限 (${limits.ucl})` };
    }

    if (value < limits.lcl) {
      return { status: 'alert', message: `低於管制下限 (${limits.lcl})` };
    }

    // 檢查是否接近管制限（在 2-sigma 範圍內但超過）
    const range = limits.ucl - limits.lcl;
    const warningThreshold = range * 0.15; // 15% 的緩衝區

    if (value > limits.ucl - warningThreshold) {
      return { status: 'warning', message: '接近管制上限' };
    }

    if (value < limits.lcl + warningThreshold) {
      return { status: 'warning', message: '接近管制下限' };
    }

    return { status: 'normal', message: '正常' };
  }

  /**
   * 檢測趨勢（連續 7 點上升或下降）
   */
  static detectTrend(values) {
    if (values.length < 7) return null;

    const recent7 = values.slice(-7);

    // 檢查連續上升
    let isIncreasing = true;
    let isDecreasing = true;

    for (let i = 1; i < recent7.length; i++) {
      if (recent7[i] <= recent7[i - 1]) isIncreasing = false;
      if (recent7[i] >= recent7[i - 1]) isDecreasing = false;
    }

    if (isIncreasing) {
      return { type: 'increasing', message: '連續 7 點上升趨勢' };
    }

    if (isDecreasing) {
      return { type: 'decreasing', message: '連續 7 點下降趨勢' };
    }

    return null;
  }

  /**
   * 檢測連續偏離中心線（連續 8 點在中心線同側）
   */
  static detectRunAboveBelowCenter(values, centerLine) {
    if (values.length < 8) return null;

    const recent8 = values.slice(-8);
    const allAbove = recent8.every(v => v > centerLine);
    const allBelow = recent8.every(v => v < centerLine);

    if (allAbove) {
      return { type: 'run_above', message: '連續 8 點高於中心線' };
    }

    if (allBelow) {
      return { type: 'run_below', message: '連續 8 點低於中心線' };
    }

    return null;
  }

  /**
   * 綜合分析數據狀態
   */
  static analyzeDataStatus(recipeId, parameter) {
    const dataPoints = this.getByRecipeId(recipeId);
    const limits = this.getLimitsByRecipeId(recipeId).find(l => l.parameter === parameter);

    if (!limits) {
      return {
        status: 'no_limits',
        message: '尚未設定管制限',
        alerts: []
      };
    }

    const values = dataPoints
      .map(d => d.measurements[parameter])
      .filter(v => v !== undefined && v !== null);

    if (values.length === 0) {
      return {
        status: 'no_data',
        message: '無數據',
        alerts: []
      };
    }

    const alerts = [];

    // 檢查最新值是否超出管制限
    const latestValue = values[values.length - 1];
    const controlCheck = this.checkOutOfControl(latestValue, limits);

    if (controlCheck.status !== 'normal') {
      alerts.push({
        type: 'control_limit',
        severity: controlCheck.status,
        message: controlCheck.message
      });
    }

    // 檢查趨勢
    const trendCheck = this.detectTrend(values);
    if (trendCheck) {
      alerts.push({
        type: 'trend',
        severity: 'warning',
        message: trendCheck.message
      });
    }

    // 檢查連續偏離
    const runCheck = this.detectRunAboveBelowCenter(values, limits.cl);
    if (runCheck) {
      alerts.push({
        type: 'run',
        severity: 'warning',
        message: runCheck.message
      });
    }

    // 判斷整體狀態
    let overallStatus = 'normal';
    if (alerts.some(a => a.severity === 'alert')) {
      overallStatus = 'alert';
    } else if (alerts.some(a => a.severity === 'warning')) {
      overallStatus = 'warning';
    }

    return {
      status: overallStatus,
      message: alerts.length > 0 ? `發現 ${alerts.length} 個異常` : '製程穩定',
      alerts,
      latestValue,
      dataCount: values.length
    };
  }

  /**
   * 儲存數據
   */
  static save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save SPC data:', error);
      throw new Error('儲存 SPC 數據失敗');
    }
  }

  /**
   * 儲存管制限
   */
  static saveLimits(limits) {
    try {
      localStorage.setItem(LIMITS_KEY, JSON.stringify(limits));
    } catch (error) {
      console.error('Failed to save control limits:', error);
      throw new Error('儲存管制限失敗');
    }
  }

  /**
   * 清空所有數據（測試用）
   */
  static clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LIMITS_KEY);
  }

  /**
   * 匯出數據
   */
  static export() {
    return {
      data: this.getAll(),
      limits: this.getAllLimits(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * 匯入數據
   */
  static import(jsonData) {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (parsed.data) {
        this.save(parsed.data);
      }

      if (parsed.limits) {
        this.saveLimits(parsed.limits);
      }

      return {
        dataCount: parsed.data?.length || 0,
        limitsCount: parsed.limits?.length || 0
      };
    } catch (error) {
      throw new Error('匯入失敗：數據格式錯誤');
    }
  }
}
