/**
 * 權限管理頁面
 * 系統管理員專用，管理角色與權限
 */

import { Modal } from '../components/common/Modal.js';
import { permissionManager } from '../utils/permissionManager.js';
import { authService } from '../utils/authService.js';
import {
  PAGE_PERMISSIONS,
  ACTION_PERMISSIONS,
  PERMISSION_GROUPS,
  groupPermissions
} from '../config/permissions.config.js';
import {
  getAllRolesWithCustom,
  getRoleById,
  ROLES,
  saveCustomRoles,
  loadCustomRoles
} from '../config/roles.config.js';

export class PermissionsPage {
  constructor() {
    this.currentTab = 'roles'; // roles | permissions
  }

  render() {
    const container = document.createElement('div');
    container.className = 'page permissions-page';

    // 檢查權限
    if (!permissionManager.canAccessPage('/permissions')) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🚫</div>
          <h3>權限不足</h3>
          <p>您沒有權限訪問此頁面</p>
        </div>
      `;
      return container;
    }

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">權限管理</h1>
          <p class="page-description">管理系統角色與權限配置</p>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-button ${this.currentTab === 'roles' ? 'active' : ''}" data-tab="roles">
          👥 角色管理
        </button>
        <button class="tab-button ${this.currentTab === 'permissions' ? 'active' : ''}" data-tab="permissions">
          🔐 權限列表
        </button>
      </div>

      <div class="tab-content">
        ${this.currentTab === 'roles' ? this.renderRolesTab() : this.renderPermissionsTab()}
      </div>
    `;

    // 添加事件監聽
    this.attachEventListeners(container);

    return container;
  }

  renderRolesTab() {
    const roles = getAllRolesWithCustom();

    const rolesHTML = roles.map(role => {
      const pagePermissions = role.permissions.filter(p => p.startsWith('page:'));
      const actionPermissions = role.permissions.filter(p => p.startsWith('action:'));

      return `
        <div class="role-card">
          <div class="role-header">
            <div class="role-title">
              <span class="role-badge role-badge-${role.color}">${role.displayName}</span>
              <h3>${role.name}</h3>
              ${role.isSystem ? '<span class="badge badge-outline">系統內建</span>' : '<span class="badge">自訂</span>'}
            </div>
            <div class="role-actions">
              ${!role.isSystem ? `
                <button class="btn btn-sm btn-secondary" data-role-id="${role.id}" data-action="edit">
                  ✏️ 編輯
                </button>
                <button class="btn btn-sm btn-danger" data-role-id="${role.id}" data-action="delete">
                  🗑️ 刪除
                </button>
              ` : ''}
            </div>
          </div>

          <div class="role-description">
            ${role.description}
          </div>

          <div class="role-stats">
            <div class="stat-item">
              <span class="stat-label">頁面權限</span>
              <span class="stat-value">${pagePermissions.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">功能權限</span>
              <span class="stat-value">${actionPermissions.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">總計</span>
              <span class="stat-value">${role.permissions.length}</span>
            </div>
          </div>

          <div class="role-permissions-preview">
            <button class="btn btn-sm btn-text" data-role-id="${role.id}" data-action="view-permissions">
              查看完整權限列表 →
            </button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="roles-tab">
        <div class="tab-header">
          <div class="tab-info">
            <h2>角色列表</h2>
            <p class="text-secondary">系統共有 ${roles.length} 個角色</p>
          </div>
          <div class="tab-actions">
            <button class="btn btn-primary" data-action="create-role">
              ➕ 建立自訂角色
            </button>
          </div>
        </div>

        <div class="roles-grid">
          ${rolesHTML}
        </div>
      </div>
    `;
  }

  renderPermissionsTab() {
    // 取得所有權限並按群組分類
    const allPermissions = [
      ...Object.values(PAGE_PERMISSIONS),
      ...Object.values(ACTION_PERMISSIONS)
    ];

    // 按群組分類
    const grouped = {};
    allPermissions.forEach(permission => {
      const group = permission.group;
      if (!grouped[group]) {
        grouped[group] = {
          ...PERMISSION_GROUPS[group],
          permissions: []
        };
      }
      grouped[group].permissions.push(permission);
    });

    const groupsHTML = Object.entries(grouped).map(([groupKey, group]) => {
      const permissionsHTML = group.permissions.map(permission => {
        const isPagePermission = permission.code.startsWith('page:');
        const typeLabel = isPagePermission ? '頁面' : '功能';
        const typeBadge = isPagePermission ? 'badge-blue' : 'badge-green';

        return `
          <tr>
            <td>
              <code class="permission-code">${permission.code}</code>
            </td>
            <td>
              <span class="badge ${typeBadge}">${typeLabel}</span>
            </td>
            <td>${permission.name}</td>
            <td>
              ${isPagePermission ? `<code class="text-xs">${permission.path}</code>` : '-'}
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div class="permission-group">
          <div class="permission-group-header">
            <h3>${group.icon} ${group.name}</h3>
            <span class="badge badge-outline">${group.permissions.length} 個權限</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>權限代碼</th>
                <th>類型</th>
                <th>名稱</th>
                <th>路徑</th>
              </tr>
            </thead>
            <tbody>
              ${permissionsHTML}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    return `
      <div class="permissions-tab">
        <div class="tab-header">
          <div class="tab-info">
            <h2>權限列表</h2>
            <p class="text-secondary">
              系統共有 ${allPermissions.length} 個權限
              （${Object.values(PAGE_PERMISSIONS).length} 個頁面權限 + ${Object.values(ACTION_PERMISSIONS).length} 個功能權限）
            </p>
          </div>
        </div>

        <div class="permissions-groups">
          ${groupsHTML}
        </div>
      </div>
    `;
  }

  renderRolePermissionsModal(roleId) {
    const role = getRoleById(roleId);
    if (!role) return '';

    // 按群組分類權限
    const grouped = groupPermissions(role.permissions);

    const groupsHTML = Object.entries(grouped).map(([groupKey, group]) => {
      const permissionsHTML = group.permissions.map(permission => {
        const isPagePermission = permission.code.startsWith('page:');
        const typeLabel = isPagePermission ? '頁面' : '功能';
        const typeBadge = isPagePermission ? 'badge-blue' : 'badge-green';

        return `
          <tr>
            <td><span class="badge ${typeBadge}">${typeLabel}</span></td>
            <td>${permission.name}</td>
            <td><code class="text-xs">${permission.code}</code></td>
          </tr>
        `;
      }).join('');

      return `
        <div class="permission-group-modal">
          <h4>${group.icon} ${group.name}</h4>
          <table class="data-table data-table-compact">
            <thead>
              <tr>
                <th>類型</th>
                <th>名稱</th>
                <th>代碼</th>
              </tr>
            </thead>
            <tbody>
              ${permissionsHTML}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    const modalContent = `
      <div class="role-info-box">
        <div style="margin-bottom: var(--spacing-sm);">
          <span class="role-badge role-badge-${role.color}">${role.displayName}</span>
        </div>
        <p>${role.description}</p>
        <div class="stats-row">
          <span class="badge badge-info">共 ${role.permissions.length} 個權限</span>
        </div>
      </div>

      <div class="permissions-list">
        ${groupsHTML}
      </div>
    `;

    return modalContent;
  }

  attachEventListeners(container) {
    // Tab 切換
    const tabButtons = container.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.currentTab = tab;
        this.reload();
      });
    });

    // 查看角色權限
    const viewPermissionButtons = container.querySelectorAll('[data-action="view-permissions"]');
    viewPermissionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const roleId = e.target.dataset.roleId;
        this.showRolePermissionsModal(roleId);
      });
    });

    // 建立自訂角色
    const createRoleButton = container.querySelector('[data-action="create-role"]');
    if (createRoleButton) {
      createRoleButton.addEventListener('click', () => {
        this.showCreateRoleModal();
      });
    }

    // 編輯自訂角色
    const editButtons = container.querySelectorAll('[data-action="edit"]');
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const roleId = e.target.dataset.roleId;
        this.showEditRoleModal(roleId);
      });
    });

    // 刪除自訂角色
    const deleteButtons = container.querySelectorAll('[data-action="delete"]');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const roleId = e.target.dataset.roleId;
        this.showDeleteRoleConfirm(roleId);
      });
    });
  }

  showRolePermissionsModal(roleId) {
    const role = getRoleById(roleId);
    if (!role) return;

    const modalContent = this.renderRolePermissionsModal(roleId);

    const modal = new Modal({
      title: `${role.name} - 權限列表`,
      content: modalContent
    });

    modal.open();

    // 設定寬度（在 open 後才能存取 element）
    const modalElement = modal.element.querySelector('.modal');
    if (modalElement) {
      modalElement.style.maxWidth = '1000px';
      modalElement.style.width = '90%';
    }
  }

  showCreateRoleModal() {
    this.showRoleEditorModal(null);
  }

  showEditRoleModal(roleId) {
    this.showRoleEditorModal(roleId);
  }

  showRoleEditorModal(roleId) {
    const isEdit = !!roleId;
    const existingRole = isEdit ? getRoleById(roleId) : null;

    // 預設角色範本（可選擇套用）
    const templates = {
      'system-admin': ROLES.SYSTEM_ADMIN,
      'manager': ROLES.MANAGER,
      'employee': ROLES.EMPLOYEE
    };

    const modalContent = this.renderRoleEditorModal(existingRole, templates);
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalContent;

    const modal = new Modal({
      title: isEdit ? '✏️ 編輯角色' : '➕ 建立自訂角色',
      content: modalDiv
    });

    modal.open();

    // 設定寬度（在 open 後才能存取 element）
    const modalElement = modal.element.querySelector('.modal');
    if (modalElement) {
      modalElement.style.maxWidth = '1200px';
      modalElement.style.width = '95%';
    }

    // 添加事件監聽（需要在 modal.open() 之後執行，因為需要等 DOM 渲染完成）
    setTimeout(() => {
      this.attachRoleEditorListeners(modalDiv, modal, existingRole);
    }, 0);
  }

  renderRoleEditorModal(existingRole, templates) {
    const isEdit = !!existingRole;
    const roleData = existingRole || {
      id: '',
      name: '',
      displayName: '',
      description: '',
      color: 'blue',
      permissions: []
    };

    // 按群組分類所有權限
    const allPermissions = [
      ...Object.values(PAGE_PERMISSIONS),
      ...Object.values(ACTION_PERMISSIONS)
    ];

    const grouped = {};
    allPermissions.forEach(permission => {
      const group = permission.group;
      if (!grouped[group]) {
        grouped[group] = {
          ...PERMISSION_GROUPS[group],
          permissions: []
        };
      }
      grouped[group].permissions.push(permission);
    });

    // 渲染權限勾選表格
    const permissionGroupsHTML = Object.entries(grouped).map(([groupKey, group]) => {
      const permissionsHTML = group.permissions.map(permission => {
        const isChecked = roleData.permissions.includes(permission.code);
        const isPagePermission = permission.code.startsWith('page:');
        const typeLabel = isPagePermission ? '頁面' : '功能';
        const typeBadge = isPagePermission ? 'badge-blue' : 'badge-green';

        return `
          <tr>
            <td>
              <input
                type="checkbox"
                class="permission-checkbox"
                data-permission="${permission.code}"
                ${isChecked ? 'checked' : ''}
              />
            </td>
            <td><span class="badge ${typeBadge}">${typeLabel}</span></td>
            <td>${permission.name}</td>
            <td><code class="text-xs">${permission.code}</code></td>
          </tr>
        `;
      }).join('');

      // 計算該群組已勾選數量
      const checkedCount = group.permissions.filter(p => roleData.permissions.includes(p.code)).length;
      const totalCount = group.permissions.length;

      return `
        <div class="permission-group-editor">
          <div class="permission-group-header-editor">
            <div>
              <h4>${group.icon} ${group.name}</h4>
              <span class="permission-count">${checkedCount} / ${totalCount} 已選</span>
            </div>
            <div class="group-actions">
              <button class="btn btn-sm btn-text" data-action="select-all-group" data-group="${groupKey}">
                全選
              </button>
              <button class="btn btn-sm btn-text" data-action="deselect-all-group" data-group="${groupKey}">
                全不選
              </button>
            </div>
          </div>
          <table class="data-table data-table-compact">
            <thead>
              <tr>
                <th style="width: 40px;">選擇</th>
                <th style="width: 80px;">類型</th>
                <th>名稱</th>
                <th>代碼</th>
              </tr>
            </thead>
            <tbody>
              ${permissionsHTML}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    // 範本選擇器
    const templateOptionsHTML = Object.entries(templates).map(([key, template]) => {
      return `
        <button class="btn btn-secondary btn-template" data-template="${key}">
          <span class="role-badge role-badge-${template.color}">${template.displayName}</span>
          ${template.name}
          <span class="text-secondary text-xs">(${template.permissions.length} 個權限)</span>
        </button>
      `;
    }).join('');

    return `
      <div class="role-editor-modal">
        <!-- 基本資訊 -->
        <div class="form-section">
            <h3>基本資訊</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>角色 ID <span class="required">*</span></label>
                <input
                  type="text"
                  id="role-id"
                  class="form-input"
                  placeholder="例如：engineer"
                  value="${roleData.id}"
                  ${isEdit ? 'disabled' : ''}
                />
                <small class="text-secondary">英文小寫，不可重複</small>
              </div>

              <div class="form-field">
                <label>角色名稱 <span class="required">*</span></label>
                <input
                  type="text"
                  id="role-name"
                  class="form-input"
                  placeholder="例如：工程師"
                  value="${roleData.name}"
                />
              </div>

              <div class="form-field">
                <label>顯示名稱 <span class="required">*</span></label>
                <input
                  type="text"
                  id="role-display-name"
                  class="form-input"
                  placeholder="例如：工程師"
                  value="${roleData.displayName}"
                />
                <small class="text-secondary">用於徽章顯示</small>
              </div>

              <div class="form-field">
                <label>徽章顏色 <span class="required">*</span></label>
                <select id="role-color" class="form-input">
                  <option value="red" ${roleData.color === 'red' ? 'selected' : ''}>🔴 紅色（管理員）</option>
                  <option value="blue" ${roleData.color === 'blue' ? 'selected' : ''}>🔵 藍色（主管）</option>
                  <option value="green" ${roleData.color === 'green' ? 'selected' : ''}>🟢 綠色（員工）</option>
                  <option value="purple" ${roleData.color === 'purple' ? 'selected' : ''}>🟣 紫色</option>
                  <option value="orange" ${roleData.color === 'orange' ? 'selected' : ''}>🟠 橙色</option>
                  <option value="gray" ${roleData.color === 'gray' ? 'selected' : ''}>⚪ 灰色</option>
                </select>
              </div>

              <div class="form-field" style="grid-column: span 2;">
                <label>角色描述</label>
                <textarea
                  id="role-description"
                  class="form-input"
                  rows="2"
                  placeholder="描述這個角色的職責與權限範圍"
                >${roleData.description}</textarea>
              </div>
            </div>
          </div>

          <!-- 範本選擇 -->
          ${!isEdit ? `
            <div class="form-section">
              <h3>快速套用範本</h3>
              <p class="text-secondary">選擇預設角色的權限作為起點，之後可以再調整</p>
              <div class="template-buttons">
                ${templateOptionsHTML}
              </div>
            </div>
          ` : ''}

          <!-- 權限選擇 -->
          <div class="form-section">
            <div class="permissions-header">
              <h3>權限設定</h3>
              <div class="permissions-stats">
                <span class="selected-count">已選 <strong id="selected-count">${roleData.permissions.length}</strong> / ${allPermissions.length} 個權限</span>
                <button class="btn btn-sm btn-secondary" id="select-all-permissions">全選所有權限</button>
                <button class="btn btn-sm btn-secondary" id="deselect-all-permissions">清除所有權限</button>
              </div>
            </div>

            <div class="permissions-groups-editor">
              ${permissionGroupsHTML}
            </div>
          </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="cancel">取消</button>
          <button class="btn btn-primary" data-action="save">
            ${isEdit ? '💾 儲存變更' : '➕ 建立角色'}
          </button>
        </div>
      </div>
    `;
  }

  attachRoleEditorListeners(container, modal, existingRole) {
    const isEdit = !!existingRole;

    // 更新已選權限計數
    const updateSelectedCount = () => {
      const checkboxes = container.querySelectorAll('.permission-checkbox:checked');
      const countElement = container.querySelector('#selected-count');
      if (countElement) {
        countElement.textContent = checkboxes.length;
      }

      // 更新各群組計數
      const groups = container.querySelectorAll('.permission-group-editor');
      groups.forEach(group => {
        const groupCheckboxes = group.querySelectorAll('.permission-checkbox');
        const checkedCheckboxes = group.querySelectorAll('.permission-checkbox:checked');
        const countElement = group.querySelector('.permission-count');
        if (countElement) {
          countElement.textContent = `${checkedCheckboxes.length} / ${groupCheckboxes.length} 已選`;
        }
      });
    };

    // 權限勾選變更
    const checkboxes = container.querySelectorAll('.permission-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateSelectedCount);
    });

    // 套用範本
    const templateButtons = container.querySelectorAll('.btn-template');
    templateButtons.forEach(button => {
      button.addEventListener('click', () => {
        const templateKey = button.dataset.template;
        const template = {
          'system-admin': ROLES.SYSTEM_ADMIN,
          'manager': ROLES.MANAGER,
          'employee': ROLES.EMPLOYEE
        }[templateKey];

        if (template) {
          // 清除所有勾選
          checkboxes.forEach(cb => cb.checked = false);

          // 勾選範本的權限
          template.permissions.forEach(permission => {
            const checkbox = container.querySelector(`[data-permission="${permission}"]`);
            if (checkbox) {
              checkbox.checked = true;
            }
          });

          updateSelectedCount();
        }
      });
    });

    // 群組全選/全不選
    const selectAllGroupButtons = container.querySelectorAll('[data-action="select-all-group"]');
    selectAllGroupButtons.forEach(button => {
      button.addEventListener('click', () => {
        const group = button.closest('.permission-group-editor');
        const groupCheckboxes = group.querySelectorAll('.permission-checkbox');
        groupCheckboxes.forEach(cb => cb.checked = true);
        updateSelectedCount();
      });
    });

    const deselectAllGroupButtons = container.querySelectorAll('[data-action="deselect-all-group"]');
    deselectAllGroupButtons.forEach(button => {
      button.addEventListener('click', () => {
        const group = button.closest('.permission-group-editor');
        const groupCheckboxes = group.querySelectorAll('.permission-checkbox');
        groupCheckboxes.forEach(cb => cb.checked = false);
        updateSelectedCount();
      });
    });

    // 全選/清除所有權限
    const selectAllButton = container.querySelector('#select-all-permissions');
    if (selectAllButton) {
      selectAllButton.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = true);
        updateSelectedCount();
      });
    }

    const deselectAllButton = container.querySelector('#deselect-all-permissions');
    if (deselectAllButton) {
      deselectAllButton.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = false);
        updateSelectedCount();
      });
    }

    // 取消按鈕
    const cancelButton = container.querySelector('[data-action="cancel"]');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        modal.close();
      });
    }

    // 儲存按鈕
    const saveButton = container.querySelector('[data-action="save"]');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        this.saveCustomRole(container, modal, isEdit);
      });
    }
  }

  saveCustomRole(container, modal, isEdit) {
    // 取得表單資料
    const id = container.querySelector('#role-id').value.trim();
    const name = container.querySelector('#role-name').value.trim();
    const displayName = container.querySelector('#role-display-name').value.trim();
    const color = container.querySelector('#role-color').value;
    const description = container.querySelector('#role-description').value.trim();

    // 驗證必填欄位
    if (!id || !name || !displayName) {
      alert('請填寫所有必填欄位（角色 ID、角色名稱、顯示名稱）');
      return;
    }

    // 驗證 ID 格式（英文小寫、數字、連字號）
    if (!/^[a-z0-9-]+$/.test(id)) {
      alert('角色 ID 只能包含英文小寫、數字和連字號');
      return;
    }

    // 取得已選權限
    const checkboxes = container.querySelectorAll('.permission-checkbox:checked');
    const permissions = Array.from(checkboxes).map(cb => cb.dataset.permission);

    if (permissions.length === 0) {
      if (!confirm('您尚未選擇任何權限，確定要繼續嗎？')) {
        return;
      }
    }

    // 建立角色物件
    const roleData = {
      id,
      name,
      displayName,
      description,
      color,
      permissions,
      isSystem: false
    };

    // 儲存到 localStorage
    const customRoles = loadCustomRoles();

    if (isEdit) {
      // 編輯模式：更新現有角色
      const index = customRoles.findIndex(r => r.id === id);
      if (index >= 0) {
        customRoles[index] = roleData;
      }
    } else {
      // 新增模式：檢查 ID 是否重複
      const existingIds = [...Object.values(ROLES).map(r => r.id), ...customRoles.map(r => r.id)];
      if (existingIds.includes(id)) {
        alert(`角色 ID "${id}" 已存在，請使用其他 ID`);
        return;
      }

      customRoles.push(roleData);
    }

    // 儲存
    const success = saveCustomRoles(customRoles);
    if (success) {
      alert(`角色「${name}」${isEdit ? '更新' : '建立'}成功！`);
      modal.close();

      // 清除權限快取
      permissionManager.clearCache();

      // 重新載入頁面
      this.reload();
    } else {
      alert('儲存失敗，請稍後再試');
    }
  }

  showDeleteRoleConfirm(roleId) {
    const role = getRoleById(roleId);
    if (!role) return;

    if (role.isSystem) {
      alert('系統內建角色無法刪除');
      return;
    }

    if (!confirm(`確定要刪除角色「${role.name}」嗎？\n\n此操作無法復原。`)) {
      return;
    }

    // 從 localStorage 刪除
    const customRoles = loadCustomRoles();
    const filtered = customRoles.filter(r => r.id !== roleId);

    const success = saveCustomRoles(filtered);
    if (success) {
      alert(`角色「${role.name}」已刪除`);

      // 清除權限快取
      permissionManager.clearCache();

      // 重新載入頁面
      this.reload();
    } else {
      alert('刪除失敗，請稍後再試');
    }
  }

  reload() {
    const container = document.querySelector('.permissions-page');
    if (container) {
      const newContent = this.render();
      container.replaceWith(newContent);
    }
  }

  addStyles() {
    if (!document.getElementById('permissions-page-styles')) {
      const style = document.createElement('style');
      style.id = 'permissions-page-styles';
      style.textContent = `
        .permissions-page {
          padding: var(--spacing-lg);
          max-width: 1440px;
          margin: 0 auto;
        }

        .tabs {
          display: flex;
          gap: var(--spacing-xs);
          border-bottom: 1px solid var(--border-color);
          margin-bottom: var(--spacing-lg);
        }

        .tab-button {
          padding: var(--spacing-md) var(--spacing-lg);
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.9375rem;
          color: var(--text-secondary);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: var(--text-primary);
        }

        .tab-button.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .tab-info h2 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 1.25rem;
        }

        /* 角色列表 */
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: var(--spacing-lg);
        }

        .role-card {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: var(--spacing-lg);
        }

        .role-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-md);
        }

        .role-title {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .role-title h3 {
          margin: 0;
          font-size: 1.125rem;
        }

        .role-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .role-description {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: var(--spacing-md);
          line-height: 1.5;
        }

        .role-stats {
          display: flex;
          gap: var(--spacing-lg);
          padding: var(--spacing-md);
          background: var(--bg-secondary);
          border-radius: var(--border-radius);
          margin-bottom: var(--spacing-md);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--primary-color);
        }

        .role-permissions-preview {
          margin-top: var(--spacing-md);
        }

        /* 權限列表 */
        .permissions-groups {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .permission-group {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: var(--spacing-lg);
        }

        .permission-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .permission-group-header h3 {
          margin: 0;
          font-size: 1.125rem;
        }

        .permission-code {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.8125rem;
          background: var(--bg-secondary);
          padding: 2px 6px;
          border-radius: 3px;
          color: var(--text-primary);
        }

        /* Modal 內的權限列表 */
        .role-info-box {
          background: var(--bg-secondary);
          padding: var(--spacing-md);
          border-radius: var(--border-radius);
          margin-bottom: var(--spacing-lg);
        }

        .stats-row {
          margin-top: var(--spacing-sm);
        }

        .permissions-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .permission-group-modal h4 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: 1rem;
        }

        .data-table-compact {
          font-size: 0.875rem;
        }

        .data-table-compact td,
        .data-table-compact th {
          padding: var(--spacing-sm);
        }

        /* 角色編輯器 */
        .role-editor-modal .form-section {
          margin-bottom: var(--spacing-xl);
        }

        .role-editor-modal .form-section h3 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: 1.125rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }

        .form-field label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: 500;
        }

        .required {
          color: var(--danger-color);
        }

        .form-input {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          font-size: 0.9375rem;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .template-buttons {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .btn-template {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .permissions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .permissions-header h3 {
          margin: 0;
        }

        .permissions-stats {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .selected-count strong {
          color: var(--primary-color);
          font-size: 1.125rem;
        }

        .permissions-groups-editor {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          max-height: 60vh;
          overflow-y: auto;
          padding: var(--spacing-xs);
        }

        .permission-group-editor {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: var(--spacing-md);
        }

        .permission-group-header-editor {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .permission-group-header-editor h4 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 1rem;
        }

        .permission-count {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .group-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .permission-checkbox {
          cursor: pointer;
          width: 16px;
          height: 16px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-sm);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-color);
          margin-top: var(--spacing-md);
        }
      `;
      document.head.appendChild(style);
    }
  }
}
