/**
 * AMC 化學濾網產業模組 - 配方範本
 *
 * 提供常用的配方範本，方便快速建立新配方
 */

export const amcFilterTemplates = [
  {
    id: 'standard-carbon',
    name: '標準活性碳濾網',
    description: '適用於一般空氣淨化場景的標準活性碳濾網配方',
    category: '活性碳濾網',
    icon: '🌫️',
    defaultValues: {
      // 基本資訊
      productName: '標準活性碳濾網',
      filterType: 'activated-carbon',
      description: '適用於一般空氣淨化場景的標準活性碳濾網配方',

      // 材料配方
      chemicalAgent: '活性氧化鋁',
      concentration: 10,
      activatedCarbon: '椰殼活性碳',
      carbonWeight: 500,
      additives: '黏合劑 5%',

      // 製程參數
      temperature: 120,
      pressure: 2,
      mixingTime: 30,
      curingTime: 4,
      humidity: 60,

      // 品質標準
      efficiency: 95,
      lifespan: 12,
      testMethod: '依據 ISO 14644-1 標準進行粒子計數測試',
      certifications: 'ISO 14644-1'
    }
  },

  {
    id: 'high-efficiency-chemical',
    name: '高效化學濾網',
    description: '高效能化學濾網，適用於半導體廠房等高潔淨度要求場景',
    category: '化學濾網',
    icon: '⚗️',
    defaultValues: {
      // 基本資訊
      productName: '高效化學濾網',
      filterType: 'chemical',
      description: '高效能化學濾網，適用於半導體廠房等高潔淨度要求場景',

      // 材料配方
      chemicalAgent: '高純度活性氧化鋁',
      concentration: 20,
      activatedCarbon: '',
      carbonWeight: 0,
      additives: '觸媒 3%, 黏合劑 5%',

      // 製程參數
      temperature: 150,
      pressure: 3,
      mixingTime: 45,
      curingTime: 6,
      humidity: 50,

      // 品質標準
      efficiency: 99,
      lifespan: 18,
      testMethod: '依據 IEST-RP-CC001 標準進行化學氣體去除效率測試',
      certifications: 'IEST-RP-CC001, ISO 14644-1'
    }
  },

  {
    id: 'composite-filter',
    name: '複合式濾網',
    description: '結合活性碳與化學吸附的複合濾網，適用於多種污染物環境',
    category: '複合濾網',
    icon: '🔬',
    defaultValues: {
      // 基本資訊
      productName: '複合式濾網',
      filterType: 'composite',
      description: '結合活性碳與化學吸附的複合濾網，適用於多種污染物環境',

      // 材料配方
      chemicalAgent: '改質活性氧化鋁',
      concentration: 15,
      activatedCarbon: '煤質活性碳',
      carbonWeight: 300,
      additives: '觸媒 2%, 黏合劑 5%, 抗菌劑 1%',

      // 製程參數
      temperature: 135,
      pressure: 2.5,
      mixingTime: 40,
      curingTime: 5,
      humidity: 55,

      // 品質標準
      efficiency: 97,
      lifespan: 15,
      testMethod: '依據 ISO 14644-1 與 IEST-RP-CC001 雙標準測試',
      certifications: 'ISO 14644-1, IEST-RP-CC001'
    }
  },

  {
    id: 'low-temp-carbon',
    name: '低溫活性碳濾網',
    description: '低溫製程活性碳濾網，適用於對溫度敏感的應用場景',
    category: '活性碳濾網',
    icon: '❄️',
    defaultValues: {
      // 基本資訊
      productName: '低溫活性碳濾網',
      filterType: 'activated-carbon',
      description: '專為低溫環境設計的活性碳濾網，適用於冷藏/冷凍倉儲',

      // 材料配方
      chemicalAgent: '低溫活化劑',
      concentration: 8,
      activatedCarbon: '竹炭活性碳',
      carbonWeight: 450,
      additives: '低溫黏合劑 5%',

      // 製程參數
      temperature: 80,
      pressure: 1.5,
      mixingTime: 35,
      curingTime: 3,
      humidity: 65,

      // 品質標準
      efficiency: 93,
      lifespan: 10,
      testMethod: '依據 ISO 14644-1 標準進行粒子計數測試',
      certifications: 'ISO 14644-1'
    }
  }
];

/**
 * 根據 ID 取得範本
 */
export function getTemplateById(id) {
  return amcFilterTemplates.find(t => t.id === id);
}

/**
 * 根據類別取得範本
 */
export function getTemplatesByCategory(category) {
  return amcFilterTemplates.filter(t => t.category === category);
}

/**
 * 取得所有範本類別
 */
export function getTemplateCategories() {
  const categories = new Set(amcFilterTemplates.map(t => t.category));
  return Array.from(categories);
}
