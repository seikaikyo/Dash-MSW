/**
 * OQC檢驗-AOI站點模組
 * 對應工單欄位：OQC檢驗 (AOI檢測結果)
 */

import { FormInstanceModel } from '../../utils/dataModel.js';
import { userContext } from '../../utils/userContext.js';
import { getAoiResults } from '../../utils/systemConfig.js';

export function renderOQCAOIStation(station) {
  const card = document.createElement('div');
  card.className = 'work-card';
  const currentUser = userContext.getCurrentUser();
  const aoiResults = getAoiResults();

  card.innerHTML = `
    <div class="card-header">
      <h2>🔬 OQC 檢驗 - 所羅門 AOI</h2>
      <span class="station-status status-${station.status}">閒置</span>
    </div>
    <div class="card-body">
      <div class="info-banner">
        <span class="info-icon">📌</span>
        <span class="info-text">自動光學檢測（AOI）系統整合</span>
      </div>

      <div class="scan-section">
        <label class="input-label">掃描工單條碼</label>
        <div class="scan-input-group">
          <input type="text" id="aoi-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
          <button class="btn-scan" id="btn-aoi-scan">🔍 查詢</button>
        </div>
      </div>

      <div class="work-order-details" id="aoi-details" style="display: none;">
        <div class="info-card">
          <h3 class="section-title">📋 工單資訊</h3>
          <div class="details-grid" id="aoi-basic-info"></div>
        </div>

        <div class="action-section">
          <h3 class="section-title">🔬 AOI 檢測結果</h3>
          <div class="form-grid">
            <div class="form-field full-width">
              <label>AOI 檢測結果 <span class="required">*</span></label>
              <div class="radio-group">
                ${aoiResults.map(result => `
                  <label class="radio-option">
                    <input type="radio" name="aoi-result" value="${result}" class="radio-input" required />
                    <span class="radio-label">${result}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="form-field">
              <label>檢驗人員</label>
              <input type="text" id="aoi-operator" value="${currentUser?.name || ''}" readonly />
            </div>
            <div class="form-field">
              <label>檢驗時間 <span class="required">*</span></label>
              <input type="datetime-local" id="aoi-time" required />
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-secondary" id="btn-aoi-cancel">取消</button>
            <button class="btn-primary" id="btn-aoi-complete">✓ 完成 AOI 檢測</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const scanInput = card.querySelector('#aoi-scan');
    const scanBtn = card.querySelector('#btn-aoi-scan');
    const completeBtn = card.querySelector('#btn-aoi-complete');
    const cancelBtn = card.querySelector('#btn-aoi-cancel');
    const detailsSection = card.querySelector('#aoi-details');
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

      if (!wo.data.degassingTest) {
        showAlert('此工單尚未完成釋氣檢測', 'warning');
        return;
      }

      currentWorkOrder = wo;
      displayWorkOrderDetails(wo);
      detailsSection.style.display = 'block';
    };

    function displayWorkOrderDetails(wo) {
      const basicInfo = card.querySelector('#aoi-basic-info');
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
          <span class="detail-label">釋氣檢測結果</span>
          <span class="detail-value status-success">${wo.data.degassingTest || '-'}</span>
        </div>
      `;

      if (wo.data.aoiResult) {
        const radio = card.querySelector(`input[name="aoi-result"][value="${wo.data.aoiResult}"]`);
        if (radio) radio.checked = true;
      }

      const timeInput = card.querySelector('#aoi-time');
      if (!timeInput.value) {
        timeInput.value = wo.data.inspectionTime || new Date().toISOString().slice(0, 16);
      }
    }

    completeBtn.addEventListener('click', () => {
      if (!currentWorkOrder) return;

      const selectedResult = card.querySelector('input[name="aoi-result"]:checked');
      const aoiTime = card.querySelector('#aoi-time').value;

      if (!selectedResult || !aoiTime) {
        showAlert('請填寫所有必填欄位', 'warning');
        return;
      }

      currentWorkOrder.data.aoiResult = selectedResult.value;
      currentWorkOrder.data.inspectionOperator = currentUser?.name || '';
      currentWorkOrder.data.inspectionTime = aoiTime;
      currentWorkOrder.save();

      showAlert(`AOI 檢測已完成！\n檢測結果：${selectedResult.value}`, 'success');
      resetForm();
    });

    cancelBtn.addEventListener('click', () => {
      if (confirm('確定要取消目前的操作？')) resetForm();
    });

    function resetForm() {
      scanInput.value = '';
      detailsSection.style.display = 'none';
      currentWorkOrder = null;
      card.querySelectorAll('input[name="aoi-result"]').forEach(r => r.checked = false);
      card.querySelector('#aoi-time').value = '';
    }

    scanBtn.addEventListener('click', handleScan);
    scanInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleScan();
    });
  }, 0);

  return card;
}

function showAlert(message, type = 'info') {
  const alertClass = { 'success': '✓', 'error': '✗', 'warning': '⚠', 'info': 'ℹ' };
  alert(`${alertClass[type]} ${message}`);
}
