/**
 * SPC 數據來源服務
 * 支援多種數據接入方式：研華 ECU、數據中台 API、手動輸入等
 */

import { SPCModel } from './spcModel.js';
import { WebhookSignatureVerifier, extractSignatureFromHeaders } from './webhookSignature.js';

/**
 * 數據來源類型
 */
export const DataSourceType = {
  MANUAL: 'manual',           // 手動輸入
  API: 'api',                 // RESTful API
  WEBHOOK: 'webhook',         // Webhook 推送
  ADVANTECH_ECU: 'advantech_ecu',  // 研華 ECU
  DATA_PLATFORM: 'data_platform',  // 數據中台
  FILE_IMPORT: 'file_import'       // 檔案匯入（CSV/Excel）
};

/**
 * 數據來源配置
 */
const DATA_SOURCE_CONFIG_KEY = 'rms_spc_datasource_config';

export class SPCDataSource {
  /**
   * 獲取數據源配置
   */
  static getConfig() {
    try {
      const config = localStorage.getItem(DATA_SOURCE_CONFIG_KEY);
      return config ? JSON.parse(config) : this.getDefaultConfig();
    } catch (error) {
      console.error('Failed to get data source config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * 預設配置
   */
  static getDefaultConfig() {
    return {
      activeSource: DataSourceType.MANUAL,
      sources: {
        api: {
          enabled: false,
          endpoint: '',
          apiKey: '',
          pollInterval: 60000,  // 輪詢間隔（毫秒）
          lastSync: null
        },
        webhook: {
          enabled: false,
          url: '',
          secret: '',
          lastReceived: null
        },
        advantech_ecu: {
          enabled: false,
          ecuUrl: '',
          ecuApiKey: '',
          deviceIds: [],
          pollInterval: 30000,
          lastSync: null
        },
        data_platform: {
          enabled: false,
          platformUrl: '',
          apiKey: '',
          datasetId: '',
          pollInterval: 60000,
          lastSync: null
        }
      }
    };
  }

  /**
   * 儲存配置
   */
  static saveConfig(config) {
    try {
      localStorage.setItem(DATA_SOURCE_CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Failed to save data source config:', error);
      throw new Error('儲存配置失敗');
    }
  }

  /**
   * 設定啟用的數據源
   */
  static setActiveSource(sourceType) {
    const config = this.getConfig();
    config.activeSource = sourceType;
    this.saveConfig(config);
  }

  /**
   * ========================================
   * 手動輸入數據
   * ========================================
   */
  static manualInput(data) {
    try {
      return SPCModel.create(data);
    } catch (error) {
      console.error('Manual input failed:', error);
      throw new Error('手動輸入失敗：' + error.message);
    }
  }

  /**
   * ========================================
   * API 輪詢方式
   * ========================================
   */
  static async fetchFromAPI() {
    const config = this.getConfig();
    const apiConfig = config.sources.api;

    if (!apiConfig.enabled || !apiConfig.endpoint) {
      throw new Error('API 數據源未啟用或未配置');
    }

    try {
      const response = await fetch(apiConfig.endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`API 回應錯誤: ${response.status}`);
      }

      const data = await response.json();

      // 將 API 數據轉換為 SPC 格式並儲存
      const spcData = this.transformAPIData(data);
      const results = [];

      for (const item of spcData) {
        const created = SPCModel.create(item);
        results.push(created);
      }

      // 更新最後同步時間
      apiConfig.lastSync = new Date().toISOString();
      this.saveConfig(config);

      return {
        success: true,
        count: results.length,
        data: results
      };
    } catch (error) {
      console.error('API fetch failed:', error);
      throw new Error('從 API 獲取數據失敗：' + error.message);
    }
  }

  /**
   * ========================================
   * 研華 ECU 數據接入
   * ========================================
   */
  static async fetchFromAdvantechECU() {
    const config = this.getConfig();
    const ecuConfig = config.sources.advantech_ecu;

    if (!ecuConfig.enabled || !ecuConfig.ecuUrl) {
      throw new Error('研華 ECU 數據源未啟用或未配置');
    }

    try {
      // 研華 ECU API 呼叫範例
      // 實際 API endpoint 需要根據研華 ECU 文件調整
      const response = await fetch(`${ecuConfig.ecuUrl}/api/v1/devices/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ecuConfig.ecuApiKey
        },
        body: JSON.stringify({
          deviceIds: ecuConfig.deviceIds,
          dataType: 'process',
          includeTimestamp: true
        })
      });

      if (!response.ok) {
        throw new Error(`ECU API 回應錯誤: ${response.status}`);
      }

      const data = await response.json();

      // 轉換 ECU 數據格式為 SPC 格式
      const spcData = this.transformECUData(data);
      const results = [];

      for (const item of spcData) {
        const created = SPCModel.create(item);
        results.push(created);
      }

      // 更新最後同步時間
      ecuConfig.lastSync = new Date().toISOString();
      this.saveConfig(config);

      return {
        success: true,
        count: results.length,
        data: results,
        source: 'advantech_ecu'
      };
    } catch (error) {
      console.error('Advantech ECU fetch failed:', error);
      throw new Error('從研華 ECU 獲取數據失敗：' + error.message);
    }
  }

  /**
   * ========================================
   * 數據中台 API 接入
   * ========================================
   */
  static async fetchFromDataPlatform() {
    const config = this.getConfig();
    const platformConfig = config.sources.data_platform;

    if (!platformConfig.enabled || !platformConfig.platformUrl) {
      throw new Error('數據中台未啟用或未配置');
    }

    try {
      // 數據中台 API 呼叫範例
      const response = await fetch(`${platformConfig.platformUrl}/api/datasets/${platformConfig.datasetId}/records`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${platformConfig.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`數據中台 API 回應錯誤: ${response.status}`);
      }

      const data = await response.json();

      // 轉換數據中台格式為 SPC 格式
      const spcData = this.transformDataPlatformData(data);
      const results = [];

      for (const item of spcData) {
        const created = SPCModel.create(item);
        results.push(created);
      }

      // 更新最後同步時間
      platformConfig.lastSync = new Date().toISOString();
      this.saveConfig(config);

      return {
        success: true,
        count: results.length,
        data: results,
        source: 'data_platform'
      };
    } catch (error) {
      console.error('Data platform fetch failed:', error);
      throw new Error('從數據中台獲取數據失敗：' + error.message);
    }
  }

  /**
   * ========================================
   * Webhook 接收（需要後端支援）
   * ========================================
   */
  /**
   * 處理 Webhook 接收的數據
   * @param {Object|string} webhookPayload - Webhook payload（對象或 JSON 字串）
   * @param {Object} headers - HTTP headers（用於簽名驗證）
   * @param {Object} options - 額外選項
   * @returns {Promise<Object>} - 處理結果
   */
  static async handleWebhook(webhookPayload, headers = {}, options = {}) {
    const config = this.getConfig();
    const webhookConfig = config.sources.webhook;

    if (!webhookConfig || !webhookConfig.enabled) {
      throw new Error('Webhook 未啟用');
    }

    try {
      // 將 payload 轉換為字串（用於簽名驗證）
      const payloadString = typeof webhookPayload === 'string'
        ? webhookPayload
        : JSON.stringify(webhookPayload);

      // 解析 payload 為對象
      const payloadObj = typeof webhookPayload === 'string'
        ? JSON.parse(webhookPayload)
        : webhookPayload;

      // 驗證 webhook 簽名（如果有配置 secret）
      if (webhookConfig.secret) {
        const signatureType = webhookConfig.signatureType || 'hmac';
        const verifier = new WebhookSignatureVerifier(webhookConfig.secret, signatureType);

        // 從 headers 提取簽名
        const signature = extractSignatureFromHeaders(headers, signatureType) || options.signature;

        if (!signature) {
          throw new Error('缺少 Webhook 簽名');
        }

        // 驗證簽名
        const verificationResult = await verifier.verify(payloadString, signature, {
          tolerance: webhookConfig.tolerance || 300
        });

        if (!verificationResult.valid) {
          throw new Error('Webhook 簽名驗證失敗：' + (verificationResult.error || '未知錯誤'));
        }

        console.log('✅ Webhook signature verified');
      } else {
        console.warn('⚠️ Webhook secret not configured, skipping signature verification');
      }

      // 轉換 webhook 數據為 SPC 格式
      const spcData = this.transformWebhookData(payloadObj);
      const created = SPCModel.create(spcData);

      // 更新最後接收時間
      webhookConfig.lastReceived = new Date().toISOString();
      this.saveConfig(config);

      return {
        success: true,
        data: created,
        verified: !!webhookConfig.secret
      };
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw new Error('處理 Webhook 數據失敗：' + error.message);
    }
  }

  /**
   * ========================================
   * 檔案匯入（CSV/Excel）
   * ========================================
   */
  static async importFromFile(file, format = 'csv', overrideRecipeId = null) {
    try {
      const text = await file.text();
      let records = [];

      if (format === 'csv') {
        records = this.parseCSV(text);
      } else if (format === 'json') {
        records = JSON.parse(text);
      } else {
        throw new Error('不支援的檔案格式');
      }

      // 轉換並儲存數據
      const results = [];
      for (const record of records) {
        const spcData = this.transformFileData(record);

        // 如果有指定要覆蓋的 recipeId，則覆蓋
        if (overrideRecipeId) {
          spcData.recipeId = overrideRecipeId;
        }

        const created = SPCModel.create(spcData);
        results.push(created);
      }

      return {
        success: true,
        count: results.length,
        data: results
      };
    } catch (error) {
      console.error('File import failed:', error);
      throw new Error('檔案匯入失敗：' + error.message);
    }
  }

  /**
   * ========================================
   * 數據格式轉換函數
   * ========================================
   */

  /**
   * 轉換 API 數據格式
   */
  static transformAPIData(apiData) {
    // 假設 API 回傳格式：
    // {
    //   records: [
    //     { recipeId, batchNo, timestamp, measurements: {...} }
    //   ]
    // }
    if (!apiData.records || !Array.isArray(apiData.records)) {
      throw new Error('API 數據格式錯誤');
    }

    return apiData.records.map(record => ({
      recipeId: record.recipeId,
      batchNo: record.batchNo,
      timestamp: record.timestamp,
      measurements: record.measurements,
      sampleSize: record.sampleSize || 1,
      operator: record.operator || '',
      shift: record.shift || '',
      status: 'normal',
      notes: `從 API 自動同步 (${new Date().toLocaleString('zh-TW')})`
    }));
  }

  /**
   * 轉換研華 ECU 數據格式
   */
  static transformECUData(ecuData) {
    // 假設研華 ECU 回傳格式：
    // {
    //   devices: [
    //     { deviceId, timestamp, tags: { tag1: value1, tag2: value2 } }
    //   ]
    // }
    if (!ecuData.devices || !Array.isArray(ecuData.devices)) {
      throw new Error('ECU 數據格式錯誤');
    }

    return ecuData.devices.map(device => ({
      recipeId: device.recipeId || `ecu_${device.deviceId}`,
      batchNo: device.batchNo || `BATCH_${Date.now()}`,
      timestamp: device.timestamp,
      measurements: device.tags || device.data || {},
      sampleSize: 1,
      operator: 'ECU',
      shift: '',
      status: 'normal',
      notes: `研華 ECU 自動採集 (設備: ${device.deviceId})`
    }));
  }

  /**
   * 轉換數據中台數據格式
   */
  static transformDataPlatformData(platformData) {
    // 假設數據中台回傳格式：
    // {
    //   data: [
    //     { id, attributes: {...}, timestamp }
    //   ]
    // }
    if (!platformData.data || !Array.isArray(platformData.data)) {
      throw new Error('數據中台數據格式錯誤');
    }

    return platformData.data.map(record => ({
      recipeId: record.attributes.recipeId,
      batchNo: record.attributes.batchNo,
      timestamp: record.timestamp,
      measurements: record.attributes.measurements || record.attributes,
      sampleSize: record.attributes.sampleSize || 1,
      operator: record.attributes.operator || '',
      shift: record.attributes.shift || '',
      status: 'normal',
      notes: `數據中台同步 (ID: ${record.id})`
    }));
  }

  /**
   * 轉換 Webhook 數據格式
   */
  static transformWebhookData(webhookData) {
    return {
      recipeId: webhookData.recipeId,
      batchNo: webhookData.batchNo,
      timestamp: webhookData.timestamp || new Date().toISOString(),
      measurements: webhookData.data || webhookData.measurements,
      sampleSize: webhookData.sampleSize || 1,
      operator: webhookData.operator || '',
      shift: webhookData.shift || '',
      status: 'normal',
      notes: 'Webhook 推送'
    };
  }

  /**
   * 轉換檔案數據格式
   */
  static transformFileData(fileRecord) {
    // 處理 measurements 欄位
    let measurements = fileRecord.measurements;
    if (typeof measurements === 'string') {
      // 移除外層雙引號（如果有）
      measurements = measurements.replace(/^"|"$/g, '');
      // 將雙雙引號還原為單引號
      measurements = measurements.replace(/""/g, '"');
      // 解析 JSON
      measurements = JSON.parse(measurements);
    }

    return {
      recipeId: fileRecord.recipeId || fileRecord.recipe_id,
      batchNo: fileRecord.batchNo || fileRecord.batch_no,
      timestamp: fileRecord.timestamp || new Date().toISOString(),
      measurements: measurements,
      sampleSize: fileRecord.sampleSize || 1,
      operator: fileRecord.operator || '',
      shift: fileRecord.shift || '',
      status: 'normal',
      notes: '檔案匯入'
    };
  }

  /**
   * 解析 CSV（支援含有逗號的欄位，如 JSON 字串）
   */
  static parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]);
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const record = {};

      headers.forEach((header, index) => {
        record[header] = values[index];
      });

      records.push(record);
    }

    return records;
  }

  /**
   * 解析單行 CSV（處理引號包裹的欄位）
   */
  static parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // 雙引號轉義
          current += '"';
          i++;
        } else {
          // 切換引號狀態
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // 遇到分隔符且不在引號內
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // 加入最後一個欄位
    result.push(current.trim());

    return result;
  }

  /**
   * ========================================
   * 自動同步管理
   * ========================================
   */

  /**
   * 啟動自動同步
   */
  static startAutoSync() {
    const config = this.getConfig();
    const activeSource = config.activeSource;

    if (activeSource === DataSourceType.MANUAL) {
      console.log('手動模式不需要自動同步');
      return null;
    }

    const sourceConfig = config.sources[activeSource];
    if (!sourceConfig || !sourceConfig.enabled) {
      console.warn(`數據源 ${activeSource} 未啟用`);
      return null;
    }

    const interval = sourceConfig.pollInterval || 60000;

    const intervalId = setInterval(async () => {
      try {
        console.log(`正在從 ${activeSource} 同步數據...`);

        let result;
        switch (activeSource) {
          case DataSourceType.API:
            result = await this.fetchFromAPI();
            break;
          case DataSourceType.ADVANTECH_ECU:
            result = await this.fetchFromAdvantechECU();
            break;
          case DataSourceType.DATA_PLATFORM:
            result = await this.fetchFromDataPlatform();
            break;
          default:
            console.warn(`不支援的數據源: ${activeSource}`);
            return;
        }

        console.log(`同步成功，獲取 ${result.count} 筆數據`);
      } catch (error) {
        console.error('自動同步失敗:', error);
      }
    }, interval);

    // 儲存 interval ID 以便後續停止
    this._syncIntervalId = intervalId;

    console.log(`已啟動自動同步，間隔: ${interval}ms`);
    return intervalId;
  }

  /**
   * 停止自動同步
   */
  static stopAutoSync() {
    if (this._syncIntervalId) {
      clearInterval(this._syncIntervalId);
      this._syncIntervalId = null;
      console.log('已停止自動同步');
    }
  }

  /**
   * 手動觸發同步
   */
  static async syncNow() {
    const config = this.getConfig();
    const activeSource = config.activeSource;

    switch (activeSource) {
      case DataSourceType.API:
        return await this.fetchFromAPI();
      case DataSourceType.ADVANTECH_ECU:
        return await this.fetchFromAdvantechECU();
      case DataSourceType.DATA_PLATFORM:
        return await this.fetchFromDataPlatform();
      default:
        throw new Error(`數據源 ${activeSource} 不支援同步`);
    }
  }
}
