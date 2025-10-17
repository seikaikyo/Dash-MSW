import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Modal } from '../components/common/Modal.js';
import { FormInstanceModel } from '../utils/dataModel.js';
import { auditLogger } from '../utils/auditLogger.js';
import { stationManager, STATION_TYPES } from '../modules/station/stationModel.js';
import { getWorkOrderChangeHistory } from '../utils/workOrderLock.js';

/**
 * 工單管理頁面
 * 根據柳營再生濾網系統 MES 製程管理需求設計
 */
export function FormsPage() {
  const container = document.createElement('div');
  container.className = 'forms-page';

  // 檢查 URL 參數是否有指定工單 ID
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const workOrderId = urlParams.get('id');

  // 如果有指定工單 ID,顯示該工單的詳細頁面
  if (workOrderId) {
    const allWorkOrders = FormInstanceModel.getAll();
    const workOrder = allWorkOrders.find(wo => wo.id === workOrderId);

    if (workOrder) {
      return renderWorkOrderDetailPage(workOrder);
    } else {
      // 如果找不到工單,顯示錯誤並返回列表
      alert('❌ 找不到指定的工單');
      window.location.hash = '#/forms';
      return container;
    }
  }

  let allWorkOrders = FormInstanceModel.getAll();
  let filteredWorkOrders = [...allWorkOrders];
  let currentStatusFilter = 'all';
  let currentSearchKeyword = '';
  let currentViewMode = 'list'; // 'list' 或 'card'

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header flex justify-between items-center';

  const headerLeft = document.createElement('div');
  headerLeft.innerHTML = `
    <h2>📝 工單管理</h2>
    <p class="text-secondary">再生濾網製程工單追蹤與管理</p>
  `;

  const headerRight = document.createElement('div');
  const createBtn = new Button({
    text: '+ 建立工單',
    variant: 'primary',
    onClick: () => {
      // 使用 RecipeBuilderPage 來建立工單實例
      // 這會載入柳營再生濾網的欄位配置
      window.location.hash = '#/apply';
    }
  });
  headerRight.appendChild(createBtn.render());

  header.appendChild(headerLeft);
  header.appendChild(headerRight);
  container.appendChild(header);

  // 搜尋與篩選欄
  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" id="search-input" class="search-input" placeholder="搜尋工單編號、批次號或來源廠別..." />
    <select id="status-filter" class="status-filter">
      <option value="all">全部狀態</option>
      <option value="pending">待處理</option>
      <option value="in_progress">進行中</option>
      <option value="paused">暫停</option>
      <option value="completed">已完成</option>
      <option value="rejected">已退回</option>
    </select>
    <div class="view-toggle">
      <button class="view-btn active" data-view="list" title="清單視圖">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="2" y="3" width="12" height="2"></rect>
          <rect x="2" y="7" width="12" height="2"></rect>
          <rect x="2" y="11" width="12" height="2"></rect>
        </svg>
      </button>
      <button class="view-btn" data-view="card" title="卡片視圖">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="2" y="2" width="5" height="5"></rect>
          <rect x="9" y="2" width="5" height="5"></rect>
          <rect x="2" y="9" width="5" height="5"></rect>
          <rect x="9" y="9" width="5" height="5"></rect>
        </svg>
      </button>
    </div>
  `;
  container.appendChild(filterBar);

  // 統計卡片
  const statsSection = document.createElement('div');
  statsSection.className = 'stats-section';
  statsSection.id = 'stats-section';
  container.appendChild(statsSection);

  // 工單列表
  const workOrdersList = document.createElement('div');
  workOrdersList.className = 'work-orders-list';
  workOrdersList.id = 'work-orders-list';
  container.appendChild(workOrdersList);

  // 綁定事件
  const searchInput = filterBar.querySelector('#search-input');
  searchInput.addEventListener('input', (e) => {
    currentSearchKeyword = e.target.value;
    filterAndRender();
  });

  const statusFilter = filterBar.querySelector('#status-filter');
  statusFilter.addEventListener('change', (e) => {
    currentStatusFilter = e.target.value;
    filterAndRender();
  });

  // 視圖切換按鈕
  const viewBtns = filterBar.querySelectorAll('.view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentViewMode = btn.dataset.view;
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderWorkOrdersList();
    });
  });

  renderStats();
  renderWorkOrdersList();

  // ========== 功能函數 ==========

  function filterAndRender() {
    // 狀態篩選
    if (currentStatusFilter !== 'all') {
      filteredWorkOrders = allWorkOrders.filter(wo => wo.status === currentStatusFilter);
    } else {
      filteredWorkOrders = [...allWorkOrders];
    }

    // 關鍵字搜尋
    if (currentSearchKeyword) {
      const keyword = currentSearchKeyword.toLowerCase();
      filteredWorkOrders = filteredWorkOrders.filter(wo => {
        const workOrderNo = wo.data.workOrderNo || '';
        const batchNo = wo.data.batchNo || '';
        const sourceFactory = wo.data.sourceFactory || '';
        return workOrderNo.toLowerCase().includes(keyword) ||
               batchNo.toLowerCase().includes(keyword) ||
               sourceFactory.toLowerCase().includes(keyword);
      });
    }

    renderStats();
    renderWorkOrdersList();
  }

  function renderStats() {
    const statsSection = container.querySelector('#stats-section');

    // 統計數據
    const total = allWorkOrders.length;
    const pending = allWorkOrders.filter(wo => wo.status === 'pending').length;
    const inProgress = allWorkOrders.filter(wo => wo.status === 'in_progress').length;
    const completed = allWorkOrders.filter(wo => wo.status === 'completed' || wo.status === 'approved').length;
    const rejected = allWorkOrders.filter(wo => wo.status === 'rejected').length;

    statsSection.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">${total}</div>
            <div class="stat-label">總工單數</div>
          </div>
        </div>
        <div class="stat-card stat-pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-value">${pending}</div>
            <div class="stat-label">待處理</div>
          </div>
        </div>
        <div class="stat-card stat-progress">
          <div class="stat-icon">⚙️</div>
          <div class="stat-content">
            <div class="stat-value">${inProgress}</div>
            <div class="stat-label">進行中</div>
          </div>
        </div>
        <div class="stat-card stat-completed">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">${completed}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
        <div class="stat-card stat-rejected">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <div class="stat-value">${rejected}</div>
            <div class="stat-label">已退回</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderWorkOrdersList() {
    const workOrdersList = container.querySelector('#work-orders-list');

    if (filteredWorkOrders.length === 0) {
      workOrdersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>${allWorkOrders.length === 0 ? '尚未建立任何工單' : '沒有符合條件的工單'}</h3>
          <p>${allWorkOrders.length === 0 ? '點選右上角「建立工單」開始建立第一個工單' : '請嘗試其他搜尋或篩選條件'}</p>
        </div>
      `;
      return;
    }

    workOrdersList.innerHTML = '';

    if (currentViewMode === 'list') {
      // 清單視圖
      const table = createWorkOrdersTable(filteredWorkOrders);
      workOrdersList.appendChild(table);
    } else {
      // 卡片視圖
      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'work-orders-grid';

      filteredWorkOrders.forEach(workOrder => {
        const card = createWorkOrderCard(workOrder);
        cardsContainer.appendChild(card);
      });

      workOrdersList.appendChild(cardsContainer);
    }
  }

  function createWorkOrdersTable(workOrders) {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';

    const statusConfig = {
      pending: { label: '待處理', color: '#9ca3af', icon: '⏳' },
      in_progress: { label: '進行中', color: '#3b82f6', icon: '⚙️' },
      paused: { label: '暫停', color: '#f59e0b', icon: '⏸️' },
      completed: { label: '已完成', color: '#10b981', icon: '✅' },
      approved: { label: '已核准', color: '#10b981', icon: '✅' },
      rejected: { label: '已退回', color: '#ef4444', icon: '❌' }
    };

    const rows = workOrders.map(wo => {
      const status = statusConfig[wo.status] || statusConfig.pending;
      const workOrderNo = wo.data.workOrderNo || '-';
      const batchNo = wo.data.batchNo || '-';
      const sourceFactory = wo.data.sourceFactory || '-';
      const filterType = wo.data.filterType || '-';
      const quantity = wo.data.quantity || 0;
      const regenerationCycle = wo.data.regenerationCycle || 'R0';

      return `
        <tr>
          <td>
            <div class="table-wo-no">${workOrderNo}</div>
            <div class="table-batch-no">${batchNo}</div>
          </td>
          <td>${sourceFactory}</td>
          <td>${filterType}</td>
          <td>${quantity} 片</td>
          <td>${regenerationCycle}</td>
          <td>
            <span class="table-status-badge" style="background: ${status.color}20; color: ${status.color};">
              ${status.icon} ${status.label}
            </span>
          </td>
          <td>${new Date(wo.createdAt).toLocaleDateString('zh-TW')}</td>
          <td class="table-actions">
            <button class="btn-table btn-detail" data-id="${wo.id}">詳情</button>
            <button class="btn-table btn-edit" data-id="${wo.id}">編輯</button>
          </td>
        </tr>
      `;
    }).join('');

    tableContainer.innerHTML = `
      <table class="work-orders-table">
        <thead>
          <tr>
            <th>工單編號</th>
            <th>來源廠別</th>
            <th>濾網類型</th>
            <th>數量</th>
            <th>再生次數</th>
            <th>狀態</th>
            <th>建立時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    // 綁定按鈕事件
    tableContainer.querySelectorAll('.btn-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const woId = btn.dataset.id;
        const workOrder = workOrders.find(w => w.id === woId);
        if (workOrder) showWorkOrderDetail(workOrder);
      });
    });

    tableContainer.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.hash = `#/apply?id=${btn.dataset.id}`;
      });
    });

    return tableContainer;
  }

  function createWorkOrderCard(workOrder) {
    const card = document.createElement('div');
    card.className = 'work-order-card';

    // 取得工單資料
    const workOrderNo = workOrder.data.workOrderNo || '-';
    const batchNo = workOrder.data.batchNo || '-';
    const sourceFactory = workOrder.data.sourceFactory || '-';
    const filterType = workOrder.data.filterType || '-';
    const quantity = workOrder.data.quantity || 0;
    const regenerationCycle = workOrder.data.regenerationCycle || 'R0';

    // 狀態顯示
    const statusConfig = {
      pending: { label: '待處理', color: '#9ca3af', icon: '⏳' },
      in_progress: { label: '進行中', color: '#3b82f6', icon: '⚙️' },
      paused: { label: '暫停', color: '#f59e0b', icon: '⏸️' },
      completed: { label: '已完成', color: '#10b981', icon: '✅' },
      approved: { label: '已核准', color: '#10b981', icon: '✅' },
      rejected: { label: '已退回', color: '#ef4444', icon: '❌' }
    };
    const status = statusConfig[workOrder.status] || statusConfig.pending;

    // 計算進度（基於8個站點）
    const processSteps = ['除膠', '烘箱', 'OQC-釋氣', 'OQC-AOI', 'RFID', '包裝', '入庫', '出貨'];
    const currentStep = Math.floor(Math.random() * 8); // 暫時隨機，後續應該從實際數據計算
    const progress = Math.round((currentStep / processSteps.length) * 100);

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">
          <div class="work-order-no">${workOrderNo}</div>
          <div class="batch-no">批次: ${batchNo}</div>
        </div>
        <div class="card-status" style="background: ${status.color}20; color: ${status.color};">
          ${status.icon} ${status.label}
        </div>
      </div>

      <div class="card-body">
        <div class="card-info-grid">
          <div class="info-item">
            <span class="info-label">來源廠別</span>
            <span class="info-value">${sourceFactory}</span>
          </div>
          <div class="info-item">
            <span class="info-label">濾網類型</span>
            <span class="info-value">${filterType}</span>
          </div>
          <div class="info-item">
            <span class="info-label">數量</span>
            <span class="info-value">${quantity} 片</span>
          </div>
          <div class="info-item">
            <span class="info-label">再生次數</span>
            <span class="info-value">${regenerationCycle}</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">製程進度</span>
            <span class="progress-value">${progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%; background: ${status.color};"></div>
          </div>
          <div class="progress-steps">
            當前站點: <strong>${processSteps[currentStep]}</strong>
          </div>
        </div>

        <div class="card-footer">
          <span class="created-time">建立時間: ${new Date(workOrder.createdAt).toLocaleString('zh-TW')}</span>
          <div class="card-actions">
            <button class="btn-card btn-detail" data-id="${workOrder.id}">詳情</button>
            <button class="btn-card btn-edit" data-id="${workOrder.id}">編輯</button>
          </div>
        </div>
      </div>
    `;

    // 綁定按鈕事件
    const detailBtn = card.querySelector('.btn-detail');
    detailBtn.addEventListener('click', () => showWorkOrderDetail(workOrder));

    const editBtn = card.querySelector('.btn-edit');
    editBtn.addEventListener('click', () => {
      // 編輯工單實例
      window.location.hash = `#/apply?id=${workOrder.id}`;
    });

    return card;
  }

  function showWorkOrderDetail(workOrder) {
    // 導航到工單詳細頁面而非打開 Modal
    window.location.hash = `#/forms?id=${workOrder.id}`;
  }

  addStyles();
  return container;
}

/**
 * 建立工單詳細內容 (共用函數)
 */
function createWorkOrderDetailContent(workOrder) {
  const div = document.createElement('div');
  div.className = 'work-order-detail';

  // 基本資訊
  const basicInfo = `
    <div class="detail-section">
      <h4>📋 基本資訊</h4>
      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">工單編號</span>
          <span class="detail-value">${workOrder.data.workOrderNo || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">批次號</span>
          <span class="detail-value">${workOrder.data.batchNo || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">來源廠別</span>
          <span class="detail-value">${workOrder.data.sourceFactory || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">濾網類型</span>
          <span class="detail-value">${workOrder.data.filterType || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">數量</span>
          <span class="detail-value">${workOrder.data.quantity || 0} 片</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">再生次數</span>
          <span class="detail-value">${workOrder.data.regenerationCycle || 'R0'}</span>
        </div>
      </div>
    </div>
  `;

  // 製程站點資訊
  const processInfo = `
    <div class="detail-section">
      <h4>🏭 製程站點</h4>
      <div class="process-timeline">
        <div class="timeline-item">
          <div class="timeline-icon">🧪</div>
          <div class="timeline-content">
            <div class="timeline-title">除膠站點</div>
            <div class="timeline-detail">作業人員: ${workOrder.data.deglueOperator || '-'}</div>
            <div class="timeline-detail">完成時間: ${workOrder.data.deglueEndTime || '進行中'}</div>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">🔥</div>
          <div class="timeline-content">
            <div class="timeline-title">烘箱處理</div>
            <div class="timeline-detail">烘箱編號: ${workOrder.data.ovenId || '-'}</div>
            <div class="timeline-detail">目標溫度: ${workOrder.data.targetTemp || '-'}°C</div>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-icon">🔬</div>
          <div class="timeline-content">
            <div class="timeline-title">OQC 檢驗</div>
            <div class="timeline-detail">釋氣檢測: ${workOrder.data.degassingTest || '待檢驗'}</div>
            <div class="timeline-detail">AOI 檢測: ${workOrder.data.aoiResult || '待檢驗'}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 品質與能源資訊
  const qualityInfo = `
    <div class="detail-section">
      <h4>🏆 品質標準</h4>
      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">品質等級</span>
          <span class="detail-value">${workOrder.data.qualityGrade || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">過濾效率</span>
          <span class="detail-value">${workOrder.data.filterEfficiency || '-'}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">預期壽命</span>
          <span class="detail-value">${workOrder.data.expectedLifespan || '-'} 月</span>
        </div>
      </div>
    </div>
    <div class="detail-section">
      <h4>⚡ 能源數據</h4>
      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">烘箱耗電</span>
          <span class="detail-value">${workOrder.data.ovenEnergyConsumption || '-'} kWh</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">總能源成本</span>
          <span class="detail-value">${workOrder.data.totalEnergyCost || '-'} 元</span>
        </div>
      </div>
    </div>
  `;

  // 變更歷史
  const changeHistory = getWorkOrderChangeHistory(workOrder.id);
  let changeHistoryHTML = '';

  if (changeHistory && changeHistory.length > 0) {
    const historyItems = changeHistory.map((record, index) => {
      const fieldNames = {
        batchNo: '批次號',
        sourceFactory: '來源廠別',
        filterType: '濾網類型',
        quantity: '數量',
        regenerationCycle: '再生次數',
        deglueStartTime: '除膠開始時間',
        deglueEndTime: '除膠完成時間'
      };

      const changesHTML = Object.keys(record.changes).map(field => {
        const fieldName = fieldNames[field] || field;
        const { old: oldValue, new: newValue } = record.changes[field];
        return `
          <div class="change-field">
            <span class="field-name">${fieldName}：</span>
            <span class="old-value">${oldValue || '(空值)'}</span>
            <span class="arrow">→</span>
            <span class="new-value">${newValue}</span>
          </div>
        `;
      }).join('');

      const date = new Date(record.timestamp);
      const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      return `
        <div class="history-item">
          <div class="history-header">
            <span class="history-number">#${changeHistory.length - index}</span>
            <span class="history-time">${formattedDate}</span>
          </div>
          <div class="history-meta">
            <span>審核人：<strong>${record.changedBy}</strong></span>
            ${record.reason ? `<span class="history-reason">原因：${record.reason}</span>` : ''}
          </div>
          <div class="history-changes">
            ${changesHTML}
          </div>
        </div>
      `;
    }).join('');

    changeHistoryHTML = `
      <div class="detail-section">
        <h4>📜 變更歷史</h4>
        <div class="change-history-list">
          ${historyItems}
        </div>
      </div>
    `;
  }

  div.innerHTML = basicInfo + processInfo + qualityInfo + changeHistoryHTML;
  return div;
}

/**
 * 渲染工單詳細頁面 (完整頁面,非 Modal)
 */
function renderWorkOrderDetailPage(workOrder) {
  const container = document.createElement('div');
  container.className = 'forms-page work-order-detail-page';

  // 頁首 - 包含返回按鈕
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div class="detail-page-header">
      <button class="btn-back" id="btn-back-to-list">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0L1 8l7 8V0z" transform="rotate(180 8 8)"/>
        </svg>
        返回工單列表
      </button>
      <div class="detail-page-title">
        <h2>📋 工單詳情</h2>
        <p class="text-secondary">${workOrder.data.workOrderNo || workOrder.applicationNo}</p>
      </div>
      <button class="btn-edit-wo" id="btn-edit-wo">
        ✏️ 編輯工單
      </button>
    </div>
  `;
  container.appendChild(header);

  // 工單詳細內容
  const detailContent = createWorkOrderDetailContent(workOrder);
  detailContent.classList.add('detail-page-content');
  container.appendChild(detailContent);

  // 綁定返回按鈕事件
  setTimeout(() => {
    const backBtn = container.querySelector('#btn-back-to-list');
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/forms';
    });

    const editBtn = container.querySelector('#btn-edit-wo');
    editBtn.addEventListener('click', () => {
      window.location.hash = `#/apply?id=${workOrder.id}`;
    });
  }, 0);

  addStyles();
  return container;
}

function addStyles() {
  if (!document.getElementById('forms-page-styles')) {
    const style = document.createElement('style');
    style.id = 'forms-page-styles';
    style.textContent = `
      .forms-page {
        padding: var(--spacing-xl);
      }

      /* 篩選欄 */
      .filter-bar {
        display: flex;
        gap: var(--spacing-md);
        margin-top: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
        align-items: center;
      }

      .search-input,
      .status-filter {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-family: var(--font-family);
      }

      .search-input {
        flex: 1;
        min-width: 200px;
      }

      .status-filter {
        min-width: 150px;
      }

      /* 視圖切換 */
      .view-toggle {
        display: flex;
        gap: 4px;
        background: var(--bg-secondary);
        padding: 4px;
        border-radius: var(--radius-md);
      }

      .view-btn {
        padding: 6px 10px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        color: var(--text-secondary);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .view-btn:hover {
        background: white;
        color: var(--text-primary);
      }

      .view-btn.active {
        background: var(--primary-color);
        color: white;
      }

      /* 統計卡片 */
      .stats-section {
        margin-bottom: var(--spacing-xl);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--spacing-lg);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .stat-card.stat-pending {
        border-color: #9ca3af;
      }

      .stat-card.stat-progress {
        border-color: #3b82f6;
      }

      .stat-card.stat-completed {
        border-color: #10b981;
      }

      .stat-card.stat-rejected {
        border-color: #ef4444;
      }

      .stat-icon {
        font-size: 2rem;
      }

      .stat-content {
        flex: 1;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-top: 4px;
      }

      /* 工單列表 */
      .work-orders-list {
        min-height: 400px;
      }

      .work-orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: var(--spacing-lg);
      }

      /* 工單卡片 */
      .work-order-card {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        transition: all 0.2s;
      }

      .work-order-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--primary-color);
      }

      .card-header {
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        background: var(--bg-secondary);
      }

      .card-title .work-order-no {
        font-size: 1rem;
        font-weight: 600;
        color: var(--primary-color);
        margin-bottom: 4px;
      }

      .card-title .batch-no {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .card-status {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-md);
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .card-body {
        padding: var(--spacing-md);
      }

      .card-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .info-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .info-value {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      /* 進度條 */
      .progress-section {
        margin-bottom: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border-color);
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
      }

      .progress-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .progress-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--primary-color);
      }

      .progress-bar {
        height: 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: var(--spacing-sm);
      }

      .progress-fill {
        height: 100%;
        transition: width 0.3s;
        border-radius: 4px;
      }

      .progress-steps {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .progress-steps strong {
        color: var(--text-primary);
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border-color);
      }

      .created-time {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .card-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      .btn-card {
        padding: var(--spacing-xs) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--bg-color);
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-card.btn-detail:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .btn-card.btn-edit:hover {
        background: var(--bg-secondary);
        border-color: var(--primary-color);
      }

      /* 空狀態 */
      .empty-state {
        text-align: center;
        padding: calc(var(--spacing-xl) * 3);
        background: var(--bg-color);
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
        margin-bottom: var(--spacing-sm);
      }

      .empty-state p {
        color: var(--text-secondary);
      }

      /* 工單詳情 Modal */
      .work-order-detail {
        max-height: 70vh;
        overflow-y: auto;
      }

      .detail-section {
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .detail-section h4 {
        margin: 0 0 var(--spacing-md) 0;
        color: var(--text-primary);
        font-size: 1rem;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--spacing-sm);
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-xs) 0;
        border-bottom: 1px solid var(--border-color);
      }

      .detail-row:last-child {
        border-bottom: none;
      }

      .detail-label {
        font-weight: 500;
        color: var(--text-secondary);
      }

      .detail-value {
        font-weight: 600;
        color: var(--text-primary);
      }

      /* 製程時間軸 */
      .process-timeline {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .timeline-item {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-sm);
        background: var(--bg-color);
        border-radius: var(--radius-md);
        border-left: 3px solid var(--primary-color);
      }

      .timeline-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .timeline-content {
        flex: 1;
      }

      .timeline-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .timeline-detail {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: 2px;
      }

      /* 變更歷史 */
      .change-history-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .history-item {
        padding: var(--spacing-md);
        background: var(--bg-color);
        border-radius: var(--radius-md);
        border-left: 4px solid #f59e0b;
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
      }

      .history-number {
        font-weight: 700;
        color: var(--primary-color);
        font-size: 0.875rem;
      }

      .history-time {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .history-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: var(--spacing-sm);
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .history-meta strong {
        color: var(--text-primary);
      }

      .history-reason {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: #fffbeb;
        border-left: 3px solid #f59e0b;
        border-radius: 4px;
        font-size: 0.8125rem;
        margin-top: 4px;
      }

      .history-changes {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        padding-top: var(--spacing-sm);
        border-top: 1px solid var(--border-color);
      }

      .change-field {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: 0.875rem;
      }

      .field-name {
        font-weight: 600;
        color: var(--text-primary);
        min-width: 100px;
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

      /* 清單視圖 - 表格 */
      .table-container {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
      }

      .work-orders-table {
        width: 100%;
        border-collapse: collapse;
      }

      .work-orders-table thead {
        background: var(--bg-secondary);
      }

      .work-orders-table th {
        padding: var(--spacing-md);
        text-align: left;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        border-bottom: 2px solid var(--border-color);
        white-space: nowrap;
      }

      .work-orders-table tbody tr {
        transition: background 0.2s;
        border-bottom: 1px solid var(--border-color);
      }

      .work-orders-table tbody tr:hover {
        background: var(--bg-secondary);
      }

      .work-orders-table tbody tr:last-child {
        border-bottom: none;
      }

      .work-orders-table td {
        padding: var(--spacing-md);
        font-size: 0.875rem;
        color: var(--text-primary);
        vertical-align: middle;
      }

      .table-wo-no {
        font-weight: 600;
        color: var(--primary-color);
        margin-bottom: 2px;
      }

      .table-batch-no {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .table-status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      }

      .table-actions {
        display: flex;
        gap: var(--spacing-xs);
      }

      .btn-table {
        padding: 4px 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background: var(--bg-color);
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .btn-table.btn-detail:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .btn-table.btn-edit:hover {
        background: var(--bg-secondary);
        border-color: var(--primary-color);
      }

      /* 工單詳細頁面 */
      .work-order-detail-page {
        padding: var(--spacing-xl);
        max-width: 1200px;
        margin: 0 auto;
      }

      .detail-page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
      }

      .detail-page-title {
        flex: 1;
      }

      .detail-page-title h2 {
        margin: 0 0 var(--spacing-xs) 0;
      }

      .btn-back {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--bg-color);
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-back:hover {
        background: var(--bg-secondary);
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .btn-back svg {
        width: 14px;
        height: 14px;
      }

      .btn-edit-wo {
        padding: var(--spacing-sm) var(--spacing-lg);
        border: 1px solid var(--primary-color);
        border-radius: var(--radius-md);
        background: var(--primary-color);
        color: white;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .btn-edit-wo:hover {
        background: var(--primary-dark);
        border-color: var(--primary-dark);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      .detail-page-content {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        box-shadow: var(--shadow-sm);
      }

      .detail-page-content .detail-section {
        margin-bottom: var(--spacing-xl);
        padding: var(--spacing-lg);
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
      }

      .detail-page-content .detail-section:last-child {
        margin-bottom: 0;
      }
    `;
    document.head.appendChild(style);
  }
}
