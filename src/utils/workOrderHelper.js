import { FormInstanceModel } from './dataModel.js';

/**
 * 工單查詢輔助工具
 * 提供全域的工單查詢功能,讓各個頁面都能查詢和連結工單資料
 */
export class WorkOrderHelper {
  /**
   * 根據工單號查詢工單
   * @param {string} workOrderNo - 工單編號
   * @returns {Object|null} 工單物件或 null
   */
  static getWorkOrderByNo(workOrderNo) {
    if (!workOrderNo) return null;

    const allWorkOrders = FormInstanceModel.getAll();
    return allWorkOrders.find(wo => wo.data.workOrderNo === workOrderNo) || null;
  }

  /**
   * 根據批次號查詢工單
   * @param {string} batchNo - 批次號
   * @returns {Array} 工單陣列
   */
  static getWorkOrdersByBatchNo(batchNo) {
    if (!batchNo) return [];

    const allWorkOrders = FormInstanceModel.getAll();
    return allWorkOrders.filter(wo => wo.data.batchNo === batchNo);
  }

  /**
   * 取得所有工單
   * @returns {Array} 所有工單
   */
  static getAllWorkOrders() {
    return FormInstanceModel.getAll();
  }

  /**
   * 根據狀態查詢工單
   * @param {string} status - 工單狀態
   * @returns {Array} 工單陣列
   */
  static getWorkOrdersByStatus(status) {
    if (!status) return [];

    const allWorkOrders = FormInstanceModel.getAll();
    return allWorkOrders.filter(wo => wo.status === status);
  }

  /**
   * 產生工單詳情頁面的連結
   * @param {string} workOrderNo - 工單編號
   * @returns {string} Hash 連結
   */
  static getWorkOrderDetailLink(workOrderNo) {
    const workOrder = this.getWorkOrderByNo(workOrderNo);
    if (!workOrder) return '#/forms';
    return `#/apply?id=${workOrder.id}`;
  }

  /**
   * 導航到工單詳情頁面
   * @param {string} workOrderNo - 工單編號
   */
  static navigateToWorkOrder(workOrderNo) {
    const link = this.getWorkOrderDetailLink(workOrderNo);
    window.location.hash = link;
  }

  /**
   * 產生工單資訊卡片 HTML
   * @param {string} workOrderNo - 工單編號
   * @param {Object} options - 選項
   * @returns {string} HTML 字串
   */
  static createWorkOrderInfoCard(workOrderNo, options = {}) {
    const workOrder = this.getWorkOrderByNo(workOrderNo);

    if (!workOrder) {
      return `
        <div class="work-order-info-card not-found">
          <p>找不到工單: ${workOrderNo}</p>
        </div>
      `;
    }

    const statusConfig = {
      pending: { label: '待處理', color: '#9ca3af', icon: '⏳' },
      in_progress: { label: '進行中', color: '#3b82f6', icon: '⚙️' },
      paused: { label: '暫停', color: '#f59e0b', icon: '⏸️' },
      completed: { label: '已完成', color: '#10b981', icon: '✅' },
      approved: { label: '已核准', color: '#10b981', icon: '✅' },
      rejected: { label: '已退回', color: '#ef4444', icon: '❌' }
    };

    const status = statusConfig[workOrder.status] || statusConfig.pending;
    const showLink = options.showLink !== false;

    return `
      <div class="work-order-info-card">
        <div class="wo-card-header">
          <div class="wo-number">${workOrder.data.workOrderNo || '-'}</div>
          <div class="wo-status" style="background: ${status.color}20; color: ${status.color};">
            ${status.icon} ${status.label}
          </div>
        </div>
        <div class="wo-card-body">
          <div class="wo-info-row">
            <span class="wo-label">批次號</span>
            <span class="wo-value">${workOrder.data.batchNo || '-'}</span>
          </div>
          <div class="wo-info-row">
            <span class="wo-label">來源廠別</span>
            <span class="wo-value">${workOrder.data.sourceFactory || '-'}</span>
          </div>
          <div class="wo-info-row">
            <span class="wo-label">濾網類型</span>
            <span class="wo-value">${workOrder.data.filterType || '-'}</span>
          </div>
          <div class="wo-info-row">
            <span class="wo-label">數量</span>
            <span class="wo-value">${workOrder.data.quantity || 0} 片</span>
          </div>
          ${showLink ? `
          <div class="wo-card-actions">
            <button class="btn-wo-detail" onclick="window.location.hash='#/apply?id=${workOrder.id}'">
              查看工單詳情
            </button>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * 產生簡單的工單資訊行 HTML
   * @param {string} workOrderNo - 工單編號
   * @returns {string} HTML 字串
   */
  static createWorkOrderInfoRow(workOrderNo) {
    const workOrder = this.getWorkOrderByNo(workOrderNo);

    if (!workOrder) {
      return `
        <div class="work-order-info-row">
          <span class="wo-no-link" style="color: #ef4444;">${workOrderNo || 'N/A'}</span>
          <span class="wo-status-text" style="color: #ef4444;">工單不存在</span>
        </div>
      `;
    }

    const statusConfig = {
      pending: { label: '待處理', color: '#9ca3af' },
      in_progress: { label: '進行中', color: '#3b82f6' },
      paused: { label: '暫停', color: '#f59e0b' },
      completed: { label: '已完成', color: '#10b981' },
      approved: { label: '已核准', color: '#10b981' },
      rejected: { label: '已退回', color: '#ef4444' }
    };

    const status = statusConfig[workOrder.status] || statusConfig.pending;

    return `
      <div class="work-order-info-row">
        <a href="#/apply?id=${workOrder.id}" class="wo-no-link">${workOrder.data.workOrderNo || '-'}</a>
        <span class="wo-status-text" style="color: ${status.color};">${status.label}</span>
      </div>
    `;
  }

  /**
   * 添加工單卡片樣式到頁面
   */
  static addStyles() {
    if (document.getElementById('work-order-helper-styles')) return;

    const style = document.createElement('style');
    style.id = 'work-order-helper-styles';
    style.textContent = `
      .work-order-info-card {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
        margin: var(--spacing-md) 0;
      }

      .work-order-info-card.not-found {
        padding: var(--spacing-md);
        text-align: center;
        color: var(--text-secondary);
        background: #fee2e2;
        border-color: #ef4444;
      }

      .wo-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
      }

      .wo-number {
        font-weight: 600;
        color: var(--primary-color);
        font-size: 0.9375rem;
      }

      .wo-status {
        padding: 4px 10px;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .wo-card-body {
        padding: var(--spacing-md);
      }

      .wo-info-row {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-xs) 0;
        font-size: 0.875rem;
        border-bottom: 1px solid var(--border-color);
      }

      .wo-info-row:last-child {
        border-bottom: none;
      }

      .wo-label {
        color: var(--text-secondary);
        font-weight: 500;
      }

      .wo-value {
        color: var(--text-primary);
        font-weight: 600;
      }

      .wo-card-actions {
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border-color);
      }

      .btn-wo-detail {
        width: 100%;
        padding: var(--spacing-sm);
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        transition: opacity 0.2s;
      }

      .btn-wo-detail:hover {
        opacity: 0.9;
      }

      .work-order-info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .wo-no-link {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.875rem;
        transition: color 0.2s;
      }

      .wo-no-link:hover {
        color: var(--primary-hover);
        text-decoration: underline;
      }

      .wo-status-text {
        font-size: 0.75rem;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }
}

// 自動添加樣式
WorkOrderHelper.addStyles();
