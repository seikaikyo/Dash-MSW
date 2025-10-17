/**
 * 條件判斷引擎
 * 用於評估流程中的條件分支邏輯
 */
export class ConditionEvaluator {
  /**
   * 評估單一條件
   * @param {Object} formData - 表單資料
   * @param {Object} condition - 條件配置 { field, operator, value }
   * @returns {boolean} - 條件是否符合
   */
  evaluateCondition(formData, condition) {
    const { field, operator, value } = condition;

    // 取得表單欄位值
    const fieldValue = formData[field];

    // 如果欄位不存在，視為條件不符合
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }

    // 根據運算子進行比較
    switch (operator) {
      case '>':
        return this.compareNumbers(fieldValue, value, (a, b) => a > b);

      case '<':
        return this.compareNumbers(fieldValue, value, (a, b) => a < b);

      case '>=':
        return this.compareNumbers(fieldValue, value, (a, b) => a >= b);

      case '<=':
        return this.compareNumbers(fieldValue, value, (a, b) => a <= b);

      case '==':
        return this.compareEqual(fieldValue, value);

      case '!=':
        return !this.compareEqual(fieldValue, value);

      case 'contains':
        return this.compareContains(fieldValue, value);

      case 'startsWith':
        return String(fieldValue).startsWith(String(value));

      case 'endsWith':
        return String(fieldValue).endsWith(String(value));

      case 'isEmpty':
        return this.isEmpty(fieldValue);

      case 'isNotEmpty':
        return !this.isEmpty(fieldValue);

      default:
        console.warn(`未知的運算子: ${operator}`);
        return false;
    }
  }

  /**
   * 數值比較
   */
  compareNumbers(fieldValue, compareValue, compareFn) {
    const num1 = this.parseNumber(fieldValue);
    const num2 = this.parseNumber(compareValue);

    if (num1 === null || num2 === null) {
      return false;
    }

    return compareFn(num1, num2);
  }

  /**
   * 解析數值
   */
  parseNumber(value) {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * 相等比較
   */
  compareEqual(fieldValue, compareValue) {
    // 嘗試數值比較
    const num1 = this.parseNumber(fieldValue);
    const num2 = this.parseNumber(compareValue);

    if (num1 !== null && num2 !== null) {
      return num1 === num2;
    }

    // 字串比較（不區分大小寫）
    return String(fieldValue).toLowerCase() === String(compareValue).toLowerCase();
  }

  /**
   * 包含比較
   */
  compareContains(fieldValue, compareValue) {
    const str = String(fieldValue).toLowerCase();
    const search = String(compareValue).toLowerCase();
    return str.includes(search);
  }

  /**
   * 檢查是否為空
   */
  isEmpty(value) {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string') {
      return value.trim() === '';
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return false;
  }

  /**
   * 評估條件組（支援 AND/OR 邏輯）
   * @param {Object} formData - 表單資料
   * @param {Object} conditionGroup - 條件組配置 { logic, conditions }
   * @returns {boolean} - 條件組是否符合
   */
  evaluateConditionGroup(formData, conditionGroup) {
    const { logic, conditions } = conditionGroup;

    // 如果沒有條件，視為不符合
    if (!conditions || conditions.length === 0) {
      return false;
    }

    // AND 邏輯：所有條件都必須符合
    if (logic === 'AND') {
      return conditions.every(condition =>
        this.evaluateCondition(formData, condition)
      );
    }

    // OR 邏輯：至少一個條件符合
    if (logic === 'OR') {
      return conditions.some(condition =>
        this.evaluateCondition(formData, condition)
      );
    }

    console.warn(`未知的邏輯運算子: ${logic}`);
    return false;
  }

  /**
   * 評估多個條件規則，返回第一個符合的規則
   * @param {Object} formData - 表單資料
   * @param {Array} rules - 條件規則陣列
   * @returns {Object|null} - 符合的規則，如果都不符合則返回 null
   */
  evaluateRules(formData, rules) {
    if (!rules || rules.length === 0) {
      return null;
    }

    // 依序評估每個規則
    for (const rule of rules) {
      const result = this.evaluateConditionGroup(formData, rule.conditionGroup);

      if (result) {
        return rule;
      }
    }

    return null;
  }

  /**
   * 取得條件描述文字（用於顯示）
   * @param {Object} condition - 條件配置
   * @returns {string} - 條件描述
   */
  getConditionDescription(condition) {
    const { field, operator, value } = condition;

    const operatorNames = {
      '>': '大於',
      '<': '小於',
      '>=': '大於等於',
      '<=': '小於等於',
      '==': '等於',
      '!=': '不等於',
      'contains': '包含',
      'startsWith': '開頭是',
      'endsWith': '結尾是',
      'isEmpty': '為空',
      'isNotEmpty': '不為空'
    };

    const opName = operatorNames[operator] || operator;

    if (operator === 'isEmpty' || operator === 'isNotEmpty') {
      return `${field} ${opName}`;
    }

    return `${field} ${opName} ${value}`;
  }

  /**
   * 取得條件組描述文字
   * @param {Object} conditionGroup - 條件組配置
   * @returns {string} - 條件組描述
   */
  getConditionGroupDescription(conditionGroup) {
    const { logic, conditions } = conditionGroup;

    if (!conditions || conditions.length === 0) {
      return '無條件';
    }

    const descriptions = conditions.map(c => this.getConditionDescription(c));
    const logicText = logic === 'AND' ? ' 且 ' : ' 或 ';

    return descriptions.join(logicText);
  }
}
