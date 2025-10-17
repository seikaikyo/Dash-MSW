import { permissionManager } from './permissionManager.js';
import { authService } from './authService.js';

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.layout = null;
  }

  setLayout(layout) {
    this.layout = layout;
  }

  addRoute(path, handler) {
    this.routes.set(path, handler);
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  async handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    // 移除 query string，只取路徑部分
    const path = hash.split('?')[0];
    const route = this.routes.get(path);

    if (route) {
      // 權限檢查
      if (!permissionManager.canAccessPage(path)) {
        this.showAccessDenied(path);
        return;
      }

      this.currentRoute = path;
      try {
        const content = await route();
        if (this.layout) {
          this.layout.setContent(content);
        }
      } catch (error) {
        console.error('Route handler error:', error);
        // 顯示錯誤訊息
        if (this.layout) {
          const errorDiv = document.createElement('div');
          errorDiv.style.padding = '20px';
          errorDiv.innerHTML = `
            <h2>載入頁面時發生錯誤</h2>
            <p>${error.message}</p>
            <pre>${error.stack}</pre>
          `;
          this.layout.setContent(errorDiv);
        }
      }
    } else {
      // 404 頁面
      this.navigate('/');
    }
  }

  /**
   * 顯示權限不足頁面
   * @param {string} path - 嘗試訪問的路徑
   */
  showAccessDenied(path) {
    const user = authService.getCurrentUser();
    const deniedDiv = document.createElement('div');
    deniedDiv.style.padding = '40px';
    deniedDiv.style.textAlign = 'center';
    deniedDiv.innerHTML = `
      <div style="max-width: 500px; margin: 0 auto;">
        <div style="font-size: 72px; margin-bottom: 24px;">🚫</div>
        <h2 style="margin-bottom: 16px; color: #ef4444;">權限不足</h2>
        <p style="margin-bottom: 24px; color: #6b7280;">
          您的帳號（<strong>${user?.name || '未登入'}</strong>，角色：<strong>${user?.role || 'N/A'}</strong>）無法訪問此頁面。
        </p>
        <p style="margin-bottom: 32px; color: #9ca3af; font-size: 14px;">
          請求路徑：${path}
        </p>
        <button
          onclick="window.location.hash = '/'"
          style="
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
          ">
          返回首頁
        </button>
      </div>
    `;

    if (this.layout) {
      this.layout.setContent(deniedDiv);
    }

    console.warn(`[權限控制] 使用者 ${user?.name} (${user?.role}) 嘗試訪問無權限頁面: ${path}`);
  }

  navigate(path) {
    window.location.hash = path;
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}

// 匯出單例
export const router = new Router();
