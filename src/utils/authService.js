import { storage } from './storage.js';
import { UserModel, DepartmentModel } from './dataModel.js';
import { auditLogger } from './auditLogger.js';

/**
 * 認證服務
 */
export class AuthService {
  constructor() {
    this.currentUser = null;
    this.initialized = false;
    // 延遲初始化，避免循環依賴問題
    this.init();
  }

  /**
   * 初始化認證服務
   */
  init() {
    // 從 storage 載入當前使用者
    const savedUser = storage.get('currentUser');
    if (savedUser) {
      this.currentUser = savedUser;
    }

    // 使用 setTimeout 延遲初始化測試帳號，確保 dataModel 完全載入
    setTimeout(() => {
      this.initializeDefaultUsers();
    }, 0);
  }

  /**
   * 初始化預設測試帳號
   * 此方法可以被重複調用，會自動檢查是否已初始化
   */
  initializeDefaultUsers() {
    try {
      const users = UserModel.getAll();

      // 如果已經有使用者，不需要初始化
      if (users && users.length > 0) {
        console.log(`✓ 已有 ${users.length} 個使用者，跳過初始化`);
        return;
      }
    } catch (error) {
      console.warn('檢查使用者時發生錯誤，將重新初始化:', error);
    }

    console.log('🔧 開始初始化預設測試帳號...');

    // 建立測試部門
    const departments = [
      new DepartmentModel({ name: 'IT部', description: '資訊技術部' }),
      new DepartmentModel({ name: '製造部', description: '生產製造部' }),
      new DepartmentModel({ name: '品保部', description: '品質保證部' })
    ];
    departments.forEach(dept => {
      dept.save();
      console.log(`  ✓ 建立部門: ${dept.name}`);
    });

    // 建立測試使用者
    const testUsers = [
      new UserModel({
        account: 'admin',
        name: '系統管理員',
        employeeId: 'EMP0000',
        department: 'IT部',
        role: '系統管理員',
        email: 'admin@example.com',
        status: '在職'
      }),
      new UserModel({
        account: 'user001',
        name: '張三',
        employeeId: 'EMP0001',
        department: '製造部',
        role: '一般員工',
        email: 'user001@example.com',
        status: '在職'
      }),
      new UserModel({
        account: 'user002',
        name: '李四',
        employeeId: 'EMP0002',
        department: '製造部',
        role: '主管',
        email: 'user002@example.com',
        status: '在職'
      }),
      new UserModel({
        account: 'user003',
        name: '王五',
        employeeId: 'EMP0003',
        department: '品保部',
        role: '主管',
        email: 'user003@example.com',
        status: '在職'
      })
    ];

    testUsers.forEach(user => {
      user.save();
      console.log(`  ✓ 建立使用者: ${user.account} (${user.name} - ${user.role})`);
    });

    console.log('✅ 測試帳號初始化完成！');
    console.log('   管理員：admin / admin');
    console.log('   主管：user002 / user002');
    console.log('   員工：user001 / user001');
  }

  /**
   * 登入
   */
  login(username, password) {
    const users = UserModel.getAll();
    const user = users.find(u => u.account === username);

    if (!user) {
      auditLogger.logLogin(username, false);

      // 列出可用帳號供除錯
      const availableAccounts = users.slice(0, 5).map(u => `${u.account} (${u.role})`).join(', ');
      console.log(`❌ 帳號 "${username}" 不存在`);
      console.log(`💡 可用帳號範例: ${availableAccounts}`);

      throw new Error(`帳號不存在。可用帳號: ${availableAccounts}`);
    }

    if (user.status !== '在職') {
      auditLogger.logLogin(username, false);
      throw new Error('此帳號已停用');
    }

    // 簡化版密碼驗證（實際應用應使用加密）
    // 預設密碼為帳號
    const defaultPassword = user.account;
    const storedPassword = user.password || defaultPassword;

    if (password !== storedPassword) {
      auditLogger.logLogin(username, false);
      throw new Error('密碼錯誤');
    }

    // 儲存使用者資訊
    this.currentUser = {
      id: user.id,
      account: user.account,
      name: user.name,
      department: user.department,
      role: user.role,
      email: user.email
    };

    storage.set('currentUser', this.currentUser);

    // 記錄登入成功
    auditLogger.logLogin(username, true);

    return this.currentUser;
  }

  /**
   * 登出
   */
  logout() {
    // 記錄登出
    auditLogger.logLogout();

    this.currentUser = null;
    storage.remove('currentUser');
  }

  /**
   * 取得當前使用者
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * 設定當前使用者（用於測試或切換使用者）
   */
  setCurrentUser(user) {
    this.currentUser = {
      id: user.id,
      account: user.account || user.employeeId,
      name: user.name,
      department: user.department,
      role: user.role,
      email: user.email,
      employeeId: user.employeeId,
      position: user.position
    };
    storage.set('currentUser', this.currentUser);
  }

  /**
   * 是否已登入
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * 檢查是否為主管
   */
  isManager() {
    return this.currentUser && this.currentUser.role === '主管';
  }

  /**
   * 檢查是否為管理員
   */
  isAdmin() {
    return this.currentUser && this.currentUser.role === '系統管理員';
  }

  /**
   * 修改密碼
   */
  changePassword(oldPassword, newPassword) {
    if (!this.isAuthenticated()) {
      throw new Error('請先登入');
    }

    const users = UserModel.getAll();
    const userIndex = users.findIndex(u => u.id === this.currentUser.id);

    if (userIndex === -1) {
      throw new Error('使用者不存在');
    }

    const user = users[userIndex];
    const currentPassword = user.password || user.account;

    if (oldPassword !== currentPassword) {
      throw new Error('舊密碼錯誤');
    }

    // 更新密碼
    user.password = newPassword;
    const userModel = new UserModel(user);
    userModel.save();

    return true;
  }

  /**
   * 重設密碼（管理員功能）
   */
  resetPassword(userId) {
    if (!this.isAdmin()) {
      throw new Error('權限不足');
    }

    const user = UserModel.getById(userId);
    if (!user) {
      throw new Error('使用者不存在');
    }

    // 重設為預設密碼（帳號）
    delete user.password;
    const userModel = new UserModel(user);
    userModel.save();

    return true;
  }
}

// 匯出單例
export const authService = new AuthService();
