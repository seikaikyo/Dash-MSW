import { FormInstanceModel, ApprovalHistoryModel, WorkflowModel } from './dataModel.js';
import { ConditionEvaluator } from './conditionEvaluator.js';
import { auditLogger } from './auditLogger.js';

/**
 * 簽核引擎 - 處理簽核流程邏輯
 */
export class ApprovalEngine {
  constructor(instanceId) {
    this.instance = FormInstanceModel.getById(instanceId);
    if (!this.instance) {
      throw new Error('申請單不存在');
    }

    this.workflow = WorkflowModel.getById(this.instance.workflowId);
    if (!this.workflow) {
      throw new Error('簽核流程不存在');
    }
  }

  /**
   * 初始化簽核流程
   */
  initializeWorkflow() {
    // 找到開始節點
    const startNode = this.workflow.nodes.find(n => n.type === 'start');
    if (!startNode) {
      throw new Error('流程缺少開始節點');
    }

    // 找到下一個節點
    const nextNodes = this.getNextNodes(startNode.id);
    if (nextNodes.length === 0) {
      throw new Error('開始節點沒有連接到任何節點');
    }

    // 初始化簽核狀態
    this.instance.currentNodeId = nextNodes[0].id;
    this.instance.status = 'pending';
    this.instance.save();

    // 記錄歷史
    this.recordHistory({
      action: 'submit',
      comment: '發起申請',
      result: 'submitted'
    });

    // 記錄操作日誌
    auditLogger.logSubmitApplication(
      this.instance.id,
      this.instance.applicationNo,
      this.instance.formName
    );

    // 如果第一個節點是條件節點，自動評估
    if (nextNodes[0].type === 'condition') {
      this.processCondition(nextNodes[0]);
    }

    return this.instance;
  }

  /**
   * 執行簽核動作
   */
  approve(userId, userName, comment, result) {
    if (this.instance.status === 'approved' || this.instance.status === 'rejected') {
      throw new Error('此申請單已結案');
    }

    const currentNode = this.workflow.nodes.find(n => n.id === this.instance.currentNodeId);
    if (!currentNode) {
      throw new Error('當前節點不存在');
    }

    // 記錄簽核歷史
    this.recordHistory({
      nodeId: currentNode.id,
      nodeName: currentNode.label,
      userId,
      userName,
      action: result,
      comment,
      result
    });

    // 處理簽核結果
    if (result === 'reject') {
      // 退回
      this.instance.status = 'rejected';
      this.instance.save();

      // 記錄操作日誌
      auditLogger.logRejectApplication(
        this.instance.id,
        this.instance.applicationNo,
        comment
      );

      return { status: 'rejected', message: '申請已被退回' };
    }

    // 記錄核准操作日誌
    auditLogger.logApproveApplication(
      this.instance.id,
      this.instance.applicationNo,
      comment
    );

    // 通過，檢查節點類型
    return this.processApproval(currentNode, userId, userName);
  }

  /**
   * 處理簽核通過邏輯
   */
  processApproval(currentNode, userId, userName) {
    switch (currentNode.type) {
      case 'single':
        // 單簽：直接進入下一節點
        return this.moveToNextNode(currentNode.id);

      case 'parallel':
        // 並簽：檢查是否所有人都簽核了
        return this.processParallelApproval(currentNode, userId);

      case 'sequential':
        // 串簽：檢查是否輪到此人，並移到下一個簽核人
        return this.processSequentialApproval(currentNode, userId);

      case 'condition':
        // 條件分支：根據條件決定下一節點
        return this.processCondition(currentNode);

      default:
        throw new Error(`未知的節點類型：${currentNode.type}`);
    }
  }

  /**
   * 處理並簽邏輯
   */
  processParallelApproval(node, userId) {
    // 初始化並簽狀態
    if (!this.instance.parallelState) {
      this.instance.parallelState = {};
    }

    if (!this.instance.parallelState[node.id]) {
      this.instance.parallelState[node.id] = {
        approved: [],
        required: node.approvers ? node.approvers.length : 0
      };
    }

    const state = this.instance.parallelState[node.id];

    // 記錄此人已簽核
    if (!state.approved.includes(userId)) {
      state.approved.push(userId);
    }

    this.instance.save();

    // 檢查是否所有人都簽核了
    if (state.approved.length >= state.required) {
      // 全部簽核完成，移到下一節點
      delete this.instance.parallelState[node.id];
      this.instance.save();
      return this.moveToNextNode(node.id);
    }

    // 還有人未簽核
    return {
      status: 'pending',
      message: `並簽進行中（${state.approved.length}/${state.required}）`
    };
  }

  /**
   * 處理串簽邏輯
   */
  processSequentialApproval(node, userId) {
    // 初始化串簽狀態
    if (!this.instance.sequentialState) {
      this.instance.sequentialState = {};
    }

    if (!this.instance.sequentialState[node.id]) {
      this.instance.sequentialState[node.id] = {
        currentIndex: 0,
        approvers: node.approvers || []
      };
    }

    const state = this.instance.sequentialState[node.id];

    // 檢查是否輪到此人
    const currentApprover = state.approvers[state.currentIndex];
    if (currentApprover !== userId) {
      throw new Error('尚未輪到您簽核');
    }

    // 移到下一個簽核人
    state.currentIndex++;
    this.instance.save();

    // 檢查是否所有人都簽核完成
    if (state.currentIndex >= state.approvers.length) {
      // 全部簽核完成，移到下一節點
      delete this.instance.sequentialState[node.id];
      this.instance.save();
      return this.moveToNextNode(node.id);
    }

    // 還有下一位簽核人
    return {
      status: 'pending',
      message: `串簽進行中（${state.currentIndex}/${state.approvers.length}）`
    };
  }

  /**
   * 處理條件分支
   */
  processCondition(node) {
    const formData = this.instance.data;
    const evaluator = new ConditionEvaluator();

    // 取得節點的條件規則
    const rules = node.config?.conditionRules || [];

    // 依序評估規則
    for (const rule of rules) {
      const result = evaluator.evaluateConditionGroup(formData, rule.conditionGroup);

      if (result) {
        // 條件符合，選擇對應的輸出分支
        const nextNodes = this.getNextNodesByPoint(node.id, rule.outputPoint);

        if (nextNodes.length > 0) {
          // 記錄條件判斷結果
          this.recordHistory({
            nodeId: node.id,
            nodeName: node.label,
            action: 'condition',
            result: 'matched',
            comment: `條件符合：${rule.name}，走 ${rule.outputPoint} 分支`
          });

          // 移動到下一節點
          this.instance.currentNodeId = nextNodes[0].id;
          this.instance.save();

          // 檢查下一節點是否為結束節點
          if (nextNodes[0].type === 'end') {
            return this.moveToNextNode(node.id);
          }

          return {
            status: 'pending',
            message: `條件判斷完成：${rule.name}`,
            nextNode: nextNodes[0]
          };
        }
      }
    }

    // 無條件符合，使用預設輸出
    const defaultOutputPoint = node.config?.defaultOutputPoint || 'out-right';
    const defaultNodes = this.getNextNodesByPoint(node.id, defaultOutputPoint);

    if (defaultNodes.length > 0) {
      this.recordHistory({
        nodeId: node.id,
        nodeName: node.label,
        action: 'condition',
        result: 'default',
        comment: '無條件符合，使用預設分支'
      });

      this.instance.currentNodeId = defaultNodes[0].id;
      this.instance.save();

      // 檢查下一節點是否為結束節點
      if (defaultNodes[0].type === 'end') {
        return this.moveToNextNode(node.id);
      }

      return {
        status: 'pending',
        message: '使用預設分支',
        nextNode: defaultNodes[0]
      };
    }

    throw new Error('條件節點無有效輸出');
  }

  /**
   * 根據輸出點取得下一節點
   */
  getNextNodesByPoint(nodeId, outputPoint) {
    const connections = this.workflow.connections.filter(
      c => c.from === nodeId && c.fromPoint === outputPoint
    );
    return connections.map(c => this.workflow.nodes.find(n => n.id === c.to)).filter(Boolean);
  }

  /**
   * 移動到下一個節點
   */
  moveToNextNode(currentNodeId) {
    const nextNodes = this.getNextNodes(currentNodeId);

    if (nextNodes.length === 0) {
      throw new Error('找不到下一個節點');
    }

    const nextNode = nextNodes[0];

    // 檢查是否為結束節點
    if (nextNode.type === 'end') {
      this.instance.status = 'approved';
      this.instance.currentNodeId = nextNode.id;
      this.instance.save();

      this.recordHistory({
        nodeId: nextNode.id,
        nodeName: nextNode.label,
        action: 'complete',
        result: 'approved',
        comment: '流程完成'
      });

      return {
        status: 'approved',
        message: '申請已通過'
      };
    }

    // 移動到下一節點
    this.instance.currentNodeId = nextNode.id;
    this.instance.save();

    // 如果是條件節點，自動評估
    if (nextNode.type === 'condition') {
      return this.processCondition(nextNode);
    }

    return {
      status: 'pending',
      message: `已移至：${nextNode.label}`,
      nextNode: nextNode
    };
  }

  /**
   * 取得下一個節點
   */
  getNextNodes(nodeId) {
    const connections = this.workflow.connections.filter(c => c.from === nodeId);
    return connections.map(c => this.workflow.nodes.find(n => n.id === c.to)).filter(Boolean);
  }

  /**
   * 記錄簽核歷史
   */
  recordHistory(data) {
    const history = new ApprovalHistoryModel({
      instanceId: this.instance.id,
      nodeId: data.nodeId,
      nodeName: data.nodeName,
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      comment: data.comment || '',
      result: data.result
    });

    history.save();
  }

  /**
   * 取得當前待簽核人員
   */
  getCurrentApprovers() {
    const currentNode = this.workflow.nodes.find(n => n.id === this.instance.currentNodeId);
    if (!currentNode) return [];

    switch (currentNode.type) {
      case 'single':
        return currentNode.approvers || [];

      case 'parallel':
        // 並簽：返回尚未簽核的人
        const parallelState = this.instance.parallelState?.[currentNode.id];
        if (!parallelState) return currentNode.approvers || [];
        return (currentNode.approvers || []).filter(
          a => !parallelState.approved.includes(a)
        );

      case 'sequential':
        // 串簽：返回當前輪到的人
        const seqState = this.instance.sequentialState?.[currentNode.id];
        if (!seqState) return currentNode.approvers?.[0] ? [currentNode.approvers[0]] : [];
        const currentApprover = seqState.approvers[seqState.currentIndex];
        return currentApprover ? [currentApprover] : [];

      default:
        return [];
    }
  }

  /**
   * 取得簽核歷史
   */
  getHistory() {
    return ApprovalHistoryModel.getAll().filter(h => h.instanceId === this.instance.id);
  }

  /**
   * 取得目前節點資訊
   */
  getCurrentNodeInfo() {
    const currentNode = this.workflow.nodes.find(n => n.id === this.instance.currentNodeId);
    if (!currentNode) return null;

    let approvedCount = 0;
    let totalCount = 1;
    let nextApprover = null;

    switch (currentNode.type) {
      case 'parallel':
        // 並簽
        totalCount = (currentNode.approvers || []).length;
        const parallelState = this.instance.parallelState?.[currentNode.id];
        approvedCount = parallelState?.approved?.length || 0;
        nextApprover = this.getCurrentApprovers();
        break;

      case 'serial':
      case 'sequential':
        // 串簽
        totalCount = (currentNode.approvers || []).length;
        const seqState = this.instance.sequentialState?.[currentNode.id];
        approvedCount = seqState?.currentIndex || 0;
        nextApprover = this.getCurrentApprovers();
        break;

      case 'single':
        // 單簽
        totalCount = 1;
        approvedCount = 0;
        nextApprover = currentNode.approvers || [];
        break;

      default:
        nextApprover = [];
    }

    return {
      node: currentNode,
      approvedCount,
      totalCount,
      approvers: currentNode.approvers || [],
      nextApprover
    };
  }
}
