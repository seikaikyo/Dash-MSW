import { getDepartments, saveDepartment, deleteDepartment, getUsers } from '../utils/dataModel.js';
import { storage } from '../utils/storage.js';

export function DepartmentsPage() {
  const page = document.createElement('div');
  page.className = 'page-container';

  let currentViewMode = 'list'; // 'list' or 'card'

  // Add card view styles
  if (!document.getElementById('departments-page-styles')) {
    const style = document.createElement('style');
    style.id = 'departments-page-styles';
    style.textContent = `
      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
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

      /* Card View Styles */
      .departments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-lg);
      }

      .dept-card {
        background: white;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
        transition: all 0.2s;
        box-shadow: var(--shadow-sm);
      }

      .dept-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .dept-card-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark, #2563eb));
        color: white;
      }

      .dept-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }

      .dept-card-name {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
        flex: 1;
      }

      .dept-card-body {
        padding: var(--spacing-lg);
      }

      .dept-stat {
        text-align: center;
        padding: var(--spacing-lg);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-md);
      }

      .stat-number {
        display: block;
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .dept-members {
        margin-top: var(--spacing-md);
      }

      .members-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
      }

      .members-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .member-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: 6px;
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
      }

      .member-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
      }

      .member-name {
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      .member-more {
        text-align: center;
        padding: 8px;
        font-size: 0.8125rem;
        color: var(--text-secondary);
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
      }

      .no-members {
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.875rem;
        padding: var(--spacing-lg);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .dept-card-footer {
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .dept-card-footer .btn-icon {
        padding: 6px 12px;
        font-size: 0.8125rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: white;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.15s;
      }

      .dept-card-footer .btn-icon:hover {
        background: var(--primary-light);
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .dept-card-footer .btn-delete:hover {
        background: #fee;
        border-color: var(--error-color);
        color: var(--error-color);
      }
    `;
    document.head.appendChild(style);
  }

  let departments = getDepartments();

  const renderDepartmentList = () => {
    return `
      <div class="page-header">
        <h2>部門管理</h2>
        <div class="header-actions">
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
          <button class="btn btn-primary" id="btn-add-dept">
            <span>➕</span> 新增部門
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏢</div>
          <div class="stat-info">
            <div class="stat-value">${departments.length}</div>
            <div class="stat-label">部門總數</div>
          </div>
        </div>
      </div>

      <div class="${currentViewMode === 'card' ? 'departments-grid' : 'table-container'}">
        ${currentViewMode === 'list' ? `
        <table class="table">
          <thead>
            <tr>
              <th style="width: 60%;">部門名稱</th>
              <th style="width: 20%;">人員數</th>
              <th style="width: 20%;">操作</th>
            </tr>
          </thead>
          <tbody>
            ${departments.length === 0 ? `
              <tr>
                <td colspan="3" class="empty-state">
                  <div class="empty-icon">🏢</div>
                  <p>尚無部門資料</p>
                </td>
              </tr>
            ` : departments.map((dept, index) => {
              // 計算該部門的人員數
              const users = getUsers();
              // 處理部門可能是字串或物件的情況
              const deptName = typeof dept === 'string' ? dept : (dept.name || '');
              const userCount = users.filter(u => u.department === deptName).length;

              return `
                <tr data-dept-name="${deptName}">
                  <td>
                    <strong>${deptName}</strong>
                  </td>
                  <td>${userCount} 人</td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-icon" data-action="edit" data-dept-name="${deptName}" data-dept-index="${index}" title="編輯">
                        ✏️
                      </button>
                      <button class="btn-icon" data-action="delete" data-dept-name="${deptName}" title="刪除">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ` : /* Card View */ `
          ${departments.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">🏢</div>
              <p>尚無部門資料</p>
            </div>
          ` : departments.map((dept, index) => {
            // 計算該部門的人員數
            const users = getUsers();
            const deptName = typeof dept === 'string' ? dept : (dept.name || '');
            const userCount = users.filter(u => u.department === deptName).length;
            const userList = users.filter(u => u.department === deptName);

            return `
              <div class="dept-card" data-dept-name="${deptName}">
                <div class="dept-card-header">
                  <div class="dept-icon">🏢</div>
                  <h3 class="dept-card-name">${deptName}</h3>
                </div>
                <div class="dept-card-body">
                  <div class="dept-stat">
                    <span class="stat-number">${userCount}</span>
                    <span class="stat-label">位成員</span>
                  </div>
                  ${userList.length > 0 ? `
                    <div class="dept-members">
                      <div class="members-label">部門成員</div>
                      <div class="members-list">
                        ${userList.slice(0, 5).map(u => `
                          <div class="member-item">
                            <div class="member-avatar">${u.name.charAt(0)}</div>
                            <span class="member-name">${u.name}</span>
                          </div>
                        `).join('')}
                        ${userList.length > 5 ? `
                          <div class="member-more">+${userList.length - 5} 位</div>
                        ` : ''}
                      </div>
                    </div>
                  ` : `
                    <p class="no-members">尚無成員</p>
                  `}
                </div>
                <div class="dept-card-footer">
                  <button class="btn-icon" data-action="edit" data-dept-name="${deptName}" data-dept-index="${index}" title="編輯">
                    ✏️ 編輯
                  </button>
                  <button class="btn-icon btn-delete" data-action="delete" data-dept-name="${deptName}" title="刪除">
                    🗑️ 刪除
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        `}
      </div>
    `;
  };

  const renderDepartmentForm = (deptName = '', index = null) => {
    return `
      <div class="modal-overlay" id="dept-modal">
        <div class="modal-content" style="max-width: 400px;">
          <div class="modal-header">
            <h3>${deptName ? '編輯部門' : '新增部門'}</h3>
            <button class="btn-close" id="btn-close-modal">×</button>
          </div>
          <div class="modal-body">
            <form id="dept-form">
              <div class="form-group">
                <label>部門名稱 *</label>
                <input type="text" name="deptName" value="${deptName}" placeholder="請輸入部門名稱" required autofocus>
              </div>
              <input type="hidden" name="deptIndex" value="${index !== null ? index : ''}">
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel">取消</button>
            <button class="btn btn-primary" id="btn-save-dept">儲存</button>
          </div>
        </div>
      </div>
    `;
  };

  const render = () => {
    page.innerHTML = renderDepartmentList();
    attachEvents();
  };

  const attachEvents = () => {
    // 視圖切換按鈕
    page.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newMode = e.currentTarget.dataset.view;
        if (newMode !== currentViewMode) {
          currentViewMode = newMode;
          render();
        }
      });
    });

    // 新增部門按鈕
    const addBtn = page.querySelector('#btn-add-dept');
    addBtn?.addEventListener('click', () => {
      showDepartmentForm();
    });

    // 編輯按鈕
    page.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const deptName = e.currentTarget.dataset.deptName;
        const deptIndex = e.currentTarget.dataset.deptIndex;
        showDepartmentForm(deptName, parseInt(deptIndex));
      });
    });

    // 刪除按鈕
    page.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const deptName = e.currentTarget.dataset.deptName;

        // 檢查是否有人員屬於該部門
        const users = getUsers();
        const userCount = users.filter(u => u.department === deptName).length;

        if (userCount > 0) {
          alert(`無法刪除「${deptName}」，因為還有 ${userCount} 位人員屬於此部門。\n請先將這些人員移至其他部門。`);
          return;
        }

        if (confirm(`確定要刪除「${deptName}」部門嗎？`)) {
          deleteDepartment(deptName);
          departments = getDepartments();
          render();
        }
      });
    });
  };

  const showDepartmentForm = (deptName = '', index = null) => {
    const modalHTML = renderDepartmentForm(deptName, index);
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    const modal = document.getElementById('dept-modal');
    const form = document.getElementById('dept-form');
    const closeBtn = document.getElementById('btn-close-modal');
    const cancelBtn = document.getElementById('btn-cancel');
    const saveBtn = document.getElementById('btn-save-dept');

    // 關閉 modal
    const closeModal = () => {
      modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // 儲存部門
    saveBtn.addEventListener('click', () => {
      const formData = new FormData(form);
      const newDeptName = formData.get('deptName').trim();
      const deptIndex = formData.get('deptIndex');

      if (!newDeptName) {
        alert('請輸入部門名稱');
        return;
      }

      // 檢查部門名稱是否重複（編輯時排除自己）
      const existingDepts = getDepartments();
      const isDuplicate = existingDepts.some((dept, idx) => {
        if (deptIndex !== '' && idx === parseInt(deptIndex)) {
          return false; // 排除自己
        }
        return dept === newDeptName;
      });

      if (isDuplicate) {
        alert('部門名稱已存在，請使用其他名稱');
        return;
      }

      if (deptIndex !== '') {
        // 編輯模式：需要更新所有使用該部門的人員
        const oldDeptName = deptName;
        const users = getUsers();
        const updatedUsers = users.map(user => {
          if (user.department === oldDeptName) {
            return { ...user, department: newDeptName };
          }
          return user;
        });
        // 使用 storage 來儲存，確保使用正確的 prefix
        storage.set('users', updatedUsers);

        // 更新部門列表
        deleteDepartment(oldDeptName);
        saveDepartment(newDeptName);
      } else {
        // 新增模式
        saveDepartment(newDeptName);
      }

      departments = getDepartments();
      render();
      closeModal();
    });

    // Enter 鍵提交
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveBtn.click();
    });
  };

  render();
  return page;
}
