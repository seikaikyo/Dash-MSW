import { AuditLogModel } from '../utils/dataModel.js';

/**
 * 操作日誌頁面
 * 提供日誌查詢、搜尋、篩選功能
 */
export function LogsPage() {
  const page = document.createElement('div');
  page.className = 'page-container';

  let allLogs = [];
  let filteredLogs = [];
  let currentPage = 1;
  const itemsPerPage = 50;

  // 操作類型中文對照
  const actionLabels = {
    login: '登入',
    logout: '登出',
    create: '建立',
    update: '更新',
    delete: '刪除',
    submit: '提交',
    approve: '核准',
    reject: '退回',
    withdraw: '撤回'
  };

  // 模組中文對照
  const moduleLabels = {
    auth: '認證',
    form: '表單',
    workflow: '流程',
    application: '申請',
    user: '人員',
    department: '部門'
  };

  const renderFilters = () => {
    return `
      <div class="filters-container">
        <div class="filter-row">
          <div class="filter-group">
            <label>搜尋</label>
            <input type="text" id="search-input" placeholder="搜尋使用者、操作對象..." class="filter-input">
          </div>

          <div class="filter-group">
            <label>模組</label>
            <select id="module-filter" class="filter-select">
              <option value="">全部模組</option>
              <option value="auth">認證</option>
              <option value="form">表單</option>
              <option value="workflow">流程</option>
              <option value="application">申請</option>
              <option value="user">人員</option>
              <option value="department">部門</option>
            </select>
          </div>

          <div class="filter-group">
            <label>操作類型</label>
            <select id="action-filter" class="filter-select">
              <option value="">全部操作</option>
              <option value="login">登入</option>
              <option value="logout">登出</option>
              <option value="create">建立</option>
              <option value="update">更新</option>
              <option value="delete">刪除</option>
              <option value="submit">提交</option>
              <option value="approve">核准</option>
              <option value="reject">退回</option>
              <option value="withdraw">撤回</option>
            </select>
          </div>

          <div class="filter-group">
            <label>結果</label>
            <select id="result-filter" class="filter-select">
              <option value="">全部</option>
              <option value="success">成功</option>
              <option value="failure">失敗</option>
            </select>
          </div>

          <div class="filter-group">
            <button class="btn btn-secondary" id="btn-reset-filters">
              重置篩選
            </button>
          </div>
        </div>

        <div class="filter-row">
          <div class="filter-group">
            <label>開始日期</label>
            <input type="date" id="start-date" class="filter-input">
          </div>

          <div class="filter-group">
            <label>結束日期</label>
            <input type="date" id="end-date" class="filter-input">
          </div>

          <div class="filter-stats">
            共 <strong>${filteredLogs.length}</strong> 筆記錄
          </div>
        </div>
      </div>
    `;
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    if (totalPages <= 1) return '';

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return `
      <div class="pagination">
        <button class="btn btn-secondary" ${currentPage === 1 ? 'disabled' : ''} id="btn-prev-page">
          上一頁
        </button>
        <div class="pagination-pages">
          ${pages.map(p => {
            if (p === '...') {
              return '<span class="pagination-ellipsis">...</span>';
            }
            return `<button class="pagination-page ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
          }).join('')}
        </div>
        <button class="btn btn-secondary" ${currentPage === totalPages ? 'disabled' : ''} id="btn-next-page">
          下一頁
        </button>
      </div>
    `;
  };

  const renderLogsList = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayLogs = filteredLogs.slice(startIndex, endIndex);

    if (displayLogs.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>暫無日誌記錄</p>
        </div>
      `;
    }

    return `
      <table class="table">
        <thead>
          <tr>
            <th style="width: 10%;">時間</th>
            <th style="width: 10%;">使用者</th>
            <th style="width: 8%;">模組</th>
            <th style="width: 8%;">操作</th>
            <th style="width: 15%;">操作對象</th>
            <th style="width: 6%;">結果</th>
            <th style="width: 43%;">詳細資訊</th>
          </tr>
        </thead>
        <tbody>
          ${displayLogs.map(log => `
            <tr>
              <td>
                <div class="log-time">${formatDateTime(log.timestamp)}</div>
              </td>
              <td>
                <div class="log-user">
                  <div>${log.userName}</div>
                  ${log.userAccount ? `<div class="log-account">${log.userAccount}</div>` : ''}
                </div>
              </td>
              <td>
                <span class="badge badge-${getModuleBadgeClass(log.module)}">
                  ${moduleLabels[log.module] || log.module}
                </span>
              </td>
              <td>
                <span class="badge badge-${getActionBadgeClass(log.action)}">
                  ${actionLabels[log.action] || log.action}
                </span>
              </td>
              <td>
                <div class="log-target">${log.targetName || '-'}</div>
              </td>
              <td>
                <span class="badge badge-${log.result === 'success' ? 'success' : 'error'}">
                  ${log.result === 'success' ? '成功' : '失敗'}
                </span>
              </td>
              <td>
                <div class="log-details">${log.details || '-'}</div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const getModuleBadgeClass = (module) => {
    const classes = {
      auth: 'info',
      form: 'primary',
      workflow: 'primary',
      application: 'warning',
      user: 'success',
      department: 'success'
    };
    return classes[module] || 'secondary';
  };

  const getActionBadgeClass = (action) => {
    const classes = {
      login: 'info',
      logout: 'secondary',
      create: 'success',
      update: 'warning',
      delete: 'error',
      submit: 'info',
      approve: 'success',
      reject: 'error',
      withdraw: 'warning'
    };
    return classes[action] || 'secondary';
  };

  const applyFilters = () => {
    const searchKeyword = document.getElementById('search-input')?.value.trim();
    const moduleFilter = document.getElementById('module-filter')?.value;
    const actionFilter = document.getElementById('action-filter')?.value;
    const resultFilter = document.getElementById('result-filter')?.value;
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;

    filteredLogs = allLogs;

    // 搜尋過濾
    if (searchKeyword) {
      filteredLogs = AuditLogModel.search(searchKeyword);
    }

    // 模組過濾
    if (moduleFilter) {
      filteredLogs = filteredLogs.filter(log => log.module === moduleFilter);
    }

    // 操作類型過濾
    if (actionFilter) {
      filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
    }

    // 結果過濾
    if (resultFilter) {
      filteredLogs = filteredLogs.filter(log => log.result === resultFilter);
    }

    // 日期範圍過濾
    if (startDate) {
      const startTimestamp = new Date(startDate).setHours(0, 0, 0, 0);
      filteredLogs = filteredLogs.filter(log => log.timestamp >= startTimestamp);
    }

    if (endDate) {
      const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999);
      filteredLogs = filteredLogs.filter(log => log.timestamp <= endTimestamp);
    }

    // 按時間倒序排列（最新的在前）
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

    currentPage = 1;
    render();
  };

  const render = () => {
    page.innerHTML = `
      <div class="page-header">
        <h2>操作日誌</h2>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-export-logs">
            匯出日誌
          </button>
        </div>
      </div>

      ${renderFilters()}
      ${renderLogsList()}
      ${renderPagination()}
    `;

    attachEvents();
  };

  const attachEvents = () => {
    // 搜尋輸入
    const searchInput = page.querySelector('#search-input');
    let searchTimeout;
    searchInput?.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        applyFilters();
      }, 300);
    });

    // 篩選器
    page.querySelector('#module-filter')?.addEventListener('change', applyFilters);
    page.querySelector('#action-filter')?.addEventListener('change', applyFilters);
    page.querySelector('#result-filter')?.addEventListener('change', applyFilters);
    page.querySelector('#start-date')?.addEventListener('change', applyFilters);
    page.querySelector('#end-date')?.addEventListener('change', applyFilters);

    // 重置篩選
    page.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
      document.getElementById('search-input').value = '';
      document.getElementById('module-filter').value = '';
      document.getElementById('action-filter').value = '';
      document.getElementById('result-filter').value = '';
      document.getElementById('start-date').value = '';
      document.getElementById('end-date').value = '';
      applyFilters();
    });

    // 分頁
    page.querySelector('#btn-prev-page')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        render();
      }
    });

    page.querySelector('#btn-next-page')?.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        render();
      }
    });

    page.querySelectorAll('.pagination-page').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentPage = parseInt(e.target.dataset.page);
        render();
      });
    });

    // 匯出日誌
    page.querySelector('#btn-export-logs')?.addEventListener('click', exportLogs);
  };

  const exportLogs = () => {
    if (filteredLogs.length === 0) {
      alert('沒有可匯出的日誌');
      return;
    }

    // 生成 CSV
    const headers = ['時間', '使用者', '帳號', '模組', '操作', '操作對象', '結果', '詳細資訊'];
    const rows = filteredLogs.map(log => [
      formatDateTime(log.timestamp),
      log.userName,
      log.userAccount,
      moduleLabels[log.module] || log.module,
      actionLabels[log.action] || log.action,
      log.targetName,
      log.result === 'success' ? '成功' : '失敗',
      log.details
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // 下載檔案
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 初始化載入
  AuditLogModel.autoClean(); // 自動清理30天前的日誌
  allLogs = AuditLogModel.getAll();
  filteredLogs = [...allLogs];
  filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

  render();
  addStyles();

  return page;

  function addStyles() {
    if (!document.getElementById('logs-page-styles')) {
      const style = document.createElement('style');
      style.id = 'logs-page-styles';
      style.textContent = `
        .filters-container {
          background: var(--bg-color);
          padding: var(--spacing-lg);
          border-radius: var(--radius-lg);
          margin-bottom: var(--spacing-lg);
        }

        .filter-row {
          display: flex;
          gap: var(--spacing-md);
          align-items: flex-end;
          margin-bottom: var(--spacing-md);
        }

        .filter-row:last-child {
          margin-bottom: 0;
        }

        .filter-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .filter-input,
        .filter-select {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-family: var(--font-family);
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .filter-stats {
          padding: var(--spacing-sm) var(--spacing-md);
          color: var(--text-secondary);
          font-size: 0.875rem;
          white-space: nowrap;
        }

        .log-time {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .log-user {
          font-size: 0.875rem;
        }

        .log-account {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .log-target,
        .log-details {
          font-size: 0.875rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
          padding: var(--spacing-lg);
        }

        .pagination-pages {
          display: flex;
          gap: var(--spacing-xs);
        }

        .pagination-page {
          min-width: 36px;
          height: 36px;
          padding: var(--spacing-xs);
          border: 1px solid var(--border-color);
          background: var(--bg-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.875rem;
          font-family: var(--font-family);
          transition: all 0.2s;
        }

        .pagination-page:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        .pagination-page.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .pagination-ellipsis {
          display: flex;
          align-items: center;
          padding: 0 var(--spacing-xs);
          color: var(--text-tertiary);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
