import { Input } from '../common/Input.js';
import { Select } from '../common/Select.js';

// 節點屬性設定面板
export class NodePropertyPanel {
  constructor() {
    this.element = null;
    this.selectedNode = null;
    this.onNodeUpdate = null;
  }

  render() {
    const panel = document.createElement('div');
    panel.className = 'node-property-panel';

    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = '<h3>節點設定</h3>';
    panel.appendChild(header);

    const content = document.createElement('div');
    content.className = 'panel-content';
    content.id = 'node-property-content';

    if (!this.selectedNode) {
      content.innerHTML = `
        <div class="panel-empty">
          <p>請選擇一個節點以編輯其屬性</p>
        </div>
      `;
    } else {
      this.renderNodeProperties(content);
    }

    panel.appendChild(content);
    this.element = panel;
    this.addStyles();
    return panel;
  }

  renderNodeProperties(container) {
    container.innerHTML = '';

    const form = document.createElement('div');
    form.className = 'property-form';

    // 節點資訊
    const infoSection = document.createElement('div');
    infoSection.className = 'property-section';
    infoSection.innerHTML = `
      <h4>基本資訊</h4>
      <div class="info-item">
        <span class="info-label">節點類型：</span>
        <span class="info-value">${this.getNodeTypeName(this.selectedNode.type)}</span>
      </div>
    `;
    form.appendChild(infoSection);

    // 節點名稱
    const nameInput = new Input({
      label: '節點名稱',
      value: this.selectedNode.name,
      onChange: (value) => {
        this.updateNode({ name: value });
      }
    });
    form.appendChild(nameInput.render());

    // 根據節點類型顯示不同的設定選項
    switch (this.selectedNode.type) {
      case 'single':
        this.renderSingleApproverSettings(form);
        break;
      case 'parallel':
        this.renderParallelApproverSettings(form);
        break;
      case 'sequential':
        this.renderSequentialApproverSettings(form);
        break;
      case 'condition':
        this.renderConditionSettings(form);
        break;
    }

    container.appendChild(form);
  }

  renderSingleApproverSettings(form) {
    const section = document.createElement('div');
    section.className = 'property-section';

    const header = document.createElement('h4');
    header.textContent = '簽核人員';
    section.appendChild(header);

    const typeSelect = new Select({
      label: '指定方式',
      options: [
        { value: 'user', label: '指定人員' },
        { value: 'role', label: '指定角色' },
        { value: 'supervisor', label: '申請人主管' },
        { value: 'dynamic', label: '動態決定' }
      ],
      value: this.selectedNode.config?.approverType || 'user',
      onChange: (value) => {
        this.updateNode({
          config: {
            ...this.selectedNode.config,
            approverType: value
          }
        });
        this.setSelectedNode(this.selectedNode);
      }
    });
    section.appendChild(typeSelect.render());

    const approverType = this.selectedNode.config?.approverType || 'user';

    if (approverType === 'user' || approverType === 'role') {
      const approverInput = new Input({
        label: approverType === 'user' ? '人員名稱' : '角色名稱',
        placeholder: approverType === 'user' ? '輸入人員名稱' : '輸入角色名稱',
        value: this.selectedNode.config?.approver || '',
        onChange: (value) => {
          this.updateNode({
            config: {
              ...this.selectedNode.config,
              approver: value
            }
          });
        }
      });
      section.appendChild(approverInput.render());
    }

    form.appendChild(section);
  }

  renderParallelApproverSettings(form) {
    const section = document.createElement('div');
    section.className = 'property-section';

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <h4>並簽人員</h4>
      <button class="btn-add-approver" type="button">+ 新增</button>
    `;
    section.appendChild(header);

    const description = document.createElement('p');
    description.className = 'section-desc';
    description.textContent = '所有簽核人員必須全部通過才算通過';
    section.appendChild(description);

    const approversList = document.createElement('div');
    approversList.className = 'approvers-list';

    const approvers = this.selectedNode.config?.approvers || [];
    approvers.forEach((approver, index) => {
      const item = this.createApproverItem(approver, index, approvers);
      approversList.appendChild(item);
    });

    section.appendChild(approversList);

    const addBtn = header.querySelector('.btn-add-approver');
    addBtn.addEventListener('click', () => {
      const newApprovers = [...approvers, { name: '', role: '' }];
      this.updateNode({
        config: {
          ...this.selectedNode.config,
          approvers: newApprovers
        }
      });
      this.setSelectedNode(this.selectedNode);
    });

    form.appendChild(section);
  }

  renderSequentialApproverSettings(form) {
    const section = document.createElement('div');
    section.className = 'property-section';

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <h4>串簽人員</h4>
      <button class="btn-add-approver" type="button">+ 新增</button>
    `;
    section.appendChild(header);

    const description = document.createElement('p');
    description.className = 'section-desc';
    description.textContent = '按照順序依序簽核，上一關通過才能進入下一關';
    section.appendChild(description);

    const approversList = document.createElement('div');
    approversList.className = 'approvers-list sequential';

    const approvers = this.selectedNode.config?.approvers || [];
    approvers.forEach((approver, index) => {
      const item = this.createSequentialApproverItem(approver, index, approvers);
      approversList.appendChild(item);
    });

    section.appendChild(approversList);

    const addBtn = header.querySelector('.btn-add-approver');
    addBtn.addEventListener('click', () => {
      const newApprovers = [...approvers, { name: '', order: approvers.length + 1 }];
      this.updateNode({
        config: {
          ...this.selectedNode.config,
          approvers: newApprovers
        }
      });
      this.setSelectedNode(this.selectedNode);
    });

    form.appendChild(section);
  }

  createApproverItem(approver, index, approvers) {
    const item = document.createElement('div');
    item.className = 'approver-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = approver.name || '';
    input.placeholder = `簽核人員 ${index + 1}`;
    input.addEventListener('input', (e) => {
      const newApprovers = [...approvers];
      newApprovers[index] = { ...approver, name: e.target.value };
      this.updateNode({
        config: {
          ...this.selectedNode.config,
          approvers: newApprovers
        }
      });
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '×';
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => {
      const newApprovers = approvers.filter((_, i) => i !== index);
      this.updateNode({
        config: {
          ...this.selectedNode.config,
          approvers: newApprovers
        }
      });
      this.setSelectedNode(this.selectedNode);
    });

    item.appendChild(input);
    item.appendChild(deleteBtn);
    return item;
  }

  createSequentialApproverItem(approver, index, approvers) {
    const item = document.createElement('div');
    item.className = 'approver-item sequential-item';

    const order = document.createElement('div');
    order.className = 'approver-order';
    order.textContent = index + 1;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = approver.name || '';
    input.placeholder = `第 ${index + 1} 關簽核人員`;
    input.addEventListener('input', (e) => {
      const newApprovers = [...approvers];
      newApprovers[index] = { ...approver, name: e.target.value, order: index + 1 };
      this.updateNode({
        config: {
          ...this.selectedNode.config,
          approvers: newApprovers
        }
      });
    });

    const controls = document.createElement('div');
    controls.className = 'approver-controls';

    const upBtn = document.createElement('button');
    upBtn.className = 'btn-control';
    upBtn.textContent = '↑';
    upBtn.type = 'button';
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', () => {
      if (index > 0) {
        const newApprovers = [...approvers];
        [newApprovers[index], newApprovers[index - 1]] = [newApprovers[index - 1], newApprovers[index]];
        this.updateNode({
          config: {
            ...this.selectedNode.config,
            approvers: newApprovers
          }
        });
        this.setSelectedNode(this.selectedNode);
      }
    });

    const downBtn = document.createElement('button');
    downBtn.className = 'btn-control';
    downBtn.textContent = '↓';
    downBtn.type = 'button';
    downBtn.disabled = index === approvers.length - 1;
    downBtn.addEventListener('click', () => {
      if (index < approvers.length - 1) {
        const newApprovers = [...approvers];
        [newApprovers[index], newApprovers[index + 1]] = [newApprovers[index + 1], newApprovers[index]];
        this.updateNode({
          config: {
            ...this.selectedNode.config,
            approvers: newApprovers
          }
        });
        this.setSelectedNode(this.selectedNode);
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '×';
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => {
      const newApprovers = approvers.filter((_, i) => i !== index);
      this.updateNode({
        config: {
          ...this.selectedNode.config,
          approvers: newApprovers
        }
      });
      this.setSelectedNode(this.selectedNode);
    });

    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(deleteBtn);

    item.appendChild(order);
    item.appendChild(input);
    item.appendChild(controls);
    return item;
  }

  renderConditionSettings(form) {
    const section = document.createElement('div');
    section.className = 'property-section';

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <h4>條件規則設定</h4>
      <button class="btn-add-rule" type="button">+ 新增規則</button>
    `;
    section.appendChild(header);

    const description = document.createElement('p');
    description.className = 'section-desc';
    description.textContent = '根據表單資料判斷流程走向，依序評估規則，符合第一個規則即走該分支';
    section.appendChild(description);

    // 條件規則列表
    const rulesList = document.createElement('div');
    rulesList.className = 'rules-list';

    const rules = this.selectedNode.config?.conditionRules || [];

    if (rules.length === 0) {
      rulesList.innerHTML = '<p class="empty-state">尚未設定任何規則，請點擊「新增規則」開始</p>';
    } else {
      rules.forEach((rule, index) => {
        const ruleItem = this.createRuleItem(rule, index, rules);
        rulesList.appendChild(ruleItem);
      });
    }

    section.appendChild(rulesList);

    // 預設輸出點設定
    const defaultSection = document.createElement('div');
    defaultSection.className = 'default-output-section';
    defaultSection.innerHTML = `
      <label>預設分支（無條件符合時）</label>
      <select class="default-output-select">
        <option value="out-right" ${this.selectedNode.config?.defaultOutputPoint === 'out-right' ? 'selected' : ''}>右側 (out-right)</option>
        <option value="out-bottom" ${this.selectedNode.config?.defaultOutputPoint === 'out-bottom' ? 'selected' : ''}>下方 (out-bottom)</option>
        <option value="out-left" ${this.selectedNode.config?.defaultOutputPoint === 'out-left' ? 'selected' : ''}>左側 (out-left)</option>
      </select>
    `;

    const defaultSelect = defaultSection.querySelector('.default-output-select');
    defaultSelect.addEventListener('change', (e) => {
      this.updateNode({
        config: {
          ...this.selectedNode.config,
          defaultOutputPoint: e.target.value
        }
      });
    });

    section.appendChild(defaultSection);

    // 新增規則按鈕事件
    const addBtn = header.querySelector('.btn-add-rule');
    addBtn.addEventListener('click', () => {
      this.showRuleEditor(null, rules);
    });

    form.appendChild(section);
  }

  createRuleItem(rule, index, rules) {
    const item = document.createElement('div');
    item.className = 'rule-item';

    const ruleHeader = document.createElement('div');
    ruleHeader.className = 'rule-header';

    const ruleName = document.createElement('span');
    ruleName.className = 'rule-name';
    ruleName.textContent = rule.name || `規則 ${index + 1}`;

    const ruleActions = document.createElement('div');
    ruleActions.className = 'rule-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-rule-edit';
    editBtn.textContent = '編輯';
    editBtn.type = 'button';
    editBtn.addEventListener('click', () => {
      this.showRuleEditor(index, rules);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-rule-delete';
    deleteBtn.textContent = '刪除';
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => {
      if (confirm('確定要刪除此規則？')) {
        const newRules = rules.filter((_, i) => i !== index);
        this.updateNode({
          config: {
            ...this.selectedNode.config,
            conditionRules: newRules
          }
        });
        this.setSelectedNode(this.selectedNode);
      }
    });

    ruleActions.appendChild(editBtn);
    ruleActions.appendChild(deleteBtn);

    ruleHeader.appendChild(ruleName);
    ruleHeader.appendChild(ruleActions);

    const ruleInfo = document.createElement('div');
    ruleInfo.className = 'rule-info';

    const outputInfo = document.createElement('div');
    outputInfo.className = 'rule-info-item';
    outputInfo.innerHTML = `<span class="info-label">輸出點：</span><span>${rule.outputPoint || '未設定'}</span>`;

    const conditionInfo = document.createElement('div');
    conditionInfo.className = 'rule-info-item';
    const conditionText = this.getConditionGroupDescription(rule.conditionGroup);
    conditionInfo.innerHTML = `<span class="info-label">條件：</span><span>${conditionText}</span>`;

    ruleInfo.appendChild(outputInfo);
    ruleInfo.appendChild(conditionInfo);

    item.appendChild(ruleHeader);
    item.appendChild(ruleInfo);

    return item;
  }

  getConditionGroupDescription(conditionGroup) {
    if (!conditionGroup || !conditionGroup.conditions || conditionGroup.conditions.length === 0) {
      return '無條件';
    }

    const descriptions = conditionGroup.conditions.map(c => {
      const operatorNames = {
        '>': '大於',
        '<': '小於',
        '>=': '大於等於',
        '<=': '小於等於',
        '==': '等於',
        '!=': '不等於',
        'contains': '包含',
        'startsWith': '開頭是',
        'endsWith': '結尾是',
        'isEmpty': '為空',
        'isNotEmpty': '不為空'
      };

      const opName = operatorNames[c.operator] || c.operator;

      if (c.operator === 'isEmpty' || c.operator === 'isNotEmpty') {
        return `${c.field} ${opName}`;
      }

      return `${c.field} ${opName} ${c.value}`;
    });

    const logicText = conditionGroup.logic === 'AND' ? ' 且 ' : ' 或 ';
    return descriptions.join(logicText);
  }

  showRuleEditor(ruleIndex, rules) {
    const isEdit = ruleIndex !== null;
    const rule = isEdit ? rules[ruleIndex] : {
      id: `rule-${Date.now()}`,
      name: '',
      outputPoint: 'out-right',
      conditionGroup: {
        logic: 'AND',
        conditions: []
      }
    };

    // 建立 Modal
    const modal = document.createElement('div');
    modal.className = 'rule-editor-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'rule-editor-content';

    modalContent.innerHTML = `
      <div class="modal-header">
        <h3>${isEdit ? '編輯規則' : '新增規則'}</h3>
        <button class="btn-close-modal" type="button">×</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>規則名稱</label>
          <input type="text" class="rule-name-input" placeholder="例：請假天數 > 3" value="${rule.name || ''}">
        </div>

        <div class="form-group">
          <label>輸出點</label>
          <select class="rule-output-select">
            <option value="out-right" ${rule.outputPoint === 'out-right' ? 'selected' : ''}>右側 (out-right)</option>
            <option value="out-bottom" ${rule.outputPoint === 'out-bottom' ? 'selected' : ''}>下方 (out-bottom)</option>
            <option value="out-left" ${rule.outputPoint === 'out-left' ? 'selected' : ''}>左側 (out-left)</option>
          </select>
        </div>

        <div class="form-group">
          <label>條件邏輯</label>
          <select class="condition-logic-select">
            <option value="AND" ${rule.conditionGroup.logic === 'AND' ? 'selected' : ''}>全部符合 (AND)</option>
            <option value="OR" ${rule.conditionGroup.logic === 'OR' ? 'selected' : ''}>任一符合 (OR)</option>
          </select>
        </div>

        <div class="form-group">
          <div class="conditions-header">
            <label>條件列表</label>
            <button class="btn-add-condition" type="button">+ 新增條件</button>
          </div>
          <div class="conditions-list"></div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" type="button">取消</button>
        <button class="btn-save" type="button">儲存</button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 渲染條件列表
    const conditionsList = modalContent.querySelector('.conditions-list');
    const renderConditions = () => {
      conditionsList.innerHTML = '';

      if (rule.conditionGroup.conditions.length === 0) {
        conditionsList.innerHTML = '<p class="empty-state">尚未新增任何條件</p>';
      } else {
        rule.conditionGroup.conditions.forEach((condition, idx) => {
          const condItem = this.createConditionItem(condition, idx, rule.conditionGroup.conditions, renderConditions);
          conditionsList.appendChild(condItem);
        });
      }
    };

    renderConditions();

    // 新增條件按鈕
    modalContent.querySelector('.btn-add-condition').addEventListener('click', () => {
      rule.conditionGroup.conditions.push({
        field: '',
        operator: '==',
        value: ''
      });
      renderConditions();
    });

    // 關閉按鈕
    modalContent.querySelector('.btn-close-modal').addEventListener('click', () => {
      modal.remove();
    });

    // 取消按鈕
    modalContent.querySelector('.btn-cancel').addEventListener('click', () => {
      modal.remove();
    });

    // 儲存按鈕
    modalContent.querySelector('.btn-save').addEventListener('click', () => {
      const nameInput = modalContent.querySelector('.rule-name-input');
      const outputSelect = modalContent.querySelector('.rule-output-select');
      const logicSelect = modalContent.querySelector('.condition-logic-select');

      rule.name = nameInput.value;
      rule.outputPoint = outputSelect.value;
      rule.conditionGroup.logic = logicSelect.value;

      let newRules;
      if (isEdit) {
        newRules = [...rules];
        newRules[ruleIndex] = rule;
      } else {
        newRules = [...rules, rule];
      }

      this.updateNode({
        config: {
          ...this.selectedNode.config,
          conditionRules: newRules
        }
      });

      this.setSelectedNode(this.selectedNode);
      modal.remove();
    });

    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  createConditionItem(condition, index, conditions, renderCallback) {
    const item = document.createElement('div');
    item.className = 'condition-item';

    item.innerHTML = `
      <input type="text" class="condition-field" placeholder="欄位名稱（例：days）" value="${condition.field || ''}">

      <select class="condition-operator">
        <option value=">" ${condition.operator === '>' ? 'selected' : ''}>大於 (>)</option>
        <option value="<" ${condition.operator === '<' ? 'selected' : ''}>小於 (<)</option>
        <option value=">=" ${condition.operator === '>=' ? 'selected' : ''}>大於等於 (>=)</option>
        <option value="<=" ${condition.operator === '<=' ? 'selected' : ''}>小於等於 (<=)</option>
        <option value="==" ${condition.operator === '==' ? 'selected' : ''}>等於 (==)</option>
        <option value="!=" ${condition.operator === '!=' ? 'selected' : ''}>不等於 (!=)</option>
        <option value="contains" ${condition.operator === 'contains' ? 'selected' : ''}>包含 (contains)</option>
        <option value="startsWith" ${condition.operator === 'startsWith' ? 'selected' : ''}>開頭是 (startsWith)</option>
        <option value="endsWith" ${condition.operator === 'endsWith' ? 'selected' : ''}>結尾是 (endsWith)</option>
        <option value="isEmpty" ${condition.operator === 'isEmpty' ? 'selected' : ''}>為空 (isEmpty)</option>
        <option value="isNotEmpty" ${condition.operator === 'isNotEmpty' ? 'selected' : ''}>不為空 (isNotEmpty)</option>
      </select>

      <input type="text" class="condition-value" placeholder="比較值" value="${condition.value || ''}" ${condition.operator === 'isEmpty' || condition.operator === 'isNotEmpty' ? 'disabled' : ''}>

      <button class="btn-delete-condition" type="button">×</button>
    `;

    const fieldInput = item.querySelector('.condition-field');
    const operatorSelect = item.querySelector('.condition-operator');
    const valueInput = item.querySelector('.condition-value');
    const deleteBtn = item.querySelector('.btn-delete-condition');

    fieldInput.addEventListener('input', (e) => {
      condition.field = e.target.value;
    });

    operatorSelect.addEventListener('change', (e) => {
      condition.operator = e.target.value;
      // 如果是 isEmpty 或 isNotEmpty，禁用值輸入
      if (e.target.value === 'isEmpty' || e.target.value === 'isNotEmpty') {
        valueInput.disabled = true;
        valueInput.value = '';
        condition.value = '';
      } else {
        valueInput.disabled = false;
      }
    });

    valueInput.addEventListener('input', (e) => {
      condition.value = e.target.value;
    });

    deleteBtn.addEventListener('click', () => {
      conditions.splice(index, 1);
      renderCallback();
    });

    return item;
  }

  getNodeTypeName(type) {
    const types = {
      start: '開始',
      end: '結束',
      single: '單一簽核',
      parallel: '並簽',
      sequential: '串簽',
      condition: '條件分支'
    };
    return types[type] || type;
  }

  setSelectedNode(node) {
    this.selectedNode = node;
    const content = this.element?.querySelector('#node-property-content');
    if (content) {
      if (node) {
        this.renderNodeProperties(content);
      } else {
        content.innerHTML = `
          <div class="panel-empty">
            <p>請選擇一個節點以編輯其屬性</p>
          </div>
        `;
      }
    }
  }

  updateNode(updates) {
    if (this.selectedNode && this.onNodeUpdate) {
      Object.assign(this.selectedNode, updates);
      this.onNodeUpdate(this.selectedNode.id, updates);
    }
  }

  addStyles() {
    if (!document.getElementById('node-property-panel-styles')) {
      const style = document.createElement('style');
      style.id = 'node-property-panel-styles';
      style.textContent = `
        .node-property-panel {
          background: var(--bg-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .property-section {
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
        }

        .property-section:first-child {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }

        .property-section h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-md) 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .section-header h4 {
          margin: 0;
        }

        .section-desc {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin: 0 0 var(--spacing-md) 0;
          line-height: 1.4;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-sm);
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
        }

        .info-label {
          color: var(--text-secondary);
        }

        .info-value {
          color: var(--text-primary);
          font-weight: 500;
        }

        .btn-add-approver {
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-approver:hover {
          background: var(--primary-hover);
        }

        .approvers-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .approver-item {
          display: flex;
          gap: var(--spacing-sm);
          align-items: center;
        }

        .sequential-item {
          padding: var(--spacing-sm);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .approver-order {
          width: 28px;
          height: 28px;
          background: var(--primary-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .approver-item input {
          flex: 1;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: var(--font-family);
        }

        .approver-item input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .approver-controls {
          display: flex;
          gap: var(--spacing-xs);
        }

        .btn-control,
        .btn-delete {
          width: 28px;
          height: 28px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          background: var(--bg-color);
        }

        .btn-control:hover:not(:disabled) {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .btn-control:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-delete {
          background: var(--error-color);
          color: white;
          border-color: var(--error-color);
        }

        .btn-delete:hover {
          background: #dc2626;
        }

        .condition-type {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: var(--font-family);
        }

        /* 條件規則相關樣式 */
        .rules-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .rule-item {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          background: var(--bg-secondary);
        }

        .rule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .rule-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .rule-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .btn-rule-edit,
        .btn-rule-delete,
        .btn-add-rule {
          padding: var(--spacing-xs) var(--spacing-md);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-color);
        }

        .btn-rule-edit:hover {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .btn-rule-delete:hover {
          background: var(--error-color);
          color: white;
          border-color: var(--error-color);
        }

        .btn-add-rule {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .btn-add-rule:hover {
          background: var(--primary-hover);
        }

        .rule-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .rule-info-item {
          font-size: 0.75rem;
          color: var(--text-secondary);
          display: flex;
          gap: var(--spacing-xs);
        }

        .rule-info-item .info-label {
          font-weight: 600;
        }

        .default-output-section {
          margin-top: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .default-output-section label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--spacing-sm);
        }

        .default-output-select {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: var(--font-family);
        }

        .empty-state {
          text-align: center;
          color: var(--text-tertiary);
          font-size: 0.875rem;
          padding: var(--spacing-lg);
        }

        /* Modal 樣式 */
        .rule-editor-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .rule-editor-content {
          background: var(--bg-color);
          border-radius: var(--radius-lg);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .btn-close-modal {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          font-size: 1.5rem;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }

        .btn-close-modal:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .modal-body {
          padding: var(--spacing-lg);
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
        }

        .form-group {
          margin-bottom: var(--spacing-lg);
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--spacing-sm);
        }

        .form-group input[type="text"],
        .form-group select {
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: var(--font-family);
          font-size: 0.875rem;
        }

        .form-group input[type="text"]:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .conditions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .btn-add-condition {
          padding: var(--spacing-xs) var(--spacing-md);
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-condition:hover {
          background: var(--primary-hover);
        }

        .conditions-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          min-height: 100px;
        }

        .condition-item {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr auto;
          gap: var(--spacing-sm);
          align-items: center;
          padding: var(--spacing-sm);
          background: var(--bg-color);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        .condition-item input,
        .condition-item select {
          padding: var(--spacing-xs) var(--spacing-sm);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: 0.75rem;
        }

        .condition-item input:focus,
        .condition-item select:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .condition-item input:disabled {
          background: var(--bg-secondary);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-delete-condition {
          width: 28px;
          height: 28px;
          background: var(--error-color);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .btn-delete-condition:hover {
          background: #dc2626;
        }

        .btn-cancel,
        .btn-save {
          padding: var(--spacing-sm) var(--spacing-lg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-family);
        }

        .btn-cancel {
          background: var(--bg-color);
          color: var(--text-primary);
        }

        .btn-cancel:hover {
          background: var(--bg-secondary);
        }

        .btn-save {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .btn-save:hover {
          background: var(--primary-hover);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
