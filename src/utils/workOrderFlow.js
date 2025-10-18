/**
 * 工單流程卡控管理
 * 根據製程進度判斷工單應該顯示在哪個站點
 */

/**
 * 柳營再生濾網製程順序定義
 */
export const PROCESS_FLOW = {
  DEGUM: 'degum',           // 除膠
  OVEN: 'oven',             // 烘箱
  OQC_RELEASE: 'oqc_release', // OQC 放行（脫氣測試）
  OQC_AOI: 'oqc_aoi',       // OQC AOI 檢驗
  RFID: 'rfid',             // RFID 更換
  PACKAGING: 'packaging',    // 包裝
  WAREHOUSE_IN: 'warehouse_in',  // 入庫
  WAREHOUSE_OUT: 'warehouse_out' // 出庫
};

/**
 * 判斷工單目前應該在哪個製程站點
 * @param {Object} workOrder - 工單物件
 * @returns {string} 站點代碼
 */
export function getCurrentProcessStation(workOrder) {
  const data = workOrder.data || {};

  // 1. 除膠站：還沒完成除膠
  if (!data.deglueEndTime) {
    return PROCESS_FLOW.DEGUM;
  }

  // 2. 烘箱站：已完成除膠，但還沒完成烘烤
  if (!data.ovenEndTime) {
    return PROCESS_FLOW.OVEN;
  }

  // 3. OQC 放行站：已完成烘烤，但還沒完成脫氣測試
  if (!data.degassingTest || data.degassingTest === '待檢驗') {
    return PROCESS_FLOW.OQC_RELEASE;
  }

  // 4. OQC AOI 站：已完成脫氣測試，但還沒完成 AOI 檢驗
  if (!data.aoiResult || data.aoiResult === '待檢驗') {
    return PROCESS_FLOW.OQC_AOI;
  }

  // 5. RFID 站：已完成 AOI，但還沒更換 RFID
  if (!data.rfidUpdate || data.rfidUpdate === '待更換') {
    return PROCESS_FLOW.RFID;
  }

  // 6. 包裝站：已完成 RFID，但還沒完成包裝
  if (!data.packageTime) {
    return PROCESS_FLOW.PACKAGING;
  }

  // 7. 入庫站：已完成包裝，但還沒入庫
  if (!data.inboundTime) {
    return PROCESS_FLOW.WAREHOUSE_IN;
  }

  // 8. 出庫站：已入庫，但還沒出庫
  if (!data.outboundTime) {
    return PROCESS_FLOW.WAREHOUSE_OUT;
  }

  // 已完成所有製程
  return null;
}

/**
 * 根據站點類型篩選應該顯示的工單
 * @param {Array} workOrders - 所有工單
 * @param {string} stationType - 站點類型代碼
 * @returns {Array} 篩選後的工單列表
 */
export function filterWorkOrdersByStation(workOrders, stationType) {
  return workOrders.filter(wo => {
    const currentStation = getCurrentProcessStation(wo);
    return currentStation === stationType;
  });
}

/**
 * 取得工單的製程進度百分比
 * @param {Object} workOrder - 工單物件
 * @returns {number} 進度百分比 (0-100)
 */
export function getWorkOrderProgress(workOrder) {
  const data = workOrder.data || {};
  const steps = [
    !!data.deglueEndTime,      // 除膠完成
    !!data.ovenEndTime,        // 烘烤完成
    data.degassingTest && data.degassingTest !== '待檢驗',  // 脫氣測試完成
    data.aoiResult && data.aoiResult !== '待檢驗',          // AOI 檢驗完成
    data.rfidUpdate === '已更換',  // RFID 更換完成
    !!data.packageTime,        // 包裝完成
    !!data.inboundTime,        // 入庫完成
    !!data.outboundTime        // 出庫完成
  ];

  const completedSteps = steps.filter(step => step).length;
  return Math.round((completedSteps / steps.length) * 100);
}

/**
 * 取得工單的下一個製程站點名稱
 * @param {Object} workOrder - 工單物件
 * @returns {string} 下一個站點名稱
 */
export function getNextStationName(workOrder) {
  const stationNames = {
    [PROCESS_FLOW.DEGUM]: '除膠站',
    [PROCESS_FLOW.OVEN]: '烘箱站',
    [PROCESS_FLOW.OQC_RELEASE]: 'OQC 放行站',
    [PROCESS_FLOW.OQC_AOI]: 'OQC AOI 站',
    [PROCESS_FLOW.RFID]: 'RFID 站',
    [PROCESS_FLOW.PACKAGING]: '包裝站',
    [PROCESS_FLOW.WAREHOUSE_IN]: '入庫站',
    [PROCESS_FLOW.WAREHOUSE_OUT]: '出庫站'
  };

  const currentStation = getCurrentProcessStation(workOrder);
  return currentStation ? stationNames[currentStation] : '已完成';
}
