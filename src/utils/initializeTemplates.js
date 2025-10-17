/**
 * 初始化預設範本
 * 從現有的產業模組遷移範本資料到 TemplateModel
 */

import { TemplateModel } from './templateModel.js';

/**
 * 初始化 AMC 化學濾網範本
 */
export function initializeAMCTemplates() {
  // 檢查是否已經初始化過
  const existing = TemplateModel.getByIndustry('amc-filter');
  if (existing.length > 0) {
    console.log('AMC 範本已存在，跳過初始化');
    return existing;
  }

  console.log('開始初始化 AMC 化學濾網範本...');

  // 範本 1: 標準配方範本
  const template1 = TemplateModel.create({
    name: '標準配方範本',
    description: '適用於一般化學濾網生產的標準配方',
    category: 'standard',
    industryType: 'amc-filter',
    fields: [
      // 基本資訊群組
      { name: 'productName', label: '產品名稱', type: 'text', required: true, defaultValue: '' },
      { name: 'filterType', label: '濾網類型', type: 'select', required: true,
        options: ['化學濾網', '活性碳濾網', '複合濾網'], defaultValue: '化學濾網' },

      // 材料配方群組
      { name: 'chemicalAgent', label: '化學藥劑', type: 'select', required: true,
        options: ['活性氧化鋁', '沸石', '活性碳', '矽膠'], defaultValue: '活性氧化鋁' },
      { name: 'concentration', label: '濃度 (%)', type: 'number', required: true,
        min: 0, max: 100, defaultValue: 15 },
      { name: 'carbonType', label: '活性碳類型', type: 'select', required: true,
        options: ['椰殼活性碳', '煤質活性碳', '木質活性碳'], defaultValue: '椰殼活性碳' },
      { name: 'carbonWeight', label: '碳重 (g)', type: 'number', required: true,
        min: 0, max: 1000, defaultValue: 200 },

      // 製程參數群組
      { name: 'reactionTemp', label: '反應溫度 (°C)', type: 'number', required: true,
        min: 0, max: 300, defaultValue: 180 },
      { name: 'pressure', label: '壓力 (bar)', type: 'number', required: true,
        min: 0, max: 50, defaultValue: 5 },
      { name: 'mixingTime', label: '混合時間 (min)', type: 'number', required: true,
        min: 0, max: 120, defaultValue: 30 },
      { name: 'curingTime', label: '固化時間 (hr)', type: 'number', required: true,
        min: 0, max: 48, defaultValue: 12 },

      // 品質標準群組
      { name: 'filterEfficiency', label: '過濾效率 (%)', type: 'number', required: true,
        min: 0, max: 100, defaultValue: 95 },
      { name: 'lifespan', label: '使用壽命 (月)', type: 'number', required: true,
        min: 0, max: 60, defaultValue: 24 },
      { name: 'testMethod', label: '測試方法', type: 'text', required: true,
        defaultValue: 'GB/T 14295-2008' }
    ],
    tags: ['標準', '化學濾網', '常用'],
    createdBy: 'SYSTEM-INIT',
    isPublic: true
  });

  // 範本 2: 高效化學濾網範本
  const template2 = TemplateModel.create({
    name: '高效化學濾網範本',
    description: '適用於高效能化學濾網，具有更高的過濾效率要求',
    category: 'standard',
    industryType: 'amc-filter',
    fields: [
      { name: 'productName', label: '產品名稱', type: 'text', required: true, defaultValue: '高效化學濾網' },
      { name: 'filterType', label: '濾網類型', type: 'select', required: true,
        options: ['化學濾網', '活性碳濾網', '複合濾網'], defaultValue: '化學濾網' },
      { name: 'chemicalAgent', label: '化學藥劑', type: 'select', required: true,
        options: ['活性氧化鋁', '沸石', '活性碳', '矽膠'], defaultValue: '活性氧化鋁' },
      { name: 'concentration', label: '濃度 (%)', type: 'number', required: true,
        min: 0, max: 100, defaultValue: 20 },
      { name: 'carbonType', label: '活性碳類型', type: 'select', required: true,
        options: ['椰殼活性碳', '煤質活性碳', '木質活性碳'], defaultValue: '椰殼活性碳' },
      { name: 'carbonWeight', label: '碳重 (g)', type: 'number', required: true,
        min: 0, max: 1000, defaultValue: 250 },
      { name: 'reactionTemp', label: '反應溫度 (°C)', type: 'number', required: true,
        min: 0, max: 300, defaultValue: 200 },
      { name: 'pressure', label: '壓力 (bar)', type: 'number', required: true,
        min: 0, max: 50, defaultValue: 8 },
      { name: 'mixingTime', label: '混合時間 (min)', type: 'number', required: true,
        min: 0, max: 120, defaultValue: 45 },
      { name: 'curingTime', label: '固化時間 (hr)', type: 'number', required: true,
        min: 0, max: 48, defaultValue: 16 },
      { name: 'filterEfficiency', label: '過濾效率 (%)', type: 'number', required: true,
        min: 0, max: 100, defaultValue: 98 },
      { name: 'lifespan', label: '使用壽命 (月)', type: 'number', required: true,
        min: 0, max: 60, defaultValue: 36 },
      { name: 'testMethod', label: '測試方法', type: 'text', required: true,
        defaultValue: 'GB/T 14295-2008' }
    ],
    tags: ['高效', '化學濾網', '推薦'],
    createdBy: 'SYSTEM-INIT',
    isPublic: true
  });

  // 範本 3: 複合濾網範本
  const template3 = TemplateModel.create({
    name: '複合濾網範本',
    description: '結合多種材料的複合型濾網配方',
    category: 'standard',
    industryType: 'amc-filter',
    fields: [
      { name: 'productName', label: '產品名稱', type: 'text', required: true, defaultValue: '複合濾網' },
      { name: 'filterType', label: '濾網類型', type: 'select', required: true,
        options: ['化學濾網', '活性碳濾網', '複合濾網'], defaultValue: '複合濾網' },
      { name: 'chemicalAgent', label: '化學藥劑', type: 'select', required: true,
        options: ['活性氧化鋁', '沸石', '活性碳', '矽膠'], defaultValue: '沸石' },
      { name: 'concentration', label: '濃度 (%)', type: 'number', required: true,
        min: 0, max: 100, defaultValue: 25 },
      { name: 'carbonType', label: '活性碳類型', type: 'select', required: true,
        options: ['椰殼活性碳', '煤質活性碳', '木質活性碳'], defaultValue: '木質活性碳' },
      { name: 'carbonWeight', label: '碳重 (g)', type: 'number', required: true,
        min: 0, max: 1000, defaultValue: 300 },
      { name: 'reactionTemp', label: '反應溫度 (°C)', type: 'number', required: true,
        min: 0, max: 300, defaultValue: 190 },
      { name: 'pressure', label: '壓力 (bar)', type: 'number', required: true,
        min: 0, max: 50, defaultValue: 6 },
      { name: 'mixingTime', label: '混合時間 (min)', type: 'number', required: true,
        min: 0, max: 120, defaultValue: 40 },
      { name: 'curingTime', label: '固化時間 (hr)', type: 'number', required: true,
        min: 0, max: 48, defaultValue: 18 },
      { name: 'filterEfficiency', label: '過濾效率 (%)', type: 'number', required: true,
        min: 0, max: 100, defaultValue: 96 },
      { name: 'lifespan', label: '使用壽命 (月)', type: 'number', required: true,
        min: 0, max: 60, defaultValue: 30 },
      { name: 'testMethod', label: '測試方法', type: 'text', required: true,
        defaultValue: 'GB/T 14295-2008' }
    ],
    tags: ['複合', '多功能', '特殊應用'],
    createdBy: 'SYSTEM-INIT',
    isPublic: true
  });

  // 範本 4: 低溫應用範本
  const template4 = TemplateModel.create({
    name: '低溫應用濾網範本',
    description: '適用於低溫環境的特殊配方',
    category: 'standard',
    industryType: 'amc-filter',
    fields: [
      { name: 'productName', label: '產品名稱', type: 'text', required: true, defaultValue: '低溫濾網' },
      { name: 'filterType', label: '濾網類型', type: 'select', required: true,
        options: ['化學濾網', '活性碳濾網', '複合濾網'], defaultValue: '化學濾網' },
      { name: 'chemicalAgent', label: '化學藥劑', type: 'select', required: true,
        options: ['活性氧化鋁', '沸石', '活性碳', '矽膠'], defaultValue: '矽膠' },
      { name: 'concentration', label: '濃度 (%)', type: 'number', required: true,
        min: 0, max: 100, defaultValue: 12 },
      { name: 'carbonType', label: '活性碳類型', type: 'select', required: true,
        options: ['椰殼活性碳', '煤質活性碳', '木質活性碳'], defaultValue: '煤質活性碳' },
      { name: 'carbonWeight', label: '碳重 (g)', type: 'number', required: true,
        min: 0, max: 1000, defaultValue: 180 },
      { name: 'reactionTemp', label: '反應溫度 (°C)', type: 'number', required: true,
        min: 0, max: 300, defaultValue: 120 },
      { name: 'pressure', label: '壓力 (bar)', type: 'number', required: true,
        min: 0, max: 50, defaultValue: 3 },
      { name: 'mixingTime', label: '混合時間 (min)', type: 'number', required: true,
        min: 0, max: 120, defaultValue: 25 },
      { name: 'curingTime', label: '固化時間 (hr)', type: 'number', required: true,
        min: 0, max: 48, defaultValue: 10 },
      { name: 'filterEfficiency', label: '過濾效率 (%)', type: 'number', required: true,
        min: 0, max: 100, defaultValue: 92 },
      { name: 'lifespan', label: '使用壽命 (月)', type: 'number', required: true,
        min: 0, max: 60, defaultValue: 20 },
      { name: 'testMethod', label: '測試方法', type: 'text', required: true,
        defaultValue: 'GB/T 14295-2008' }
    ],
    tags: ['低溫', '特殊應用', '專用'],
    createdBy: 'SYSTEM-INIT',
    isPublic: true
  });

  console.log('✅ AMC 化學濾網範本初始化完成！');
  console.log(`已建立 ${[template1, template2, template3, template4].length} 個範本`);

  return [template1, template2, template3, template4];
}

/**
 * 初始化所有預設範本
 */
export function initializeAllTemplates() {
  const templates = [];

  // 初始化 AMC 範本
  templates.push(...initializeAMCTemplates());

  // 未來可以加入其他產業範本
  // templates.push(...initializeFoodTemplates());
  // templates.push(...initializePharmaTemplates());

  return templates;
}
