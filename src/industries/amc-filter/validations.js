/**
 * AMC 化學濾網產業模組 - 驗證規則
 *
 * 定義各欄位的自訂驗證邏輯
 */

export const amcFilterValidations = {
  /**
   * 產品名稱驗證
   */
  productName: (value) => {
    if (!value || value.trim() === '') {
      return { valid: false, message: '產品名稱為必填欄位' };
    }

    if (value.length < 2) {
      return { valid: false, message: '產品名稱至少需要 2 個字元' };
    }

    return { valid: true };
  },

  /**
   * 濃度驗證
   */
  concentration: (value) => {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, message: '濃度必須為數字' };
    }

    if (num < 0 || num > 100) {
      return { valid: false, message: '濃度必須在 0-100% 之間' };
    }

    return { valid: true };
  },

  /**
   * 溫度驗證
   */
  temperature: (value) => {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, message: '溫度必須為數字' };
    }

    if (num < 0 || num > 300) {
      return { valid: false, message: '溫度必須在 0-300°C 之間' };
    }

    // 警告：高溫
    if (num > 200) {
      return {
        valid: true,
        warning: '溫度超過 200°C，請確認設備耐溫等級'
      };
    }

    return { valid: true };
  },

  /**
   * 壓力驗證
   */
  pressure: (value) => {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, message: '壓力必須為數字' };
    }

    if (num < 0 || num > 10) {
      return { valid: false, message: '壓力必須在 0-10 bar 之間' };
    }

    return { valid: true };
  },

  /**
   * 過濾效率驗證
   */
  efficiency: (value) => {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, message: '過濾效率必須為數字' };
    }

    if (num < 90 || num > 100) {
      return { valid: false, message: '過濾效率必須在 90-100% 之間' };
    }

    // 警告：效率較低
    if (num < 95) {
      return {
        valid: true,
        warning: '過濾效率低於 95%，建議檢查配方參數'
      };
    }

    return { valid: true };
  },

  /**
   * 碳重驗證
   */
  carbonWeight: (value) => {
    if (!value) return { valid: true }; // 非必填

    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, message: '碳重必須為數字' };
    }

    if (num < 0) {
      return { valid: false, message: '碳重不能為負數' };
    }

    return { valid: true };
  },

  /**
   * 混合時間驗證
   */
  mixingTime: (value) => {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, message: '混合時間必須為數字' };
    }

    if (num <= 0) {
      return { valid: false, message: '混合時間必須大於 0' };
    }

    return { valid: true };
  },

  /**
   * 固化時間驗證
   */
  curingTime: (value) => {
    const num = parseFloat(value);

    if (isNaN(num)) {
      return { valid: false, message: '固化時間必須為數字' };
    }

    if (num <= 0) {
      return { valid: false, message: '固化時間必須大於 0' };
    }

    return { valid: true };
  }
};

/**
 * 驗證整份配方
 * @param {Object} recipeData - 配方資料
 * @returns {Object} { valid: boolean, errors: [], warnings: [] }
 */
export function validateRecipe(recipeData) {
  const errors = [];
  const warnings = [];

  // 逐欄位驗證
  for (const [fieldName, validator] of Object.entries(amcFilterValidations)) {
    const value = recipeData[fieldName];
    const result = validator(value);

    if (!result.valid) {
      errors.push({
        field: fieldName,
        message: result.message
      });
    }

    if (result.warning) {
      warnings.push({
        field: fieldName,
        message: result.warning
      });
    }
  }

  // 跨欄位驗證
  const crossFieldValidation = validateCrossFields(recipeData);
  errors.push(...crossFieldValidation.errors);
  warnings.push(...crossFieldValidation.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 跨欄位驗證（檢查欄位間的邏輯關係）
 */
function validateCrossFields(recipeData) {
  const errors = [];
  const warnings = [];

  // 驗證：複合濾網必須填寫活性碳資訊
  if (recipeData.filterType === 'composite') {
    if (!recipeData.activatedCarbon || !recipeData.carbonWeight) {
      warnings.push({
        field: 'filterType',
        message: '複合濾網建議填寫活性碳類型與碳重資訊'
      });
    }
  }

  // 驗證：高溫 + 高壓組合警告
  if (recipeData.temperature > 150 && recipeData.pressure > 5) {
    warnings.push({
      field: 'process',
      message: '高溫高壓組合，請確認設備安全等級'
    });
  }

  return { errors, warnings };
}
