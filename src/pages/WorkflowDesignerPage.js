import { NodePalette } from '../components/workflow-designer/NodePalette.js';
import { WorkflowCanvas } from '../components/workflow-designer/WorkflowCanvas.js';
import { NodePropertyPanel } from '../components/workflow-designer/NodePropertyPanel.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { Modal } from '../components/common/Modal.js';
import { WorkflowModel, FormModel } from '../utils/dataModel.js';
import { auditLogger } from '../utils/auditLogger.js';

export function WorkflowDesignerPage() {
  const container = document.createElement('div');
  container.className = 'workflow-designer-page';

  let currentWorkflow = null;
  let workflowNameInput = null;
  let formSelect = null;

  // 檢查是否編輯現有流程
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const workflowId = urlParams.get('id');

  if (workflowId) {
    currentWorkflow = WorkflowModel.getById(workflowId);
  }

  // 頁首
  const header = document.createElement('div');
  header.className = 'designer-header';

  const headerLeft = document.createElement('div');
  headerLeft.innerHTML = `
    <h2>${currentWorkflow ? '編輯流程' : '建立新流程'}</h2>
  `;

  const headerRight = document.createElement('div');
  headerRight.className = 'header-actions';

  const saveBtn = new Button({
    text: '儲存流程',
    variant: 'primary',
    onClick: () => saveWorkflow()
  });

  const cancelBtn = new Button({
    text: '取消',
    variant: 'outline',
    onClick: () => {
      if (confirm('確定要取消嗎？未儲存的變更將會遺失。')) {
        window.location.hash = '#/workflows';
      }
    }
  });

  headerRight.appendChild(cancelBtn.render());
  headerRight.appendChild(saveBtn.render());

  header.appendChild(headerLeft);
  header.appendChild(headerRight);
  container.appendChild(header);

  // 流程資訊
  const workflowInfo = document.createElement('div');
  workflowInfo.className = 'workflow-info';

  workflowNameInput = new Input({
    label: '流程名稱',
    placeholder: '請輸入流程名稱',
    value: currentWorkflow?.name || '',
    required: true
  });

  // 取得所有表單
  const forms = FormModel.getAll();
  const formOptions = forms.map(f => ({ value: f.id, label: f.name }));

  formSelect = new Select({
    label: '關聯表單',
    placeholder: '請選擇表單',
    options: formOptions,
    value: currentWorkflow?.formId || '',
    required: true
  });

  workflowInfo.appendChild(workflowNameInput.render());
  workflowInfo.appendChild(formSelect.render());
  container.appendChild(workflowInfo);

  // 建立三欄佈局
  const designerContent = document.createElement('div');
  designerContent.className = 'designer-content';

  // 左側：節點元件庫
  const leftPanel = document.createElement('div');
  leftPanel.className = 'designer-panel designer-left';
  const nodePalette = new NodePalette();
  leftPanel.appendChild(nodePalette.render());

  // 中間：流程畫布
  const centerPanel = document.createElement('div');
  centerPanel.className = 'designer-panel designer-center';
  const workflowCanvas = new WorkflowCanvas();
  centerPanel.appendChild(workflowCanvas.render());

  // 右側：屬性面板
  const rightPanel = document.createElement('div');
  rightPanel.className = 'designer-panel designer-right';
  const propertyPanel = new NodePropertyPanel();
  rightPanel.appendChild(propertyPanel.render());

  designerContent.appendChild(leftPanel);
  designerContent.appendChild(centerPanel);
  designerContent.appendChild(rightPanel);
  container.appendChild(designerContent);

  // 載入現有流程資料
  if (currentWorkflow) {
    workflowCanvas.setWorkflow(currentWorkflow.nodes, currentWorkflow.connections);
  }

  // 事件綁定
  nodePalette.element.addEventListener('nodeClick', (e) => {
    // 點擊節點加入到畫布中心
    const centerX = workflowCanvas.element.querySelector('.workflow-drop-zone').clientWidth / 2;
    const centerY = 100;
    workflowCanvas.addNode(e.detail.node, centerX, centerY);
  });

  workflowCanvas.onNodeSelect = (node) => {
    propertyPanel.setSelectedNode(node);
  };

  workflowCanvas.onNodesChange = (nodes, connections) => {
    // 節點或連線變更時可以做額外處理
  };

  propertyPanel.onNodeUpdate = (nodeId, updates) => {
    workflowCanvas.updateNode(nodeId, updates);
  };

  // 儲存流程
  function saveWorkflow() {
    const workflowName = workflowNameInput.getValue();
    const formId = formSelect.getValue();
    const nodes = workflowCanvas.getNodes();
    const connections = workflowCanvas.getConnections();

    if (!workflowName.trim()) {
      alert('請輸入流程名稱');
      return;
    }

    if (!formId) {
      alert('請選擇關聯表單');
      return;
    }

    if (nodes.length === 0) {
      alert('請至少新增一個節點');
      return;
    }

    // 驗證流程：必須有開始和結束節點
    const hasStart = nodes.some(n => n.type === 'start');
    const hasEnd = nodes.some(n => n.type === 'end');

    if (!hasStart) {
      alert('流程必須包含「開始」節點');
      return;
    }

    if (!hasEnd) {
      alert('流程必須包含「結束」節點');
      return;
    }

    const isEdit = !!currentWorkflow?.id;
    const workflowData = {
      id: currentWorkflow?.id,
      name: workflowName,
      formId: formId,
      nodes: nodes,
      connections: connections
    };

    const workflow = new WorkflowModel(workflowData);
    workflow.save();

    // 記錄操作日誌
    if (isEdit) {
      auditLogger.logUpdateWorkflow(workflow.id, workflowName);
    } else {
      auditLogger.logCreateWorkflow(workflow.id, workflowName);
    }

    const modal = new Modal({
      title: '儲存成功',
      content: '<p>流程已成功儲存</p>',
      showClose: false
    });

    const modalBody = document.createElement('div');
    modalBody.innerHTML = '<p>流程已成功儲存</p>';

    const okBtn = new Button({
      text: '確定',
      variant: 'primary',
      onClick: () => {
        modal.close();
        window.location.hash = '#/workflows';
      }
    });

    modalBody.appendChild(okBtn.render());
    modal.setContent(modalBody);
    modal.render();
    modal.open();
  }

  addStyles();
  return container;
}

function addStyles() {
  if (!document.getElementById('workflow-designer-page-styles')) {
    const style = document.createElement('style');
    style.id = 'workflow-designer-page-styles';
    style.textContent = `
      .workflow-designer-page {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .designer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-lg);
        border-bottom: 1px solid var(--border-color);
      }

      .designer-header h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }

      .workflow-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-lg);
        background: var(--bg-color);
        border-radius: var(--radius-lg);
      }

      .designer-content {
        flex: 1;
        display: grid;
        grid-template-columns: 280px 1fr 320px;
        gap: var(--spacing-lg);
        min-height: 0;
      }

      .designer-panel {
        min-height: 0;
      }

      .designer-left,
      .designer-right {
        overflow-y: auto;
      }

      .designer-center {
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }
}
