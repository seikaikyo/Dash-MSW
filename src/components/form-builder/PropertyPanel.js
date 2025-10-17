import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';

// 屬性設定面板
export class PropertyPanel {
  constructor() {
    this.element = null;
    this.selectedField = null;
    this.onFieldUpdate = null;
  }

  render() {
    const panel = document.createElement('div');
    panel.className = 'property-panel';

    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = '<h3>欄位設定</h3>';
    panel.appendChild(header);

    const content = document.createElement('div');
    content.className = 'panel-content';
    content.id = 'property-panel-content';

    if (!this.selectedField) {
      content.innerHTML = `
        <div class="panel-empty">
          <p>請選擇一個欄位以編輯其屬性</p>
        </div>
      `;
    } else {
      this.renderFieldProperties(content);
    }

    panel.appendChild(content);
    this.element = panel;
    this.addStyles();
    return panel;
  }

  renderFieldProperties(container) {
    container.innerHTML = '';

    const form = document.createElement('div');
    form.className = 'property-form';

    // 欄位標籤
    const labelInput = new Input({
      label: '欄位標籤',
      value: this.selectedField.label,
      required: true,
      onChange: (value) => {
        this.updateField({ label: value });
      }
    });
    form.appendChild(labelInput.render());

    // 欄位寬度（格數）
    const colSpanInput = new Input({
      label: '欄位寬度（1-12格）',
      type: 'number',
      value: String(this.selectedField.colSpan || 12),
      placeholder: '1-12',
      onChange: (value) => {
        let colSpan = parseInt(value);
        // 限制在 1-12 範圍內
        if (colSpan < 1) colSpan = 1;
        if (colSpan > 12) colSpan = 12;
        this.updateField({ colSpan: colSpan });
      }
    });
    form.appendChild(colSpanInput.render());

    // 欄位說明
    if (this.selectedField.type !== 'divider') {
      const placeholderInput = new Input({
        label: this.selectedField.type === 'label' ? '顯示文字' : '欄位說明',
        value: this.selectedField.placeholder || '',
        onChange: (value) => {
          this.updateField({ placeholder: value });
        }
      });
      form.appendChild(placeholderInput.render());
    }

    // 必填設定
    if (!['divider', 'label'].includes(this.selectedField.type)) {
      const requiredContainer = document.createElement('div');
      requiredContainer.className = 'property-item';
      requiredContainer.innerHTML = `
        <label class="checkbox-label">
          <input type="checkbox" id="field-required" ${this.selectedField.required ? 'checked' : ''}>
          必填欄位
        </label>
      `;

      const checkbox = requiredContainer.querySelector('#field-required');
      checkbox.addEventListener('change', (e) => {
        this.updateField({ required: e.target.checked });
      });

      form.appendChild(requiredContainer);
    }

    // 選項設定（下拉選單、單選、多選）
    if (['select', 'radio', 'checkbox'].includes(this.selectedField.type)) {
      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'property-item';

      const optionsHeader = document.createElement('div');
      optionsHeader.className = 'options-header';
      optionsHeader.innerHTML = `
        <label>選項設定</label>
        <button class="btn-add-option" type="button">+ 新增選項</button>
      `;
      optionsContainer.appendChild(optionsHeader);

      const optionsList = document.createElement('div');
      optionsList.className = 'options-list';

      (this.selectedField.options || []).forEach((option, index) => {
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = option.label;
        input.placeholder = `選項 ${index + 1}`;
        input.addEventListener('input', (e) => {
          const newOptions = [...this.selectedField.options];
          newOptions[index] = { label: e.target.value, value: `option${index + 1}` };
          this.updateField({ options: newOptions });
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete-option';
        deleteBtn.textContent = '×';
        deleteBtn.type = 'button';
        deleteBtn.addEventListener('click', () => {
          const newOptions = this.selectedField.options.filter((_, i) => i !== index);
          this.updateField({ options: newOptions });
          this.setSelectedField(this.selectedField);
        });

        optionItem.appendChild(input);
        optionItem.appendChild(deleteBtn);
        optionsList.appendChild(optionItem);
      });

      optionsContainer.appendChild(optionsList);

      const addBtn = optionsHeader.querySelector('.btn-add-option');
      addBtn.addEventListener('click', () => {
        const newOptions = [...(this.selectedField.options || [])];
        newOptions.push({ label: `選項 ${newOptions.length + 1}`, value: `option${newOptions.length + 1}` });
        this.updateField({ options: newOptions });
        this.setSelectedField(this.selectedField);
      });

      form.appendChild(optionsContainer);
    }

    container.appendChild(form);
  }

  setSelectedField(field) {
    this.selectedField = field;
    const content = this.element?.querySelector('#property-panel-content');
    if (content) {
      if (field) {
        this.renderFieldProperties(content);
      } else {
        content.innerHTML = `
          <div class="panel-empty">
            <p>請選擇一個欄位以編輯其屬性</p>
          </div>
        `;
      }
    }
  }

  updateField(updates) {
    if (this.selectedField && this.onFieldUpdate) {
      Object.assign(this.selectedField, updates);
      this.onFieldUpdate(this.selectedField.id, updates);
    }
  }

  addStyles() {
    if (!document.getElementById('property-panel-styles')) {
      const style = document.createElement('style');
      style.id = 'property-panel-styles';
      style.textContent = `
        .property-panel {
          background: var(--bg-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
        }

        .panel-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
        }

        .panel-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-tertiary);
          text-align: center;
          padding: var(--spacing-xl);
        }

        .property-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .property-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .property-item label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
        }

        .options-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .options-header label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .btn-add-option {
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-option:hover {
          background: var(--primary-hover);
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .option-item {
          display: flex;
          gap: var(--spacing-sm);
        }

        .option-item input {
          flex: 1;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: var(--font-family);
        }

        .option-item input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .btn-delete-option {
          background: var(--error-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 1.25rem;
          line-height: 1;
          transition: all 0.2s;
        }

        .btn-delete-option:hover {
          background: #dc2626;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
