/**
 * RFID標籤更換站點模組
 * 對應工單欄位：RFID標籤更換
 * 特殊功能：自動遞增再生次數 (R0→R1→R2...)
 */

import { FormInstanceModel } from '../../utils/dataModel.js';
import { userContext } from '../../utils/userContext.js';
import { getRfidUpdateStatus } from '../../utils/systemConfig.js';

export function renderRFIDStation(station) {
  const card = document.createElement('div');
  card.className = 'work-card';
  const currentUser = userContext.getCurrentUser();
  const rfidStatus = getRfidUpdateStatus();

  card.innerHTML = `
    <div class="card-header">
      <h2>🏷️ RFID 標籤更換</h2>
      <span class="station-status status-${station.status}">閒置</span>
    </div>
    <div class="card-body">
      <div class="info-banner">
        <span class="info-icon">📌</span>
        <span class="info-text">OQC 檢驗通過後自動更換 RFID 標籤，並自動遞增再生次數</span>
      </div>

      <div class="scan-section">
        <label class="input-label">掃描工單條碼</label>
        <div class="scan-input-group">
          <input type="text" id="rfid-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
          <button class="btn-scan" id="btn-rfid-scan">🔍 查詢</button>
        </div>
      </div>

      <div class="work-order-details" id="rfid-details" style="display: none;">
        <div class="info-card">
          <h3 class="section-title">📋 工單資訊</h3>
          <div class="details-grid" id="rfid-basic-info"></div>
        </div>

        <div class="action-section">
          <h3 class="section-title">🏷️ RFID 標籤更換</h3>
          <div class="form-grid">
            <div class="form-field full-width">
              <label>RFID 更換狀態 <span class="required">*</span></label>
              <div class="radio-group">
                ${rfidStatus.map(status => `
                  <label class="radio-option">
                    <input type="radio" name="rfid-status" value="${status}" class="radio-input" required />
                    <span class="radio-label">${status}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="form-field">
              <label>作業人員</label>
              <input type="text" id="rfid-operator" value="${currentUser?.name || ''}" readonly />
            </div>
            <div class="form-field">
              <label>完成時間 <span class="required">*</span></label>
              <input type="datetime-local" id="rfid-time" required />
            </div>
          </div>

          <div id="rfid-cycle-info" class="cycle-info-box" style="display: none;">
            <div class="cycle-icon">🔄</div>
            <div class="cycle-content">
              <div class="cycle-label">目前再生次數</div>
              <div class="cycle-current" id="current-cycle">-</div>
              <div class="cycle-arrow">→</div>
              <div class="cycle-label">更換後次數</div>
              <div class="cycle-next" id="next-cycle">-</div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-secondary" id="btn-rfid-cancel">取消</button>
            <button class="btn-primary" id="btn-rfid-complete">✓ 完成 RFID 更換</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const scanInput = card.querySelector('#rfid-scan');
    const scanBtn = card.querySelector('#btn-rfid-scan');
    const completeBtn = card.querySelector('#btn-rfid-complete');
    const cancelBtn = card.querySelector('#btn-rfid-cancel');
    const detailsSection = card.querySelector('#rfid-details');
    const cycleInfoBox = card.querySelector('#rfid-cycle-info');
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

      if (!wo.data.aoiResult) {
        showAlert('此工單尚未完成 AOI 檢測', 'warning');
        return;
      }

      currentWorkOrder = wo;
      displayWorkOrderDetails(wo);
      detailsSection.style.display = 'block';
    };

    function displayWorkOrderDetails(wo) {
      const basicInfo = card.querySelector('#rfid-basic-info');
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
          <span class="detail-label">目前再生次數</span>
          <span class="detail-value status-info">${wo.data.regenerationCycle || 'R0 (首次再生)'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">AOI 檢測結果</span>
          <span class="detail-value status-success">${wo.data.aoiResult || '-'}</span>
        </div>
      `;

      if (wo.data.rfidUpdate) {
        const radio = card.querySelector(`input[name="rfid-status"][value="${wo.data.rfidUpdate}"]`);
        if (radio) radio.checked = true;
      }

      const timeInput = card.querySelector('#rfid-time');
      if (!timeInput.value) {
        timeInput.value = new Date().toISOString().slice(0, 16);
      }
    }

    // 監聽 RFID 狀態變更，顯示再生次數預覽
    card.querySelectorAll('input[name="rfid-status"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === '已更換' && currentWorkOrder) {
          const currentCycle = currentWorkOrder.data.regenerationCycle || 'R0 (首次再生)';
          const nextCycleInfo = calculateNextCycle(currentCycle);

          card.querySelector('#current-cycle').textContent = currentCycle;
          card.querySelector('#next-cycle').textContent = nextCycleInfo;
          cycleInfoBox.style.display = 'flex';
        } else {
          cycleInfoBox.style.display = 'none';
        }
      });
    });

    completeBtn.addEventListener('click', () => {
      if (!currentWorkOrder) return;

      const selectedStatus = card.querySelector('input[name="rfid-status"]:checked');
      const rfidTime = card.querySelector('#rfid-time').value;

      if (!selectedStatus || !rfidTime) {
        showAlert('請填寫所有必填欄位', 'warning');
        return;
      }

      currentWorkOrder.data.rfidUpdate = selectedStatus.value;

      let message = 'RFID 標籤更換已完成！';

      // 如果選擇「已更換」，自動遞增再生次數
      if (selectedStatus.value === '已更換') {
        const currentCycle = currentWorkOrder.data.regenerationCycle || 'R0 (首次再生)';
        const match = currentCycle.match(/R(\d+)/);

        if (match) {
          const currentNumber = parseInt(match[1]);
          const nextNumber = currentNumber + 1;
          const nextCycleInfo = calculateNextCycle(currentCycle);

          currentWorkOrder.data.regenerationCycle = nextCycleInfo;
          message += `\n再生次數已更新：${currentCycle} → ${nextCycleInfo}`;
        }
      }

      currentWorkOrder.save();
      showAlert(message, 'success');
      resetForm();
    });

    cancelBtn.addEventListener('click', () => {
      if (confirm('確定要取消目前的操作？')) resetForm();
    });

    function resetForm() {
      scanInput.value = '';
      detailsSection.style.display = 'none';
      cycleInfoBox.style.display = 'none';
      currentWorkOrder = null;
      card.querySelectorAll('input[name="rfid-status"]').forEach(r => r.checked = false);
      card.querySelector('#rfid-time').value = '';
    }

    scanBtn.addEventListener('click', handleScan);
    scanInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleScan();
    });
  }, 0);

  return card;
}

// 計算下一個再生次數
function calculateNextCycle(currentCycle) {
  const match = currentCycle.match(/R(\d+)/);
  if (!match) return 'R1 (第二次)';

  const currentNumber = parseInt(match[1]);
  const nextNumber = currentNumber + 1;

  const descriptions = {
    1: '(第二次)',
    2: '(第三次)',
    3: '(第四次)',
    4: '(第五次)',
    5: '(第六次)',
    6: '(第七次)',
    7: '(第八次)',
    8: '(第九次)',
    9: '(第十次)'
  };

  return `R${nextNumber} ${descriptions[nextNumber] || `(第${nextNumber + 1}次)`}`;
}

function showAlert(message, type = 'info') {
  const alertClass = { 'success': '✓', 'error': '✗', 'warning': '⚠', 'info': 'ℹ' };
  alert(`${alertClass[type]} ${message}`);
}
