/**
 * 角色定義檔
 * 定義系統中的角色及其對應的權限
 */

import { PAGE_PERMISSIONS, ACTION_PERMISSIONS } from './permissions.config.js';

/**
 * 角色定義
 * 每個角色包含：
 * - id: 角色 ID
 * - name: 角色名稱
 * - displayName: 顯示名稱（簡短）
 * - description: 角色描述
 * - color: 徽章顏色
 * - permissions: 權限代碼陣列
 * - isSystem: 是否為系統內建角色（不可刪除）
 */
export const ROLES = {
  SYSTEM_ADMIN: {
    id: 'system-admin',
    name: '系統管理員',
    displayName: '管理員',
    description: '擁有系統最高權限，可管理所有功能與資源',
    color: 'red',
    isSystem: true,
    permissions: [
      // 所有頁面權限
      PAGE_PERMISSIONS.HOME.code,
      PAGE_PERMISSIONS.FORMS.code,
      PAGE_PERMISSIONS.FORM_BUILDER.code,
      PAGE_PERMISSIONS.GOLDEN.code,
      PAGE_PERMISSIONS.SPC.code,
      PAGE_PERMISSIONS.APPLY.code,
      PAGE_PERMISSIONS.APPROVAL.code,
      PAGE_PERMISSIONS.WMS.code,
      PAGE_PERMISSIONS.ENERGY.code,
      PAGE_PERMISSIONS.STATIONS.code,
      PAGE_PERMISSIONS.CHANGE_REQUESTS.code,
      PAGE_PERMISSIONS.DISPATCH.code,
      PAGE_PERMISSIONS.USERS.code,
      PAGE_PERMISSIONS.DEPARTMENTS.code,
      PAGE_PERMISSIONS.REPORTS.code,
      PAGE_PERMISSIONS.LOGS.code,
      PAGE_PERMISSIONS.PERMISSIONS.code,
      PAGE_PERMISSIONS.SYSTEM_CONFIG.code,
      PAGE_PERMISSIONS.TESTS.code,
      PAGE_PERMISSIONS.SIMULATOR.code,

      // 所有功能權限
      ACTION_PERMISSIONS.CREATE_FORM.code,
      ACTION_PERMISSIONS.EDIT_FORM.code,
      ACTION_PERMISSIONS.DELETE_FORM.code,
      ACTION_PERMISSIONS.VIEW_FORMS.code,
      ACTION_PERMISSIONS.EXPORT_FORM.code,
      ACTION_PERMISSIONS.APPROVE_APPLICATION.code,
      ACTION_PERMISSIONS.REJECT_APPLICATION.code,
      ACTION_PERMISSIONS.CERTIFY_GOLDEN.code,
      ACTION_PERMISSIONS.REVOKE_GOLDEN.code,
      ACTION_PERMISSIONS.VIEW_SPC.code,
      ACTION_PERMISSIONS.EDIT_SPC.code,
      ACTION_PERMISSIONS.DELETE_SPC.code,
      ACTION_PERMISSIONS.MANAGE_USERS.code,
      ACTION_PERMISSIONS.MANAGE_DEPARTMENTS.code,
      ACTION_PERMISSIONS.VIEW_REPORTS.code,
      ACTION_PERMISSIONS.VIEW_LOGS.code,
      ACTION_PERMISSIONS.MANAGE_PERMISSIONS.code,
      ACTION_PERMISSIONS.RUN_TESTS.code,
      ACTION_PERMISSIONS.USE_SIMULATOR.code
    ]
  },

  MANAGER: {
    id: 'manager',
    name: '主管',
    displayName: '主管',
    description: '部門主管，可審核配方、查看報表、管理團隊資源',
    color: 'blue',
    isSystem: true,
    permissions: [
      // 頁面權限
      PAGE_PERMISSIONS.HOME.code,
      PAGE_PERMISSIONS.FORMS.code,
      PAGE_PERMISSIONS.FORM_BUILDER.code,
      PAGE_PERMISSIONS.GOLDEN.code,
      PAGE_PERMISSIONS.SPC.code,
      PAGE_PERMISSIONS.APPLY.code,
      PAGE_PERMISSIONS.APPROVAL.code,
      PAGE_PERMISSIONS.WMS.code,
      PAGE_PERMISSIONS.ENERGY.code,
      PAGE_PERMISSIONS.STATIONS.code,
      PAGE_PERMISSIONS.CHANGE_REQUESTS.code,
      PAGE_PERMISSIONS.DISPATCH.code,
      PAGE_PERMISSIONS.REPORTS.code,
      PAGE_PERMISSIONS.TESTS.code,
      PAGE_PERMISSIONS.SIMULATOR.code,

      // 功能權限
      ACTION_PERMISSIONS.CREATE_FORM.code,
      ACTION_PERMISSIONS.EDIT_FORM.code,
      ACTION_PERMISSIONS.VIEW_FORMS.code,
      ACTION_PERMISSIONS.EXPORT_FORM.code,
      ACTION_PERMISSIONS.APPROVE_APPLICATION.code,
      ACTION_PERMISSIONS.REJECT_APPLICATION.code,
      ACTION_PERMISSIONS.CERTIFY_GOLDEN.code,
      ACTION_PERMISSIONS.VIEW_SPC.code,
      ACTION_PERMISSIONS.EDIT_SPC.code,
      ACTION_PERMISSIONS.VIEW_REPORTS.code
    ]
  },

  EMPLOYEE: {
    id: 'employee',
    name: '一般員工',
    displayName: '員工',
    description: '一般使用者，可建立配方、提交申請、查看自己的資源',
    color: 'green',
    isSystem: true,
    permissions: [
      // 頁面權限
      PAGE_PERMISSIONS.HOME.code,
      PAGE_PERMISSIONS.FORMS.code,
      PAGE_PERMISSIONS.FORM_BUILDER.code,
      PAGE_PERMISSIONS.GOLDEN.code,
      PAGE_PERMISSIONS.SPC.code,
      PAGE_PERMISSIONS.WMS.code,
      PAGE_PERMISSIONS.ENERGY.code,
      PAGE_PERMISSIONS.STATIONS.code,
      PAGE_PERMISSIONS.TESTS.code,
      PAGE_PERMISSIONS.SIMULATOR.code,

      // 功能權限
      ACTION_PERMISSIONS.CREATE_FORM.code,
      ACTION_PERMISSIONS.EDIT_OWN_FORM.code,
      ACTION_PERMISSIONS.VIEW_FORMS.code,
      ACTION_PERMISSIONS.VIEW_SPC.code,
      ACTION_PERMISSIONS.RUN_TESTS.code,
      ACTION_PERMISSIONS.USE_SIMULATOR.code
    ]
  }
};

/**
 * 角色名稱映射表（用於向後兼容舊的角色名稱）
 */
export const ROLE_NAME_MAPPING = {
  '系統管理員': ROLES.SYSTEM_ADMIN.id,
  '主管': ROLES.MANAGER.id,
  '組長': ROLES.MANAGER.id,  // 組長視為主管
  '課長': ROLES.MANAGER.id,  // 課長視為主管
  '經理': ROLES.MANAGER.id,  // 經理視為主管
  '一般員工': ROLES.EMPLOYEE.id
};

/**
 * 根據角色 ID 取得角色定義
 */
export function getRoleById(roleId) {
  return Object.values(ROLES).find(role => role.id === roleId);
}

/**
 * 根據角色名稱取得角色定義（支援舊名稱）
 */
export function getRoleByName(roleName) {
  // 先嘗試直接匹配
  const directMatch = Object.values(ROLES).find(role => role.name === roleName);
  if (directMatch) return directMatch;

  // 使用映射表轉換舊名稱
  const roleId = ROLE_NAME_MAPPING[roleName];
  if (roleId) return getRoleById(roleId);

  return null;
}

/**
 * 取得所有角色列表
 */
export function getAllRoles() {
  return Object.values(ROLES);
}

/**
 * 取得可編輯的角色列表（排除系統內建角色）
 */
export function getEditableRoles() {
  return Object.values(ROLES).filter(role => !role.isSystem);
}

/**
 * 檢查角色是否有特定權限
 */
export function roleHasPermission(roleId, permissionCode) {
  const role = getRoleById(roleId);
  if (!role) return false;

  return role.permissions.includes(permissionCode);
}

/**
 * 取得角色的所有頁面權限
 */
export function getRolePagePermissions(roleId) {
  const role = getRoleById(roleId);
  if (!role) return [];

  return role.permissions.filter(code => code.startsWith('page:'));
}

/**
 * 取得角色的所有功能權限
 */
export function getRoleActionPermissions(roleId) {
  const role = getRoleById(roleId);
  if (!role) return [];

  return role.permissions.filter(code => code.startsWith('action:'));
}

/**
 * 角色本地儲存 Key
 */
export const ROLES_STORAGE_KEY = 'rms_custom_roles';

/**
 * 從 localStorage 載入自訂角色
 */
export function loadCustomRoles() {
  try {
    const stored = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!stored) return [];

    const customRoles = JSON.parse(stored);
    return Array.isArray(customRoles) ? customRoles : [];
  } catch (error) {
    console.error('Failed to load custom roles:', error);
    return [];
  }
}

/**
 * 儲存自訂角色到 localStorage
 */
export function saveCustomRoles(customRoles) {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(customRoles));
    return true;
  } catch (error) {
    console.error('Failed to save custom roles:', error);
    return false;
  }
}

/**
 * 取得所有角色（包含自訂角色）
 */
export function getAllRolesWithCustom() {
  const systemRoles = getAllRoles();
  const customRoles = loadCustomRoles();
  return [...systemRoles, ...customRoles];
}
