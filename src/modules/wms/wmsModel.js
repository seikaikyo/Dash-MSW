/**
 * WMS 倉儲管理系統數據模型
 * 負責 Pallet 管理、庫位分配、入出庫管理
 */

/**
 * Pallet 數據結構
 */
export class Pallet {
  constructor(data = {}) {
    this.id = data.id || `PLT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    this.filterIds = data.filterIds || []; // 綁定的濾網 ID 列表
    this.rfidTags = data.rfidTags || []; // RFID 標籤列表
    this.location = data.location || null; // 倉位位置
    this.status = data.status || 'empty'; // empty, partial, full, overload, shipped
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.inboundTime = data.inboundTime || null;
    this.outboundTime = data.outboundTime || null;
    this.customerOrderNo = data.customerOrderNo || null;
    this.standardCapacity = data.standardCapacity || 18; // 標準容量（建議裝載量）
    this.maxCapacity = data.maxCapacity || 48; // 最大容量（極限裝載量）

    // 如果 filterIds 已經有資料，需要更新狀態
    if (this.filterIds.length > 0) {
      this.updateStatus();
    }
  }

  // 新增濾網到 Pallet
  addFilter(filterId, rfidTag) {
    if (this.filterIds.length >= this.maxCapacity) {
      throw new Error(`Pallet ${this.id} 已達最大容量 ${this.maxCapacity}`);
    }

    this.filterIds.push(filterId);
    if (rfidTag) {
      this.rfidTags.push(rfidTag);
    }
    this.updateStatus();
    this.updatedAt = new Date().toISOString();
  }

  // 移除濾網
  removeFilter(filterId) {
    const index = this.filterIds.indexOf(filterId);
    if (index > -1) {
      this.filterIds.splice(index, 1);
      this.rfidTags.splice(index, 1);
      this.updateStatus();
      this.updatedAt = new Date().toISOString();
    }
  }

  // 更新狀態
  updateStatus() {
    const count = this.filterIds.length;

    if (count === 0) {
      this.status = 'empty';
    } else if (count > this.maxCapacity) {
      this.status = 'overload'; // 超載（不應該發生）
    } else if (count === this.standardCapacity) {
      this.status = 'full'; // 達到標準容量
    } else if (count > this.standardCapacity && count <= this.maxCapacity) {
      this.status = 'full'; // 超過標準但未達極限，仍視為滿載
    } else {
      this.status = 'partial'; // 未滿
    }
  }

  // 入庫
  inbound(location) {
    this.location = location;
    this.inboundTime = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // 出庫
  outbound(customerOrderNo) {
    this.customerOrderNo = customerOrderNo;
    this.outboundTime = new Date().toISOString();
    this.status = 'shipped';
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * 倉位數據結構
 */
export class WarehouseLocation {
  constructor(data = {}) {
    this.id = data.id || `LOC-${data.zone}-${data.row}-${data.column}`;
    this.zone = data.zone; // 區域 (A, B, C...)
    this.row = data.row; // 列
    this.column = data.column; // 行
    this.palletId = data.palletId || null;
    this.status = data.status || 'empty'; // empty, occupied, reserved, maintenance
    this.capacity = data.capacity || 1; // 可容納 Pallet 數量
    this.priority = data.priority || 'normal'; // high, normal, low
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // 分配 Pallet
  assignPallet(palletId) {
    if (this.status === 'occupied') {
      throw new Error(`倉位 ${this.id} 已被佔用`);
    }
    if (this.status === 'maintenance') {
      throw new Error(`倉位 ${this.id} 正在維護中`);
    }

    this.palletId = palletId;
    this.status = 'occupied';
    this.updatedAt = new Date().toISOString();
  }

  // 釋放 Pallet
  releasePallet() {
    this.palletId = null;
    this.status = 'empty';
    this.updatedAt = new Date().toISOString();
  }

  // 保留倉位
  reserve() {
    if (this.status !== 'empty') {
      throw new Error(`倉位 ${this.id} 無法保留`);
    }
    this.status = 'reserved';
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * WMS 管理器
 */
class WMSManager {
  constructor() {
    this.storageKey = 'msw_wms_data';
    this.init();
  }

  init() {
    const data = this.loadFromStorage();
    this.pallets = data.pallets || [];
    this.locations = data.locations || this.generateDefaultLocations();
  }

  // 生成預設倉位（3個區域，每區 5x10）
  generateDefaultLocations() {
    const locations = [];
    const zones = ['A', 'B', 'C'];

    zones.forEach(zone => {
      for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= 10; col++) {
          const priority = row <= 2 ? 'high' : 'normal'; // 前兩列為高優先級
          locations.push(new WarehouseLocation({
            zone,
            row,
            column: col,
            priority
          }));
        }
      }
    });

    return locations;
  }

  // 建立新 Pallet
  createPallet(data) {
    const pallet = new Pallet(data);
    this.pallets.push(pallet);
    this.saveToStorage();
    return pallet;
  }

  // 取得 Pallet
  getPallet(palletId) {
    return this.pallets.find(p => p.id === palletId);
  }

  // 取得所有 Pallet
  getAllPallets() {
    return this.pallets;
  }

  // 智能庫位分配（FIFO + 優先級）
  allocateLocation(palletId) {
    const pallet = this.getPallet(palletId);
    if (!pallet) {
      throw new Error(`Pallet ${palletId} 不存在`);
    }

    // 優先分配高優先級且靠近入口的空庫位
    const availableLocations = this.locations
      .filter(loc => loc.status === 'empty')
      .sort((a, b) => {
        // 先比較優先級
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;

        // 再比較位置（靠近入口）
        if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
        if (a.row !== b.row) return a.row - b.row;
        return a.column - b.column;
      });

    if (availableLocations.length === 0) {
      throw new Error('無可用庫位');
    }

    const location = availableLocations[0];
    location.assignPallet(palletId);
    pallet.inbound(location.id);

    this.saveToStorage();
    return location;
  }

  // 釋放庫位
  releaseLocation(locationId) {
    const location = this.locations.find(loc => loc.id === locationId);
    if (!location) {
      throw new Error(`庫位 ${locationId} 不存在`);
    }

    if (location.palletId) {
      const pallet = this.getPallet(location.palletId);
      if (pallet) {
        pallet.location = null;
      }
    }

    location.releasePallet();
    this.saveToStorage();
  }

  // Pallet 出庫
  outboundPallet(palletId, customerOrderNo) {
    const pallet = this.getPallet(palletId);
    if (!pallet) {
      throw new Error(`Pallet ${palletId} 不存在`);
    }

    // 釋放庫位
    if (pallet.location) {
      this.releaseLocation(pallet.location);
    }

    pallet.outbound(customerOrderNo);
    this.saveToStorage();
    return pallet;
  }

  // 取得庫位使用率統計
  getLocationStats() {
    const total = this.locations.length;
    const occupied = this.locations.filter(loc => loc.status === 'occupied').length;
    const empty = this.locations.filter(loc => loc.status === 'empty').length;
    const reserved = this.locations.filter(loc => loc.status === 'reserved').length;
    const maintenance = this.locations.filter(loc => loc.status === 'maintenance').length;

    return {
      total,
      occupied,
      empty,
      reserved,
      maintenance,
      utilizationRate: `${((occupied / total) * 100).toFixed(2)}%`
    };
  }

  // 取得 Pallet 統計
  getPalletStats() {
    const total = this.pallets.length;
    const empty = this.pallets.filter(p => p.status === 'empty').length;
    const partial = this.pallets.filter(p => p.status === 'partial').length;
    const full = this.pallets.filter(p => p.status === 'full').length;
    const overload = this.pallets.filter(p => p.status === 'overload').length;
    const shipped = this.pallets.filter(p => p.status === 'shipped').length;

    // 計算總濾網數
    const totalFilters = this.pallets.reduce((sum, p) => sum + p.filterIds.length, 0);

    return {
      total,
      empty,
      partial,
      full,
      overload,
      shipped,
      inWarehouse: total - shipped,
      totalFilters
    };
  }

  // 搜尋 Pallet（支援多條件）
  searchPallets(filters = {}) {
    let results = this.pallets;

    if (filters.status) {
      results = results.filter(p => p.status === filters.status);
    }

    if (filters.location) {
      results = results.filter(p => p.location === filters.location);
    }

    if (filters.filterId) {
      results = results.filter(p => p.filterIds.includes(filters.filterId));
    }

    if (filters.rfidTag) {
      results = results.filter(p => p.rfidTags.includes(filters.rfidTag));
    }

    if (filters.customerOrderNo) {
      results = results.filter(p => p.customerOrderNo === filters.customerOrderNo);
    }

    return results;
  }

  // 搜尋庫位
  searchLocations(filters = {}) {
    let results = this.locations;

    if (filters.status) {
      results = results.filter(loc => loc.status === filters.status);
    }

    if (filters.zone) {
      results = results.filter(loc => loc.zone === filters.zone);
    }

    if (filters.priority) {
      results = results.filter(loc => loc.priority === filters.priority);
    }

    return results;
  }

  // 儲存到 LocalStorage
  saveToStorage() {
    const data = {
      pallets: this.pallets,
      locations: this.locations,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // 從 LocalStorage 載入
  loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        pallets: parsed.pallets.map(p => new Pallet(p)),
        locations: parsed.locations.map(l => new WarehouseLocation(l))
      };
    }
    return {};
  }

  // 清除所有數據
  clearAll() {
    this.pallets = [];
    this.locations = this.generateDefaultLocations();
    this.saveToStorage();
  }
}

// 單例模式
export const wmsManager = new WMSManager();
