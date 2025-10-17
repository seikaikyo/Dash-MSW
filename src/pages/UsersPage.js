import { getUsers, saveUser, deleteUser, getDepartments, saveDepartment, UserModel } from '../utils/dataModel.js';
import { stationManager } from '../modules/station/stationModel.js';

export function UsersPage() {
  const page = document.createElement('div');
  page.className = 'page-container';

  let currentViewMode = 'list'; // 'list' or 'card'

  // 頁面特定樣式（其餘使用全局組件樣式）
  if (!document.getElementById('users-page-styles')) {
    const style = document.createElement('style');
    style.id = 'users-page-styles';
    style.textContent = `
      .user-cell {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

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
      .users-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--spacing-lg);
      }

      .user-card {
        background: white;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
        transition: all 0.2s;
        box-shadow: var(--shadow-sm);
      }

      .user-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .user-card-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
      }

      .user-avatar-large {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: 600;
        flex-shrink: 0;
      }

      .user-card-info {
        flex: 1;
        min-width: 0;
      }

      .user-card-name {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 4px 0;
        color: var(--text-primary);
      }

      .user-card-account {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }

      .user-card-account code {
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.75rem;
      }

      .user-card-body {
        padding: var(--spacing-lg);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .user-info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid var(--border-color);
      }

      .user-info-row:last-child {
        border-bottom: none;
      }

      .info-label {
        font-size: 0.8125rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .info-value {
        font-size: 0.875rem;
        color: var(--text-primary);
        text-align: right;
      }

      .user-card-footer {
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .user-card-footer .btn-icon {
        padding: 6px 12px;
        font-size: 0.8125rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: white;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.15s;
      }

      .user-card-footer .btn-icon:hover {
        background: var(--primary-light);
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .user-card-footer .btn-delete:hover {
        background: #fee;
        border-color: var(--error-color);
        color: var(--error-color);
      }

      /* 站點分配樣式 */
      .station-assignment-section {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-top: var(--spacing-md);
      }

      .station-checkboxes {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: var(--spacing-sm);
        max-height: 200px;
        overflow-y: auto;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: white;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: 6px;
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: background 0.2s;
      }

      .checkbox-label:hover {
        background: var(--bg-secondary);
      }

      .checkbox-label input[type="checkbox"] {
        cursor: pointer;
      }

      .checkbox-label span {
        font-size: 0.875rem;
        color: var(--text-primary);
      }
    `;
    document.head.appendChild(style);
  }

  let users = getUsers();
  let departments = getDepartments();

  const renderUserList = () => {
    return `
      <div class="page-header">
        <h2>人員管理</h2>
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
          <button class="btn btn-primary" id="btn-add-user">
            <span>➕</span> 新增人員
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-value">${users.length}</div>
            <div class="stat-label">總人數</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏢</div>
          <div class="stat-info">
            <div class="stat-value">${departments.length}</div>
            <div class="stat-label">部門數</div>
          </div>
        </div>
      </div>

      <div class="${currentViewMode === 'card' ? 'users-grid' : 'table-container'}">
        ${currentViewMode === 'list' ? `
        <table class="table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>帳號</th>
                <th>員工編號</th>
                <th>部門</th>
                <th>職位</th>
                <th>角色</th>
                <th>Email</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${users.length === 0 ? `
                <tr>
                  <td colspan="9" class="empty-state">
                    <div class="empty-icon">👤</div>
                    <p>尚無人員資料</p>
                  </td>
                </tr>
              ` : users.map(user => {
                // 支援中文和英文角色名稱
                const roleLabels = {
                  'user': '一般員工',
                  'manager': '主管',
                  'admin': '系統管理員',
                  '一般員工': '一般員工',
                  '主管': '主管',
                  '系統管理員': '系統管理員'
                };
                const roleBadgeClass = {
                  'user': 'badge-primary',
                  'manager': 'badge-warning',
                  'admin': 'badge-error',
                  '一般員工': 'badge-primary',
                  '主管': 'badge-warning',
                  '系統管理員': 'badge-error'
                };
                // 處理部門可能是字串或物件的情況
                const userDept = user.department ?
                  (typeof user.department === 'string' ? user.department : (user.department.name || '-')) : '-';

                return `
                <tr data-user-id="${user.id}">
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar">${user.name.charAt(0)}</div>
                      <span>${user.name}</span>
                    </div>
                  </td>
                  <td><code class="text-sm">${user.account || '-'}</code></td>
                  <td>${user.employeeId || '-'}</td>
                  <td>${userDept}</td>
                  <td>${user.position || '-'}</td>
                  <td>
                    <span class="badge ${roleBadgeClass[user.role || 'user']}">
                      ${roleLabels[user.role || 'user']}
                    </span>
                  </td>
                  <td>${user.email || '-'}</td>
                  <td>
                    <span class="status-badge ${(user.status === 'active' || user.status === '在職') ? 'status-active' : 'status-inactive'}">
                      ${(user.status === 'active' || user.status === '在職') ? '在職' : '離職'}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-icon" data-action="edit" data-user-id="${user.id}" title="編輯">
                        ✏️
                      </button>
                      <button class="btn-icon" data-action="reset-pwd" data-user-id="${user.id}" title="重設密碼">
                        🔑
                      </button>
                      <button class="btn-icon" data-action="delete" data-user-id="${user.id}" title="刪除">
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
          ${users.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">👤</div>
              <p>尚無人員資料</p>
            </div>
          ` : users.map(user => {
            // 支援中文和英文角色名稱
            const roleLabels = {
              'user': '一般員工',
              'manager': '主管',
              'admin': '系統管理員',
              '一般員工': '一般員工',
              '主管': '主管',
              '系統管理員': '系統管理員'
            };
            const roleBadgeClass = {
              'user': 'badge-primary',
              'manager': 'badge-warning',
              'admin': 'badge-error',
              '一般員工': 'badge-primary',
              '主管': 'badge-warning',
              '系統管理員': 'badge-error'
            };
            // 處理部門可能是字串或物件的情況
            const userDept = user.department ?
              (typeof user.department === 'string' ? user.department : (user.department.name || '-')) : '-';

            return `
              <div class="user-card" data-user-id="${user.id}">
                <div class="user-card-header">
                  <div class="user-avatar-large">${user.name.charAt(0)}</div>
                  <div class="user-card-info">
                    <h3 class="user-card-name">${user.name}</h3>
                    <p class="user-card-account"><code>${user.account || '-'}</code></p>
                  </div>
                  <span class="badge ${roleBadgeClass[user.role || 'user']}">
                    ${roleLabels[user.role || 'user']}
                  </span>
                </div>
                <div class="user-card-body">
                  <div class="user-info-row">
                    <span class="info-label">員工編號</span>
                    <span class="info-value">${user.employeeId || '-'}</span>
                  </div>
                  <div class="user-info-row">
                    <span class="info-label">部門</span>
                    <span class="info-value">${userDept}</span>
                  </div>
                  <div class="user-info-row">
                    <span class="info-label">職位</span>
                    <span class="info-value">${user.position || '-'}</span>
                  </div>
                  <div class="user-info-row">
                    <span class="info-label">Email</span>
                    <span class="info-value">${user.email || '-'}</span>
                  </div>
                  <div class="user-info-row">
                    <span class="info-label">電話</span>
                    <span class="info-value">${user.phone || '-'}</span>
                  </div>
                  <div class="user-info-row">
                    <span class="info-label">狀態</span>
                    <span class="status-badge ${(user.status === 'active' || user.status === '在職') ? 'status-active' : 'status-inactive'}">
                      ${(user.status === 'active' || user.status === '在職') ? '在職' : '離職'}
                    </span>
                  </div>
                </div>
                <div class="user-card-footer">
                  <button class="btn-icon" data-action="edit" data-user-id="${user.id}" title="編輯">
                    ✏️ 編輯
                  </button>
                  <button class="btn-icon" data-action="reset-pwd" data-user-id="${user.id}" title="重設密碼">
                    🔑 重設密碼
                  </button>
                  <button class="btn-icon btn-delete" data-action="delete" data-user-id="${user.id}" title="刪除">
                    🗑️ 刪除
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        `}
        </div>
      </div>
    `;
  };

  const renderUserForm = (user = null) => {
    // 處理 user.department 可能是字串或物件的情況
    const userDepartment = user?.department ?
      (typeof user.department === 'string' ? user.department : (user.department.name || '')) : '';

    // 處理 departments 可能是字串陣列或物件陣列
    const deptOptions = departments.map(dept => {
      const deptName = typeof dept === 'string' ? dept : (dept.name || '');
      return `<option value="${deptName}">`;
    }).join('');

    return `
      <div class="modal-overlay" id="user-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>${user ? '編輯人員' : '新增人員'}</h3>
            <button class="btn-close" id="btn-close-modal">×</button>
          </div>
          <div class="modal-body">
            <form id="user-form">
              <div class="form-row">
                <div class="form-group">
                  <label>姓名 *</label>
                  <input type="text" name="name" value="${user?.name || ''}" required>
                </div>
                <div class="form-group">
                  <label>帳號 *</label>
                  <input type="text" name="account" value="${user?.account || ''}" required ${user ? 'readonly' : ''} placeholder="登入帳號">
                  ${user ? '<small style="color: var(--text-tertiary);">帳號建立後無法修改</small>' : ''}
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>員工編號</label>
                  <input type="text" name="employeeId" value="${user?.employeeId || ''}" placeholder="例：EMP0001">
                </div>
                <div class="form-group">
                  <label>職位</label>
                  <input type="text" name="position" value="${user?.position || ''}" placeholder="例：工程師">
                </div>
              </div>

              <div class="form-group">
                <label>部門</label>
                <input type="text" name="department" value="${userDepartment}" list="department-list" placeholder="選擇或輸入部門名稱">
                <datalist id="department-list">
                  ${deptOptions}
                </datalist>
              </div>

              <div class="form-group">
                <label>角色/權限</label>
                <select name="role">
                  <option value="一般員工" ${(user?.role === 'user' || user?.role === '一般員工' || !user) ? 'selected' : ''}>一般員工</option>
                  <option value="主管" ${(user?.role === 'manager' || user?.role === '主管') ? 'selected' : ''}>主管</option>
                  <option value="系統管理員" ${(user?.role === 'admin' || user?.role === '系統管理員') ? 'selected' : ''}>系統管理員</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value="${user?.email || ''}">
                </div>
                <div class="form-group">
                  <label>電話</label>
                  <input type="tel" name="phone" value="${user?.phone || ''}">
                </div>
              </div>

              <div class="form-group">
                <label>狀態</label>
                <select name="status">
                  <option value="在職" ${(user?.status === 'active' || user?.status === '在職' || !user) ? 'selected' : ''}>在職</option>
                  <option value="離職" ${(user?.status === 'inactive' || user?.status === '離職') ? 'selected' : ''}>離職</option>
                </select>
              </div>

              ${/* 僅對一般員工顯示站點分配 */ (user?.role === '一般員工' || user?.role === 'user' || !user) ? `
                <div class="form-group station-assignment-section" id="station-assignment-section" ${user?.role && user.role !== '一般員工' && user.role !== 'user' ? 'style="display: none;"' : ''}>
                  <label>分配站點</label>
                  <div class="station-checkboxes">
                    ${stationManager.getAllStations().map(station => `
                      <label class="checkbox-label">
                        <input
                          type="checkbox"
                          name="assignedStations"
                          value="${station.id}"
                          ${user?.assignedStations?.includes(station.id) ? 'checked' : ''}
                        />
                        <span>${station.name} (${station.location})</span>
                      </label>
                    `).join('')}
                  </div>
                  <div class="form-group" style="margin-top: var(--spacing-md);">
                    <label>主要負責站點</label>
                    <select name="primaryStation">
                      <option value="">未設定</option>
                      ${stationManager.getAllStations().map(station => `
                        <option value="${station.id}" ${user?.primaryStation === station.id ? 'selected' : ''}>
                          ${station.name} (${station.location})
                        </option>
                      `).join('')}
                    </select>
                  </div>
                </div>
              ` : ''}

              <input type="hidden" name="id" value="${user?.id || ''}">
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel">取消</button>
            <button class="btn btn-primary" id="btn-save-user">儲存</button>
          </div>
        </div>
      </div>
    `;
  };

  const render = () => {
    page.innerHTML = renderUserList();
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

    // 新增人員按鈕
    const addBtn = page.querySelector('#btn-add-user');
    addBtn?.addEventListener('click', () => {
      showUserForm();
    });

    // 編輯按鈕
    page.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.currentTarget.dataset.userId;
        const user = users.find(u => u.id === userId);
        if (user) {
          showUserForm(user);
        }
      });
    });

    // 重設密碼按鈕
    page.querySelectorAll('[data-action="reset-pwd"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.currentTarget.dataset.userId;
        const user = users.find(u => u.id === userId);
        if (user && confirm(`確定要將 ${user.name} (${user.account}) 的密碼重設為預設密碼（帳號）嗎？`)) {
          // 重設密碼：移除 password 欄位，讓系統使用預設密碼（帳號）
          const updatedUser = { ...user, password: undefined };
          delete updatedUser.password;
          saveUser(updatedUser);
          users = getUsers();
          alert('密碼已重設為帳號');
        }
      });
    });

    // 刪除按鈕
    page.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.currentTarget.dataset.userId;
        if (confirm('確定要刪除此人員嗎？')) {
          deleteUser(userId);
          users = getUsers();
          render();
        }
      });
    });
  };

  const showUserForm = (user = null) => {
    const modalHTML = renderUserForm(user);
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    const closeBtn = document.getElementById('btn-close-modal');
    const cancelBtn = document.getElementById('btn-cancel');
    const saveBtn = document.getElementById('btn-save-user');

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

    // 角色變更時顯示/隱藏站點分配區域
    const roleSelect = form.querySelector('select[name="role"]');
    const stationSection = form.querySelector('#station-assignment-section');
    if (roleSelect && stationSection) {
      roleSelect.addEventListener('change', (e) => {
        const selectedRole = e.target.value;
        if (selectedRole === '一般員工' || selectedRole === 'user') {
          stationSection.style.display = 'block';
        } else {
          stationSection.style.display = 'none';
        }
      });
    }

    // 儲存人員
    saveBtn.addEventListener('click', () => {
      const formData = new FormData(form);

      // 收集選中的站點
      const assignedStations = [];
      form.querySelectorAll('input[name="assignedStations"]:checked').forEach(checkbox => {
        assignedStations.push(checkbox.value);
      });

      const userData = {
        id: formData.get('id') || Date.now().toString(),
        name: formData.get('name'),
        account: formData.get('account'),
        employeeId: formData.get('employeeId'),
        department: formData.get('department'),
        position: formData.get('position'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        status: formData.get('status'),
        assignedStations: assignedStations,
        primaryStation: formData.get('primaryStation') || null,
        createdAt: user?.createdAt || new Date().toISOString()
      };

      if (!userData.name) {
        alert('請輸入姓名');
        return;
      }

      if (!userData.account) {
        alert('請輸入帳號');
        return;
      }

      // 如果輸入了新部門，自動保存到部門列表
      if (userData.department && !departments.includes(userData.department)) {
        saveDepartment(userData.department);
        departments = getDepartments();
      }

      saveUser(userData);
      users = getUsers();
      render();
      closeModal();
    });
  };

  render();
  return page;
}
