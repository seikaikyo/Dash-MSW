import { FieldToolbox } from './FieldToolbox.js';
import { FieldCanvas } from './FieldCanvas.js';
import { FieldPropertyPanel } from './FieldPropertyPanel.js';

/**
 * 範本欄位編輯器
 * 整合工具箱、畫布、屬性面板的主編輯器
 */
export class TemplateFieldEditor {
  constructor(options = {}) {
    this.fields = options.fields || [];
    this.onChange = options.onChange || null;
    this.element = null;

    // 子組件
    this.toolbox = null;
    this.canvas = null;
    this.propertyPanel = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'template-field-editor';

    // 建立工具箱
    this.toolbox = new FieldToolbox({
      onFieldClick: (item) => this.handleFieldAdd(item)
    });

    // 建立畫布
    this.canvas = new FieldCanvas({
      fields: this.fields,
      onFieldSelect: (field) => this.handleFieldSelect(field),
      onFieldDelete: (fieldId) => this.handleFieldDelete(fieldId)
    });

    // 建立屬性面板
    this.propertyPanel = new FieldPropertyPanel({
      field: null,
      onFieldUpdate: (field) => this.handleFieldUpdate(field)
    });

    // 組合佈局
    container.appendChild(this.toolbox.render());
    container.appendChild(this.canvas.render());
    container.appendChild(this.propertyPanel.render());

    this.element = container;
    this.addStyles();
    return container;
  }

  handleFieldAdd(toolboxItem) {
    // 從工具箱新增欄位
    const newField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...toolboxItem.defaultConfig,
      name: `field_${this.fields.length + 1}`
    };

    this.fields.push(newField);
    this.canvas.fields = this.fields;
    this.canvas.refresh();
    this.canvas.selectField(newField.id);

    this.notifyChange();
  }

  handleFieldSelect(field) {
    this.propertyPanel.setField(field);
  }

  handleFieldDelete(fieldId) {
    this.fields = this.fields.filter(f => f.id !== fieldId);
    this.canvas.fields = this.fields;
    this.propertyPanel.setField(null);

    this.notifyChange();
  }

  handleFieldUpdate(field) {
    // 更新畫布顯示
    this.canvas.refresh();

    this.notifyChange();
  }

  getFields() {
    return this.canvas.getFields();
  }

  setFields(fields) {
    this.fields = fields;
    if (this.canvas) {
      this.canvas.fields = fields;
      this.canvas.refresh();
    }
  }

  notifyChange() {
    if (this.onChange) {
      this.onChange(this.getFields());
    }
  }

  addStyles() {
    if (!document.getElementById('template-field-editor-styles')) {
      const style = document.createElement('style');
      style.id = 'template-field-editor-styles';
      style.textContent = `
        .template-field-editor {
          display: flex;
          height: 600px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-color);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
