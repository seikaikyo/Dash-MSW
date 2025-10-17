/**
 * 站點作業員工作介面（重構版）
 * 模組化站點管理系統
 */

import { userContext } from '../utils/userContext.js';
import { stationManager, STATION_TYPES } from '../modules/station/stationModel.js';
import { authService } from '../utils/authService.js';

// 匯入所有站點模組
import { renderDegumStation } from './stations/DegumStation.js';
import { renderOvenStation } from './stations/OvenStation.js';
import { renderOQCReleaseStation } from './stations/OQCReleaseStation.js';
import { renderOQCAOIStation } from './stations/OQCAOIStation.js';
import { renderRFIDStation } from './stations/RFIDStation.js';
import { renderPackagingStation } from './stations/PackagingStation.js';
import { renderWarehouseInStation } from './stations/WarehouseInStation.js';
import { renderWarehouseOutStation } from './stations/WarehouseOutStation.js';

export function StationWorkPage() {
  const container = document.createElement('div');
  container.className = 'station-work-page';

  // 取得當前用戶
  const currentUser = userContext.getCurrentUser();

  if (!currentUser) {
    container.innerHTML = `
      <div class="error-message">
        <h2>未登入</h2>
        <p>請先登入系統。</p>
      </div>
    `;
    addStyles();
    return container;
  }

  // 取得所有站點
  const allStations = stationManager.getAllStations();

  if (allStations.length === 0) {
    container.innerHTML = `
      <div class="error-message">
        <h2>系統初始化中</h2>
        <p>請稍候，站點資料載入中...</p>
        <button class="btn-primary" onclick="window.location.reload()">重新載入</button>
      </div>
    `;
    addStyles();
    return container;
  }

  // 從 URL 參數或 sessionStorage 取得當前選擇的站點
  const urlParams = new URLSearchParams(window.location.search);
  let currentStationId = urlParams.get('stationId') || sessionStorage.getItem('currentStationId');

  // 如果沒有選擇站點，使用第一個站點
  if (!currentStationId) {
    currentStationId = allStations[0].id;
  }

  const currentStation = stationManager.getStation(currentStationId);
  if (!currentStation) {
    currentStationId = allStations[0].id;
  }

  const station = stationManager.getStation(currentStationId);

  // 儲存當前站點到 sessionStorage
  sessionStorage.setItem('currentStationId', currentStationId);

  // 建立頁面頁首
  const header = createHeader(station, currentUser, allStations, currentStationId);
  container.appendChild(header);

  // 建立工作區域
  const workArea = document.createElement('div');
  workArea.className = 'work-area';

  // 從 URL 取得工單號（如果有）
  const workOrderNo = urlParams.get('workOrderNo');

  // 根據站點類型渲染對應介面
  const stationInterface = renderStationInterface(station, workOrderNo);
  workArea.appendChild(stationInterface);

  container.appendChild(workArea);

  addStyles();
  return container;
}

/**
 * 建立頁首
 */
function createHeader(station, currentUser, allStations, currentStationId) {
  const header = document.createElement('div');
  header.className = 'simple-header';
  header.innerHTML = `
    <div class="header-content">
      <div class="station-info">
        <h1>${getStationIcon(station.type)} ${station.name}</h1>
        <p class="station-location">位置：${station.location}</p>
      </div>
      <div class="operator-info">
        <div class="operator-badge">
          <span class="operator-name">${currentUser.name}</span>
          <span class="operator-id">${currentUser.employeeId}</span>
        </div>
        <div class="station-switch">
          <label class="switch-label">切換站點：</label>
          <select class="station-selector" id="station-selector">
            ${allStations.map(s => `
              <option value="${s.id}" ${s.id === currentStationId ? 'selected' : ''}>
                ${getStationIcon(s.type)} ${s.name}
              </option>
            `).join('')}
          </select>
        </div>
        <button class="btn-logout" id="btn-simple-logout">登出</button>
      </div>
    </div>
  `;

  // 綁定站點切換選單
  setTimeout(() => {
    const stationSelector = header.querySelector('#station-selector');
    if (stationSelector) {
      stationSelector.addEventListener('change', (e) => {
        const selectedStationId = e.target.value;
        sessionStorage.setItem('currentStationId', selectedStationId);
        window.location.reload();
      });
    }

    // 綁定登出按鈕
    const logoutBtn = header.querySelector('#btn-simple-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('確定要登出？')) {
          authService.logout();
          window.location.reload();
        }
      });
    }
  }, 0);

  return header;
}

/**
 * 根據站點類型渲染對應介面
 */
function renderStationInterface(station, workOrderNo = null) {
  const interfaceContainer = document.createElement('div');
  interfaceContainer.className = 'station-interface';

  let stationContent;

  // 根據站點類型載入對應模組,傳遞工單號參數
  switch (station.type) {
    case STATION_TYPES.DEGUM.code:
      stationContent = renderDegumStation(station, workOrderNo);
      break;
    case STATION_TYPES.OVEN.code:
      stationContent = renderOvenStation(station, workOrderNo);
      break;
    case STATION_TYPES.OQC_RELEASE.code:
      stationContent = renderOQCReleaseStation(station, workOrderNo);
      break;
    case STATION_TYPES.OQC_AOI.code:
      stationContent = renderOQCAOIStation(station, workOrderNo);
      break;
    case STATION_TYPES.RFID.code:
      stationContent = renderRFIDStation(station, workOrderNo);
      break;
    case STATION_TYPES.PACKAGING.code:
      stationContent = renderPackagingStation(station, workOrderNo);
      break;
    case STATION_TYPES.WAREHOUSE_IN.code:
      stationContent = renderWarehouseInStation(station, workOrderNo);
      break;
    case STATION_TYPES.WAREHOUSE_OUT.code:
      stationContent = renderWarehouseOutStation(station, workOrderNo);
      break;
    default:
      stationContent = createDefaultInterface(station);
  }

  interfaceContainer.appendChild(stationContent);
  return interfaceContainer;
}

/**
 * 建立預設介面（未實作的站點）
 */
function createDefaultInterface(station) {
  const card = document.createElement('div');
  card.className = 'work-card';
  card.innerHTML = `
    <div class="card-header">
      <h2>${getStationIcon(station.type)} ${station.name}</h2>
    </div>
    <div class="card-body">
      <div class="default-interface">
        <p class="placeholder-icon">🚧</p>
        <p class="placeholder-text">站點類型：${station.type}</p>
        <p class="placeholder-note">此站點的操作介面開發中...</p>
      </div>
    </div>
  `;
  return card;
}

/**
 * 取得站點圖示
 */
function getStationIcon(stationType) {
  const type = Object.values(STATION_TYPES).find(t => t.code === stationType);
  return type ? type.icon : '🏭';
}

/**
 * 載入樣式
 */
function addStyles() {
  if (document.getElementById('station-work-page-styles')) return;

  const style = document.createElement('style');
  style.id = 'station-work-page-styles';
  style.textContent = `
    /* 主容器 */
    .station-work-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
    }

    /* 錯誤訊息 */
    .error-message {
      padding: var(--spacing-xl);
      text-align: center;
      max-width: 600px;
      margin: 100px auto;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }

    /* 頁首 */
    .simple-header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      border-bottom: none;
      padding: var(--spacing-lg) var(--spacing-xl);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
    }

    .station-info h1 {
      margin: 0 0 4px 0;
      font-size: 1.75rem;
      color: white;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .station-location {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.875rem;
    }

    .operator-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .operator-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: var(--spacing-sm) var(--spacing-md);
      background: rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
    }

    .operator-name {
      font-weight: 600;
      color: white;
      font-size: 0.9375rem;
    }

    .operator-id {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .station-switch {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background: rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
    }

    .switch-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      white-space: nowrap;
    }

    .station-selector {
      padding: 6px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: white;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary-color);
      cursor: pointer;
      min-width: 200px;
      font-family: var(--font-family);
    }

    .station-selector:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px var(--primary-light);
    }

    .btn-logout {
      padding: var(--spacing-sm) var(--spacing-lg);
      background: var(--error-color);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      transition: opacity 0.2s;
    }

    .btn-logout:hover {
      opacity: 0.9;
    }

    /* 工作區域 */
    .work-area {
      max-width: 1400px;
      margin: 0 auto;
      padding: var(--spacing-xl);
    }

    .station-interface {
      width: 100%;
    }

    /* 工作卡片 */
    .work-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .work-card:hover {
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    .card-header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: var(--spacing-lg) var(--spacing-xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .card-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
      pointer-events: none;
    }

    .card-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      position: relative;
      z-index: 1;
    }

    .station-title-section {
      position: relative;
      z-index: 1;
    }

    .station-name {
      font-size: 1.75rem;
      font-weight: 800;
      margin-bottom: 4px;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      letter-spacing: 0.5px;
    }

    .station-subtitle {
      font-size: 0.9375rem;
      color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
    }

    .station-status {
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
      z-index: 1;
    }

    .card-body {
      padding: var(--spacing-xl);
    }

    /* 資訊橫幅 */
    .info-banner {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-lg);
      background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
      border-left: 4px solid #3b82f6;
      border-radius: 12px;
      margin-bottom: var(--spacing-lg);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }

    .info-icon {
      font-size: 1.5rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .info-text {
      color: #1e40af;
      font-weight: 600;
      font-size: 0.9375rem;
    }

    /* 掃描區域 */
    .scan-section {
      margin-bottom: var(--spacing-xl);
    }

    .input-label {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
      font-size: 1rem;
    }

    .scan-input-group {
      display: flex;
      gap: var(--spacing-md);
    }

    .scan-input {
      flex: 1;
      padding: 14px var(--spacing-lg);
      font-size: 1.125rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-family: 'Courier New', monospace;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: #f9fafb;
    }

    .scan-input:focus {
      outline: none;
      border-color: #3b82f6;
      background: white;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05);
      transform: translateY(-1px);
    }

    .btn-scan {
      padding: 14px 28px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-scan:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .btn-scan:active {
      transform: translateY(0);
    }

    /* 工單詳情 */
    .work-order-details {
      margin-top: var(--spacing-xl);
    }

    .info-card {
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-radius: 12px;
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .info-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .section-title {
      margin: 0 0 var(--spacing-md) 0;
      color: #1f2937;
      font-size: 1.125rem;
      font-weight: 700;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: var(--spacing-sm);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .details-grid-full {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .field-group-box {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
    }

    .field-group-title {
      margin: 0 0 var(--spacing-md) 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--primary-color);
      padding-bottom: var(--spacing-sm);
      border-bottom: 1px solid var(--border-color);
    }

    .field-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .detail-value {
      font-size: 0.9375rem;
      color: var(--text-primary);
      font-weight: 600;
    }

    .status-success {
      color: var(--success-color);
    }

    .status-info {
      color: var(--primary-color);
    }

    .highlight {
      color: var(--primary-color);
      font-weight: 700;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      background: var(--primary-light);
      color: var(--primary-color);
      border-radius: 12px;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    /* 動作區域 */
    .action-section {
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-xl);
      border-top: 2px solid var(--border-color);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .form-field label {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .required {
      color: var(--error-color);
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: -2px;
    }

    .form-field input,
    .form-field select {
      padding: 10px 14px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 0.875rem;
      font-family: var(--font-family);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: white;
    }

    .form-field input:focus,
    .form-field select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      transform: translateY(-1px);
    }

    .form-field input[readonly] {
      background: #f3f4f6;
      cursor: not-allowed;
      border-color: #d1d5db;
    }

    .input-with-button {
      display: flex;
      gap: var(--spacing-sm);
    }

    .input-with-button input {
      flex: 1;
    }

    .btn-icon {
      padding: var(--spacing-sm);
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: var(--primary-light);
      border-color: var(--primary-color);
    }

    /* Radio 選項 */
    .radio-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-top: var(--spacing-sm);
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: white;
      position: relative;
    }

    .radio-option:hover {
      border-color: #3b82f6;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .radio-option:has(.radio-input:checked) {
      border-color: #3b82f6;
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    }

    .radio-option:has(.radio-input:checked)::before {
      content: '✓';
      position: absolute;
      right: 8px;
      top: 8px;
      width: 18px;
      height: 18px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
    }

    .radio-input {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #3b82f6;
      margin: 0;
      flex-shrink: 0;
    }

    .radio-label {
      flex: 1;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      user-select: none;
    }

    /* 再生次數資訊框 */
    .cycle-info-box {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      background: linear-gradient(135deg, #e0f2fe, #dbeafe);
      border: 2px solid var(--primary-color);
      border-radius: var(--radius-md);
      margin: var(--spacing-lg) 0;
    }

    .cycle-icon {
      font-size: 2rem;
    }

    .cycle-content {
      display: grid;
      grid-template-columns: auto auto auto auto auto;
      gap: var(--spacing-md);
      align-items: center;
    }

    .cycle-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .cycle-current,
    .cycle-next {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .cycle-arrow {
      font-size: 1.5rem;
      color: var(--primary-color);
    }

    /* 按鈕 */
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      margin-top: var(--spacing-xl);
    }

    .btn-primary {
      padding: 14px 28px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    .btn-secondary {
      padding: 14px 28px;
      background: white;
      color: #6b7280;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: #9ca3af;
      color: #374151;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .btn-secondary:active {
      transform: translateY(0);
    }

    /* 預設介面 */
    .default-interface {
      text-align: center;
      padding: var(--spacing-xxl);
    }

    .placeholder-icon {
      font-size: 4rem;
      margin-bottom: var(--spacing-md);
    }

    .placeholder-text {
      font-size: 1.125rem;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    }

    .placeholder-note {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* 工單鎖定提示 */
    .lock-banner {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      margin-bottom: var(--spacing-lg);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
    }

    .lock-icon {
      font-size: 2.5rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .lock-content {
      flex: 1;
    }

    .lock-content h4 {
      margin: 0 0 var(--spacing-sm) 0;
      color: #92400e;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .lock-content p {
      margin: 0 0 var(--spacing-sm) 0;
      color: #78350f;
      font-size: 0.875rem;
    }

    .lock-hint {
      font-size: 0.8125rem;
      color: #92400e;
      font-weight: 500;
    }

    .btn-unlock {
      padding: 10px 20px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
    }

    .btn-unlock:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }

    /* 對話框 */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--spacing-lg);
    }

    .modal-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: var(--spacing-lg) var(--spacing-xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .btn-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }

    .modal-body {
      padding: var(--spacing-xl);
      overflow-y: auto;
      flex: 1;
    }

    .dialog-info {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      padding: var(--spacing-md);
      border-radius: 8px;
      margin-bottom: var(--spacing-lg);
      border-left: 4px solid #3b82f6;
    }

    .dialog-info p {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 0.875rem;
    }

    .warning-text {
      color: #d97706;
      font-weight: 600;
      margin-top: var(--spacing-sm) !important;
    }

    .form-section {
      margin-bottom: var(--spacing-lg);
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
      font-size: 0.875rem;
    }

    .form-textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-family: var(--font-family);
      font-size: 0.875rem;
      resize: vertical;
      transition: all 0.3s;
    }

    .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .change-fields {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
    }

    .checkbox-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      background: white;
    }

    .checkbox-option:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .checkbox-option input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #3b82f6;
    }

    .checkbox-option input[type="checkbox"]:checked + span {
      font-weight: 600;
      color: #3b82f6;
    }

    .change-input-row {
      padding: var(--spacing-md);
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: var(--spacing-sm);
    }

    .change-input-row label {
      display: block;
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.875rem;
      transition: all 0.3s;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .current-value {
      display: block;
      margin-top: 6px;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .modal-footer {
      padding: var(--spacing-lg) var(--spacing-xl);
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
    }

    /* RWD 響應式設計 */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .operator-info {
        width: 100%;
        flex-wrap: wrap;
        justify-content: space-between;
      }

      .station-switch {
        flex: 1 1 100%;
        order: -1;
      }

      .station-selector {
        width: 100%;
        min-width: auto;
      }

      .operator-badge {
        flex: 1;
      }

      .btn-logout {
        flex-shrink: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
