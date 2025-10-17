/**
 * 工單鎖定與異動審核系統
 * 規則：工單儲存後不可修改，除非經組長以上主管審核同意
 */

import { userContext } from './userContext.js';
import { FormInstanceModel } from './dataModel.js';

/**
 * 檢查工單是否已鎖定
 */
export function isWorkOrderLocked(workOrder) {
  // 工單一旦儲存完成（除膠站完成）就會被鎖定
  if (workOrder.data.deglueEndTime && !workOrder.data.isUnlocked) {
    return true;
  }
  return false;
}

/**
 * 檢查使用者是否有權限解鎖工單
 * 只有組長（含）以上主管可以解鎖
 */
export function canUnlockWorkOrder(user) {
  if (!user) return false;

  // 檢查權限：組長、課長、經理、系統管理員
  const allowedRoles = ['組長', '課長', '經理', '系統管理員', '主管'];
  return allowedRoles.includes(user.role);
}

/**
 * 建立異動申請
 */
export function createChangeRequest(workOrder, changes, reason, applicant) {
  const changeRequest = {
    id: `CHG-${Date.now()}`,
    workOrderNo: workOrder.data.workOrderNo,
    workOrderId: workOrder.id,
    applicant: applicant.name,
    applicantId: applicant.id,
    applicantDepartment: applicant.department,
    requestTime: new Date().toISOString(),
    reason: reason,
    changes: changes, // { field: { old: 'value', new: 'value' } }
    status: 'pending', // pending, approved, rejected
    reviewedBy: null,
    reviewedAt: null,
    reviewComment: null
  };

  // 儲存到 localStorage
  const changeRequests = JSON.parse(localStorage.getItem('changeRequests') || '[]');
  changeRequests.push(changeRequest);
  localStorage.setItem('changeRequests', JSON.stringify(changeRequests));

  // 更新工單狀態
  workOrder.data.hasChangeRequest = true;
  workOrder.data.changeRequestId = changeRequest.id;
  workOrder.save();

  return changeRequest;
}

/**
 * 取得待審核的異動申請列表
 */
export function getPendingChangeRequests() {
  const changeRequests = JSON.parse(localStorage.getItem('changeRequests') || '[]');
  return changeRequests.filter(req => req.status === 'pending');
}

/**
 * 取得所有異動申請
 */
export function getAllChangeRequests() {
  return JSON.parse(localStorage.getItem('changeRequests') || '[]');
}

/**
 * 審核異動申請
 */
export function reviewChangeRequest(requestId, approved, reviewer, comment = '') {
  const changeRequests = JSON.parse(localStorage.getItem('changeRequests') || '[]');
  const request = changeRequests.find(req => req.id === requestId);

  if (!request) {
    throw new Error('找不到異動申請');
  }

  if (request.status !== 'pending') {
    throw new Error('此異動申請已審核過');
  }

  // 檢查審核者權限
  if (!canUnlockWorkOrder(reviewer)) {
    throw new Error('您沒有權限審核異動申請');
  }

  // 更新審核結果
  request.status = approved ? 'approved' : 'rejected';
  request.reviewedBy = reviewer.name;
  request.reviewedById = reviewer.id;
  request.reviewedAt = new Date().toISOString();
  request.reviewComment = comment;

  // 儲存
  localStorage.setItem('changeRequests', JSON.stringify(changeRequests));

  // 如果核准，執行變更並記錄
  if (approved) {
    applyChangesToWorkOrder(request);
  } else {
    // 如果拒絕，清除工單的異動申請標記
    const workOrder = FormInstanceModel.getById(request.workOrderId);
    if (workOrder) {
      workOrder.data.hasChangeRequest = false;
      workOrder.data.changeRequestId = null;
      workOrder.save();
    }
  }

  return request;
}

/**
 * 套用變更到工單並記錄
 */
function applyChangesToWorkOrder(changeRequest) {
  const workOrder = FormInstanceModel.getById(changeRequest.workOrderId);

  if (!workOrder) {
    throw new Error('找不到工單');
  }

  // 記錄變更歷史
  if (!workOrder.data.changeHistory) {
    workOrder.data.changeHistory = [];
  }

  const changeRecord = {
    timestamp: new Date().toISOString(),
    changeRequestId: changeRequest.id,
    changedBy: changeRequest.reviewedBy,
    changedById: changeRequest.reviewedById,
    reason: changeRequest.reason,
    changes: changeRequest.changes
  };

  workOrder.data.changeHistory.push(changeRecord);

  // 套用變更
  Object.keys(changeRequest.changes).forEach(field => {
    workOrder.data[field] = changeRequest.changes[field].new;
  });

  // 清除異動申請標記
  workOrder.data.hasChangeRequest = false;
  workOrder.data.changeRequestId = null;

  workOrder.save();

  return changeRecord;
}

/**
 * 取得工單的變更歷史
 */
export function getWorkOrderChangeHistory(workOrderId) {
  const workOrder = FormInstanceModel.getById(workOrderId);
  if (!workOrder) return [];

  return workOrder.data.changeHistory || [];
}

/**
 * 格式化變更內容為可讀文字
 */
export function formatChanges(changes) {
  const fieldNames = {
    batchNo: '批次號',
    sourceFactory: '來源廠別',
    filterType: '濾網類型',
    quantity: '數量',
    regenerationCycle: '再生次數',
    deglueOperator: '除膠作業人員',
    deglueStartTime: '除膠開始時間',
    deglueEndTime: '除膠完成時間'
  };

  return Object.keys(changes).map(field => {
    const fieldName = fieldNames[field] || field;
    const { old: oldValue, new: newValue } = changes[field];
    return `${fieldName}：${oldValue} → ${newValue}`;
  }).join('\n');
}

/**
 * 檢查並鎖定表單欄位
 */
export function lockFormFields(card, workOrder) {
  const currentUser = userContext.getCurrentUser();
  const isLocked = isWorkOrderLocked(workOrder);

  if (!isLocked) {
    return; // 未鎖定，無需處理
  }

  // 鎖定所有輸入欄位
  const inputs = card.querySelectorAll('input:not([readonly]), select');
  inputs.forEach(input => {
    input.disabled = true;
    input.style.opacity = '0.6';
    input.style.cursor = 'not-allowed';
  });

  const radioInputs = card.querySelectorAll('.radio-option');
  radioInputs.forEach(option => {
    option.style.pointerEvents = 'none';
    option.style.opacity = '0.6';
  });

  // 隱藏儲存按鈕
  const saveBtn = card.querySelector('.btn-primary');
  if (saveBtn) {
    saveBtn.style.display = 'none';
  }

  // 顯示鎖定提示
  const detailsSection = card.querySelector('.work-order-details');
  if (detailsSection) {
    const lockBanner = document.createElement('div');
    lockBanner.className = 'lock-banner';
    lockBanner.innerHTML = `
      <div class="lock-icon">🔒</div>
      <div class="lock-content">
        <h4>工單已鎖定</h4>
        <p>此工單已完成並儲存，無法直接修改。</p>
        <button class="btn-unlock" id="btn-request-unlock">申請異動</button>
        <p class="lock-hint">需經組長（含）以上主管審核才能變更</p>
      </div>
    `;
    detailsSection.insertBefore(lockBanner, detailsSection.firstChild);
  }
}
