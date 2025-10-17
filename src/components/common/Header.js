import { authService } from '../../utils/authService.js';
import { UserModel } from '../../utils/dataModel.js';
import { permissionManager } from '../../utils/permissionManager.js';

export class Header {
  constructor() {
    this.element = null;
  }

  render() {
    const user = authService.getCurrentUser();
    const userName = user ? user.name : '訪客';
    // 處理部門可能是字串或物件的情況
    const userDept = user ? (typeof user.department === 'string' ? user.department : (user.department?.name || '')) : '';

    // 取得使用者角色標籤與顏色
    const roleLabel = permissionManager.getUserRoleLabel();
    const roleBadgeColor = permissionManager.getUserRoleBadgeColor();

    // 取得所有使用者用於切換
    const allUsers = UserModel.getAll();

    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <div class="header-container">
        <div class="header-logo">
          <h1>♻️ Dash MSW</h1>
        </div>
        <nav class="header-nav">
          <a href="#/" class="nav-link" data-route="/">總覽</a>
          <a href="#/forms" class="nav-link" data-route="/forms">工單</a>
          <a href="#/stations" class="nav-link" data-route="/stations">站點</a>
          <a href="#/wms" class="nav-link" data-route="/wms">倉儲</a>
          <a href="#/energy" class="nav-link" data-route="/energy">能源</a>
        </nav>
        <div class="header-user">
          <div class="user-info-badge">
            <span class="user-name">${userName}</span>
            <span class="role-badge role-badge-${roleBadgeColor}">${roleLabel}</span>
            <span class="user-dept">${userDept}</span>
          </div>
          <div class="user-switcher">
            <select id="user-switcher-select" class="user-switcher-select">
              ${allUsers.map(u => {
                const displayName = `${u.name} - ${u.role}`;
                return `<option value="${u.id}" ${u.id === user?.id ? 'selected' : ''}>${displayName}</option>`;
              }).join('')}
            </select>
          </div>
          <button class="btn-change-pwd" id="btn-change-pwd" title="修改密碼">🔐</button>
          <button class="btn-logout" id="btn-logout">登出</button>
        </div>
      </div>
    `;

    this.element = header;
    this.addStyles();
    this.attachEvents();
    return header;
  }

  addStyles() {
    if (!document.getElementById('header-styles')) {
      const style = document.createElement('style');
      style.id = 'header-styles';
      style.textContent = `
        .header {
          background: var(--bg-color);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: var(--shadow-sm);
        }

        .header-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 var(--spacing-lg);
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-logo h1 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--primary-color);
        }

        .header-nav {
          display: flex;
          gap: var(--spacing-xl);
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }

        .nav-link:hover {
          color: var(--primary-color);
          background: var(--primary-light);
        }

        .nav-link.active {
          color: var(--primary-color);
          background: var(--primary-light);
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .user-info-badge {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-xs) var(--spacing-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .user-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .role-badge {
          padding: 2px 8px;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .role-badge-red {
          background: #fee2e2;
          color: #991b1b;
        }

        .role-badge-blue {
          background: #dbeafe;
          color: #1e40af;
        }

        .role-badge-green {
          background: #d1fae5;
          color: #065f46;
        }

        .role-badge-gray {
          background: #f3f4f6;
          color: #4b5563;
        }

        .user-dept {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .user-switcher {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .user-switcher-select {
          padding: var(--spacing-xs) var(--spacing-sm);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-family: var(--font-family);
          background: var(--bg-color);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
          min-width: 180px;
        }

        .user-switcher-select:hover {
          border-color: var(--primary-color);
        }

        .user-switcher-select:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .btn-change-pwd {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 1rem;
          font-family: var(--font-family);
          transition: all 0.2s;
        }

        .btn-change-pwd:hover {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .btn-logout {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.875rem;
          font-family: var(--font-family);
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: var(--error-color);
          color: white;
          border-color: var(--error-color);
        }
      `;
      document.head.appendChild(style);
    }
  }

  attachEvents() {
    const links = this.element.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        links.forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // 設定初始活動狀態
    const currentPath = window.location.hash.slice(1) || '/';
    links.forEach(link => {
      if (link.dataset.route === currentPath) {
        link.classList.add('active');
      }
    });

    // 使用者切換選擇器
    const userSwitcher = this.element.querySelector('#user-switcher-select');
    if (userSwitcher) {
      userSwitcher.addEventListener('change', (e) => {
        const newUserId = e.target.value;
        const newUser = UserModel.getById(newUserId);
        if (newUser) {
          // 切換當前使用者
          authService.setCurrentUser(newUser);
          console.log('✅ 切換使用者:', newUser.name, '-', newUser.role);
          // 重新載入頁面以更新所有內容（包括 Sidebar 選單）
          window.location.reload();
        }
      });
    }

    // 修改密碼按鈕
    const changePwdBtn = this.element.querySelector('#btn-change-pwd');
    if (changePwdBtn) {
      changePwdBtn.addEventListener('click', () => {
        this.showChangePasswordModal();
      });
    }

    // 登出按鈕
    const logoutBtn = this.element.querySelector('#btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('確定要登出？')) {
          authService.logout();
          window.location.reload();
        }
      });
    }
  }

  showChangePasswordModal() {
    const user = authService.getCurrentUser();
    if (!user) return;

    const modalHTML = `
      <div class="modal-overlay" id="change-pwd-modal">
        <div class="modal-content" style="max-width: 450px;">
          <div class="modal-header">
            <h3>修改密碼</h3>
            <button class="btn-close" id="btn-close-pwd-modal">×</button>
          </div>
          <div class="modal-body">
            <form id="change-pwd-form">
              <div class="form-group">
                <label>目前密碼</label>
                <input type="password" name="oldPassword" required placeholder="請輸入目前密碼">
              </div>
              <div class="form-group">
                <label>新密碼</label>
                <input type="password" name="newPassword" required placeholder="請輸入新密碼">
              </div>
              <div class="form-group">
                <label>確認新密碼</label>
                <input type="password" name="confirmPassword" required placeholder="請再次輸入新密碼">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel-pwd">取消</button>
            <button class="btn btn-primary" id="btn-save-pwd">儲存</button>
          </div>
        </div>
      </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    const modal = document.getElementById('change-pwd-modal');
    const form = document.getElementById('change-pwd-form');
    const closeBtn = document.getElementById('btn-close-pwd-modal');
    const cancelBtn = document.getElementById('btn-cancel-pwd');
    const saveBtn = document.getElementById('btn-save-pwd');

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

    // 儲存新密碼
    saveBtn.addEventListener('click', () => {
      const formData = new FormData(form);
      const oldPassword = formData.get('oldPassword');
      const newPassword = formData.get('newPassword');
      const confirmPassword = formData.get('confirmPassword');

      if (!oldPassword || !newPassword || !confirmPassword) {
        alert('請填寫所有欄位');
        return;
      }

      if (newPassword !== confirmPassword) {
        alert('新密碼與確認密碼不一致');
        return;
      }

      if (newPassword.length < 4) {
        alert('密碼長度至少4個字元');
        return;
      }

      try {
        // 驗證舊密碼
        const defaultPassword = user.account;
        const storedPassword = user.password || defaultPassword;

        if (oldPassword !== storedPassword) {
          alert('目前密碼錯誤');
          return;
        }

        // 更新密碼
        user.password = newPassword;
        const users = UserModel.getAll();
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          users[userIndex] = user;
          localStorage.setItem('rms_users', JSON.stringify(users));
          authService.setCurrentUser(user);
          alert('密碼修改成功');
          closeModal();
        }
      } catch (error) {
        alert(`密碼修改失敗：${error.message}`);
      }
    });
  }
}
