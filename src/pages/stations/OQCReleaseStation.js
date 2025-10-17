/**
 * OQC檢驗-釋氣站點模組
 * 對應工單欄位：OQC檢驗 (釋氣檢測)
 */

import { FormInstanceModel } from '../../utils/dataModel.js';
import { userContext } from '../../utils/userContext.js';
import { getDegassingTestResults } from '../../utils/systemConfig.js';

export function renderOQCReleaseStation(station) {
  const card = document.createElement('div');
  card.className = 'work-card';

  const currentUser = userContext.getCurrentUser();
  const testResults = getDegassingTestResults();

  card.innerHTML = `
    <div class="card-header">
      <div class="station-title-section">
        <div class="station-name">💨 OQC釋氣站點</div>
        <div class="station-subtitle">釋氣檢測</div>
      </div>
      <span class="station-status status-${station.status}">閒置</span>
    </div>
    <div class="card-body">
      <div class="info-banner">
        <span class="info-icon">📌</span>
        <span class="info-text">檢測標準：18 片抽檢 1 片</span>
      </div>

      <div class="scan-section">
        <label class="input-label">掃描工單條碼</label>
        <div class="scan-input-group">
          <input type="text" id="oqc-release-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
          <button class="btn-scan" id="btn-oqc-release-scan">🔍 查詢</button>
        </div>
      </div>

      <div class="work-order-details" id="oqc-release-details" style="display: none;">
        <div class="info-card">
          <h3 class="section-title">📋 工單資訊</h3>
          <div class="details-grid" id="oqc-release-basic-info"></div>
        </div>

        <div class="action-section">
          <h3 class="section-title">💨 釋氣檢測結果</h3>
          <div class="form-grid">
            <div class="form-field full-width">
              <label>檢測結果 <span class="required">*</span></label>
              <div class="radio-group">
                ${testResults.map(result => `
                  <label class="radio-option">
                    <input type="radio" name="degassing-result" value="${result}" class="radio-input" required />
                    <span class="radio-label">${result}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="form-field">
              <label>檢驗人員</label>
              <input type="text" id="oqc-release-operator" value="${currentUser?.name || ''}" readonly />
            </div>
            <div class="form-field">
              <label>檢驗時間 <span class="required">*</span></label>
              <input type="datetime-local" id="oqc-release-time" required />
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-secondary" id="btn-oqc-release-cancel">取消</button>
            <button class="btn-primary" id="btn-oqc-release-complete">✓ 完成檢驗</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const scanInput = card.querySelector('#oqc-release-scan');
    const scanBtn = card.querySelector('#btn-oqc-release-scan');
    const completeBtn = card.querySelector('#btn-oqc-release-complete');
    const cancelBtn = card.querySelector('#btn-oqc-release-cancel');
    const detailsSection = card.querySelector('#oqc-release-details');

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

      if (!wo.data.ovenEndTime) {
        showAlert('此工單尚未完成烘箱處理', 'warning');
        return;
      }

      currentWorkOrder = wo;
      displayWorkOrderDetails(wo);
      detailsSection.style.display = 'block';
    };

    function displayWorkOrderDetails(wo) {
      const basicInfo = card.querySelector('#oqc-release-basic-info');
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
          <span class="detail-label">烘箱完成時間</span>
          <span class="detail-value status-success">${wo.data.ovenEndTime ? formatDateTime(wo.data.ovenEndTime) : '-'}</span>
        </div>
      `;

      // 如果已有檢測結果，自動選擇
      if (wo.data.degassingTest) {
        const radio = card.querySelector(`input[name="degassing-result"][value="${wo.data.degassingTest}"]`);
        if (radio) radio.checked = true;
      }

      const timeInput = card.querySelector('#oqc-release-time');
      if (!timeInput.value && !wo.data.inspectionTime) {
        timeInput.value = new Date().toISOString().slice(0, 16);
      } else if (wo.data.inspectionTime) {
        timeInput.value = wo.data.inspectionTime;
      }
    }

    completeBtn.addEventListener('click', () => {
      if (!currentWorkOrder) return;

      const selectedResult = card.querySelector('input[name="degassing-result"]:checked');
      const inspectionTime = card.querySelector('#oqc-release-time').value;

      if (!selectedResult || !inspectionTime) {
        showAlert('請填寫所有必填欄位', 'warning');
        return;
      }

      currentWorkOrder.data.degassingTest = selectedResult.value;
      currentWorkOrder.data.inspectionOperator = currentUser?.name || '';
      currentWorkOrder.data.inspectionTime = inspectionTime;
      currentWorkOrder.save();

      showAlert(`釋氣檢測已完成！\n檢測結果：${selectedResult.value}`, 'success');
      resetForm();
    });

    cancelBtn.addEventListener('click', () => {
      if (confirm('確定要取消目前的操作？')) {
        resetForm();
      }
    });

    function resetForm() {
      scanInput.value = '';
      detailsSection.style.display = 'none';
      currentWorkOrder = null;
      const radios = card.querySelectorAll('input[name="degassing-result"]');
      radios.forEach(r => r.checked = false);
      card.querySelector('#oqc-release-time').value = '';
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
