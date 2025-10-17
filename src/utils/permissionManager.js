import { authService } from './authService.js';
import {
  PAGE_PERMISSIONS,
  ACTION_PERMISSIONS,
  getPagePermissionByPath
} from '../config/permissions.config.js';
import {
  getRoleByName,
  getAllRolesWithCustom,
  ROLE_NAME_MAPPING
} from '../config/roles.config.js';

/**
 * 權限管理器
 * 使用權限表與角色配置實現靈活的權限控制
 */
export class PermissionManager {
  constructor() {
    // 快取角色權限資料
    this._roleCache = new Map();
  }

  /**
   * 取得使用者的角色定義
   */
  _getUserRole() {
    const user = authService.getCurrentUser();
    if (!user) return null;

    // 支援舊版角色名稱
    const roleId = ROLE_NAME_MAPPING[user.role] || user.role;

    // 先檢查系統角色
    let role = getRoleByName(user.role);

    // 如果沒找到，檢查自訂角色
    if (!role) {
      const allRoles = getAllRolesWithCustom();
      role = allRoles.find(r => r.id === roleId || r.name === user.role);
    }

    return role;
  }

  /**
   * 取得使用者的所有權限代碼
   */
  _getUserPermissions() {
    const role = this._getUserRole();
    if (!role) return [];

    // 檢查快取
    if (this._roleCache.has(role.id)) {
      return this._roleCache.get(role.id);
    }

    // 儲存到快取
    this._roleCache.set(role.id, role.permissions);
    return role.permissions;
  }

  /**
   * 清除權限快取（當角色權限更新時呼叫）
   */
  clearCache() {
    this._roleCache.clear();
  }

  /**
   * 檢查當前使用者是否有特定權限
   * @param {string} permissionCode - 權限代碼
   * @returns {boolean}
   */
  hasPermission(permissionCode) {
    const permissions = this._getUserPermissions();
    return permissions.includes(permissionCode);
  }

  /**
   * 檢查當前使用者是否有權限訪問頁面
   * @param {string} page - 頁面路徑
   * @returns {boolean}
   */
  canAccessPage(page) {
    const user = authService.getCurrentUser();
    if (!user) return false;

    // 根據路徑取得權限代碼
    const permissionCode = getPagePermissionByPath(page);
    if (!permissionCode) {
      console.warn(`No permission defined for page: ${page}`);
      return false;
    }

    return this.hasPermission(permissionCode);
  }

  /**
   * 檢查當前使用者是否有權限執行動作
   * @param {string} actionCode - 功能權限代碼（例如：'action:create-form'）
   * @returns {boolean}
   */
  canPerformAction(actionCode) {
    const user = authService.getCurrentUser();
    if (!user) return false;

    // 支援舊版 action 名稱（使用底線）
    const legacyActionMap = {
      'create_form': ACTION_PERMISSIONS.CREATE_FORM.code,
      'edit_form': ACTION_PERMISSIONS.EDIT_FORM.code,
      'edit_own_form': ACTION_PERMISSIONS.EDIT_OWN_FORM.code,
      'delete_form': ACTION_PERMISSIONS.DELETE_FORM.code,
      'view_forms': ACTION_PERMISSIONS.VIEW_FORMS.code,
      'approve_application': ACTION_PERMISSIONS.APPROVE_APPLICATION.code,
      'reject_application': ACTION_PERMISSIONS.REJECT_APPLICATION.code,
      'certify_golden_recipe': ACTION_PERMISSIONS.CERTIFY_GOLDEN.code,
      'view_spc_data': ACTION_PERMISSIONS.VIEW_SPC.code,
      'manage_users': ACTION_PERMISSIONS.MANAGE_USERS.code,
      'manage_departments': ACTION_PERMISSIONS.MANAGE_DEPARTMENTS.code,
      'view_logs': ACTION_PERMISSIONS.VIEW_LOGS.code,
      'manage_templates': ACTION_PERMISSIONS.EDIT_TEMPLATE.code,
      'manage_industry_config': ACTION_PERMISSIONS.MANAGE_INDUSTRY_CONFIG.code,
      'run_tests': ACTION_PERMISSIONS.RUN_TESTS.code,
      'use_simulator': ACTION_PERMISSIONS.USE_SIMULATOR.code
    };

    // 如果是舊版格式，轉換為新格式
    const actualCode = legacyActionMap[actionCode] || actionCode;

    return this.hasPermission(actualCode);
  }

  /**
   * 取得當前使用者可訪問的選單項目
   * @returns {Array} - 選單項目陣列，分組結構
   */
  getAccessibleMenu() {
    const user = authService.getCurrentUser();
    if (!user) return [];

    // MSW 濾網再生製造系統 - 選單結構
    const menuStructure = [
      {
        title: '工作區',
        items: [
          { path: PAGE_PERMISSIONS.HOME.path, label: '📊 總覽' }
        ]
      },
      {
        title: 'MES 製程管理',
        items: [
          { path: PAGE_PERMISSIONS.FORMS.path, label: '📝 工單管理' },
          { path: PAGE_PERMISSIONS.DISPATCH.path, label: '🏭 生管派工' },
          { path: PAGE_PERMISSIONS.STATIONS.path, label: '⚙️ 製程站點' },
          { path: PAGE_PERMISSIONS.CHANGE_REQUESTS.path, label: '📋 工單異動審核' }
        ]
      },
      {
        title: 'WMS 倉儲物流',
        items: [
          { path: PAGE_PERMISSIONS.WMS.path, label: '📦 倉儲管理' },
          { path: PAGE_PERMISSIONS.ENERGY.path, label: '⚡ 能源管理' }
        ]
      },
      {
        title: 'SPC 品質管理',
        items: [
          { path: PAGE_PERMISSIONS.GOLDEN.path, label: '🏆 Golden Recipe' },
          { path: PAGE_PERMISSIONS.SPC.path, label: '📊 SPC 統計製程管制' }
        ]
      },
      {
        title: '系統管理',
        items: [
          { path: PAGE_PERMISSIONS.USERS.path, label: '👥 人員管理' },
          { path: PAGE_PERMISSIONS.DEPARTMENTS.path, label: '🏢 部門管理' },
          { path: PAGE_PERMISSIONS.REPORTS.path, label: '📈 報表中心' },
          { path: PAGE_PERMISSIONS.PERMISSIONS.path, label: '🔐 權限管理' },
          { path: PAGE_PERMISSIONS.SYSTEM_CONFIG.path, label: '⚙️ 系統設定' }
        ]
      },
      {
        title: '開發工具',
        items: [
          { path: PAGE_PERMISSIONS.TESTS.path, label: '🧪 測試中心' },
          { path: PAGE_PERMISSIONS.SIMULATOR.path, label: '🎮 系統模擬器' }
        ]
      }
    ];

    // 過濾選單項目（使用新的權限檢查機制）
    const accessibleMenu = menuStructure.map(section => {
      const accessibleItems = section.items.filter(item => {
        return this.canAccessPage(item.path);
      });

      return {
        title: section.title,
        items: accessibleItems
      };
    }).filter(section => section.items.length > 0); // 移除空的區塊

    return accessibleMenu;
  }

  /**
   * 取得使用者角色顯示名稱
   * @returns {string}
   */
  getUserRoleLabel() {
    const user = authService.getCurrentUser();
    if (!user) return '訪客';

    const role = this._getUserRole();
    return role ? role.displayName : user.role;
  }

  /**
   * 取得使用者角色徽章顏色
   * @returns {string}
   */
  getUserRoleBadgeColor() {
    const user = authService.getCurrentUser();
    if (!user) return 'gray';

    const role = this._getUserRole();
    return role ? role.color : 'gray';
  }

  /**
   * 取得使用者角色完整資訊
   * @returns {Object|null}
   */
  getUserRoleInfo() {
    return this._getUserRole();
  }

  /**
   * 檢查是否為自己的資源
   * @param {string} resourceUserId - 資源擁有者 ID
   * @returns {boolean}
   */
  isOwnResource(resourceUserId) {
    const user = authService.getCurrentUser();
    if (!user) return false;

    return user.id === resourceUserId;
  }

  /**
   * 檢查是否可編輯配方
   * @param {Object} form - 配方物件
   * @returns {boolean}
   */
  canEditForm(form) {
    const user = authService.getCurrentUser();
    if (!user) return false;

    // 檢查是否有編輯配方權限
    if (this.canPerformAction(ACTION_PERMISSIONS.EDIT_FORM.code)) {
      return true;
    }

    // 檢查是否有編輯自己配方的權限
    if (this.canPerformAction(ACTION_PERMISSIONS.EDIT_OWN_FORM.code)) {
      return this.isOwnResource(form.createdBy || form.userId);
    }

    return false;
  }

  /**
   * 檢查是否可刪除配方
   * @param {Object} form - 配方物件
   * @returns {boolean}
   */
  canDeleteForm(form) {
    const user = authService.getCurrentUser();
    if (!user) return false;

    // 檢查是否有刪除配方權限
    return this.canPerformAction(ACTION_PERMISSIONS.DELETE_FORM.code);
  }

  /**
   * 取得所有角色列表（含自訂角色）
   * @returns {Array}
   */
  getAllRoles() {
    return getAllRolesWithCustom();
  }

  /**
   * 取得頁面權限定義
   * @returns {Object}
   */
  getPagePermissions() {
    return PAGE_PERMISSIONS;
  }

  /**
   * 取得功能權限定義
   * @returns {Object}
   */
  getActionPermissions() {
    return ACTION_PERMISSIONS;
  }
}

// 匯出單例
export const permissionManager = new PermissionManager();
