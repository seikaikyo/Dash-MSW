/**
 * WMS 倉儲管理服務層
 * 提供業務邏輯與操作介面
 */

import { wmsManager } from './wmsModel.js';

export class WMSService {
  /**
   * 建立並入庫 Pallet
   */
  static createAndInboundPallet(filterIds, rfidTags = []) {
    // 建立 Pallet
    const pallet = wmsManager.createPallet({
      filterIds,
      rfidTags,
      maxCapacity: 50
    });

    // 自動分配庫位
    const location = wmsManager.allocateLocation(pallet.id);

    return {
      pallet,
      location,
      message: `Pallet ${pallet.id} 已入庫至 ${location.id}`
    };
  }

  /**
   * 新增濾網到現有 Pallet
   */
  static addFilterToPallet(palletId, filterId, rfidTag) {
    const pallet = wmsManager.getPallet(palletId);
    if (!pallet) {
      throw new Error(`Pallet ${palletId} 不存在`);
    }

    pallet.addFilter(filterId, rfidTag);
    wmsManager.saveToStorage();

    return {
      pallet,
      message: `濾網 ${filterId} 已加入 Pallet ${palletId}`
    };
  }

  /**
   * Pallet 出庫
   */
  static outboundPallet(palletId, customerOrderNo) {
    // 驗證 Pallet 是否符合出庫條件
    const pallet = wmsManager.getPallet(palletId);
    if (!pallet) {
      throw new Error(`Pallet ${palletId} 不存在`);
    }

    if (pallet.status === 'shipped') {
      throw new Error(`Pallet ${palletId} 已出庫`);
    }

    if (pallet.filterIds.length === 0) {
      throw new Error(`Pallet ${palletId} 為空，無法出庫`);
    }

    // 執行出庫
    const result = wmsManager.outboundPallet(palletId, customerOrderNo);

    return {
      pallet: result,
      message: `Pallet ${palletId} 已出庫，訂單號：${customerOrderNo}`
    };
  }

  /**
   * 批次出庫（FIFO 先進先出）
   */
  static batchOutbound(quantity, customerOrderNo) {
    const availablePallets = wmsManager.getAllPallets()
      .filter(p => p.status === 'full' || p.status === 'partial')
      .sort((a, b) => new Date(a.inboundTime) - new Date(b.inboundTime)); // FIFO

    if (availablePallets.length === 0) {
      throw new Error('無可用 Pallet 可出庫');
    }

    let totalFilters = 0;
    const shippedPallets = [];

    for (const pallet of availablePallets) {
      if (totalFilters >= quantity) break;

      wmsManager.outboundPallet(pallet.id, customerOrderNo);
      shippedPallets.push(pallet);
      totalFilters += pallet.filterIds.length;
    }

    return {
      shippedPallets,
      totalFilters,
      message: `已出庫 ${shippedPallets.length} 個 Pallet，共 ${totalFilters} 片濾網`
    };
  }

  /**
   * 根據 RFID 查詢濾網位置
   */
  static findFilterByRFID(rfidTag) {
    const pallets = wmsManager.searchPallets({ rfidTag });

    if (pallets.length === 0) {
      throw new Error(`找不到 RFID ${rfidTag} 對應的濾網`);
    }

    const pallet = pallets[0];
    const index = pallet.rfidTags.indexOf(rfidTag);
    const filterId = pallet.filterIds[index];

    return {
      filterId,
      rfidTag,
      palletId: pallet.id,
      location: pallet.location,
      status: pallet.status,
      inboundTime: pallet.inboundTime
    };
  }

  /**
   * 根據濾網 ID 查詢位置
   */
  static findFilterById(filterId) {
    const pallets = wmsManager.searchPallets({ filterId });

    if (pallets.length === 0) {
      throw new Error(`找不到濾網 ${filterId}`);
    }

    const pallet = pallets[0];
    const index = pallet.filterIds.indexOf(filterId);
    const rfidTag = pallet.rfidTags[index];

    return {
      filterId,
      rfidTag,
      palletId: pallet.id,
      location: pallet.location,
      status: pallet.status,
      inboundTime: pallet.inboundTime
    };
  }

  /**
   * 取得庫存報表
   */
  static getInventoryReport() {
    const locationStats = wmsManager.getLocationStats();
    const palletStats = wmsManager.getPalletStats();

    const pallets = wmsManager.getAllPallets();
    const totalFilters = pallets.reduce((sum, p) => sum + p.filterIds.length, 0);
    const inWarehouseFilters = pallets
      .filter(p => p.status !== 'shipped')
      .reduce((sum, p) => sum + p.filterIds.length, 0);

    return {
      location: locationStats,
      pallet: palletStats,
      filters: {
        total: totalFilters,
        inWarehouse: inWarehouseFilters,
        shipped: totalFilters - inWarehouseFilters
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 取得區域使用率
   */
  static getZoneUtilization() {
    const zones = ['A', 'B', 'C'];
    const results = zones.map(zone => {
      const locations = wmsManager.searchLocations({ zone });
      const occupied = locations.filter(loc => loc.status === 'occupied').length;
      const total = locations.length;

      return {
        zone,
        total,
        occupied,
        empty: total - occupied,
        utilizationRate: ((occupied / total) * 100).toFixed(2)
      };
    });

    return results;
  }

  /**
   * 取得待出庫 Pallet 列表（按入庫時間排序）
   */
  static getPendingOutboundPallets() {
    return wmsManager.getAllPallets()
      .filter(p => p.status === 'full' || p.status === 'partial')
      .sort((a, b) => new Date(a.inboundTime) - new Date(b.inboundTime));
  }

  /**
   * 取得空 Pallet 列表
   */
  static getEmptyPallets() {
    return wmsManager.getAllPallets()
      .filter(p => p.status === 'empty');
  }

  /**
   * 庫位維護設定
   */
  static setLocationMaintenance(locationId, isMaintenance) {
    const location = wmsManager.locations.find(loc => loc.id === locationId);
    if (!location) {
      throw new Error(`庫位 ${locationId} 不存在`);
    }

    if (isMaintenance) {
      if (location.status === 'occupied') {
        throw new Error(`庫位 ${locationId} 有 Pallet 佔用，無法設為維護`);
      }
      location.status = 'maintenance';
    } else {
      if (location.status === 'maintenance') {
        location.status = 'empty';
      }
    }

    location.updatedAt = new Date().toISOString();
    wmsManager.saveToStorage();

    return {
      location,
      message: isMaintenance ? '庫位已設為維護中' : '庫位維護完成'
    };
  }

  /**
   * 重新分配庫位（庫位整理）
   */
  static relocatePallet(palletId, newLocationId) {
    const pallet = wmsManager.getPallet(palletId);
    if (!pallet) {
      throw new Error(`Pallet ${palletId} 不存在`);
    }

    const newLocation = wmsManager.locations.find(loc => loc.id === newLocationId);
    if (!newLocation) {
      throw new Error(`庫位 ${newLocationId} 不存在`);
    }

    if (newLocation.status !== 'empty') {
      throw new Error(`庫位 ${newLocationId} 不可用`);
    }

    // 釋放舊庫位
    if (pallet.location) {
      wmsManager.releaseLocation(pallet.location);
    }

    // 分配新庫位
    newLocation.assignPallet(palletId);
    pallet.location = newLocation.id;
    pallet.updatedAt = new Date().toISOString();

    wmsManager.saveToStorage();

    return {
      pallet,
      newLocation,
      message: `Pallet ${palletId} 已移至 ${newLocationId}`
    };
  }

  /**
   * 取得異常 Pallet（超過 30 天未出庫）
   */
  static getStagnantPallets(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return wmsManager.getAllPallets()
      .filter(p => {
        if (!p.inboundTime || p.status === 'shipped') return false;
        return new Date(p.inboundTime) < cutoffDate;
      })
      .map(p => ({
        ...p,
        daysInWarehouse: Math.floor(
          (new Date() - new Date(p.inboundTime)) / (1000 * 60 * 60 * 24)
        )
      }));
  }

  /**
   * 清除所有數據（測試用）
   */
  static clearAllData() {
    wmsManager.clearAll();
    return { message: 'WMS 數據已清除' };
  }
}

export default WMSService;
