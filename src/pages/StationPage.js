import { Modal } from '../components/common/Modal.js';
import { stationManager, STATION_TYPES, STATION_STATUS } from '../modules/station/stationModel.js';
import { StationService } from '../modules/station/stationService.js';
import iotEdgeService from '../services/iotEdgeService.js';
import { STREAM_TYPE, ALERT_LEVEL } from '../services/iotEdgeService.js';
import { WorkOrderHelper } from '../utils/workOrderHelper.js';
import { userContext } from '../utils/userContext.js';

export function StationPage() {
  const container = document.createElement('div');
  container.className = 'station-page';

  let currentViewMode = 'list'; // 'list' or 'card'

  // 取得當前用戶資訊
  const currentUser = userContext.getCurrentUser();
  const isAdminOrManager = userContext.isAdminOrManager();
  const assignedStations = userContext.getAssignedStations();

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <div>
      <h2>🏭 製程站點管理</h2>
      <p class="text-secondary">監控與管理濾網再生製程中的所有工作站</p>
    </div>
    ${currentUser ? `
      <div class="user-context-info">
        <div class="user-info-badge">
          <span class="user-icon">${isAdminOrManager ? '👑' : '👤'}</span>
          <div class="user-details">
            <div class="user-name">${currentUser.name}</div>
            <div class="user-role">${currentUser.role}</div>
            ${!isAdminOrManager && assignedStations.length > 0 ? `
              <div class="user-stations">分配站點: ${assignedStations.length} 個</div>
            ` : ''}
          </div>
        </div>
      </div>
    ` : ''}
  `;
  container.appendChild(header);

  // 統計卡片區
  const statsSection = document.createElement('div');
  statsSection.className = 'stats-section';
  statsSection.id = 'stats-section';
  container.appendChild(statsSection);

  // 健康檢查區
  const healthSection = document.createElement('div');
  healthSection.className = 'health-section';
  healthSection.id = 'health-section';
  container.appendChild(healthSection);

  // IoT Edge 警報區
  const alertSection = document.createElement('div');
  alertSection.className = 'alert-section';
  alertSection.id = 'alert-section';
  container.appendChild(alertSection);

  // 站點類型概覽
  const typeOverviewSection = document.createElement('div');
  typeOverviewSection.className = 'type-overview-section';
  typeOverviewSection.innerHTML = '<h3>站點類型概覽</h3><div id="type-overview-grid" class="type-overview-grid"></div>';
  container.appendChild(typeOverviewSection);

  // 站點列表區
  const stationListSection = document.createElement('div');
  stationListSection.className = 'station-list-section';
  stationListSection.innerHTML = `
    <div class="section-header">
      <div class="header-title">
        <h3>站點列表</h3>
      </div>
      <div class="header-controls">
        <input type="text" id="station-search" class="search-input" placeholder="搜尋站點名稱或位置..." />
        <select id="station-type-filter" class="filter-select">
          <option value="all">所有類型</option>
          ${Object.values(STATION_TYPES).map(type =>
            `<option value="${type.code}">${type.name}</option>`
          ).join('')}
        </select>
        <select id="station-status-filter" class="filter-select">
          <option value="all">所有狀態</option>
          <option value="idle">閒置</option>
          <option value="running">運行中</option>
          <option value="paused">暫停</option>
          <option value="maintenance">維護中</option>
          <option value="error">故障</option>
        </select>
        <div class="view-toggle">
          <button class="view-btn ${currentViewMode === 'list' ? 'active' : ''}" data-view="list" title="清單視圖">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="2"></rect>
              <rect x="2" y="7" width="12" height="2"></rect>
              <rect x="2" y="11" width="12" height="2"></rect>
            </svg>
          </button>
          <button class="view-btn ${currentViewMode === 'card' ? 'active' : ''}" data-view="card" title="卡片視圖">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="2" width="5" height="5"></rect>
              <rect x="9" y="2" width="5" height="5"></rect>
              <rect x="2" y="9" width="5" height="5"></rect>
              <rect x="9" y="9" width="5" height="5"></rect>
            </svg>
          </button>
        </div>
        <button id="add-station-btn" class="btn-primary">+ 新增站點</button>
      </div>
    </div>
    <div id="station-list" class="${currentViewMode === 'card' ? 'stations-grid' : 'station-table-container'}"></div>
  `;
  container.appendChild(stationListSection);

  // 初始化狀態
  let currentTypeFilter = 'all';
  let currentStatusFilter = 'all';
  let currentSearchKeyword = '';

  renderStats();
  renderHealthCheck();
  renderAlerts();
  renderTypeOverview();
  renderStationList();

  // 訂閱 IoT Edge 事件
  const unsubscribeAlert = iotEdgeService.subscribe(STREAM_TYPE.ALERT, (data) => {
    console.log('Received alert:', data);
    renderAlerts();
  });

  const unsubscribeDeviceStatus = iotEdgeService.subscribe(STREAM_TYPE.DEVICE_STATUS, (data) => {
    console.log('Device status updated:', data);
    renderStats();
    renderHealthCheck();
  });

  // 清理訂閱（當頁面卸載時）
  window.addEventListener('beforeunload', () => {
    unsubscribeAlert();
    unsubscribeDeviceStatus();
  });

  // 綁定篩選事件
  const typeFilter = container.querySelector('#station-type-filter');
  typeFilter.addEventListener('change', (e) => {
    currentTypeFilter = e.target.value;
    renderStationList();
  });

  const statusFilter = container.querySelector('#station-status-filter');
  statusFilter.addEventListener('change', (e) => {
    currentStatusFilter = e.target.value;
    renderStationList();
  });

  const searchInput = container.querySelector('#station-search');
  searchInput.addEventListener('input', (e) => {
    currentSearchKeyword = e.target.value;
    renderStationList();
  });

  // 視圖切換按鈕
  container.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const newMode = e.currentTarget.dataset.view;
      if (newMode !== currentViewMode) {
        currentViewMode = newMode;
        const stationList = container.querySelector('#station-list');
        stationList.className = currentViewMode === 'card' ? 'stations-grid' : 'station-table-container';
        renderStationList();
      }
    });
  });

  // 新增站點按鈕
  const addStationBtn = container.querySelector('#add-station-btn');
  addStationBtn.addEventListener('click', () => showAddStationModal());

  addStyles();
  return container;

  // ========== 功能函數 ==========

  function renderStats() {
    const stats = stationManager.getStationStats();
    const statsSection = container.querySelector('#stats-section');

    statsSection.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏭</div>
          <div class="stat-content">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">總站點數</div>
          </div>
        </div>
        <div class="stat-card status-running">
          <div class="stat-icon">▶️</div>
          <div class="stat-content">
            <div class="stat-value">${stats.byStatus.running}</div>
            <div class="stat-label">運行中</div>
          </div>
        </div>
        <div class="stat-card status-idle">
          <div class="stat-icon">⏸️</div>
          <div class="stat-content">
            <div class="stat-value">${stats.byStatus.idle}</div>
            <div class="stat-label">閒置</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">${stats.capacity.utilization}</div>
            <div class="stat-label">整體使用率</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">${stats.performance.totalProcessed}</div>
            <div class="stat-label">總處理量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">${stats.performance.successRate}</div>
            <div class="stat-label">成功率</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderHealthCheck() {
    const health = StationService.healthCheck();
    const healthSection = container.querySelector('#health-section');

    const statusColors = {
      healthy: '#10b981',
      warning: '#f59e0b',
      critical: '#ef4444'
    };

    const statusLabels = {
      healthy: '健康',
      warning: '警告',
      critical: '嚴重'
    };

    healthSection.innerHTML = `
      <div class="health-card" style="border-color: ${statusColors[health.status]};">
        <div class="health-header">
          <h3>系統健康狀態</h3>
          <span class="health-badge" style="background: ${statusColors[health.status]}20; color: ${statusColors[health.status]};">
            ${statusLabels[health.status]}
          </span>
        </div>
        <div class="health-stats">
          <div class="health-stat">
            <span class="health-label">健康站點</span>
            <span class="health-value">${health.healthyStations} / ${health.totalStations}</span>
          </div>
          <div class="health-stat">
            <span class="health-label">問題數量</span>
            <span class="health-value">${health.issues.length}</span>
          </div>
        </div>
        ${health.issues.length > 0 ? `
          <div class="health-issues">
            <h4>問題列表</h4>
            ${health.issues.map(issue => `
              <div class="issue-item ${issue.severity}">
                <span class="issue-station">${issue.name}</span>
                <span class="issue-message">${issue.message}</span>
                <span class="issue-severity">${issue.severity === 'critical' ? '嚴重' : '警告'}</span>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-secondary">所有站點運行正常</p>'}
      </div>
    `;
  }

  function renderAlerts() {
    const alertSection = container.querySelector('#alert-section');
    const alerts = iotEdgeService.getAllAlerts({ acknowledged: false });

    if (alerts.length === 0) {
      alertSection.innerHTML = '';
      return;
    }

    const alertColors = {
      [ALERT_LEVEL.INFO]: { bg: '#e0f2fe', border: '#0284c7', text: '#0c4a6e' },
      [ALERT_LEVEL.WARNING]: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
      [ALERT_LEVEL.ERROR]: { bg: '#fee2e2', border: '#ef4444', text: '#7f1d1d' },
      [ALERT_LEVEL.CRITICAL]: { bg: '#fce7f3', border: '#ec4899', text: '#831843' }
    };

    const alertLabels = {
      [ALERT_LEVEL.INFO]: '資訊',
      [ALERT_LEVEL.WARNING]: '警告',
      [ALERT_LEVEL.ERROR]: '錯誤',
      [ALERT_LEVEL.CRITICAL]: '嚴重'
    };

    const alertIcons = {
      [ALERT_LEVEL.INFO]: 'ℹ️',
      [ALERT_LEVEL.WARNING]: '⚠️',
      [ALERT_LEVEL.ERROR]: '❌',
      [ALERT_LEVEL.CRITICAL]: '🚨'
    };

    alertSection.innerHTML = `
      <div class="alert-card">
        <div class="alert-header">
          <h3>🔔 IoT Edge 設備警報</h3>
          <span class="alert-count">${alerts.length} 個未確認警報</span>
        </div>
        <div class="alert-list">
          ${alerts.slice(0, 5).map(alert => {
            const colors = alertColors[alert.level] || alertColors[ALERT_LEVEL.INFO];
            const device = iotEdgeService.getDevice(alert.deviceId);
            const deviceName = device ? device.name : alert.deviceId;

            return `
              <div class="alert-item" style="background: ${colors.bg}; border-left-color: ${colors.border};">
                <div class="alert-icon" style="color: ${colors.border};">
                  ${alertIcons[alert.level]}
                </div>
                <div class="alert-content">
                  <div class="alert-title">
                    <span class="alert-device">${deviceName}</span>
                    <span class="alert-badge" style="background: ${colors.border}; color: white;">
                      ${alertLabels[alert.level]}
                    </span>
                  </div>
                  <div class="alert-message">${alert.message}</div>
                  <div class="alert-time">${new Date(alert.timestamp).toLocaleString('zh-TW')}</div>
                </div>
                <button class="btn-ack-alert" data-alert-id="${alert.id}" data-device-id="${alert.deviceId}">
                  確認
                </button>
              </div>
            `;
          }).join('')}
        </div>
        ${alerts.length > 5 ? `
          <div class="alert-footer">
            <button id="view-all-alerts-btn" class="btn-link">查看全部 ${alerts.length} 個警報</button>
          </div>
        ` : ''}
      </div>
    `;

    // 綁定確認按鈕事件
    alertSection.querySelectorAll('.btn-ack-alert').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const alertId = e.target.dataset.alertId;
        const deviceId = e.target.dataset.deviceId;
        handleAcknowledgeAlert(alertId, deviceId);
      });
    });

    // 綁定查看全部按鈕
    const viewAllBtn = alertSection.querySelector('#view-all-alerts-btn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', showAllAlertsModal);
    }
  }

  function renderTypeOverview() {
    const typeStats = stationManager.getStatsByType();
    const grid = container.querySelector('#type-overview-grid');

    grid.innerHTML = Object.entries(typeStats).map(([typeCode, stats]) => `
      <div class="type-card" style="border-color: ${stats.color};">
        <div class="type-icon" style="background: ${stats.color}20; color: ${stats.color};">
          ${stats.icon}
        </div>
        <div class="type-content">
          <h4>${stats.name}</h4>
          <div class="type-stats">
            <div class="type-stat">
              <span class="stat-label">站點數</span>
              <span class="stat-value">${stats.count}</span>
            </div>
            <div class="type-stat">
              <span class="stat-label">運行中</span>
              <span class="stat-value">${stats.running}</span>
            </div>
            <div class="type-stat">
              <span class="stat-label">使用率</span>
              <span class="stat-value">${stats.utilization}</span>
            </div>
          </div>
          <div class="type-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${stats.utilization}; background: ${stats.color};"></div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderStationList() {
    const stationList = container.querySelector('#station-list');
    let stations = stationManager.getAllStations();

    // 用戶權限篩選：一般員工只能看到分配的站點
    if (!isAdminOrManager && assignedStations.length > 0) {
      stations = stations.filter(s => assignedStations.includes(s.id));
    }

    // 類型篩選
    if (currentTypeFilter !== 'all') {
      stations = stations.filter(s => s.type === currentTypeFilter);
    }

    // 狀態篩選
    if (currentStatusFilter !== 'all') {
      stations = stations.filter(s => s.status === currentStatusFilter);
    }

    // 關鍵字搜尋
    if (currentSearchKeyword) {
      const keyword = currentSearchKeyword.toLowerCase();
      stations = stations.filter(s => {
        return s.name.toLowerCase().includes(keyword) ||
               s.location.toLowerCase().includes(keyword);
      });
    }

    if (stations.length === 0) {
      stationList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏭</div>
          <h3>沒有符合條件的站點</h3>
          <p>請嘗試其他搜尋條件或篩選選項</p>
        </div>
      `;
      return;
    }

    if (currentViewMode === 'list') {
      stationList.innerHTML = createStationTable(stations);
    } else {
      stationList.innerHTML = createStationCards(stations);
    }

    // 綁定按鈕事件
    bindStationTableEvents();
  }

  function createStationTable(stations) {
    const statusColors = {
      idle: '#9ca3af',
      running: '#10b981',
      paused: '#f59e0b',
      maintenance: '#6366f1',
      error: '#ef4444'
    };

    const statusLabels = {
      idle: '閒置',
      running: '運行中',
      paused: '暫停',
      maintenance: '維護中',
      error: '故障'
    };

    const rows = stations.map(station => {
      const typeInfo = Object.values(STATION_TYPES).find(t => t.code === station.type);

      // 如果找不到類型資訊，使用預設值
      const type = typeInfo || { icon: '🏭', name: '未知類型', color: '#9ca3af' };
      const utilization = station.calculateUtilization();

      return `
        <tr>
          <td>
            <div class="table-station-name">
              <span class="station-icon" style="background: ${type.color}20; color: ${type.color};">
                ${type.icon}
              </span>
              <span>${station.name}</span>
            </div>
          </td>
          <td>${type.name}</td>
          <td>${station.location}</td>
          <td>
            <span class="table-status-badge" style="background: ${statusColors[station.status]}20; color: ${statusColors[station.status]};">
              ${statusLabels[station.status]}
            </span>
          </td>
          <td>${station.currentLoad} / ${station.capacity}</td>
          <td>
            <div class="progress-bar-inline">
              <div class="progress-fill" style="width: ${utilization}%; background: ${parseFloat(utilization) > 80 ? '#ef4444' : '#10b981'};"></div>
            </div>
            <span class="progress-text">${utilization}%</span>
          </td>
          <td>${station.currentJobs.length}</td>
          <td>${station.metrics.totalProcessed}</td>
          <td>
            <div class="table-actions">
              <button class="btn-table btn-detail" data-station-id="${station.id}">詳情</button>${station.status === STATION_STATUS.RUNNING ? `<button class="btn-table btn-pause" data-station-id="${station.id}">暫停</button>` : ''}${station.status === STATION_STATUS.PAUSED ? `<button class="btn-table btn-resume" data-station-id="${station.id}">恢復</button>` : ''}${station.status === STATION_STATUS.IDLE ? `<button class="btn-table btn-maintenance" data-station-id="${station.id}">維護</button>` : ''}${station.status === STATION_STATUS.MAINTENANCE ? `<button class="btn-table btn-resume" data-station-id="${station.id}">完成維護</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <table class="station-table">
        <thead>
          <tr>
            <th>站點名稱</th>
            <th>類型</th>
            <th>位置</th>
            <th>狀態</th>
            <th>負載</th>
            <th>使用率</th>
            <th>工單數</th>
            <th>總處理量</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  function createStationCards(stations) {
    const statusColors = {
      idle: '#9ca3af',
      running: '#10b981',
      paused: '#f59e0b',
      maintenance: '#6366f1',
      error: '#ef4444'
    };

    const statusLabels = {
      idle: '閒置',
      running: '運行中',
      paused: '暫停',
      maintenance: '維護中',
      error: '故障'
    };

    return stations.map(station => {
      const typeInfo = Object.values(STATION_TYPES).find(t => t.code === station.type);
      const type = typeInfo || { icon: '🏭', name: '未知類型', color: '#9ca3af' };
      const utilization = station.calculateUtilization();

      return `
        <div class="station-card">
          <div class="station-card-header" style="background: linear-gradient(135deg, ${type.color}, ${type.color}dd);">
            <div class="station-card-icon">${type.icon}</div>
            <div class="station-card-title">
              <h4>${station.name}</h4>
              <p>${type.name}</p>
            </div>
            <span class="station-card-status" style="background: ${statusColors[station.status]}20; color: ${statusColors[station.status]};">
              ${statusLabels[station.status]}
            </span>
          </div>
          <div class="station-card-body">
            <div class="station-info-grid">
              <div class="station-info-item">
                <span class="info-label">📍 位置</span>
                <span class="info-value">${station.location}</span>
              </div>
              <div class="station-info-item">
                <span class="info-label">📦 負載</span>
                <span class="info-value">${station.currentLoad} / ${station.capacity}</span>
              </div>
              <div class="station-info-item">
                <span class="info-label">📊 使用率</span>
                <span class="info-value">${utilization}%</span>
              </div>
              <div class="station-info-item">
                <span class="info-label">📋 工單數</span>
                <span class="info-value">${station.currentJobs.length}</span>
              </div>
              <div class="station-info-item">
                <span class="info-label">✅ 總處理量</span>
                <span class="info-value">${station.metrics.totalProcessed}</span>
              </div>
              <div class="station-info-item">
                <span class="info-label">⏱️ 處理時間</span>
                <span class="info-value">${station.processTime} 分</span>
              </div>
            </div>
            <div class="utilization-bar">
              <div class="utilization-fill" style="width: ${utilization}%; background: ${parseFloat(utilization) > 80 ? '#ef4444' : '#10b981'};"></div>
            </div>
          </div>
          <div class="station-card-footer">
            <button class="btn-card btn-detail" data-station-id="${station.id}">詳情</button>
            ${station.status === STATION_STATUS.RUNNING ? `
              <button class="btn-card btn-pause" data-station-id="${station.id}">暫停</button>
            ` : ''}
            ${station.status === STATION_STATUS.PAUSED ? `
              <button class="btn-card btn-resume" data-station-id="${station.id}">恢復</button>
            ` : ''}
            ${station.status === STATION_STATUS.IDLE ? `
              <button class="btn-card btn-maintenance" data-station-id="${station.id}">維護</button>
            ` : ''}
            ${station.status === STATION_STATUS.MAINTENANCE ? `
              <button class="btn-card btn-resume" data-station-id="${station.id}">完成維護</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function bindStationTableEvents() {
    const stationList = container.querySelector('#station-list');

    // 詳情按鈕 (支援 table 和 card)
    stationList.querySelectorAll('.btn-detail, .btn-card.btn-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stationId = e.target.dataset.stationId;
        showStationDetail(stationId);
      });
    });

    // 暫停按鈕
    stationList.querySelectorAll('.btn-pause, .btn-card.btn-pause').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stationId = e.target.dataset.stationId;
        handlePauseStation(stationId);
      });
    });

    // 恢復按鈕
    stationList.querySelectorAll('.btn-resume, .btn-card.btn-resume').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stationId = e.target.dataset.stationId;
        handleResumeStation(stationId);
      });
    });

    // 維護按鈕
    stationList.querySelectorAll('.btn-maintenance, .btn-card.btn-maintenance').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stationId = e.target.dataset.stationId;
        handleMaintenanceStation(stationId);
      });
    });
  }

  function showStationDetail(stationId) {
    const report = StationService.getStationPerformanceReport(stationId);
    const station = stationManager.getStation(stationId);
    const typeInfo = Object.values(STATION_TYPES).find(t => t.code === station.type);

    const modalContent = `
      <div class="station-detail">
        <div class="detail-section">
          <h4>基本資訊</h4>
          <table class="detail-table">
            <tr><td>站點 ID</td><td>${station.id}</td></tr>
            <tr><td>站點名稱</td><td>${station.name}</td></tr>
            <tr><td>類型</td><td>${typeInfo.icon} ${typeInfo.name}</td></tr>
            <tr><td>位置</td><td>${station.location}</td></tr>
            <tr><td>狀態</td><td>${station.status}</td></tr>
            <tr><td>容量</td><td>${station.capacity}</td></tr>
            <tr><td>當前負載</td><td>${station.currentLoad}</td></tr>
            <tr><td>使用率</td><td>${station.calculateUtilization()}%</td></tr>
            <tr><td>標準處理時間</td><td>${station.processTime} 分鐘</td></tr>
          </table>
        </div>
        <div class="detail-section">
          <h4>效能指標</h4>
          <table class="detail-table">
            <tr><td>總處理量</td><td>${report.metrics.totalProcessed}</td></tr>
            <tr><td>成功數</td><td>${report.metrics.successCount}</td></tr>
            <tr><td>失敗數</td><td>${report.metrics.failureCount}</td></tr>
            <tr><td>成功率</td><td>${report.metrics.successRate}</td></tr>
            <tr><td>失敗率</td><td>${report.metrics.failureRate}</td></tr>
            ${report.metrics.lastMaintenanceDate ? `
              <tr><td>上次維護</td><td>${new Date(report.metrics.lastMaintenanceDate).toLocaleString('zh-TW')}</td></tr>
            ` : ''}
          </table>
        </div>
        ${station.currentJobs.length > 0 ? `
          <div class="detail-section">
            <h4>進行中的工單（${station.currentJobs.length} 個）</h4>
            <div class="jobs-list">
              ${station.currentJobs.map(job => {
                // 取得實際的工單資料
                const workOrder = WorkOrderHelper.getWorkOrderByNo(job.jobId);
                const hasWorkOrder = workOrder !== null;

                return `
                  <div class="job-item ${hasWorkOrder ? 'has-wo' : ''}">
                    <div class="job-header">
                      <div class="job-id">${job.jobId}</div>
                      ${hasWorkOrder ? `
                        <a href="#/apply?id=${workOrder.id}" class="btn-view-wo" title="查看工單詳情">
                          📝 查看工單
                        </a>
                      ` : ''}
                    </div>
                    <div class="job-info">
                      <span>數量: ${job.quantity}</span>
                      <span>開始: ${new Date(job.startTime).toLocaleTimeString('zh-TW')}</span>
                      <span>預計完成: ${new Date(job.estimatedEndTime).toLocaleTimeString('zh-TW')}</span>
                    </div>
                    ${hasWorkOrder ? `
                      <div class="job-wo-info">
                        <div class="wo-info-item">
                          <span class="wo-info-label">批次號:</span>
                          <span class="wo-info-value">${workOrder.data.batchNo || '-'}</span>
                        </div>
                        <div class="wo-info-item">
                          <span class="wo-info-label">來源:</span>
                          <span class="wo-info-value">${workOrder.data.sourceFactory || '-'}</span>
                        </div>
                        <div class="wo-info-item">
                          <span class="wo-info-label">濾網類型:</span>
                          <span class="wo-info-value">${workOrder.data.filterType || '-'}</span>
                        </div>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : '<p class="text-secondary">目前無進行中的工單</p>'}
      </div>
    `;

    const modal = new Modal({
      title: `🏭 站點詳情 - ${station.name}`,
      content: modalContent,
      buttons: [
        {
          text: '關閉',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        }
      ]
    });

    modal.open();
  }

  function handlePauseStation(stationId) {
    if (confirm('確定要暫停此站點嗎？')) {
      try {
        StationService.toggleStationPause(stationId, true);
        alert('站點已暫停');
        renderStats();
        renderHealthCheck();
        renderTypeOverview();
        renderStationList();
      } catch (error) {
        alert(`暫停失敗: ${error.message}`);
      }
    }
  }

  function handleResumeStation(stationId) {
    try {
      const station = stationManager.getStation(stationId);
      if (station.status === STATION_STATUS.PAUSED) {
        StationService.toggleStationPause(stationId, false);
        alert('站點已恢復運行');
      } else if (station.status === STATION_STATUS.MAINTENANCE) {
        StationService.setStationMaintenance(stationId, false);
        alert('維護已完成，站點已恢復運行');
      }
      renderStats();
      renderHealthCheck();
      renderTypeOverview();
      renderStationList();
    } catch (error) {
      alert(`恢復失敗: ${error.message}`);
    }
  }

  function handleMaintenanceStation(stationId) {
    const reason = prompt('請輸入維護原因（選填）:');
    if (reason !== null) {
      try {
        StationService.setStationMaintenance(stationId, true, reason);
        alert('站點已進入維護模式');
        renderStats();
        renderHealthCheck();
        renderTypeOverview();
        renderStationList();
      } catch (error) {
        alert(`設定維護失敗: ${error.message}`);
      }
    }
  }

  function handleAcknowledgeAlert(alertId, deviceId) {
    iotEdgeService.acknowledgeAlert(deviceId, alertId).then(result => {
      if (result.success) {
        renderAlerts();
      } else {
        alert(`確認警報失敗: ${result.error}`);
      }
    });
  }

  function showAllAlertsModal() {
    const alerts = iotEdgeService.getAllAlerts({ acknowledged: false });

    const alertColors = {
      [ALERT_LEVEL.INFO]: { bg: '#e0f2fe', border: '#0284c7' },
      [ALERT_LEVEL.WARNING]: { bg: '#fef3c7', border: '#f59e0b' },
      [ALERT_LEVEL.ERROR]: { bg: '#fee2e2', border: '#ef4444' },
      [ALERT_LEVEL.CRITICAL]: { bg: '#fce7f3', border: '#ec4899' }
    };

    const alertLabels = {
      [ALERT_LEVEL.INFO]: '資訊',
      [ALERT_LEVEL.WARNING]: '警告',
      [ALERT_LEVEL.ERROR]: '錯誤',
      [ALERT_LEVEL.CRITICAL]: '嚴重'
    };

    const alertIcons = {
      [ALERT_LEVEL.INFO]: 'ℹ️',
      [ALERT_LEVEL.WARNING]: '⚠️',
      [ALERT_LEVEL.ERROR]: '❌',
      [ALERT_LEVEL.CRITICAL]: '🚨'
    };

    const modalContent = `
      <div class="all-alerts-modal">
        ${alerts.length === 0 ? `
          <p class="text-secondary">目前沒有未確認的警報</p>
        ` : `
          <div class="alert-list-full">
            ${alerts.map(alert => {
              const colors = alertColors[alert.level] || alertColors[ALERT_LEVEL.INFO];
              const device = iotEdgeService.getDevice(alert.deviceId);
              const deviceName = device ? device.name : alert.deviceId;

              return `
                <div class="alert-item-full" style="background: ${colors.bg}; border-left-color: ${colors.border};">
                  <div class="alert-icon-full" style="color: ${colors.border};">
                    ${alertIcons[alert.level]}
                  </div>
                  <div class="alert-content-full">
                    <div class="alert-title-full">
                      <span class="alert-device-full">${deviceName}</span>
                      <span class="alert-badge-full" style="background: ${colors.border}; color: white;">
                        ${alertLabels[alert.level]}
                      </span>
                    </div>
                    <div class="alert-message-full">${alert.message}</div>
                    <div class="alert-time-full">${new Date(alert.timestamp).toLocaleString('zh-TW')}</div>
                  </div>
                  <button class="btn-ack-alert-modal" data-alert-id="${alert.id}" data-device-id="${alert.deviceId}">
                    確認
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    const modal = new Modal({
      title: '🔔 所有設備警報',
      content: modalContent,
      buttons: [
        {
          text: '關閉',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        },
        {
          text: '全部確認',
          variant: 'primary',
          onClick: async (modal) => {
            if (confirm(`確定要確認全部 ${alerts.length} 個警報嗎？`)) {
              for (const alert of alerts) {
                await iotEdgeService.acknowledgeAlert(alert.deviceId, alert.id);
              }
              renderAlerts();
              modal.close();
            }
          }
        }
      ]
    });

    modal.open();

    // 綁定個別確認按鈕
    const modalElement = modal.element;
    modalElement.querySelectorAll('.btn-ack-alert-modal').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const alertId = e.target.dataset.alertId;
        const deviceId = e.target.dataset.deviceId;
        const result = await iotEdgeService.acknowledgeAlert(deviceId, alertId);
        if (result.success) {
          renderAlerts();
          modal.close();
          showAllAlertsModal(); // 重新開啟以更新列表
        }
      });
    });
  }

  function showAddStationModal() {
    const modalContent = `
      <div class="modal-form">
        <div class="form-group">
          <label>站點名稱</label>
          <input type="text" id="station-name" placeholder="例如: 清洗站 C" />
        </div>
        <div class="form-group">
          <label>站點類型</label>
          <select id="station-type">
            ${Object.values(STATION_TYPES).map(type =>
              `<option value="${type.code}">${type.icon} ${type.name}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>實體位置</label>
          <input type="text" id="station-location" placeholder="例如: 清洗區 C3" />
        </div>
        <div class="form-group">
          <label>容量</label>
          <input type="number" id="station-capacity" value="30" min="1" />
        </div>
        <div class="form-group">
          <label>標準處理時間（分鐘）</label>
          <input type="number" id="station-process-time" value="60" min="1" />
        </div>
      </div>
    `;

    const modal = new Modal({
      title: '新增站點',
      content: modalContent,
      buttons: [
        {
          text: '取消',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        },
        {
          text: '確認新增',
          variant: 'primary',
          onClick: (modal) => {
            const name = modal.element.querySelector('#station-name').value;
            const type = modal.element.querySelector('#station-type').value;
            const location = modal.element.querySelector('#station-location').value;
            const capacity = parseInt(modal.element.querySelector('#station-capacity').value);
            const processTime = parseInt(modal.element.querySelector('#station-process-time').value);

            if (!name || !location) {
              alert('請填寫完整資訊');
              return;
            }

            try {
              stationManager.createStation({
                name,
                type,
                location,
                capacity,
                processTime
              });
              alert(`站點 ${name} 新增成功！`);
              modal.close();
              renderStats();
              renderHealthCheck();
              renderTypeOverview();
              renderStationList();
            } catch (error) {
              alert(`新增失敗: ${error.message}`);
            }
          }
        }
      ]
    });

    modal.open();
  }
}

function addStyles() {
  if (!document.getElementById('station-page-styles')) {
    const style = document.createElement('style');
    style.id = 'station-page-styles';
    style.textContent = `
      .station-page {
        padding: var(--spacing-xl);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-xl);
        gap: var(--spacing-lg);
      }

      .user-context-info {
        flex-shrink: 0;
      }

      .user-info-badge {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        background: var(--bg-color);
        border: 2px solid var(--primary-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
        box-shadow: var(--shadow-sm);
      }

      .user-icon {
        font-size: 2rem;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-color)20;
        border-radius: var(--radius-md);
      }

      .user-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .user-name {
        font-weight: 700;
        font-size: 1rem;
        color: var(--text-primary);
      }

      .user-role {
        font-size: 0.8125rem;
        color: var(--primary-color);
        font-weight: 600;
      }

      .user-stations {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-top: 2px;
      }

      .stats-section {
        margin-bottom: var(--spacing-xl);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
      }

      .stat-card.status-running {
        border-color: #10b981;
      }

      .stat-card.status-idle {
        border-color: #9ca3af;
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
      }

      .health-section {
        margin-bottom: var(--spacing-xl);
      }

      .health-card {
        background: var(--bg-color);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      .health-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
      }

      .health-badge {
        padding: var(--spacing-xs) var(--spacing-md);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 600;
      }

      .health-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
      }

      .health-stat {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .health-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .health-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .health-issues h4 {
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
      }

      .issue-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-xs);
        border-left: 3px solid;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
      }

      .issue-item.warning {
        background: #fef2f2;
        border-color: #f59e0b;
      }

      .issue-item.critical {
        background: #fee2e2;
        border-color: #ef4444;
      }

      .issue-station {
        font-weight: 600;
      }

      .issue-severity {
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .issue-item.warning .issue-severity {
        background: #f59e0b;
        color: white;
      }

      .issue-item.critical .issue-severity {
        background: #ef4444;
        color: white;
      }

      .type-overview-section {
        margin-bottom: var(--spacing-xl);
      }

      .type-overview-section h3 {
        margin-bottom: var(--spacing-md);
      }

      .type-overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-lg);
      }

      .type-card {
        background: var(--bg-color);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      .type-icon {
        font-size: 2.5rem;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-md);
      }

      .type-content h4 {
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
      }

      .type-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
      }

      .type-stat {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .type-stat .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .type-stat .stat-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .type-progress {
        margin-top: var(--spacing-sm);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        flex-wrap: wrap;
        gap: var(--spacing-md);
      }

      .header-title h3 {
        margin: 0;
      }

      .header-controls {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
        align-items: center;
      }

      .view-toggle {
        display: flex;
        gap: 4px;
      }

      .view-btn {
        padding: 6px 10px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
      }

      .view-btn:hover {
        background: var(--bg-color);
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .view-btn.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
      }

      .view-btn svg {
        display: block;
      }

      .search-input,
      .filter-select {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-family: var(--font-family);
      }

      .search-input {
        min-width: 200px;
        max-width: 250px;
      }

      .btn-primary {
        padding: var(--spacing-sm) var(--spacing-lg);
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        transition: opacity 0.2s;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .station-table-container {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }

      .station-table {
        width: 100%;
        border-collapse: collapse;
      }

      .station-table thead {
        background: var(--bg-secondary);
      }

      .station-table th {
        padding: var(--spacing-md);
        text-align: left;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        border-bottom: 2px solid var(--border-color);
        white-space: nowrap;
      }

      .station-table tbody tr {
        transition: background 0.2s;
      }

      .station-table tbody tr:hover {
        background: var(--bg-secondary);
      }

      .station-table td {
        padding: var(--spacing-md);
        font-size: 0.875rem;
        border-bottom: 1px solid var(--border-color);
        vertical-align: middle;
      }

      .table-station-name {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-weight: 600;
      }

      .station-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        font-size: 1.2rem;
      }

      .table-status-badge {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-md);
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;
      }

      .progress-bar-inline {
        width: 80px;
        height: 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;
        display: inline-block;
        vertical-align: middle;
        margin-right: var(--spacing-sm);
      }

      .progress-fill {
        height: 100%;
        transition: width 0.3s;
      }

      .progress-text {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .table-actions {
        white-space: nowrap;
      }

      .table-actions .btn-table {
        padding: 4px 8px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: white;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.75rem;
        transition: all 0.15s;
        margin-right: 4px;
      }

      .table-actions .btn-table:last-child {
        margin-right: 0;
      }

      .btn-table.btn-detail:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .btn-table.btn-pause:hover {
        background: #f59e0b;
        color: white;
        border-color: #f59e0b;
      }

      .btn-table.btn-resume:hover {
        background: #10b981;
        color: white;
        border-color: #10b981;
      }

      .btn-table.btn-maintenance:hover {
        background: #6366f1;
        color: white;
        border-color: #6366f1;
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--text-secondary);
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-md);
      }

      .modal-form {
        padding: var(--spacing-md);
      }

      .form-group {
        margin-bottom: var(--spacing-lg);
      }

      .form-group label {
        display: block;
        margin-bottom: var(--spacing-sm);
        font-weight: 600;
        color: var(--text-primary);
      }

      .form-group input,
      .form-group select {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-family: var(--font-family);
        font-size: 0.875rem;
      }

      .station-detail {
        padding: var(--spacing-md);
      }

      .detail-section {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-md);
      }

      .detail-section h4 {
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
      }

      .detail-table {
        width: 100%;
        font-size: 0.875rem;
      }

      .detail-table td {
        padding: var(--spacing-xs) 0;
      }

      .detail-table td:first-child {
        color: var(--text-secondary);
        width: 40%;
      }

      .detail-table td:last-child {
        font-weight: 600;
        text-align: right;
      }

      .jobs-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .job-item {
        background: var(--bg-color);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
      }

      .job-item.has-wo {
        border-left: 3px solid var(--primary-color);
      }

      .job-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-xs);
      }

      .job-id {
        font-weight: 600;
        color: var(--primary-color);
        font-size: 0.9375rem;
      }

      .btn-view-wo {
        padding: 4px 10px;
        background: var(--primary-light);
        color: var(--primary-color);
        border: 1px solid var(--primary-color);
        border-radius: var(--radius-sm);
        text-decoration: none;
        font-size: 0.75rem;
        font-weight: 600;
        transition: all 0.2s;
      }

      .btn-view-wo:hover {
        background: var(--primary-color);
        color: white;
      }

      .job-info {
        display: flex;
        gap: var(--spacing-md);
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-sm);
      }

      .job-wo-info {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-sm);
        margin-top: var(--spacing-sm);
        padding-top: var(--spacing-sm);
        border-top: 1px solid var(--border-color);
      }

      .wo-info-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .wo-info-label {
        font-size: 0.7rem;
        color: var(--text-secondary);
      }

      .wo-info-value {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      /* IoT Edge Alert Styles */
      .alert-section {
        margin-bottom: var(--spacing-xl);
      }

      .alert-card {
        background: var(--bg-color);
        border: 2px solid #f59e0b;
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
      }

      .alert-count {
        background: #f59e0b;
        color: white;
        padding: var(--spacing-xs) var(--spacing-md);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 600;
      }

      .alert-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .alert-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border-left: 4px solid;
        border-radius: var(--radius-md);
        transition: transform 0.2s;
      }

      .alert-item:hover {
        transform: translateX(4px);
      }

      .alert-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .alert-content {
        flex: 1;
      }

      .alert-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-xs);
      }

      .alert-device {
        font-weight: 600;
        font-size: 0.875rem;
      }

      .alert-badge {
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .alert-message {
        font-size: 0.875rem;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .alert-time {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .btn-ack-alert {
        padding: var(--spacing-xs) var(--spacing-md);
        background: white;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 600;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .btn-ack-alert:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .alert-footer {
        margin-top: var(--spacing-md);
        text-align: center;
      }

      .btn-link {
        background: none;
        border: none;
        color: var(--primary-color);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: underline;
        padding: var(--spacing-xs);
      }

      .btn-link:hover {
        color: var(--primary-hover);
      }

      /* Alert Modal Styles */
      .all-alerts-modal {
        max-height: 500px;
        overflow-y: auto;
      }

      .alert-list-full {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .alert-item-full {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border-left: 4px solid;
        border-radius: var(--radius-md);
      }

      .alert-icon-full {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .alert-content-full {
        flex: 1;
      }

      .alert-title-full {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-xs);
      }

      .alert-device-full {
        font-weight: 600;
        font-size: 0.875rem;
      }

      .alert-badge-full {
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .alert-message-full {
        font-size: 0.875rem;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .alert-time-full {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .btn-ack-alert-modal {
        padding: var(--spacing-xs) var(--spacing-md);
        background: white;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 600;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .btn-ack-alert-modal:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      /* Card View Styles */
      .stations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--spacing-lg);
      }

      .station-card {
        background: white;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        transition: all 0.2s;
      }

      .station-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .station-card-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        color: white;
        position: relative;
      }

      .station-card-icon {
        font-size: 2.5rem;
        flex-shrink: 0;
      }

      .station-card-title {
        flex: 1;
      }

      .station-card-title h4 {
        margin: 0 0 4px 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .station-card-title p {
        margin: 0;
        font-size: 0.8125rem;
        opacity: 0.9;
      }

      .station-card-status {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        padding: 4px 12px;
        border-radius: var(--radius-md);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .station-card-body {
        padding: var(--spacing-lg);
      }

      .station-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
      }

      .station-info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .station-info-item .info-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .station-info-item .info-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .utilization-bar {
        height: 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;
        margin-top: var(--spacing-sm);
      }

      .utilization-fill {
        height: 100%;
        transition: width 0.3s;
      }

      .station-card-footer {
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .btn-card {
        padding: 6px 12px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: white;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 600;
        transition: all 0.15s;
      }

      .btn-card.btn-detail {
        flex: 1;
      }

      .btn-card.btn-detail:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .btn-card.btn-pause:hover {
        background: #f59e0b;
        color: white;
        border-color: #f59e0b;
      }

      .btn-card.btn-resume:hover {
        background: #10b981;
        color: white;
        border-color: #10b981;
      }

      .btn-card.btn-maintenance:hover {
        background: #6366f1;
        color: white;
        border-color: #6366f1;
      }
    `;
    document.head.appendChild(style);
  }
}
