export class Storage {
  constructor(prefix = 'bpm_') {
    this.prefix = prefix;
  }

  // 儲存資料
  set(key, value) {
    try {
      const data = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, data);
      return true;
    } catch (error) {
      console.error('儲存資料失敗:', error);
      return false;
    }
  }

  // 取得資料
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('讀取資料失敗:', error);
      return defaultValue;
    }
  }

  // 刪除資料
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('刪除資料失敗:', error);
      return false;
    }
  }

  // 清空所有資料
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('清空資料失敗:', error);
      return false;
    }
  }

  // 取得所有鍵名
  keys() {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''));
  }

  // 取得 LocalStorage 使用情況
  getStorageInfo() {
    try {
      let totalSize = 0;
      const itemSizes = {};

      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          const size = new Blob([value]).size;
          totalSize += size;
          itemSizes[key] = size;
        }
      });

      // 計算 MB
      const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
      const limit = 10; // 大多數瀏覽器的 LocalStorage 限制約 10MB

      return {
        totalSize: totalSize,
        totalMB: totalMB,
        limitMB: limit,
        usagePercent: ((totalSize / (limit * 1024 * 1024)) * 100).toFixed(1),
        itemSizes: itemSizes,
        itemCount: Object.keys(itemSizes).length
      };
    } catch (error) {
      console.error('取得儲存資訊失敗:', error);
      return null;
    }
  }

  // 自動清理大型數據（保留重要數據）
  autoCleanup() {
    try {
      console.log('🧹 開始自動清理 LocalStorage...');

      const info = this.getStorageInfo();
      if (!info) return false;

      console.log(`📊 當前使用: ${info.totalMB}MB / ${info.limitMB}MB (${info.usagePercent}%)`);

      // 清理優先級：SPC數據 > 版本歷史 > 審批歷史
      const cleanupOrder = [
        'spc_data',           // SPC 數據通常最大
        'spc_limits',
        'form_versions',      // 版本歷史
        'approvalHistory',    // 審批歷史
        'quality_feedbacks'   // 品質回饋（如果太大也清理）
      ];

      for (const key of cleanupOrder) {
        const fullKey = this.prefix + key;
        if (localStorage.getItem(fullKey)) {
          const size = info.itemSizes[fullKey] || 0;
          console.log(`  🗑️ 清除 ${key} (${(size / 1024).toFixed(2)}KB)`);
          localStorage.removeItem(fullKey);
        }
      }

      const newInfo = this.getStorageInfo();
      console.log(`✅ 清理完成！現在使用: ${newInfo.totalMB}MB / ${newInfo.limitMB}MB (${newInfo.usagePercent}%)`);

      return true;
    } catch (error) {
      console.error('自動清理失敗:', error);
      return false;
    }
  }
}

// 匯出單例
export const storage = new Storage();
