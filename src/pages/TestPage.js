import { Button } from '../components/common/Button.js';
import { testRunner } from '../utils/testRunner.js';
import { registerAllScenarios } from '../utils/testScenarios.js';
import { FormInstanceModel, generateApplicationNo } from '../utils/dataModel.js';
import { getCurrentIndustry } from '../config/industry.config.js';
import { IndustryFieldsManager } from '../utils/industryFieldsManager.js';
import { WorkOrderHelper } from '../utils/workOrderHelper.js';
import { WorkOrderNumberGenerator } from '../utils/workOrderNumberGenerator.js';

export class TestPage {
  constructor() {
    this.report = null;
    this.isRunning = false;
  }

  render() {
    const page = document.createElement('div');
    page.className = 'test-page';

    page.innerHTML = `
      <div class="test-header">
        <h2>🧪 系統測試中心</h2>
        <p class="text-secondary">執行系統測試、工單資料管理與驗證工具</p>
      </div>

      <!-- 系統統計 -->
      <div class="stats-section">
        <h3>📊 系統統計</h3>
        <div class="stats-grid" id="stats-grid"></div>
      </div>

      <!-- 資料管理 -->
      <div class="data-management-section">
        <h3>💾 資料管理</h3>
        <div class="data-controls" id="data-controls"></div>
      </div>

      <!-- 工單測試 -->
      <div class="work-order-section">
        <h3>📝 工單測試</h3>
        <div class="work-order-controls" id="work-order-controls"></div>
        <div class="work-order-list" id="work-order-list"></div>
      </div>

      <!-- 自動化測試 -->
      <div class="automation-section">
        <h3>🤖 自動化測試</h3>
        <div class="test-controls">
          <div id="test-buttons"></div>
        </div>
      </div>

      <div id="test-report-container"></div>

      <style>
        .test-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .test-header {
          margin-bottom: 32px;
        }

        .test-header h2 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .test-page h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .stats-section,
        .data-management-section,
        .work-order-section,
        .automation-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: white;
          color: var(--primary-color);
          padding: 20px;
          border-radius: var(--radius-lg);
          text-align: center;
          border: 2px solid var(--primary-color);
        }

        .stat-card.warning {
          color: var(--warning-color);
          border-color: var(--warning-color);
        }

        .stat-card.info {
          color: var(--info-color);
          border-color: var(--info-color);
        }

        .stat-card.success {
          color: var(--success-color);
          border-color: var(--success-color);
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.7;
          margin-bottom: 8px;
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
        }

        .data-controls,
        .work-order-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .test-controls {
          margin-bottom: 24px;
        }

        .test-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .work-order-list {
          margin-top: 20px;
        }

        .work-order-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .work-order-table thead {
          background: #f9fafb;
        }

        .work-order-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        .work-order-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #1f2937;
          border-bottom: 1px solid #f3f4f6;
        }

        .work-order-table tbody tr:hover {
          background: #f9fafb;
        }

        .work-order-table tbody tr:last-child td {
          border-bottom: none;
        }

        .work-order-no {
          font-weight: 600;
          color: #3b82f6;
          text-decoration: none;
          transition: color 0.2s;
        }

        .work-order-no:hover {
          color: #2563eb;
          text-decoration: underline;
        }

        .work-order-status-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
          white-space: nowrap;
        }

        .work-order-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 4px 10px;
          font-size: 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .action-btn.primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .action-btn.primary:hover {
          background: #2563eb;
          border-color: #2563eb;
        }

        .action-btn.danger {
          color: #dc2626;
          border-color: #fca5a5;
        }

        .action-btn.danger:hover {
          background: #fef2f2;
          border-color: #dc2626;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #9ca3af;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .test-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .test-summary-card {
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: white;
        }

        .test-summary-card.success {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .test-summary-card.failed {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .test-summary-card.error {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .test-summary-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .test-summary-value {
          font-size: 32px;
          font-weight: 700;
        }

        .test-summary-card.success .test-summary-value {
          color: #10b981;
        }

        .test-summary-card.failed .test-summary-value {
          color: #ef4444;
        }

        .test-summary-card.error .test-summary-value {
          color: #f59e0b;
        }

        .test-results {
          margin-top: 24px;
        }

        .test-result-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
          overflow: hidden;
          background: white;
        }

        .test-result-header {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .test-result-header:hover {
          background-color: #f9fafb;
        }

        .test-result-header.passed {
          border-left: 4px solid #10b981;
        }

        .test-result-header.failed {
          border-left: 4px solid #ef4444;
        }

        .test-result-header.error {
          border-left: 4px solid #f59e0b;
        }

        .test-result-title {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .test-result-status {
          font-size: 20px;
        }

        .test-result-name {
          font-weight: 500;
          font-size: 15px;
        }

        .test-result-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          color: #6b7280;
        }

        .test-result-body {
          padding: 16px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          display: none;
        }

        .test-result-body.expanded {
          display: block;
        }

        .assertion-list {
          margin-top: 12px;
        }

        .assertion-item {
          padding: 8px 12px;
          margin-bottom: 6px;
          border-radius: 4px;
          font-size: 13px;
          display: flex;
          align-items: start;
          gap: 8px;
        }

        .assertion-item.passed {
          background: #f0fdf4;
          border-left: 3px solid #10b981;
        }

        .assertion-item.failed {
          background: #fef2f2;
          border-left: 3px solid #ef4444;
        }

        .assertion-icon {
          flex-shrink: 0;
        }

        .assertion-message {
          flex: 1;
        }

        .error-list {
          margin-top: 12px;
        }

        .error-item {
          padding: 12px;
          background: #fef2f2;
          border-left: 3px solid #ef4444;
          border-radius: 4px;
          margin-bottom: 8px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          color: #dc2626;
        }

        .log-list {
          margin-top: 12px;
        }

        .log-item {
          padding: 6px 12px;
          background: #f3f4f6;
          border-radius: 4px;
          margin-bottom: 4px;
          font-size: 12px;
          color: #4b5563;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .badge-success {
          background: #d1fae5;
          color: #065f46;
        }

        .badge-danger {
          background: #fee2e2;
          color: #991b1b;
        }

        .badge-warning {
          background: #fef3c7;
          color: #92400e;
        }

        .badge-info {
          background: #dbeafe;
          color: #1e40af;
        }

        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin: 16px 0;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          transition: width 0.3s ease;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .running-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #eff6ff;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          margin-bottom: 24px;
        }
      </style>
    `;

    // 渲染各個區塊
    this.renderStats(page);
    this.renderDataControls(page);
    this.renderWorkOrderControls(page);
    this.renderWorkOrderList(page);

    const buttonsContainer = page.querySelector('#test-buttons');
    this.renderButtons(buttonsContainer);

    return page;
  }

  renderStats(page) {
    const statsGrid = page.querySelector('#stats-grid');
    const instances = FormInstanceModel.getAll();

    const stats = [
      { label: '總工單數', value: instances.length, color: '' },
      { label: '待處理', value: instances.filter(i => i.status === 'pending').length, color: 'warning' },
      { label: '進行中', value: instances.filter(i => i.status === 'in_progress').length, color: 'info' },
      { label: '已完成', value: instances.filter(i => i.status === 'approved' || i.status === 'completed').length, color: 'success' }
    ];

    statsGrid.innerHTML = stats.map(stat => `
      <div class="stat-card ${stat.color}">
        <div class="stat-label">${stat.label}</div>
        <div class="stat-value">${stat.value}</div>
      </div>
    `).join('');
  }

  renderDataControls(page) {
    const container = page.querySelector('#data-controls');
    container.innerHTML = '';

    const refreshBtn = new Button({
      text: '🔄 重新整理',
      variant: 'outline',
      onClick: () => {
        this.renderStats(page);
        this.renderWorkOrderList(page);
      }
    });

    const clearAllBtn = new Button({
      text: '🗑️ 清除所有工單',
      variant: 'outline',
      onClick: () => this.clearAllWorkOrders(page)
    });

    const testFieldsBtn = new Button({
      text: '✅ 測試欄位載入',
      variant: 'outline',
      onClick: () => this.testFieldGroups()
    });

    container.appendChild(refreshBtn.render());
    container.appendChild(clearAllBtn.render());
    container.appendChild(testFieldsBtn.render());
  }

  renderWorkOrderControls(page) {
    const container = page.querySelector('#work-order-controls');
    container.innerHTML = '';

    const createSampleBtn = new Button({
      text: '📝 建立範例工單 (10筆)',
      variant: 'primary',
      onClick: () => this.createSampleWorkOrders(page)
    });

    const openApplyBtn = new Button({
      text: '🚀 開啟建立工單頁',
      variant: 'outline',
      onClick: () => window.open('#/apply', '_blank')
    });

    const openFormsBtn = new Button({
      text: '📋 開啟工單管理頁',
      variant: 'outline',
      onClick: () => window.open('#/forms', '_blank')
    });

    container.appendChild(createSampleBtn.render());
    container.appendChild(openApplyBtn.render());
    container.appendChild(openFormsBtn.render());
  }

  renderWorkOrderList(page) {
    const container = page.querySelector('#work-order-list');
    const instances = FormInstanceModel.getAll();

    if (instances.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div>尚無工單資料</div>
          <div style="font-size: 14px; margin-top: 8px;">點擊「建立範例工單」來建立測試資料</div>
        </div>
      `;
      return;
    }

    const statusColors = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      paused: '#9ca3af',
      completed: '#10b981',
      approved: '#10b981',
      rejected: '#ef4444'
    };

    const statusLabels = {
      pending: '待處理',
      in_progress: '進行中',
      paused: '暫停',
      completed: '已完成',
      approved: '已核准',
      rejected: '已退回'
    };

    // 渲染表格
    container.innerHTML = `
      <table class="work-order-table">
        <thead>
          <tr>
            <th>工單編號</th>
            <th>批次號</th>
            <th>濾網類型</th>
            <th>數量</th>
            <th>再生次數</th>
            <th>申請人</th>
            <th>狀態</th>
            <th>建立時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${instances.map(instance => {
            const statusColor = statusColors[instance.status] || '#9ca3af';
            const statusLabel = statusLabels[instance.status] || instance.status;
            const createDate = new Date(instance.createdAt).toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });

            return `
              <tr data-id="${instance.id}">
                <td>
                  <a href="#/apply?id=${instance.id}" class="work-order-no">${instance.applicationNo}</a>
                </td>
                <td>${instance.data.batchNo || '-'}</td>
                <td>${instance.data.filterType || '-'}</td>
                <td>${instance.data.quantity || 0} 片</td>
                <td>${instance.data.regenerationCycle || '-'}</td>
                <td>${instance.applicant}</td>
                <td>
                  <span class="work-order-status-badge" style="background: ${statusColor}20; color: ${statusColor};">
                    ${statusLabel}
                  </span>
                </td>
                <td style="font-size: 13px; color: #6b7280;">${createDate}</td>
                <td>
                  <div class="work-order-actions">
                    <button class="action-btn primary btn-edit" data-id="${instance.id}">編輯</button>
                    <button class="action-btn btn-view" data-id="${instance.id}">查看</button>
                    <button class="action-btn danger btn-delete" data-id="${instance.id}">刪除</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // 綁定事件
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        window.open(`#/apply?id=${id}`, '_blank');
      });
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.deleteWorkOrder(id, page);
      });
    });

    container.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.viewWorkOrderData(id);
      });
    });
  }

  createSampleWorkOrders(page) {
    const year = new Date().getFullYear();
    const sourceFactories = ['柳營廠', '台南廠', '高雄廠', '桃園廠'];
    const filterTypes = ['活性碳濾網', '化學濾網', '複合濾網', '高效濾網'];
    const regenerationCycles = ['R0 (首次再生)', 'R1 (第二次)', 'R2 (第三次)', 'R3 (第四次)'];
    const ovenIds = ['烘箱-01', '烘箱-02', '烘箱-03', '烘箱-04'];
    const degassingResults = ['合格', '未達標(加抽2片)', '待檢驗'];
    const aoiResults = ['OK', 'NG-污染', 'NG-瑕疵'];
    const rfidStatus = ['已更換', '待更換', '異常'];
    const qualityGrades = ['A (優良)', 'B (良好)', 'C (合格)'];
    const statuses = ['pending', 'in_progress', 'completed', 'approved'];
    const operators = ['王小明', '張志強', '劉建國', '黃建華', '鄭文傑', '陳美玲', '林佳穎', '吳志明', '謝雅婷', '周建宏'];

    const sampleCount = 10;

    for (let i = 0; i < sampleCount; i++) {
      const workOrderNo = WorkOrderNumberGenerator.generate();
      const batchNo = `BATCH-${String(i + 1).padStart(4, '0')}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const createdTime = Date.now() - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000);

      const deglueStart = new Date(createdTime + 3600000).toISOString().slice(0, 16);
      const deglueEnd = new Date(createdTime + 7200000).toISOString().slice(0, 16);
      const ovenStart = new Date(createdTime + 7200000).toISOString().slice(0, 16);
      const ovenEnd = new Date(createdTime + 18000000).toISOString().slice(0, 16);
      const inspectionTime = new Date(createdTime + 19000000).toISOString().slice(0, 16);
      const packageTime = new Date(createdTime + 20000000).toISOString().slice(0, 16);

      const data = {
        workOrderNo,
        batchNo,
        sourceFactory: sourceFactories[Math.floor(Math.random() * sourceFactories.length)],
        filterType: filterTypes[Math.floor(Math.random() * filterTypes.length)],
        quantity: 50 + Math.floor(Math.random() * 100),
        regenerationCycle: regenerationCycles[Math.floor(Math.random() * regenerationCycles.length)],
        deglueOperator: operators[i],
        deglueStartTime: deglueStart,
        deglueEndTime: status !== 'pending' ? deglueEnd : '',
        ovenId: ovenIds[Math.floor(Math.random() * ovenIds.length)],
        targetTemp: 140 + Math.floor(Math.random() * 30),
        bakingTime: 150 + Math.floor(Math.random() * 100),
        ovenStartTime: status !== 'pending' ? ovenStart : '',
        ovenEndTime: status === 'completed' || status === 'approved' ? ovenEnd : '',
        degassingTest: status === 'completed' || status === 'approved' ?
          degassingResults[Math.floor(Math.random() * degassingResults.length)] : '待檢驗',
        aoiResult: status === 'completed' || status === 'approved' ?
          aoiResults[Math.floor(Math.random() * aoiResults.length)] : '待檢驗',
        inspectionOperator: status === 'completed' || status === 'approved' ? operators[(i + 5) % operators.length] : '',
        inspectionTime: status === 'completed' || status === 'approved' ? inspectionTime : '',
        rfidUpdate: status === 'completed' || status === 'approved' ?
          rfidStatus[Math.floor(Math.random() * rfidStatus.length)] : '待更換',
        palletId: status === 'completed' || status === 'approved' ? `PLT-${String(Math.floor(i / 5) + 1).padStart(4, '0')}` : '',
        packageTime: status === 'completed' || status === 'approved' ? packageTime : '',
        warehouseLocation: status === 'approved' ? `A${Math.floor(i / 10) + 1}-${String((i % 10) + 1).padStart(2, '0')}` : '',
        inboundTime: status === 'approved' ? new Date(createdTime + 21000000).toISOString().slice(0, 16) : '',
        outboundTime: '',
        customerOrderNo: '',
        ovenEnergyConsumption: status !== 'pending' ? (80 + Math.random() * 40).toFixed(2) : '',
        totalEnergyCost: status !== 'pending' ? (400 + Math.random() * 200).toFixed(2) : '',
        mauFfuEnergy: status !== 'pending' ? (30 + Math.random() * 20).toFixed(2) : '',
        filterEfficiency: status === 'completed' || status === 'approved' ? (92 + Math.random() * 6).toFixed(1) : '',
        expectedLifespan: status === 'completed' || status === 'approved' ? (6 + Math.floor(Math.random() * 12)) : '',
        qualityGrade: status === 'completed' || status === 'approved' ?
          qualityGrades[Math.floor(Math.random() * qualityGrades.length)] : '',
        remarks: ''
      };

      const instance = new FormInstanceModel({
        applicationNo: workOrderNo,
        formName: '柳營再生濾網工單',
        applicant: operators[i],
        department: '製程部',
        data: data,
        status: status
      });

      instance.createdAt = createdTime;
      instance.save();
    }

    alert(`✅ 成功建立 ${sampleCount} 筆範例工單`);
    this.renderStats(page);
    this.renderWorkOrderList(page);
  }

  clearAllWorkOrders(page) {
    if (confirm('確定要清除所有工單嗎？此操作無法復原。')) {
      // 清除所有工單
      const instances = FormInstanceModel.getAll();
      instances.forEach(instance => {
        FormInstanceModel.delete(instance.id);
      });

      alert('🗑️ 已清除所有工單');
      this.renderStats(page);
      this.renderWorkOrderList(page);
    }
  }

  deleteWorkOrder(id, page) {
    if (confirm('確定要刪除此工單嗎？')) {
      FormInstanceModel.delete(id);
      alert('🗑️ 已刪除工單');
      this.renderStats(page);
      this.renderWorkOrderList(page);
    }
  }

  viewWorkOrderData(id) {
    const instance = FormInstanceModel.getById(id);
    if (instance) {
      const data = JSON.stringify(instance, null, 2);
      const win = window.open('', '_blank');
      win.document.write(`
        <html>
          <head>
            <title>工單資料 - ${instance.applicationNo}</title>
            <style>
              body {
                font-family: monospace;
                padding: 20px;
                background: #1e1e1e;
                color: #d4d4d4;
              }
              pre {
                background: #252526;
                padding: 20px;
                border-radius: 8px;
                overflow-x: auto;
              }
              h2 { color: #4fc3f7; }
            </style>
          </head>
          <body>
            <h2>📦 工單資料: ${instance.applicationNo}</h2>
            <pre>${data}</pre>
          </body>
        </html>
      `);
    }
  }

  async testFieldGroups() {
    try {
      const industry = getCurrentIndustry();
      const fieldsModule = await industry.fields();
      const { fieldGroups } = fieldsModule;

      const config = IndustryFieldsManager.getConfig(industry.id);
      const mergedGroups = IndustryFieldsManager.mergeFields(fieldGroups, config);

      const message = `✅ 欄位群組載入成功！\n\n` +
        `產業模組: ${industry.name}\n` +
        `欄位群組數: ${mergedGroups.length}\n\n` +
        mergedGroups.map((group, index) => {
          const fieldCount = group.fields.reduce((count, field) => {
            if (field.type === 'group' && field.fields) {
              return count + field.fields.length;
            }
            return count + 1;
          }, 0);
          return `${index + 1}. ${group.icon} ${group.title} - ${fieldCount} 個欄位`;
        }).join('\n');

      alert(message);
    } catch (error) {
      alert(`❌ 欄位群組載入失敗: ${error.message}`);
    }
  }

  renderButtons(container) {
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'test-buttons';

    const runAllBtn = new Button({
      text: '🚀 執行所有測試',
      variant: 'primary',
      disabled: this.isRunning,
      onClick: () => this.runAllTests()
    });

    const runWorkOrderBtn = new Button({
      text: '📝 工單管理',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('workorder')
    });

    const runStationBtn = new Button({
      text: '🏭 製程站點',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('station')
    });

    const runWorkflowBtn = new Button({
      text: '🔄 工作流程',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('workflow')
    });

    const runSPCBtn = new Button({
      text: '📊 SPC 品管',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('spc')
    });

    const runWMSBtn = new Button({
      text: '📦 WMS 倉儲',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('wms')
    });

    const runEnergyBtn = new Button({
      text: '⚡ 能源管理',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('energy')
    });

    const runGoldenBtn = new Button({
      text: '🏆 Golden Recipe',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('golden')
    });

    const runOrgBtn = new Button({
      text: '👥 組織管理',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('organization')
    });

    const runPermissionBtn = new Button({
      text: '🔐 權限管理',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('permission')
    });

    const runReportBtn = new Button({
      text: '📈 報表統計',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('report')
    });

    const runSimulatorBtn = new Button({
      text: '🎮 系統模擬器',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runSpecificTests('simulator')
    });

    const runWorkOrderNoBtn = new Button({
      text: '🔢 工單號系統',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.runWorkOrderNumberTests()
    });

    const clearBtn = new Button({
      text: '🗑️ 清除結果',
      variant: 'outline',
      disabled: this.isRunning,
      onClick: () => this.clearResults()
    });

    buttonsDiv.appendChild(runAllBtn.render());
    buttonsDiv.appendChild(runWorkOrderNoBtn.render());
    buttonsDiv.appendChild(runWorkOrderBtn.render());
    buttonsDiv.appendChild(runStationBtn.render());
    buttonsDiv.appendChild(runWorkflowBtn.render());
    buttonsDiv.appendChild(runSPCBtn.render());
    buttonsDiv.appendChild(runWMSBtn.render());
    buttonsDiv.appendChild(runEnergyBtn.render());
    buttonsDiv.appendChild(runGoldenBtn.render());
    buttonsDiv.appendChild(runOrgBtn.render());
    buttonsDiv.appendChild(runPermissionBtn.render());
    buttonsDiv.appendChild(runReportBtn.render());
    buttonsDiv.appendChild(runSimulatorBtn.render());
    buttonsDiv.appendChild(clearBtn.render());

    container.appendChild(buttonsDiv);
  }

  async runAllTests() {
    this.isRunning = true;
    this.showRunningIndicator();

    try {
      // 註冊所有測試劇本
      testRunner.clear();
      registerAllScenarios();

      // 執行測試
      const report = await testRunner.runAll();
      this.report = report;

      // 顯示報告
      this.renderReport();
    } catch (error) {
      console.error('測試執行錯誤:', error);
      alert(`測試執行失敗：${error.message}`);
    } finally {
      this.isRunning = false;
      this.hideRunningIndicator();
    }
  }

  async runSpecificTests(category) {
    this.isRunning = true;
    this.showRunningIndicator();

    try {
      testRunner.clear();

      // 根據類別註冊測試
      const scenarios = await import('../utils/testScenarios.js');

      switch (category) {
        case 'workorder':
          // 工單管理測試
          if (scenarios.registerWorkOrderScenarios) {
            scenarios.registerWorkOrderScenarios();
          }
          break;
        case 'station':
          // 製程站點測試
          if (scenarios.registerStationScenarios) {
            scenarios.registerStationScenarios();
          }
          break;
        case 'workflow':
          // 工作流程測試
          if (scenarios.registerWorkflowEngineScenarios) {
            scenarios.registerWorkflowEngineScenarios();
          }
          break;
        case 'spc':
          // SPC 品管測試
          if (scenarios.registerSPCScenarios) {
            scenarios.registerSPCScenarios();
          }
          break;
        case 'wms':
          // WMS 倉儲管理測試
          if (scenarios.registerWMSScenarios) {
            scenarios.registerWMSScenarios();
          }
          break;
        case 'energy':
          // 能源管理測試
          if (scenarios.registerEnergyScenarios) {
            scenarios.registerEnergyScenarios();
          }
          break;
        case 'golden':
          // Golden Recipe 測試
          if (scenarios.registerGoldenRecipeScenarios) {
            scenarios.registerGoldenRecipeScenarios();
          }
          break;
        case 'organization':
          // 組織管理測試
          if (scenarios.registerOrganizationScenarios) {
            scenarios.registerOrganizationScenarios();
          }
          break;
        case 'permission':
          // 權限管理測試
          if (scenarios.registerPermissionScenarios) {
            scenarios.registerPermissionScenarios();
          }
          break;
        case 'report':
          // 報表統計測試
          if (scenarios.registerReportScenarios) {
            scenarios.registerReportScenarios();
          }
          break;
        case 'simulator':
          // 系統模擬器測試
          if (scenarios.registerSimulatorScenarios) {
            scenarios.registerSimulatorScenarios();
          }
          break;
      }

      const report = await testRunner.runAll();
      this.report = report;
      this.renderReport();
    } catch (error) {
      console.error('測試執行錯誤:', error);
      alert(`測試執行失敗：${error.message}`);
    } finally {
      this.isRunning = false;
      this.hideRunningIndicator();
    }
  }

  showRunningIndicator() {
    const container = document.querySelector('#test-report-container');
    container.innerHTML = `
      <div class="running-indicator">
        <div class="spinner"></div>
        <span>測試執行中，請稍候...</span>
      </div>
    `;
  }

  hideRunningIndicator() {
    const indicator = document.querySelector('.running-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  renderReport() {
    if (!this.report) return;

    const container = document.querySelector('#test-report-container');
    const { summary, results } = this.report;

    container.innerHTML = `
      <div class="test-summary">
        <div class="test-summary-card">
          <div class="test-summary-label">總測試數</div>
          <div class="test-summary-value">${summary.total}</div>
        </div>
        <div class="test-summary-card success">
          <div class="test-summary-label">通過</div>
          <div class="test-summary-value">${summary.passed}</div>
        </div>
        <div class="test-summary-card failed">
          <div class="test-summary-label">失敗</div>
          <div class="test-summary-value">${summary.failed}</div>
        </div>
        <div class="test-summary-card error">
          <div class="test-summary-label">錯誤</div>
          <div class="test-summary-value">${summary.errors}</div>
        </div>
        <div class="test-summary-card">
          <div class="test-summary-label">通過率</div>
          <div class="test-summary-value">${summary.passRate}%</div>
        </div>
        <div class="test-summary-card">
          <div class="test-summary-label">執行時間</div>
          <div class="test-summary-value">${(summary.duration / 1000).toFixed(2)}s</div>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" style="width: ${summary.passRate}%"></div>
      </div>

      <div class="test-results">
        <h3>測試結果詳情</h3>
        <div id="test-results-list"></div>
      </div>
    `;

    const resultsList = container.querySelector('#test-results-list');
    results.forEach(result => {
      resultsList.appendChild(this.createResultItem(result));
    });
  }

  createResultItem(result) {
    const item = document.createElement('div');
    item.className = 'test-result-item';

    const statusIcon = {
      passed: '✅',
      failed: '❌',
      error: '⚠️'
    }[result.status] || '❓';

    const header = document.createElement('div');
    header.className = `test-result-header ${result.status}`;
    header.innerHTML = `
      <div class="test-result-title">
        <span class="test-result-status">${statusIcon}</span>
        <span class="test-result-name">${result.name}</span>
        <span class="badge badge-info">${result.type === 'scenario' ? '劇本' : '測試'}</span>
      </div>
      <div class="test-result-meta">
        <span>${result.assertions.length} 個斷言</span>
        <span>${result.duration}ms</span>
        <span class="badge ${result.status === 'passed' ? 'badge-success' : result.status === 'failed' ? 'badge-danger' : 'badge-warning'}">
          ${result.status.toUpperCase()}
        </span>
      </div>
    `;

    const body = document.createElement('div');
    body.className = 'test-result-body';

    // 顯示斷言
    if (result.assertions.length > 0) {
      const assertionsHtml = `
        <h4>斷言結果</h4>
        <div class="assertion-list">
          ${result.assertions.map(assertion => `
            <div class="assertion-item ${assertion.passed ? 'passed' : 'failed'}">
              <span class="assertion-icon">${assertion.passed ? '✓' : '✗'}</span>
              <div class="assertion-message">
                <div><strong>${assertion.type}</strong></div>
                <div>${assertion.message}</div>
                ${!assertion.passed ? `
                  <div style="margin-top: 4px; font-size: 12px;">
                    期望: ${JSON.stringify(assertion.expected)}<br>
                    實際: ${JSON.stringify(assertion.actual)}
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
      body.innerHTML += assertionsHtml;
    }

    // 顯示錯誤
    if (result.errors.length > 0) {
      const errorsHtml = `
        <h4>錯誤訊息</h4>
        <div class="error-list">
          ${result.errors.map(error => `
            <div class="error-item">${error}</div>
          `).join('')}
        </div>
      `;
      body.innerHTML += errorsHtml;
    }

    // 顯示日誌
    if (result.logs.length > 0) {
      const logsHtml = `
        <h4>測試日誌</h4>
        <div class="log-list">
          ${result.logs.map(log => `
            <div class="log-item">${log.message}</div>
          `).join('')}
        </div>
      `;
      body.innerHTML += logsHtml;
    }

    // 點擊展開/收合
    header.addEventListener('click', () => {
      body.classList.toggle('expanded');
    });

    item.appendChild(header);
    item.appendChild(body);

    return item;
  }

  clearResults() {
    this.report = null;
    const container = document.querySelector('#test-report-container');
    container.innerHTML = '';
  }

  async runWorkOrderNumberTests() {
    this.isRunning = true;
    this.showRunningIndicator();

    try {
      const results = [];
      let totalPassed = 0;
      let totalFailed = 0;
      const startTime = Date.now();

      // Test 1: 工單號碼產生器
      const test1 = await this.testWorkOrderGeneration();
      results.push(test1);
      if (test1.status === 'passed') totalPassed++;
      else totalFailed++;

      // Test 2: 工單號唯一性
      const test2 = await this.testWorkOrderUniqueness();
      results.push(test2);
      if (test2.status === 'passed') totalPassed++;
      else totalFailed++;

      // Test 3: 工單號格式驗證
      const test3 = await this.testWorkOrderFormat();
      results.push(test3);
      if (test3.status === 'passed') totalPassed++;
      else totalFailed++;

      // Test 4: 批次建立功能
      const test4 = await this.testBatchCreation();
      results.push(test4);
      if (test4.status === 'passed') totalPassed++;
      else totalFailed++;

      // Test 5: 工單資料完整性
      const test5 = await this.testWorkOrderDataIntegrity();
      results.push(test5);
      if (test5.status === 'passed') totalPassed++;
      else totalFailed++;

      // Test 6: 年度序號機制
      const test6 = await this.testYearSequence();
      results.push(test6);
      if (test6.status === 'passed') totalPassed++;
      else totalFailed++;

      const duration = Date.now() - startTime;
      const totalTests = results.length;
      const passRate = Math.round((totalPassed / totalTests) * 100);

      this.report = {
        summary: {
          total: totalTests,
          passed: totalPassed,
          failed: totalFailed,
          errors: 0,
          passRate: passRate,
          duration: duration
        },
        results: results
      };

      this.renderReport();
    } catch (error) {
      console.error('工單號測試執行錯誤:', error);
      alert(`測試執行失敗：${error.message}`);
    } finally {
      this.isRunning = false;
      this.hideRunningIndicator();
    }
  }

  async testWorkOrderGeneration() {
    const startTime = Date.now();
    const assertions = [];
    const logs = [];
    const errors = [];

    try {
      const before = FormInstanceModel.getAll().length;
      logs.push({ message: `測試前工單數：${before}` });

      // 產生3筆工單
      WorkOrderNumberGenerator.clearSession();
      const createdOrders = [];

      for (let i = 0; i < 3; i++) {
        const workOrderNo = WorkOrderNumberGenerator.generate();
        logs.push({ message: `產生工單號：${workOrderNo}` });

        const instance = new FormInstanceModel({
          applicationNo: workOrderNo,
          formName: '柳營再生濾網工單',
          applicant: '測試系統',
          department: '生管部',
          data: {
            workOrderNo: workOrderNo,
            batchNo: `BATCH-${workOrderNo.replace('MSW-', '')}`,
            sourceFactory: '柳營廠',
            filterType: '活性碳濾網',
            quantity: 50,
            regenerationCycle: 'R0 (首次再生)'
          },
          status: 'pending'
        });

        instance.save();
        createdOrders.push(workOrderNo);
      }

      WorkOrderNumberGenerator.clearSession();

      const after = FormInstanceModel.getAll().length;
      logs.push({ message: `測試後工單數：${after}` });

      const created = after - before;
      assertions.push({
        type: 'assertEqual',
        message: '應成功建立 3 筆工單',
        passed: created === 3,
        expected: 3,
        actual: created
      });

      return {
        name: '📋 工單號碼產生器',
        type: 'test',
        status: created === 3 ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    } catch (error) {
      errors.push(error.message);
      return {
        name: '📋 工單號碼產生器',
        type: 'test',
        status: 'error',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    }
  }

  async testWorkOrderUniqueness() {
    const startTime = Date.now();
    const assertions = [];
    const logs = [];
    const errors = [];

    try {
      const workOrders = FormInstanceModel.getAll();
      const mswOrders = workOrders.filter(wo =>
        wo.data && wo.data.workOrderNo && wo.data.workOrderNo.startsWith('MSW-')
      );

      const numbers = mswOrders.map(wo => wo.data.workOrderNo);
      const unique = [...new Set(numbers)];

      logs.push({ message: `總工單數：${numbers.length}` });
      logs.push({ message: `唯一工單號數：${unique.length}` });

      const isUnique = numbers.length === unique.length;

      if (!isUnique) {
        const duplicates = numbers.filter((no, index) =>
          numbers.indexOf(no) !== index
        );
        logs.push({ message: `發現重複工單號：${[...new Set(duplicates)].join(', ')}` });
      }

      assertions.push({
        type: 'assertTrue',
        message: '所有工單號碼都應該是唯一的',
        passed: isUnique,
        expected: true,
        actual: isUnique
      });

      return {
        name: '🔢 工單號唯一性',
        type: 'test',
        status: isUnique ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    } catch (error) {
      errors.push(error.message);
      return {
        name: '🔢 工單號唯一性',
        type: 'test',
        status: 'error',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    }
  }

  async testWorkOrderFormat() {
    const startTime = Date.now();
    const assertions = [];
    const logs = [];
    const errors = [];

    try {
      const workOrders = FormInstanceModel.getAll();
      const mswOrders = workOrders.filter(wo =>
        wo.data && wo.data.workOrderNo && wo.data.workOrderNo.startsWith('MSW-')
      );

      const pattern = /^MSW-\d{4}-\d{4}$/;
      let allValid = true;
      const invalidOrders = [];

      mswOrders.forEach(wo => {
        const no = wo.data.workOrderNo;
        if (!pattern.test(no)) {
          allValid = false;
          invalidOrders.push(no);
          logs.push({ message: `格式錯誤：${no}` });
        }
      });

      if (allValid) {
        logs.push({ message: `所有 ${mswOrders.length} 個工單號格式正確 (MSW-YYYY-NNNN)` });
      }

      assertions.push({
        type: 'assertTrue',
        message: `所有工單號應符合 MSW-YYYY-NNNN 格式`,
        passed: allValid,
        expected: true,
        actual: allValid
      });

      return {
        name: '📝 工單號格式驗證',
        type: 'test',
        status: allValid ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    } catch (error) {
      errors.push(error.message);
      return {
        name: '📝 工單號格式驗證',
        type: 'test',
        status: 'error',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    }
  }

  async testBatchCreation() {
    const startTime = Date.now();
    const assertions = [];
    const logs = [];
    const errors = [];

    try {
      const beforeCount = FormInstanceModel.getAll().filter(wo =>
        wo.data && wo.data.workOrderNo && wo.data.workOrderNo.startsWith('MSW-')
      ).length;

      logs.push({ message: `批次建立前：${beforeCount} 筆工單` });

      // 模擬批次建立 5 筆
      const batchCount = 5;
      const createdOrders = [];

      WorkOrderNumberGenerator.clearSession();

      for (let i = 0; i < batchCount; i++) {
        const workOrderNo = WorkOrderNumberGenerator.generate();
        const batchNo = `BATCH-${workOrderNo.replace('MSW-', '')}`;

        const instance = new FormInstanceModel({
          applicationNo: workOrderNo,
          formName: '柳營再生濾網工單',
          applicant: '批次測試',
          department: '生管部',
          data: {
            workOrderNo: workOrderNo,
            batchNo: batchNo,
            sourceFactory: '柳營廠',
            filterType: '化學濾網',
            quantity: 100,
            regenerationCycle: 'R1 (第二次)'
          },
          status: 'pending'
        });

        instance.save();
        createdOrders.push(workOrderNo);
      }

      WorkOrderNumberGenerator.clearSession();

      const afterCount = FormInstanceModel.getAll().filter(wo =>
        wo.data && wo.data.workOrderNo && wo.data.workOrderNo.startsWith('MSW-')
      ).length;

      logs.push({ message: `批次建立後：${afterCount} 筆工單` });
      logs.push({ message: `成功建立：${createdOrders.join(', ')}` });

      const actualCreated = afterCount - beforeCount;

      assertions.push({
        type: 'assertEqual',
        message: `應成功建立 ${batchCount} 筆工單`,
        passed: actualCreated === batchCount,
        expected: batchCount,
        actual: actualCreated
      });

      return {
        name: '🏭 批次建立功能',
        type: 'test',
        status: actualCreated === batchCount ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    } catch (error) {
      errors.push(error.message);
      return {
        name: '🏭 批次建立功能',
        type: 'test',
        status: 'error',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    }
  }

  async testWorkOrderDataIntegrity() {
    const startTime = Date.now();
    const assertions = [];
    const logs = [];
    const errors = [];

    try {
      const workOrders = FormInstanceModel.getAll();
      const mswOrders = workOrders.filter(wo =>
        wo.data && wo.data.workOrderNo && wo.data.workOrderNo.startsWith('MSW-')
      );

      let allValid = true;
      const requiredFields = ['workOrderNo', 'batchNo', 'sourceFactory', 'filterType', 'quantity', 'regenerationCycle'];

      mswOrders.forEach(wo => {
        const missing = requiredFields.filter(field => !wo.data[field]);
        if (missing.length > 0) {
          logs.push({ message: `工單 ${wo.data.workOrderNo} 缺少欄位：${missing.join(', ')}` });
          allValid = false;
        }
      });

      if (allValid) {
        logs.push({ message: `所有 ${mswOrders.length} 個工單資料完整` });
      }

      assertions.push({
        type: 'assertTrue',
        message: '所有工單應包含必要欄位',
        passed: allValid,
        expected: true,
        actual: allValid
      });

      return {
        name: '📊 工單資料完整性',
        type: 'test',
        status: allValid ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    } catch (error) {
      errors.push(error.message);
      return {
        name: '📊 工單資料完整性',
        type: 'test',
        status: 'error',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    }
  }

  async testYearSequence() {
    const startTime = Date.now();
    const assertions = [];
    const logs = [];
    const errors = [];

    try {
      const workOrders = FormInstanceModel.getAll();
      const mswOrders = workOrders.filter(wo =>
        wo.data && wo.data.workOrderNo && wo.data.workOrderNo.startsWith('MSW-')
      );

      const currentYear = new Date().getFullYear();
      const thisYearOrders = mswOrders.filter(wo =>
        wo.data.workOrderNo.startsWith(`MSW-${currentYear}-`)
      );

      logs.push({ message: `${currentYear} 年工單數：${thisYearOrders.length}` });

      // 檢查序號
      const sequences = thisYearOrders
        .map(wo => {
          const match = wo.data.workOrderNo.match(/MSW-\d{4}-(\d{4})$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .sort((a, b) => a - b);

      if (sequences.length > 0) {
        logs.push({ message: `序號範圍：${sequences[0]} ~ ${sequences[sequences.length - 1]}` });
      }

      const isValid = sequences.length > 0 && sequences[0] >= 1;

      assertions.push({
        type: 'assertTrue',
        message: '年度序號機制應正常運作',
        passed: isValid,
        expected: true,
        actual: isValid
      });

      return {
        name: '📅 年度序號機制',
        type: 'test',
        status: isValid ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    } catch (error) {
      errors.push(error.message);
      return {
        name: '📅 年度序號機制',
        type: 'test',
        status: 'error',
        duration: Date.now() - startTime,
        assertions: assertions,
        errors: errors,
        logs: logs
      };
    }
  }
}
