/**
 * 系統配置管理
 * 管理來源廠別等可配置選項
 */

const STORAGE_KEY = 'msw_system_config';

/**
 * 預設配置
 */
const DEFAULT_CONFIG = {
  sourceFactories: ['柳營廠', '台南廠', '高雄廠', '其他'],
  filterTypes: ['活性碳濾網', '化學濾網', '複合濾網'],
  ovenIds: ['烘箱-01', '烘箱-02', '烘箱-03', '烘箱-04'],
  degassingTestResults: ['待檢驗', '合格', '未達標(加抽2片)', '超標(回爐重烤)', '報廢'],
  aoiResults: ['OK', 'NG-污染', 'NG-破洞', 'NG-嚴重瑕疵', '報廢'],
  rfidUpdateStatus: ['待更換', '已更換', '異常'],
  qualityGrades: ['A (優良)', 'B (良好)', 'C (合格)', 'D (不合格)', 'E (報廢)'],
  stationLocations: ['除膠區', '烘箱區', '檢驗區', 'RFID區', '包裝區', '成品倉', '出貨區'],
  lastUpdated: Date.now()
};

/**
 * 取得系統配置
 */
export function getSystemConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      saveSystemConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load system config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * 儲存系統配置
 */
export function saveSystemConfig(config) {
  try {
    config.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save system config:', error);
    return false;
  }
}

/**
 * 通用函數：取得配置選項
 */
export function getConfigOptions(key) {
  const config = getSystemConfig();
  return config[key] || DEFAULT_CONFIG[key] || [];
}

/**
 * 通用函數：更新配置選項
 */
export function updateConfigOptions(key, options) {
  const config = getSystemConfig();
  config[key] = options;
  return saveSystemConfig(config);
}

/**
 * 通用函數：新增選項
 */
export function addConfigOption(key, value) {
  const config = getSystemConfig();
  if (!config[key]) {
    config[key] = DEFAULT_CONFIG[key] || [];
  }
  if (!config[key].includes(value)) {
    config[key].push(value);
    return saveSystemConfig(config);
  }
  return false;
}

/**
 * 通用函數：刪除選項
 */
export function removeConfigOption(key, value) {
  const config = getSystemConfig();
  if (!config[key]) return false;

  const index = config[key].indexOf(value);
  if (index > -1) {
    config[key].splice(index, 1);
    return saveSystemConfig(config);
  }
  return false;
}

// 便利函數
export const getSourceFactories = () => getConfigOptions('sourceFactories');
export const getFilterTypes = () => getConfigOptions('filterTypes');
export const getOvenIds = () => getConfigOptions('ovenIds');
export const getDegassingTestResults = () => getConfigOptions('degassingTestResults');
export const getAoiResults = () => getConfigOptions('aoiResults');
export const getRfidUpdateStatus = () => getConfigOptions('rfidUpdateStatus');
export const getQualityGrades = () => getConfigOptions('qualityGrades');
export const getStationLocations = () => getConfigOptions('stationLocations');

/**
 * 重設為預設配置
 */
export function resetToDefault() {
  return saveSystemConfig({ ...DEFAULT_CONFIG });
}
