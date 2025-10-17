/**
 * 製程能力分析工具函數
 * 計算 Cp, Cpk, Pp, Ppk 等製程能力指標
 */

/**
 * 計算平均值
 */
export function calculateMean(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * 計算標準差（樣本標準差）
 */
export function calculateStdDev(values) {
  if (!values || values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * 計算範圍的平均值（用於計算 Cp）
 */
export function calculateRbar(values, subgroupSize = 5) {
  if (!values || values.length < subgroupSize) return 0;

  const ranges = [];
  for (let i = 0; i <= values.length - subgroupSize; i++) {
    const subgroup = values.slice(i, i + subgroupSize);
    const range = Math.max(...subgroup) - Math.min(...subgroup);
    ranges.push(range);
  }

  return calculateMean(ranges);
}

/**
 * d2 常數表（用於從 R-bar 估計標準差）
 * key: subgroup size, value: d2 constant
 */
const D2_TABLE = {
  2: 1.128,
  3: 1.693,
  4: 2.059,
  5: 2.326,
  6: 2.534,
  7: 2.704,
  8: 2.847,
  9: 2.970,
  10: 3.078
};

/**
 * 計算製程能力指標
 * @param {Array} values - 測量值陣列
 * @param {Number} usl - 規格上限 (Upper Specification Limit)
 * @param {Number} lsl - 規格下限 (Lower Specification Limit)
 * @param {Number} subgroupSize - 子組大小（預設 5）
 * @returns {Object} 製程能力分析結果
 */
export function calculateProcessCapability(values, usl, lsl, subgroupSize = 5) {
  if (!values || values.length === 0) {
    return {
      valid: false,
      error: '沒有足夠的數據'
    };
  }

  if (usl === null || usl === undefined || lsl === null || lsl === undefined) {
    return {
      valid: false,
      error: '請設定規格上下限'
    };
  }

  if (usl <= lsl) {
    return {
      valid: false,
      error: '規格上限必須大於規格下限'
    };
  }

  // 基本統計量
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // 計算 Pp 和 Ppk（基於長期變異）
  const pp = (usl - lsl) / (6 * stdDev);
  const ppkUpper = (usl - mean) / (3 * stdDev);
  const ppkLower = (mean - lsl) / (3 * stdDev);
  const ppk = Math.min(ppkUpper, ppkLower);

  // 計算 Cp 和 Cpk（基於短期變異，使用 R-bar 方法）
  let cp = null;
  let cpk = null;
  let cpkUpper = null;
  let cpkLower = null;

  if (values.length >= subgroupSize) {
    const rBar = calculateRbar(values, subgroupSize);
    const d2 = D2_TABLE[subgroupSize] || D2_TABLE[5];
    const sigmaEstimate = rBar / d2;

    if (sigmaEstimate > 0) {
      cp = (usl - lsl) / (6 * sigmaEstimate);
      cpkUpper = (usl - mean) / (3 * sigmaEstimate);
      cpkLower = (mean - lsl) / (3 * sigmaEstimate);
      cpk = Math.min(cpkUpper, cpkLower);
    }
  }

  // 判斷製程能力等級
  const getCapabilityLevel = (index) => {
    if (index === null) return { level: 'N/A', label: '數據不足', color: 'gray' };
    if (index >= 2.0) return { level: 'A', label: '優秀', color: 'green' };
    if (index >= 1.67) return { level: 'B', label: '良好', color: 'blue' };
    if (index >= 1.33) return { level: 'C', label: '尚可', color: 'yellow' };
    if (index >= 1.0) return { level: 'D', label: '需改善', color: 'orange' };
    return { level: 'E', label: '不足', color: 'red' };
  };

  return {
    valid: true,
    // 規格資訊
    spec: {
      usl,
      lsl,
      target: (usl + lsl) / 2,
      tolerance: usl - lsl
    },
    // 基本統計
    statistics: {
      n: values.length,
      mean: Number(mean.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      min: Number(min.toFixed(4)),
      max: Number(max.toFixed(4)),
      range: Number((max - min).toFixed(4))
    },
    // 短期製程能力（Within subgroup）
    shortTerm: {
      cp: cp !== null ? Number(cp.toFixed(3)) : null,
      cpk: cpk !== null ? Number(cpk.toFixed(3)) : null,
      cpkUpper: cpkUpper !== null ? Number(cpkUpper.toFixed(3)) : null,
      cpkLower: cpkLower !== null ? Number(cpkLower.toFixed(3)) : null,
      cpLevel: getCapabilityLevel(cp),
      cpkLevel: getCapabilityLevel(cpk)
    },
    // 長期製程能力（Overall）
    longTerm: {
      pp: Number(pp.toFixed(3)),
      ppk: Number(ppk.toFixed(3)),
      ppkUpper: Number(ppkUpper.toFixed(3)),
      ppkLower: Number(ppkLower.toFixed(3)),
      ppLevel: getCapabilityLevel(pp),
      ppkLevel: getCapabilityLevel(ppk)
    },
    // 製程偏移
    shift: {
      value: Number((mean - (usl + lsl) / 2).toFixed(4)),
      percentage: Number((((mean - (usl + lsl) / 2) / (usl - lsl)) * 100).toFixed(2))
    },
    // 超規格統計
    outOfSpec: {
      aboveUSL: values.filter(v => v > usl).length,
      belowLSL: values.filter(v => v < lsl).length,
      total: values.filter(v => v > usl || v < lsl).length,
      percentage: Number(((values.filter(v => v > usl || v < lsl).length / values.length) * 100).toFixed(2))
    }
  };
}

/**
 * 生成製程能力分析建議
 */
export function getCapabilityRecommendations(analysis) {
  if (!analysis.valid) {
    return ['無法生成建議：' + analysis.error];
  }

  const recommendations = [];
  const { shortTerm, longTerm, shift, outOfSpec } = analysis;

  // Cpk 建議
  if (shortTerm.cpk !== null) {
    if (shortTerm.cpk < 1.0) {
      recommendations.push('⚠️ Cpk 小於 1.0，製程能力嚴重不足，需要立即改善');
    } else if (shortTerm.cpk < 1.33) {
      recommendations.push('⚠️ Cpk 小於 1.33，製程能力不足，建議進行改善');
    }
  }

  // Ppk 建議
  if (longTerm.ppk < 1.0) {
    recommendations.push('⚠️ Ppk 小於 1.0，長期製程變異過大，需檢討製程穩定性');
  }

  // Cp vs Cpk 比較
  if (shortTerm.cp !== null && shortTerm.cpk !== null) {
    const ratio = shortTerm.cpk / shortTerm.cp;
    if (ratio < 0.75) {
      recommendations.push('📊 Cpk 遠小於 Cp，製程存在明顯偏移，建議調整製程中心');
    }
  }

  // 製程偏移建議
  if (Math.abs(shift.percentage) > 10) {
    const direction = shift.value > 0 ? '偏高' : '偏低';
    recommendations.push(`📍 製程中心${direction} ${Math.abs(shift.percentage).toFixed(1)}%，建議進行製程中心調整`);
  }

  // 超規格建議
  if (outOfSpec.total > 0) {
    recommendations.push(`🚨 有 ${outOfSpec.total} 個數據點（${outOfSpec.percentage}%）超出規格範圍`);
    if (outOfSpec.aboveUSL > outOfSpec.belowLSL) {
      recommendations.push('   → 主要超出規格上限，建議降低製程平均值');
    } else if (outOfSpec.belowLSL > outOfSpec.aboveUSL) {
      recommendations.push('   → 主要超出規格下限，建議提高製程平均值');
    }
  }

  // 正面肯定
  if (recommendations.length === 0) {
    if (shortTerm.cpk !== null && shortTerm.cpk >= 1.67) {
      recommendations.push('✅ 製程能力良好，維持現有管制水準');
    } else if (longTerm.ppk >= 1.33) {
      recommendations.push('✅ 製程能力尚可，持續監控製程變異');
    }
  }

  return recommendations;
}
