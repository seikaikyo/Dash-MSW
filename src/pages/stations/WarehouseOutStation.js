/**
 * 出庫出貨站點模組
 * 對應工單欄位：客戶訂單號 + 出庫時間
 */

import { FormInstanceModel } from '../../utils/dataModel.js';
import { userContext } from '../../utils/userContext.js';

export function renderWarehouseOutStation(station) {
  const card = document.createElement('div');
  card.className = 'work-card';
  const currentUser = userContext.getCurrentUser();

  card.innerHTML = `
    <div class="card-header">
      <h2>📤 出庫出貨</h2>
      <span class="station-status status-${station.status}">閒置</span>
    </div>
    <div class="card-body">
      <div class="info-banner">
        <span class="info-icon">📌</span>
        <span class="info-text">客戶訂單對應與出貨管理</span>
      </div>

      <div class="scan-section">
        <label class="input-label">掃描 Pallet ID 或庫位條碼</label>
        <div class="scan-input-group">
          <input type="text" id="outbound-scan" class="scan-input" placeholder="請掃描 Pallet ID 或庫位條碼..." autofocus />
          <button class="btn-scan" id="btn-outbound-scan">🔍 查詢</button>
        </div>
      </div>

      <div class="work-order-details" id="outbound-details" style="display: none;">
        <div class="info-card">
          <h3 class="section-title">📋 出貨資訊</h3>
          <div class="details-grid" id="outbound-basic-info"></div>
        </div>

        <div class="action-section">
          <h3 class="section-title">📤 出貨記錄</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>客戶訂單號 <span class="required">*</span></label>
              <input type="text" id="customer-order-no" placeholder="輸入客戶訂單號" required />
              <small class="field-hint">格式：CO-YYYYMMDD-XXXX</small>
            </div>
            <div class="form-field">
              <label>出貨人員</label>
              <input type="text" id="outbound-operator" value="${currentUser?.name || ''}" readonly />
            </div>
            <div class="form-field">
              <label>出庫時間 <span class="required">*</span></label>
              <input type="datetime-local" id="outbound-time" required />
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-secondary" id="btn-outbound-cancel">取消</button>
            <button class="btn-primary" id="btn-outbound-complete">✓ 完成出庫</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const scanInput = card.querySelector('#outbound-scan');
    const scanBtn = card.querySelector('#btn-outbound-scan');
    const completeBtn = card.querySelector('#btn-outbound-complete');
    const cancelBtn = card.querySelector('#btn-outbound-cancel');
    const detailsSection = card.querySelector('#outbound-details');
    let currentWorkOrder = null;

    const handleScan = () => {
      const scanValue = scanInput.value.trim();
      if (!scanValue) {
        showAlert('請輸入 Pallet ID 或庫位條碼', 'warning');
        return;
      }

      const workOrders = FormInstanceModel.getAll();
      const wo = workOrders.find(w =>
        w.data.palletId === scanValue ||
        w.data.warehouseLocation === scanValue
      );

      if (!wo) {
        showAlert('找不到對應的庫存', 'error');
        return;
      }

      if (!wo.data.warehouseLocation) {
        showAlert('此批次尚未入庫，無法出貨', 'warning');
        return;
      }

      currentWorkOrder = wo;
      displayOutboundDetails(wo);
      detailsSection.style.display = 'block';
    };

    function displayOutboundDetails(wo) {
      const basicInfo = card.querySelector('#outbound-basic-info');
      basicInfo.innerHTML = `
        <div class="detail-item">
          <span class="detail-label">工單編號</span>
          <span class="detail-value">${wo.data.workOrderNo || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Pallet ID</span>
          <span class="detail-value status-info">${wo.data.palletId || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">庫位</span>
          <span class="detail-value status-success">${wo.data.warehouseLocation || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">批次號</span>
          <span class="detail-value">${wo.data.batchNo || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">數量</span>
          <span class="detail-value">${wo.data.quantity || 0} 片</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">入庫時間</span>
          <span class="detail-value">${wo.data.inboundTime ? formatDateTime(wo.data.inboundTime) : '-'}</span>
        </div>
      `;

      const orderNoInput = card.querySelector('#customer-order-no');
      if (wo.data.customerOrderNo) {
        orderNoInput.value = wo.data.customerOrderNo;
      }

      const timeInput = card.querySelector('#outbound-time');
      if (!timeInput.value) {
        timeInput.value = wo.data.outboundTime || new Date().toISOString().slice(0, 16);
      }
    }

    completeBtn.addEventListener('click', () => {
      if (!currentWorkOrder) return;

      const customerOrderNo = card.querySelector('#customer-order-no').value.trim();
      const outboundTime = card.querySelector('#outbound-time').value;

      if (!customerOrderNo || !outboundTime) {
        showAlert('請填寫所有必填欄位', 'warning');
        return;
      }

      currentWorkOrder.data.customerOrderNo = customerOrderNo;
      currentWorkOrder.data.outboundTime = outboundTime;
      currentWorkOrder.status = 'approved';
      currentWorkOrder.save();

      showAlert(`出庫完成！\n客戶訂單: ${customerOrderNo}\nPallet ID: ${currentWorkOrder.data.palletId}`, 'success');
      resetForm();
    });

    cancelBtn.addEventListener('click', () => {
      if (confirm('確定要取消目前的操作？')) resetForm();
    });

    function resetForm() {
      scanInput.value = '';
      detailsSection.style.display = 'none';
      currentWorkOrder = null;
      card.querySelector('#customer-order-no').value = '';
      card.querySelector('#outbound-time').value = '';
    }

    scanBtn.addEventListener('click', handleScan);
    scanInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleScan();
    });
  }, 0);

  return card;
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function showAlert(message, type = 'info') {
  const alertClass = { 'success': '✓', 'error': '✗', 'warning': '⚠', 'info': 'ℹ' };
  alert(`${alertClass[type]} ${message}`);
}
