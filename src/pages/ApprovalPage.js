import { Button } from '../components/common/Button.js';
import { Modal } from '../components/common/Modal.js';
import { Input } from '../components/common/Input.js';
import { FormInstanceModel, ApprovalHistoryModel, FormModel, WorkflowModel, getUserById } from '../utils/dataModel.js';
import { ApprovalEngine } from '../utils/approvalEngine.js';
import { auditLogger } from '../utils/auditLogger.js';
import { authService } from '../utils/authService.js';

const ITEMS_PER_PAGE = 50;

export function ApprovalPage() {
  const container = document.createElement('div');
  container.className = 'approval-page';

  // 取得當前使用者
  const currentUser = authService.getCurrentUser();

  // 頁面狀態
  let currentTab = 'pending';
  let currentPage = 1;
  let filteredInstances = [];

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <h2>簽核中心</h2>
    <p class="text-secondary">查看待簽核項目和我的申請</p>
  `;
  container.appendChild(header);

  // 分頁標籤
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  tabs.innerHTML = `
    <button class="tab-btn active" data-tab="pending">待我簽核</button>
    <button class="tab-btn" data-tab="my-applications">我的申請</button>
    <button class="tab-btn" data-tab="all">全部申請</button>
  `;
  container.appendChild(tabs);

  // 內容區
  const content = document.createElement('div');
  content.className = 'tab-content';
  content.id = 'approval-content';
  container.appendChild(content);

  // 初始顯示待簽核項目
  renderInstances('pending');

  // 分頁切換
  tabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
      // 更新 active 狀態
      tabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      // 切換內容
      currentTab = e.target.dataset.tab;
      currentPage = 1;
      renderInstances(currentTab);
    }
  });

  // 渲染實例列表（統一函數處理所有 tab）
  function renderInstances(tab) {
    content.innerHTML = '';

    // 依據 tab 篩選資料
    let instances = [];
    if (tab === 'pending') {
      instances = FormInstanceModel.getAll().filter(instance => {
        if (instance.status !== 'pending') return false;
        try {
          const engine = new ApprovalEngine(instance.id);
          const approvers = engine.getCurrentApprovers();
          return approvers.includes(currentUser.id);
        } catch (e) {
          return false;
        }
      });
    } else if (tab === 'my-applications') {
      instances = FormInstanceModel.getAll().filter(
        instance => instance.applicantId === currentUser.id || true // 暫時顯示全部
      );
    } else if (tab === 'all') {
      instances = FormInstanceModel.getAll();
    }

    filteredInstances = instances;

    // 空狀態
    if (instances.length === 0) {
      const emptyMessages = {
        pending: { icon: '📋', title: '沒有待簽核項目', desc: '目前沒有需要您簽核的申請' },
        'my-applications': { icon: '📝', title: '沒有申請記錄', desc: '您尚未發起任何申請' },
        all: { icon: '📋', title: '沒有申請記錄', desc: '系統中沒有任何申請' }
      };
      const msg = emptyMessages[tab];
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${msg.icon}</div>
          <h3>${msg.title}</h3>
          <p class="text-secondary">${msg.desc}</p>
        </div>
      `;
      return;
    }

    // 計算分頁
    const totalPages = Math.ceil(instances.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageInstances = instances.slice(start, end);

    // 統計資訊
    const stats = document.createElement('div');
    stats.className = 'list-stats';
    stats.innerHTML = `
      <span>共 <strong>${instances.length}</strong> 筆申請</span>
      <span>第 <strong>${currentPage}</strong> / <strong>${totalPages}</strong> 頁</span>
    `;
    content.appendChild(stats);

    // 建立表格
    const table = document.createElement('table');
    table.className = 'data-table approval-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th style="width: 140px;">申請編號</th>
          <th style="width: 150px;">配方編號</th>
          <th>配方名稱</th>
          <th style="width: 80px;">版本</th>
          <th style="width: 100px;">申請人</th>
          <th style="width: 150px;">申請時間</th>
          <th style="width: 80px;">狀態</th>
          <th style="width: 200px;">操作</th>
        </tr>
      </thead>
      <tbody id="instances-tbody"></tbody>
    `;

    const tbody = table.querySelector('#instances-tbody');

    pageInstances.forEach(instance => {
      const row = createInstanceRow(instance, tab === 'pending');
      tbody.appendChild(row);
    });

    content.appendChild(table);

    // 分頁控制
    if (totalPages > 1) {
      const pagination = createPagination(currentPage, totalPages);
      content.appendChild(pagination);
    }
  }

  // 建立申請單列表行
  function createInstanceRow(instance, showApprovalButtons) {
    const statusText = {
      'pending': '簽核中',
      'approved': '已通過',
      'rejected': '已退回'
    };

    const statusClass = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected'
    };

    // 取得表單資訊
    const form = FormModel.getById(instance.formId);

    // 從 instance.data 取得配方編號和版本
    let recipeNo = '-';
    let version = '-';
    if (instance.data) {
      Object.keys(instance.data).forEach(key => {
        if (key === 'recipeNo' || key.includes('recipeNo')) {
          recipeNo = instance.data[key] || '-';
        }
        if (key === 'version' || key.includes('version')) {
          version = instance.data[key] || '-';
        }
      });
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="font-mono text-sm">${instance.applicationNo || instance.id.substring(0, 12)}</td>
      <td class="font-mono text-sm">${recipeNo}</td>
      <td class="font-medium">${form?.name || '未知表單'}</td>
      <td class="text-center">
        <span class="badge badge-version">${version}</span>
      </td>
      <td>${instance.applicant || '未知'}</td>
      <td class="text-sm">${new Date(instance.createdAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
      <td>
        <span class="status-badge ${statusClass[instance.status]}">${statusText[instance.status]}</span>
      </td>
      <td></td>
    `;

    const actionsCell = row.querySelector('td:last-child');
    const actions = createActions(instance, showApprovalButtons);
    actionsCell.appendChild(actions);

    return row;
  }

  // 建立操作按鈕
  function createActions(instance, showApprovalButtons) {
    const div = document.createElement('div');
    div.className = 'table-actions';

    const viewBtn = new Button({
      text: '查看',
      variant: 'outline',
      size: 'sm',
      onClick: () => showInstanceDetail(instance)
    });
    div.appendChild(viewBtn.render());

    if (showApprovalButtons && instance.status === 'pending') {
      const approveBtn = new Button({
        text: '核准',
        variant: 'primary',
        size: 'sm',
        onClick: () => showApprovalModal(instance, 'approve')
      });

      const rejectBtn = new Button({
        text: '退回',
        variant: 'danger',
        size: 'sm',
        onClick: () => showApprovalModal(instance, 'reject')
      });

      div.appendChild(approveBtn.render());
      div.appendChild(rejectBtn.render());
    }

    // 如果是自己的申請且狀態為 pending，顯示撤回按鈕
    if (!showApprovalButtons && instance.status === 'pending') {
      const withdrawBtn = new Button({
        text: '撤回',
        variant: 'danger',
        size: 'sm',
        onClick: () => withdrawApplication(instance)
      });
      div.appendChild(withdrawBtn.render());
    }

    return div;
  }

  // 建立分頁控制
  function createPagination(currentPage, totalPages) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';

    // 上一頁
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = '« 上一頁';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderInstances(currentTab);
      }
    });
    pagination.appendChild(prevBtn);

    // 頁碼顯示
    const pageInfo = document.createElement('span');
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `第 ${currentPage} / ${totalPages} 頁`;
    pagination.appendChild(pageInfo);

    // 下一頁
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = '下一頁 »';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderInstances(currentTab);
      }
    });
    pagination.appendChild(nextBtn);

    return pagination;
  }

  // 顯示申請單詳情（保留原有功能）
  function showInstanceDetail(instance) {
    const form = FormModel.getById(instance.formId);
    const workflow = WorkflowModel.getById(instance.workflowId);

    const modalContent = document.createElement('div');
    modalContent.className = 'instance-detail';

    // 基本資訊
    const infoSection = document.createElement('div');
    infoSection.className = 'detail-section';

    infoSection.innerHTML = `
      <h4>申請資訊</h4>
      <div class="detail-info">
        <div class="info-row">
          <span class="info-label">申請編號：</span>
          <span>${instance.applicationNo || instance.id.substring(0, 12) + '...'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">申請人：</span>
          <span>${instance.applicant || '未知'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">簽核流程：</span>
          <span>${workflow?.name || '未知流程'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">申請時間：</span>
          <span>${new Date(instance.createdAt).toLocaleString('zh-TW')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">狀態：</span>
          <span class="status-badge status-${instance.status}">${getStatusText(instance.status)}</span>
        </div>
      </div>
    `;
    modalContent.appendChild(infoSection);

    // 表單內容
    const dataSection = document.createElement('div');
    dataSection.className = 'detail-section';
    dataSection.innerHTML = '<h4>表單內容</h4>';

    const dataTable = document.createElement('div');
    dataTable.className = 'data-table-detail';

    Object.entries(instance.data || {}).forEach(([key, value]) => {
      const row = document.createElement('div');
      row.className = 'data-row';
      row.innerHTML = `
        <div class="data-label">${key}：</div>
        <div class="data-value">${Array.isArray(value) ? value.join(', ') : value}</div>
      `;
      dataTable.appendChild(row);
    });

    dataSection.appendChild(dataTable);
    modalContent.appendChild(dataSection);

    // 簽核歷史
    const historySection = document.createElement('div');
    historySection.className = 'detail-section';
    historySection.innerHTML = '<h4>簽核歷史</h4>';

    const history = ApprovalHistoryModel.getAll().filter(h => h.instanceId === instance.id);
    const historyList = document.createElement('div');
    historyList.className = 'history-list';

    if (history.length === 0) {
      historyList.innerHTML = '<p class="text-secondary">尚無簽核記錄</p>';
    } else {
      history.forEach(record => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
          <div class="history-header">
            <span class="history-user">${record.userName || record.userId || '系統'}</span>
            <span class="history-time">${new Date(record.timestamp || record.createdAt).toLocaleString('zh-TW')}</span>
          </div>
          <div class="history-body">
            <span class="history-action">${getActionText(record.action)}</span>
            ${record.nodeName ? `<span class="history-node">（${record.nodeName}）</span>` : ''}
            ${record.result ? `<span class="badge badge-${getResultBadge(record.result)}">${getResultText(record.result)}</span>` : ''}
          </div>
          ${record.comment ? `<div class="history-comment">簽核意見：${record.comment}</div>` : ''}
        `;
        historyList.appendChild(item);
      });
    }

    historySection.appendChild(historyList);
    modalContent.appendChild(historySection);

    const modal = new Modal({
      title: form?.name || '未知表單',
      content: modalContent
    });

    modal.render();
    modal.open();
  }

  // 顯示簽核對話框
  function showApprovalModal(instance, action) {
    const modalContent = document.createElement('div');

    const commentInput = new Input({
      label: '簽核意見',
      placeholder: '請輸入簽核意見（選填）',
      type: 'text'
    });
    modalContent.appendChild(commentInput.render());

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.style.marginTop = 'var(--spacing-lg)';
    actions.style.display = 'flex';
    actions.style.gap = 'var(--spacing-md)';
    actions.style.justifyContent = 'flex-end';

    const modal = new Modal({
      title: action === 'approve' ? '核准申請' : '退回申請',
      content: modalContent
    });

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => modal.close()
    });

    const confirmBtn = new Button({
      text: action === 'approve' ? '確認核准' : '確認退回',
      variant: action === 'approve' ? 'primary' : 'danger',
      onClick: () => {
        performApproval(instance, action, commentInput.getValue(), modal);
      }
    });

    actions.appendChild(cancelBtn.render());
    actions.appendChild(confirmBtn.render());
    modalContent.appendChild(actions);

    modal.render();
    modal.open();
  }

  // 執行簽核
  function performApproval(instance, action, comment, modal) {
    try {
      const engine = new ApprovalEngine(instance.id);
      const result = engine.approve(
        currentUser.id,
        currentUser.name,
        comment,
        action
      );

      modal.close();
      alert(result.message || '簽核成功');
      renderInstances(currentTab);
    } catch (error) {
      alert('簽核失敗：' + error.message);
    }
  }

  // 撤回申請
  function withdrawApplication(instance) {
    if (confirm('確定要撤回此申請嗎？')) {
      instance.status = 'rejected';
      const instanceModel = new FormInstanceModel(instance);
      instanceModel.save();

      // 記錄撤回歷史
      const history = new ApprovalHistoryModel({
        instanceId: instance.id,
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'withdraw',
        result: 'rejected',
        comment: '申請人撤回'
      });
      history.save();

      auditLogger.logWithdrawApplication(instance.id, instance.applicationNo);
      alert('申請已撤回');
      renderInstances(currentTab);
    }
  }

  function getStatusText(status) {
    const map = {
      'pending': '簽核中',
      'approved': '已通過',
      'rejected': '已退回'
    };
    return map[status] || status;
  }

  function getActionText(action) {
    const map = {
      'submit': '發起申請',
      'approve': '核准',
      'reject': '退回',
      'complete': '完成',
      'notify': '通知',
      'withdraw': '撤回'
    };
    return map[action] || action;
  }

  function getResultText(result) {
    const map = {
      'submitted': '已提交',
      'approved': '已核准',
      'rejected': '已退回',
      'notified': '已通知',
      'approve': '核准',
      'reject': '退回'
    };
    return map[result] || result;
  }

  function getResultBadge(result) {
    const map = {
      'submitted': 'primary',
      'approved': 'success',
      'rejected': 'error',
      'notified': 'warning',
      'approve': 'success',
      'reject': 'error'
    };
    return map[result] || 'primary';
  }

  addStyles();
  return container;
}

function addStyles() {
  if (!document.getElementById('approval-page-styles')) {
    const style = document.createElement('style');
    style.id = 'approval-page-styles';
    style.textContent = `
      .approval-page {
        padding: var(--spacing-xl);
      }

      .tabs {
        display: flex;
        gap: var(--spacing-md);
        margin: var(--spacing-xl) 0;
        border-bottom: 2px solid var(--border-color);
      }

      .tab-btn {
        padding: var(--spacing-md) var(--spacing-lg);
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        font-weight: 500;
        color: var(--text-secondary);
        transition: all 0.2s;
        margin-bottom: -2px;
      }

      .tab-btn:hover {
        color: var(--primary-color);
      }

      .tab-btn.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .list-stats {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-md);
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .list-stats strong {
        color: var(--primary-color);
        font-weight: 600;
      }

      .approval-table {
        margin-bottom: var(--spacing-lg);
      }

      .approval-table tbody tr {
        cursor: pointer;
        transition: background 0.2s;
      }

      .approval-table tbody tr:hover {
        background: var(--bg-secondary);
      }

      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .status-pending {
        background: var(--warning-light);
        color: var(--warning-color);
      }

      .status-approved {
        background: var(--success-light);
        color: var(--success-color);
      }

      .status-rejected {
        background: var(--error-light);
        color: var(--error-color);
      }

      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--spacing-lg);
        padding: var(--spacing-lg);
      }

      .pagination-btn {
        padding: var(--spacing-sm) var(--spacing-lg);
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .pagination-btn:hover:not(:disabled) {
        background: var(--primary-dark);
        transform: translateY(-1px);
      }

      .pagination-btn:disabled {
        background: var(--border-color);
        color: var(--text-tertiary);
        cursor: not-allowed;
      }

      .pagination-info {
        font-weight: 500;
        color: var(--text-secondary);
      }

      /* 詳情 Modal 樣式 */
      .instance-detail {
        max-height: 70vh;
        overflow-y: auto;
      }

      .detail-section {
        margin-bottom: var(--spacing-xl);
      }

      .detail-section h4 {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
        border-bottom: 2px solid var(--border-color);
        padding-bottom: var(--spacing-sm);
      }

      .detail-info {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
      }

      .info-row {
        display: flex;
        font-size: 0.875rem;
        margin-bottom: var(--spacing-sm);
      }

      .info-label {
        color: var(--text-secondary);
        min-width: 120px;
        font-weight: 500;
      }

      .data-table-detail {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .data-row {
        display: flex;
        padding: var(--spacing-sm);
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
      }

      .data-label {
        font-weight: 500;
        color: var(--text-secondary);
        min-width: 150px;
      }

      .data-value {
        color: var(--text-primary);
        flex: 1;
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .history-item {
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border-left: 4px solid var(--primary-color);
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-xs);
      }

      .history-user {
        font-weight: 600;
        color: var(--text-primary);
      }

      .history-time {
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }

      .history-body {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .history-action {
        font-weight: 500;
      }

      .history-node {
        color: var(--text-tertiary);
      }

      .history-comment {
        margin-top: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--bg-color);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        color: var(--text-primary);
        border-left: 3px solid var(--primary-color);
      }
    `;
    document.head.appendChild(style);
  }
}
