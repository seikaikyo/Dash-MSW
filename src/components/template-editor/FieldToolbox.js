import { FIELD_TOOLBOX_ITEMS } from '../../utils/fieldTypes.js';

/**
 * 欄位工具箱組件
 * 顯示可拖拽的欄位類型列表
 */
export class FieldToolbox {
  constructor(options = {}) {
    this.onFieldDragStart = options.onFieldDragStart || null;
    this.onFieldClick = options.onFieldClick || null;
    this.element = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'field-toolbox';

    const header = document.createElement('div');
    header.className = 'toolbox-header';
    header.innerHTML = `
      <h3>🛠️ 欄位工具箱</h3>
      <p class="toolbox-hint">拖拽欄位到右側畫布，或點擊快速新增</p>
    `;
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'toolbox-content';

    // 渲染每個分類
    FIELD_TOOLBOX_ITEMS.forEach(category => {
      const categorySection = document.createElement('div');
      categorySection.className = 'toolbox-category';

      const categoryTitle = document.createElement('div');
      categoryTitle.className = 'category-title';
      categoryTitle.textContent = category.category;
      categorySection.appendChild(categoryTitle);

      const itemsGrid = document.createElement('div');
      itemsGrid.className = 'toolbox-items';

      category.items.forEach(item => {
        const itemElement = this.createToolboxItem(item);
        itemsGrid.appendChild(itemElement);
      });

      categorySection.appendChild(itemsGrid);
      content.appendChild(categorySection);
    });

    container.appendChild(content);
    this.element = container;
    this.addStyles();
    return container;
  }

  createToolboxItem(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'toolbox-item';
    itemElement.draggable = true;
    itemElement.dataset.fieldType = item.type;

    itemElement.innerHTML = `
      <div class="item-icon">${item.icon}</div>
      <div class="item-label">${item.label}</div>
      <div class="item-description">${item.description}</div>
    `;

    let isDragging = false;

    // 拖拽事件
    itemElement.addEventListener('dragstart', (e) => {
      isDragging = true;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('application/json', JSON.stringify(item));
      itemElement.classList.add('dragging');

      if (this.onFieldDragStart) {
        this.onFieldDragStart(item);
      }
    });

    itemElement.addEventListener('dragend', () => {
      itemElement.classList.remove('dragging');
      // 延遲重置，避免與 click 事件衝突
      setTimeout(() => {
        isDragging = false;
      }, 100);
    });

    // 點擊事件（快速新增）
    itemElement.addEventListener('click', () => {
      // 如果正在拖拽，不觸發點擊事件
      if (isDragging) {
        return;
      }
      if (this.onFieldClick) {
        this.onFieldClick(item);
      }
    });

    return itemElement;
  }

  addStyles() {
    if (!document.getElementById('field-toolbox-styles')) {
      const style = document.createElement('style');
      style.id = 'field-toolbox-styles';
      style.textContent = `
        .field-toolbox {
          width: 280px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .toolbox-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
        }

        .toolbox-header h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .toolbox-hint {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-tertiary);
        }

        .toolbox-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-md);
        }

        .toolbox-category {
          margin-bottom: var(--spacing-lg);
        }

        .category-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          margin-bottom: var(--spacing-sm);
        }

        .toolbox-items {
          display: grid;
          gap: var(--spacing-sm);
        }

        .toolbox-item {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm);
          cursor: grab;
          transition: all 0.2s;
        }

        .toolbox-item:hover {
          border-color: var(--primary-color);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
          transform: translateY(-1px);
        }

        .toolbox-item.dragging {
          opacity: 0.5;
          cursor: grabbing;
        }

        .item-icon {
          font-size: 1.5rem;
          margin-bottom: var(--spacing-xs);
        }

        .item-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .item-description {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.3;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
