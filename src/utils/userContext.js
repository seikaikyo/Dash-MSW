import { storage } from './storage.js';
import { UserModel } from './dataModel.js';

/**
 * 用戶上下文管理器
 * 負責管理當前登入用戶的資訊和權限
 */
class UserContext {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  // 初始化，從 storage 載入當前用戶
  init() {
    // 優先從 authService 的 currentUser 取得用戶 ID（與 Header 切換用戶整合）
    const authUser = storage.get('currentUser', null);
    if (authUser && authUser.id) {
      const user = UserModel.getById(authUser.id);
      if (user) {
        this.currentUser = user;
        // 同步更新 currentUserId 以保持一致性
        storage.set('currentUserId', user.id);
        return;
      }
    }

    // 備用方案：從 currentUserId 載入
    const savedUserId = storage.get('currentUserId', null);
    if (savedUserId) {
      const user = UserModel.getById(savedUserId);
      if (user) {
        this.currentUser = user;
        return;
      }
    }

    // 如果沒有當前用戶，設定一個預設的測試用戶（開發用）
    if (!this.currentUser) {
      const users = UserModel.getAll();
      if (users.length > 0) {
        this.setCurrentUser(users[0]);
      }
    }
  }

  // 設定當前用戶
  setCurrentUser(user) {
    if (user instanceof UserModel) {
      this.currentUser = user;
    } else {
      this.currentUser = new UserModel(user);
    }
    storage.set('currentUserId', this.currentUser.id);
  }

  // 取得當前用戶
  getCurrentUser() {
    return this.currentUser;
  }

  // 登出
  logout() {
    this.currentUser = null;
    storage.remove('currentUserId');
  }

  // 檢查當前用戶是否為管理員或主管
  isAdminOrManager() {
    if (!this.currentUser) return false;
    return this.currentUser.role === '系統管理員' || this.currentUser.role === '主管';
  }

  // 檢查當前用戶是否為一般員工
  isOperator() {
    if (!this.currentUser) return false;
    return this.currentUser.role === '一般員工';
  }

  // 取得當前用戶可存取的站點列表
  getAccessibleStations() {
    if (!this.currentUser) return [];

    // 管理員和主管可以存取所有站點
    if (this.isAdminOrManager()) {
      return null; // null 表示不限制
    }

    // 一般員工只能存取分配的站點
    return this.currentUser.assignedStations || [];
  }

  // 檢查當前用戶是否可以存取指定站點
  canAccessStation(stationId) {
    if (!this.currentUser) return false;
    return this.currentUser.hasStationAccess(stationId);
  }

  // 取得當前用戶的主要負責站點
  getPrimaryStation() {
    if (!this.currentUser) return null;
    return this.currentUser.primaryStation;
  }

  // 取得當前用戶的所有分配站點
  getAssignedStations() {
    if (!this.currentUser) return [];
    return this.currentUser.assignedStations || [];
  }

  // 刷新當前用戶資料（從 storage 重新載入）
  refresh() {
    if (this.currentUser) {
      const updatedUser = UserModel.getById(this.currentUser.id);
      if (updatedUser) {
        this.currentUser = updatedUser;
      }
    }
  }
}

// 單例模式
export const userContext = new UserContext();
