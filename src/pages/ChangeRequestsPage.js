/**
 * 工單異動審核頁面
 * 供組長（含）以上主管審核工單異動申請
 */

import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { getPendingChangeRequests, getAllChangeRequests, reviewChangeRequest, formatChanges, canUnlockWorkOrder } from '../utils/workOrderLock.js';
import { userContext } from '../utils/userContext.js';

export function ChangeRequestsPage() {
  const container = document.createElement('div');
  container.className = 'change-requests-page';

  const currentUser = userContext.getCurrentUser();

  // 檢查權限
  if (!canUnlockWorkOrder(currentUser)) {
    container.innerHTML = `
      <div class="error-message">
        <h2>⛔ 權限不足</h2>
        <p>只有組長（含）以上主管可以審核工單異動申請</p>
        <p class="user-info">您的角色：${currentUser?.role || '未設定'}</p>
      </div>
    `;
    addStyles();
    return container;
  }

  // 頁面標題
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <h2>📋 工單異動審核</h2>
    <p class="text-secondary">審核並管理工單異動申請</p>
  `;
  container.appendChild(header);

  // Tab 切換
  const tabBar = document.createElement('div');
  tabBar.className = 'tab-bar';
  tabBar.innerHTML = `
    <button class="tab-btn active" data-tab="pending">
      待審核 <span class="badge" id="pending-count">0</span>
    </button>
    <button class="tab-btn" data-tab="all">
      全部申請
    </button>
  `;
  container.appendChild(tabBar);

  // 內容區
  const contentArea = document.createElement('div');
  contentArea.className = 'content-area';
  container.appendChild(contentArea);

  // 初始顯示待審核
  showPendingRequests();

  // 綁定 Tab 切換
  setTimeout(() => {
    const tabs = tabBar.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabName = tab.dataset.tab;
        if (tabName === 'pending') {
          showPendingRequests();
        } else {
          showAllRequests();
        }
      });
    });
  }, 0);

  addStyles();
  return container;

  // ========== 功能函數 ==========

  function showPendingRequests() {
    const requests = getPendingChangeRequests();

    // 更新計數
    const badge = document.getElementById('pending-count');
    if (badge) {
      badge.textContent = requests.length;
    }

    if (requests.length === 0) {
      contentArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>沒有待審核的申請</h3>
          <p>目前所有異動申請都已處理完畢</p>
        </div>
      `;
      return;
    }

    contentArea.innerHTML = '';
    requests.forEach(request => {
      const card = createRequestCard(request, true);
      contentArea.appendChild(card);
    });
  }

  function showAllRequests() {
    const requests = getAllChangeRequests().reverse(); // 最新的在前面

    if (requests.length === 0) {
      contentArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📄</div>
          <h3>尚無異動申請</h3>
          <p>目前還沒有任何工單異動申請記錄</p>
        </div>
      `;
      return;
    }

    contentArea.innerHTML = '';
    requests.forEach(request => {
      const card = createRequestCard(request, false);
      contentArea.appendChild(card);
    });
  }

  function createRequestCard(request, showActions) {
    const card = document.createElement('div');
    card.className = 'request-card';

    const statusClass = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected'
    }[request.status];

    const statusText = {
      'pending': '待審核',
      'approved': '已核准',
      'rejected': '已拒絕'
    }[request.status];

    card.innerHTML = `
      <div class="request-header">
        <div class="request-info">
          <h3>申請編號：${request.id}</h3>
          <span class="request-status ${statusClass}">${statusText}</span>
        </div>
        <div class="request-meta">
          <p><strong>工單：</strong>${request.workOrderNo}</p>
          <p><strong>申請人：</strong>${request.applicant} (${request.applicantDepartment})</p>
          <p><strong>申請時間：</strong>${formatDateTime(request.requestTime)}</p>
        </div>
      </div>

      <div class="request-body">
        <div class="reason-section">
          <h4>異動原因</h4>
          <p class="reason-text">${request.reason}</p>
        </div>

        <div class="changes-section">
          <h4>變更內容</h4>
          <div class="changes-list">
            ${formatChangesHTML(request.changes)}
          </div>
        </div>

        ${request.status !== 'pending' ? `
          <div class="review-section">
            <h4>審核結果</h4>
            <p><strong>審核人：</strong>${request.reviewedBy}</p>
            <p><strong>審核時間：</strong>${formatDateTime(request.reviewedAt)}</p>
            ${request.reviewComment ? `<p><strong>審核意見：</strong>${request.reviewComment}</p>` : ''}
          </div>
        ` : ''}
      </div>

      ${showActions && request.status === 'pending' ? `
        <div class="request-actions">
          <button class="btn-reject" data-id="${request.id}">拒絕</button>
          <button class="btn-approve" data-id="${request.id}">核准</button>
        </div>
      ` : ''}
    `;

    // 綁定審核按鈕
    if (showActions && request.status === 'pending') {
      setTimeout(() => {
        const approveBtn = card.querySelector('.btn-approve');
        const rejectBtn = card.querySelector('.btn-reject');

        approveBtn.addEventListener('click', () => {
          handleReview(request.id, true);
        });

        rejectBtn.addEventListener('click', () => {
          handleReview(request.id, false);
        });
      }, 0);
    }

    return card;
  }

  function handleReview(requestId, approved) {
    const comment = prompt(
      approved
        ? '請輸入核准意見（可選）：'
        : '請輸入拒絕原因：'
    );

    if (!approved && !comment) {
      alert('⚠️ 拒絕申請必須填寫原因');
      return;
    }

    try {
      reviewChangeRequest(requestId, approved, currentUser, comment || '');

      alert(
        approved
          ? '✓ 已核准異動申請，工單已更新'
          : '✗ 已拒絕異動申請'
      );

      // 重新載入列表
      showPendingRequests();
    } catch (error) {
      alert(`✗ 審核失敗：${error.message}`);
    }
  }

  function formatChangesHTML(changes) {
    const fieldNames = {
      batchNo: '批次號',
      sourceFactory: '來源廠別',
      filterType: '濾網類型',
      quantity: '數量',
      regenerationCycle: '再生次數',
      deglueStartTime: '除膠開始時間',
      deglueEndTime: '除膠完成時間'
    };

    return Object.keys(changes).map(field => {
      const fieldName = fieldNames[field] || field;
      const { old: oldValue, new: newValue } = changes[field];

      return `
        <div class="change-item">
          <span class="field-name">${fieldName}</span>
          <div class="value-change">
            <span class="old-value">${oldValue || '(空值)'}</span>
            <span class="arrow">→</span>
            <span class="new-value">${newValue}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function formatDateTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }
}

function addStyles() {
  if (document.getElementById('change-requests-page-styles')) return;

  const style = document.createElement('style');
  style.id = 'change-requests-page-styles';
  style.textContent = `
    .change-requests-page {
      padding: var(--spacing-xl);
      max-width: 1200px;
      margin: 0 auto;
    }

    .error-message {
      text-align: center;
      padding: var(--spacing-xxl);
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      margin: 100px auto;
      max-width: 500px;
    }

    .error-message h2 {
      color: var(--error-color);
      margin: 0 0 var(--spacing-md) 0;
    }

    .user-info {
      margin-top: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
    }

    .tab-bar {
      display: flex;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
      border-bottom: 2px solid var(--border-color);
    }

    .tab-btn {
      padding: var(--spacing-md) var(--spacing-lg);
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-secondary);
      transition: all 0.3s;
      position: relative;
    }

    .tab-btn:hover {
      color: var(--primary-color);
    }

    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }

    .badge {
      display: inline-block;
      background: var(--error-color);
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-left: 6px;
    }

    .content-area {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-xxl);
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: var(--spacing-md);
    }

    .empty-state h3 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--text-primary);
    }

    .empty-state p {
      color: var(--text-secondary);
      margin: 0;
    }

    .request-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      transition: all 0.3s;
    }

    .request-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .request-header {
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--border-color);
    }

    .request-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .request-info h3 {
      margin: 0;
      font-size: 1.125rem;
      color: var(--text-primary);
    }

    .request-status {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-approved {
      background: #d1fae5;
      color: #065f46;
    }

    .status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .request-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-sm);
    }

    .request-meta p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .request-body {
      padding: var(--spacing-lg);
    }

    .reason-section,
    .changes-section,
    .review-section {
      margin-bottom: var(--spacing-lg);
    }

    .reason-section h4,
    .changes-section h4,
    .review-section h4 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 0.9375rem;
      color: var(--text-primary);
    }

    .reason-text {
      padding: var(--spacing-md);
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .changes-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .change-item {
      padding: var(--spacing-md);
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
    }

    .field-name {
      display: block;
      font-weight: 600;
      font-size: 0.8125rem;
      color: #1e40af;
      margin-bottom: 6px;
    }

    .value-change {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      font-size: 0.875rem;
    }

    .old-value {
      color: #6b7280;
      text-decoration: line-through;
    }

    .arrow {
      color: #3b82f6;
      font-weight: 700;
    }

    .new-value {
      color: #059669;
      font-weight: 600;
    }

    .review-section {
      padding: var(--spacing-md);
      background: #f3f4f6;
      border-radius: 8px;
    }

    .review-section p {
      margin: 0 0 6px 0;
      font-size: 0.875rem;
    }

    .request-actions {
      padding: var(--spacing-lg);
      background: #f9fafb;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
    }

    .btn-approve,
    .btn-reject {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-approve {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }

    .btn-approve:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .btn-reject {
      background: white;
      color: #dc2626;
      border: 2px solid #dc2626;
    }

    .btn-reject:hover {
      background: #dc2626;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
  `;
  document.head.appendChild(style);
}
