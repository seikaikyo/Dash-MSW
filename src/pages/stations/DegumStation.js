/**
 * 除膠站點模組
 * 對應工單欄位：基本資訊 + 除膠站點參數
 */

import { FormInstanceModel } from '../../utils/dataModel.js';
import { userContext } from '../../utils/userContext.js';
import { generateBasicInfoHTML, showAlert } from './stationUtils.js';
import { isWorkOrderLocked, lockFormFields, createChangeRequest } from '../../utils/workOrderLock.js';

export function renderDegumStation(station, workOrderNo = null) {
  const card = document.createElement('div');
  card.className = 'work-card';

  const currentUser = userContext.getCurrentUser();

  card.innerHTML = `
    <div class="card-header">
      <h2>🧪 除膠作業</h2>
      <span class="station-status status-${station.status}">閒置</span>
    </div>
    <div class="card-body">
      <div class="info-banner">
        <span class="info-icon">📌</span>
        <span class="info-text">掃描工單條碼，填寫基本資訊並記錄除膠作業時間</span>
      </div>

      <!-- 掃描區 -->
      <div class="scan-section">
        <label class="input-label">掃描工單條碼</label>
        <div class="scan-input-group">
          <input type="text" id="degum-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
          <button class="btn-scan" id="btn-degum-scan">🔍 查詢</button>
        </div>
      </div>

      <!-- 工單詳情區 -->
      <div class="work-order-details" id="degum-details" style="display: none;">

        <!-- 基本資訊（可編輯） -->
        <div class="info-card">
          <h3 class="section-title">📋 基本資訊</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>工單編號 <span class="required">*</span></label>
              <input type="text" id="work-order-no" required readonly />
            </div>
            <div class="form-field">
              <label>批次號 <span class="required">*</span></label>
              <input type="text" id="batch-no" required />
            </div>
            <div class="form-field full-width">
              <label>來源廠別 <span class="required">*</span></label>
              <div class="radio-group" id="source-factory-group">
                <label class="radio-option">
                  <input type="radio" name="source-factory" value="柳營廠" class="radio-input" required />
                  <span class="radio-label">柳營廠</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="source-factory" value="台南廠" class="radio-input" />
                  <span class="radio-label">台南廠</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="source-factory" value="高雄廠" class="radio-input" />
                  <span class="radio-label">高雄廠</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="source-factory" value="其他" class="radio-input" />
                  <span class="radio-label">其他</span>
                </label>
              </div>
            </div>
            <div class="form-field full-width">
              <label>濾網類型 <span class="required">*</span></label>
              <div class="radio-group" id="filter-type-group">
                <label class="radio-option">
                  <input type="radio" name="filter-type" value="活性碳濾網" class="radio-input" required />
                  <span class="radio-label">活性碳濾網</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="filter-type" value="化學濾網" class="radio-input" />
                  <span class="radio-label">化學濾網</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="filter-type" value="複合濾網" class="radio-input" />
                  <span class="radio-label">複合濾網</span>
                </label>
              </div>
            </div>
            <div class="form-field">
              <label>數量 (片) <span class="required">*</span></label>
              <input type="number" id="quantity" min="1" required />
            </div>
            <div class="form-field full-width">
              <label>再生次數 <span class="required">*</span></label>
              <div class="radio-group" id="regeneration-cycle-group">
                <label class="radio-option">
                  <input type="radio" name="regeneration-cycle" value="R0 (首次再生)" class="radio-input" required />
                  <span class="radio-label">R0 (首次再生)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="regeneration-cycle" value="R1 (第二次)" class="radio-input" />
                  <span class="radio-label">R1 (第二次)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="regeneration-cycle" value="R2 (第三次)" class="radio-input" />
                  <span class="radio-label">R2 (第三次)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="regeneration-cycle" value="R3 (第四次)" class="radio-input" />
                  <span class="radio-label">R3 (第四次)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="regeneration-cycle" value="R4 (第五次)" class="radio-input" />
                  <span class="radio-label">R4 (第五次)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="regeneration-cycle" value="R5 (第六次)" class="radio-input" />
                  <span class="radio-label">R5 (第六次)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="regeneration-cycle" value="R6 (第七次)" class="radio-input" />
                  <span class="radio-label">R6 (第七次)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="regeneration-cycle" value="R7 (第八次)" class="radio-input" />
                  <span class="radio-label">R7 (第八次)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="regeneration-cycle" value="R8 (第九次)" class="radio-input" />
                  <span class="radio-label">R8 (第九次)</span>
                </label>
                <label class="radio-option">
                  <input type="radio" name="regeneration-cycle" value="R9 (第十次)" class="radio-input" />
                  <span class="radio-label">R9 (第十次)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 除膠站點參數 -->
        <div class="info-card">
          <h3 class="section-title">🧪 除膠站點</h3>
          <div class="form-grid">
            <div class="form-field">
              <label>作業人員 <span class="required">*</span></label>
              <input type="text" id="degum-operator" value="${currentUser?.name || ''}" required readonly />
            </div>
            <div class="form-field">
              <label>開始時間 <span class="required">*</span></label>
              <input type="datetime-local" id="degum-start-time" required />
            </div>
            <div class="form-field">
              <label>完成時間</label>
              <input type="datetime-local" id="degum-end-time" />
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-secondary" id="btn-degum-cancel">取消</button>
          <button class="btn-primary" id="btn-degum-complete">✓ 儲存並完成</button>
        </div>
      </div>
    </div>
  `;

  // 綁定事件
  setTimeout(() => {
    const scanInput = card.querySelector('#degum-scan');
    const scanBtn = card.querySelector('#btn-degum-scan');
    const completeBtn = card.querySelector('#btn-degum-complete');
    const cancelBtn = card.querySelector('#btn-degum-cancel');
    const detailsSection = card.querySelector('#degum-details');

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

      currentWorkOrder = wo;
      displayWorkOrderDetails(wo);
      detailsSection.style.display = 'block';

      // 檢查工單是否已鎖定
      if (isWorkOrderLocked(wo)) {
        lockFormFields(card, wo);

        // 綁定申請變更按鈕
        setTimeout(() => {
          const unlockBtn = card.querySelector('#btn-request-unlock');
          if (unlockBtn) {
            unlockBtn.addEventListener('click', () => {
              showChangeRequestDialog(wo);
            });
          }
        }, 100);
      }
    };

    // 顯示異動申請對話框
    function showChangeRequestDialog(wo) {
      const currentUser = userContext.getCurrentUser();

      // 建立對話框
      const dialog = document.createElement('div');
      dialog.className = 'modal-overlay';
      dialog.innerHTML = `
        <div class="modal-container">
          <div class="modal-header">
            <h3>🔓 申請工單異動</h3>
            <button class="btn-close" id="btn-close-dialog">✕</button>
          </div>
          <div class="modal-body">
            <div class="dialog-info">
              <p><strong>工單編號：</strong>${wo.data.workOrderNo}</p>
              <p><strong>批次號：</strong>${wo.data.batchNo}</p>
              <p class="warning-text">⚠️ 此工單已完成並鎖定，需經組長審核才能變更</p>
            </div>

            <div class="form-section">
              <label class="form-label">異動原因 <span class="required">*</span></label>
              <textarea id="change-reason" class="form-textarea" rows="3" placeholder="請詳細說明需要變更的原因..." required></textarea>
            </div>

            <div class="form-section">
              <label class="form-label">需要變更的欄位</label>
              <div class="change-fields">
                <label class="checkbox-option">
                  <input type="checkbox" name="change-field" value="batchNo" />
                  <span>批次號</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" name="change-field" value="sourceFactory" />
                  <span>來源廠別</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" name="change-field" value="filterType" />
                  <span>濾網類型</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" name="change-field" value="quantity" />
                  <span>數量</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" name="change-field" value="regenerationCycle" />
                  <span>再生次數</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" name="change-field" value="deglueStartTime" />
                  <span>除膠開始時間</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" name="change-field" value="deglueEndTime" />
                  <span>除膠完成時間</span>
                </label>
              </div>
            </div>

            <div id="change-inputs-container"></div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="btn-cancel-change">取消</button>
            <button class="btn-primary" id="btn-submit-change">提交申請</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      // 綁定欄位選擇事件
      const checkboxes = dialog.querySelectorAll('input[name="change-field"]');
      const inputsContainer = dialog.querySelector('#change-inputs-container');

      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          updateChangeInputs();
        });
      });

      function updateChangeInputs() {
        const selectedFields = Array.from(checkboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value);

        if (selectedFields.length === 0) {
          inputsContainer.innerHTML = '';
          return;
        }

        const fieldLabels = {
          batchNo: '批次號',
          sourceFactory: '來源廠別',
          filterType: '濾網類型',
          quantity: '數量',
          regenerationCycle: '再生次數',
          deglueStartTime: '除膠開始時間',
          deglueEndTime: '除膠完成時間'
        };

        inputsContainer.innerHTML = '<div class="form-section"><label class="form-label">新的值</label></div>';

        selectedFields.forEach(field => {
          const fieldDiv = document.createElement('div');
          fieldDiv.className = 'change-input-row';

          let inputHTML = '';
          const currentValue = wo.data[field] || '';

          if (field === 'sourceFactory') {
            inputHTML = `
              <label>${fieldLabels[field]}</label>
              <select id="new-${field}" class="form-input">
                <option value="">請選擇...</option>
                <option value="柳營廠" ${currentValue === '柳營廠' ? 'selected' : ''}>柳營廠</option>
                <option value="台南廠" ${currentValue === '台南廠' ? 'selected' : ''}>台南廠</option>
                <option value="高雄廠" ${currentValue === '高雄廠' ? 'selected' : ''}>高雄廠</option>
                <option value="其他" ${currentValue === '其他' ? 'selected' : ''}>其他</option>
              </select>
              <small class="current-value">目前值：${currentValue || '-'}</small>
            `;
          } else if (field === 'filterType') {
            inputHTML = `
              <label>${fieldLabels[field]}</label>
              <select id="new-${field}" class="form-input">
                <option value="">請選擇...</option>
                <option value="活性碳濾網" ${currentValue === '活性碳濾網' ? 'selected' : ''}>活性碳濾網</option>
                <option value="化學濾網" ${currentValue === '化學濾網' ? 'selected' : ''}>化學濾網</option>
                <option value="複合濾網" ${currentValue === '複合濾網' ? 'selected' : ''}>複合濾網</option>
              </select>
              <small class="current-value">目前值：${currentValue || '-'}</small>
            `;
          } else if (field === 'regenerationCycle') {
            const cycles = ['R0 (首次再生)', 'R1 (第二次)', 'R2 (第三次)', 'R3 (第四次)', 'R4 (第五次)', 'R5 (第六次)', 'R6 (第七次)', 'R7 (第八次)', 'R8 (第九次)', 'R9 (第十次)'];
            inputHTML = `
              <label>${fieldLabels[field]}</label>
              <select id="new-${field}" class="form-input">
                <option value="">請選擇...</option>
                ${cycles.map(c => `<option value="${c}" ${currentValue === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
              <small class="current-value">目前值：${currentValue || '-'}</small>
            `;
          } else if (field === 'quantity') {
            inputHTML = `
              <label>${fieldLabels[field]}</label>
              <input type="number" id="new-${field}" class="form-input" value="${currentValue}" min="1" />
              <small class="current-value">目前值：${currentValue || '-'}</small>
            `;
          } else if (field.includes('Time')) {
            inputHTML = `
              <label>${fieldLabels[field]}</label>
              <input type="datetime-local" id="new-${field}" class="form-input" value="${currentValue}" />
              <small class="current-value">目前值：${currentValue ? new Date(currentValue).toLocaleString('zh-TW') : '-'}</small>
            `;
          } else {
            inputHTML = `
              <label>${fieldLabels[field]}</label>
              <input type="text" id="new-${field}" class="form-input" value="${currentValue}" />
              <small class="current-value">目前值：${currentValue || '-'}</small>
            `;
          }

          fieldDiv.innerHTML = inputHTML;
          inputsContainer.appendChild(fieldDiv);
        });
      }

      // 綁定按鈕事件
      dialog.querySelector('#btn-close-dialog').addEventListener('click', () => {
        document.body.removeChild(dialog);
      });

      dialog.querySelector('#btn-cancel-change').addEventListener('click', () => {
        document.body.removeChild(dialog);
      });

      dialog.querySelector('#btn-submit-change').addEventListener('click', () => {
        const reason = dialog.querySelector('#change-reason').value.trim();
        if (!reason) {
          showAlert('請填寫異動原因', 'warning');
          return;
        }

        const selectedFields = Array.from(checkboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value);

        if (selectedFields.length === 0) {
          showAlert('請選擇需要變更的欄位', 'warning');
          return;
        }

        // 收集變更內容
        const changes = {};
        selectedFields.forEach(field => {
          const newValue = dialog.querySelector(`#new-${field}`).value;
          const oldValue = wo.data[field] || '';

          if (newValue !== oldValue) {
            changes[field] = {
              old: oldValue,
              new: newValue
            };
          }
        });

        if (Object.keys(changes).length === 0) {
          showAlert('沒有實際變更的內容', 'warning');
          return;
        }

        // 建立異動申請
        try {
          const changeRequest = createChangeRequest(wo, changes, reason, currentUser);
          showAlert(`✓ 異動申請已提交！\n申請編號：${changeRequest.id}\n請等待組長審核`, 'success');
          document.body.removeChild(dialog);

          // 重新載入工單以顯示申請狀態
          displayWorkOrderDetails(wo);
        } catch (error) {
          showAlert(`✗ 提交失敗：${error.message}`, 'error');
        }
      });

      // 點擊遮罩關閉
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog);
        }
      });
    }

    // 顯示工單詳情
    function displayWorkOrderDetails(wo) {
      // 填入基本資訊欄位
      card.querySelector('#work-order-no').value = wo.data.workOrderNo || '';
      card.querySelector('#batch-no').value = wo.data.batchNo || '';
      card.querySelector('#quantity').value = wo.data.quantity || '';

      // 設定 radio 按鈕選項
      if (wo.data.sourceFactory) {
        const factoryRadio = card.querySelector(`input[name="source-factory"][value="${wo.data.sourceFactory}"]`);
        if (factoryRadio) factoryRadio.checked = true;
      }

      if (wo.data.filterType) {
        const typeRadio = card.querySelector(`input[name="filter-type"][value="${wo.data.filterType}"]`);
        if (typeRadio) typeRadio.checked = true;
      }

      if (wo.data.regenerationCycle) {
        const cycleRadio = card.querySelector(`input[name="regeneration-cycle"][value="${wo.data.regenerationCycle}"]`);
        if (cycleRadio) cycleRadio.checked = true;
      }

      // 填入除膠站點欄位（作業人員預設綁定且唯讀）
      const operatorInput = card.querySelector('#degum-operator');
      if (wo.data.deglueOperator) {
        operatorInput.value = wo.data.deglueOperator;
      }

      // 自動填入當前時間（如果尚未填寫）
      const startInput = card.querySelector('#degum-start-time');
      if (wo.data.deglueStartTime) {
        startInput.value = wo.data.deglueStartTime;
      } else {
        startInput.value = new Date().toISOString().slice(0, 16);
      }

      // 如果已有完成時間，顯示
      const endInput = card.querySelector('#degum-end-time');
      if (wo.data.deglueEndTime) {
        endInput.value = wo.data.deglueEndTime;
      }
    }

    // 完成除膠作業
    completeBtn.addEventListener('click', () => {
      if (!currentWorkOrder) return;

      // 讀取所有欄位
      const batchNo = card.querySelector('#batch-no').value.trim();
      const sourceFactory = card.querySelector('input[name="source-factory"]:checked')?.value;
      const filterType = card.querySelector('input[name="filter-type"]:checked')?.value;
      const quantity = card.querySelector('#quantity').value;
      const regenerationCycle = card.querySelector('input[name="regeneration-cycle"]:checked')?.value;
      const operator = card.querySelector('#degum-operator').value.trim();
      const startTime = card.querySelector('#degum-start-time').value;
      const endTime = card.querySelector('#degum-end-time').value;

      // 驗證必填欄位
      if (!batchNo || !sourceFactory || !filterType || !quantity || !regenerationCycle || !operator || !startTime) {
        showAlert('請填寫所有必填欄位', 'warning');
        return;
      }

      // 更新工單資料（包含基本資訊和除膠站點資料）
      currentWorkOrder.data.batchNo = batchNo;
      currentWorkOrder.data.sourceFactory = sourceFactory;
      currentWorkOrder.data.filterType = filterType;
      currentWorkOrder.data.quantity = parseInt(quantity);
      currentWorkOrder.data.regenerationCycle = regenerationCycle;
      currentWorkOrder.data.deglueOperator = operator;
      currentWorkOrder.data.deglueStartTime = startTime;
      currentWorkOrder.data.deglueEndTime = endTime || new Date().toISOString().slice(0, 16);
      currentWorkOrder.data.status = 'in_progress';
      currentWorkOrder.save();

      showAlert('除膠作業資料已儲存！', 'success');

      // 清空表單
      resetForm();
    });

    // 取消操作
    cancelBtn.addEventListener('click', () => {
      if (confirm('確定要取消目前的操作？')) {
        const currentUser = userContext.getCurrentUser();
        // 如果是一般員工，返回工單列表
        if (currentUser && currentUser.role === '一般員工') {
          window.location.href = '/';
        } else {
          // 其他角色只重置表單
          resetForm();
        }
      }
    });

    // 重置表單
    function resetForm() {
      scanInput.value = '';
      detailsSection.style.display = 'none';
      currentWorkOrder = null;
      card.querySelector('#degum-start-time').value = '';
      card.querySelector('#degum-end-time').value = '';
    }

    // 綁定事件
    scanBtn.addEventListener('click', handleScan);
    scanInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleScan();
    });

    // 如果有傳入工單號,自動載入工單
    if (workOrderNo) {
      scanInput.value = workOrderNo;
      handleScan();
    }

  }, 0);

  return card;
}
