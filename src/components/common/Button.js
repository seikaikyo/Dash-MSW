export class Button {
  constructor(options = {}) {
    this.text = options.text || 'Button';
    this.variant = options.variant || 'primary'; // primary, secondary, outline, danger
    this.size = options.size || 'md'; // sm, md, lg
    this.disabled = options.disabled || false;
    this.onClick = options.onClick || null;
    this.element = null;
  }

  render() {
    const button = document.createElement('button');
    button.className = `btn btn-${this.variant} btn-${this.size}`;
    button.textContent = this.text;
    button.disabled = this.disabled;

    if (this.onClick) {
      button.addEventListener('click', this.onClick);
    }

    this.element = button;
    this.addStyles();
    return button;
  }

  addStyles() {
    if (!document.getElementById('button-styles')) {
      const style = document.createElement('style');
      style.id = 'button-styles';
      style.textContent = `
        .btn {
          border: none;
          border-radius: var(--radius-md);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-family);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* 尺寸 */
        .btn-sm {
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: 0.875rem;
          height: 32px;
        }

        .btn-md {
          padding: var(--spacing-sm) var(--spacing-lg);
          font-size: 1rem;
          height: 40px;
        }

        .btn-lg {
          padding: var(--spacing-md) var(--spacing-xl);
          font-size: 1.125rem;
          height: 48px;
        }

        /* 主要按鈕 */
        .btn-primary {
          background: var(--primary-color);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        /* 次要按鈕 */
        .btn-secondary {
          background: var(--secondary-color);
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--secondary-hover);
        }

        /* 外框按鈕 */
        .btn-outline {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        }

        .btn-outline:hover:not(:disabled) {
          background: var(--bg-secondary);
          border-color: var(--border-hover);
        }

        /* 危險按鈕 */
        .btn-danger {
          background: var(--error-color);
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
