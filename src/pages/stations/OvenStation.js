/**
 * 烘箱處理站點模組
 * 對應工單欄位：烘箱站點參數
 */

import { FormInstanceModel } from '../../utils/dataModel.js';
import { userContext } from '../../utils/userContext.js';
import { getOvenIds } from '../../utils/systemConfig.js';

export function renderOvenStation(station) {
  const card = document.createElement('div');
  card.className = 'work-card';

  const currentUser = userContext.getCurrentUser();
  const ovenOptions = getOvenIds();

  card.innerHTML = `
    <div class="card-header">
      <h2>🔥 烘箱處理</h2>
      <span class="station-status status-${station.status}">閒置</span>
    </div>
    <div class="card-body">
      <div class="info-banner">
        <span class="info-icon">📌</span>
        <span class="info-text">整合研華 ECU 數據，設定烘箱溫度與時間參數</span>
      </div>

      <!-- 掃描區 -->
      <div class="scan-section">
        <label class="input-label">掃描工單條碼</label>
        <div class="scan-input-group">
          <input type="text" id="oven-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
          <button class="btn-scan" id="btn-oven-scan">🔍 查詢</button>
        </div>
      </div>

      <!-- 工單詳情區 -->
      <div class="work-order-details" id="oven-details" style="display: none;">

        <!-- 基本資訊卡片 -->
        <div class="info-card">
          <h3 class="section-title">📋 工單資訊</h3>
          <div class="details-grid" id="oven-basic-info"></div>
        </div>

        <!-- 烘箱處理表單 -->
        <div class="action-section">
          <h3 class="section-title">🔥 烘箱站點參數</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>烘箱編號 <span class="required">*</span></label>
              <select id="oven-id" required>
                <option value="">請選擇...</option>
                ${ovenOptions.map(oven => `<option value="${oven}">${oven}</option>`).join('')}
              </select>
            </div>
            <div class="form-field">
              <label>目標溫度 (°C) <span class="required">*</span></label>
              <input type="number" id="oven-target-temp" min="80" max="200" value="140" required />
              <small class="field-hint">範圍：80-200°C</small>
            </div>
            <div class="form-field">
              <label>烘烤時間 (分鐘) <span class="required">*</span></label>
              <input type="number" id="oven-baking-time" min="30" max="480" value="150" required />
              <small class="field-hint">範圍：30-480分鐘</small>
            </div>
            <div class="form-field">
              <label>開始時間 <span class="required">*</span></label>
              <input type="datetime-local" id="oven-start-time" required />
            </div>
            <div class="form-field">
              <label>完成時間</label>
              <input type="datetime-local" id="oven-end-time" />
            </div>
          </div>

          <div class="action-buttons">
            <button class="btn-secondary" id="btn-oven-cancel">取消</button>
            <button class="btn-primary" id="btn-oven-complete">✓ 完成烘箱處理</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // 綁定事件
  setTimeout(() => {
    const scanInput = card.querySelector('#oven-scan');
    const scanBtn = card.querySelector('#btn-oven-scan');
    const completeBtn = card.querySelector('#btn-oven-complete');
    const cancelBtn = card.querySelector('#btn-oven-cancel');
    const detailsSection = card.querySelector('#oven-details');

    let currentWorkOrder = null;

    // 掃描處理
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

      // 檢查是否已完成除膠
      if (!wo.data.deglueEndTime) {
        showAlert('此工單尚未完成除膠作業', 'warning');
        return;
      }

      currentWorkOrder = wo;
      displayWorkOrderDetails(wo);
      detailsSection.style.display = 'block';
    };

    // 顯示工單詳情
    function displayWorkOrderDetails(wo) {
      const basicInfo = card.querySelector('#oven-basic-info');
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
          <span class="detail-label">除膠完成時間</span>
          <span class="detail-value status-success">${wo.data.deglueEndTime ? formatDateTime(wo.data.deglueEndTime) : '-'}</span>
        </div>
      `;

      // 自動填入數據（如果已存在）
      if (wo.data.ovenId) {
        card.querySelector('#oven-id').value = wo.data.ovenId;
      }
      if (wo.data.targetTemp) {
        card.querySelector('#oven-target-temp').value = wo.data.targetTemp;
      }
      if (wo.data.bakingTime) {
        card.querySelector('#oven-baking-time').value = wo.data.bakingTime;
      }

      // 自動填入時間
      const startInput = card.querySelector('#oven-start-time');
      if (!startInput.value && !wo.data.ovenStartTime) {
        startInput.value = new Date().toISOString().slice(0, 16);
      } else if (wo.data.ovenStartTime) {
        startInput.value = wo.data.ovenStartTime;
      }

      const endInput = card.querySelector('#oven-end-time');
      if (wo.data.ovenEndTime) {
        endInput.value = wo.data.ovenEndTime;
      }
    }

    // 完成烘箱處理
    completeBtn.addEventListener('click', () => {
      if (!currentWorkOrder) return;

      const ovenId = card.querySelector('#oven-id').value;
      const targetTemp = card.querySelector('#oven-target-temp').value;
      const bakingTime = card.querySelector('#oven-baking-time').value;
      const startTime = card.querySelector('#oven-start-time').value;
      const endTime = card.querySelector('#oven-end-time').value;

      // 驗證必填欄位
      if (!ovenId || !targetTemp || !bakingTime || !startTime) {
        showAlert('請填寫所有必填欄位', 'warning');
        return;
      }

      // 驗證溫度範圍
      if (targetTemp < 80 || targetTemp > 200) {
        showAlert('目標溫度必須在 80-200°C 之間', 'warning');
        return;
      }

      // 驗證時間範圍
      if (bakingTime < 30 || bakingTime > 480) {
        showAlert('烘烤時間必須在 30-480 分鐘之間', 'warning');
        return;
      }

      // 更新工單資料
      currentWorkOrder.data.ovenId = ovenId;
      currentWorkOrder.data.targetTemp = parseInt(targetTemp);
      currentWorkOrder.data.bakingTime = parseInt(bakingTime);
      currentWorkOrder.data.ovenStartTime = startTime;
      currentWorkOrder.data.ovenEndTime = endTime || new Date().toISOString().slice(0, 16);
      currentWorkOrder.save();

      showAlert(`烘箱處理已完成！\n烘箱：${ovenId}\n溫度：${targetTemp}°C\n時間：${bakingTime}分鐘`, 'success');

      // 清空表單
      resetForm();
    });

    // 取消操作
    cancelBtn.addEventListener('click', () => {
      if (confirm('確定要取消目前的操作？')) {
        resetForm();
      }
    });

    // 重置表單
    function resetForm() {
      scanInput.value = '';
      detailsSection.style.display = 'none';
      currentWorkOrder = null;
      card.querySelector('#oven-id').value = '';
      card.querySelector('#oven-target-temp').value = '140';
      card.querySelector('#oven-baking-time').value = '150';
      card.querySelector('#oven-start-time').value = '';
      card.querySelector('#oven-end-time').value = '';
    }

    // 綁定事件
    scanBtn.addEventListener('click', handleScan);
    scanInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleScan();
    });

  }, 0);

  return card;
}

// 格式化日期時間
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

// 通知提示函數
function showAlert(message, type = 'info') {
  const alertClass = {
    'success': '✓',
    'error': '✗',
    'warning': '⚠',
    'info': 'ℹ'
  };

  alert(`${alertClass[type]} ${message}`);
}
