/**
 * 產業配置檔
 *
 * 定義系統支援的產業模組與當前使用的產業
 */

export const industryConfig = {
  // 當前使用的產業模組
  current: 'filter-regeneration',

  // 所有支援的產業模組
  industries: {
    'filter-regeneration': {
      id: 'filter-regeneration',
      name: '柳營再生濾網製程',
      description: '柳營廠再生濾網製程管理系統 (MES+SPC+WMS+能源管理)',
      icon: '♻️',
      enabled: true,
      // 動態載入產業模組
      fields: () => import('../industries/filter-regeneration/fields.config.js'),
      validations: () => import('../industries/filter-regeneration/validations.js'),
      templates: () => import('../industries/filter-regeneration/templates.js')
    },

    'amc-filter': {
      id: 'amc-filter',
      name: 'AMC 化學濾網',
      description: '空氣分子污染控制化學濾網製造產業',
      icon: '🌫️',
      enabled: false,
      // 動態載入產業模組
      fields: () => import('../industries/amc-filter/fields.config.js'),
      validations: () => import('../industries/amc-filter/validations.js'),
      templates: () => import('../industries/amc-filter/templates.js')
    }

    // 未來產業模組說明：
    // 要新增產業模組時，在 src/industries/ 下建立對應資料夾
    // 並在此處新增配置
  }
};

/**
 * 取得當前產業配置
 */
export function getCurrentIndustry() {
  return industryConfig.industries[industryConfig.current];
}

/**
 * 取得所有已啟用的產業
 */
export function getEnabledIndustries() {
  return Object.values(industryConfig.industries)
    .filter(industry => industry.enabled !== false);
}

/**
 * 切換產業模組
 */
export function switchIndustry(industryId) {
  if (!industryConfig.industries[industryId]) {
    throw new Error(`產業模組不存在: ${industryId}`);
  }

  const industry = industryConfig.industries[industryId];
  if (industry.enabled === false) {
    throw new Error(`產業模組尚未啟用: ${industryId}`);
  }

  industryConfig.current = industryId;

  // 儲存到 localStorage
  localStorage.setItem('rms_current_industry', industryId);

  return industry;
}

/**
 * 從 localStorage 載入產業設定
 */
export function loadIndustryFromStorage() {
  // 檢查是否在瀏覽器環境
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const savedIndustry = localStorage.getItem('rms_current_industry');
    if (savedIndustry && industryConfig.industries[savedIndustry]) {
      industryConfig.current = savedIndustry;
    }
  }
}

// 自動載入儲存的產業設定（僅在瀏覽器環境）
if (typeof window !== 'undefined') {
  loadIndustryFromStorage();
}
