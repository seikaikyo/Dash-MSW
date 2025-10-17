/**
 * 柳營再生濾網製程範本
 */

export const filterRegenerationTemplates = [
  {
    id: 'standard-regeneration',
    name: '標準再生製程',
    description: '適用於一般活性碳濾網與化學濾網的標準再生流程',
    category: '標準流程',
    defaultValues: {
      // 基本資訊
      filterType: '活性碳濾網',
      regenerationCycle: 'R0 (首次再生)',
      quantity: 50,

      // 製程站點
      targetTemp: 120,
      bakingTime: 180,
      degassingTest: '待檢驗',
      aoiResult: 'OK',

      // RFID 與包裝
      rfidUpdate: '待更換',

      // 品質標準
      filterEfficiency: 95,
      expectedLifespan: 12,
      qualityGrade: 'B (良好)',
      remarks: '標準再生製程'
    }
  },

  {
    id: 'high-temp-regeneration',
    name: '高溫再生製程',
    description: '適用於重度污染濾網，需較高溫度處理',
    category: '特殊流程',
    defaultValues: {
      // 基本資訊
      filterType: '化學濾網',
      regenerationCycle: 'R0 (首次再生)',
      quantity: 30,

      // 製程站點
      targetTemp: 160,
      bakingTime: 240,
      degassingTest: '待檢驗',
      aoiResult: 'OK',

      // RFID 與包裝
      rfidUpdate: '待更換',

      // 品質標準
      filterEfficiency: 92,
      expectedLifespan: 10,
      qualityGrade: 'B (良好)',
      remarks: '高溫再生製程，適用重度污染'
    }
  },

  {
    id: 'low-temp-regeneration',
    name: '低溫再生製程',
    description: '適用於輕度污染或敏感材質濾網',
    category: '特殊流程',
    defaultValues: {
      // 基本資訊
      filterType: '複合濾網',
      regenerationCycle: 'R0 (首次再生)',
      quantity: 40,

      // 製程站點
      targetTemp: 100,
      bakingTime: 150,
      degassingTest: '待檢驗',
      aoiResult: 'OK',

      // RFID 與包裝
      rfidUpdate: '待更換',

      // 品質標準
      filterEfficiency: 93,
      expectedLifespan: 14,
      qualityGrade: 'A (優良)',
      remarks: '低溫再生製程，保護敏感材質'
    }
  },

  {
    id: 'multi-cycle-regeneration',
    name: '多次再生製程',
    description: '適用於 R1 以上的多次再生濾網',
    category: '多次再生',
    defaultValues: {
      // 基本資訊
      filterType: '活性碳濾網',
      regenerationCycle: 'R1 (第二次)',
      quantity: 25,

      // 製程站點
      targetTemp: 130,
      bakingTime: 200,
      degassingTest: '待檢驗',
      aoiResult: 'OK',

      // RFID 與包裝
      rfidUpdate: '待更換',

      // 品質標準
      filterEfficiency: 88,
      expectedLifespan: 8,
      qualityGrade: 'C (合格)',
      remarks: '多次再生，品質標準降低'
    }
  },

  {
    id: 'express-regeneration',
    name: '快速再生製程',
    description: '緊急訂單用，縮短製程時間',
    category: '快速流程',
    defaultValues: {
      // 基本資訊
      filterType: '活性碳濾網',
      regenerationCycle: 'R0 (首次再生)',
      quantity: 20,

      // 製程站點
      targetTemp: 140,
      bakingTime: 120,
      degassingTest: '待檢驗',
      aoiResult: 'OK',

      // RFID 與包裝
      rfidUpdate: '待更換',

      // 品質標準
      filterEfficiency: 90,
      expectedLifespan: 10,
      qualityGrade: 'B (良好)',
      remarks: '快速製程，緊急訂單使用'
    }
  },

  {
    id: 'quality-test-regeneration',
    name: '品質測試製程',
    description: '用於新製程驗證與品質測試',
    category: '測試流程',
    defaultValues: {
      // 基本資訊
      filterType: '化學濾網',
      regenerationCycle: 'R0 (首次再生)',
      quantity: 10,

      // 製程站點
      targetTemp: 125,
      bakingTime: 180,
      degassingTest: '待檢驗',
      aoiResult: 'OK',

      // RFID 與包裝
      rfidUpdate: '待更換',

      // 品質標準
      filterEfficiency: 95,
      expectedLifespan: 12,
      qualityGrade: 'A (優良)',
      remarks: '品質測試用，需詳細記錄所有參數'
    }
  }
];

/**
 * 根據濾網類型與再生次數推薦範本
 */
export function recommendTemplate(filterType, regenerationCycle) {
  // 多次再生優先推薦多次再生製程
  if (regenerationCycle && regenerationCycle.startsWith('R1')) {
    return filterRegenerationTemplates.find(t => t.id === 'multi-cycle-regeneration');
  }

  // 根據濾網類型推薦
  if (filterType === '複合濾網') {
    return filterRegenerationTemplates.find(t => t.id === 'low-temp-regeneration');
  }

  // 預設返回標準製程
  return filterRegenerationTemplates.find(t => t.id === 'standard-regeneration');
}

/**
 * 根據污染程度推薦製程參數
 */
export function recommendProcessByContamination(contaminationLevel) {
  const recommendations = {
    'light': {
      targetTemp: 100,
      bakingTime: 150,
      templateId: 'low-temp-regeneration'
    },
    'medium': {
      targetTemp: 120,
      bakingTime: 180,
      templateId: 'standard-regeneration'
    },
    'heavy': {
      targetTemp: 160,
      bakingTime: 240,
      templateId: 'high-temp-regeneration'
    }
  };

  return recommendations[contaminationLevel] || recommendations['medium'];
}
