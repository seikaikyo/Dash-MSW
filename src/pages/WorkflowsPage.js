import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { WorkflowModel } from '../utils/dataModel.js';
import { auditLogger } from '../utils/auditLogger.js';

export function WorkflowsPage() {
  const container = document.createElement('div');
  container.className = 'workflows-page';

  let allWorkflows = WorkflowModel.getAll();
  let filteredWorkflows = [...allWorkflows];
  let searchInput;
  let currentFilter = 'all';

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="header-content">
      <div>
        <h2>🔄 製程流程管理</h2>
        <p class="text-secondary">管理柳營再生濾網製程流程與簽核設定</p>
      </div>
      <div class="header-actions" id="header-actions"></div>
    </div>
  `;
  container.appendChild(header);

  // 建立按鈕
  const headerActions = header.querySelector('#header-actions');
  const createBtn = new Button({
    text: '+ 建立製程流程',
    variant: 'primary',
    onClick: () => {
      window.location.hash = '#/workflows/designer';
    }
  });
  headerActions.appendChild(createBtn.render());

  // 統計卡片
  const statsSection = document.createElement('div');
  statsSection.className = 'stats-section';
  statsSection.id = 'stats-section';
  container.appendChild(statsSection);
  renderStats();

  // 篩選和搜尋
  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <div class="filter-tabs" id="filter-tabs">
      <button class="filter-tab active" data-filter="all">全部</button>
      <button class="filter-tab" data-filter="active">啟用中</button>
      <button class="filter-tab" data-filter="draft">草稿</button>
    </div>
    <div class="search-box" id="search-box"></div>
  `;
  container.appendChild(filterBar);

  // 搜尋框
  searchInput = new Input({
    placeholder: '🔍 搜尋製程流程名稱...',
    onChange: (value) => {
      filterWorkflows(currentFilter, value);
    }
  });
  filterBar.querySelector('#search-box').appendChild(searchInput.render());

  // 篩選標籤事件
  filterBar.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      filterBar.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      filterWorkflows(currentFilter, searchInput.value);
    });
  });

  // 流程列表
  const workflowsList = document.createElement('div');
  workflowsList.className = 'workflows-list';
  workflowsList.id = 'workflows-list';
  container.appendChild(workflowsList);

  renderWorkflowsList();

  function renderStats() {
    const activeCount = allWorkflows.filter(w => w.status === 'active').length;
    const draftCount = allWorkflows.filter(w => w.status === 'draft').length;

    statsSection.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-content">
          <div class="stat-label">總流程數</div>
          <div class="stat-value">${allWorkflows.length}</div>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-label">啟用中</div>
          <div class="stat-value">${activeCount}</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-label">草稿</div>
          <div class="stat-value">${draftCount}</div>
        </div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-label">顯示中</div>
          <div class="stat-value">${filteredWorkflows.length}</div>
        </div>
      </div>
    `;
  }

  function filterWorkflows(status, keyword = '') {
    const lowerKeyword = keyword.toLowerCase();

    filteredWorkflows = allWorkflows.filter(workflow => {
      const matchesStatus = status === 'all' ||
        (status === 'active' && workflow.status === 'active') ||
        (status === 'draft' && (!workflow.status || workflow.status === 'draft'));

      const matchesKeyword = !keyword ||
        (workflow.name || '').toLowerCase().includes(lowerKeyword);

      return matchesStatus && matchesKeyword;
    });

    renderStats();
    renderWorkflowsList();
  }

  function renderWorkflowsList() {
    workflowsList.innerHTML = '';

    if (filteredWorkflows.length === 0) {
      workflowsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔄</div>
          <h3>${allWorkflows.length === 0 ? '尚未建立任何製程流程' : '沒有符合條件的製程流程'}</h3>
          <p>${allWorkflows.length === 0 ? '點擊「建立製程流程」開始設計您的第一個流程' : '請嘗試其他篩選條件或搜尋關鍵字'}</p>
        </div>
      `;
      return;
    }

    // 使用卡片式佈局
    const grid = document.createElement('div');
    grid.className = 'workflows-grid';

    filteredWorkflows.forEach(workflow => {
      const card = createWorkflowCard(workflow);
      grid.appendChild(card);
    });

    workflowsList.appendChild(grid);
  }

  function createWorkflowCard(workflow) {
    const card = document.createElement('div');
    card.className = 'workflow-card';

    const nodeCount = workflow.nodes?.length || 0;
    const connectionCount = workflow.connections?.length || 0;
    const status = workflow.status || 'draft';
    const statusConfig = {
      active: { label: '啟用中', color: '#10b981', icon: '✅' },
      draft: { label: '草稿', color: '#f59e0b', icon: '📝' },
      inactive: { label: '停用', color: '#9ca3af', icon: '⏸️' }
    };
    const statusInfo = statusConfig[status] || statusConfig.draft;

    card.innerHTML = `
      <div class="workflow-card-header">
        <div class="workflow-title">
          <h3>${workflow.name || '未命名流程'}</h3>
          <span class="workflow-status" style="background: ${statusInfo.color}20; color: ${statusInfo.color};">
            ${statusInfo.icon} ${statusInfo.label}
          </span>
        </div>
        ${workflow.description ? `<p class="workflow-description">${workflow.description}</p>` : ''}
      </div>

      <div class="workflow-card-body">
        <div class="workflow-stats">
          <div class="workflow-stat">
            <span class="stat-icon">🔗</span>
            <span class="stat-text">${nodeCount} 個節點</span>
          </div>
          <div class="workflow-stat">
            <span class="stat-icon">↔️</span>
            <span class="stat-text">${connectionCount} 條連線</span>
          </div>
        </div>

        <div class="workflow-meta">
          <div class="meta-item">
            <span class="meta-label">建立時間</span>
            <span class="meta-value">${new Date(workflow.createdAt).toLocaleString('zh-TW')}</span>
          </div>
          ${workflow.updatedAt ? `
            <div class="meta-item">
              <span class="meta-label">更新時間</span>
              <span class="meta-value">${new Date(workflow.updatedAt).toLocaleString('zh-TW')}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="workflow-card-footer">
        <button class="btn-secondary btn-view" data-id="${workflow.id}">
          <span>👁️ 檢視</span>
        </button>
        <button class="btn-primary btn-edit" data-id="${workflow.id}">
          <span>✏️ 編輯</span>
        </button>
        <button class="btn-danger btn-delete" data-id="${workflow.id}">
          <span>🗑️ 刪除</span>
        </button>
      </div>
    `;

    // 綁定事件
    card.querySelector('.btn-view').addEventListener('click', () => {
      alert('檢視功能開發中...\n將顯示流程圖預覽');
    });

    card.querySelector('.btn-edit').addEventListener('click', () => {
      window.location.hash = `#/workflows/designer?id=${workflow.id}`;
    });

    card.querySelector('.btn-delete').addEventListener('click', () => {
      if (confirm(`確定要刪除「${workflow.name}」嗎？\n此操作無法復原。`)) {
        WorkflowModel.delete(workflow.id);
        auditLogger.logDeleteWorkflow(workflow.id, workflow.name);
        allWorkflows = WorkflowModel.getAll();
        filterWorkflows(currentFilter, searchInput.value);
      }
    });

    return card;
  }

  addStyles();
  return container;
}

function addStyles() {
  if (!document.getElementById('workflows-page-styles')) {
    const style = document.createElement('style');
    style.id = 'workflows-page-styles';
    style.textContent = `
      .workflows-page {
        padding: var(--spacing-xl);
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: var(--spacing-xl);
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: start;
      }

      .page-header h2 {
        margin: 0 0 var(--spacing-xs) 0;
        font-size: 1.875rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stats-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        background: white;
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg);
        transition: all 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .stat-card.success {
        border-color: var(--success-color);
      }

      .stat-card.warning {
        border-color: var(--warning-color);
      }

      .stat-card.info {
        border-color: var(--info-color);
      }

      .stat-icon {
        font-size: 2rem;
      }

      .stat-content {
        flex: 1;
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xs);
      }

      .stat-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: var(--primary-color);
      }

      .filter-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
        padding: var(--spacing-md);
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }

      .filter-tabs {
        display: flex;
        gap: var(--spacing-sm);
      }

      .filter-tab {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        background: white;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
        transition: all 0.2s;
      }

      .filter-tab:hover {
        background: var(--bg-secondary);
        border-color: var(--primary-color);
      }

      .filter-tab.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .search-box {
        flex: 1;
        max-width: 400px;
      }

      .workflows-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: var(--spacing-lg);
      }

      .workflow-card {
        background: white;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition: all 0.2s;
      }

      .workflow-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary-color);
      }

      .workflow-card-header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-secondary);
      }

      .workflow-title {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
      }

      .workflow-title h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        flex: 1;
      }

      .workflow-status {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .workflow-description {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .workflow-card-body {
        padding: var(--spacing-lg);
      }

      .workflow-stats {
        display: flex;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
      }

      .workflow-stat {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .workflow-meta {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .meta-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8125rem;
      }

      .meta-label {
        color: var(--text-tertiary);
      }

      .meta-value {
        color: var(--text-secondary);
        font-family: monospace;
      }

      .workflow-card-footer {
        display: flex;
        gap: var(--spacing-sm);
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
      }

      .workflow-card-footer button {
        flex: 1;
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: white;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.15s;
      }

      .btn-primary {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .btn-primary:hover {
        background: var(--primary-hover);
      }

      .btn-secondary {
        color: var(--text-secondary);
      }

      .btn-secondary:hover {
        background: var(--bg-tertiary);
        border-color: var(--primary-color);
      }

      .btn-danger {
        color: var(--error-color);
        border-color: var(--error-light);
      }

      .btn-danger:hover {
        background: var(--error-light);
        border-color: var(--error-color);
      }

      .empty-state {
        text-align: center;
        padding: calc(var(--spacing-xl) * 3);
        background: white;
        border-radius: var(--radius-lg);
        border: 2px dashed var(--border-color);
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
      }

      .empty-state h3 {
        font-size: 1.25rem;
        color: var(--text-primary);
        margin: 0 0 var(--spacing-sm) 0;
      }

      .empty-state p {
        color: var(--text-secondary);
        margin: 0;
      }
    `;
    document.head.appendChild(style);
  }
}
