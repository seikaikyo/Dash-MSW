/**
 * 配方範本管理模組
 *
 * 支援：
 * - 範本 CRUD 操作
 * - 範本分類管理
 * - 範本版本控制
 */

/**
 * 範本資料模型
 */
export class TemplateModel {
  static STORAGE_KEY = 'recipe_templates';

  /**
   * 建立新範本
   */
  static create(templateData) {
    const templates = this.getAll();

    const newTemplate = {
      id: `TPL-${Date.now()}`,
      name: templateData.name,
      description: templateData.description || '',
      category: templateData.category || 'general', // general, standard, custom
      industryType: templateData.industryType || 'amc-filter',

      // 範本欄位定義
      fields: templateData.fields || [],

      // 預設值
      defaultValues: templateData.defaultValues || {},

      // 元數據
      createdAt: new Date().toISOString(),
      createdBy: templateData.createdBy || 'SYSTEM',
      updatedAt: new Date().toISOString(),

      // 版本資訊
      version: '1.0',

      // 使用統計
      usageCount: 0,

      // 標籤
      tags: templateData.tags || [],

      // 是否公開
      isPublic: templateData.isPublic !== false,

      // 是否啟用
      isActive: templateData.isActive !== false
    };

    templates.push(newTemplate);
    this.save(templates);

    return newTemplate;
  }

  /**
   * 取得所有範本
   */
  static getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('讀取範本資料失敗:', error);
      return [];
    }
  }

  /**
   * 根據 ID 取得範本
   */
  static getById(id) {
    const templates = this.getAll();
    return templates.find(t => t.id === id);
  }

  /**
   * 根據產業類型取得範本
   */
  static getByIndustry(industryType) {
    const templates = this.getAll();
    return templates.filter(t =>
      t.industryType === industryType &&
      t.isActive === true
    );
  }

  /**
   * 根據分類取得範本
   */
  static getByCategory(category) {
    const templates = this.getAll();
    return templates.filter(t =>
      t.category === category &&
      t.isActive === true
    );
  }

  /**
   * 更新範本
   */
  static update(id, updates) {
    const templates = this.getAll();
    const index = templates.findIndex(t => t.id === id);

    if (index === -1) {
      throw new Error('範本不存在');
    }

    // 更新資料
    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      // 版本號遞增
      version: this.incrementVersion(templates[index].version)
    };

    this.save(templates);
    return templates[index];
  }

  /**
   * 刪除範本
   */
  static delete(id) {
    const templates = this.getAll();
    const filtered = templates.filter(t => t.id !== id);

    if (filtered.length === templates.length) {
      throw new Error('範本不存在');
    }

    this.save(filtered);
    return true;
  }

  /**
   * 複製範本
   */
  static duplicate(id) {
    const original = this.getById(id);

    if (!original) {
      throw new Error('範本不存在');
    }

    const duplicated = {
      ...original,
      id: `TPL-${Date.now()}`,
      name: `${original.name} (副本)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0',
      usageCount: 0
    };

    const templates = this.getAll();
    templates.push(duplicated);
    this.save(templates);

    return duplicated;
  }

  /**
   * 增加使用次數
   */
  static incrementUsage(id) {
    const template = this.getById(id);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      this.update(id, { usageCount: template.usageCount });
    }
  }

  /**
   * 匯出範本（JSON）
   */
  static export(id) {
    const template = this.getById(id);
    if (!template) {
      throw new Error('範本不存在');
    }

    const exportData = {
      ...template,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 匯入範本
   */
  static import(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // 生成新 ID
      const newTemplate = {
        ...data,
        id: `TPL-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      };

      const templates = this.getAll();
      templates.push(newTemplate);
      this.save(templates);

      return newTemplate;
    } catch (error) {
      throw new Error('匯入範本失敗：' + error.message);
    }
  }

  /**
   * 搜尋範本
   */
  static search(keyword) {
    const templates = this.getAll();
    const lowerKeyword = keyword.toLowerCase();

    return templates.filter(t =>
      t.name.toLowerCase().includes(lowerKeyword) ||
      t.description.toLowerCase().includes(lowerKeyword) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * 儲存資料
   */
  static save(templates) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('儲存範本資料失敗:', error);
      throw error;
    }
  }

  /**
   * 版本號遞增
   */
  static incrementVersion(version) {
    const parts = version.split('.');
    const minor = parseInt(parts[1] || 0) + 1;
    return `${parts[0]}.${minor}`;
  }

  /**
   * 增加範本使用次數
   */
  static incrementUsage(id) {
    const templates = this.getAll();
    const index = templates.findIndex(t => t.id === id);

    if (index !== -1) {
      templates[index].usageCount = (templates[index].usageCount || 0) + 1;
      templates[index].lastUsedAt = new Date().toISOString();
      this.save(templates);
      return templates[index];
    }

    return null;
  }

  /**
   * 初始化預設範本（從產業模組遷移）
   */
  static async initializeDefaultTemplates(industryType, templatesModule) {
    const existingTemplates = this.getByIndustry(industryType);

    // 如果已有範本，不重複初始化
    if (existingTemplates.length > 0) {
      return existingTemplates;
    }

    // 從產業模組讀取預設範本
    const defaultTemplates = templatesModule[Object.keys(templatesModule)[0]] || [];

    // 轉換並儲存
    const created = [];
    for (const tpl of defaultTemplates) {
      const newTemplate = this.create({
        name: tpl.name,
        description: tpl.description,
        category: 'standard',
        industryType: industryType,
        defaultValues: tpl.defaultValues || {},
        tags: tpl.tags || [],
        isPublic: true,
        createdBy: 'SYSTEM-INIT'
      });
      created.push(newTemplate);
    }

    return created;
  }

  /**
   * 取得範本統計
   */
  static getStatistics() {
    const templates = this.getAll();

    return {
      total: templates.length,
      active: templates.filter(t => t.isActive).length,
      byCategory: {
        general: templates.filter(t => t.category === 'general').length,
        standard: templates.filter(t => t.category === 'standard').length,
        custom: templates.filter(t => t.category === 'custom').length
      },
      byIndustry: templates.reduce((acc, t) => {
        acc[t.industryType] = (acc[t.industryType] || 0) + 1;
        return acc;
      }, {}),
      mostUsed: templates
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 5)
    };
  }
}

/**
 * 範本欄位建構器
 */
export class TemplateFieldBuilder {
  constructor() {
    this.fields = [];
  }

  /**
   * 新增文字欄位
   */
  addTextField(config) {
    this.fields.push({
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      name: config.name,
      label: config.label,
      placeholder: config.placeholder || '',
      required: config.required || false,
      defaultValue: config.defaultValue || '',
      validation: config.validation || null
    });
    return this;
  }

  /**
   * 新增數字欄位
   */
  addNumberField(config) {
    this.fields.push({
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'number',
      name: config.name,
      label: config.label,
      placeholder: config.placeholder || '',
      required: config.required || false,
      defaultValue: config.defaultValue || 0,
      min: config.min,
      max: config.max,
      step: config.step || 1,
      unit: config.unit || ''
    });
    return this;
  }

  /**
   * 新增選擇欄位
   */
  addSelectField(config) {
    this.fields.push({
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'select',
      name: config.name,
      label: config.label,
      required: config.required || false,
      options: config.options || [],
      defaultValue: config.defaultValue || ''
    });
    return this;
  }

  /**
   * 新增日期欄位
   */
  addDateField(config) {
    this.fields.push({
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'date',
      name: config.name,
      label: config.label,
      required: config.required || false,
      defaultValue: config.defaultValue || ''
    });
    return this;
  }

  /**
   * 新增文字區域欄位
   */
  addTextareaField(config) {
    this.fields.push({
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'textarea',
      name: config.name,
      label: config.label,
      placeholder: config.placeholder || '',
      required: config.required || false,
      defaultValue: config.defaultValue || '',
      rows: config.rows || 4
    });
    return this;
  }

  /**
   * 取得建構的欄位
   */
  build() {
    return this.fields;
  }

  /**
   * 重設
   */
  reset() {
    this.fields = [];
    return this;
  }
}
