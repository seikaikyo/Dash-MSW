import { authService } from '../utils/authService.js';
import { router } from '../utils/router.js';

/**
 * 登入頁面
 */
export class LoginPage {
  constructor() {
    this.element = null;
  }

  render() {
    const page = document.createElement('div');
    page.className = 'login-page';

    const loginBox = document.createElement('div');
    loginBox.className = 'login-box';

    loginBox.innerHTML = `
      <div class="login-header">
        <h1>♻️ Dash MSW</h1>
        <p>柳營再生濾網製造系統</p>
      </div>

      <form class="login-form" id="login-form">
        <div class="form-group">
          <label for="username">帳號</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="請輸入帳號"
            required
            autocomplete="username"
          >
        </div>

        <div class="form-group">
          <label for="password">密碼</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="請輸入密碼"
            required
            autocomplete="current-password"
          >
        </div>

        <div class="form-error" id="login-error"></div>

        <button type="submit" class="btn-login">登入</button>
      </form>

      <div class="login-footer">
        <p class="hint">💡 預設密碼為帳號</p>
        <p class="hint">管理員：admin / 主管：user002 / 員工：user001</p>
        <p class="hint" style="font-size: 0.7rem; margin-top: 8px;">💼 管理員/主管進入後台管理 | 👷 作業員進入站點操作介面</p>
      </div>
    `;

    page.appendChild(loginBox);

    // 綁定事件
    setTimeout(() => {
      const form = document.getElementById('login-form');
      form.addEventListener('submit', (e) => this.handleLogin(e));

      // 自動聚焦帳號欄位
      document.getElementById('username').focus();
    }, 0);

    this.element = page;
    this.addStyles();
    return page;
  }

  async handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.querySelector('.btn-login');

    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = '登入中...';

    try {
      // 確保測試帳號已初始化（防止線上環境初始化時機問題）
      authService.initializeDefaultUsers();

      // 短暫延遲確保資料寫入完成
      await new Promise(resolve => setTimeout(resolve, 100));

      authService.login(username, password);

      // 登入成功，跳轉到首頁
      submitBtn.textContent = '登入成功！';
      await new Promise(resolve => setTimeout(resolve, 500));

      router.navigate('/');
      window.location.reload(); // 重新載入以更新 Layout
    } catch (error) {
      errorEl.textContent = error.message;
      submitBtn.disabled = false;
      submitBtn.textContent = '登入';
    }
  }

  addStyles() {
    if (!document.getElementById('login-page-styles')) {
      const style = document.createElement('style');
      style.id = 'login-page-styles';
      style.textContent = `
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: var(--spacing-lg);
        }

        .login-box {
          background: white;
          border-radius: var(--radius-xl);
          padding: var(--spacing-xxl);
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: var(--spacing-xxl);
        }

        .login-header h1 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: 2rem;
          color: var(--text-primary);
        }

        .login-header p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .login-form .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .login-form label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .login-form input {
          padding: var(--spacing-md);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-family: var(--font-family);
          transition: border-color 0.2s;
        }

        .login-form input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-error {
          color: var(--error-color);
          font-size: 0.875rem;
          min-height: 1.5rem;
          display: flex;
          align-items: center;
        }

        .btn-login {
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-family);
        }

        .btn-login:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .btn-login:active {
          transform: translateY(0);
        }

        .login-footer {
          margin-top: var(--spacing-xl);
          text-align: center;
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
        }

        .login-footer .hint {
          margin: var(--spacing-xs) 0;
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
