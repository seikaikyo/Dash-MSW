// 流程節點元件庫
export class NodePalette {
  constructor() {
    this.element = null;
    this.nodes = [
      { id: 'start', name: '開始', icon: '▶️', type: 'start', description: '流程起點' },
      { id: 'end', name: '結束', icon: '⏹️', type: 'end', description: '流程終點' },
      { id: 'single', name: '單一簽核', icon: '👤', type: 'single', description: '單人簽核' },
      { id: 'parallel', name: '並簽', icon: '👥', type: 'parallel', description: '多人同時簽核，全部通過才算通過' },
      { id: 'sequential', name: '串簽', icon: '📋', type: 'sequential', description: '依序簽核，按順序進行' },
      { id: 'condition', name: '條件分支', icon: '◆', type: 'condition', description: '根據條件決定流程走向' }
    ];
  }

  render() {
    const palette = document.createElement('div');
    palette.className = 'node-palette';

    const header = document.createElement('div');
    header.className = 'palette-header';
    header.innerHTML = '<h3>流程節點</h3><p>拖拽至畫布建立流程</p>';
    palette.appendChild(header);

    const list = document.createElement('div');
    list.className = 'node-palette-list';

    this.nodes.forEach(node => {
      const item = document.createElement('div');
      item.className = 'node-palette-item';
      item.dataset.nodeType = node.type;
      item.draggable = true;
      item.title = node.description;

      item.innerHTML = `
        <div class="node-item-icon">${node.icon}</div>
        <div class="node-item-info">
          <div class="node-item-name">${node.name}</div>
          <div class="node-item-desc">${node.description}</div>
        </div>
      `;

      // 拖拽事件
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('nodeType', node.type);
        e.dataTransfer.setData('nodeData', JSON.stringify(node));
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });

      // 點擊事件
      item.addEventListener('click', () => {
        const event = new CustomEvent('nodeClick', {
          detail: { node }
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
    if (!document.getElementById('node-palette-styles')) {
      const style = document.createElement('style');
      style.id = 'node-palette-styles';
      style.textContent = `
        .node-palette {
          background: var(--bg-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .node-palette-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          overflow-y: auto;
        }

        .node-palette-item {
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          cursor: grab;
          transition: all 0.2s;
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
        }

        .node-palette-item:hover {
          border-color: var(--primary-color);
          background: var(--primary-light);
          transform: translateX(4px);
        }

        .node-palette-item:active {
          cursor: grabbing;
        }

        .node-palette-item.dragging {
          opacity: 0.5;
        }

        .node-item-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .node-item-info {
          flex: 1;
        }

        .node-item-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .node-item-desc {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
