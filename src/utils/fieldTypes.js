/**
 * 欄位類型定義
 * 用於範本編輯器的欄位工具箱
 */

export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime-local',
  EMAIL: 'email',
  URL: 'url',
  TEL: 'tel',
  FILE: 'file'
};

export const FIELD_CATEGORIES = {
  BASIC: '基本欄位',
  ADVANCED: '進階欄位',
  SPECIAL: '特殊欄位'
};

/**
 * 欄位工具箱項目定義
 */
export const FIELD_TOOLBOX_ITEMS = [
  // 基本欄位
  {
    category: FIELD_CATEGORIES.BASIC,
    items: [
      {
        type: FIELD_TYPES.TEXT,
        label: '文字輸入',
        icon: '📝',
        description: '單行文字輸入欄位',
        defaultConfig: {
          name: '',
          label: '文字欄位',
          type: 'text',
          required: false,
          placeholder: '',
          defaultValue: ''
        }
      },
      {
        type: FIELD_TYPES.NUMBER,
        label: '數字輸入',
        icon: '🔢',
        description: '數字輸入欄位',
        defaultConfig: {
          name: '',
          label: '數字欄位',
          type: 'number',
          required: false,
          placeholder: '',
          min: null,
          max: null,
          step: 1,
          defaultValue: ''
        }
      },
      {
        type: FIELD_TYPES.TEXTAREA,
        label: '多行文字',
        icon: '📄',
        description: '多行文字輸入區域',
        defaultConfig: {
          name: '',
          label: '文字區域',
          type: 'textarea',
          required: false,
          placeholder: '',
          rows: 3,
          defaultValue: ''
        }
      },
      {
        type: FIELD_TYPES.SELECT,
        label: '下拉選單',
        icon: '📋',
        description: '下拉選擇欄位',
        defaultConfig: {
          name: '',
          label: '選擇欄位',
          type: 'select',
          required: false,
          options: [
            { value: 'option1', label: '選項 1' },
            { value: 'option2', label: '選項 2' }
          ],
          defaultValue: ''
        }
      }
    ]
  },
  // 進階欄位
  {
    category: FIELD_CATEGORIES.ADVANCED,
    items: [
      {
        type: FIELD_TYPES.RADIO,
        label: '單選按鈕',
        icon: '🔘',
        description: '單選按鈕組',
        defaultConfig: {
          name: '',
          label: '單選欄位',
          type: 'radio',
          required: false,
          options: [
            { value: 'option1', label: '選項 1' },
            { value: 'option2', label: '選項 2' }
          ],
          defaultValue: ''
        }
      },
      {
        type: FIELD_TYPES.CHECKBOX,
        label: '複選框',
        icon: '☑️',
        description: '複選框欄位',
        defaultConfig: {
          name: '',
          label: '複選欄位',
          type: 'checkbox',
          required: false,
          defaultValue: false
        }
      },
      {
        type: FIELD_TYPES.DATE,
        label: '日期',
        icon: '📅',
        description: '日期選擇器',
        defaultConfig: {
          name: '',
          label: '日期欄位',
          type: 'date',
          required: false,
          defaultValue: ''
        }
      },
      {
        type: FIELD_TYPES.TIME,
        label: '時間',
        icon: '🕐',
        description: '時間選擇器',
        defaultConfig: {
          name: '',
          label: '時間欄位',
          type: 'time',
          required: false,
          defaultValue: ''
        }
      }
    ]
  },
  // 特殊欄位
  {
    category: FIELD_CATEGORIES.SPECIAL,
    items: [
      {
        type: FIELD_TYPES.EMAIL,
        label: 'Email',
        icon: '📧',
        description: 'Email 輸入欄位',
        defaultConfig: {
          name: '',
          label: 'Email 欄位',
          type: 'email',
          required: false,
          placeholder: 'example@email.com',
          defaultValue: ''
        }
      },
      {
        type: FIELD_TYPES.URL,
        label: 'URL',
        icon: '🔗',
        description: 'URL 輸入欄位',
        defaultConfig: {
          name: '',
          label: 'URL 欄位',
          type: 'url',
          required: false,
          placeholder: 'https://example.com',
          defaultValue: ''
        }
      },
      {
        type: FIELD_TYPES.TEL,
        label: '電話',
        icon: '📞',
        description: '電話號碼輸入',
        defaultConfig: {
          name: '',
          label: '電話欄位',
          type: 'tel',
          required: false,
          placeholder: '0912-345-678',
          defaultValue: ''
        }
      },
      {
        type: FIELD_TYPES.FILE,
        label: '檔案上傳',
        icon: '📎',
        description: '檔案上傳欄位',
        defaultConfig: {
          name: '',
          label: '檔案欄位',
          type: 'file',
          required: false,
          accept: '*',
          defaultValue: ''
        }
      }
    ]
  }
];

/**
 * 根據欄位類型取得預設配置
 */
export function getDefaultFieldConfig(fieldType) {
  for (const category of FIELD_TOOLBOX_ITEMS) {
    const item = category.items.find(i => i.type === fieldType);
    if (item) {
      return { ...item.defaultConfig };
    }
  }
  return null;
}

/**
 * 驗證欄位配置
 */
export function validateFieldConfig(fieldConfig) {
  const errors = [];

  if (!fieldConfig.name || fieldConfig.name.trim() === '') {
    errors.push('欄位名稱不能為空');
  }

  if (!fieldConfig.label || fieldConfig.label.trim() === '') {
    errors.push('欄位標籤不能為空');
  }

  // 檢查 name 是否符合變數命名規則
  if (fieldConfig.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldConfig.name)) {
    errors.push('欄位名稱只能包含字母、數字和底線，且必須以字母或底線開頭');
  }

  // 檢查 select/radio 必須有選項
  if ((fieldConfig.type === 'select' || fieldConfig.type === 'radio') &&
      (!fieldConfig.options || fieldConfig.options.length === 0)) {
    errors.push('選擇類型欄位必須至少有一個選項');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 生成唯一的欄位 ID
 */
export function generateFieldId() {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
