/**
 * 成品入庫站點模組
 * 對應工單欄位：倉位位置 + 入庫時間
 */

import { FormInstanceModel } from '../../utils/dataModel.js';
import { userContext } from '../../utils/userContext.js';

export function renderWarehouseInStation(station, workOrderNo = null) {
  const card = document.createElement('div');
  card.className = 'work-card';
  const currentUser = userContext.getCurrentUser();

  card.innerHTML = `
    <div class="card-header">
      <div class="station-title-section">
        <div class="station-name">📥 入庫站點</div>
        <div class="station-subtitle">成品入庫</div>
      </div>
      <span class="station-status status-${station.status}">閒置</span>
    </div>
    <div class="card-body">
      <div class="info-banner">
        <span class="info-icon">📌</span>
        <span class="info-text">WMS 智能庫位分配與入庫管理</span>
      </div>

      <div class="scan-section">
        <label class="input-label">掃描 Pallet ID 或工單條碼</label>
        <div class="scan-input-group">
          <input type="text" id="inbound-scan" class="scan-input" placeholder="請掃描 Pallet ID 或工單條碼..." autofocus />
          <button class="btn-scan" id="btn-inbound-scan">🔍 查詢</button>
        </div>
      </div>

      <div class="work-order-details" id="inbound-details" style="display: none;">
        <div class="info-card">
          <h3 class="section-title">📋 入庫資訊</h3>
          <div class="details-grid" id="inbound-basic-info"></div>
        </div>

        <div class="action-section">
          <h3 class="section-title">📥 庫位分配</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>倉位位置 <span class="required">*</span></label>
              <div class="input-with-button">
                <input type="text" id="warehouse-location" placeholder="例如: A1-01" required />
                <button class="btn-icon" id="btn-auto-location" title="智能分配">🤖</button>
              </div>
              <small class="field-hint">格式：區域行號-列號 (例如：A1-01)</small>
            </div>
            <div class="form-field">
              <label>入庫人員</label>
              <input type="text" id="inbound-operator" value="${currentUser?.name || ''}" readonly />
            </div>
            <div class="form-field">
              <label>入庫時間 <span class="required">*</span></label>
              <input type="datetime-local" id="inbound-time" required />
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-secondary" id="btn-inbound-cancel">取消</button>
            <button class="btn-primary" id="btn-inbound-complete">✓ 完成入庫</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const scanInput = card.querySelector('#inbound-scan');
    const scanBtn = card.querySelector('#btn-inbound-scan');
    const completeBtn = card.querySelector('#btn-inbound-complete');
    const cancelBtn = card.querySelector('#btn-inbound-cancel');
    const autoLocationBtn = card.querySelector('#btn-auto-location');
    const detailsSection = card.querySelector('#inbound-details');
    let currentWorkOrder = null;

    const handleScan = () => {
      const scanValue = scanInput.value.trim();
      if (!scanValue) {
        showAlert('請輸入 Pallet ID 或工單編號', 'warning');
        return;
      }

      const workOrders = FormInstanceModel.getAll();
      const wo = workOrders.find(w =>
        w.data.workOrderNo === scanValue ||
        w.data.palletId === scanValue
      );

      if (!wo) {
        showAlert('找不到對應的工單或 Pallet', 'error');
        return;
      }

      if (!wo.data.palletId) {
        showAlert('此工單尚未完成包裝', 'warning');
        return;
      }

      currentWorkOrder = wo;
      displayInboundDetails(wo);
      detailsSection.style.display = 'block';
    };

    function displayInboundDetails(wo) {
      const basicInfo = card.querySelector('#inbound-basic-info');
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
          <span class="detail-label">批次號</span>
          <span class="detail-value">${wo.data.batchNo || '-'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">數量</span>
          <span class="detail-value">${wo.data.quantity || 0} 片</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">包裝完成時間</span>
          <span class="detail-value status-success">${wo.data.packageTime ? formatDateTime(wo.data.packageTime) : '-'}</span>
        </div>
      `;

      const locationInput = card.querySelector('#warehouse-location');
      if (wo.data.warehouseLocation) {
        locationInput.value = wo.data.warehouseLocation;
      }

      const timeInput = card.querySelector('#inbound-time');
      if (!timeInput.value) {
        timeInput.value = wo.data.inboundTime || new Date().toISOString().slice(0, 16);
      }
    }

    // 智能分配庫位
    autoLocationBtn.addEventListener('click', () => {
      const locationInput = card.querySelector('#warehouse-location');
      locationInput.value = generateWarehouseLocation();
      showAlert('已自動分配庫位', 'info');
    });

    completeBtn.addEventListener('click', () => {
      if (!currentWorkOrder) return;

      const warehouseLocation = card.querySelector('#warehouse-location').value.trim();
      const inboundTime = card.querySelector('#inbound-time').value;

      if (!warehouseLocation || !inboundTime) {
        showAlert('請填寫所有必填欄位', 'warning');
        return;
      }

      currentWorkOrder.data.warehouseLocation = warehouseLocation;
      currentWorkOrder.data.inboundTime = inboundTime;
      currentWorkOrder.status = 'completed';
      currentWorkOrder.save();

      showAlert(`入庫完成！\n庫位: ${warehouseLocation}`, 'success');
      resetForm();
    });

    cancelBtn.addEventListener('click', () => {
      if (confirm('確定要取消目前的操作？')) resetForm();
    });

    function resetForm() {
      scanInput.value = '';
      detailsSection.style.display = 'none';
      currentWorkOrder = null;
      card.querySelector('#warehouse-location').value = '';
      card.querySelector('#inbound-time').value = '';
    }

    scanBtn.addEventListener('click', handleScan);
    scanInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleScan();
    });

    // 如果有傳入 workOrderNo，自動載入工單
    if (workOrderNo) {
      scanInput.value = workOrderNo;
      handleScan();
    }
  }, 0);

  return card;
}

function generateWarehouseLocation() {
  const areaCode = String.fromCharCode(65 + Math.floor(Math.random() * 5)); // A-E
  const row = Math.floor(Math.random() * 10) + 1; // 1-10
  const col = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0'); // 01-20
  return `${areaCode}${row}-${col}`;
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showAlert(message, type = 'info') {
  const alertClass = { 'success': '✓', 'error': '✗', 'warning': '⚠', 'info': 'ℹ' };
  alert(`${alertClass[type]} ${message}`);
}
