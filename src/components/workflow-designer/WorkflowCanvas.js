import { generateId } from '../../utils/dataModel.js';

// 流程設計畫布
export class WorkflowCanvas {
  constructor() {
    this.element = null;
    this.nodes = [];
    this.connections = [];
    this.selectedNodeId = null;
    this.connectingFrom = null; // 正在連線的起點節點
    this.onNodeSelect = null;
    this.onNodesChange = null;
  }

  render() {
    const canvas = document.createElement('div');
    canvas.className = 'workflow-canvas';

    const header = document.createElement('div');
    header.className = 'workflow-canvas-header';
    header.innerHTML = `
      <h3>流程設計</h3>
      <div class="canvas-tools">
        <button class="tool-btn" id="btn-clear-connections" title="清除所有連線">清除連線</button>
        <button class="tool-btn" id="btn-auto-layout" title="自動排列">自動排列</button>
      </div>
    `;
    canvas.appendChild(header);

    const workspace = document.createElement('div');
    workspace.className = 'workflow-workspace';
    workspace.id = 'workflow-workspace';

    // 畫布容器（用於放置節點）
    const dropZone = document.createElement('div');
    dropZone.className = 'workflow-drop-zone';
    dropZone.id = 'workflow-drop-zone';

    // SVG 層（用於繪製連線）
    const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.setAttribute('class', 'workflow-svg-layer');
    svgLayer.setAttribute('id', 'workflow-svg-layer');
    dropZone.appendChild(svgLayer);

    // 節點層
    const nodeLayer = document.createElement('div');
    nodeLayer.className = 'workflow-node-layer';
    nodeLayer.id = 'workflow-node-layer';
    dropZone.appendChild(nodeLayer);

    // 拖拽事件
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
      if (e.target === dropZone) {
        dropZone.classList.remove('drag-over');
      }
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');

      const nodeData = JSON.parse(e.dataTransfer.getData('nodeData'));
      const rect = dropZone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.addNode(nodeData, x, y);
    });

    // 點擊空白處取消連線狀態
    dropZone.addEventListener('click', (e) => {
      if (e.target === dropZone || e.target === svgLayer || e.target === nodeLayer) {
        this.cancelConnection();
      }
    });

    // 初始提示
    if (this.nodes.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'workflow-empty';
      emptyState.innerHTML = `
        <div class="empty-icon">🔄</div>
        <p>將節點拖拽至此處開始設計流程</p>
      `;
      nodeLayer.appendChild(emptyState);
    }

    workspace.appendChild(dropZone);
    canvas.appendChild(workspace);

    this.element = canvas;
    this.addStyles();
    this.attachToolbarEvents();
    return canvas;
  }

  attachToolbarEvents() {
    const clearBtn = this.element.querySelector('#btn-clear-connections');
    const layoutBtn = this.element.querySelector('#btn-auto-layout');

    clearBtn?.addEventListener('click', () => {
      if (confirm('確定要清除所有連線嗎？')) {
        this.connections = [];
        this.renderConnections();
        this.notifyChange();
      }
    });

    layoutBtn?.addEventListener('click', () => {
      this.autoLayout();
    });
  }

  addNode(nodeData, x, y) {
    const node = {
      id: generateId(),
      type: nodeData.type,
      name: nodeData.name,
      icon: nodeData.icon,
      x: x - 75, // 居中
      y: y - 40,
      config: {
        approvers: [],
        condition: null
      }
    };

    this.nodes.push(node);
    this.renderNodes();
    this.notifyChange();
  }

  renderNodes() {
    const nodeLayer = this.element.querySelector('#workflow-node-layer');
    nodeLayer.innerHTML = '';

    if (this.nodes.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'workflow-empty';
      emptyState.innerHTML = `
        <div class="empty-icon">🔄</div>
        <p>將節點拖拽至此處開始設計流程</p>
      `;
      nodeLayer.appendChild(emptyState);
      return;
    }

    this.nodes.forEach(node => {
      const nodeEl = this.createNodeElement(node);
      nodeLayer.appendChild(nodeEl);
    });

    this.renderConnections();
  }

  createNodeElement(node) {
    const nodeEl = document.createElement('div');
    nodeEl.className = `workflow-node ${this.selectedNodeId === node.id ? 'selected' : ''} node-${node.type}`;
    nodeEl.dataset.nodeId = node.id;
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;

    // 根據節點類型決定連接點配置
    let connectPointsHTML = '';
    if (node.type === 'condition') {
      // 條件分支節點：菱形，四個方向都有連接點（上輸入，右下左為輸出）
      connectPointsHTML = `
        <div class="connect-point connect-in" data-point="in" style="position: absolute; left: 50%; top: -7px; transform: translateX(-50%);"></div>
        <div class="connect-point connect-out" data-point="out-right" style="position: absolute; right: -7px; top: 50%; transform: translateY(-50%);"></div>
        <div class="connect-point connect-out" data-point="out-bottom" style="position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);"></div>
        <div class="connect-point connect-out" data-point="out-left" style="position: absolute; left: -7px; top: 50%; transform: translateY(-50%);"></div>
      `;
    } else if (node.type === 'start') {
      // 開始節點：只有輸出點
      connectPointsHTML = `
        <div class="connect-point connect-out" data-point="out" style="position: absolute; right: -7px; top: 50%; transform: translateY(-50%);"></div>
      `;
    } else if (node.type === 'end') {
      // 結束節點：只有輸入點
      connectPointsHTML = `
        <div class="connect-point connect-in" data-point="in" style="position: absolute; left: -7px; top: 50%; transform: translateY(-50%);"></div>
      `;
    } else {
      // 其他節點：1個輸入 + 1個輸出
      connectPointsHTML = `
        <div class="connect-point connect-in" data-point="in" style="position: absolute; left: -7px; top: 50%; transform: translateY(-50%);"></div>
        <div class="connect-point connect-out" data-point="out" style="position: absolute; right: -7px; top: 50%; transform: translateY(-50%);"></div>
      `;
    }

    // 條件分支節點需要特殊的 HTML 結構（因為旋轉）
    if (node.type === 'condition') {
      nodeEl.innerHTML = `
        <div class="node-content">
          <div class="node-icon">${node.icon}</div>
          <div class="node-name">${node.name}</div>
        </div>
        ${connectPointsHTML}
        <div class="node-toolbar">
          <button class="node-btn" data-action="delete">×</button>
        </div>
      `;
    } else {
      nodeEl.innerHTML = `
        <div class="node-icon">${node.icon}</div>
        <div class="node-name">${node.name}</div>
        ${connectPointsHTML}
        <div class="node-toolbar">
          <button class="node-btn" data-action="delete">×</button>
        </div>
      `;
    }

    // 節點拖動
    this.makeNodeDraggable(nodeEl, node);

    // 點擊選中
    nodeEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('node-btn') && !e.target.classList.contains('connect-point')) {
        this.selectNode(node.id);
      }
    });

    // 刪除按鈕
    const deleteBtn = nodeEl.querySelector('[data-action="delete"]');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteNode(node.id);
    });

    // 連線點事件 - 所有輸出點
    const outPoints = nodeEl.querySelectorAll('.connect-out');
    outPoints.forEach(outPoint => {
      outPoint.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startConnection(node.id, outPoint.dataset.point);
      });
    });

    // 連線點事件 - 輸入點
    const inPoint = nodeEl.querySelector('.connect-in');
    if (inPoint) {
      inPoint.addEventListener('click', (e) => {
        e.stopPropagation();
        this.endConnection(node.id);
      });
    }

    return nodeEl;
  }

  makeNodeDraggable(nodeEl, node) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    const onMouseDown = (e) => {
      if (e.target.classList.contains('node-btn') || e.target.classList.contains('connect-point')) {
        return;
      }
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = node.x;
      initialY = node.y;
      nodeEl.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      node.x = initialX + dx;
      node.y = initialY + dy;
      nodeEl.style.left = `${node.x}px`;
      nodeEl.style.top = `${node.y}px`;
      this.renderConnections();
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        nodeEl.style.cursor = 'grab';
        this.notifyChange();
      }
    };

    nodeEl.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  startConnection(nodeId, fromPoint = 'out') {
    this.connectingFrom = { nodeId, point: fromPoint };
    const nodeEl = this.element.querySelector(`[data-node-id="${nodeId}"]`);

    // 只高亮被點擊的連接點
    const connectPoint = nodeEl?.querySelector(`[data-point="${fromPoint}"]`);
    connectPoint?.classList.add('connecting-active');
  }

  endConnection(nodeId, toPoint = 'in') {
    if (this.connectingFrom && this.connectingFrom.nodeId !== nodeId) {
      // 檢查是否已存在相同的連線
      const exists = this.connections.some(
        conn => conn.from === this.connectingFrom.nodeId &&
                conn.to === nodeId &&
                conn.fromPoint === this.connectingFrom.point &&
                conn.toPoint === toPoint
      );

      if (!exists) {
        this.connections.push({
          id: generateId(),
          from: this.connectingFrom.nodeId,
          fromPoint: this.connectingFrom.point,
          to: nodeId,
          toPoint: toPoint,
          condition: null
        });
        this.renderConnections();
        this.notifyChange();
      }
    }

    // 清除連線狀態
    this.cancelConnection();
  }

  cancelConnection() {
    // 清除所有連線狀態
    const connectingPoints = this.element?.querySelectorAll('.connecting-active');
    connectingPoints?.forEach(point => point.classList.remove('connecting-active'));
    this.connectingFrom = null;
  }

  renderConnections() {
    const svgLayer = this.element.querySelector('#workflow-svg-layer');
    if (!svgLayer) return;

    // 設定 SVG 尺寸為足夠大以覆蓋整個畫布
    // 使用固定的大尺寸，避免動態計算問題
    svgLayer.setAttribute('width', '5000');
    svgLayer.setAttribute('height', '3000');

    svgLayer.innerHTML = '';

    this.connections.forEach(conn => {
      const fromNode = this.nodes.find(n => n.id === conn.from);
      const toNode = this.nodes.find(n => n.id === conn.to);

      if (fromNode && toNode) {
        this.drawConnection(svgLayer, fromNode, toNode, conn);
      }
    });
  }

  drawConnection(svgLayer, fromNode, toNode, conn) {
    // 節點尺寸：寬 150px，高 80px
    const nodeWidth = 150;
    const nodeHeight = 80;

    // 連接點尺寸和位置
    const pointSize = 14; // 連接點直徑
    const pointOffset = 7; // 連接點從邊緣伸出的距離

    // 計算起點位置（根據 fromPoint）
    let fromX = fromNode.x + nodeWidth + pointOffset; // 預設右側中點
    let fromY = fromNode.y + nodeHeight / 2;

    if (conn.fromPoint) {
      const fromNodeEl = this.element.querySelector(`[data-node-id="${conn.from}"]`);
      const isCondition = fromNodeEl?.classList.contains('node-condition');

      if (isCondition) {
        // 菱形節點：120x120，中心點在 60,60
        const centerX = fromNode.x + 60;
        const centerY = fromNode.y + 60;

        if (conn.fromPoint === 'out-right') {
          // 右側連接點
          fromX = centerX + 60 + pointOffset;
          fromY = centerY;
        } else if (conn.fromPoint === 'out-bottom') {
          // 底部連接點
          fromX = centerX;
          fromY = centerY + 60 + pointOffset;
        } else if (conn.fromPoint === 'out-left') {
          // 左側連接點
          fromX = centerX - 60 - pointOffset;
          fromY = centerY;
        }
      }
    }

    // 計算終點位置（根據 toPoint）
    let toX = toNode.x - pointOffset; // 預設左側中點
    let toY = toNode.y + nodeHeight / 2;

    if (conn.toPoint && conn.toPoint !== 'in') {
      // 如果目標也是特殊連接點（未來擴展用）
      toY = toNode.y + nodeHeight / 2;
    }

    // 繪製貝塞爾曲線
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const controlPointOffset = Math.max(Math.abs(toX - fromX) / 2, 50);
    const d = `M ${fromX} ${fromY} C ${fromX + controlPointOffset} ${fromY}, ${toX - controlPointOffset} ${toY}, ${toX} ${toY}`;

    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#2563eb');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('class', 'workflow-connection');
    path.setAttribute('data-connection-id', conn.id);
    path.style.pointerEvents = 'stroke'; // 允許點擊連線

    // 連線點擊事件（用於刪除連線）
    path.style.cursor = 'pointer';
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('確定要刪除此連線嗎？')) {
        this.connections = this.connections.filter(c => c.id !== conn.id);
        this.renderConnections();
        this.notifyChange();
      }
    });

    // 箭頭（指向左側，即目標節點）
    const arrowhead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const arrowSize = 8;

    // 箭頭三角形，頂點在 toX, toY，指向左側
    const points = [
      [toX, toY],                           // 頂點
      [toX + arrowSize, toY - arrowSize / 2], // 右上
      [toX + arrowSize, toY + arrowSize / 2]  // 右下
    ].map(p => p.join(',')).join(' ');

    arrowhead.setAttribute('points', points);
    arrowhead.setAttribute('fill', '#2563eb');
    arrowhead.style.pointerEvents = 'none'; // 箭頭不攔截點擊

    svgLayer.appendChild(path);
    svgLayer.appendChild(arrowhead);
  }

  selectNode(nodeId) {
    this.selectedNodeId = nodeId;
    this.renderNodes();

    if (this.onNodeSelect) {
      const node = this.nodes.find(n => n.id === nodeId);
      this.onNodeSelect(node);
    }
  }

  deleteNode(nodeId) {
    if (confirm('確定要刪除此節點嗎？')) {
      this.nodes = this.nodes.filter(n => n.id !== nodeId);
      this.connections = this.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
      this.renderNodes();
      this.notifyChange();

      if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null;
        if (this.onNodeSelect) {
          this.onNodeSelect(null);
        }
      }
    }
  }

  autoLayout() {
    // 簡單的自動排列：從左到右排列節點
    let x = 50;
    let y = 100;
    const spacing = 200;

    this.nodes.forEach((node, index) => {
      node.x = x;
      node.y = y;
      x += spacing;

      if ((index + 1) % 3 === 0) {
        x = 50;
        y += 150;
      }
    });

    this.renderNodes();
    this.notifyChange();
  }

  getNodes() {
    return this.nodes;
  }

  getConnections() {
    return this.connections;
  }

  setWorkflow(nodes, connections) {
    this.nodes = nodes || [];

    // 去除重複的連線
    const uniqueConnections = [];
    (connections || []).forEach(conn => {
      const exists = uniqueConnections.some(
        c => c.from === conn.from &&
             c.to === conn.to &&
             c.fromPoint === conn.fromPoint &&
             c.toPoint === conn.toPoint
      );
      if (!exists) {
        uniqueConnections.push(conn);
      }
    });

    this.connections = uniqueConnections;
    this.renderNodes();
  }

  updateNode(nodeId, updates) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      Object.assign(node, updates);
      this.renderNodes();
      this.notifyChange();
    }
  }

  notifyChange() {
    if (this.onNodesChange) {
      this.onNodesChange(this.nodes, this.connections);
    }
  }

  addStyles() {
    if (!document.getElementById('workflow-canvas-styles')) {
      const style = document.createElement('style');
      style.id = 'workflow-canvas-styles';
      style.textContent = `
        .workflow-canvas {
          background: var(--bg-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .workflow-canvas-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
        }

        .workflow-canvas-header h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .canvas-tools {
          display: flex;
          gap: var(--spacing-sm);
        }

        .tool-btn {
          padding: var(--spacing-xs) var(--spacing-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tool-btn:hover {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .workflow-workspace {
          flex: 1;
          overflow: auto;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          position: relative;
        }

        .workflow-drop-zone {
          min-width: 100%;
          min-height: 100%;
          position: relative;
          background-image:
            linear-gradient(var(--border-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .workflow-drop-zone.drag-over {
          background-color: var(--primary-light);
        }

        .workflow-svg-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .workflow-node-layer {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 2;
        }

        .workflow-empty {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: var(--text-tertiary);
        }

        .workflow-empty .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-lg);
        }

        .workflow-node {
          position: absolute;
          width: 150px;
          background: white;
          border: 2px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-md);
          cursor: grab;
          transition: all 0.2s;
          text-align: center;
          box-shadow: var(--shadow-md);
        }

        .workflow-node:hover {
          border-color: var(--primary-color);
          box-shadow: var(--shadow-lg);
        }

        .workflow-node.selected {
          border-color: var(--primary-color);
          background: var(--primary-light);
        }

        /* 條件分支節點為菱形 */
        .workflow-node.node-condition {
          width: 120px;
          height: 120px;
          border-radius: 0;
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .workflow-node.node-condition .node-content {
          transform: rotate(-45deg);
          text-align: center;
        }

        .workflow-node.node-condition .node-toolbar {
          transform: rotate(-45deg);
        }

        .node-icon {
          font-size: 2rem;
          margin-bottom: var(--spacing-sm);
        }

        .node-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .connect-point {
          width: 14px;
          height: 14px;
          background: var(--primary-color);
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 10;
        }

        .connect-point:hover {
          background: var(--success-color);
          transform: scale(1.3) !important;
        }

        .connect-point.connecting-active {
          background: var(--warning-color);
          animation: pulse 1s infinite;
          box-shadow: 0 0 0 3px var(--warning-light);
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }

        .node-toolbar {
          position: absolute;
          top: -10px;
          right: -10px;
        }

        .node-btn {
          width: 24px;
          height: 24px;
          background: var(--error-color);
          color: white;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
          transition: all 0.2s;
        }

        .node-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .node-start { border-color: var(--success-color); }
        .node-end { border-color: var(--error-color); }
        .node-parallel { border-color: var(--info-color); }
        .node-sequential { border-color: var(--warning-color); }
        .node-condition { border-color: var(--secondary-color); }
      `;
      document.head.appendChild(style);
    }
  }
}
