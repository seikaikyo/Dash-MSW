/**
 * 柳營再生濾網製程驗證規則
 */

export const filterRegenerationValidations = {
  // 工單編號驗證
  workOrderNo: (value) => {
    if (!value) return '工單編號為必填';
    const pattern = /^MSW-\d{4}-\d{4}$/;
    if (!pattern.test(value)) {
      return '工單編號格式錯誤（格式：MSW-年份-流水號，例：MSW-2025-0001）';
    }
    return null;
  },

  // 批次號驗證
  batchNo: (value) => {
    if (!value) return '批次號為必填';
    if (value.length < 6 || value.length > 20) {
      return '批次號長度必須在 6-20 字元之間';
    }
    return null;
  },

  // 數量驗證
  quantity: (value) => {
    if (!value || value < 1) {
      return '數量必須大於 0';
    }
    if (value > 1000) {
      return '單批次數量不可超過 1000 片';
    }
    return null;
  },

  // 烘箱溫度驗證
  targetTemp: (value) => {
    if (!value) return '目標溫度為必填';
    if (value < 80 || value > 200) {
      return '烘箱溫度必須在 80-200°C 之間';
    }
    return null;
  },

  // 烘烤時間驗證
  bakingTime: (value) => {
    if (!value) return '烘烤時間為必填';
    if (value < 30 || value > 480) {
      return '烘烤時間必須在 30-480 分鐘之間';
    }
    return null;
  },

  // 過濾效率驗證
  filterEfficiency: (value) => {
    if (value !== null && value !== undefined && value !== '') {
      if (value < 0 || value > 100) {
        return '過濾效率必須在 0-100% 之間';
      }
    }
    return null;
  },

  // 預期壽命驗證
  expectedLifespan: (value) => {
    if (value !== null && value !== undefined && value !== '') {
      if (value < 1 || value > 24) {
        return '預期壽命必須在 1-24 月之間';
      }
    }
    return null;
  },

  // OQC 檢驗邏輯驗證
  oqcInspection: (formData) => {
    const degassing = formData.degassingTest;
    const aoi = formData.aoiResult;

    // 釋氣與 AOI 必須都通過才能進行 RFID 更換
    if (degassing === '合格' && aoi === 'OK') {
      return null; // 通過
    }

    if (degassing === '超標(回爐重烤)') {
      return '釋氣檢測超標，需回爐重烤';
    }

    if (degassing === '報廢' || aoi === '報廢' || aoi === 'NG-破洞' || aoi === 'NG-嚴重瑕疵') {
      return '檢測不合格，已標記為報廢';
    }

    if (degassing === '未達標(加抽2片)') {
      return '釋氣檢測未達標，需加抽 2 片再測';
    }

    return '檢驗尚未完成或不符合標準';
  },

  // RFID 更換前置條件驗證
  rfidUpdate: (formData) => {
    const degassing = formData.degassingTest;
    const aoi = formData.aoiResult;

    if (formData.rfidUpdate === '已更換') {
      if (degassing !== '合格' || aoi !== 'OK') {
        return 'RFID 標籤更換必須在 OQC 檢驗通過後進行';
      }
    }
    return null;
  },

  // 跨欄位驗證：烘箱時間邏輯
  ovenTimeValidation: (formData) => {
    const startTime = formData.ovenStartTime;
    const endTime = formData.ovenEndTime;

    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (end <= start) {
        return '烘箱完成時間必須晚於開始時間';
      }

      const diffMinutes = (end - start) / 1000 / 60;
      const expectedTime = formData.bakingTime || 0;

      if (Math.abs(diffMinutes - expectedTime) > 30) {
        return `實際烘烤時間 (${Math.round(diffMinutes)} 分鐘) 與預設時間 (${expectedTime} 分鐘) 差異過大`;
      }
    }

    return null;
  },

  // 跨欄位驗證：製程流程時間順序
  processFlowValidation: (formData) => {
    const deglueEnd = formData.deglueEndTime;
    const ovenStart = formData.ovenStartTime;
    const ovenEnd = formData.ovenEndTime;
    const inspectionTime = formData.inspectionTime;

    if (deglueEnd && ovenStart) {
      if (new Date(ovenStart) < new Date(deglueEnd)) {
        return '烘箱開始時間不可早於除膠完成時間';
      }
    }

    if (ovenEnd && inspectionTime) {
      if (new Date(inspectionTime) < new Date(ovenEnd)) {
        return 'OQC 檢驗時間不可早於烘箱完成時間';
      }
    }

    return null;
  },

  // 出庫驗證：只有良品才能出貨
  outboundValidation: (formData) => {
    if (formData.outboundTime) {
      const qualityGrade = formData.qualityGrade;
      const degassing = formData.degassingTest;
      const aoi = formData.aoiResult;

      if (qualityGrade === 'D (不合格)' || qualityGrade === 'E (報廢)') {
        return '不合格或報廢品不允許出庫';
      }

      if (degassing !== '合格' || aoi !== 'OK') {
        return '只有通過 OQC 檢驗的良品才能出庫';
      }

      if (!formData.customerOrderNo) {
        return '出庫必須填寫客戶訂單號';
      }
    }

    return null;
  }
};

/**
 * 整合驗證函數
 * 對整個工單進行完整驗證
 */
export function validateWorkOrder(formData) {
  const errors = {};

  // 基本欄位驗證
  Object.keys(filterRegenerationValidations).forEach(key => {
    if (typeof filterRegenerationValidations[key] === 'function') {
      const result = filterRegenerationValidations[key](formData);
      if (result) {
        errors[key] = result;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
