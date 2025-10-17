/**
 * 權限定義檔
 * 定義系統中所有可用的權限項目
 */

/**
 * 頁面權限
 * 每個頁面對應一個權限代碼
 */
export const PAGE_PERMISSIONS = {
  // 工作區
  HOME: { code: 'page:home', name: '總覽', path: '/', group: 'workspace' },

  // 工單管理
  FORMS: { code: 'page:forms', name: '工單管理', path: '/forms', group: 'recipe' },
  FORM_BUILDER: { code: 'page:form-builder', name: '建立工單', path: '/forms/builder', group: 'recipe' },
  GOLDEN: { code: 'page:golden', name: 'Golden Process', path: '/golden', group: 'recipe' },
  SPC: { code: 'page:spc', name: 'SPC 品質管制', path: '/spc', group: 'recipe' },

  // 工單流程
  APPLY: { code: 'page:apply', name: '建立工單申請', path: '/apply', group: 'workflow' },
  APPROVAL: { code: 'page:approval', name: '工單簽核', path: '/approval', group: 'workflow' },

  // WMS 倉儲管理
  WMS: { code: 'page:wms', name: 'WMS 倉儲管理', path: '/wms', group: 'wms' },

  // 能源管理
  ENERGY: { code: 'page:energy', name: '能源管理', path: '/energy', group: 'energy' },

  // 製程站點管理
  STATIONS: { code: 'page:stations', name: '製程站點管理', path: '/stations', group: 'station' },

  // 工單異動審核
  CHANGE_REQUESTS: { code: 'page:change-requests', name: '工單異動審核', path: '/change-requests', group: 'workflow' },

  // 生管派工
  DISPATCH: { code: 'page:dispatch', name: '生管派工', path: '/dispatch', group: 'workflow' },

  // 組織管理
  USERS: { code: 'page:users', name: '人員管理', path: '/users', group: 'organization' },
  DEPARTMENTS: { code: 'page:departments', name: '部門管理', path: '/departments', group: 'organization' },

  // 系統管理
  REPORTS: { code: 'page:reports', name: '報表統計', path: '/reports', group: 'system' },
  LOGS: { code: 'page:logs', name: '操作日誌', path: '/logs', group: 'system' },
  PERMISSIONS: { code: 'page:permissions', name: '權限管理', path: '/permissions', group: 'system' },
  SYSTEM_CONFIG: { code: 'page:system-config', name: '系統設定', path: '/system-config', group: 'system' },

  // 開發工具
  TESTS: { code: 'page:tests', name: '測試中心', path: '/test', group: 'devtools' },
  SIMULATOR: { code: 'page:simulator', name: '系統模擬器', path: '/simulator', group: 'devtools' }
};

/**
 * 功能權限
 * 定義各種操作動作的權限
 */
export const ACTION_PERMISSIONS = {
  // 工單管理
  CREATE_FORM: { code: 'action:create-form', name: '建立工單', group: 'recipe' },
  EDIT_FORM: { code: 'action:edit-form', name: '編輯工單', group: 'recipe' },
  EDIT_OWN_FORM: { code: 'action:edit-own-form', name: '編輯自己的工單', group: 'recipe' },
  DELETE_FORM: { code: 'action:delete-form', name: '刪除工單', group: 'recipe' },
  VIEW_FORMS: { code: 'action:view-forms', name: '查看工單', group: 'recipe' },
  EXPORT_FORM: { code: 'action:export-form', name: '匯出工單', group: 'recipe' },

  // 工單流程
  APPROVE_APPLICATION: { code: 'action:approve-application', name: '核准工單', group: 'workflow' },
  REJECT_APPLICATION: { code: 'action:reject-application', name: '退回工單', group: 'workflow' },

  // Golden Process
  CERTIFY_GOLDEN: { code: 'action:certify-golden', name: '認證 Golden Process', group: 'recipe' },
  REVOKE_GOLDEN: { code: 'action:revoke-golden', name: '撤銷 Golden Process', group: 'recipe' },

  // SPC 品質管制
  VIEW_SPC: { code: 'action:view-spc', name: '查看 SPC 數據', group: 'recipe' },
  EDIT_SPC: { code: 'action:edit-spc', name: '編輯 SPC 數據', group: 'recipe' },
  DELETE_SPC: { code: 'action:delete-spc', name: '刪除 SPC 數據', group: 'recipe' },

  // 組織管理
  MANAGE_USERS: { code: 'action:manage-users', name: '管理使用者', group: 'organization' },
  MANAGE_DEPARTMENTS: { code: 'action:manage-departments', name: '管理部門', group: 'organization' },

  // 系統管理
  VIEW_REPORTS: { code: 'action:view-reports', name: '查看報表', group: 'system' },
  VIEW_LOGS: { code: 'action:view-logs', name: '查看操作日誌', group: 'system' },
  MANAGE_PERMISSIONS: { code: 'action:manage-permissions', name: '管理權限', group: 'system' },

  // 開發工具
  RUN_TESTS: { code: 'action:run-tests', name: '執行測試', group: 'devtools' },
  USE_SIMULATOR: { code: 'action:use-simulator', name: '使用模擬器', group: 'devtools' }
};

/**
 * 權限群組
 * 用於在 UI 中分類顯示權限
 */
export const PERMISSION_GROUPS = {
  workspace: { name: '工作區', icon: '🏠' },
  recipe: { name: '工單管理', icon: '📝' },
  workflow: { name: '工單流程', icon: '🔄' },
  station: { name: '製程站點', icon: '🏭' },
  wms: { name: 'WMS 倉儲', icon: '📦' },
  energy: { name: '能源管理', icon: '⚡' },
  organization: { name: '組織管理', icon: '👥' },
  system: { name: '系統管理', icon: '⚙️' },
  devtools: { name: '開發工具', icon: '🔧' }
};

/**
 * 取得所有頁面權限代碼列表
 */
export function getAllPagePermissions() {
  return Object.values(PAGE_PERMISSIONS).map(p => p.code);
}

/**
 * 取得所有功能權限代碼列表
 */
export function getAllActionPermissions() {
  return Object.values(ACTION_PERMISSIONS).map(p => p.code);
}

/**
 * 取得所有權限代碼列表
 */
export function getAllPermissions() {
  return [
    ...getAllPagePermissions(),
    ...getAllActionPermissions()
  ];
}

/**
 * 根據路徑查找頁面權限代碼
 */
export function getPagePermissionByPath(path) {
  const page = Object.values(PAGE_PERMISSIONS).find(p => p.path === path);
  return page ? page.code : null;
}

/**
 * 根據權限代碼查找權限定義
 */
export function getPermissionByCode(code) {
  // 先在頁面權限中查找
  const pagePermission = Object.values(PAGE_PERMISSIONS).find(p => p.code === code);
  if (pagePermission) return pagePermission;

  // 再在功能權限中查找
  const actionPermission = Object.values(ACTION_PERMISSIONS).find(p => p.code === code);
  return actionPermission || null;
}

/**
 * 按群組分類權限
 */
export function groupPermissions(permissions) {
  const grouped = {};

  permissions.forEach(code => {
    const permission = getPermissionByCode(code);
    if (!permission) return;

    const group = permission.group;
    if (!grouped[group]) {
      grouped[group] = {
        ...PERMISSION_GROUPS[group],
        permissions: []
      };
    }

    grouped[group].permissions.push(permission);
  });

  return grouped;
}
