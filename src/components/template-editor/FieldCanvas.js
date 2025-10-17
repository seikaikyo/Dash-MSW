import { generateFieldId } from '../../utils/fieldTypes.js';

/**
 * 欄位畫布組件
 * 顯示已新增的欄位列表，支援拖拽排序
 */
export class FieldCanvas {
  constructor(options = {}) {
    this.fields = options.fields || [];
    this.onFieldSelect = options.onFieldSelect || null;
    this.onFieldDelete = options.onFieldDelete || null;
    this.onFieldsReorder = options.onFieldsReorder || null;
    this.selectedFieldId = null;
    this.element = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'field-canvas';

    const header = document.createElement('div');
    header.className = 'canvas-header';
    header.innerHTML = `
      <h3>📋 欄位列表</h3>
      <p class="canvas-hint">拖拽欄位調整順序，點擊編輯屬性</p>
    `;
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'canvas-content';
    content.id = 'field-canvas-content';

    // 拖拽放置區域
    content.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      content.classList.add('drag-over');
    });

    content.addEventListener('dragleave', () => {
      content.classList.remove('drag-over');
    });

    content.addEventListener('drop', (e) => {
      e.preventDefault();
      content.classList.remove('drag-over');

      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data && data.defaultConfig) {
          this.addFieldFromToolbox(data);
        }
      } catch (error) {
        console.error('Invalid drop data:', error);
      }
    });

    this.renderFields(content);
    container.appendChild(content);

    this.element = container;
    this.addStyles();
    return container;
  }

  renderFields(container) {
    container.innerHTML = '';

    if (this.fields.length === 0) {
      container.innerHTML = `
        <div class="empty-canvas">
          <div class="empty-icon">📦</div>
          <p>尚未新增任何欄位</p>
          <p class="empty-hint">從左側工具箱拖拽欄位到此處</p>
        </div>
      `;
      return;
    }

    // 按照 row 分組顯示欄位
    const rows = this.groupFieldsByRow();

    rows.forEach((rowFields, rowIndex) => {
      const rowElement = this.createRow(rowFields, rowIndex);
      container.appendChild(rowElement);
    });

    // 添加新增列按鈕
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'add-row-btn';
    addRowBtn.innerHTML = '➕ 新增列';
    addRowBtn.addEventListener('click', () => this.addRow());
    container.appendChild(addRowBtn);
  }

  groupFieldsByRow() {
    const rows = [];
    this.fields.forEach(field => {
      const rowIndex = field.row || 0;
      if (!rows[rowIndex]) {
        rows[rowIndex] = [];
      }
      rows[rowIndex].push(field);
    });
    return rows.filter(row => row && row.length > 0);
  }

  createRow(rowFields, rowIndex) {
    const row = document.createElement('div');
    row.className = 'field-row';
    row.dataset.rowIndex = rowIndex;

    const rowHeader = document.createElement('div');
    rowHeader.className = 'row-header';
    rowHeader.innerHTML = `
      <span class="row-title">第 ${rowIndex + 1} 列</span>
      <button class="btn-sm btn-icon" data-action="delete-row" title="刪除整列">🗑️</button>
    `;

    rowHeader.querySelector('[data-action="delete-row"]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`確定要刪除第 ${rowIndex + 1} 列的所有欄位嗎？`)) {
        this.deleteRow(rowIndex);
      }
    });

    row.appendChild(rowHeader);

    const rowContent = document.createElement('div');
    rowContent.className = 'row-content';

    // 拖拽放置區域
    rowContent.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      rowContent.classList.add('drag-over');
    });

    rowContent.addEventListener('dragleave', () => {
      rowContent.classList.remove('drag-over');
    });

    rowContent.addEventListener('drop', (e) => {
      e.preventDefault();
      rowContent.classList.remove('drag-over');

      // 處理從工具箱拖入的新欄位
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data && data.defaultConfig) {
          this.addFieldToRow(data, rowIndex);
        }
      } catch (error) {
        // 可能是欄位內部拖拽，不處理
      }
    });

    rowFields.forEach((field) => {
      const fieldItem = this.createFieldItem(field, rowIndex);
      rowContent.appendChild(fieldItem);
    });

    row.appendChild(rowContent);
    return row;
  }

  addRow() {
    // 找出最大的 row index
    const maxRow = Math.max(-1, ...this.fields.map(f => f.row || 0));
    const newRow = maxRow + 1;

    // 不需要添加欄位，只需要重新渲染以顯示空列
    this.refresh();
  }

  deleteRow(rowIndex) {
    this.fields = this.fields.filter(f => (f.row || 0) !== rowIndex);
    this.refresh();

    if (this.onFieldsReorder) {
      this.onFieldsReorder(this.fields);
    }
  }

  addFieldToRow(toolboxItem, rowIndex) {
    const newField = {
      id: generateFieldId(),
      ...toolboxItem.defaultConfig,
      name: `field_${this.fields.length + 1}`,
      row: rowIndex
    };

    this.fields.push(newField);
    this.refresh();
    this.selectField(newField.id);
  }

  createFieldItem(field, index) {
    const item = document.createElement('div');
    item.className = 'canvas-field-item';
    item.dataset.fieldId = field.id;
    item.draggable = true;

    if (field.id === this.selectedFieldId) {
      item.classList.add('selected');
    }

    const typeIcon = this.getFieldTypeIcon(field.type);

    item.innerHTML = `
      <div class="field-drag-handle">☰</div>
      <div class="field-info">
        <div class="field-icon">${typeIcon}</div>
        <div class="field-details">
          <div class="field-name">${field.label || field.name}</div>
          <div class="field-meta">
            <span class="field-type">${this.getFieldTypeLabel(field.type)}</span>
            ${field.required ? '<span class="field-required">必填</span>' : ''}
          </div>
        </div>
      </div>
      <div class="field-actions">
        <button class="btn-icon" data-action="delete" title="刪除">🗑️</button>
      </div>
    `;

    // 點擊選擇欄位
    item.addEventListener('click', (e) => {
      if (!e.target.closest('[data-action]')) {
        this.selectField(field.id);
      }
    });

    // 刪除按鈕
    item.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`確定要刪除欄位「${field.label || field.name}」嗎？`)) {
        this.deleteField(field.id);
      }
    });

    // 拖拽事件
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', field.id);
      item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      this.updateFieldOrder();
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingItem = document.querySelector('.canvas-field-item.dragging');
      if (draggingItem && draggingItem !== item) {
        // 同列內才能拖拽排序
        const draggingRow = draggingItem.closest('.row-content');
        const targetRow = item.closest('.row-content');

        if (draggingRow === targetRow) {
          const rect = item.getBoundingClientRect();
          const midpoint = rect.left + rect.width / 2;
          if (e.clientX < midpoint) {
            item.parentNode.insertBefore(draggingItem, item);
          } else {
            item.parentNode.insertBefore(draggingItem, item.nextSibling);
          }
        }
      }
    });

    return item;
  }

  addFieldFromToolbox(toolboxItem) {
    const newField = {
      id: generateFieldId(),
      ...toolboxItem.defaultConfig,
      name: `field_${this.fields.length + 1}`,
      row: 0  // 預設加到第一列
    };

    this.fields.push(newField);
    this.refresh();
    this.selectField(newField.id);
  }

  updateFieldOrder() {
    // 根據 DOM 順序更新 fields 陣列
    const newFields = [];
    const rows = this.element.querySelectorAll('.field-row');

    rows.forEach((rowElement, rowIndex) => {
      const rowContent = rowElement.querySelector('.row-content');
      const fieldItems = rowContent.querySelectorAll('.canvas-field-item');

      fieldItems.forEach((item) => {
        const fieldId = item.dataset.fieldId;
        const field = this.fields.find(f => f.id === fieldId);
        if (field) {
          field.row = rowIndex;
          newFields.push(field);
        }
      });
    });

    this.fields = newFields;

    if (this.onFieldsReorder) {
      this.onFieldsReorder(this.fields);
    }
  }

  selectField(fieldId) {
    this.selectedFieldId = fieldId;
    this.refresh();

    if (this.onFieldSelect) {
      const field = this.fields.find(f => f.id === fieldId);
      this.onFieldSelect(field);
    }
  }

  deleteField(fieldId) {
    this.fields = this.fields.filter(f => f.id !== fieldId);
    if (this.selectedFieldId === fieldId) {
      this.selectedFieldId = null;
    }
    this.refresh();

    if (this.onFieldDelete) {
      this.onFieldDelete(fieldId);
    }
  }

  updateField(fieldId, updates) {
    const field = this.fields.find(f => f.id === fieldId);
    if (field) {
      Object.assign(field, updates);
      this.refresh();
    }
  }

  getFields() {
    return [...this.fields];
  }

  refresh() {
    const content = this.element?.querySelector('#field-canvas-content');
    if (content) {
      this.renderFields(content);
    }
  }

  getFieldTypeIcon(type) {
    const icons = {
      'text': '📝',
      'number': '🔢',
      'textarea': '📄',
      'select': '📋',
      'radio': '🔘',
      'checkbox': '☑️',
      'date': '📅',
      'time': '🕐',
      'email': '📧',
      'url': '🔗',
      'tel': '📞',
      'file': '📎'
    };
    return icons[type] || '📝';
  }

  getFieldTypeLabel(type) {
    const labels = {
      'text': '文字',
      'number': '數字',
      'textarea': '多行文字',
      'select': '下拉選單',
      'radio': '單選',
      'checkbox': '複選',
      'date': '日期',
      'time': '時間',
      'email': 'Email',
      'url': 'URL',
      'tel': '電話',
      'file': '檔案'
    };
    return labels[type] || type;
  }

  addStyles() {
    if (!document.getElementById('field-canvas-styles')) {
      const style = document.createElement('style');
      style.id = 'field-canvas-styles';
      style.textContent = `
        .field-canvas {
          flex: 1;
          background: var(--bg-color);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .canvas-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }

        .canvas-header h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .canvas-hint {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-tertiary);
        }

        .canvas-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-lg);
        }

        .canvas-content.drag-over {
          background: rgba(59, 130, 246, 0.05);
          border: 2px dashed var(--primary-color);
        }

        .empty-canvas {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--text-tertiary);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: var(--spacing-md);
        }

        .empty-hint {
          font-size: 0.875rem;
          margin-top: var(--spacing-sm);
        }

        .field-row {
          margin-bottom: var(--spacing-lg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
        }

        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-color);
          border-bottom: 1px solid var(--border-color);
        }

        .row-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .row-content {
          display: flex;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          min-height: 80px;
          flex-wrap: wrap;
        }

        .row-content.drag-over {
          background: rgba(59, 130, 246, 0.05);
          border: 2px dashed var(--primary-color);
        }

        .add-row-btn {
          width: 100%;
          padding: var(--spacing-md);
          background: transparent;
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-tertiary);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .add-row-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: rgba(59, 130, 246, 0.05);
        }

        .canvas-field-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--bg-color);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
          flex: 0 0 auto;
          min-width: 200px;
        }

        .canvas-field-item:hover {
          border-color: var(--border-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .canvas-field-item.selected {
          border-color: var(--primary-color);
          background: rgba(59, 130, 246, 0.05);
        }

        .canvas-field-item.dragging {
          opacity: 0.5;
        }

        .field-drag-handle {
          color: var(--text-tertiary);
          cursor: grab;
          user-select: none;
        }

        .field-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .field-icon {
          font-size: 1.5rem;
        }

        .field-details {
          flex: 1;
        }

        .field-name {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .field-meta {
          display: flex;
          gap: var(--spacing-xs);
          font-size: 0.75rem;
        }

        .field-type {
          color: var(--text-secondary);
        }

        .field-required {
          color: var(--error-color);
          font-weight: 600;
        }

        .field-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .btn-icon {
          background: transparent;
          border: none;
          padding: var(--spacing-xs);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background 0.2s;
        }

        .btn-icon:hover {
          background: var(--bg-color);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
