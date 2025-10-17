/**
 * 品質管控規則系統
 * 實作 IQC、釋氣抽檢、AOI檢測、重工、報廢等流程
 */

/**
 * IQC 進料檢驗：標籤缺失警示
 */
export function checkRFIDTagPresence(workOrder) {
  // 檢查是否有 RFID 標籤
  if (!workOrder.data.rfidTagId && !workOrder.data.isFirstGeneration) {
    return {
      valid: false,
      warning: '⚠️ 標籤缺失警示',
      message: '進料濾網未檢測到 RFID 標籤，請確認：\n1. 是否為首次再生（需建立新標籤）\n2. 標籤是否損壞（需補發標籤）',
      action: 'require_tag_check'
    };
  }
  return { valid: true };
}

/**
 * 釋氣抽檢流程：18抽1制度
 */
export function calculateDegassingInspection(quantity) {
  const sampleSize = Math.ceil(quantity / 18); // 18片抽1片
  return {
    totalQuantity: quantity,
    sampleSize: sampleSize,
    samplingRate: '18抽1',
    minSamples: Math.max(1, sampleSize)
  };
}

/**
 * 釋氣檢測結果判定
 */
export function evaluateDegassingResult(testResult, workOrder) {
  const result = {
    passed: false,
    action: null,
    message: '',
    nextStep: ''
  };

  switch (testResult) {
    case '合格':
    case 'OK':
      result.passed = true;
      result.message = '✓ 釋氣檢測合格';
      result.nextStep = 'proceed_to_aoi';
      break;

    case '未達標':
    case 'NG':
      // 未達標：加抽2片再測
      if (!workOrder.data.degassingRetestCount) {
        result.passed = false;
        result.action = 'retest_2_samples';
        result.message = '⚠️ 釋氣檢測未達標，需加抽2片再測';
        result.nextStep = 'retest';
      } else if (workOrder.data.degassingRetestCount === 1) {
        // 再測仍未達標：回爐重烤
        result.passed = false;
        result.action = 'return_to_oven';
        result.message = '✗ 再測仍未達標，退回烘箱重烤';
        result.nextStep = 'rework_oven';
      } else {
        // 重烤後仍不合格：報廢
        result.passed = false;
        result.action = 'scrap';
        result.message = '✗ 重烤後仍不合格，批次報廢';
        result.nextStep = 'scrap';
      }
      break;

    case '超標':
      // 超標：立即回爐重烤
      result.passed = false;
      result.action = 'return_to_oven';
      result.message = '✗ 釋氣超標，立即回爐重烤';
      result.nextStep = 'rework_oven';
      break;

    default:
      result.passed = false;
      result.message = '請選擇檢測結果';
  }

  return result;
}

/**
 * 所羅門 AOI 檢測結果判定
 */
export function evaluateAOIResult(aoiResult, aoiDefectCode = null) {
  const result = {
    passed: false,
    action: null,
    message: '',
    defectType: aoiDefectCode,
    canProceed: false
  };

  switch (aoiResult) {
    case 'OK':
    case '合格':
      result.passed = true;
      result.canProceed = true;
      result.message = '✓ AOI 檢測合格';
      break;

    case 'NG-破洞':
    case 'NG-嚴重瑕疵':
      result.passed = false;
      result.action = 'scrap';
      result.message = `✗ AOI 檢測發現${aoiResult}，直接報廢`;
      result.defectType = aoiResult;
      break;

    case 'NG-輕微瑕疵':
      result.passed = false;
      result.action = 'rework';
      result.message = '⚠️ AOI 檢測發現輕微瑕疵，需重工處理';
      result.defectType = aoiResult;
      break;

    case 'NG':
      result.passed = false;
      result.action = 'manual_review';
      result.message = '⚠️ AOI 檢測 NG，需人工複檢';
      break;

    default:
      result.message = '請選擇 AOI 檢測結果';
  }

  return result;
}

/**
 * 品質雙重檢驗閘門
 * 只有釋氣 + AOI 都合格才能進行 RFID 更換
 */
export function qualityGateCheck(workOrder) {
  const result = {
    canProceed: false,
    blockers: [],
    warnings: [],
    message: ''
  };

  // 檢查釋氣檢測
  if (!workOrder.data.degassingTest || workOrder.data.degassingTest === '未檢測') {
    result.blockers.push('未完成釋氣檢測');
  } else if (workOrder.data.degassingTest !== '合格' && workOrder.data.degassingTest !== 'OK') {
    result.blockers.push('釋氣檢測未通過');
  }

  // 檢查 AOI 檢測
  if (!workOrder.data.aoiResult || workOrder.data.aoiResult === '未檢測') {
    result.blockers.push('未完成 AOI 檢測');
  } else if (workOrder.data.aoiResult !== 'OK' && workOrder.data.aoiResult !== '合格') {
    result.blockers.push('AOI 檢測未通過');
  }

  // 判定結果
  if (result.blockers.length === 0) {
    result.canProceed = true;
    result.message = '✓ 品質雙重檢驗通過，可進行 RFID 標籤更換';
  } else {
    result.canProceed = false;
    result.message = `✗ 品質檢驗未通過：\n${result.blockers.join('\n')}`;
  }

  return result;
}

/**
 * 品保重工管理
 */
export function recordRework(workOrder, reworkType, reason) {
  if (!workOrder.data.reworkHistory) {
    workOrder.data.reworkHistory = [];
  }

  const reworkRecord = {
    timestamp: new Date().toISOString(),
    type: reworkType, // 'oven' (回爐), 'manual' (人工重工)
    reason: reason,
    originalDegassingResult: workOrder.data.degassingTest,
    originalAOIResult: workOrder.data.aoiResult,
    reworkCount: workOrder.data.reworkHistory.length + 1
  };

  workOrder.data.reworkHistory.push(reworkRecord);
  workOrder.data.isRework = true;
  workOrder.data.reworkCount = workOrder.data.reworkHistory.length;

  // 回爐批次追蹤
  if (reworkType === 'oven') {
    workOrder.data.status = 'rework_oven';
    workOrder.data.ovenEndTime = null; // 清除原烘箱完成時間
  }

  return reworkRecord;
}

/**
 * 報廢管理
 */
export function recordScrap(workOrder, scrapReason, scrapType, quantity = null) {
  const scrapRecord = {
    timestamp: new Date().toISOString(),
    workOrderNo: workOrder.data.workOrderNo,
    batchNo: workOrder.data.batchNo,
    scrapReason: scrapReason, // '破洞', '嚴重瑕疵', '重烤仍不合格', '釋氣超標'
    scrapType: scrapType, // 'aoi_defect', 'degassing_fail', 'rework_fail'
    originalQuantity: workOrder.data.quantity,
    scrapQuantity: quantity || workOrder.data.quantity,
    filterType: workOrder.data.filterType,
    regenerationCycle: workOrder.data.regenerationCycle,
    reworkCount: workOrder.data.reworkCount || 0,
    // 報廢成本分析
    costAnalysis: calculateScrapCost(workOrder, quantity)
  };

  // 更新工單狀態
  workOrder.data.status = 'scrapped';
  workOrder.data.scrapRecord = scrapRecord;
  workOrder.data.isScrapped = true;

  // 儲存到報廢記錄
  saveScrapRecord(scrapRecord);

  return scrapRecord;
}

/**
 * 計算報廢成本
 */
function calculateScrapCost(workOrder, scrapQuantity) {
  const quantity = scrapQuantity || workOrder.data.quantity;

  // 基礎成本估算（可依實際調整）
  const materialCost = quantity * 50; // 假設每片材料成本 50 元
  const processCost = quantity * 30; // 假設每片製程成本 30 元
  const energyCost = workOrder.data.ovenEnergyConsumption || 0;
  const reworkCost = (workOrder.data.reworkCount || 0) * quantity * 20;

  return {
    scrapQuantity: quantity,
    materialCost: materialCost,
    processCost: processCost,
    energyCost: energyCost,
    reworkCost: reworkCost,
    totalCost: materialCost + processCost + energyCost + reworkCost
  };
}

/**
 * 儲存報廢記錄到 localStorage
 */
function saveScrapRecord(scrapRecord) {
  const scrapRecords = JSON.parse(localStorage.getItem('scrapRecords') || '[]');
  scrapRecords.push(scrapRecord);
  localStorage.setItem('scrapRecords', JSON.stringify(scrapRecords));
}

/**
 * 取得報廢統計
 */
export function getScrapStatistics(startDate = null, endDate = null) {
  const scrapRecords = JSON.parse(localStorage.getItem('scrapRecords') || '[]');

  let filtered = scrapRecords;
  if (startDate && endDate) {
    filtered = scrapRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
    });
  }

  // 按原因分組統計
  const byReason = {};
  const byType = {};
  let totalScrapQuantity = 0;
  let totalCost = 0;

  filtered.forEach(record => {
    // 按原因統計
    if (!byReason[record.scrapReason]) {
      byReason[record.scrapReason] = { count: 0, quantity: 0, cost: 0 };
    }
    byReason[record.scrapReason].count++;
    byReason[record.scrapReason].quantity += record.scrapQuantity;
    byReason[record.scrapReason].cost += record.costAnalysis.totalCost;

    // 按類型統計
    if (!byType[record.scrapType]) {
      byType[record.scrapType] = { count: 0, quantity: 0, cost: 0 };
    }
    byType[record.scrapType].count++;
    byType[record.scrapType].quantity += record.scrapQuantity;
    byType[record.scrapType].cost += record.costAnalysis.totalCost;

    totalScrapQuantity += record.scrapQuantity;
    totalCost += record.costAnalysis.totalCost;
  });

  return {
    totalRecords: filtered.length,
    totalScrapQuantity: totalScrapQuantity,
    totalCost: totalCost,
    byReason: byReason,
    byType: byType,
    records: filtered
  };
}
