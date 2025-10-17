/**
 * 包裝堆棧站點模組
 * 對應工單欄位：Pallet ID + 包裝時間
 */

import { FormInstanceModel } from '../../utils/dataModel.js';
import { userContext } from '../../utils/userContext.js';

export function renderPackagingStation(station) {
  const card = document.createElement('div');
  card.className = 'work-card';
  const currentUser = userContext.getCurrentUser();

  card.innerHTML = `
    <div class="card-header">
      <h2>📦 包裝堆棧</h2>
      <span class="station-status status-${station.status}">閒置</span>
    </div>
    <div class="card-body">
      <div class="info-banner">
        <span class="info-icon">📌</span>
        <span class="info-text">完成包裝並綁定 Pallet ID（一 Pallet 多濾網 ID）</span>
      </div>

      <div class="scan-section">
        <label class="input-label">掃描工單條碼</label>
        <div class="scan-input-group">
          <input type="text" id="pkg-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
          <button class="btn-scan" id="btn-pkg-scan">🔍 查詢</button>
        </div>
      </div>

      <div class="work-order-details" id="pkg-details" style="display: none;">
        <div class="info-card">
          <h3 class="section-title">📋 工單資訊</h3>
          <div class="details-grid" id="pkg-basic-info"></div>
        </div>

        <div class="action-section">
          <h3 class="section-title">📦 包裝資訊</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>Pallet ID <span class="required">*</span></label>
              <div class="input-with-button">
                <input type="text" id="pallet-id" placeholder="掃描或輸入 Pallet ID" required />
                <button class="btn-icon" id="btn-auto-pallet" title="自動生成">🎲</button>
              </div>
              <small class="field-hint">格式：PLT-批次號-XXXX</small>
            </div>
            <div class="form-field">
              <label>包裝人員</label>
              <input type="text" id="pkg-operator" value="${currentUser?.name || ''}" readonly />
            </div>
            <div class="form-field">
              <label>包裝完成時間 <span class="required">*</span></label>
              <input type="datetime-local" id="pkg-time" required />
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-secondary" id="btn-pkg-cancel">取消</button>
            <button class="btn-primary" id="btn-pkg-complete">✓ 完成包裝</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const scanInput = card.querySelector('#pkg-scan');
    const scanBtn = card.querySelector('#btn-pkg-scan');
    const completeBtn = card.querySelector('#btn-pkg-complete');
    const cancelBtn = card.querySelector('#btn-pkg-cancel');
    const autoPalletBtn = card.querySelector('#btn-auto-pallet');
    const detailsSection = card.querySelector('#pkg-details');
    let currentWorkOrder = null;

    const handleScan = () => {
      const workOrderNo = scanInput.value.trim();
      if (!workOrderNo) {
        showAlert('請輸入工單編號', 'warning');
        return;
      }

      const workOrders = FormInstanceModel.getAll();
      const wo = workOrders.find(w => w.data.workOrderNo === workOrderNo);

      if (!wo) {
        showAlert('工單不存在：' + workOrderNo, 'error');
        return;
      }

      if (!wo.data.rfidUpdate) {
        showAlert('此工單尚未完成 RFID 更換', 'warning');
        return;
      }

      currentWorkOrder = wo;
      displayWorkOrderDetails(wo);
      detailsSection.style.display = 'block';
    };

    function displayWorkOrderDetails(wo) {
      const basicInfo = card.querySelector('#pkg-basic-info');
      basicInfo.innerHTML = `
        <div class="detail-item">
          <span class="detail-label">工單編號</span>
          <span class="detail-value">${wo.data.workOrderNo || '-'}</span>
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
          <span class="detail-label">RFID 狀態</span>
          <span class="detail-value status-success">${wo.data.rfidUpdate || '-'}</span>
        </div>
      `;

      // 自動生成或填入 Pallet ID
      const palletInput = card.querySelector('#pallet-id');
      if (wo.data.palletId) {
        palletInput.value = wo.data.palletId;
      } else if (wo.data.batchNo) {
        palletInput.value = generatePalletId(wo.data.batchNo);
      }

      const timeInput = card.querySelector('#pkg-time');
      if (!timeInput.value) {
        timeInput.value = wo.data.packageTime || new Date().toISOString().slice(0, 16);
      }
    }

    // 自動生成 Pallet ID
    autoPalletBtn.addEventListener('click', () => {
      if (currentWorkOrder && currentWorkOrder.data.batchNo) {
        const palletInput = card.querySelector('#pallet-id');
        palletInput.value = generatePalletId(currentWorkOrder.data.batchNo);
      }
    });

    completeBtn.addEventListener('click', () => {
      if (!currentWorkOrder) return;

      const palletId = card.querySelector('#pallet-id').value.trim();
      const pkgTime = card.querySelector('#pkg-time').value;

      if (!palletId || !pkgTime) {
        showAlert('請填寫所有必填欄位', 'warning');
        return;
      }

      currentWorkOrder.data.palletId = palletId;
      currentWorkOrder.data.packageTime = pkgTime;
      currentWorkOrder.save();

      showAlert(`包裝已完成！\nPallet ID: ${palletId}`, 'success');
      resetForm();
    });

    cancelBtn.addEventListener('click', () => {
      if (confirm('確定要取消目前的操作？')) resetForm();
    });

    function resetForm() {
      scanInput.value = '';
      detailsSection.style.display = 'none';
      currentWorkOrder = null;
      card.querySelector('#pallet-id').value = '';
      card.querySelector('#pkg-time').value = '';
    }

    scanBtn.addEventListener('click', handleScan);
    scanInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleScan();
    });
  }, 0);

  return card;
}

function generatePalletId(batchNo) {
  const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `PLT-${batchNo}-${randomSuffix}`;
}

function showAlert(message, type = 'info') {
  const alertClass = { 'success': '✓', 'error': '✗', 'warning': '⚠', 'info': 'ℹ' };
  alert(`${alertClass[type]} ${message}`);
}
