/**
 * 站點共用工具函數
 */

/**
 * 生成基本資訊顯示HTML
 */
export function generateBasicInfoHTML(workOrder) {
  return `
    <div class="field-group-box">
      <h4 class="field-group-title">📋 基本資訊</h4>
      <div class="field-grid">
        <div class="detail-item">
          <span class="detail-label">工單編號</span>
          <span class="detail-value">${workOrder.data.workOrderNo || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">批次號</span>
          <span class="detail-value highlight">${workOrder.data.batchNo || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">來源廠別</span>
          <span class="detail-value">${workOrder.data.sourceFactory || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">濾網類型</span>
          <span class="detail-value">${workOrder.data.filterType || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">數量</span>
          <span class="detail-value highlight">${workOrder.data.quantity || 0} 片</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">再生次數</span>
          <span class="detail-value status-info">${workOrder.data.regenerationCycle || 'R0 (首次再生)'}</span>
        </div>
      </div>
    </div>

    <div class="field-group-box">
      <h4 class="field-group-title">👤 工單狀態</h4>
      <div class="field-grid">
        <div class="detail-item">
          <span class="detail-label">申請人</span>
          <span class="detail-value">${workOrder.applicant || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">部門</span>
          <span class="detail-value">${workOrder.department || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">建立時間</span>
          <span class="detail-value">${workOrder.createdAt ? formatDateTime(workOrder.createdAt) : '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">當前狀態</span>
          <span class="detail-value status-badge">${getStatusText(workOrder.status)}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * 生成製程歷程HTML（前序站點完成狀態）
 */
export function generateProcessHistoryHTML(workOrder, currentStationType) {
  let html = '<div class="field-group-box"><h4 class="field-group-title">📊 製程歷程</h4><div class="field-grid">';

  // 除膠站
  if (currentStationType !== 'degum') {
    html += `
      <div class="detail-item">
        <span class="detail-label">除膠作業</span>
        <span class="detail-value ${workOrder.data.deglueEndTime ? 'status-success' : 'status-warning'}">
          ${workOrder.data.deglueEndTime ? '✓ ' + formatDateTime(workOrder.data.deglueEndTime) : '未完成'}
        </span>
      </div>
    `;
  }

  // 烘箱處理
  if (['oqc_release', 'oqc_aoi', 'rfid', 'packaging', 'warehouse_in', 'warehouse_out'].includes(currentStationType)) {
    html += `
      <div class="detail-item">
        <span class="detail-label">烘箱處理</span>
        <span class="detail-value ${workOrder.data.ovenEndTime ? 'status-success' : 'status-warning'}">
          ${workOrder.data.ovenEndTime ? '✓ ' + formatDateTime(workOrder.data.ovenEndTime) : '未完成'}
        </span>
      </div>
      ${workOrder.data.ovenId ? `
        <div class="detail-item">
          <span class="detail-label">烘箱編號</span>
          <span class="detail-value">${workOrder.data.ovenId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">溫度/時間</span>
          <span class="detail-value">${workOrder.data.targetTemp}°C / ${workOrder.data.bakingTime}分</span>
        </div>
      ` : ''}
    `;
  }

  // OQC檢驗
  if (['rfid', 'packaging', 'warehouse_in', 'warehouse_out'].includes(currentStationType)) {
    html += `
      <div class="detail-item">
        <span class="detail-label">釋氣檢測</span>
        <span class="detail-value ${workOrder.data.degassingTest ? 'status-success' : 'status-warning'}">
          ${workOrder.data.degassingTest || '未檢測'}
        </span>
      </div>
      <div class="detail-item">
        <span class="detail-label">AOI檢測</span>
        <span class="detail-value ${workOrder.data.aoiResult ? 'status-success' : 'status-warning'}">
          ${workOrder.data.aoiResult || '未檢測'}
        </span>
      </div>
    `;
  }

  // RFID
  if (['packaging', 'warehouse_in', 'warehouse_out'].includes(currentStationType)) {
    html += `
      <div class="detail-item">
        <span class="detail-label">RFID狀態</span>
        <span class="detail-value ${workOrder.data.rfidUpdate ? 'status-success' : 'status-warning'}">
          ${workOrder.data.rfidUpdate || '未更換'}
        </span>
      </div>
    `;
  }

  // 包裝
  if (['warehouse_in', 'warehouse_out'].includes(currentStationType)) {
    html += `
      <div class="detail-item">
        <span class="detail-label">Pallet ID</span>
        <span class="detail-value highlight">${workOrder.data.palletId || '未包裝'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">包裝時間</span>
        <span class="detail-value">${workOrder.data.packageTime ? formatDateTime(workOrder.data.packageTime) : '-'}</span>
      </div>
    `;
  }

  // 入庫
  if (currentStationType === 'warehouse_out') {
    html += `
      <div class="detail-item">
        <span class="detail-label">庫位</span>
        <span class="detail-value highlight">${workOrder.data.warehouseLocation || '未入庫'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">入庫時間</span>
        <span class="detail-value">${workOrder.data.inboundTime ? formatDateTime(workOrder.data.inboundTime) : '-'}</span>
      </div>
    `;
  }

  html += '</div></div>';
  return html;
}

/**
 * 格式化日期時間
 */
export function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * 狀態文字轉換
 */
export function getStatusText(status) {
  const statusMap = {
    'pending': '待處理',
    'in_progress': '處理中',
    'completed': '已完成',
    'approved': '已核准',
    'rejected': '已拒絕'
  };
  return statusMap[status] || status;
}

/**
 * 顯示提示訊息
 */
export function showAlert(message, type = 'info') {
  const alertClass = {
    'success': '✓',
    'error': '✗',
    'warning': '⚠',
    'info': 'ℹ'
  };

  alert(`${alertClass[type]} ${message}`);
}
