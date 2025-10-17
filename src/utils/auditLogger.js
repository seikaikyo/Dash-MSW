import { AuditLogModel } from './dataModel.js';
import { authService } from './authService.js';

/**
 * 操作日誌服務
 * 用於記錄系統中的各種操作
 */
class AuditLogger {
  /**
   * 記錄操作日誌
   * @param {Object} params
   * @param {string} params.action - 操作類型
   * @param {string} params.module - 模組名稱
   * @param {string} params.targetId - 目標 ID
   * @param {string} params.targetName - 目標名稱
   * @param {string} params.result - 操作結果
   * @param {string} params.details - 詳細資訊
   * @param {Object} params.changes - 變更內容
   */
  log({ action, module, targetId = '', targetName = '', result = 'success', details = '', changes = null }) {
    const currentUser = authService.getCurrentUser();

    const logData = {
      userId: currentUser?.id || '',
      userName: currentUser?.name || '未登入使用者',
      userAccount: currentUser?.account || '',
      action,
      module,
      targetId,
      targetName,
      result,
      details,
      changes
    };

    const log = new AuditLogModel(logData);
    log.save();

    // 開發環境下印出日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('[Audit Log]', {
        user: logData.userName,
        action: logData.action,
        module: logData.module,
        target: logData.targetName,
        result: logData.result
      });
    }

    return log;
  }

  // 認證相關
  logLogin(userAccount, success = true) {
    return this.log({
      action: 'login',
      module: 'auth',
      targetName: userAccount,
      result: success ? 'success' : 'failure',
      details: success ? '登入成功' : '登入失敗'
    });
  }

  logLogout() {
    return this.log({
      action: 'logout',
      module: 'auth',
      details: '登出系統'
    });
  }

  // 表單相關
  logCreateForm(formId, formName) {
    return this.log({
      action: 'create',
      module: 'form',
      targetId: formId,
      targetName: formName,
      details: `建立表單：${formName}`
    });
  }

  logUpdateForm(formId, formName, changes = null) {
    return this.log({
      action: 'update',
      module: 'form',
      targetId: formId,
      targetName: formName,
      details: `更新表單：${formName}`,
      changes
    });
  }

  logDeleteForm(formId, formName) {
    return this.log({
      action: 'delete',
      module: 'form',
      targetId: formId,
      targetName: formName,
      details: `刪除表單：${formName}`
    });
  }

  // 流程相關
  logCreateWorkflow(workflowId, workflowName) {
    return this.log({
      action: 'create',
      module: 'workflow',
      targetId: workflowId,
      targetName: workflowName,
      details: `建立流程：${workflowName}`
    });
  }

  logUpdateWorkflow(workflowId, workflowName, changes = null) {
    return this.log({
      action: 'update',
      module: 'workflow',
      targetId: workflowId,
      targetName: workflowName,
      details: `更新流程：${workflowName}`,
      changes
    });
  }

  logDeleteWorkflow(workflowId, workflowName) {
    return this.log({
      action: 'delete',
      module: 'workflow',
      targetId: workflowId,
      targetName: workflowName,
      details: `刪除流程：${workflowName}`
    });
  }

  // 申請相關
  logSubmitApplication(instanceId, applicationNo, formName) {
    return this.log({
      action: 'submit',
      module: 'application',
      targetId: instanceId,
      targetName: `${formName} (${applicationNo})`,
      details: `提交申請：${applicationNo}`
    });
  }

  logWithdrawApplication(instanceId, applicationNo) {
    return this.log({
      action: 'withdraw',
      module: 'application',
      targetId: instanceId,
      targetName: applicationNo,
      details: `撤回申請：${applicationNo}`
    });
  }

  logApproveApplication(instanceId, applicationNo, comment = '') {
    return this.log({
      action: 'approve',
      module: 'application',
      targetId: instanceId,
      targetName: applicationNo,
      details: `核准申請：${applicationNo}${comment ? ` (${comment})` : ''}`
    });
  }

  logRejectApplication(instanceId, applicationNo, comment = '') {
    return this.log({
      action: 'reject',
      module: 'application',
      targetId: instanceId,
      targetName: applicationNo,
      details: `退回申請：${applicationNo}${comment ? ` (${comment})` : ''}`
    });
  }

  // 人員相關
  logCreateUser(userId, userName) {
    return this.log({
      action: 'create',
      module: 'user',
      targetId: userId,
      targetName: userName,
      details: `建立人員：${userName}`
    });
  }

  logUpdateUser(userId, userName, changes = null) {
    return this.log({
      action: 'update',
      module: 'user',
      targetId: userId,
      targetName: userName,
      details: `更新人員：${userName}`,
      changes
    });
  }

  logDeleteUser(userId, userName) {
    return this.log({
      action: 'delete',
      module: 'user',
      targetId: userId,
      targetName: userName,
      details: `刪除人員：${userName}`
    });
  }

  // 部門相關
  logCreateDepartment(deptId, deptName) {
    return this.log({
      action: 'create',
      module: 'department',
      targetId: deptId,
      targetName: deptName,
      details: `建立部門：${deptName}`
    });
  }

  logUpdateDepartment(deptId, deptName, changes = null) {
    return this.log({
      action: 'update',
      module: 'department',
      targetId: deptId,
      targetName: deptName,
      details: `更新部門：${deptName}`,
      changes
    });
  }

  logDeleteDepartment(deptId, deptName) {
    return this.log({
      action: 'delete',
      module: 'department',
      targetId: deptId,
      targetName: deptName,
      details: `刪除部門：${deptName}`
    });
  }
}

// 匯出單例
export const auditLogger = new AuditLogger();
