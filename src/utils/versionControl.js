import { storage } from './storage.js';
import { authService } from './authService.js';

/**
 * 版本控制系統
 * 提供資料版本管理、歷史追蹤、回滾功能
 */
export class VersionControl {
  constructor(entityType) {
    this.entityType = entityType; // 'form', 'workflow', 'template' etc.
    this.storageKey = `${entityType}_versions`;
  }

  /**
   * 儲存新版本
   * @param {string} entityId - 實體 ID
   * @param {Object} data - 資料內容
   * @param {string} comment - 版本註解
   * @returns {Object} - 版本資訊
   */
  saveVersion(entityId, data, comment = '') {
    const currentUser = authService.getCurrentUser();
    const versions = this.getVersions(entityId);

    const newVersion = {
      id: `${entityId}_v${Date.now()}`,
      entityId,
      version: versions.length + 1,
      data: JSON.parse(JSON.stringify(data)), // 深拷貝
      comment,
      createdBy: currentUser?.name || 'System',
      createdById: currentUser?.id || 'system',
      createdAt: new Date().toISOString(),
      size: JSON.stringify(data).length
    };

    versions.push(newVersion);
    this.saveVersions(entityId, versions);

    return newVersion;
  }

  /**
   * 取得所有版本
   * @param {string} entityId - 實體 ID
   * @returns {Array} - 版本列表
   */
  getVersions(entityId) {
    const allVersions = storage.get(this.storageKey, {});
    return allVersions[entityId] || [];
  }

  /**
   * 取得特定版本
   * @param {string} entityId - 實體 ID
   * @param {number} versionNumber - 版本號
   * @returns {Object|null} - 版本資料
   */
  getVersion(entityId, versionNumber) {
    const versions = this.getVersions(entityId);
    return versions.find(v => v.version === versionNumber) || null;
  }

  /**
   * 取得最新版本
   * @param {string} entityId - 實體 ID
   * @returns {Object|null} - 最新版本
   */
  getLatestVersion(entityId) {
    const versions = this.getVersions(entityId);
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }

  /**
   * 回滾到指定版本
   * @param {string} entityId - 實體 ID
   * @param {number} versionNumber - 版本號
   * @returns {Object|null} - 回滾後的資料
   */
  rollback(entityId, versionNumber) {
    const version = this.getVersion(entityId, versionNumber);
    if (!version) {
      throw new Error(`版本 ${versionNumber} 不存在`);
    }

    // 將回滾作為新版本保存
    const rollbackData = version.data;
    this.saveVersion(
      entityId,
      rollbackData,
      `回滾到版本 ${versionNumber}`
    );

    return rollbackData;
  }

  /**
   * 比較兩個版本
   * @param {string} entityId - 實體 ID
   * @param {number} version1 - 版本1
   * @param {number} version2 - 版本2
   * @returns {Object} - 差異資訊
   */
  compare(entityId, version1, version2) {
    const v1 = this.getVersion(entityId, version1);
    const v2 = this.getVersion(entityId, version2);

    if (!v1 || !v2) {
      throw new Error('版本不存在');
    }

    return {
      version1: { number: version1, data: v1 },
      version2: { number: version2, data: v2 },
      differences: this.findDifferences(v1.data, v2.data)
    };
  }

  /**
   * 尋找兩個物件的差異
   * @param {Object} obj1 - 物件1
   * @param {Object} obj2 - 物件2
   * @returns {Array} - 差異列表
   */
  findDifferences(obj1, obj2, path = '') {
    const differences = [];

    // 比較所有 obj1 的鍵
    Object.keys(obj1).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (!(key in obj2)) {
        differences.push({
          path: currentPath,
          type: 'removed',
          oldValue: val1,
          newValue: undefined
        });
      } else if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
        // 遞迴比較物件
        if (Array.isArray(val1) && Array.isArray(val2)) {
          if (JSON.stringify(val1) !== JSON.stringify(val2)) {
            differences.push({
              path: currentPath,
              type: 'modified',
              oldValue: val1,
              newValue: val2
            });
          }
        } else {
          differences.push(...this.findDifferences(val1, val2, currentPath));
        }
      } else if (val1 !== val2) {
        differences.push({
          path: currentPath,
          type: 'modified',
          oldValue: val1,
          newValue: val2
        });
      }
    });

    // 檢查 obj2 中新增的鍵
    Object.keys(obj2).forEach(key => {
      if (!(key in obj1)) {
        const currentPath = path ? `${path}.${key}` : key;
        differences.push({
          path: currentPath,
          type: 'added',
          oldValue: undefined,
          newValue: obj2[key]
        });
      }
    });

    return differences;
  }

  /**
   * 刪除特定版本
   * @param {string} entityId - 實體 ID
   * @param {number} versionNumber - 版本號
   */
  deleteVersion(entityId, versionNumber) {
    const versions = this.getVersions(entityId);
    const filtered = versions.filter(v => v.version !== versionNumber);

    // 重新編號
    filtered.forEach((v, index) => {
      v.version = index + 1;
    });

    this.saveVersions(entityId, filtered);
  }

  /**
   * 刪除實體的所有版本
   * @param {string} entityId - 實體 ID
   */
  deleteAllVersions(entityId) {
    const allVersions = storage.get(this.storageKey, {});
    delete allVersions[entityId];
    storage.set(this.storageKey, allVersions);
  }

  /**
   * 取得版本統計
   * @param {string} entityId - 實體 ID
   * @returns {Object} - 統計資訊
   */
  getStats(entityId) {
    const versions = this.getVersions(entityId);

    if (versions.length === 0) {
      return {
        totalVersions: 0,
        firstVersion: null,
        latestVersion: null,
        totalSize: 0,
        contributors: []
      };
    }

    const totalSize = versions.reduce((sum, v) => sum + v.size, 0);
    const contributors = [...new Set(versions.map(v => v.createdBy))];

    return {
      totalVersions: versions.length,
      firstVersion: versions[0],
      latestVersion: versions[versions.length - 1],
      totalSize,
      contributors
    };
  }

  /**
   * 清理舊版本（保留最近 N 個版本）
   * @param {string} entityId - 實體 ID
   * @param {number} keepCount - 保留數量
   */
  cleanup(entityId, keepCount = 10) {
    const versions = this.getVersions(entityId);

    if (versions.length <= keepCount) {
      return;
    }

    // 保留最新的 N 個版本
    const keptVersions = versions.slice(-keepCount);

    // 重新編號
    keptVersions.forEach((v, index) => {
      v.version = index + 1;
    });

    this.saveVersions(entityId, keptVersions);
  }

  /**
   * 儲存版本列表
   * @private
   */
  saveVersions(entityId, versions) {
    const allVersions = storage.get(this.storageKey, {});
    allVersions[entityId] = versions;
    storage.set(this.storageKey, allVersions);
  }

  /**
   * 匯出版本歷史
   * @param {string} entityId - 實體 ID
   * @returns {string} - JSON 字串
   */
  exportHistory(entityId) {
    const versions = this.getVersions(entityId);
    return JSON.stringify({
      entityType: this.entityType,
      entityId,
      versions,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * 匯入版本歷史
   * @param {string} jsonString - JSON 字串
   */
  importHistory(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      if (data.entityType !== this.entityType) {
        throw new Error(`實體類型不符：期望 ${this.entityType}，實際 ${data.entityType}`);
      }

      this.saveVersions(data.entityId, data.versions);
      return { success: true, count: data.versions.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 創建各類型的版本控制實例
export const formVersionControl = new VersionControl('form');
export const workflowVersionControl = new VersionControl('workflow');
export const templateVersionControl = new VersionControl('template');
export const goldenRecipeVersionControl = new VersionControl('goldenRecipe');
