export class Card {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.footer = options.footer || '';
    this.element = null;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'card';

    if (this.title) {
      const header = document.createElement('div');
      header.className = 'card-header';

      if (typeof this.title === 'string') {
        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = this.title;
        header.appendChild(title);
      } else {
        header.appendChild(this.title);
      }

      card.appendChild(header);
    }

    const body = document.createElement('div');
    body.className = 'card-body';

    if (typeof this.content === 'string') {
      body.innerHTML = this.content;
    } else if (this.content instanceof HTMLElement) {
      body.appendChild(this.content);
    }

    card.appendChild(body);

    if (this.footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'card-footer';

      if (typeof this.footer === 'string') {
        footerEl.innerHTML = this.footer;
      } else if (this.footer instanceof HTMLElement) {
        footerEl.appendChild(this.footer);
      }

      card.appendChild(footerEl);
    }

    this.element = card;
    this.addStyles();
    return card;
  }

  addStyles() {
    if (!document.getElementById('card-styles')) {
      const style = document.createElement('style');
      style.id = 'card-styles';
      style.textContent = `
        .card {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .card-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-color);
        }

        .card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .card-body {
          padding: var(--spacing-lg);
        }

        .card-footer {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
