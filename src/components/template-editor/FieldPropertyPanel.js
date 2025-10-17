import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';
import { Button } from '../common/Button.js';
import { validateFieldConfig } from '../../utils/fieldTypes.js';

/**
 * 欄位屬性編輯面板組件
 * 編輯選中欄位的詳細屬性
 */
export class FieldPropertyPanel {
  constructor(options = {}) {
    this.field = options.field || null;
    this.onFieldUpdate = options.onFieldUpdate || null;
    this.element = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'field-property-panel';

    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `
      <h3>⚙️ 欄位屬性</h3>
    `;
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'panel-content';

    if (!this.field) {
      content.innerHTML = `
        <div class="no-selection">
          <div class="no-selection-icon">👈</div>
          <p>請從左側選擇欄位以編輯屬性</p>
        </div>
      `;
    } else {
      this.renderFieldProperties(content);
    }

    container.appendChild(content);
    this.element = container;
    this.addStyles();
    return container;
  }

  renderFieldProperties(container) {
    container.innerHTML = '';

    const form = document.createElement('div');
    form.className = 'property-form';

    // 基本屬性
    form.appendChild(this.createSection('基本設定', [
      this.createNameInput(),
      this.createLabelInput(),
      this.createTypeSelect(),
      this.createRequiredToggle()
    ]));

    // 根據類型顯示特定屬性
    const typeSpecificFields = this.getTypeSpecificFields();
    if (typeSpecificFields.length > 0) {
      form.appendChild(this.createSection('類型設定', typeSpecificFields));
    }

    // 驗證規則（可選）
    form.appendChild(this.createSection('驗證與顯示', [
      this.createPlaceholderInput(),
      this.createDefaultValueInput()
    ]));

    container.appendChild(form);
  }

  createSection(title, fields) {
    const section = document.createElement('div');
    section.className = 'property-section';

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);

    fields.forEach(field => {
      if (field) section.appendChild(field);
    });

    return section;
  }

  createNameInput() {
    const input = new Input({
      label: '欄位名稱 (name)',
      value: this.field.name,
      placeholder: 'fieldName',
      onChange: (value) => {
        this.updateField({ name: value });
      }
    });
    return input.render();
  }

  createLabelInput() {
    const input = new Input({
      label: '欄位標籤 (label)',
      value: this.field.label,
      placeholder: '欄位顯示名稱',
      onChange: (value) => {
        this.updateField({ label: value });
      }
    });
    return input.render();
  }

  createTypeSelect() {
    const select = new Select({
      label: '欄位類型',
      value: this.field.type,
      options: [
        { value: 'text', label: '文字輸入' },
        { value: 'number', label: '數字輸入' },
        { value: 'textarea', label: '多行文字' },
        { value: 'select', label: '下拉選單' },
        { value: 'radio', label: '單選按鈕' },
        { value: 'checkbox', label: '複選框' },
        { value: 'date', label: '日期' },
        { value: 'time', label: '時間' },
        { value: 'email', label: 'Email' },
        { value: 'url', label: 'URL' },
        { value: 'tel', label: '電話' },
        { value: 'file', label: '檔案上傳' }
      ],
      onChange: (value) => {
        this.updateField({ type: value });
        this.refresh();
      }
    });
    return select.render();
  }

  createRequiredToggle() {
    const container = document.createElement('div');
    container.className = 'toggle-field';

    const label = document.createElement('label');
    label.className = 'toggle-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.field.required || false;
    checkbox.addEventListener('change', (e) => {
      this.updateField({ required: e.target.checked });
    });

    const labelText = document.createElement('span');
    labelText.textContent = '必填欄位';

    label.appendChild(checkbox);
    label.appendChild(labelText);
    container.appendChild(label);

    return container;
  }

  createPlaceholderInput() {
    if (!['text', 'number', 'textarea', 'email', 'url', 'tel'].includes(this.field.type)) {
      return null;
    }

    const input = new Input({
      label: 'Placeholder',
      value: this.field.placeholder || '',
      placeholder: '提示文字...',
      onChange: (value) => {
        this.updateField({ placeholder: value });
      }
    });
    return input.render();
  }

  createDefaultValueInput() {
    const input = new Input({
      label: '預設值',
      value: this.field.defaultValue || '',
      placeholder: '預設值...',
      onChange: (value) => {
        this.updateField({ defaultValue: value });
      }
    });
    return input.render();
  }

  getTypeSpecificFields() {
    const fields = [];

    switch (this.field.type) {
      case 'number':
        fields.push(this.createNumberFields());
        break;
      case 'textarea':
        fields.push(this.createTextareaFields());
        break;
      case 'select':
      case 'radio':
        fields.push(this.createOptionsField());
        break;
      case 'file':
        fields.push(this.createFileFields());
        break;
    }

    return fields.filter(f => f !== null);
  }

  createNumberFields() {
    const container = document.createElement('div');
    container.className = 'field-group';

    const minInput = new Input({
      label: '最小值',
      type: 'number',
      value: this.field.min !== undefined ? this.field.min : '',
      onChange: (value) => {
        this.updateField({ min: value ? parseFloat(value) : null });
      }
    });

    const maxInput = new Input({
      label: '最大值',
      type: 'number',
      value: this.field.max !== undefined ? this.field.max : '',
      onChange: (value) => {
        this.updateField({ max: value ? parseFloat(value) : null });
      }
    });

    const stepInput = new Input({
      label: '步進值',
      type: 'number',
      value: this.field.step || 1,
      onChange: (value) => {
        this.updateField({ step: value ? parseFloat(value) : 1 });
      }
    });

    container.appendChild(minInput.render());
    container.appendChild(maxInput.render());
    container.appendChild(stepInput.render());

    return container;
  }

  createTextareaFields() {
    const input = new Input({
      label: '行數',
      type: 'number',
      value: this.field.rows || 3,
      min: 1,
      onChange: (value) => {
        this.updateField({ rows: value ? parseInt(value) : 3 });
      }
    });
    return input.render();
  }

  createOptionsField() {
    const container = document.createElement('div');
    container.className = 'options-editor';

    const header = document.createElement('div');
    header.className = 'options-header';
    header.innerHTML = '<label>選項列表</label>';

    const addBtn = new Button({
      text: '新增選項',
      variant: 'outline',
      onClick: () => this.addOption()
    });

    header.appendChild(addBtn.render());
    container.appendChild(header);

    const optionsList = document.createElement('div');
    optionsList.className = 'options-list';

    (this.field.options || []).forEach((option, index) => {
      const optionItem = this.createOptionItem(option, index);
      optionsList.appendChild(optionItem);
    });

    container.appendChild(optionsList);

    return container;
  }

  createOptionItem(option, index) {
    const item = document.createElement('div');
    item.className = 'option-item';

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'form-input';
    valueInput.placeholder = '值';
    valueInput.value = option.value || '';
    valueInput.addEventListener('input', (e) => {
      this.updateOption(index, { value: e.target.value });
    });

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'form-input';
    labelInput.placeholder = '標籤';
    labelInput.value = option.label || '';
    labelInput.addEventListener('input', (e) => {
      this.updateOption(index, { label: e.target.value });
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon';
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = () => this.deleteOption(index);

    item.appendChild(valueInput);
    item.appendChild(labelInput);
    item.appendChild(deleteBtn);

    return item;
  }

  createFileFields() {
    const input = new Input({
      label: '接受的檔案類型',
      value: this.field.accept || '*',
      placeholder: 'e.g., .pdf,.doc,.docx',
      onChange: (value) => {
        this.updateField({ accept: value });
      }
    });
    return input.render();
  }

  addOption() {
    const options = this.field.options || [];
    options.push({ value: '', label: '' });
    this.updateField({ options });
    this.refresh();
  }

  updateOption(index, updates) {
    const options = [...(this.field.options || [])];
    options[index] = { ...options[index], ...updates };
    this.updateField({ options });
  }

  deleteOption(index) {
    const options = [...(this.field.options || [])];
    options.splice(index, 1);
    this.updateField({ options });
    this.refresh();
  }

  updateField(updates) {
    if (this.field) {
      Object.assign(this.field, updates);
      if (this.onFieldUpdate) {
        this.onFieldUpdate(this.field);
      }
    }
  }

  setField(field) {
    this.field = field;
    this.refresh();
  }

  refresh() {
    if (this.element) {
      const content = this.element.querySelector('.panel-content');
      if (content) {
        if (!this.field) {
          content.innerHTML = `
            <div class="no-selection">
              <div class="no-selection-icon">👈</div>
              <p>請從左側選擇欄位以編輯屬性</p>
            </div>
          `;
        } else {
          this.renderFieldProperties(content);
        }
      }
    }
  }

  addStyles() {
    if (!document.getElementById('field-property-panel-styles')) {
      const style = document.createElement('style');
      style.id = 'field-property-panel-styles';
      style.textContent = `
        .field-property-panel {
          width: 320px;
          background: var(--bg-secondary);
          border-left: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
        }

        .panel-header h3 {
          margin: 0;
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-lg);
        }

        .no-selection {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--text-tertiary);
        }

        .no-selection-icon {
          font-size: 3rem;
          margin-bottom: var(--spacing-md);
        }

        .property-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .property-section {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: var(--spacing-lg);
        }

        .property-section:last-child {
          border-bottom: none;
        }

        .section-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          margin-bottom: var(--spacing-md);
        }

        .toggle-field {
          padding: var(--spacing-sm) 0;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
        }

        .toggle-label input[type="checkbox"] {
          cursor: pointer;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .options-editor {
          margin-top: var(--spacing-sm);
        }

        .options-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .options-header label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .option-item {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: var(--spacing-xs);
          align-items: center;
        }

        .option-item .form-input {
          font-size: 0.875rem;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
