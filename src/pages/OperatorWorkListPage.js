/**
 * 作業員工單列表頁面
 * 顯示所有工單，點選後進入生產流程
 */

import { FormInstanceModel } from '../utils/dataModel.js';
import { userContext } from '../utils/userContext.js';
import { authService } from '../utils/authService.js';

export function OperatorWorkListPage() {
  const container = document.createElement('div');
  container.className = 'operator-worklist-page';

  const currentUser = userContext.getCurrentUser();

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="header-content">
      <div class="title-section">
        <h1>📋 工單列表</h1>
        <p class="subtitle">選擇工單開始生產作業</p>
      </div>
      <div class="user-section">
        <div class="user-info">
          <div class="user-name">${currentUser?.name || '作業員'}</div>
          <div class="user-id">${currentUser?.employeeId || ''}</div>
        </div>
        <button class="btn-logout" id="btn-logout">登出</button>
      </div>
    </div>
  `;
  container.appendChild(header);

  // 篩選區
  const filterSection = createFilterSection();
  container.appendChild(filterSection);

  // 工單卡片區
  const workOrdersSection = createWorkOrdersSection();
  container.appendChild(workOrdersSection);

  // 綁定登出事件
  setTimeout(() => {
    const logoutBtn = container.querySelector('#btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('確定要登出嗎？')) {
          authService.logout();
          window.location.reload();
        }
      });
    }
  }, 0);

  addStyles();
  return container;

  // ========== 功能函數 ==========

  /**
   * 建立篩選區
   */
  function createFilterSection() {
    const section = document.createElement('div');
    section.className = 'filter-section';

    section.innerHTML = `
      <div class="filter-container">
        <div class="filter-item">
          <label>狀態篩選</label>
          <select id="status-filter" class="filter-select">
            <option value="all">全部狀態</option>
            <option value="pending" selected>待處理</option>
            <option value="in_progress">進行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div class="filter-item">
          <label>濾網類型</label>
          <select id="type-filter" class="filter-select">
            <option value="all">全部類型</option>
            <option value="活性碳濾網">活性碳濾網</option>
            <option value="化學濾網">化學濾網</option>
            <option value="複合濾網">複合濾網</option>
            <option value="高效濾網">高效濾網</option>
          </select>
        </div>
        <div class="filter-item">
          <label>搜尋工單號</label>
          <input type="text" id="search-input" class="filter-input" placeholder="輸入工單號或批次號...">
        </div>
      </div>
    `;

    // 綁定篩選事件
    setTimeout(() => {
      const statusFilter = section.querySelector('#status-filter');
      const typeFilter = section.querySelector('#type-filter');
      const searchInput = section.querySelector('#search-input');

      const handleFilter = () => {
        const workOrdersSection = document.querySelector('.work-orders-section');
        if (workOrdersSection) {
          const newSection = createWorkOrdersSection();
          workOrdersSection.replaceWith(newSection);
        }
      };

      statusFilter.addEventListener('change', handleFilter);
      typeFilter.addEventListener('change', handleFilter);
      searchInput.addEventListener('input', handleFilter);
    }, 0);

    return section;
  }

  /**
   * 建立工單卡片區
   */
  function createWorkOrdersSection() {
    const section = document.createElement('div');
    section.className = 'work-orders-section';

    // 取得篩選條件
    const statusFilter = document.getElementById('status-filter')?.value || 'pending';
    const typeFilter = document.getElementById('type-filter')?.value || 'all';
    const searchText = document.getElementById('search-input')?.value || '';

    // 取得並篩選工單
    let workOrders = FormInstanceModel.getAll();

    // 狀態篩選
    if (statusFilter !== 'all') {
      workOrders = workOrders.filter(wo => wo.status === statusFilter);
    }

    // 類型篩選
    if (typeFilter !== 'all') {
      workOrders = workOrders.filter(wo => wo.data.filterType === typeFilter);
    }

    // 搜尋篩選
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      workOrders = workOrders.filter(wo =>
        (wo.data.workOrderNo || '').toLowerCase().includes(searchLower) ||
        (wo.data.batchNo || '').toLowerCase().includes(searchLower)
      );
    }

    // 按建立時間排序
    workOrders.sort((a, b) => b.createdAt - a.createdAt);

    if (workOrders.length === 0) {
      section.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-text">沒有符合條件的工單</div>
          <div class="empty-hint">請調整篩選條件或聯繫生管人員</div>
        </div>
      `;
      return section;
    }

    // 渲染工單卡片
    section.innerHTML = `
      <div class="work-orders-grid">
        ${workOrders.map(wo => renderWorkOrderCard(wo)).join('')}
      </div>
    `;

    // 綁定點擊事件
    setTimeout(() => {
      section.querySelectorAll('.work-order-card').forEach(card => {
        card.addEventListener('click', () => {
          const workOrderNo = card.dataset.workOrderNo;
          // 導航到站點作業頁面並帶上工單號
          window.location.href = `?workOrderNo=${encodeURIComponent(workOrderNo)}`;
        });
      });
    }, 0);

    return section;
  }

  /**
   * 渲染工單卡片
   */
  function renderWorkOrderCard(wo) {
    const statusLabels = {
      pending: '待處理',
      in_progress: '進行中',
      completed: '已完成',
      approved: '已核准'
    };

    const statusColors = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      completed: '#10b981',
      approved: '#10b981'
    };

    const status = wo.status || 'pending';
    const statusLabel = statusLabels[status] || status;
    const statusColor = statusColors[status] || '#9ca3af';

    const createdDate = new Date(wo.createdAt).toLocaleDateString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 計算進度
    let progress = 0;
    let progressText = '未開始';
    if (wo.data.deglueEndTime) progress += 25;
    if (wo.data.ovenEndTime) progress += 25;
    if (wo.data.degassingTest === '合格') progress += 25;
    if (wo.data.aoiResult === 'OK') progress += 25;

    if (progress > 0) {
      progressText = `${progress}% 完成`;
    }

    return `
      <div class="work-order-card" data-work-order-no="${wo.data.workOrderNo || wo.applicationNo}">
        <div class="card-header-section">
          <div class="work-order-no">${wo.data.workOrderNo || wo.applicationNo}</div>
          <div class="status-badge" style="background: ${statusColor}20; color: ${statusColor};">
            ${statusLabel}
          </div>
        </div>

        <div class="card-body-section">
          <div class="info-row">
            <span class="info-label">批次號</span>
            <span class="info-value">${wo.data.batchNo || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">濾網類型</span>
            <span class="info-value">${wo.data.filterType || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">數量</span>
            <span class="info-value">${wo.data.quantity || 0} 片</span>
          </div>
          <div class="info-row">
            <span class="info-label">再生次數</span>
            <span class="info-value">${wo.data.regenerationCycle || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">來源廠別</span>
            <span class="info-value">${wo.data.sourceFactory || '-'}</span>
          </div>
        </div>

        <div class="card-footer-section">
          <div class="progress-info">
            <span class="progress-text">${progressText}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
          </div>
          <div class="created-time">建立時間: ${createdDate}</div>
        </div>
      </div>
    `;
  }
}

/**
 * 樣式
 */
function addStyles() {
  if (document.getElementById('operator-worklist-styles')) return;

  const style = document.createElement('style');
  style.id = 'operator-worklist-styles';
  style.textContent = `
    .operator-worklist-page {
      min-height: 100vh;
      background: #ffffff;
    }

    /* 頁首 */
    .page-header {
      background: #3b82f6;
      padding: 24px;
      border-bottom: 3px solid #2563eb;
    }

    .header-content {
      max-width: 1600px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .title-section h1 {
      margin: 0 0 8px 0;
      font-size: 2.5rem;
      color: white;
      font-weight: 700;
    }

    .subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.95);
      font-size: 1.125rem;
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .user-info {
      text-align: right;
      padding: 12px 20px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      border: 2px solid rgba(255, 255, 255, 0.4);
    }

    .user-name {
      font-weight: 700;
      color: white;
      font-size: 1.25rem;
    }

    .user-id {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 4px;
    }

    .btn-logout {
      padding: 14px 28px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      font-size: 1.125rem;
      transition: background 0.2s;
    }

    .btn-logout:hover {
      background: #dc2626;
    }

    /* 篩選區 */
    .filter-section {
      max-width: 1600px;
      margin: 0 auto;
      padding: 24px;
    }

    .filter-container {
      background: #f8f9fa;
      padding: 20px;
      border: 2px solid #dee2e6;
      border-radius: 12px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-item label {
      font-weight: 700;
      color: #212529;
      font-size: 1.125rem;
    }

    .filter-select, .filter-input {
      padding: 14px 16px;
      border: 2px solid #adb5bd;
      border-radius: 8px;
      font-size: 1.125rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: all 0.2s;
      background: white;
    }

    .filter-select:focus, .filter-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    /* 工單區 */
    .work-orders-section {
      max-width: 1600px;
      margin: 0 auto;
      padding: 0 24px 24px;
    }

    .work-orders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 20px;
    }

    /* 工單卡片 */
    .work-order-card {
      background: white;
      border: 3px solid #495057;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      overflow: hidden;
    }

    .work-order-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .card-header-section {
      padding: 20px;
      background: #e9ecef;
      border-bottom: 3px solid #495057;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .work-order-no {
      font-size: 1.5rem;
      font-weight: 700;
      color: #212529;
      font-family: 'Courier New', monospace;
    }

    .status-badge {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
      white-space: nowrap;
      border: 2px solid currentColor;
    }

    .card-body-section {
      padding: 20px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 14px 0;
      border-bottom: 2px solid #dee2e6;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: 1.125rem;
      color: #6c757d;
      font-weight: 600;
    }

    .info-value {
      font-size: 1.25rem;
      color: #212529;
      font-weight: 700;
    }

    .card-footer-section {
      padding: 16px 20px;
      background: #f8f9fa;
      border-top: 2px solid #dee2e6;
    }

    .progress-info {
      margin-bottom: 10px;
    }

    .progress-text {
      font-size: 1rem;
      color: #495057;
      font-weight: 700;
    }

    .progress-bar {
      height: 10px;
      background: #dee2e6;
      border-radius: 5px;
      overflow: hidden;
      margin-top: 8px;
      border: 1px solid #adb5bd;
    }

    .progress-fill {
      height: 100%;
      background: #10b981;
      transition: width 0.3s ease;
    }

    .created-time {
      font-size: 0.9375rem;
      color: #6c757d;
      font-weight: 600;
    }

    /* 空狀態 */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6c757d;
    }

    .empty-icon {
      font-size: 5rem;
      margin-bottom: 20px;
    }

    .empty-text {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: #212529;
    }

    .empty-hint {
      font-size: 1.125rem;
    }

    /* RWD */
    @media (max-width: 768px) {
      .title-section h1 {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .user-section {
        width: 100%;
        justify-content: space-between;
      }

      .work-orders-grid {
        grid-template-columns: 1fr;
      }

      .filter-container {
        grid-template-columns: 1fr;
      }
    }

    /* 平板優化 */
    @media (min-width: 768px) and (max-width: 1200px) {
      .work-orders-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;

  document.head.appendChild(style);
}
