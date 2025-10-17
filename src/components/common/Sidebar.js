import { permissionManager } from '../../utils/permissionManager.js';

export class Sidebar {
  constructor() {
    this.element = null;
    this.isCollapsed = false;
  }

  render() {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';

    // 取得可訪問的選單
    const accessibleMenu = permissionManager.getAccessibleMenu();

    // 動態生成選單 HTML
    const menuHTML = accessibleMenu.map(section => `
      <div class="sidebar-section">
        <h3 class="sidebar-title">${section.title}</h3>
        <ul class="sidebar-menu">
          ${section.items.map(item => `
            <li><a href="#${item.path}" class="sidebar-link">${item.label}</a></li>
          `).join('')}
        </ul>
      </div>
    `).join('');

    sidebar.innerHTML = `
      <div class="sidebar-content">
        ${menuHTML}
      </div>
    `;

    this.element = sidebar;
    this.addStyles();
    this.highlightActiveLink();
    return sidebar;
  }

  /**
   * 標記當前活動的選單項目
   */
  highlightActiveLink() {
    if (!this.element) return;

    const currentPath = window.location.hash.slice(1) || '/';
    const links = this.element.querySelectorAll('.sidebar-link');

    links.forEach(link => {
      const href = link.getAttribute('href').slice(1); // 移除 #
      if (href === currentPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * 更新選單（當使用者權限變更時）
   */
  update() {
    if (!this.element || !this.element.parentNode) return;

    const newSidebar = this.render();
    this.element.parentNode.replaceChild(newSidebar, this.element);
    this.element = newSidebar;
  }

  addStyles() {
    if (!document.getElementById('sidebar-styles')) {
      const style = document.createElement('style');
      style.id = 'sidebar-styles';
      style.textContent = `
        .sidebar {
          width: 240px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          overflow-y: auto;
          flex-shrink: 0;
        }

        .sidebar-content {
          padding: var(--spacing-lg);
        }

        .sidebar-section {
          margin-bottom: var(--spacing-xl);
        }

        .sidebar-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          margin-bottom: var(--spacing-md);
        }

        .sidebar-menu {
          list-style: none;
        }

        .sidebar-menu li {
          margin-bottom: var(--spacing-xs);
        }

        .sidebar-link {
          display: block;
          padding: var(--spacing-sm) var(--spacing-md);
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all 0.2s;
          font-weight: 500;
        }

        .sidebar-link:hover {
          background: var(--bg-color);
          color: var(--primary-color);
        }

        .sidebar-link.active {
          background: var(--bg-color);
          color: var(--primary-color);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
