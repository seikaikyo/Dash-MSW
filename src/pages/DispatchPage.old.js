/**
 * 生管派工頁面
 * 供作業員選擇工單進入站點作業
 */

import { FormInstanceModel } from '../utils/dataModel.js';
import { userContext } from '../utils/userContext.js';
import { stationManager } from '../modules/station/stationModel.js';

export function DispatchPage() {
  const container = document.createElement('div');
  container.className = 'dispatch-page';

  const currentUser = userContext.getCurrentUser();

  if (!currentUser) {
    container.innerHTML = `
      <div class="error-message">
        <h2>未登入</h2>
        <p>請先登入系統。</p>
      </div>
    `;
    addStyles();
    return container;
  }

  // 取得分配給當前用戶的站點
  const assignedStations = userContext.getAssignedStations();

  if (assignedStations.length === 0) {
    container.innerHTML = `
      <div class="error-message">
        <h2>⚠️ 無站點權限</h2>
        <p>您尚未被分配到任何站點。</p>
        <p>請聯絡管理員分配站點權限。</p>
      </div>
    `;
    addStyles();
    return container;
  }

  // 頁首
  const header = document.createElement('div');
  header.className = 'dispatch-header';
  header.innerHTML = `
    <div class="header-content">
      <div>
        <h1>🏭 生管派工</h1>
        <p class="subtitle">選擇工單進入站點作業</p>
      </div>
      <div class="user-info">
        <span class="user-name">${currentUser.name}</span>
        <span class="user-id">${currentUser.employeeId}</span>
      </div>
    </div>
  `;
  container.appendChild(header);

  // 站點選擇區
  const stationSelector = createStationSelector(assignedStations);
  container.appendChild(stationSelector);

  // 工單列表區
  const workOrderListContainer = document.createElement('div');
  workOrderListContainer.id = 'work-order-list-container';
  workOrderListContainer.className = 'work-order-list-container';
  container.appendChild(workOrderListContainer);

  // 初始顯示第一個站點的工單
  if (assignedStations.length > 0) {
    const stationId = assignedStations[0];
    renderWorkOrderList(stationId, workOrderListContainer);
  }

  addStyles();
  return container;
}

/**
 * 建立站點選擇器
 */
function createStationSelector(assignedStations) {
  const container = document.createElement('div');
  container.className = 'station-selector-container';

  const stationButtons = assignedStations.map(stationId => {
    const station = stationManager.getStation(stationId);
    if (!station) return '';

    return `
      <button class="station-btn" data-station-id="${stationId}">
        <div class="station-icon">${getStationIcon(station.type)}</div>
        <div class="station-name">${station.name}</div>
        <div class="station-location">${station.location}</div>
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <h3 class="section-title">選擇作業站點</h3>
    <div class="station-buttons">
      ${stationButtons}
    </div>
  `;

  // 綁定按鈕事件
  setTimeout(() => {
    const buttons = container.querySelectorAll('.station-btn');
    buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        // 移除所有active狀態
        buttons.forEach(b => b.classList.remove('active'));
        // 加入active狀態到當前按鈕
        btn.classList.add('active');

        const stationId = btn.dataset.stationId;
        const listContainer = document.getElementById('work-order-list-container');
        renderWorkOrderList(stationId, listContainer);
      });

      // 第一個按鈕預設為active
      if (index === 0) {
        btn.classList.add('active');
      }
    });
  }, 0);

  return container;
}

/**
 * 渲染工單列表
 */
function renderWorkOrderList(stationId, container) {
  const station = stationManager.getStation(stationId);
  if (!station) {
    container.innerHTML = '<p>找不到站點資訊</p>';
    return;
  }

  // 取得適合此站點的工單（依站點類型篩選）
  const workOrders = getWorkOrdersForStation(station);

  container.innerHTML = `
    <h3 class="section-title">
      ${getStationIcon(station.type)} ${station.name} - 待處理工單
      <span class="count-badge">${workOrders.length}</span>
    </h3>
    <div class="work-order-cards">
      ${workOrders.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>目前沒有待處理的工單</p>
        </div>
      ` : workOrders.map(wo => createWorkOrderCard(wo, station)).join('')}
    </div>
  `;

  // 綁定卡片點擊事件
  setTimeout(() => {
    const cards = container.querySelectorAll('.wo-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const workOrderId = card.dataset.workOrderId;
        const workOrderNo = card.dataset.workOrderNo;
        // 跳轉到站點作業頁面，帶上工單號
        window.location.href = `#/station-work?stationId=${stationId}&workOrderNo=${workOrderNo}`;
      });
    });
  }, 0);
}

/**
 * 根據站點類型篩選工單
 */
function getWorkOrdersForStation(station) {
  const allWorkOrders = FormInstanceModel.getAll();

  // 依不同站點類型篩選不同狀態的工單
  switch (station.type) {
    case 'degum':
      // 除膠站：顯示所有待處理和進行中的工單
      return allWorkOrders.filter(wo =>
        (wo.status === 'pending' || wo.status === 'in_progress') &&
        !wo.data.deglueEndTime
      );

    case 'oven':
      // 烘箱站：已完成除膠但未完成烘箱的工單
      return allWorkOrders.filter(wo =>
        wo.data.deglueEndTime &&
        !wo.data.ovenEndTime
      );

    case 'oqc_release':
      // OQC-釋氣：已完成烘箱但未完成釋氣檢測的工單
      return allWorkOrders.filter(wo =>
        wo.data.ovenEndTime &&
        (!wo.data.degassingTest || wo.data.degassingTest === '未檢測')
      );

    case 'oqc_aoi':
      // OQC-AOI：已完成釋氣檢測但未完成AOI檢測的工單
      return allWorkOrders.filter(wo =>
        wo.data.degassingTest === '合格' &&
        (!wo.data.aoiResult || wo.data.aoiResult === '未檢測')
      );

    case 'rfid':
      // RFID站：已通過OQC但未更換RFID的工單
      return allWorkOrders.filter(wo =>
        wo.data.degassingTest === '合格' &&
        wo.data.aoiResult === 'OK' &&
        (!wo.data.rfidUpdate || wo.data.rfidUpdate === '未更換')
      );

    case 'packaging':
      // 包裝站：已更換RFID但未包裝的工單
      return allWorkOrders.filter(wo =>
        wo.data.rfidUpdate === '已更換' &&
        !wo.data.packagingTime
      );

    case 'warehouse_in':
      // 入庫站：已包裝但未入庫的工單
      return allWorkOrders.filter(wo =>
        wo.data.packagingTime &&
        !wo.data.warehouseInTime
      );

    case 'warehouse_out':
      // 出庫站：已入庫但未出庫的工單
      return allWorkOrders.filter(wo =>
        wo.data.warehouseInTime &&
        !wo.data.outboundTime
      );

    default:
      return allWorkOrders.filter(wo => wo.status === 'pending' || wo.status === 'in_progress');
  }
}

/**
 * 建立工單卡片
 */
function createWorkOrderCard(workOrder, station) {
  const statusConfig = {
    pending: { label: '待處理', color: '#9ca3af', icon: '⏳' },
    in_progress: { label: '進行中', color: '#3b82f6', icon: '⚙️' },
    paused: { label: '暫停', color: '#f59e0b', icon: '⏸️' },
    completed: { label: '已完成', color: '#10b981', icon: '✅' },
  };

  const status = statusConfig[workOrder.status] || statusConfig.pending;

  return `
    <div class="wo-card" data-work-order-id="${workOrder.id}" data-work-order-no="${workOrder.data.workOrderNo}">
      <div class="wo-card-header">
        <div class="wo-number">${workOrder.data.workOrderNo || '-'}</div>
        <div class="wo-status" style="background: ${status.color}20; color: ${status.color};">
          ${status.icon} ${status.label}
        </div>
      </div>
      <div class="wo-card-body">
        <div class="wo-info-row">
          <span class="label">批次號</span>
          <span class="value">${workOrder.data.batchNo || '-'}</span>
        </div>
        <div class="wo-info-row">
          <span class="label">來源廠別</span>
          <span class="value">${workOrder.data.sourceFactory || '-'}</span>
        </div>
        <div class="wo-info-row">
          <span class="label">濾網類型</span>
          <span class="value">${workOrder.data.filterType || '-'}</span>
        </div>
        <div class="wo-info-row">
          <span class="label">數量</span>
          <span class="value">${workOrder.data.quantity || 0} 片</span>
        </div>
        <div class="wo-info-row">
          <span class="label">再生次數</span>
          <span class="value">${workOrder.data.regenerationCycle || 'R0'}</span>
        </div>
      </div>
      <div class="wo-card-footer">
        <span class="next-step-hint">點擊進入 ${station.name}</span>
        <span class="arrow-icon">→</span>
      </div>
    </div>
  `;
}

/**
 * 取得站點圖示
 */
function getStationIcon(stationType) {
  const icons = {
    degum: '🧪',
    oven: '🔥',
    oqc_release: '💨',
    oqc_aoi: '🔬',
    rfid: '📡',
    packaging: '📦',
    warehouse_in: '🏬',
    warehouse_out: '🚚'
  };
  return icons[stationType] || '🏭';
}

function addStyles() {
  if (document.getElementById('dispatch-page-styles')) return;

  const style = document.createElement('style');
  style.id = 'dispatch-page-styles';
  style.textContent = `
    .dispatch-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
    }

    .dispatch-header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: var(--spacing-xl) var(--spacing-xxl);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dispatch-header h1 {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .user-name {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .user-id {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .station-selector-container,
    .work-order-list-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: var(--spacing-xl) var(--spacing-xxl);
    }

    .section-title {
      margin: 0 0 var(--spacing-lg) 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 8px;
      background: var(--primary-color);
      color: white;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .station-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--spacing-lg);
    }

    .station-btn {
      padding: var(--spacing-lg);
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: center;
    }

    .station-btn:hover {
      border-color: var(--primary-color);
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
    }

    .station-btn.active {
      border-color: var(--primary-color);
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
    }

    .station-icon {
      font-size: 3rem;
      margin-bottom: var(--spacing-sm);
    }

    .station-name {
      font-weight: 700;
      font-size: 1.125rem;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .station-location {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .work-order-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-lg);
    }

    .wo-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .wo-card:hover {
      border-color: var(--primary-color);
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    }

    .wo-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) var(--spacing-lg);
      background: var(--bg-secondary);
      border-bottom: 1px solid #e5e7eb;
    }

    .wo-number {
      font-weight: 700;
      font-size: 1.125rem;
      color: var(--primary-color);
    }

    .wo-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .wo-card-body {
      padding: var(--spacing-lg);
    }

    .wo-info-row {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-xs) 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .wo-info-row:last-child {
      border-bottom: none;
    }

    .wo-info-row .label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .wo-info-row .value {
      font-size: 0.875rem;
      color: var(--text-primary);
      font-weight: 600;
    }

    .wo-card-footer {
      padding: var(--spacing-md) var(--spacing-lg);
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .next-step-hint {
      font-size: 0.875rem;
      color: var(--primary-color);
      font-weight: 600;
    }

    .arrow-icon {
      font-size: 1.25rem;
      color: var(--primary-color);
      font-weight: 700;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--spacing-xxl);
      background: white;
      border-radius: 16px;
      border: 2px dashed #e5e7eb;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: var(--spacing-md);
    }

    .empty-state p {
      color: var(--text-secondary);
      font-size: 1rem;
    }

    .error-message {
      max-width: 600px;
      margin: 100px auto;
      padding: var(--spacing-xxl);
      background: white;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .error-message h2 {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--error-color);
    }

    .error-message p {
      margin: var(--spacing-sm) 0;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .station-buttons {
        grid-template-columns: 1fr;
      }

      .work-order-cards {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}
