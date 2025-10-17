import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';
import { Modal } from '../components/common/Modal.js';
import { energyManager } from '../modules/energy/energyModel.js';
import { EnergyService } from '../modules/energy/energyService.js';
import { authService } from '../utils/authService.js';
import { WorkOrderHelper } from '../utils/workOrderHelper.js';

export function EnergyPage() {
  const container = document.createElement('div');
  container.className = 'energy-page';

  const currentUser = authService.getCurrentUser();

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <h2>⚡ 能源管理系統</h2>
    <p class="text-secondary">設備能耗監控、能源分析、節能建議</p>
  `;
  container.appendChild(header);

  // 統計卡片區
  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';
  statsGrid.id = 'stats-grid';
  container.appendChild(statsGrid);

  // 能源比較區
  const comparisonSection = document.createElement('div');
  comparisonSection.className = 'comparison-section';
  comparisonSection.id = 'comparison-section';
  container.appendChild(comparisonSection);

  // 快速操作區
  const quickActions = document.createElement('div');
  quickActions.className = 'quick-actions-section';
  quickActions.innerHTML = `<h3>快速操作</h3>`;

  const actionsGrid = document.createElement('div');
  actionsGrid.className = 'actions-grid';

  const actions = [
    {
      icon: '📊',
      title: '同步 IoTEdge',
      desc: '從 IoTEdge 同步最新數據',
      onClick: () => showSyncModal()
    },
    {
      icon: '🔍',
      title: '工單能耗查詢',
      desc: '查看工單能源報表',
      onClick: () => showWorkOrderSearchModal()
    },
    {
      icon: '💡',
      title: '節能建議',
      desc: '查看系統節能建議',
      onClick: () => showRecommendationsModal()
    },
    {
      icon: '⚠️',
      title: '異常監控',
      desc: '能耗異常偵測',
      onClick: () => showAnomaliesModal()
    }
  ];

  actions.forEach(action => {
    const actionCard = document.createElement('div');
    actionCard.className = 'action-card';
    actionCard.innerHTML = `
      <div class="action-icon">${action.icon}</div>
      <div class="action-title">${action.title}</div>
      <div class="action-desc">${action.desc}</div>
    `;
    actionCard.addEventListener('click', action.onClick);
    actionsGrid.appendChild(actionCard);
  });

  quickActions.appendChild(actionsGrid);
  container.appendChild(quickActions);

  // 設備能耗列表區
  const deviceSection = document.createElement('div');
  deviceSection.className = 'device-section';
  deviceSection.innerHTML = `
    <div class="section-header">
      <h3>設備能耗記錄</h3>
      <div class="filter-tabs" id="filter-tabs">
        <button class="tab-btn active" data-device="all">全部設備</button>
        <button class="tab-btn" data-device="oven">烘箱 ECU</button>
        <button class="tab-btn" data-device="aoi">所羅門 AOI</button>
        <button class="tab-btn" data-device="mau">電表 MAU</button>
        <button class="tab-btn" data-device="ffu">FFU</button>
      </div>
    </div>
    <div id="energy-list" class="energy-list"></div>
  `;
  container.appendChild(deviceSection);

  // 初始化數據
  renderStats();
  renderComparison();
  renderEnergyList('all');

  // 綁定篩選標籤事件
  const filterTabs = container.querySelectorAll('.tab-btn');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      filterTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      const deviceType = e.target.dataset.device;
      renderEnergyList(deviceType);
    });
  });

  addStyles();
  return container;

  // ========== 功能函數 ==========

  function renderStats() {
    const allRecords = energyManager.getAllRecords();
    const completedRecords = allRecords.filter(r => r.status === 'completed');

    const totalEnergy = completedRecords.reduce((sum, r) => sum + (r.energyConsumption || 0), 0);
    const totalCost = completedRecords.reduce((sum, r) => sum + parseFloat(r.totalCost || 0), 0);
    const avgEfficiency = completedRecords.length > 0
      ? (completedRecords.reduce((sum, r) => sum + parseFloat(r.efficiency || 0), 0) / completedRecords.length).toFixed(4)
      : 0;

    const anomalies = energyManager.detectAnomalies();

    const statsGrid = container.querySelector('#stats-grid');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <div class="stat-value">${totalEnergy.toFixed(2)}</div>
          <div class="stat-label">總耗電量 (kWh)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">${totalCost.toFixed(2)}</div>
          <div class="stat-label">總能源成本 (元)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-value">${avgEfficiency}</div>
          <div class="stat-label">平均單位能耗 (kWh/片)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-value">${completedRecords.length}</div>
          <div class="stat-label">能耗記錄數</div>
        </div>
      </div>
      <div class="stat-card ${anomalies.length > 0 ? 'stat-card-warning' : ''}">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-value">${anomalies.length}</div>
          <div class="stat-label">異常記錄數</div>
        </div>
      </div>
    `;
  }

  function renderComparison() {
    const data = EnergyService.getEnergyComparison();
    const comparisonSection = container.querySelector('#comparison-section');

    // 從返回的結構中提取數據
    const thisMonthEnergy = parseFloat(data.thisMonth.energy);
    const lastMonthEnergy = parseFloat(data.lastMonth.energy);
    const changeRate = data.comparison.changeRate;
    const isIncrease = data.comparison.trend === 'up';
    const changeColor = isIncrease ? '#ef4444' : '#10b981';
    const changeIcon = isIncrease ? '📈' : '📉';

    comparisonSection.innerHTML = `
      <div class="comparison-card">
        <h3>月度能耗比較</h3>
        <div class="comparison-grid">
          <div class="comparison-item">
            <div class="comparison-label">本月耗電</div>
            <div class="comparison-value">${data.thisMonth.energy} kWh</div>
            <div class="comparison-sublabel">${data.thisMonth.records} 筆記錄</div>
          </div>
          <div class="comparison-item">
            <div class="comparison-label">上月耗電</div>
            <div class="comparison-value">${data.lastMonth.energy} kWh</div>
            <div class="comparison-sublabel">${data.lastMonth.records} 筆記錄</div>
          </div>
          <div class="comparison-item">
            <div class="comparison-label">變化幅度</div>
            <div class="comparison-value" style="color: ${changeColor};">
              ${changeIcon} ${changeRate}
            </div>
            <div class="comparison-sublabel">${data.comparison.energyChange} kWh</div>
          </div>
        </div>
        <div class="comparison-message">
          ${isIncrease
            ? `<p style="color: #ef4444;">⚠️ 本月能耗較上月增加，建議檢查設備效率</p>`
            : `<p style="color: #10b981;">✅ 本月能耗較上月減少，節能效果良好</p>`
          }
        </div>
      </div>
    `;
  }

  function renderEnergyList(deviceFilter = 'all') {
    const energyList = container.querySelector('#energy-list');
    let records = energyManager.getAllRecords();

    if (deviceFilter !== 'all') {
      records = records.filter(r => r.deviceType === deviceFilter);
    }

    // 只顯示已完成的記錄，按建立時間排序（最新在前）
    records = records
      .filter(r => r.status === 'completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (records.length === 0) {
      energyList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚡</div>
          <h3>沒有能耗記錄</h3>
          <p>點選上方「同步 IoTEdge」開始同步能源數據</p>
        </div>
      `;
      return;
    }

    energyList.innerHTML = '';
    records.forEach(record => {
      const recordCard = createEnergyCard(record);
      energyList.appendChild(recordCard);
    });
  }

  function createEnergyCard(record) {
    const card = document.createElement('div');
    card.className = 'energy-card';

    const deviceIcons = {
      oven: '🔥',
      aoi: '🔍',
      mau: '📊',
      ffu: '💨',
      packaging: '📦'
    };

    const deviceNames = {
      oven: '烘箱 ECU',
      aoi: '所羅門 AOI',
      mau: '電表 MAU',
      ffu: 'FFU',
      packaging: '包裝站'
    };

    const baseline = energyManager.getBaseline(record.deviceType);
    const isAbnormal = baseline && record.efficiency > baseline.baselineEfficiency * 1.2;

    const startTime = new Date(record.startTime).toLocaleString('zh-TW');
    const endTime = record.endTime ? new Date(record.endTime).toLocaleString('zh-TW') : 'N/A';
    const duration = record.endTime
      ? ((new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / (1000 * 60)).toFixed(0)
      : 'N/A';

    // 取得工單資料
    const workOrder = WorkOrderHelper.getWorkOrderByNo(record.workOrderNo);
    const hasWorkOrder = workOrder !== null;

    card.innerHTML = `
      <div class="energy-card-header">
        <div class="energy-device">
          <span class="device-icon">${deviceIcons[record.deviceType] || '⚡'}</span>
          <strong>${deviceNames[record.deviceType] || record.deviceType}</strong>
        </div>
        <div class="energy-status ${isAbnormal ? 'status-abnormal' : 'status-normal'}">
          ${isAbnormal ? '⚠️ 能耗異常' : '✅ 正常'}
        </div>
      </div>
      <div class="energy-card-body">
        <div class="energy-info-row">
          <span class="info-label">工單號</span>
          ${hasWorkOrder ? `
            <a href="#/apply?id=${workOrder.id}" class="info-value info-value-link" title="查看工單詳情">
              ${record.workOrderNo || 'N/A'}
            </a>
          ` : `
            <span class="info-value">${record.workOrderNo || 'N/A'}</span>
          `}
        </div>
        ${hasWorkOrder ? `
        <div class="energy-info-row">
          <span class="info-label">批次號</span>
          <span class="info-value">${workOrder.data.batchNo || '-'}</span>
        </div>
        <div class="energy-info-row">
          <span class="info-label">來源廠別</span>
          <span class="info-value">${workOrder.data.sourceFactory || '-'}</span>
        </div>
        <div class="energy-info-row">
          <span class="info-label">濾網類型</span>
          <span class="info-value">${workOrder.data.filterType || '-'}</span>
        </div>
        ` : ''}
        <div class="energy-info-row">
          <span class="info-label">耗電量</span>
          <span class="info-value">${record.energyConsumption?.toFixed(2) || 0} kWh</span>
        </div>
        <div class="energy-info-row">
          <span class="info-label">能源成本</span>
          <span class="info-value">$${record.totalCost || 0}</span>
        </div>
        <div class="energy-info-row">
          <span class="info-label">濾網數量</span>
          <span class="info-value">${record.filterQuantity || 0} 片</span>
        </div>
        <div class="energy-info-row">
          <span class="info-label">單位能耗</span>
          <span class="info-value ${isAbnormal ? 'text-error' : ''}">${record.efficiency || 0} kWh/片</span>
        </div>
        ${baseline ? `
        <div class="energy-info-row">
          <span class="info-label">基準能耗</span>
          <span class="info-value">${baseline.baselineEfficiency} kWh/片</span>
        </div>
        ` : ''}
        <div class="energy-info-row">
          <span class="info-label">開始時間</span>
          <span class="info-value">${startTime}</span>
        </div>
        <div class="energy-info-row">
          <span class="info-label">結束時間</span>
          <span class="info-value">${endTime}</span>
        </div>
        <div class="energy-info-row">
          <span class="info-label">運行時長</span>
          <span class="info-value">${duration} 分鐘</span>
        </div>
        <div class="energy-info-row">
          <span class="info-label">數據來源</span>
          <span class="info-value">${record.source === 'iotedge' ? '🌐 IoTEdge' : '🖥️ 本地模擬'}</span>
        </div>
      </div>
      <div class="energy-card-actions">
        <button class="btn-detail" data-record-id="${record.id}">查看詳情</button>
      </div>
    `;

    // 綁定事件
    const detailBtn = card.querySelector('.btn-detail');
    detailBtn.addEventListener('click', () => showEnergyDetail(record.id));

    return card;
  }

  function showSyncModal() {
    const modalContent = `
      <div class="modal-form">
        <div class="form-group">
          <label>工單號</label>
          <input type="text" id="work-order-no" placeholder="例如: MSW-2025-0001" />
          <small>輸入工單號以同步該工單的所有設備能耗數據</small>
        </div>
        <div class="info-box">
          <p><strong>📋 同步說明</strong></p>
          <ul>
            <li>系統將從 IoTEdge RestfulAPI 讀取設備數據</li>
            <li>目前支援：烘箱 ECU、所羅門 AOI、電表 MAU、FFU</li>
            <li>數據將自動計算能耗與成本</li>
          </ul>
        </div>
      </div>
    `;

    const modal = new Modal({
      title: '📊 同步 IoTEdge 能源數據',
      content: modalContent,
      buttons: [
        {
          text: '取消',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        },
        {
          text: '開始同步',
          variant: 'primary',
          onClick: async (modal) => {
            const workOrderNo = modal.element.querySelector('#work-order-no').value;

            if (!workOrderNo.trim()) {
              alert('請輸入工單號');
              return;
            }

            try {
              // TODO: 實際整合 IoTEdge API
              await EnergyService.syncFromIoTEdge(workOrderNo);
              alert(`✅ 同步成功！\n工單號: ${workOrderNo}\n已同步烘箱、AOI、MAU、FFU 能耗數據`);
              modal.close();
              renderStats();
              renderComparison();
              renderEnergyList('all');
            } catch (error) {
              alert(`❌ 同步失敗: ${error.message}`);
            }
          }
        }
      ]
    });

    modal.open();
  }

  function showWorkOrderSearchModal() {
    const modalContent = `
      <div class="modal-form">
        <div class="form-group">
          <label>工單號</label>
          <input type="text" id="work-order-search" placeholder="輸入工單號查詢" />
        </div>
        <div id="work-order-result" class="search-result"></div>
      </div>
    `;

    const modal = new Modal({
      title: '🔍 工單能耗查詢',
      content: modalContent,
      buttons: [
        {
          text: '關閉',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        },
        {
          text: '查詢',
          variant: 'primary',
          onClick: (modal) => {
            const workOrderNo = modal.element.querySelector('#work-order-search').value;
            const resultDiv = modal.element.querySelector('#work-order-result');

            if (!workOrderNo.trim()) {
              resultDiv.innerHTML = '<p class="text-error">請輸入工單號</p>';
              return;
            }

            try {
              const report = EnergyService.getWorkOrderEnergyReport(workOrderNo);

              if (report.records.length === 0) {
                resultDiv.innerHTML = '<p class="text-error">❌ 找不到此工單的能耗記錄</p>';
                return;
              }

              resultDiv.innerHTML = `
                <div class="result-card">
                  <h4>✅ 工單能耗報表</h4>
                  <table class="result-table">
                    <tr><td>工單號</td><td>${report.workOrderNo}</td></tr>
                    <tr><td>設備數量</td><td>${report.deviceCount}</td></tr>
                    <tr><td>總耗電量</td><td>${report.totalEnergy.toFixed(2)} kWh</td></tr>
                    <tr><td>總能源成本</td><td>$${report.totalCost.toFixed(2)}</td></tr>
                    <tr><td>濾網數量</td><td>${report.totalFilters} 片</td></tr>
                    <tr><td>平均單位能耗</td><td>${report.avgEfficiency.toFixed(4)} kWh/片</td></tr>
                  </table>
                  <h5 style="margin-top: 16px;">設備明細</h5>
                  <div class="device-breakdown">
                    ${report.records.map(r => `
                      <div class="device-item">
                        <span>${r.deviceType}</span>
                        <span>${r.energyConsumption.toFixed(2)} kWh</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            } catch (error) {
              resultDiv.innerHTML = `<p class="text-error">❌ 查詢失敗: ${error.message}</p>`;
            }
          }
        }
      ]
    });

    modal.open();
  }

  function showRecommendationsModal() {
    const recommendations = energyManager.getEnergySavingRecommendations();

    if (recommendations.length === 0) {
      alert('目前沒有節能建議');
      return;
    }

    const modalContent = `
      <div class="recommendations">
        <p class="recommendations-intro">系統根據歷史能耗數據分析，提供以下節能建議：</p>
        <div class="recommendations-list">
          ${recommendations.map((rec, idx) => `
            <div class="recommendation-item">
              <div class="rec-number">${idx + 1}</div>
              <div class="rec-content">
                <div class="rec-device">${rec.deviceType}</div>
                <div class="rec-message">${rec.message}</div>
                <div class="rec-potential">
                  預期節能效果：
                  <strong>${rec.potentialSaving.toFixed(2)} kWh/片</strong>
                  （約 ${((rec.potentialSaving / rec.baseline.baselineEfficiency) * 100).toFixed(1)}%）
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const modal = new Modal({
      title: '💡 節能建議',
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

  function showAnomaliesModal() {
    const anomalies = energyManager.detectAnomalies();

    if (anomalies.length === 0) {
      alert('✅ 目前沒有能耗異常記錄');
      return;
    }

    const modalContent = `
      <div class="anomalies">
        <p class="anomalies-intro">⚠️ 偵測到 ${anomalies.length} 筆能耗異常記錄：</p>
        <div class="anomalies-list">
          ${anomalies.map(anomaly => `
            <div class="anomaly-item">
              <div class="anomaly-header">
                <span class="anomaly-device">${anomaly.deviceType}</span>
                <span class="anomaly-order">${anomaly.workOrderNo || 'N/A'}</span>
              </div>
              <div class="anomaly-body">
                <div class="anomaly-message">${anomaly.message}</div>
                <div class="anomaly-details">
                  <span>實際: ${anomaly.efficiency.toFixed(4)} kWh/片</span>
                  <span>基準: ${anomaly.baseline.baselineEfficiency} kWh/片</span>
                  <span>超標: ${((anomaly.efficiency / anomaly.baseline.baselineEfficiency - 1) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const modal = new Modal({
      title: '⚠️ 能耗異常監控',
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

  function showEnergyDetail(recordId) {
    const record = energyManager.getRecordById(recordId);
    if (!record) {
      alert('找不到此能耗記錄');
      return;
    }

    const baseline = energyManager.getBaseline(record.deviceType);

    const modalContent = `
      <div class="energy-detail">
        <div class="detail-section">
          <h4>基本資訊</h4>
          <table class="detail-table">
            <tr><td>記錄 ID</td><td>${record.id}</td></tr>
            <tr><td>設備類型</td><td>${record.deviceType}</td></tr>
            <tr><td>工單號</td><td>${record.workOrderNo || 'N/A'}</td></tr>
            <tr><td>狀態</td><td>${record.status}</td></tr>
            <tr><td>數據來源</td><td>${record.source === 'iotedge' ? 'IoTEdge' : '本地模擬'}</td></tr>
          </table>
        </div>
        <div class="detail-section">
          <h4>能耗數據</h4>
          <table class="detail-table">
            <tr><td>總耗電量</td><td>${record.energyConsumption?.toFixed(2) || 0} kWh</td></tr>
            <tr><td>能源成本</td><td>$${record.totalCost || 0}</td></tr>
            <tr><td>電價</td><td>$${record.energyCostPerUnit}/kWh</td></tr>
            <tr><td>濾網數量</td><td>${record.filterQuantity || 0} 片</td></tr>
            <tr><td>單位能耗</td><td>${record.efficiency || 0} kWh/片</td></tr>
          </table>
        </div>
        ${baseline ? `
        <div class="detail-section">
          <h4>基準比較</h4>
          <table class="detail-table">
            <tr><td>基準功率</td><td>${baseline.baselinePower} kW</td></tr>
            <tr><td>基準效率</td><td>${baseline.baselineEfficiency} kWh/片</td></tr>
            <tr><td>目標效率</td><td>${baseline.targetEfficiency} kWh/片</td></tr>
            <tr><td>效率差異</td><td>${((record.efficiency - baseline.baselineEfficiency) / baseline.baselineEfficiency * 100).toFixed(1)}%</td></tr>
          </table>
        </div>
        ` : ''}
        <div class="detail-section">
          <h4>時間記錄</h4>
          <table class="detail-table">
            <tr><td>建立時間</td><td>${new Date(record.createdAt).toLocaleString('zh-TW')}</td></tr>
            <tr><td>開始時間</td><td>${new Date(record.startTime).toLocaleString('zh-TW')}</td></tr>
            <tr><td>結束時間</td><td>${record.endTime ? new Date(record.endTime).toLocaleString('zh-TW') : 'N/A'}</td></tr>
          </table>
        </div>
      </div>
    `;

    const modal = new Modal({
      title: `⚡ 能耗記錄詳情 - ${record.id}`,
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
}

function addStyles() {
  if (!document.getElementById('energy-page-styles')) {
    const style = document.createElement('style');
    style.id = 'energy-page-styles';
    style.textContent = `
      .energy-page {
        padding: var(--spacing-xl);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
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

      .stat-card-warning {
        border-color: #f59e0b;
        background: #fef3c7;
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

      .comparison-section {
        margin-bottom: var(--spacing-xl);
      }

      .comparison-card {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        box-shadow: var(--shadow-sm);
      }

      .comparison-card h3 {
        margin-bottom: var(--spacing-lg);
      }

      .comparison-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-md);
      }

      .comparison-item {
        text-align: center;
      }

      .comparison-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xs);
      }

      .comparison-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .comparison-sublabel {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        margin-top: var(--spacing-xs);
      }

      .comparison-message {
        text-align: center;
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .quick-actions-section {
        margin-bottom: var(--spacing-xl);
      }

      .quick-actions-section h3 {
        margin-bottom: var(--spacing-md);
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg);
      }

      .action-card {
        background: var(--bg-color);
        border: 2px dashed var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-card:hover {
        border-color: var(--primary-color);
        background: var(--primary-light);
        transform: translateY(-2px);
      }

      .action-icon {
        font-size: 3rem;
        margin-bottom: var(--spacing-md);
      }

      .action-title {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
        color: var(--text-primary);
      }

      .action-desc {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .device-section {
        margin-top: var(--spacing-xl);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
      }

      .filter-tabs {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .tab-btn {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        background: var(--bg-color);
        color: var(--text-secondary);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s;
      }

      .tab-btn:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .tab-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .energy-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: var(--spacing-lg);
      }

      .energy-card {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
        transition: all 0.2s;
      }

      .energy-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .energy-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
      }

      .energy-device {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: 1rem;
      }

      .device-icon {
        font-size: 1.5rem;
      }

      .energy-status {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-md);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .status-normal {
        background: #d1fae5;
        color: #065f46;
      }

      .status-abnormal {
        background: #fee2e2;
        color: #991b1b;
      }

      .energy-card-body {
        margin-bottom: var(--spacing-md);
      }

      .energy-info-row {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-xs) 0;
        font-size: 0.875rem;
      }

      .info-label {
        color: var(--text-secondary);
      }

      .info-value {
        font-weight: 600;
        color: var(--text-primary);
      }

      .info-value-link {
        color: var(--primary-color);
        text-decoration: none;
        transition: all 0.2s;
        cursor: pointer;
      }

      .info-value-link:hover {
        color: var(--primary-hover);
        text-decoration: underline;
      }

      .text-error {
        color: #ef4444 !important;
      }

      .energy-card-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      .energy-card-actions button {
        flex: 1;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--bg-color);
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s;
      }

      .btn-detail:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .modal-form,
      .energy-detail,
      .recommendations,
      .anomalies {
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

      .form-group input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-family: var(--font-family);
        font-size: 0.875rem;
      }

      .form-group small {
        display: block;
        margin-top: var(--spacing-xs);
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }

      .info-box {
        background: var(--primary-light);
        border: 1px solid var(--primary-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        margin-top: var(--spacing-md);
      }

      .info-box p {
        margin: 0 0 var(--spacing-sm) 0;
      }

      .info-box ul {
        margin: 0;
        padding-left: var(--spacing-lg);
      }

      .info-box li {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xs);
      }

      .search-result {
        padding: var(--spacing-md) 0;
      }

      .result-card,
      .detail-section {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-md);
      }

      .result-card h4,
      .detail-section h4 {
        margin-bottom: var(--spacing-md);
      }

      .result-table,
      .detail-table {
        width: 100%;
        font-size: 0.875rem;
      }

      .result-table td,
      .detail-table td {
        padding: var(--spacing-xs) 0;
      }

      .result-table td:first-child,
      .detail-table td:first-child {
        color: var(--text-secondary);
        width: 40%;
      }

      .result-table td:last-child,
      .detail-table td:last-child {
        font-weight: 600;
        text-align: right;
      }

      .device-breakdown {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-sm);
      }

      .device-item {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-sm);
        background: var(--bg-color);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
      }

      .recommendations-intro,
      .anomalies-intro {
        margin-bottom: var(--spacing-lg);
        color: var(--text-secondary);
      }

      .recommendations-list,
      .anomalies-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .recommendation-item {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-left: 4px solid #10b981;
        border-radius: var(--radius-md);
      }

      .rec-number {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #10b981;
        color: white;
        border-radius: 50%;
        font-weight: 700;
        flex-shrink: 0;
      }

      .rec-content {
        flex: 1;
      }

      .rec-device {
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
        color: var(--text-primary);
      }

      .rec-message {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xs);
      }

      .rec-potential {
        font-size: 0.875rem;
        color: #10b981;
      }

      .anomaly-item {
        padding: var(--spacing-md);
        background: #fef2f2;
        border-left: 4px solid #ef4444;
        border-radius: var(--radius-md);
      }

      .anomaly-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-sm);
      }

      .anomaly-device {
        font-weight: 600;
        color: var(--text-primary);
      }

      .anomaly-order {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .anomaly-message {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-sm);
      }

      .anomaly-details {
        display: flex;
        gap: var(--spacing-md);
        font-size: 0.75rem;
        color: #ef4444;
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
    `;
    document.head.appendChild(style);
  }
}
