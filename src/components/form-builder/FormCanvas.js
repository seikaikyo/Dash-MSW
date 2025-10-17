import { generateId } from '../../utils/dataModel.js';

// 表單編輯畫布 - 支援 12 格網格系統
export class FormCanvas {
  constructor() {
    this.element = null;
    this.rows = []; // 改為列的陣列，每列包含多個欄位
    this.selectedFieldId = null;
    this.selectedRowId = null;
    this.onFieldSelect = null;
    this.onFieldsChange = null;
  }

  render() {
    const canvas = document.createElement('div');
    canvas.className = 'form-canvas';

    const header = document.createElement('div');
    header.className = 'canvas-header';
    header.innerHTML = `
      <h3>表單預覽</h3>
      <div class="canvas-tools">
        <p>拖拽欄位至此區域</p>
        <button class="btn-add-row" id="btn-add-row" title="新增一列">+ 新增列</button>
      </div>
    `;
    canvas.appendChild(header);

    const dropZone = document.createElement('div');
    dropZone.className = 'canvas-drop-zone';
    dropZone.id = 'canvas-drop-zone';

    // 初始提示
    if (this.rows.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'canvas-empty';
      emptyState.innerHTML = `
        <div class="empty-icon">📝</div>
        <p>點擊「新增列」開始建立表單，或直接拖拽欄位至此</p>
      `;
      dropZone.appendChild(emptyState);
    }

    canvas.appendChild(dropZone);
    this.element = canvas;
    this.addStyles();
    this.attachEvents();
    return canvas;
  }

  attachEvents() {
    const addRowBtn = this.element.querySelector('#btn-add-row');
    addRowBtn?.addEventListener('click', () => {
      this.addRow();
    });
  }

  addRow() {
    const row = {
      id: generateId(),
      fields: []
    };
    this.rows.push(row);
    this.renderRows();
    this.notifyChange();
  }

  addFieldToRow(fieldData, rowId, colSpan) {
    // 單純加入欄位到指定列（不自動調整）
    const field = {
      id: generateId(),
      type: fieldData.type,
      label: fieldData.name,
      required: false,
      placeholder: '',
      colSpan: colSpan,
      options: fieldData.type === 'select' || fieldData.type === 'radio' || fieldData.type === 'checkbox'
        ? [{ label: '選項 1', value: 'option1' }]
        : undefined
    };

    const row = this.rows.find(r => r.id === rowId);
    if (row) {
      row.fields.push(field);
    }
  }

  addField(fieldData, rowId = null, colSpan = null) {
    // 如果沒有指定寬度，預設全寬
    if (colSpan === null) {
      colSpan = 12;
    }

    const field = {
      id: generateId(),
      type: fieldData.type,
      label: fieldData.name,
      required: false,
      placeholder: '',
      colSpan: colSpan,
      options: fieldData.type === 'select' || fieldData.type === 'radio' || fieldData.type === 'checkbox'
        ? [{ label: '選項 1', value: 'option1' }]
        : undefined
    };

    // 如果有指定列
    if (rowId) {
      const row = this.rows.find(r => r.id === rowId);
      if (row) {
        const usedCols = row.fields.reduce((sum, f) => sum + f.colSpan, 0);
        const availableSpace = 12 - usedCols;

        if (availableSpace > 0) {
          // 有空間，使用智慧分配（這會在 drop 事件中處理）
          field.colSpan = Math.min(colSpan, availableSpace);
          row.fields.push(field);
        } else {
          // 沒有空間，建立新列
          const newRow = {
            id: generateId(),
            fields: [field]
          };
          const rowIndex = this.rows.findIndex(r => r.id === rowId);
          this.rows.splice(rowIndex + 1, 0, newRow);
        }
      }
    } else {
      // 沒有指定列，加到最後一列或建立新列
      if (this.rows.length === 0) {
        this.addRow();
      }
      const lastRow = this.rows[this.rows.length - 1];
      const usedCols = lastRow.fields.reduce((sum, f) => sum + f.colSpan, 0);

      if (usedCols === 0) {
        // 空列，直接加入
        lastRow.fields.push(field);
      } else {
        // 建立新列
        const newRow = {
          id: generateId(),
          fields: [field]
        };
        this.rows.push(newRow);
      }
    }

    this.renderRows();
    this.notifyChange();
  }

  renderRows() {
    const dropZone = this.element.querySelector('.canvas-drop-zone');
    dropZone.innerHTML = '';

    if (this.rows.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'canvas-empty';
      emptyState.innerHTML = `
        <div class="empty-icon">📝</div>
        <p>點擊「新增列」開始建立表單，或直接拖拽欄位至此</p>
      `;
      dropZone.appendChild(emptyState);
      return;
    }

    this.rows.forEach((row, rowIndex) => {
      const rowEl = this.createRowElement(row, rowIndex);
      dropZone.appendChild(rowEl);
    });
  }

  createRowElement(row, rowIndex) {
    const rowWrapper = document.createElement('div');
    rowWrapper.className = `form-row ${this.selectedRowId === row.id ? 'selected' : ''}`;
    rowWrapper.dataset.rowId = row.id;

    // 列工具列
    const rowToolbar = document.createElement('div');
    rowToolbar.className = 'row-toolbar';
    rowToolbar.innerHTML = `
      <span class="row-label">列 ${rowIndex + 1}</span>
      <div class="row-actions">
        <button class="toolbar-btn" data-action="up" title="上移">↑</button>
        <button class="toolbar-btn" data-action="down" title="下移">↓</button>
        <button class="toolbar-btn" data-action="delete" title="刪除列">🗑️</button>
      </div>
    `;

    rowToolbar.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'up' && rowIndex > 0) {
        [this.rows[rowIndex], this.rows[rowIndex - 1]] = [this.rows[rowIndex - 1], this.rows[rowIndex]];
        this.renderRows();
        this.notifyChange();
      } else if (action === 'down' && rowIndex < this.rows.length - 1) {
        [this.rows[rowIndex], this.rows[rowIndex + 1]] = [this.rows[rowIndex + 1], this.rows[rowIndex]];
        this.renderRows();
        this.notifyChange();
      } else if (action === 'delete') {
        if (confirm('確定要刪除此列嗎？')) {
          this.rows.splice(rowIndex, 1);
          this.renderRows();
          this.notifyChange();
        }
      }
    });

    rowWrapper.appendChild(rowToolbar);

    // 列內容 - 12 格網格
    const rowContent = document.createElement('div');
    rowContent.className = 'row-content';

    // 拖拽放置區
    rowContent.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      rowContent.classList.add('drag-over');
    });

    rowContent.addEventListener('dragleave', (e) => {
      e.stopPropagation();
      // 只在真正離開列內容時移除樣式
      const rect = rowContent.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX >= rect.right ||
        e.clientY < rect.top ||
        e.clientY >= rect.bottom
      ) {
        rowContent.classList.remove('drag-over');
      }
    });

    rowContent.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      rowContent.classList.remove('drag-over');

      // 檢查是否為欄位排序，如果是就不處理（由欄位元素處理）
      const isReordering = e.dataTransfer.getData('isReordering');
      if (isReordering) return;

      const fieldData = e.dataTransfer.getData('fieldData');
      if (!fieldData) return;

      const parsedData = JSON.parse(fieldData);

      // 智慧型自動分配寬度
      const currentFieldCount = row.fields.length;

      if (currentFieldCount === 0) {
        // 空列，直接加入 12 格
        this.addFieldToRow(parsedData, row.id, 12);
      } else {
        // 有現有欄位，平均分配
        const newFieldCount = currentFieldCount + 1;
        const avgColSpan = Math.floor(12 / newFieldCount);
        const remainder = 12 % newFieldCount;

        // 調整現有欄位寬度
        row.fields.forEach((field, index) => {
          field.colSpan = avgColSpan + (index < remainder ? 1 : 0);
        });

        // 新欄位使用平均寬度
        const newColSpan = avgColSpan + (currentFieldCount < remainder ? 1 : 0);
        this.addFieldToRow(parsedData, row.id, newColSpan);
      }

      this.renderRows();
      this.notifyChange();
    });

    if (row.fields.length === 0) {
      const emptyRow = document.createElement('div');
      emptyRow.className = 'empty-row';
      emptyRow.textContent = '拖拽欄位至此列';
      rowContent.appendChild(emptyRow);
    } else {
      row.fields.forEach((field, fieldIndex) => {
        const fieldEl = this.createFieldElement(field, row.id, fieldIndex);
        rowContent.appendChild(fieldEl);
      });
    }

    rowWrapper.appendChild(rowContent);
    return rowWrapper;
  }

  createFieldElement(field, rowId, fieldIndex) {
    const wrapper = document.createElement('div');
    wrapper.className = `canvas-field col-${field.colSpan} ${this.selectedFieldId === field.id ? 'selected' : ''}`;
    wrapper.dataset.fieldId = field.id;
    wrapper.dataset.rowId = rowId;
    wrapper.draggable = true;

    const fieldPreview = document.createElement('div');
    fieldPreview.className = 'field-preview';

    // 欄位標籤
    const label = document.createElement('div');
    label.className = 'field-label';
    label.textContent = field.label;
    if (field.required) {
      const required = document.createElement('span');
      required.className = 'field-required';
      required.textContent = '*';
      label.appendChild(required);
    }
    fieldPreview.appendChild(label);

    // 根據欄位類型渲染預覽
    const input = this.createFieldInput(field);
    fieldPreview.appendChild(input);

    wrapper.appendChild(fieldPreview);

    // 工具列
    const toolbar = document.createElement('div');
    toolbar.className = 'field-toolbar';
    toolbar.innerHTML = `
      <button class="toolbar-btn" data-action="delete" title="刪除">×</button>
    `;

    toolbar.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'delete') {
        const row = this.rows.find(r => r.id === rowId);
        if (row) {
          row.fields.splice(fieldIndex, 1);
          this.renderRows();
          this.notifyChange();
        }
      }
    });

    wrapper.appendChild(toolbar);

    // 點擊選中
    wrapper.addEventListener('click', (e) => {
      if (!e.target.classList.contains('toolbar-btn')) {
        this.selectField(field.id, rowId);
      }
    });

    // 拖拽事件 - 用於欄位排序
    wrapper.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      wrapper.classList.add('dragging-field');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('fieldId', field.id);
      e.dataTransfer.setData('sourceRowId', rowId);
      e.dataTransfer.setData('isReordering', 'true');
    });

    wrapper.addEventListener('dragend', (e) => {
      wrapper.classList.remove('dragging-field');
    });

    wrapper.addEventListener('dragover', (e) => {
      // 檢查是否從元件庫拖曳新欄位
      const hasFieldData = e.dataTransfer.types.includes('fielddata');
      if (hasFieldData) {
        // 是新欄位，不攔截，讓事件冒泡到 rowContent
        return;
      }

      const isReordering = e.dataTransfer.types.includes('isreordering');
      if (!isReordering) return;

      e.preventDefault();
      e.stopPropagation();

      const draggingElement = document.querySelector('.dragging-field');
      if (!draggingElement || draggingElement === wrapper) return;

      // 確保在同一列中
      const sourceRowId = draggingElement.dataset.rowId;
      if (sourceRowId !== rowId) return;

      wrapper.classList.add('drag-over-field');
    });

    wrapper.addEventListener('dragleave', (e) => {
      wrapper.classList.remove('drag-over-field');
    });

    wrapper.addEventListener('drop', (e) => {
      // 檢查是否從元件庫拖曳新欄位
      const fieldData = e.dataTransfer.getData('fieldData');
      if (fieldData) {
        // 是新欄位，不攔截，讓事件冒泡到 rowContent
        return;
      }

      const isReordering = e.dataTransfer.getData('isReordering');
      if (!isReordering) return;

      e.preventDefault();
      e.stopPropagation();
      wrapper.classList.remove('drag-over-field');

      const draggedFieldId = e.dataTransfer.getData('fieldId');
      const sourceRowId = e.dataTransfer.getData('sourceRowId');

      // 只允許同一列內排序
      if (sourceRowId !== rowId) return;

      const row = this.rows.find(r => r.id === rowId);
      if (!row) return;

      const draggedFieldIndex = row.fields.findIndex(f => f.id === draggedFieldId);
      const targetFieldIndex = row.fields.findIndex(f => f.id === field.id);

      if (draggedFieldIndex === -1 || targetFieldIndex === -1 || draggedFieldIndex === targetFieldIndex) return;

      // 重新排序
      const [draggedField] = row.fields.splice(draggedFieldIndex, 1);
      row.fields.splice(targetFieldIndex, 0, draggedField);

      this.renderRows();
      this.notifyChange();
    });

    return wrapper;
  }

  createFieldInput(field) {
    const input = document.createElement('div');
    input.className = 'field-input-preview';

    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
        input.innerHTML = `<input type="${field.type}" placeholder="${field.placeholder || ''}" disabled>`;
        break;
      case 'textarea':
        input.innerHTML = `<textarea placeholder="${field.placeholder || ''}" disabled></textarea>`;
        break;
      case 'select':
        const options = field.options?.map(opt => `<option>${opt.label}</option>`).join('') || '';
        input.innerHTML = `<select disabled>${options}</select>`;
        break;
      case 'checkbox':
        input.innerHTML = field.options?.map(opt =>
          `<label><input type="checkbox" disabled> ${opt.label}</label>`
        ).join('') || '';
        break;
      case 'radio':
        input.innerHTML = field.options?.map(opt =>
          `<label><input type="radio" name="${field.id}" disabled> ${opt.label}</label>`
        ).join('') || '';
        break;
      case 'file':
        input.innerHTML = `<input type="file" disabled>`;
        break;
      case 'divider':
        input.innerHTML = `<hr>`;
        break;
      case 'label':
        input.innerHTML = `<p class="label-text">${field.placeholder || '標籤文字'}</p>`;
        break;
    }

    return input;
  }

  selectField(fieldId, rowId) {
    this.selectedFieldId = fieldId;
    this.selectedRowId = rowId;
    this.renderRows();

    if (this.onFieldSelect) {
      const row = this.rows.find(r => r.id === rowId);
      const field = row?.fields.find(f => f.id === fieldId);
      if (field) {
        this.onFieldSelect(field, rowId);
      }
    }
  }

  updateField(fieldId, updates) {
    for (const row of this.rows) {
      const field = row.fields.find(f => f.id === fieldId);
      if (field) {
        Object.assign(field, updates);
        this.renderRows();
        this.notifyChange();
        break;
      }
    }
  }

  getFields() {
    // 轉換為扁平陣列格式（保持與原有資料結構相容）
    return this.rows.flatMap(row => row.fields);
  }

  getFieldsWithLayout() {
    // 返回包含佈局資訊的完整結構
    return this.rows;
  }

  setFields(fields) {
    // 兼容舊格式（扁平陣列）
    if (Array.isArray(fields) && fields.length > 0) {
      if (fields[0].fields) {
        // 新格式（包含列資訊）
        this.rows = fields;
      } else {
        // 舊格式（扁平陣列），每個欄位佔一列
        this.rows = fields.map(field => ({
          id: generateId(),
          fields: [{ ...field, colSpan: field.colSpan || 12 }]
        }));
      }
    }
    this.renderRows();
  }

  notifyChange() {
    if (this.onFieldsChange) {
      this.onFieldsChange(this.getFieldsWithLayout());
    }
  }

  addStyles() {
    if (!document.getElementById('form-canvas-styles')) {
      const style = document.createElement('style');
      style.id = 'form-canvas-styles';
      style.textContent = `
        .form-canvas {
          background: var(--bg-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .canvas-header {
          margin-bottom: var(--spacing-lg);
        }

        .canvas-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-xs) 0;
        }

        .canvas-tools {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .canvas-tools p {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          margin: 0;
        }

        .btn-add-row {
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-row:hover {
          background: var(--primary-hover);
        }

        .canvas-drop-zone {
          flex: 1;
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          overflow-y: auto;
          min-height: 400px;
        }

        .canvas-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-tertiary);
        }

        .canvas-empty .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-lg);
        }

        .form-row {
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-md);
          padding: var(--spacing-md);
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
        }

        .form-row:hover,
        .form-row.selected {
          border-color: var(--primary-color);
        }

        .row-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
          padding-bottom: var(--spacing-sm);
          border-bottom: 1px solid var(--border-color);
        }

        .row-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
        }

        .row-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .row-content {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: var(--spacing-md);
          min-height: 60px;
          position: relative;
        }

        .row-content.drag-over {
          background: var(--primary-light);
          border-radius: var(--radius-sm);
        }

        .empty-row {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          font-size: 0.875rem;
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-sm);
          padding: var(--spacing-lg);
        }

        .canvas-field {
          background: var(--bg-color);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          position: relative;
          transition: all 0.2s;
          cursor: grab;
        }

        .canvas-field:hover {
          border-color: var(--primary-color);
        }

        .canvas-field.selected {
          border-color: var(--primary-color);
          background: var(--primary-light);
        }

        .canvas-field.dragging-field {
          opacity: 0.4;
          cursor: grabbing;
        }

        .canvas-field.drag-over-field {
          border-color: var(--primary-color);
          background: var(--primary-light);
          border-style: dashed;
        }

        /* 格數類別 */
        .col-1 { grid-column: span 1; }
        .col-2 { grid-column: span 2; }
        .col-3 { grid-column: span 3; }
        .col-4 { grid-column: span 4; }
        .col-5 { grid-column: span 5; }
        .col-6 { grid-column: span 6; }
        .col-7 { grid-column: span 7; }
        .col-8 { grid-column: span 8; }
        .col-9 { grid-column: span 9; }
        .col-10 { grid-column: span 10; }
        .col-11 { grid-column: span 11; }
        .col-12 { grid-column: span 12; }

        .field-preview {
          pointer-events: none;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: var(--spacing-sm);
        }

        .field-required {
          color: var(--error-color);
          margin-left: var(--spacing-xs);
        }

        .field-input-preview input,
        .field-input-preview textarea,
        .field-input-preview select {
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: var(--font-family);
          background: var(--bg-color);
          font-size: 0.875rem;
        }

        .field-input-preview textarea {
          min-height: 60px;
          resize: vertical;
        }

        .field-input-preview label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-size: 0.875rem;
        }

        .field-input-preview hr {
          border: none;
          border-top: 2px solid var(--border-color);
          margin: var(--spacing-sm) 0;
        }

        .label-text {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.875rem;
        }

        .field-toolbar {
          position: absolute;
          top: var(--spacing-xs);
          right: var(--spacing-xs);
          display: flex;
          gap: var(--spacing-xs);
        }

        .toolbar-btn {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          width: 24px;
          height: 24px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toolbar-btn:hover {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
