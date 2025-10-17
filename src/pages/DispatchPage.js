/**
 * 生管派工頁面
 * 批次建立工單、生產排程、派工管理
 */

import { FormInstanceModel } from '../utils/dataModel.js';
import { WorkOrderNumberGenerator } from '../utils/workOrderNumberGenerator.js';
import { userContext } from '../utils/userContext.js';
import { Button } from '../components/common/Button.js';

export function DispatchPage() {
  const container = document.createElement('div');
  container.className = 'dispatch-page';

  const currentUser = userContext.getCurrentUser();

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <h2>🏭 生管派工</h2>
    <p class="text-secondary">批次建立工單、生產排程與派工管理</p>
  `;
  container.appendChild(header);

  // 統計卡片區
  const statsSection = createStatsSection();
  container.appendChild(statsSection);

  // 批次開單區
  const batchCreateSection = createBatchCreateSection();
  container.appendChild(batchCreateSection);

  // 工單列表區
  const workOrderListSection = createWorkOrderListSection();
  container.appendChild(workOrderListSection);

  addStyles();
  return container;

  // ========== 功能函數 ==========

  /**
   * 建立統計卡片區
   */
  function createStatsSection() {
    const section = document.createElement('div');
    section.className = 'stats-section';

    const allWorkOrders = FormInstanceModel.getAll();
    const pending = allWorkOrders.filter(wo => wo.status === 'pending').length;
    const inProgress = allWorkOrders.filter(wo => wo.status === 'in_progress').length;
    const completed = allWorkOrders.filter(wo => wo.status === 'completed' || wo.status === 'approved').length;
    const total = allWorkOrders.length;

    section.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">總工單數</div>
            <div class="stat-value">${total}</div>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-label">待處理</div>
            <div class="stat-value">${pending}</div>
          </div>
        </div>
        <div class="stat-card progress">
          <div class="stat-icon">⚙️</div>
          <div class="stat-content">
            <div class="stat-label">進行中</div>
            <div class="stat-value">${inProgress}</div>
          </div>
        </div>
        <div class="stat-card completed">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-label">已完成</div>
            <div class="stat-value">${completed}</div>
          </div>
        </div>
      </div>
    `;

    return section;
  }

  /**
   * 建立批次開單區
   */
  function createBatchCreateSection() {
    const section = document.createElement('div');
    section.className = 'batch-create-section card';

    section.innerHTML = `
      <div class="card-header">
        <h3>📝 批次建立工單</h3>
      </div>
      <div class="card-body">
        <div class="batch-form">
          <div class="form-row">
            <div class="form-field">
              <label>濾網類型 <span class="required">*</span></label>
              <select id="filter-type" class="form-input">
                <option value="">請選擇...</option>
                <option value="活性碳濾網">活性碳濾網</option>
                <option value="化學濾網">化學濾網</option>
                <option value="複合濾網">複合濾網</option>
                <option value="高效濾網">高效濾網</option>
              </select>
            </div>

            <div class="form-field">
              <label>來源廠別 <span class="required">*</span></label>
              <select id="source-factory" class="form-input">
                <option value="">請選擇...</option>
                <option value="柳營廠">柳營廠</option>
                <option value="台南廠">台南廠</option>
                <option value="高雄廠">高雄廠</option>
                <option value="桃園廠">桃園廠</option>
              </select>
            </div>

            <div class="form-field">
              <label>再生次數 <span class="required">*</span></label>
              <select id="regeneration-cycle" class="form-input">
                <option value="">請選擇...</option>
                <option value="R0 (首次再生)">R0 (首次再生)</option>
                <option value="R1 (第二次)">R1 (第二次)</option>
                <option value="R2 (第三次)">R2 (第三次)</option>
                <option value="R3 (第四次)">R3 (第四次)</option>
                <option value="R4 (第五次)">R4 (第五次)</option>
                <option value="R5 (第六次)">R5 (第六次)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>每批數量 (片) <span class="required">*</span></label>
              <input type="number" id="quantity-per-batch" class="form-input" min="1" max="48" value="18" placeholder="每批濾網片數 (1-48)">
              <small class="field-hint">標準 Pallet 容量: 18片，最大: 48片</small>
            </div>

            <div class="form-field">
              <label>批次數量 <span class="required">*</span></label>
              <input type="number" id="batch-count" class="form-input" min="1" max="50" value="5" placeholder="要建立幾批工單">
              <small class="field-hint">一次最多建立 50 批工單</small>
            </div>

            <div class="form-field">
              <label>備註</label>
              <input type="text" id="remarks" class="form-input" placeholder="選填...">
            </div>
          </div>

          <div class="preview-section" id="preview-section" style="display: none;">
            <h4>📋 預覽將建立的工單</h4>
            <div id="preview-content"></div>
          </div>

          <div class="action-buttons">
            <button class="btn-secondary" id="btn-preview">👁️ 預覽</button>
            <button class="btn-primary" id="btn-create-batch">✓ 批次建立</button>
          </div>
        </div>
      </div>
    `;

    // 綁定事件
    setTimeout(() => {
      const previewBtn = section.querySelector('#btn-preview');
      const createBtn = section.querySelector('#btn-create-batch');

      previewBtn.addEventListener('click', handlePreview);
      createBtn.addEventListener('click', handleBatchCreate);
    }, 0);

    return section;
  }

  /**
   * 預覽將建立的工單
   */
  function handlePreview() {
    const formData = getFormData();
    if (!validateFormData(formData)) return;

    const previewSection = document.getElementById('preview-section');
    const previewContent = document.getElementById('preview-content');

    const totalQuantity = formData.quantityPerBatch * formData.batchCount;
    const previewNumbers = [];

    for (let i = 0; i < Math.min(formData.batchCount, 5); i++) {
      previewNumbers.push(WorkOrderNumberGenerator.preview());
    }

    previewContent.innerHTML = `
      <div class="preview-info">
        <div class="preview-item">
          <strong>濾網類型：</strong>${formData.filterType}
        </div>
        <div class="preview-item">
          <strong>來源廠別：</strong>${formData.sourceFactory}
        </div>
        <div class="preview-item">
          <strong>再生次數：</strong>${formData.regenerationCycle}
        </div>
        <div class="preview-item">
          <strong>批次數量：</strong>${formData.batchCount} 批
        </div>
        <div class="preview-item">
          <strong>每批數量：</strong>${formData.quantityPerBatch} 片
        </div>
        <div class="preview-item highlight">
          <strong>總數量：</strong>${totalQuantity} 片
        </div>
        <div class="preview-item">
          <strong>工單號範例：</strong>
          <div class="preview-numbers">
            ${previewNumbers.map((no, idx) => `<span class="preview-no">${no}</span>`).join('')}
            ${formData.batchCount > 5 ? '<span class="preview-more">... 等</span>' : ''}
          </div>
        </div>
      </div>
    `;

    previewSection.style.display = 'block';
  }

  /**
   * 批次建立工單
   */
  function handleBatchCreate() {
    const formData = getFormData();
    if (!validateFormData(formData)) return;

    if (!confirm(`確定要建立 ${formData.batchCount} 批工單嗎？\n總共 ${formData.quantityPerBatch * formData.batchCount} 片濾網`)) {
      return;
    }

    const createdWorkOrders = [];
    const now = Date.now();

    // 清除之前的批次追蹤
    WorkOrderNumberGenerator.clearSession();

    for (let i = 0; i < formData.batchCount; i++) {
      const workOrderNo = WorkOrderNumberGenerator.generate();
      const batchNo = `BATCH-${workOrderNo.replace('MSW-', '')}`;

      const workOrderData = {
        workOrderNo: workOrderNo,
        batchNo: batchNo,
        sourceFactory: formData.sourceFactory,
        filterType: formData.filterType,
        quantity: formData.quantityPerBatch,
        regenerationCycle: formData.regenerationCycle,
        remarks: formData.remarks || '',
        // 預設空值，等待站點作業填寫
        deglueOperator: '',
        deglueStartTime: '',
        deglueEndTime: '',
        ovenId: '',
        targetTemp: '',
        bakingTime: '',
        ovenStartTime: '',
        ovenEndTime: '',
        degassingTest: '待檢驗',
        aoiResult: '待檢驗',
        rfidUpdate: '待更換',
        palletId: '',
        warehouseLocation: '',
        createdBy: currentUser ? currentUser.name : '生管',
        createdAt: now + (i * 1000) // 每批間隔1秒，避免時間戳完全相同
      };

      const instance = new FormInstanceModel({
        applicationNo: workOrderNo,
        formName: '柳營再生濾網工單',
        applicant: currentUser ? currentUser.name : '生管',
        department: currentUser ? currentUser.department : '生管部',
        data: workOrderData,
        status: 'pending'
      });

      instance.createdAt = workOrderData.createdAt;
      instance.save();
      createdWorkOrders.push(workOrderNo);
    }

    // 批次建立完成後清除追蹤
    WorkOrderNumberGenerator.clearSession();

    alert(`✅ 成功建立 ${formData.batchCount} 批工單！\n\n工單號範圍：\n${createdWorkOrders[0]} ~ ${createdWorkOrders[createdWorkOrders.length - 1]}`);

    // 清空表單
    document.getElementById('filter-type').value = '';
    document.getElementById('source-factory').value = '';
    document.getElementById('regeneration-cycle').value = '';
    document.getElementById('batch-count').value = '5';
    document.getElementById('quantity-per-batch').value = '18';
    document.getElementById('remarks').value = '';
    document.getElementById('preview-section').style.display = 'none';

    // 重新載入工單列表
    const listSection = document.querySelector('.work-order-list-section');
    if (listSection) {
      const newListSection = createWorkOrderListSection();
      listSection.replaceWith(newListSection);
    }

    // 更新統計
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
      const newStatsSection = createStatsSection();
      statsSection.replaceWith(newStatsSection);
    }
  }

  /**
   * 取得表單資料
   */
  function getFormData() {
    return {
      filterType: document.getElementById('filter-type').value,
      sourceFactory: document.getElementById('source-factory').value,
      regenerationCycle: document.getElementById('regeneration-cycle').value,
      quantityPerBatch: parseInt(document.getElementById('quantity-per-batch').value),
      batchCount: parseInt(document.getElementById('batch-count').value),
      remarks: document.getElementById('remarks').value
    };
  }

  /**
   * 驗證表單資料
   */
  function validateFormData(data) {
    if (!data.filterType) {
      alert('請選擇濾網類型');
      return false;
    }
    if (!data.sourceFactory) {
      alert('請選擇來源廠別');
      return false;
    }
    if (!data.regenerationCycle) {
      alert('請選擇再生次數');
      return false;
    }
    if (!data.quantityPerBatch || data.quantityPerBatch < 1 || data.quantityPerBatch > 48) {
      alert('每批數量必須在 1-48 之間');
      return false;
    }
    if (!data.batchCount || data.batchCount < 1 || data.batchCount > 50) {
      alert('批次數量必須在 1-50 之間');
      return false;
    }
    return true;
  }

  /**
   * 建立工單列表區
   */
  function createWorkOrderListSection() {
    const section = document.createElement('div');
    section.className = 'work-order-list-section card';

    const allWorkOrders = FormInstanceModel.getAll();
    // 按建立時間排序，最新的在前
    allWorkOrders.sort((a, b) => b.createdAt - a.createdAt);

    section.innerHTML = `
      <div class="card-header">
        <h3>📋 工單列表</h3>
        <div class="header-actions">
          <select id="status-filter" class="filter-select">
            <option value="all">全部狀態</option>
            <option value="pending">待處理</option>
            <option value="in_progress">進行中</option>
            <option value="completed">已完成</option>
            <option value="approved">已核准</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <div class="work-order-table-container">
          <table class="work-order-table">
            <thead>
              <tr>
                <th>工單號</th>
                <th>批次號</th>
                <th>濾網類型</th>
                <th>來源廠別</th>
                <th>數量</th>
                <th>再生次數</th>
                <th>狀態</th>
                <th>建立時間</th>
                <th>建立人</th>
              </tr>
            </thead>
            <tbody id="work-order-tbody">
              ${renderWorkOrderRows(allWorkOrders)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 綁定篩選事件
    setTimeout(() => {
      const statusFilter = section.querySelector('#status-filter');
      if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
          const tbody = section.querySelector('#work-order-tbody');
          const filteredOrders = e.target.value === 'all'
            ? allWorkOrders
            : allWorkOrders.filter(wo => wo.status === e.target.value);
          tbody.innerHTML = renderWorkOrderRows(filteredOrders);
        });
      }
    }, 0);

    return section;
  }

  /**
   * 渲染工單表格行
   */
  function renderWorkOrderRows(workOrders) {
    if (workOrders.length === 0) {
      return `
        <tr>
          <td colspan="9" class="empty-row">
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <div>尚無工單資料</div>
            </div>
          </td>
        </tr>
      `;
    }

    const statusLabels = {
      pending: '待處理',
      in_progress: '進行中',
      completed: '已完成',
      approved: '已核准',
      rejected: '已退回'
    };

    const statusColors = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      completed: '#10b981',
      approved: '#10b981',
      rejected: '#ef4444'
    };

    return workOrders.map(wo => {
      const createdDate = new Date(wo.createdAt).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const status = wo.status || 'pending';
      const statusLabel = statusLabels[status] || status;
      const statusColor = statusColors[status] || '#9ca3af';

      return `
        <tr>
          <td><strong>${wo.data.workOrderNo || wo.applicationNo}</strong></td>
          <td>${wo.data.batchNo || '-'}</td>
          <td>${wo.data.filterType || '-'}</td>
          <td>${wo.data.sourceFactory || '-'}</td>
          <td>${wo.data.quantity || 0} 片</td>
          <td>${wo.data.regenerationCycle || '-'}</td>
          <td>
            <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor};">
              ${statusLabel}
            </span>
          </td>
          <td style="font-size: 13px;">${createdDate}</td>
          <td>${wo.applicant || '-'}</td>
        </tr>
      `;
    }).join('');
  }
}

/**
 * 樣式
 */
function addStyles() {
  if (document.getElementById('dispatch-page-styles')) return;

  const style = document.createElement('style');
  style.id = 'dispatch-page-styles';
  style.textContent = `
    .dispatch-page {
      padding: var(--spacing-xl);
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: var(--spacing-xl);
    }

    .page-header h2 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .text-secondary {
      color: var(--text-secondary);
      font-size: 0.9375rem;
    }

    /* 統計卡片 */
    .stats-section {
      margin-bottom: var(--spacing-xl);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--spacing-lg);
    }

    .stat-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .stat-card.total {
      border-left: 4px solid #3b82f6;
    }

    .stat-card.pending {
      border-left: 4px solid #f59e0b;
    }

    .stat-card.progress {
      border-left: 4px solid #8b5cf6;
    }

    .stat-card.completed {
      border-left: 4px solid #10b981;
    }

    .stat-icon {
      font-size: 2.5rem;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* 卡片 */
    .card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: var(--spacing-xl);
      overflow: hidden;
    }

    .card-header {
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .card-body {
      padding: var(--spacing-xl);
    }

    /* 表單 */
    .batch-form {
      max-width: 1200px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-field label {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .required {
      color: var(--error-color);
    }

    .form-input {
      padding: 10px 14px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-family: var(--font-family);
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    /* 預覽區 */
    .preview-section {
      margin: var(--spacing-xl) 0;
      padding: var(--spacing-lg);
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: var(--radius-lg);
      border: 2px solid #3b82f6;
    }

    .preview-section h4 {
      margin: 0 0 var(--spacing-md) 0;
      color: #1e40af;
      font-size: 1rem;
    }

    .preview-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-md);
    }

    .preview-item {
      padding: var(--spacing-sm);
      background: white;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .preview-item.highlight {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      font-weight: 600;
    }

    .preview-numbers {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .preview-no {
      display: inline-block;
      padding: 4px 10px;
      background: #3b82f6;
      color: white;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .preview-more {
      color: var(--text-secondary);
      font-style: italic;
    }

    /* 按鈕 */
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      margin-top: var(--spacing-xl);
    }

    .btn-primary, .btn-secondary {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-secondary {
      background: white;
      color: var(--text-primary);
      border: 2px solid var(--border-color);
    }

    .btn-secondary:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    /* 工單表格 */
    .header-actions {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .filter-select {
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .work-order-table-container {
      overflow-x: auto;
    }

    .work-order-table {
      width: 100%;
      border-collapse: collapse;
    }

    .work-order-table thead {
      background: #f9fafb;
    }

    .work-order-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      white-space: nowrap;
    }

    .work-order-table td {
      padding: 12px 16px;
      font-size: 0.875rem;
      color: #1f2937;
      border-bottom: 1px solid #f3f4f6;
    }

    .work-order-table tbody tr:hover {
      background: #f9fafb;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
      white-space: nowrap;
    }

    .empty-row {
      text-align: center;
      padding: var(--spacing-xxl) !important;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 3rem;
    }
  `;

  document.head.appendChild(style);
}
