export class Select {
  constructor(options = {}) {
    this.label = options.label || '';
    this.options = options.options || []; // [{ value: '', label: '' }]
    this.value = options.value || '';
    this.required = options.required || false;
    this.disabled = options.disabled || false;
    this.onChange = options.onChange || null;
    this.placeholder = options.placeholder || '請選擇';
    this.element = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'select-container';

    if (this.label) {
      const label = document.createElement('label');
      label.className = 'select-label';
      label.textContent = this.label;
      if (this.required) {
        const required = document.createElement('span');
        required.className = 'select-required';
        required.textContent = '*';
        label.appendChild(required);
      }
      container.appendChild(label);
    }

    const select = document.createElement('select');
    select.className = 'select-field';
    select.required = this.required;
    select.disabled = this.disabled;

    // 加入預設選項
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = this.placeholder;
    defaultOption.disabled = true;
    defaultOption.selected = !this.value;
    select.appendChild(defaultOption);

    // 加入選項
    this.options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === this.value) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    if (this.onChange) {
      select.addEventListener('change', (e) => this.onChange(e.target.value));
    }

    container.appendChild(select);
    this.element = container;
    this.addStyles();
    return container;
  }

  addStyles() {
    if (!document.getElementById('select-styles')) {
      const style = document.createElement('style');
      style.id = 'select-styles';
      style.textContent = `
        .select-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .select-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .select-required {
          color: var(--error-color);
          margin-left: var(--spacing-xs);
        }

        .select-field {
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
          cursor: pointer;
        }

        .select-field:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .select-field:disabled {
          background: var(--bg-tertiary);
          cursor: not-allowed;
        }
      `;
      document.head.appendChild(style);
    }
  }

  getValue() {
    return this.element.querySelector('.select-field').value;
  }

  setValue(value) {
    this.element.querySelector('.select-field').value = value;
  }
}
