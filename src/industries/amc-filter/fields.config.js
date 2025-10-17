/**
 * AMC 化學濾網產業模組 - 配方欄位定義
 *
 * 產業：AMC (Airborne Molecular Contamination) 化學濾網製造
 * 用途：定義配方表單的欄位結構
 */

export const amcFilterFields = {
  // 基本資訊
  basic: [
    {
      name: 'productName',
      label: '產品名稱',
      type: 'text',
      required: true,
      placeholder: '例：高效化學濾網'
    },
    {
      name: 'filterType',
      label: '濾網類型',
      type: 'select',
      required: true,
      options: [
        { value: 'activated-carbon', label: '活性碳濾網' },
        { value: 'chemical', label: '化學濾網' },
        { value: 'composite', label: '複合濾網' }
      ]
    },
    {
      name: 'description',
      label: '配方說明',
      type: 'textarea',
      required: false,
      placeholder: '簡述此配方的用途、特色等'
    }
  ],

  // 材料配方
  materials: [
    {
      name: 'chemicalAgent',
      label: '化學藥劑',
      type: 'text',
      required: true,
      placeholder: '例：活性氧化鋁'
    },
    {
      name: 'concentration',
      label: '濃度 (%)',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      step: 0.1,
      placeholder: '0-100'
    },
    {
      name: 'activatedCarbon',
      label: '活性碳類型',
      type: 'text',
      placeholder: '例：椰殼活性碳'
    },
    {
      name: 'carbonWeight',
      label: '碳重 (g)',
      type: 'number',
      min: 0,
      step: 0.1,
      placeholder: '單位：公克'
    },
    {
      name: 'additives',
      label: '添加劑',
      type: 'textarea',
      placeholder: '請列出所有添加劑及其比例'
    }
  ],

  // 製程參數
  process: [
    {
      name: 'temperature',
      label: '反應溫度 (°C)',
      type: 'number',
      required: true,
      min: 0,
      max: 300,
      placeholder: '0-300'
    },
    {
      name: 'pressure',
      label: '壓力 (bar)',
      type: 'number',
      required: true,
      min: 0,
      max: 10,
      step: 0.1,
      placeholder: '0-10'
    },
    {
      name: 'mixingTime',
      label: '混合時間 (min)',
      type: 'number',
      required: true,
      min: 0,
      placeholder: '單位：分鐘'
    },
    {
      name: 'curingTime',
      label: '固化時間 (hr)',
      type: 'number',
      required: true,
      min: 0,
      step: 0.5,
      placeholder: '單位：小時'
    },
    {
      name: 'humidity',
      label: '濕度 (%)',
      type: 'number',
      min: 0,
      max: 100,
      placeholder: '0-100'
    }
  ],

  // 品質標準
  quality: [
    {
      name: 'efficiency',
      label: '過濾效率 (%)',
      type: 'number',
      required: true,
      min: 90,
      max: 100,
      step: 0.1,
      placeholder: '90-100'
    },
    {
      name: 'lifespan',
      label: '使用壽命 (月)',
      type: 'number',
      min: 1,
      placeholder: '預期使用壽命'
    },
    {
      name: 'testMethod',
      label: '測試方法',
      type: 'textarea',
      placeholder: '描述品質測試的方法與標準'
    },
    {
      name: 'certifications',
      label: '認證標準',
      type: 'text',
      placeholder: '例：ISO 14644-1, IEST-RP-CC001'
    }
  ]
};

/**
 * 欄位群組定義（用於 UI 呈現）
 */
export const fieldGroups = [
  {
    id: 'basic',
    label: '基本資訊',
    icon: '📋',
    fields: amcFilterFields.basic
  },
  {
    id: 'materials',
    label: '材料配方',
    icon: '🧪',
    fields: amcFilterFields.materials
  },
  {
    id: 'process',
    label: '製程參數',
    icon: '⚙️',
    fields: amcFilterFields.process
  },
  {
    id: 'quality',
    label: '品質標準',
    icon: '✓',
    fields: amcFilterFields.quality
  }
];

/**
 * 取得所有欄位（扁平化）
 */
export function getAllFields() {
  return [
    ...amcFilterFields.basic,
    ...amcFilterFields.materials,
    ...amcFilterFields.process,
    ...amcFilterFields.quality
  ];
}

/**
 * 取得必填欄位列表
 */
export function getRequiredFields() {
  return getAllFields().filter(field => field.required);
}
