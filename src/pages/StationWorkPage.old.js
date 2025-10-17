/**
 * 站點作業員工作介面
 * 簡化的站點操作頁面，只顯示該站點相關功能
 */

import { FormInstanceModel, UserModel } from '../utils/dataModel.js';
import { userContext } from '../utils/userContext.js';
import { stationManager, STATION_TYPES } from '../modules/station/stationModel.js';
import { authService } from '../utils/authService.js';
import { Card } from '../components/common/Card.js';

export function StationWorkPage() {
  const container = document.createElement('div');
  container.className = 'station-work-page';

  // 取得當前用戶
  const currentUser = userContext.getCurrentUser();

  if (!currentUser) {
    container.innerHTML = `
      <div class="error-message">
        <h2>❌ 未登入</h2>
        <p>請先登入系統。</p>
      </div>
    `;
    addStyles();
    return container;
  }

  // 取得所有站點
  const allStations = stationManager.getAllStations();

  // 從 URL 參數或 sessionStorage 取得當前選擇的站點
  const urlParams = new URLSearchParams(window.location.search);
  let currentStationId = urlParams.get('stationId') || sessionStorage.getItem('currentStationId');

  // 如果沒有選擇站點，使用第一個站點
  if (!currentStationId && allStations.length > 0) {
    currentStationId = allStations[0].id;
  }

  const currentStation = stationManager.getStation(currentStationId);
  if (!currentStation) {
    container.innerHTML = `
      <div class="error-message">
        <h2>❌ 站點不存在</h2>
        <p>找不到站點，請重新選擇。</p>
      </div>
    `;
    addStyles();
    return container;
  }

  // 儲存當前站點到 sessionStorage
  sessionStorage.setItem('currentStationId', currentStationId);

  // 簡化的頁首（不需要完整導航）
  const header = document.createElement('div');
  header.className = 'simple-header';
  header.innerHTML = `
    <div class="header-content">
      <div class="station-info">
        <h1>${getStationIcon(currentStation.type)} ${currentStation.name}</h1>
        <p class="station-location">位置：${currentStation.location}</p>
      </div>
      <div class="operator-info">
        <div class="operator-badge">
          <span class="operator-name">${currentUser.name}</span>
          <span class="operator-id">${currentUser.employeeId}</span>
        </div>
        <div class="station-switch">
          <label class="switch-label">切換站點：</label>
          <select class="station-selector" id="station-selector">
            ${allStations.map(station => `
              <option value="${station.id}" ${station.id === currentStationId ? 'selected' : ''}>
                ${getStationIcon(station.type)} ${station.name}
              </option>
            `).join('')}
          </select>
        </div>
        <button class="btn-logout" id="btn-simple-logout">登出</button>
      </div>
    </div>
  `;
  container.appendChild(header);

  // 站點工作區
  const workArea = document.createElement('div');
  workArea.className = 'work-area';

  // 根據站點類型渲染不同的操作介面
  const stationInterface = renderStationInterface(currentStation);
  workArea.appendChild(stationInterface);

  container.appendChild(workArea);

  // 綁定站點切換選單
  const stationSelector = container.querySelector('#station-selector');
  if (stationSelector) {
    stationSelector.addEventListener('change', (e) => {
      const selectedStationId = e.target.value;
      sessionStorage.setItem('currentStationId', selectedStationId);
      window.location.reload();
    });
  }

  // 綁定登出按鈕
  const logoutBtn = container.querySelector('#btn-simple-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('確定要登出？')) {
        authService.logout();
        window.location.reload();
      }
    });
  }

  addStyles();
  return container;

  // ========== 功能函數 ==========

  function renderStationInterface(station) {
    const interfaceContainer = document.createElement('div');
    interfaceContainer.className = 'station-interface';

    // 根據站點類型渲染對應介面
    switch (station.type) {
      case 'degum':  // 除膠站
        interfaceContainer.appendChild(renderDeglueInterface(station));
        break;
      case 'oven':  // 烘箱處理
        interfaceContainer.appendChild(renderOvenInterface(station));
        break;
      case 'oqc_release':  // OQC檢驗-釋氣
        interfaceContainer.appendChild(renderOQCDegassingInterface(station));
        break;
      case 'oqc_aoi':  // OQC檢驗-AOI
        interfaceContainer.appendChild(renderOQCAOIInterface(station));
        break;
      case 'rfid':  // RFID標籤更換
        interfaceContainer.appendChild(renderRFIDInterface(station));
        break;
      case 'packaging':  // 包裝堆棧
        interfaceContainer.appendChild(renderPackagingInterface(station));
        break;
      case 'warehouse_in':  // 成品入庫
        interfaceContainer.appendChild(renderInboundInterface(station));
        break;
      case 'warehouse_out':  // 出庫出貨
        interfaceContainer.appendChild(renderOutboundInterface(station));
        break;
      default:
        interfaceContainer.innerHTML = `
          <div class="default-interface">
            <h3>🏭 ${station.name} 工作站</h3>
            <p>站點類型：${station.type}</p>
            <p>此站點的操作介面正在開發中...</p>
          </div>
        `;
    }

    return interfaceContainer;
  }

  function renderDeglueInterface(station) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="card-header">
        <h2>🖌️ 除膠作業</h2>
        <span class="station-status status-${station.status}">${getStatusLabel(station.status)}</span>
      </div>
      <div class="card-body">
        <div class="scan-section">
          <label class="input-label">掃描工單條碼</label>
          <div class="scan-input-group">
            <input type="text" id="deglue-wo-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
            <button class="btn-scan" id="btn-deglue-scan">🔍 查詢</button>
          </div>
        </div>

        <div class="work-order-details" id="deglue-wo-details" style="display: none;">
          <h3>工單資訊</h3>
          <div class="details-grid" id="deglue-details-content"></div>

          <div class="action-section">
            <h3>除膠作業</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>作業人員</label>
                <input type="text" id="deglue-operator" value="${currentUser.name}" readonly />
              </div>
              <div class="form-field">
                <label>開始時間</label>
                <input type="datetime-local" id="deglue-start-time" />
              </div>
              <div class="form-field">
                <label>完成時間</label>
                <input type="datetime-local" id="deglue-end-time" />
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn-primary" id="btn-deglue-complete">✓ 完成除膠</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 綁定事件
    setTimeout(() => {
      const scanInput = card.querySelector('#deglue-wo-scan');
      const scanBtn = card.querySelector('#btn-deglue-scan');
      const completeBtn = card.querySelector('#btn-deglue-complete');
      const detailsSection = card.querySelector('#deglue-wo-details');

      let currentWorkOrder = null;

      const handleScan = () => {
        const workOrderNo = scanInput.value.trim();
        if (!workOrderNo) {
          alert('請輸入工單編號');
          return;
        }

        // 查詢工單
        const workOrders = FormInstanceModel.getAll();
        const wo = workOrders.find(w => w.data.workOrderNo === workOrderNo);

        if (!wo) {
          alert('工單不存在：' + workOrderNo);
          return;
        }

        currentWorkOrder = wo;
        displayWorkOrderDetails(wo);
        detailsSection.style.display = 'block';
      };

      scanBtn.addEventListener('click', handleScan);
      scanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleScan();
      });

      completeBtn.addEventListener('click', () => {
        if (!currentWorkOrder) return;

        const startTime = card.querySelector('#deglue-start-time').value;
        const endTime = card.querySelector('#deglue-end-time').value;

        if (!startTime || !endTime) {
          alert('請填寫開始和完成時間');
          return;
        }

        // 更新工單資料
        currentWorkOrder.data.deglueOperator = currentUser.name;
        currentWorkOrder.data.deglueStartTime = startTime;
        currentWorkOrder.data.deglueEndTime = endTime;
        currentWorkOrder.data.status = 'in_progress';
        currentWorkOrder.save();

        alert('✓ 除膠作業已完成！');

        // 清空表單
        scanInput.value = '';
        detailsSection.style.display = 'none';
        currentWorkOrder = null;
      });

      function displayWorkOrderDetails(wo) {
        const detailsContent = card.querySelector('#deglue-details-content');
        detailsContent.innerHTML = `
          <div class="detail-item">
            <span class="detail-label">工單編號</span>
            <span class="detail-value">${wo.data.workOrderNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">批次號</span>
            <span class="detail-value">${wo.data.batchNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">濾網類型</span>
            <span class="detail-value">${wo.data.filterType}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">數量</span>
            <span class="detail-value">${wo.data.quantity} 片</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">來源廠別</span>
            <span class="detail-value">${wo.data.sourceFactory}</span>
          </div>
        `;

        // 自動填入當前時間
        const now = new Date();
        const startInput = card.querySelector('#deglue-start-time');
        if (!startInput.value) {
          startInput.value = now.toISOString().slice(0, 16);
        }
      }
    }, 0);

    return card;
  }

  function renderOvenInterface(station) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="card-header">
        <h2>🔥 烘箱處理</h2>
        <span class="station-status status-${station.status}">${getStatusLabel(station.status)}</span>
      </div>
      <div class="card-body">
        <div class="scan-section">
          <label class="input-label">掃描工單條碼</label>
          <div class="scan-input-group">
            <input type="text" id="oven-wo-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
            <button class="btn-scan" id="btn-oven-scan">🔍 查詢</button>
          </div>
        </div>

        <div class="work-order-details" id="oven-wo-details" style="display: none;">
          <h3>工單資訊</h3>
          <div class="details-grid" id="oven-details-content"></div>

          <div class="action-section">
            <h3>烘箱設定</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>烘箱編號</label>
                <input type="text" value="${station.name}" readonly />
              </div>
              <div class="form-field">
                <label>目標溫度 (°C)</label>
                <input type="number" id="oven-target-temp" min="80" max="200" value="140" />
              </div>
              <div class="form-field">
                <label>烘烤時間 (分鐘)</label>
                <input type="number" id="oven-baking-time" min="30" max="480" value="150" />
              </div>
              <div class="form-field">
                <label>開始時間</label>
                <input type="datetime-local" id="oven-start-time" />
              </div>
              <div class="form-field">
                <label>完成時間</label>
                <input type="datetime-local" id="oven-end-time" />
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn-primary" id="btn-oven-complete">✓ 完成烘箱處理</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 綁定事件（類似除膠站點的邏輯）
    setTimeout(() => {
      const scanInput = card.querySelector('#oven-wo-scan');
      const scanBtn = card.querySelector('#btn-oven-scan');
      const completeBtn = card.querySelector('#btn-oven-complete');
      const detailsSection = card.querySelector('#oven-wo-details');

      let currentWorkOrder = null;

      const handleScan = () => {
        const workOrderNo = scanInput.value.trim();
        if (!workOrderNo) {
          alert('請輸入工單編號');
          return;
        }

        const workOrders = FormInstanceModel.getAll();
        const wo = workOrders.find(w => w.data.workOrderNo === workOrderNo);

        if (!wo) {
          alert('工單不存在：' + workOrderNo);
          return;
        }

        currentWorkOrder = wo;
        displayWorkOrderDetails(wo);
        detailsSection.style.display = 'block';
      };

      scanBtn.addEventListener('click', handleScan);
      scanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleScan();
      });

      completeBtn.addEventListener('click', () => {
        if (!currentWorkOrder) return;

        const targetTemp = card.querySelector('#oven-target-temp').value;
        const bakingTime = card.querySelector('#oven-baking-time').value;
        const startTime = card.querySelector('#oven-start-time').value;
        const endTime = card.querySelector('#oven-end-time').value;

        if (!targetTemp || !bakingTime || !startTime || !endTime) {
          alert('請填寫完整資料');
          return;
        }

        currentWorkOrder.data.ovenId = station.name;
        currentWorkOrder.data.targetTemp = parseInt(targetTemp);
        currentWorkOrder.data.bakingTime = parseInt(bakingTime);
        currentWorkOrder.data.ovenStartTime = startTime;
        currentWorkOrder.data.ovenEndTime = endTime;
        currentWorkOrder.save();

        alert('✓ 烘箱處理已完成！');

        scanInput.value = '';
        detailsSection.style.display = 'none';
        currentWorkOrder = null;
      });

      function displayWorkOrderDetails(wo) {
        const detailsContent = card.querySelector('#oven-details-content');
        detailsContent.innerHTML = `
          <div class="detail-item">
            <span class="detail-label">工單編號</span>
            <span class="detail-value">${wo.data.workOrderNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">批次號</span>
            <span class="detail-value">${wo.data.batchNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">數量</span>
            <span class="detail-value">${wo.data.quantity} 片</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">除膠完成時間</span>
            <span class="detail-value">${wo.data.deglueEndTime || '尚未完成'}</span>
          </div>
        `;

        const now = new Date();
        const startInput = card.querySelector('#oven-start-time');
        if (!startInput.value) {
          startInput.value = now.toISOString().slice(0, 16);
        }
      }
    }, 0);

    return card;
  }

  function renderOQCDegassingInterface(station) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="card-header">
        <h2>🔬 OQC 檢驗 - 釋氣檢測</h2>
        <span class="station-status status-${station.status}">${getStatusLabel(station.status)}</span>
      </div>
      <div class="card-body">
        <p class="info-text">📌 檢測標準：18 片抽檢 1 片</p>

        <div class="scan-section">
          <label class="input-label">掃描工單條碼</label>
          <div class="scan-input-group">
            <input type="text" id="oqc-wo-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
            <button class="btn-scan" id="btn-oqc-scan">🔍 查詢</button>
          </div>
        </div>

        <div class="work-order-details" id="oqc-wo-details" style="display: none;">
          <h3>工單資訊</h3>
          <div class="details-grid" id="oqc-details-content"></div>

          <div class="action-section">
            <h3>釋氣檢測結果</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>檢測結果</label>
                <select id="degassing-result">
                  <option value="">請選擇...</option>
                  <option value="合格">合格</option>
                  <option value="未達標(加抽2片)">未達標(加抽2片)</option>
                  <option value="不合格">不合格</option>
                </select>
              </div>
              <div class="form-field">
                <label>檢驗人員</label>
                <input type="text" value="${currentUser.name}" readonly />
              </div>
              <div class="form-field">
                <label>檢驗時間</label>
                <input type="datetime-local" id="inspection-time" />
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn-primary" id="btn-oqc-complete">✓ 完成檢驗</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 綁定事件
    setTimeout(() => {
      const scanInput = card.querySelector('#oqc-wo-scan');
      const scanBtn = card.querySelector('#btn-oqc-scan');
      const completeBtn = card.querySelector('#btn-oqc-complete');
      const detailsSection = card.querySelector('#oqc-wo-details');

      let currentWorkOrder = null;

      const handleScan = () => {
        const workOrderNo = scanInput.value.trim();
        if (!workOrderNo) {
          alert('請輸入工單編號');
          return;
        }

        const workOrders = FormInstanceModel.getAll();
        const wo = workOrders.find(w => w.data.workOrderNo === workOrderNo);

        if (!wo) {
          alert('工單不存在：' + workOrderNo);
          return;
        }

        currentWorkOrder = wo;
        displayWorkOrderDetails(wo);
        detailsSection.style.display = 'block';
      };

      scanBtn.addEventListener('click', handleScan);
      scanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleScan();
      });

      completeBtn.addEventListener('click', () => {
        if (!currentWorkOrder) return;

        const degassingResult = card.querySelector('#degassing-result').value;
        const inspectionTime = card.querySelector('#inspection-time').value;

        if (!degassingResult || !inspectionTime) {
          alert('請填寫完整資料');
          return;
        }

        currentWorkOrder.data.degassingTest = degassingResult;
        currentWorkOrder.data.inspectionOperator = currentUser.name;
        currentWorkOrder.data.inspectionTime = inspectionTime;
        currentWorkOrder.save();

        alert('✓ OQC 釋氣檢測已完成！');

        scanInput.value = '';
        detailsSection.style.display = 'none';
        currentWorkOrder = null;
      });

      function displayWorkOrderDetails(wo) {
        const detailsContent = card.querySelector('#oqc-details-content');
        detailsContent.innerHTML = `
          <div class="detail-item">
            <span class="detail-label">工單編號</span>
            <span class="detail-value">${wo.data.workOrderNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">數量</span>
            <span class="detail-value">${wo.data.quantity} 片</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">烘箱完成時間</span>
            <span class="detail-value">${wo.data.ovenEndTime || '尚未完成'}</span>
          </div>
        `;

        const now = new Date();
        const timeInput = card.querySelector('#inspection-time');
        if (!timeInput.value) {
          timeInput.value = now.toISOString().slice(0, 16);
        }
      }
    }, 0);

    return card;
  }

  function renderOQCAOIInterface(station) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="card-header">
        <h2>📷 OQC 檢驗 - 所羅門 AOI</h2>
        <span class="station-status status-${station.status}">${getStatusLabel(station.status)}</span>
      </div>
      <div class="card-body">
        <p class="info-text">📌 自動光學檢測（AOI）系統整合</p>

        <div class="scan-section">
          <label class="input-label">掃描工單條碼</label>
          <div class="scan-input-group">
            <input type="text" id="aoi-wo-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
            <button class="btn-scan" id="btn-aoi-scan">🔍 查詢</button>
          </div>
        </div>

        <div class="work-order-details" id="aoi-wo-details" style="display: none;">
          <h3>工單資訊</h3>
          <div class="details-grid" id="aoi-details-content"></div>

          <div class="action-section">
            <h3>AOI 檢測結果</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>AOI 檢測結果</label>
                <select id="aoi-result">
                  <option value="">請選擇...</option>
                  <option value="OK">OK - 無瑕疵</option>
                  <option value="NG-污染">NG - 污染</option>
                  <option value="NG-瑕疵">NG - 瑕疵</option>
                  <option value="NG-破損">NG - 破損</option>
                </select>
              </div>
              <div class="form-field">
                <label>檢驗人員</label>
                <input type="text" value="${currentUser.name}" readonly />
              </div>
              <div class="form-field">
                <label>檢驗時間</label>
                <input type="datetime-local" id="aoi-time" />
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn-primary" id="btn-aoi-complete">✓ 完成 AOI 檢測</button>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const scanInput = card.querySelector('#aoi-wo-scan');
      const scanBtn = card.querySelector('#btn-aoi-scan');
      const completeBtn = card.querySelector('#btn-aoi-complete');
      const detailsSection = card.querySelector('#aoi-wo-details');

      let currentWorkOrder = null;

      const handleScan = () => {
        const workOrderNo = scanInput.value.trim();
        if (!workOrderNo) {
          alert('請輸入工單編號');
          return;
        }

        const workOrders = FormInstanceModel.getAll();
        const wo = workOrders.find(w => w.data.workOrderNo === workOrderNo);

        if (!wo) {
          alert('工單不存在：' + workOrderNo);
          return;
        }

        currentWorkOrder = wo;
        displayWorkOrderDetails(wo);
        detailsSection.style.display = 'block';
      };

      scanBtn.addEventListener('click', handleScan);
      scanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleScan();
      });

      completeBtn.addEventListener('click', () => {
        if (!currentWorkOrder) return;

        const aoiResult = card.querySelector('#aoi-result').value;
        const aoiTime = card.querySelector('#aoi-time').value;

        if (!aoiResult || !aoiTime) {
          alert('請填寫完整資料');
          return;
        }

        currentWorkOrder.data.aoiResult = aoiResult;
        currentWorkOrder.data.inspectionOperator = currentUser.name;
        currentWorkOrder.data.inspectionTime = aoiTime;
        currentWorkOrder.save();

        alert('✓ AOI 檢測已完成！');

        scanInput.value = '';
        detailsSection.style.display = 'none';
        currentWorkOrder = null;
      });

      function displayWorkOrderDetails(wo) {
        const detailsContent = card.querySelector('#aoi-details-content');
        detailsContent.innerHTML = `
          <div class="detail-item">
            <span class="detail-label">工單編號</span>
            <span class="detail-value">${wo.data.workOrderNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">數量</span>
            <span class="detail-value">${wo.data.quantity} 片</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">釋氣檢測結果</span>
            <span class="detail-value">${wo.data.degassingTest || '尚未檢測'}</span>
          </div>
        `;

        const now = new Date();
        const timeInput = card.querySelector('#aoi-time');
        if (!timeInput.value) {
          timeInput.value = now.toISOString().slice(0, 16);
        }
      }
    }, 0);

    return card;
  }

  function renderRFIDInterface(station) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="card-header">
        <h2>🏷️ RFID 標籤更換</h2>
        <span class="station-status status-${station.status}">${getStatusLabel(station.status)}</span>
      </div>
      <div class="card-body">
        <p class="info-text">📌 OQC 檢驗通過後自動更換 RFID 標籤</p>

        <div class="scan-section">
          <label class="input-label">掃描工單條碼</label>
          <div class="scan-input-group">
            <input type="text" id="rfid-wo-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
            <button class="btn-scan" id="btn-rfid-scan">🔍 查詢</button>
          </div>
        </div>

        <div class="work-order-details" id="rfid-wo-details" style="display: none;">
          <h3>工單資訊</h3>
          <div class="details-grid" id="rfid-details-content"></div>

          <div class="action-section">
            <h3>RFID 標籤更換</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>RFID 更換狀態</label>
                <select id="rfid-status">
                  <option value="">請選擇...</option>
                  <option value="已更換">已更換</option>
                  <option value="待更換">待更換</option>
                  <option value="異常">異常</option>
                </select>
              </div>
              <div class="form-field">
                <label>作業人員</label>
                <input type="text" value="${currentUser.name}" readonly />
              </div>
              <div class="form-field">
                <label>完成時間</label>
                <input type="datetime-local" id="rfid-time" />
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn-primary" id="btn-rfid-complete">✓ 完成 RFID 更換</button>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const scanInput = card.querySelector('#rfid-wo-scan');
      const scanBtn = card.querySelector('#btn-rfid-scan');
      const completeBtn = card.querySelector('#btn-rfid-complete');
      const detailsSection = card.querySelector('#rfid-wo-details');

      let currentWorkOrder = null;

      const handleScan = () => {
        const workOrderNo = scanInput.value.trim();
        if (!workOrderNo) {
          alert('請輸入工單編號');
          return;
        }

        const workOrders = FormInstanceModel.getAll();
        const wo = workOrders.find(w => w.data.workOrderNo === workOrderNo);

        if (!wo) {
          alert('工單不存在：' + workOrderNo);
          return;
        }

        currentWorkOrder = wo;
        displayWorkOrderDetails(wo);
        detailsSection.style.display = 'block';
      };

      scanBtn.addEventListener('click', handleScan);
      scanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleScan();
      });

      completeBtn.addEventListener('click', () => {
        if (!currentWorkOrder) return;

        const rfidStatus = card.querySelector('#rfid-status').value;
        const rfidTime = card.querySelector('#rfid-time').value;

        if (!rfidStatus || !rfidTime) {
          alert('請填寫完整資料');
          return;
        }

        // 更新 RFID 狀態
        currentWorkOrder.data.rfidUpdate = rfidStatus;

        // 如果 RFID 已更換，自動遞增再生次數
        if (rfidStatus === '已更換') {
          const currentCycle = currentWorkOrder.data.regenerationCycle || 'R0 (首次再生)';

          // 解析再生次數
          const match = currentCycle.match(/R(\d+)/);
          if (match) {
            const currentNumber = parseInt(match[1]);
            const nextNumber = currentNumber + 1;

            // 生成次數描述
            let description;
            switch (nextNumber) {
              case 1: description = '(第二次)'; break;
              case 2: description = '(第三次)'; break;
              case 3: description = '(第四次)'; break;
              case 4: description = '(第五次)'; break;
              case 5: description = '(第六次)'; break;
              default: description = `(第${nextNumber + 1}次)`;
            }

            currentWorkOrder.data.regenerationCycle = `R${nextNumber} ${description}`;
            alert(`✓ RFID 標籤更換已完成！\n再生次數已更新為：R${nextNumber} ${description}`);
          } else {
            alert('✓ RFID 標籤更換已完成！');
          }
        } else {
          alert('✓ RFID 標籤更換已完成！');
        }

        currentWorkOrder.save();

        scanInput.value = '';
        detailsSection.style.display = 'none';
        currentWorkOrder = null;
      });

      function displayWorkOrderDetails(wo) {
        const detailsContent = card.querySelector('#rfid-details-content');
        detailsContent.innerHTML = `
          <div class="detail-item">
            <span class="detail-label">工單編號</span>
            <span class="detail-value">${wo.data.workOrderNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">批次號</span>
            <span class="detail-value">${wo.data.batchNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">再生次數</span>
            <span class="detail-value">${wo.data.regenerationCycle || 'R0'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">檢驗狀態</span>
            <span class="detail-value">${wo.data.aoiResult || '尚未檢驗'}</span>
          </div>
        `;

        const now = new Date();
        const timeInput = card.querySelector('#rfid-time');
        if (!timeInput.value) {
          timeInput.value = now.toISOString().slice(0, 16);
        }
      }
    }, 0);

    return card;
  }

  function renderPackagingInterface(station) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="card-header">
        <h2>📦 包裝堆棧</h2>
        <span class="station-status status-${station.status}">${getStatusLabel(station.status)}</span>
      </div>
      <div class="card-body">
        <p class="info-text">📌 完成包裝並綁定 Pallet ID（一 Pallet 多濾網 ID）</p>

        <div class="scan-section">
          <label class="input-label">掃描工單條碼</label>
          <div class="scan-input-group">
            <input type="text" id="pkg-wo-scan" class="scan-input" placeholder="請掃描工單條碼..." autofocus />
            <button class="btn-scan" id="btn-pkg-scan">🔍 查詢</button>
          </div>
        </div>

        <div class="work-order-details" id="pkg-wo-details" style="display: none;">
          <h3>工單資訊</h3>
          <div class="details-grid" id="pkg-details-content"></div>

          <div class="action-section">
            <h3>包裝資訊</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>Pallet ID</label>
                <input type="text" id="pallet-id" placeholder="掃描或輸入 Pallet ID" />
              </div>
              <div class="form-field">
                <label>包裝人員</label>
                <input type="text" value="${currentUser.name}" readonly />
              </div>
              <div class="form-field">
                <label>包裝完成時間</label>
                <input type="datetime-local" id="pkg-time" />
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn-primary" id="btn-pkg-complete">✓ 完成包裝</button>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const scanInput = card.querySelector('#pkg-wo-scan');
      const scanBtn = card.querySelector('#btn-pkg-scan');
      const completeBtn = card.querySelector('#btn-pkg-complete');
      const detailsSection = card.querySelector('#pkg-wo-details');

      let currentWorkOrder = null;

      const handleScan = () => {
        const workOrderNo = scanInput.value.trim();
        if (!workOrderNo) {
          alert('請輸入工單編號');
          return;
        }

        const workOrders = FormInstanceModel.getAll();
        const wo = workOrders.find(w => w.data.workOrderNo === workOrderNo);

        if (!wo) {
          alert('工單不存在：' + workOrderNo);
          return;
        }

        currentWorkOrder = wo;
        displayWorkOrderDetails(wo);
        detailsSection.style.display = 'none';

        // 自動生成 Pallet ID
        const palletIdInput = card.querySelector('#pallet-id');
        if (!palletIdInput.value && wo.data.batchNo) {
          palletIdInput.value = `PLT-${wo.data.batchNo}`;
        }

        detailsSection.style.display = 'block';
      };

      scanBtn.addEventListener('click', handleScan);
      scanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleScan();
      });

      completeBtn.addEventListener('click', () => {
        if (!currentWorkOrder) return;

        const palletId = card.querySelector('#pallet-id').value;
        const pkgTime = card.querySelector('#pkg-time').value;

        if (!palletId || !pkgTime) {
          alert('請填寫完整資料');
          return;
        }

        currentWorkOrder.data.palletId = palletId;
        currentWorkOrder.data.packageTime = pkgTime;
        currentWorkOrder.save();

        alert(`✓ 包裝已完成！Pallet ID: ${palletId}`);

        scanInput.value = '';
        detailsSection.style.display = 'none';
        currentWorkOrder = null;
      });

      function displayWorkOrderDetails(wo) {
        const detailsContent = card.querySelector('#pkg-details-content');
        detailsContent.innerHTML = `
          <div class="detail-item">
            <span class="detail-label">工單編號</span>
            <span class="detail-value">${wo.data.workOrderNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">批次號</span>
            <span class="detail-value">${wo.data.batchNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">數量</span>
            <span class="detail-value">${wo.data.quantity} 片</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">RFID 狀態</span>
            <span class="detail-value">${wo.data.rfidUpdate || '待更換'}</span>
          </div>
        `;

        const now = new Date();
        const timeInput = card.querySelector('#pkg-time');
        if (!timeInput.value) {
          timeInput.value = now.toISOString().slice(0, 16);
        }
      }
    }, 0);

    return card;
  }

  function renderInboundInterface(station) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="card-header">
        <h2>📥 成品入庫</h2>
        <span class="station-status status-${station.status}">${getStatusLabel(station.status)}</span>
      </div>
      <div class="card-body">
        <p class="info-text">📌 WMS 智能庫位分配與入庫管理</p>

        <div class="scan-section">
          <label class="input-label">掃描 Pallet ID 或工單條碼</label>
          <div class="scan-input-group">
            <input type="text" id="inbound-scan" class="scan-input" placeholder="請掃描 Pallet ID 或工單條碼..." autofocus />
            <button class="btn-scan" id="btn-inbound-scan">🔍 查詢</button>
          </div>
        </div>

        <div class="work-order-details" id="inbound-details" style="display: none;">
          <h3>入庫資訊</h3>
          <div class="details-grid" id="inbound-content"></div>

          <div class="action-section">
            <h3>庫位分配</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>倉位位置</label>
                <input type="text" id="warehouse-location" placeholder="例如: A1-01" />
              </div>
              <div class="form-field">
                <label>入庫人員</label>
                <input type="text" value="${currentUser.name}" readonly />
              </div>
              <div class="form-field">
                <label>入庫時間</label>
                <input type="datetime-local" id="inbound-time" />
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn-secondary" id="btn-auto-assign">🤖 智能分配庫位</button>
              <button class="btn-primary" id="btn-inbound-complete">✓ 完成入庫</button>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const scanInput = card.querySelector('#inbound-scan');
      const scanBtn = card.querySelector('#btn-inbound-scan');
      const completeBtn = card.querySelector('#btn-inbound-complete');
      const autoAssignBtn = card.querySelector('#btn-auto-assign');
      const detailsSection = card.querySelector('#inbound-details');

      let currentWorkOrder = null;

      const handleScan = () => {
        const scanValue = scanInput.value.trim();
        if (!scanValue) {
          alert('請輸入 Pallet ID 或工單編號');
          return;
        }

        const workOrders = FormInstanceModel.getAll();
        const wo = workOrders.find(w =>
          w.data.workOrderNo === scanValue ||
          w.data.palletId === scanValue
        );

        if (!wo) {
          alert('找不到對應的工單或 Pallet');
          return;
        }

        currentWorkOrder = wo;
        displayInboundDetails(wo);
        detailsSection.style.display = 'block';
      };

      scanBtn.addEventListener('click', handleScan);
      scanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleScan();
      });

      autoAssignBtn.addEventListener('click', () => {
        // 智能分配庫位（簡化版）
        const locationInput = card.querySelector('#warehouse-location');
        const areaCode = String.fromCharCode(65 + Math.floor(Math.random() * 5)); // A-E
        const row = Math.floor(Math.random() * 10) + 1;
        const col = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
        locationInput.value = `${areaCode}${row}-${col}`;
        alert('✓ 已自動分配庫位');
      });

      completeBtn.addEventListener('click', () => {
        if (!currentWorkOrder) return;

        const warehouseLocation = card.querySelector('#warehouse-location').value;
        const inboundTime = card.querySelector('#inbound-time').value;

        if (!warehouseLocation || !inboundTime) {
          alert('請填寫完整資料');
          return;
        }

        currentWorkOrder.data.warehouseLocation = warehouseLocation;
        currentWorkOrder.data.inboundTime = inboundTime;
        currentWorkOrder.status = 'completed';
        currentWorkOrder.save();

        alert(`✓ 入庫完成！庫位: ${warehouseLocation}`);

        scanInput.value = '';
        detailsSection.style.display = 'none';
        currentWorkOrder = null;
      });

      function displayInboundDetails(wo) {
        const detailsContent = card.querySelector('#inbound-content');
        detailsContent.innerHTML = `
          <div class="detail-item">
            <span class="detail-label">工單編號</span>
            <span class="detail-value">${wo.data.workOrderNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pallet ID</span>
            <span class="detail-value">${wo.data.palletId || '未設定'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">數量</span>
            <span class="detail-value">${wo.data.quantity} 片</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">包裝完成時間</span>
            <span class="detail-value">${wo.data.packageTime || '尚未包裝'}</span>
          </div>
        `;

        const now = new Date();
        const timeInput = card.querySelector('#inbound-time');
        if (!timeInput.value) {
          timeInput.value = now.toISOString().slice(0, 16);
        }
      }
    }, 0);

    return card;
  }

  function renderOutboundInterface(station) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="card-header">
        <h2>📤 出庫出貨</h2>
        <span class="station-status status-${station.status}">${getStatusLabel(station.status)}</span>
      </div>
      <div class="card-body">
        <p class="info-text">📌 客戶訂單對應與出貨管理</p>

        <div class="scan-section">
          <label class="input-label">掃描 Pallet ID 或庫位條碼</label>
          <div class="scan-input-group">
            <input type="text" id="outbound-scan" class="scan-input" placeholder="請掃描 Pallet ID 或庫位條碼..." autofocus />
            <button class="btn-scan" id="btn-outbound-scan">🔍 查詢</button>
          </div>
        </div>

        <div class="work-order-details" id="outbound-details" style="display: none;">
          <h3>出貨資訊</h3>
          <div class="details-grid" id="outbound-content"></div>

          <div class="action-section">
            <h3>出貨記錄</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>客戶訂單號</label>
                <input type="text" id="customer-order-no" placeholder="輸入客戶訂單號" />
              </div>
              <div class="form-field">
                <label>出貨人員</label>
                <input type="text" value="${currentUser.name}" readonly />
              </div>
              <div class="form-field">
                <label>出庫時間</label>
                <input type="datetime-local" id="outbound-time" />
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn-primary" id="btn-outbound-complete">✓ 完成出庫</button>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      const scanInput = card.querySelector('#outbound-scan');
      const scanBtn = card.querySelector('#btn-outbound-scan');
      const completeBtn = card.querySelector('#btn-outbound-complete');
      const detailsSection = card.querySelector('#outbound-details');

      let currentWorkOrder = null;

      const handleScan = () => {
        const scanValue = scanInput.value.trim();
        if (!scanValue) {
          alert('請輸入 Pallet ID 或庫位條碼');
          return;
        }

        const workOrders = FormInstanceModel.getAll();
        const wo = workOrders.find(w =>
          w.data.palletId === scanValue ||
          w.data.warehouseLocation === scanValue
        );

        if (!wo) {
          alert('找不到對應的庫存');
          return;
        }

        if (!wo.data.warehouseLocation) {
          alert('此批次尚未入庫，無法出貨');
          return;
        }

        currentWorkOrder = wo;
        displayOutboundDetails(wo);
        detailsSection.style.display = 'block';
      };

      scanBtn.addEventListener('click', handleScan);
      scanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleScan();
      });

      completeBtn.addEventListener('click', () => {
        if (!currentWorkOrder) return;

        const customerOrderNo = card.querySelector('#customer-order-no').value;
        const outboundTime = card.querySelector('#outbound-time').value;

        if (!customerOrderNo || !outboundTime) {
          alert('請填寫完整資料');
          return;
        }

        currentWorkOrder.data.customerOrderNo = customerOrderNo;
        currentWorkOrder.data.outboundTime = outboundTime;
        currentWorkOrder.status = 'approved';
        currentWorkOrder.save();

        alert(`✓ 出庫完成！客戶訂單: ${customerOrderNo}`);

        scanInput.value = '';
        detailsSection.style.display = 'none';
        currentWorkOrder = null;
      });

      function displayOutboundDetails(wo) {
        const detailsContent = card.querySelector('#outbound-content');
        detailsContent.innerHTML = `
          <div class="detail-item">
            <span class="detail-label">工單編號</span>
            <span class="detail-value">${wo.data.workOrderNo}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pallet ID</span>
            <span class="detail-value">${wo.data.palletId || '未設定'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">庫位</span>
            <span class="detail-value">${wo.data.warehouseLocation}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">數量</span>
            <span class="detail-value">${wo.data.quantity} 片</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">入庫時間</span>
            <span class="detail-value">${wo.data.inboundTime}</span>
          </div>
        `;

        const now = new Date();
        const timeInput = card.querySelector('#outbound-time');
        if (!timeInput.value) {
          timeInput.value = now.toISOString().slice(0, 16);
        }
      }
    }, 0);

    return card;
  }

  function createSimpleInterface(title, description) {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="card-header">
        <h2>${title}</h2>
      </div>
      <div class="card-body">
        <div class="placeholder-interface">
          <p class="placeholder-icon">🚧</p>
          <p class="placeholder-text">${description}</p>
          <p class="placeholder-note">此功能介面開發中...</p>
        </div>
      </div>
    `;
    return card;
  }

  function getStationIcon(stationType) {
    const icons = {
      'degum': '🧪',
      'oven': '🔥',
      'oqc_release': '💨',
      'oqc_aoi': '🔬',
      'rfid': '🏷️',
      'packaging': '📦',
      'warehouse_in': '📥',
      'warehouse_out': '📤'
    };
    return icons[stationType] || '🏭';
  }

  function getStatusLabel(status) {
    const labels = {
      'idle': '閒置',
      'running': '運行中',
      'paused': '暫停',
      'maintenance': '維護中',
      'error': '故障'
    };
    return labels[status] || status;
  }
}

function addStyles() {
  if (!document.getElementById('station-work-page-styles')) {
    const style = document.createElement('style');
    style.id = 'station-work-page-styles';
    style.textContent = `
      .station-work-page {
        min-height: 100vh;
        background: var(--bg-secondary);
      }

      .error-message {
        padding: var(--spacing-xl);
        text-align: center;
        max-width: 600px;
        margin: 100px auto;
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
      }

      .simple-header {
        background: white;
        border-bottom: 2px solid var(--primary-color);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      .header-content {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .station-info h1 {
        margin: 0 0 4px 0;
        font-size: 1.75rem;
        color: var(--primary-color);
      }

      .station-location {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .operator-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .station-switch {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
      }

      .switch-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
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

      .operator-badge {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
      }

      .operator-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9375rem;
      }

      .operator-id {
        font-size: 0.75rem;
        color: var(--text-secondary);
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

      .work-area {
        max-width: 1400px;
        margin: 0 auto;
        padding: var(--spacing-xl);
      }

      .station-interface {
        width: 100%;
      }

      .work-card {
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        overflow: hidden;
      }

      .card-header {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
        color: white;
        padding: var(--spacing-lg);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .card-header h2 {
        margin: 0;
        font-size: 1.5rem;
      }

      .station-status {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.2);
      }

      .card-body {
        padding: var(--spacing-xl);
      }

      .info-text {
        padding: var(--spacing-md);
        background: var(--primary-light);
        border-left: 4px solid var(--primary-color);
        border-radius: var(--radius-sm);
        margin-bottom: var(--spacing-lg);
        color: var(--primary-color);
        font-weight: 500;
      }

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
        padding: var(--spacing-md) var(--spacing-lg);
        font-size: 1.125rem;
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        font-family: 'Courier New', monospace;
        font-weight: 600;
      }

      .scan-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-light);
      }

      .btn-scan {
        padding: var(--spacing-md) var(--spacing-xl);
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        transition: opacity 0.2s;
        white-space: nowrap;
      }

      .btn-scan:hover {
        opacity: 0.9;
      }

      .work-order-details {
        margin-top: var(--spacing-xl);
      }

      .work-order-details h3 {
        margin: 0 0 var(--spacing-md) 0;
        color: var(--text-primary);
        font-size: 1.125rem;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: var(--spacing-sm);
      }

      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-lg);
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

      .form-field label {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.875rem;
      }

      .form-field input,
      .form-field select {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-family: var(--font-family);
      }

      .form-field input:focus,
      .form-field select:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-light);
      }

      .form-field input[readonly] {
        background: var(--bg-secondary);
        cursor: not-allowed;
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-md);
      }

      .btn-primary {
        padding: var(--spacing-md) var(--spacing-xl);
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        transition: opacity 0.2s;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .btn-secondary {
        padding: var(--spacing-md) var(--spacing-xl);
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.2s;
      }

      .btn-secondary:hover {
        background: var(--bg-tertiary);
        border-color: var(--primary-color);
      }

      .placeholder-interface {
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

      .default-interface {
        text-align: center;
        padding: var(--spacing-xxl);
      }
    `;
    document.head.appendChild(style);
  }
}
