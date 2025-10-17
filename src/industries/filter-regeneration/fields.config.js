/**
 * 柳營再生濾網製程欄位配置
 * 基於研華 IoTSuite 數據中台的 MES+SPC+WMS 整合系統
 */

import {
  getSourceFactories,
  getFilterTypes,
  getOvenIds,
  getDegassingTestResults,
  getAoiResults,
  getRfidUpdateStatus,
  getQualityGrades
} from '../../utils/systemConfig.js';

export const filterRegenerationFields = {
  // 基本資訊
  basic: [
    {
      name: 'workOrderNo',
      label: '工單編號',
      type: 'text',
      required: true,
      description: '自動產生格式：MSW-年份-流水號'
    },
    {
      name: 'batchNo',
      label: '批次號',
      type: 'text',
      required: true,
      description: '批次追蹤識別碼'
    },
    {
      name: 'sourceFactory',
      label: '來源廠別',
      type: 'select',
      options: getSourceFactories(),
      required: true,
      description: '濾網回收來源'
    },
    {
      name: 'filterType',
      label: '濾網類型',
      type: 'select',
      options: getFilterTypes(),
      required: true
    },
    {
      name: 'quantity',
      label: '數量 (片)',
      type: 'number',
      required: true,
      min: 1,
      description: '本批次處理數量'
    },
    {
      name: 'regenerationCycle',
      label: '再生次數',
      type: 'select',
      options: ['R0 (首次再生)', 'R1 (第二次)', 'R2 (第三次)', 'R3 (第四次)', 'R4 (第五次)', 'R5 (第六次)', 'R6 (第七次)', 'R7 (第八次)', 'R8 (第九次)', 'R9 (第十次)'],
      required: true,
      description: 'RFID 追蹤再生次數'
    }
  ],

  // 製程站點參數
  process: [
    {
      name: 'deglueStation',
      label: '除膠站點',
      type: 'group',
      fields: [
        {
          name: 'deglueOperator',
          label: '作業人員',
          type: 'text',
          required: true
        },
        {
          name: 'deglueStartTime',
          label: '開始時間',
          type: 'datetime-local',
          required: true
        },
        {
          name: 'deglueEndTime',
          label: '完成時間',
          type: 'datetime-local'
        }
      ]
    },
    {
      name: 'ovenStation',
      label: '烘箱處理',
      type: 'group',
      fields: [
        {
          name: 'ovenId',
          label: '烘箱編號',
          type: 'select',
          options: getOvenIds(),
          required: true,
          description: '整合研華 ECU 數據'
        },
        {
          name: 'targetTemp',
          label: '目標溫度 (°C)',
          type: 'number',
          required: true,
          min: 80,
          max: 200
        },
        {
          name: 'bakingTime',
          label: '烘烤時間 (分鐘)',
          type: 'number',
          required: true,
          min: 30,
          max: 480
        },
        {
          name: 'ovenStartTime',
          label: '開始時間',
          type: 'datetime-local',
          required: true
        },
        {
          name: 'ovenEndTime',
          label: '完成時間',
          type: 'datetime-local'
        }
      ]
    },
    {
      name: 'oqcInspection',
      label: 'OQC 檢驗',
      type: 'group',
      fields: [
        {
          name: 'degassingTest',
          label: '釋氣檢測 (18抽1)',
          type: 'select',
          options: getDegassingTestResults(),
          required: true
        },
        {
          name: 'aoiResult',
          label: 'AOI 檢測結果',
          type: 'select',
          options: getAoiResults(),
          required: true,
          description: '所羅門 AOI 自動判定'
        },
        {
          name: 'inspectionOperator',
          label: '檢驗人員',
          type: 'text',
          required: true
        },
        {
          name: 'inspectionTime',
          label: '檢驗時間',
          type: 'datetime-local',
          required: true
        }
      ]
    }
  ],

  // RFID 與包裝
  packaging: [
    {
      name: 'rfidUpdate',
      label: 'RFID 標籤更換',
      type: 'select',
      options: getRfidUpdateStatus(),
      required: true,
      description: 'OQC 檢驗通過後自動更換'
    },
    {
      name: 'palletId',
      label: 'Pallet ID',
      type: 'text',
      description: '一 Pallet 多濾網 ID 綁定'
    },
    {
      name: 'packageTime',
      label: '包裝完成時間',
      type: 'datetime-local'
    }
  ],

  // 倉儲管理
  warehouse: [
    {
      name: 'warehouseLocation',
      label: '倉位位置',
      type: 'text',
      description: 'WMS 智能庫位分配'
    },
    {
      name: 'inboundTime',
      label: '入庫時間',
      type: 'datetime-local'
    },
    {
      name: 'outboundTime',
      label: '出庫時間',
      type: 'datetime-local'
    },
    {
      name: 'customerOrderNo',
      label: '客戶訂單號',
      type: 'text',
      description: '出貨工單對應'
    }
  ],

  // 能源數據（整合 IoTSuite）
  energy: [
    {
      name: 'ovenEnergyConsumption',
      label: '烘箱耗電 (kWh)',
      type: 'number',
      readonly: true,
      description: '自動從 IoTSuite ECU 數據計算'
    },
    {
      name: 'totalEnergyCost',
      label: '總能源成本 (元)',
      type: 'number',
      readonly: true,
      description: '單位濾網能源成本'
    },
    {
      name: 'mauFfuEnergy',
      label: 'MAU/FFU 能耗 (kWh)',
      type: 'number',
      readonly: true,
      description: '廠務設備能耗'
    }
  ],

  // 品質標準（SPC 整合）
  quality: [
    {
      name: 'filterEfficiency',
      label: '過濾效率 (%)',
      type: 'number',
      min: 0,
      max: 100,
      description: 'SPC 品質監控'
    },
    {
      name: 'expectedLifespan',
      label: '預期壽命 (月)',
      type: 'number',
      min: 1,
      max: 24
    },
    {
      name: 'qualityGrade',
      label: '品質等級',
      type: 'select',
      options: getQualityGrades(),
      required: true
    },
    {
      name: 'remarks',
      label: '備註',
      type: 'textarea',
      rows: 3
    }
  ]
};

/**
 * 欄位群組（用於表單顯示）
 */
export const fieldGroups = [
  {
    title: '基本資訊',
    icon: '📋',
    fields: filterRegenerationFields.basic
  },
  {
    title: '製程站點',
    icon: '🏭',
    fields: filterRegenerationFields.process
  },
  {
    title: 'RFID 與包裝',
    icon: '📦',
    fields: filterRegenerationFields.packaging
  },
  {
    title: '倉儲管理',
    icon: '🏪',
    fields: filterRegenerationFields.warehouse
  },
  {
    title: '能源數據',
    icon: '⚡',
    fields: filterRegenerationFields.energy
  },
  {
    title: '品質標準',
    icon: '🏆',
    fields: filterRegenerationFields.quality
  }
];

/**
 * 取得所有欄位（扁平化）
 */
export function getAllFields() {
  const allFields = [];
  Object.values(filterRegenerationFields).forEach(group => {
    group.forEach(field => {
      if (field.type === 'group' && field.fields) {
        // 群組欄位，展開子欄位
        field.fields.forEach(subField => {
          allFields.push({ ...subField, parentGroup: field.name });
        });
      } else {
        allFields.push(field);
      }
    });
  });
  return allFields;
}
