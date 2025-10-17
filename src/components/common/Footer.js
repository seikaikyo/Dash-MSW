export class Footer {
  constructor() {
    this.element = null;
    this.version = '0.1.0';
    this.developer = 'Dash Project Team';
    this.repoUrl = 'https://github.com/seikaikyo/Dash-MSW';
  }

  render() {
    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.innerHTML = `
      <div class="footer-container">
        <div class="footer-content">
          <p class="footer-info">
            Dash MSW - 柳營再生濾網製程管理系統 v${this.version}
            <span class="footer-divider">|</span>
            開發團隊：<a href="${this.repoUrl}" target="_blank" rel="noopener noreferrer">${this.developer}</a>
          </p>
          <p class="footer-copyright">
            © 2025 Dash MSW. Licensed under MIT License.
          </p>
        </div>
      </div>
    `;

    this.element = footer;
    this.addStyles();
    return footer;
  }

  addStyles() {
    if (!document.getElementById('footer-styles')) {
      const style = document.createElement('style');
      style.id = 'footer-styles';
      style.textContent = `
        .footer {
          background: var(--bg-color);
          border-top: 1px solid var(--border-color);
          padding: var(--spacing-lg);
          margin-top: auto;
        }

        .footer-container {
          max-width: 1440px;
          margin: 0 auto;
        }

        .footer-content {
          text-align: center;
        }

        .footer-info {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0 0 var(--spacing-xs) 0;
          font-weight: 500;
        }

        .footer-divider {
          margin: 0 var(--spacing-sm);
          color: var(--text-tertiary);
        }

        .footer-info a {
          color: var(--primary-color);
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .footer-info a:hover {
          opacity: 0.7;
          text-decoration: underline;
        }

        .footer-copyright {
          color: var(--text-tertiary);
          font-size: 0.75rem;
          margin: 0;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
