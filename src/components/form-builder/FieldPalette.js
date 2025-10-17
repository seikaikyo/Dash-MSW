// 欄位元件庫 - 可拖拽的表單欄位
export class FieldPalette {
  constructor() {
    this.element = null;
    this.fields = [
      { id: 'text', name: '文字輸入', icon: '📝', type: 'text' },
      { id: 'textarea', name: '多行文字', icon: '📄', type: 'textarea' },
      { id: 'number', name: '數字', icon: '🔢', type: 'number' },
      { id: 'date', name: '日期', icon: '📅', type: 'date' },
      { id: 'select', name: '下拉選單', icon: '📋', type: 'select' },
      { id: 'checkbox', name: '核取方塊', icon: '☑️', type: 'checkbox' },
      { id: 'radio', name: '單選按鈕', icon: '🔘', type: 'radio' },
      { id: 'file', name: '檔案上傳', icon: '📎', type: 'file' },
      { id: 'divider', name: '分隔線', icon: '➖', type: 'divider' },
      { id: 'label', name: '文字標籤', icon: '🏷️', type: 'label' }
    ];
  }

  render() {
    const palette = document.createElement('div');
    palette.className = 'field-palette';

    const header = document.createElement('div');
    header.className = 'palette-header';
    header.innerHTML = '<h3>欄位元件</h3><p>拖拽或點擊加入表單</p>';
    palette.appendChild(header);

    const list = document.createElement('div');
    list.className = 'palette-list';

    this.fields.forEach(field => {
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.dataset.fieldType = field.type;
      item.draggable = true;
      item.innerHTML = `
        <div class="palette-item-icon">${field.icon}</div>
        <div class="palette-item-name">${field.name}</div>
      `;
      item.title = field.name; // 加入提示

      // 拖拽事件
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('fieldType', field.type);
        e.dataTransfer.setData('fieldData', JSON.stringify(field));
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });

      // 點擊事件
      item.addEventListener('click', () => {
        const event = new CustomEvent('fieldClick', {
          detail: { field }
        });
        palette.dispatchEvent(event);
      });

      list.appendChild(item);
    });

    palette.appendChild(list);
    this.element = palette;
    this.addStyles();
    return palette;
  }

  addStyles() {
    if (!document.getElementById('field-palette-styles')) {
      const style = document.createElement('style');
      style.id = 'field-palette-styles';
      style.textContent = `
        .field-palette {
          background: var(--bg-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .palette-header {
          margin-bottom: var(--spacing-lg);
        }

        .palette-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-xs) 0;
        }

        .palette-header p {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          margin: 0;
        }

        .palette-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          overflow-y: auto;
        }

        .palette-item {
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm) var(--spacing-md);
          cursor: grab;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .palette-item:hover {
          border-color: var(--primary-color);
          background: var(--primary-light);
          transform: translateY(-2px);
        }

        .palette-item:active {
          cursor: grabbing;
        }

        .palette-item.dragging {
          opacity: 0.5;
        }

        .palette-item-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .palette-item-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-primary);
          text-align: left;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
