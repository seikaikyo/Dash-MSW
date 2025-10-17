import { FormInstanceModel } from './dataModel.js';

/**
 * 工單號產生器
 * 確保工單號唯一且符合格式：MSW-年份-流水號
 */
export class WorkOrderNumberGenerator {
  // 用於追蹤當前批次中已產生的工單號（防止併發重複）
  static _generatedInSession = new Set();

  /**
   * 產生唯一的工單號
   * @returns {string} 工單號 (格式: MSW-2025-0001)
   */
  static generate() {
    const now = new Date();
    const year = now.getFullYear();
    const yearStr = year.toString();

    // 取得所有工單
    const allWorkOrders = FormInstanceModel.getAll();

    // 篩選出本年度的工單（包含已儲存的和本次批次產生的）
    const thisYearWorkOrders = allWorkOrders.filter(wo => {
      const woNo = wo.data.workOrderNo || '';
      return woNo.startsWith(`MSW-${yearStr}-`);
    });

    // 找出最大的流水號（同時考慮已儲存和批次產生的）
    let maxSequence = 0;

    // 檢查已儲存的工單
    thisYearWorkOrders.forEach(wo => {
      const woNo = wo.data.workOrderNo || '';
      const match = woNo.match(/MSW-\d{4}-(\d{4})$/);
      if (match) {
        const sequence = parseInt(match[1], 10);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    });

    // 檢查本次批次已產生的工單號
    this._generatedInSession.forEach(woNo => {
      if (woNo.startsWith(`MSW-${yearStr}-`)) {
        const match = woNo.match(/MSW-\d{4}-(\d{4})$/);
        if (match) {
          const sequence = parseInt(match[1], 10);
          if (sequence > maxSequence) {
            maxSequence = sequence;
          }
        }
      }
    });

    // 新的流水號 = 最大流水號 + 1
    const newSequence = maxSequence + 1;
    const sequenceStr = newSequence.toString().padStart(4, '0');

    const workOrderNo = `MSW-${yearStr}-${sequenceStr}`;

    // 三重檢查：已儲存的工單、批次產生的工單
    const duplicateInDB = allWorkOrders.find(wo => wo.data.workOrderNo === workOrderNo);
    const duplicateInSession = this._generatedInSession.has(workOrderNo);

    if (duplicateInDB || duplicateInSession) {
      // 如果還是重複，遞迴呼叫（理論上不應該發生）
      console.warn('工單號重複，重新產生:', workOrderNo);
      return this.generate();
    }

    // 加入批次追蹤
    this._generatedInSession.add(workOrderNo);

    return workOrderNo;
  }

  /**
   * 清除批次追蹤（在批次建立完成後呼叫）
   */
  static clearSession() {
    this._generatedInSession.clear();
  }

  /**
   * 驗證工單號格式
   * @param {string} workOrderNo - 工單號
   * @returns {boolean} 是否符合格式
   */
  static validate(workOrderNo) {
    const pattern = /^MSW-\d{4}-\d{4}$/;
    return pattern.test(workOrderNo);
  }

  /**
   * 從工單號解析年份和流水號
   * @param {string} workOrderNo - 工單號
   * @returns {{year: number, sequence: number} | null}
   */
  static parse(workOrderNo) {
    const match = workOrderNo.match(/^MSW-(\d{4})-(\d{4})$/);
    if (!match) return null;

    return {
      year: parseInt(match[1], 10),
      sequence: parseInt(match[2], 10)
    };
  }

  /**
   * 檢查工單號是否已存在
   * @param {string} workOrderNo - 工單號
   * @returns {boolean}
   */
  static exists(workOrderNo) {
    const allWorkOrders = FormInstanceModel.getAll();
    return allWorkOrders.some(wo => wo.data.workOrderNo === workOrderNo);
  }

  /**
   * 取得本年度已使用的工單號列表
   * @returns {Array<string>}
   */
  static getThisYearWorkOrderNumbers() {
    const year = new Date().getFullYear();
    const allWorkOrders = FormInstanceModel.getAll();

    return allWorkOrders
      .filter(wo => {
        const woNo = wo.data.workOrderNo || '';
        return woNo.startsWith(`MSW-${year}-`);
      })
      .map(wo => wo.data.workOrderNo)
      .sort();
  }

  /**
   * 取得下一個可用的工單號（不實際產生）
   * @returns {string}
   */
  static preview() {
    return this.generate();
  }
}
