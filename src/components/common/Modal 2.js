export class Modal {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.showClose = options.showClose !== false;
    this.onClose = options.onClose || null;
    this.element = null;
    this.isOpen = false;
  }

  render() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'none';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h3');
    title.className = 'modal-title';
    title.textContent = this.title;
    header.appendChild(title);

    if (this.showClose) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'modal-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', () => this.close());
      header.appendChild(closeBtn);
    }

    modal.appendChild(header);

    const body = document.createElement('div');
    body.className = 'modal-body';

    if (typeof this.content === 'string') {
      body.innerHTML = this.content;
    } else if (this.content instanceof HTMLElement) {
      body.appendChild(this.content);
    }

    modal.appendChild(body);

    overlay.appendChild(modal);

    // 點擊 overlay 關閉
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    this.element = overlay;
    this.addStyles();
    return overlay;
  }

  addStyles() {
    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.textContent = `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: var(--spacing-lg);
        }

        .modal {
          background: var(--bg-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 2rem;
          line-height: 1;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .modal-body {
          padding: var(--spacing-lg);
          overflow-y: auto;
        }
      `;
      document.head.appendChild(style);
    }
  }

  open() {
    // 如果還沒渲染，先渲染
    if (!this.element) {
      this.render();
    }

    if (!this.element.parentNode) {
      document.body.appendChild(this.element);
    }
    this.element.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.element.style.display = 'none';
    this.isOpen = false;
    if (this.onClose) {
      this.onClose();
    }
  }

  setContent(content) {
    const body = this.element.querySelector('.modal-body');
    body.innerHTML = '';
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    }
  }
}
