import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { Footer } from './Footer.js';

export class Layout {
  constructor() {
    this.header = new Header();
    this.sidebar = new Sidebar();
    this.footer = new Footer();
    this.element = null;
  }

  render() {
    const layout = document.createElement('div');
    layout.className = 'layout';

    // 渲染 Header
    layout.appendChild(this.header.render());

    // 建立主體區域
    const main = document.createElement('div');
    main.className = 'layout-main';

    // 渲染 Sidebar
    main.appendChild(this.sidebar.render());

    // 建立內容區域容器
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'layout-content-wrapper';

    const content = document.createElement('div');
    content.className = 'layout-content';
    content.id = 'main-content';
    contentWrapper.appendChild(content);

    // 加入 Footer
    contentWrapper.appendChild(this.footer.render());

    main.appendChild(contentWrapper);

    layout.appendChild(main);

    this.element = layout;
    this.addStyles();
    return layout;
  }

  addStyles() {
    if (!document.getElementById('layout-styles')) {
      const style = document.createElement('style');
      style.id = 'layout-styles';
      style.textContent = `
        .layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .layout-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .layout-content-wrapper {
          flex: 1;
          overflow-y: auto;
          background: var(--bg-secondary);
          display: flex;
          flex-direction: column;
        }

        .layout-content {
          flex: 1;
          padding: var(--spacing-xl);
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 更新主要內容區域
  setContent(content) {
    const contentArea = this.element.querySelector('#main-content');
    if (contentArea) {
      contentArea.innerHTML = '';
      if (typeof content === 'string') {
        contentArea.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        contentArea.appendChild(content);
      }
    }
  }
}
