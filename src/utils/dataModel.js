import { storage } from './storage.js';
import { formVersionControl } from './versionControl.js';

// 產生唯一 ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 產生申請編號 (格式: YYYYMMDD-XXX)
export function generateApplicationNo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // 取得今日已有的申請單
  const instances = storage.get('formInstances', []);
  const todayInstances = instances.filter(i => {
    if (!i.applicationNo) return false;
    return i.applicationNo.startsWith(dateStr);
  });

  // 計算今日流水號
  const serialNo = todayInstances.length + 1;
  const serialStr = String(serialNo).padStart(3, '0');

  return `${dateStr}-${serialStr}`;
}

// 表單定義模型
export class FormModel {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.fields = data.fields || [];
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();

    // Golden Recipe 相關屬性
    this.goldenScore = data.goldenScore;
    this.qualityStats = data.qualityStats;
    this.isGolden = data.isGolden;
    this.goldenCertifiedAt = data.goldenCertifiedAt;
    this.goldenCertifiedBy = data.goldenCertifiedBy;
    this.goldenCertificationReason = data.goldenCertificationReason;
    this.goldenReviewedBy = data.goldenReviewedBy;
    this.goldenDegradedAt = data.goldenDegradedAt;
    this.goldenDegradedReason = data.goldenDegradedReason;

    // 其他可能的屬性（從 data 中複製所有其他屬性）
    Object.keys(data).forEach(key => {
      if (!(key in this)) {
        this[key] = data[key];
      }
    });
  }

  save(versionComment = '') {
    this.updatedAt = Date.now();
    const forms = storage.get('forms', []);
    const index = forms.findIndex(f => f.id === this.id);

    const isUpdate = index >= 0;
    const isNew = !isUpdate;

    if (isUpdate) {
      forms[index] = this;
    } else {
      forms.push(this);
    }

    storage.set('forms', forms);

    // 儲存版本：
    // 1. 有版本註解時一定儲存（包含新建和更新）
    // 2. 或者是更新時儲存（即使沒有註解）
    // 修正：新建時若有 versionComment，也要儲存版本
    const shouldSaveVersion = versionComment || isUpdate;
    if (shouldSaveVersion) {
      const comment = versionComment || (isUpdate ? '更新配方' : '建立配方');

      // 將 FormModel 實例轉換為純物件，避免儲存類別方法
      const plainData = JSON.parse(JSON.stringify(this));
      formVersionControl.saveVersion(this.id, plainData, comment);
    }

    return this;
  }

  // 取得版本歷史
  getVersions() {
    return formVersionControl.getVersions(this.id);
  }

  // 回滾到指定版本
  rollbackToVersion(versionNumber) {
    const data = formVersionControl.rollback(this.id, versionNumber);
    Object.assign(this, data);
    return this.save(`回滾到版本 ${versionNumber}`);
  }

  static getAll() {
    return storage.get('forms', []).map(f => new FormModel(f));
  }

  static getById(id) {
    const forms = storage.get('forms', []);
    const form = forms.find(f => f.id === id);
    return form ? new FormModel(form) : null;
  }

  static delete(id) {
    const forms = storage.get('forms', []);
    const filtered = forms.filter(f => f.id !== id);
    storage.set('forms', filtered);
  }
}

// 流程定義模型
export class WorkflowModel {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.name = data.name || '';
    this.formId = data.formId || '';
    this.nodes = data.nodes || [];
    this.connections = data.connections || [];
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  save() {
    this.updatedAt = Date.now();
    const workflows = storage.get('workflows', []);
    const index = workflows.findIndex(w => w.id === this.id);

    if (index >= 0) {
      workflows[index] = this;
    } else {
      workflows.push(this);
    }

    storage.set('workflows', workflows);
    return this;
  }

  static getAll() {
    return storage.get('workflows', []).map(w => new WorkflowModel(w));
  }

  static getById(id) {
    const workflows = storage.get('workflows', []);
    const workflow = workflows.find(w => w.id === id);
    return workflow ? new WorkflowModel(workflow) : null;
  }

  static getByFormId(formId) {
    const workflows = storage.get('workflows', []);
    return workflows.filter(w => w.formId === formId).map(w => new WorkflowModel(w));
  }

  static delete(id) {
    const workflows = storage.get('workflows', []);
    const filtered = workflows.filter(w => w.id !== id);
    storage.set('workflows', filtered);
  }
}

// 表單實例模型
export class FormInstanceModel {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.number = data.number || data.applicationNo || ''; // 申請編號 (YYYYMMDD-XXX)
    this.applicationNo = data.applicationNo || data.number || ''; // 相容舊版
    this.formId = data.formId || '';
    this.formName = data.formName || ''; // 表單名稱（用於報表顯示）
    this.workflowId = data.workflowId || '';
    this.workflowName = data.workflowName || ''; // 流程名稱（用於報表顯示）
    this.applicant = data.applicant || '';
    this.department = data.department || ''; // 申請人部門
    this.data = data.data || {};
    this.status = data.status || 'draft'; // draft, pending, approved, rejected
    this.currentNode = data.currentNode || '';
    this.currentNodeId = data.currentNodeId || data.currentNode || ''; // 相容新舊欄位
    this.history = data.history || [];
    this.parallelState = data.parallelState || {}; // 並簽狀態
    this.sequentialState = data.sequentialState || {}; // 串簽狀態
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  save() {
    this.updatedAt = Date.now();
    const instances = storage.get('formInstances', []);
    const index = instances.findIndex(i => i.id === this.id);

    if (index >= 0) {
      instances[index] = this;
    } else {
      instances.push(this);
    }

    storage.set('formInstances', instances);
    return this;
  }

  static getAll() {
    return storage.get('formInstances', []).map(i => new FormInstanceModel(i));
  }

  static getById(id) {
    const instances = storage.get('formInstances', []);
    const instance = instances.find(i => i.id === id);
    return instance ? new FormInstanceModel(instance) : null;
  }

  static delete(id) {
    const instances = storage.get('formInstances', []);
    const filtered = instances.filter(i => i.id !== id);
    storage.set('formInstances', filtered);
  }
}

// 簽核記錄模型
export class ApprovalHistoryModel {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.instanceId = data.instanceId || '';
    this.nodeId = data.nodeId || '';
    this.nodeName = data.nodeName || '';
    this.userId = data.userId || '';
    this.userName = data.userName || '';
    this.approver = data.approver || data.userName || ''; // 相容舊欄位
    this.action = data.action || ''; // approve, reject, return, submit, complete
    this.comment = data.comment || '';
    this.result = data.result || data.action || ''; // approved, rejected, submitted
    this.timestamp = data.timestamp || Date.now();
  }

  save() {
    const history = storage.get('approvalHistory', []);
    history.push(this);
    storage.set('approvalHistory', history);
    return this;
  }

  static getAll() {
    return storage.get('approvalHistory', []).map(h => new ApprovalHistoryModel(h));
  }

  static getByInstanceId(instanceId) {
    const history = storage.get('approvalHistory', []);
    return history
      .filter(h => h.instanceId === instanceId)
      .map(h => new ApprovalHistoryModel(h));
  }
}

// 人員管理函數
export function getUsers() {
  const users = storage.get('users', []);

  // 如果沒有用戶資料，初始化一些測試資料
  if (users.length === 0) {
    const testUsers = [
      {
        id: '1',
        name: '王小明',
        employeeId: 'EMP001',
        department: '資訊部',
        position: '系統工程師',
        email: 'wang@example.com',
        phone: '0912-345-678',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: '李美華',
        employeeId: 'EMP002',
        department: '人力資源部',
        position: 'HR 主管',
        email: 'lee@example.com',
        phone: '0923-456-789',
        role: 'manager',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: '張志強',
        employeeId: 'EMP003',
        department: '財務部',
        position: '財務經理',
        email: 'chang@example.com',
        phone: '0934-567-890',
        role: 'manager',
        status: 'active',
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        name: '陳管理員',
        employeeId: 'ADMIN001',
        department: '資訊部',
        position: '系統管理員',
        email: 'admin@example.com',
        phone: '0945-678-901',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ];
    storage.set('users', testUsers);
    return testUsers;
  }

  return users;
}

export function saveUser(user) {
  const users = storage.get('users', []);
  const index = users.findIndex(u => u.id === user.id);
  const isEdit = index >= 0;

  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }

  storage.set('users', users);

  // 記錄操作日誌（延遲導入避免循環依賴）
  import('./auditLogger.js').then(({ auditLogger }) => {
    if (isEdit) {
      auditLogger.logUpdateUser(user.id, user.name);
    } else {
      auditLogger.logCreateUser(user.id, user.name);
    }
  });

  return user;
}

export function deleteUser(userId) {
  const users = storage.get('users', []);
  const user = users.find(u => u.id === userId);
  const filtered = users.filter(u => u.id !== userId);
  storage.set('users', filtered);

  // 記錄操作日誌
  if (user) {
    import('./auditLogger.js').then(({ auditLogger }) => {
      auditLogger.logDeleteUser(userId, user.name);
    });
  }
}

export function getUserById(userId) {
  const users = storage.get('users', []);
  return users.find(u => u.id === userId);
}

// 部門管理函數
export function getDepartments() {
  const storedDepts = storage.get('departments', null);

  // 如果沒有部門資料，從現有用戶中提取部門並添加預設部門
  if (!storedDepts) {
    const users = storage.get('users', []);
    const userDepts = [...new Set(users.map(u => u.department).filter(Boolean))];
    const defaultDepts = [
      '資訊部',
      '人力資源部',
      '財務部',
      '業務部',
      '行政部',
      '研發部'
    ];

    // 合併並去重
    const allDepts = [...new Set([...userDepts, ...defaultDepts])];
    storage.set('departments', allDepts);
    return allDepts;
  }

  return storedDepts;
}

export function saveDepartment(department) {
  const departments = storage.get('departments', []);
  const isNew = !departments.includes(department);

  if (isNew) {
    departments.push(department);
    storage.set('departments', departments);

    // 記錄操作日誌
    import('./auditLogger.js').then(({ auditLogger }) => {
      auditLogger.logCreateDepartment('dept_' + department, department);
    });
  }

  return departments;
}

export function deleteDepartment(department) {
  const departments = storage.get('departments', []);
  const filtered = departments.filter(d => d !== department);
  storage.set('departments', filtered);

  // 記錄操作日誌
  import('./auditLogger.js').then(({ auditLogger }) => {
    auditLogger.logDeleteDepartment('dept_' + department, department);
  });

  return filtered;
}

// 使用者模型
export class UserModel {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.account = data.account || '';
    this.name = data.name || '';
    this.employeeId = data.employeeId || '';
    this.department = data.department || '';
    this.position = data.position || '';
    this.role = data.role || '一般員工'; // 一般員工, 主管, 系統管理員
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.status = data.status || '在職'; // 在職, 離職
    this.password = data.password; // 可選，未設定則使用帳號作為密碼
    this.assignedStations = data.assignedStations || []; // 分配的站點 ID 列表
    this.primaryStation = data.primaryStation || null; // 主要負責站點
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  save() {
    this.updatedAt = Date.now();
    const users = storage.get('users', []);
    const index = users.findIndex(u => u.id === this.id);

    if (index >= 0) {
      users[index] = this;
    } else {
      users.push(this);
    }

    storage.set('users', users);
    return this;
  }

  delete() {
    const users = storage.get('users', []);
    const filtered = users.filter(u => u.id !== this.id);
    storage.set('users', filtered);
  }

  static getAll() {
    return storage.get('users', []).map(u => new UserModel(u));
  }

  static getById(id) {
    const users = storage.get('users', []);
    const user = users.find(u => u.id === id);
    return user ? new UserModel(user) : null;
  }

  static getByAccount(account) {
    const users = storage.get('users', []);
    const user = users.find(u => u.account === account);
    return user ? new UserModel(user) : null;
  }

  // 分配站點給用戶
  assignStation(stationId, isPrimary = false) {
    if (!this.assignedStations.includes(stationId)) {
      this.assignedStations.push(stationId);
    }
    if (isPrimary) {
      this.primaryStation = stationId;
    }
    return this.save();
  }

  // 移除站點分配
  unassignStation(stationId) {
    this.assignedStations = this.assignedStations.filter(id => id !== stationId);
    if (this.primaryStation === stationId) {
      this.primaryStation = this.assignedStations.length > 0 ? this.assignedStations[0] : null;
    }
    return this.save();
  }

  // 檢查是否有權限存取某站點
  hasStationAccess(stationId) {
    // 系統管理員和主管可以存取所有站點
    if (this.role === '系統管理員' || this.role === '主管') {
      return true;
    }
    // 一般員工只能存取分配的站點
    return this.assignedStations.includes(stationId);
  }

  // 取得指定站點的所有作業員
  static getOperatorsByStation(stationId) {
    const users = storage.get('users', []);
    return users
      .filter(u => {
        const user = new UserModel(u);
        return user.hasStationAccess(stationId);
      })
      .map(u => new UserModel(u));
  }

  // 取得所有作業員（有站點分配的一般員工）
  static getAllOperators() {
    const users = storage.get('users', []);
    return users
      .filter(u => u.role === '一般員工' && u.assignedStations && u.assignedStations.length > 0)
      .map(u => new UserModel(u));
  }
}

// 部門模型
export class DepartmentModel {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  save() {
    this.updatedAt = Date.now();
    const departments = storage.get('departments', []);
    const index = departments.findIndex(d => d.id === this.id);

    if (index >= 0) {
      departments[index] = this;
    } else {
      departments.push(this);
    }

    storage.set('departments', departments);
    return this;
  }

  delete() {
    const departments = storage.get('departments', []);
    const filtered = departments.filter(d => d.id !== this.id);
    storage.set('departments', filtered);
  }

  static getAll() {
    return storage.get('departments', []).map(d => new DepartmentModel(d));
  }

  static getById(id) {
    const departments = storage.get('departments', []);
    const dept = departments.find(d => d.id === id);
    return dept ? new DepartmentModel(dept) : null;
  }

  static getByName(name) {
    const departments = storage.get('departments', []);
    const dept = departments.find(d => d.name === name);
    return dept ? new DepartmentModel(dept) : null;
  }
}

// 操作日誌模型
export class AuditLogModel {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.timestamp = data.timestamp || Date.now();
    this.userId = data.userId || '';
    this.userName = data.userName || '';
    this.userAccount = data.userAccount || '';
    this.action = data.action || ''; // login, logout, create, update, delete, approve, reject, submit, withdraw
    this.module = data.module || ''; // form, workflow, application, user, department, auth
    this.targetId = data.targetId || '';
    this.targetName = data.targetName || '';
    this.result = data.result || 'success'; // success, failure
    this.ipAddress = data.ipAddress || '';
    this.details = data.details || ''; // 詳細資訊或錯誤訊息
    this.changes = data.changes || null; // 變更內容（舊值 -> 新值）
  }

  save() {
    const logs = storage.get('auditLogs', []);
    logs.push(this);
    storage.set('auditLogs', logs);
    return this;
  }

  static getAll() {
    return storage.get('auditLogs', []).map(log => new AuditLogModel(log));
  }

  static getByDateRange(startDate, endDate) {
    const logs = storage.get('auditLogs', []);
    return logs
      .filter(log => log.timestamp >= startDate && log.timestamp <= endDate)
      .map(log => new AuditLogModel(log));
  }

  static getByUser(userId) {
    const logs = storage.get('auditLogs', []);
    return logs
      .filter(log => log.userId === userId)
      .map(log => new AuditLogModel(log));
  }

  static getByModule(module) {
    const logs = storage.get('auditLogs', []);
    return logs
      .filter(log => log.module === module)
      .map(log => new AuditLogModel(log));
  }

  static getByAction(action) {
    const logs = storage.get('auditLogs', []);
    return logs
      .filter(log => log.action === action)
      .map(log => new AuditLogModel(log));
  }

  static search(keyword) {
    const logs = storage.get('auditLogs', []);
    const lowerKeyword = keyword.toLowerCase();
    return logs
      .filter(log => {
        return (
          log.userName?.toLowerCase().includes(lowerKeyword) ||
          log.userAccount?.toLowerCase().includes(lowerKeyword) ||
          log.targetName?.toLowerCase().includes(lowerKeyword) ||
          log.details?.toLowerCase().includes(lowerKeyword) ||
          log.action?.toLowerCase().includes(lowerKeyword) ||
          log.module?.toLowerCase().includes(lowerKeyword)
        );
      })
      .map(log => new AuditLogModel(log));
  }

  static clear() {
    storage.set('auditLogs', []);
  }

  /**
   * 清理超過指定天數的日誌
   * @param {number} days - 保留天數，預設30天
   */
  static cleanOldLogs(days = 30) {
    const logs = storage.get('auditLogs', []);
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const filteredLogs = logs.filter(log => log.timestamp >= cutoffTime);

    const removedCount = logs.length - filteredLogs.length;
    if (removedCount > 0) {
      storage.set('auditLogs', filteredLogs);
      console.log(`已清理 ${removedCount} 筆超過 ${days} 天的日誌`);
    }

    return removedCount;
  }

  /**
   * 自動清理過期日誌（在每次讀取時執行）
   */
  static autoClean() {
    const lastCleanTime = storage.get('lastLogCleanTime', 0);
    const now = Date.now();
    // 每天最多清理一次
    if (now - lastCleanTime > 24 * 60 * 60 * 1000) {
      this.cleanOldLogs(30);
      storage.set('lastLogCleanTime', now);
    }
  }
}
