/**
 * 產業模組欄位配置管理器
 * 允許透過 UI 編輯產業模組的欄位定義
 */

const STORAGE_KEY = 'industry_fields_config';

/**
 * 產業欄位配置管理
 */
export class IndustryFieldsManager {
  /**
   * 獲取產業模組的欄位配置
   * @param {string} industryId - 產業 ID
   * @returns {Object} - { fieldGroups, customFields }
   */
  static getConfig(industryId) {
    const allConfigs = this.getAllConfigs();
    return allConfigs[industryId] || {
      fieldGroups: [],
      customFields: [],
      lastModified: null,
      version: '1.0'
    };
  }

  /**
   * 獲取所有產業的欄位配置
   */
  static getAllConfigs() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse industry fields config:', error);
        return {};
      }
    }
    return {};
  }

  /**
   * 保存產業模組的欄位配置
   * @param {string} industryId - 產業 ID
   * @param {Object} config - 配置對象
   */
  static saveConfig(industryId, config) {
    const allConfigs = this.getAllConfigs();

    allConfigs[industryId] = {
      ...config,
      lastModified: new Date().toISOString(),
      version: config.version || '1.0'
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allConfigs));
  }

  /**
   * 更新欄位群組
   * @param {string} industryId - 產業 ID
   * @param {Array} fieldGroups - 欄位群組陣列
   */
  static updateFieldGroups(industryId, fieldGroups) {
    const config = this.getConfig(industryId);
    config.fieldGroups = fieldGroups;
    this.saveConfig(industryId, config);
  }

  /**
   * 新增自訂欄位到產業模組
   * @param {string} industryId - 產業 ID
   * @param {Array} customFields - 自訂欄位陣列
   */
  static addCustomFields(industryId, customFields) {
    const config = this.getConfig(industryId);
    config.customFields = config.customFields || [];

    customFields.forEach(field => {
      // 檢查是否已存在
      const existingIndex = config.customFields.findIndex(f => f.name === field.name);
      if (existingIndex >= 0) {
        // 更新現有欄位
        config.customFields[existingIndex] = field;
      } else {
        // 新增欄位
        config.customFields.push(field);
      }
    });

    this.saveConfig(industryId, config);
  }

  /**
   * 移除自訂欄位
   * @param {string} industryId - 產業 ID
   * @param {string} fieldName - 欄位名稱
   */
  static removeCustomField(industryId, fieldName) {
    const config = this.getConfig(industryId);
    config.customFields = (config.customFields || []).filter(f => f.name !== fieldName);
    this.saveConfig(industryId, config);
  }

  /**
   * 合併預設欄位和自訂欄位
   * @param {Array} defaultFieldGroups - 預設欄位群組
   * @param {Object} config - 產業配置
   * @returns {Array} - 合併後的欄位群組
   */
  static mergeFields(defaultFieldGroups, config) {
    // 如果有儲存的 fieldGroups 配置，優先使用
    if (config.fieldGroups && config.fieldGroups.length > 0) {
      return config.fieldGroups;
    }

    // 檢查 defaultFieldGroups 是否有效
    if (!defaultFieldGroups || !Array.isArray(defaultFieldGroups)) {
      console.warn('defaultFieldGroups is not a valid array:', defaultFieldGroups);
      return [];
    }

    // 否則使用預設欄位群組，並加入自訂欄位
    const merged = [...defaultFieldGroups];

    if (config.customFields && config.customFields.length > 0) {
      // 檢查是否已有「自訂欄位」群組
      let customGroup = merged.find(g => g.title === '自訂欄位');

      if (!customGroup) {
        // 建立新的自訂欄位群組
        customGroup = {
          title: '自訂欄位',
          icon: '🔧',
          fields: []
        };
        merged.push(customGroup);
      }

      // 加入自訂欄位
      customGroup.fields = [
        ...customGroup.fields,
        ...config.customFields
      ];
    }

    return merged;
  }

  /**
   * 從欄位群組提取所有欄位
   * @param {Array} fieldGroups - 欄位群組陣列
   * @returns {Array} - 所有欄位的扁平陣列
   */
  static getAllFieldsFromGroups(fieldGroups) {
    const fields = [];
    fieldGroups.forEach(group => {
      if (group.fields && Array.isArray(group.fields)) {
        fields.push(...group.fields);
      }
    });
    return fields;
  }

  /**
   * 驗證欄位配置
   * @param {Array} fields - 欄位陣列
   * @returns {Object} - { valid: boolean, errors: Array }
   */
  static validateFields(fields) {
    const errors = [];
    const fieldNames = new Set();

    fields.forEach((field, index) => {
      // 檢查必要屬性
      if (!field.name) {
        errors.push(`欄位 ${index + 1}：缺少 name 屬性`);
      }
      if (!field.type) {
        errors.push(`欄位 ${index + 1}：缺少 type 屬性`);
      }
      if (!field.label) {
        errors.push(`欄位 ${index + 1}：缺少 label 屬性`);
      }

      // 檢查欄位名稱唯一性
      if (field.name) {
        if (fieldNames.has(field.name)) {
          errors.push(`欄位名稱「${field.name}」重複`);
        }
        fieldNames.add(field.name);
      }

      // 檢查特定類型的必要屬性
      if ((field.type === 'select' || field.type === 'radio') && !field.options) {
        errors.push(`欄位「${field.name}」：select/radio 類型需要 options 屬性`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 重置產業模組配置為預設值
   * @param {string} industryId - 產業 ID
   */
  static resetToDefault(industryId) {
    const allConfigs = this.getAllConfigs();
    delete allConfigs[industryId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allConfigs));
  }

  /**
   * 匯出產業模組配置
   * @param {string} industryId - 產業 ID
   * @returns {string} - JSON 字串
   */
  static exportConfig(industryId) {
    const config = this.getConfig(industryId);
    return JSON.stringify(config, null, 2);
  }

  /**
   * 匯入產業模組配置
   * @param {string} industryId - 產業 ID
   * @param {string} jsonString - JSON 配置字串
   */
  static importConfig(industryId, jsonString) {
    try {
      const config = JSON.parse(jsonString);

      // 驗證配置結構
      if (!config.fieldGroups && !config.customFields) {
        throw new Error('無效的配置格式：缺少 fieldGroups 或 customFields');
      }

      // 驗證欄位
      const allFields = this.getAllFieldsFromGroups(config.fieldGroups || []);
      const validation = this.validateFields(allFields);

      if (!validation.valid) {
        throw new Error('欄位驗證失敗：\n' + validation.errors.join('\n'));
      }

      this.saveConfig(industryId, config);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 取得產業模組配置統計
   * @param {string} industryId - 產業 ID
   * @returns {Object} - 統計資訊
   */
  static getConfigStats(industryId) {
    const config = this.getConfig(industryId);
    const allFields = this.getAllFieldsFromGroups(config.fieldGroups || []);

    return {
      totalGroups: (config.fieldGroups || []).length,
      totalFields: allFields.length,
      customFieldsCount: (config.customFields || []).length,
      requiredFieldsCount: allFields.filter(f => f.required).length,
      lastModified: config.lastModified,
      version: config.version
    };
  }
}
