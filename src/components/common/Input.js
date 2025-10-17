export class Input {
  constructor(options = {}) {
    this.type = options.type || 'text';
    this.placeholder = options.placeholder || '';
    this.value = options.value || '';
    this.label = options.label || '';
    this.required = options.required || false;
    this.disabled = options.disabled || false;
    this.onChange = options.onChange || null;
    this.element = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'input-container';

    if (this.label) {
      const label = document.createElement('label');
      label.className = 'input-label';
      label.textContent = this.label;
      if (this.required) {
        const required = document.createElement('span');
        required.className = 'input-required';
        required.textContent = '*';
        label.appendChild(required);
      }
      container.appendChild(label);
    }

    const input = document.createElement('input');
    input.type = this.type;
    input.className = 'input-field';
    input.placeholder = this.placeholder;
    input.value = this.value;
    input.required = this.required;
    input.disabled = this.disabled;

    if (this.onChange) {
      input.addEventListener('input', (e) => this.onChange(e.target.value));
    }

    container.appendChild(input);
    this.element = container;
    this.addStyles();
    return container;
  }

  addStyles() {
    if (!document.getElementById('input-styles')) {
      const style = document.createElement('style');
      style.id = 'input-styles';
      style.textContent = `
        .input-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .input-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .input-required {
          color: var(--error-color);
          margin-left: var(--spacing-xs);
        }

        .input-field {
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-family: var(--font-family);
          color: var(--text-primary);
          background: var(--bg-color);
          transition: all 0.2s;
          height: 40px;
        }

        .input-field:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .input-field:disabled {
          background: var(--bg-tertiary);
          cursor: not-allowed;
        }

        .input-field::placeholder {
          color: var(--text-tertiary);
        }
      `;
      document.head.appendChild(style);
    }
  }

  getValue() {
    return this.element.querySelector('.input-field').value;
  }

  setValue(value) {
    this.element.querySelector('.input-field').value = value;
  }
}
