import { Button } from '../components/common/Button.js';
import { Select } from '../components/common/Select.js';
import { Input } from '../components/common/Input.js';
import { Modal } from '../components/common/Modal.js';
import { SPCModel } from '../utils/spcModel.js';
import { SPCDataSource, DataSourceType } from '../utils/spcDataSource.js';
import { FormModel } from '../utils/dataModel.js';
import { Chart, registerables } from 'chart.js';
import { calculateProcessCapability, getCapabilityRecommendations } from '../utils/capabilityAnalysis.js';

// 註冊 Chart.js 組件
Chart.register(...registerables);

export function SPCPage() {
  const container = document.createElement('div');
  container.className = 'spc-page';

  // 狀態
  let selectedRecipeId = null;
  let selectedParameter = null;
  let currentChart = null;

  // 載入所有配方
  const allRecipes = FormModel.getAll();

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';

  const headerLeft = document.createElement('div');
  headerLeft.innerHTML = `
    <h2>📊 SPC 統計製程管制</h2>
    <p class="text-secondary">Statistical Process Control - 監控配方品質趨勢與製程能力</p>
  `;

  const headerRight = document.createElement('div');
  headerRight.className = 'header-actions';

  const dataSourceBtn = new Button({
    text: '數據來源設定',
    variant: 'outline',
    onClick: () => showDataSourceConfig()
  });

  const addDataBtn = new Button({
    text: '新增數據',
    variant: 'primary',
    onClick: () => showAddDataModal()
  });

  headerRight.appendChild(dataSourceBtn.render());
  headerRight.appendChild(addDataBtn.render());

  header.appendChild(headerLeft);
  header.appendChild(headerRight);
  container.appendChild(header);

  // 配方選擇區域
  const selectionBar = document.createElement('div');
  selectionBar.className = 'selection-bar';

  const recipeSelect = new Select({
    label: '選擇配方',
    options: [
      { value: '', label: '-- 請選擇配方 --' },
      ...allRecipes.map(recipe => ({
        value: recipe.id,
        label: `${recipe.name} (${recipe.id})`
      }))
    ],
    onChange: (value) => {
      selectedRecipeId = value;
      if (value) {
        loadRecipeData(value);
      } else {
        clearDisplay();
      }
    }
  });

  selectionBar.appendChild(recipeSelect.render());
  container.appendChild(selectionBar);

  // 主要內容區域
  const contentArea = document.createElement('div');
  contentArea.className = 'spc-content';
  contentArea.id = 'spc-content';

  // 初始空狀態
  contentArea.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>選擇配方以開始分析</h3>
      <p>請從上方下拉選單選擇要分析的配方</p>
    </div>
  `;

  container.appendChild(contentArea);

  /**
   * 載入配方數據並顯示分析
   */
  function loadRecipeData(recipeId) {
    const recipe = FormModel.getById(recipeId);
    if (!recipe) {
      alert('找不到配方');
      return;
    }

    const spcData = SPCModel.getByRecipeId(recipeId);

    // 清空內容區域
    contentArea.innerHTML = '';

    if (spcData.length === 0) {
      contentArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>此配方尚無 SPC 數據</h3>
          <p>點選右上角「新增數據」按鈕開始記錄品質數據</p>
        </div>
      `;
      return;
    }

    // 顯示統計資訊卡片
    const statsSection = createStatsSection(recipe, spcData);
    contentArea.appendChild(statsSection);

    // 顯示參數選擇和圖表
    const chartSection = createChartSection(recipe, spcData);
    contentArea.appendChild(chartSection);

    // 顯示製程能力分析
    const capabilitySection = createCapabilitySection(recipe, spcData);
    contentArea.appendChild(capabilitySection);

    // 顯示最近數據表格
    const dataTableSection = createDataTableSection(spcData);
    contentArea.appendChild(dataTableSection);
  }

  /**
   * 建立統計資訊區域
   */
  function createStatsSection(recipe, spcData) {
    const section = document.createElement('div');
    section.className = 'stats-section';

    const dataCount = spcData.length;
    const alertCount = spcData.filter(d => d.status === 'alert').length;
    const warningCount = spcData.filter(d => d.status === 'warning').length;

    const latestData = spcData[spcData.length - 1];
    const oldestData = spcData[0];

    const timeSpan = Math.ceil(
      (new Date(latestData.timestamp) - new Date(oldestData.timestamp)) / (1000 * 60 * 60 * 24)
    );

    section.innerHTML = `
      <h3>📈 數據概覽</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">${dataCount}</div>
            <div class="stat-label">數據點數</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-value">${timeSpan}</div>
            <div class="stat-label">時間跨度（天）</div>
          </div>
        </div>

        <div class="stat-card ${alertCount > 0 ? 'stat-alert' : ''}">
          <div class="stat-icon">🚨</div>
          <div class="stat-content">
            <div class="stat-value">${alertCount}</div>
            <div class="stat-label">超限警報</div>
          </div>
        </div>

        <div class="stat-card ${warningCount > 0 ? 'stat-warning' : ''}">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">${warningCount}</div>
            <div class="stat-label">異常警告</div>
          </div>
        </div>
      </div>
    `;

    return section;
  }

  /**
   * 建立圖表區域
   */
  function createChartSection(recipe, spcData) {
    const section = document.createElement('div');
    section.className = 'chart-section';

    // 取得所有可用的參數
    const allParameters = new Set();
    spcData.forEach(data => {
      Object.keys(data.measurements).forEach(param => allParameters.add(param));
    });

    const parameters = Array.from(allParameters);

    section.innerHTML = `
      <h3>📉 管制圖 (Control Chart)</h3>
      <div class="chart-controls">
        <div id="param-select-container"></div>
        <div class="chart-actions">
          <button class="btn-outline" id="download-chart">下載圖表</button>
        </div>
      </div>
      <div class="chart-container">
        <canvas id="control-chart"></canvas>
      </div>
    `;

    const paramSelectContainer = section.querySelector('#param-select-container');
    const paramSelect = new Select({
      label: '選擇參數',
      options: parameters.map(param => ({ value: param, label: param })),
      onChange: (param) => {
        selectedParameter = param;
        renderControlChart(recipe.id, param);
      }
    });

    paramSelectContainer.appendChild(paramSelect.render());

    // 預設選擇第一個參數
    if (parameters.length > 0) {
      selectedParameter = parameters[0];
      // 延遲渲染圖表，確保 canvas 元素已經加入 DOM
      setTimeout(() => renderControlChart(recipe.id, parameters[0]), 100);
    }

    // 下載圖表
    section.querySelector('#download-chart').addEventListener('click', () => {
      if (currentChart) {
        const url = currentChart.toBase64Image();
        const link = document.createElement('a');
        link.download = `control-chart-${recipe.name}-${selectedParameter}.png`;
        link.href = url;
        link.click();
      }
    });

    return section;
  }

  /**
   * 渲染管制圖
   */
  function renderControlChart(recipeId, parameter) {
    const canvas = document.getElementById('control-chart');
    if (!canvas) return;

    // 銷毀舊圖表
    if (currentChart) {
      currentChart.destroy();
    }

    const spcData = SPCModel.getByRecipeId(recipeId);
    const values = spcData.map(d => d.measurements[parameter]).filter(v => v !== undefined);
    const labels = spcData.map((d, i) => `#${i + 1}`);

    // 獲取管制限
    const limits = SPCModel.getLimitsByRecipeId(recipeId).find(l => l.parameter === parameter);

    const datasets = [
      {
        label: '測量值',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.1
      }
    ];

    // 如果有設定管制限，加入管制線
    if (limits) {
      datasets.push(
        {
          label: '管制上限 (UCL)',
          data: Array(values.length).fill(limits.ucl),
          borderColor: '#ef4444',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: '中心線 (CL)',
          data: Array(values.length).fill(limits.cl),
          borderColor: '#10b981',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: '管制下限 (LCL)',
          data: Array(values.length).fill(limits.lcl),
          borderColor: '#ef4444',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      );
    }

    currentChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2.5,
        plugins: {
          title: {
            display: true,
            text: `${parameter} 管制圖`,
            font: { size: 16 }
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: '測量值'
            }
          },
          x: {
            title: {
              display: true,
              text: '樣本編號'
            }
          }
        }
      }
    });
  }

  /**
   * 建立製程能力分析區域
   */
  function createCapabilitySection(recipe, spcData) {
    const section = document.createElement('div');
    section.className = 'capability-section';

    // 取得所有可用的參數
    const allParameters = new Set();
    spcData.forEach(data => {
      Object.keys(data.measurements).forEach(param => allParameters.add(param));
    });
    const parameters = Array.from(allParameters);

    section.innerHTML = `
      <h3>🎯 製程能力分析 (Process Capability)</h3>
      <div id="capability-content">
        <div class="capability-setup">
          <div class="setup-row">
            <div id="capability-param-select"></div>
            <div id="capability-usl-input"></div>
            <div id="capability-lsl-input"></div>
            <div id="capability-calculate-btn"></div>
          </div>
        </div>
        <div id="capability-results" class="capability-results" style="display: none;">
          <!-- 結果將動態插入 -->
        </div>
      </div>
    `;

    // 渲染參數選擇器
    const paramSelectContainer = section.querySelector('#capability-param-select');
    const paramSelect = new Select({
      label: '選擇參數',
      options: [
        { value: '', label: '-- 選擇參數 --' },
        ...parameters.map(param => ({ value: param, label: param }))
      ]
    });
    paramSelectContainer.appendChild(paramSelect.render());

    // 渲染規格上限輸入
    const uslInputContainer = section.querySelector('#capability-usl-input');
    const uslInput = new Input({
      label: '規格上限 (USL)',
      type: 'number',
      step: 'any',
      placeholder: '例: 100'
    });
    uslInputContainer.appendChild(uslInput.render());

    // 渲染規格下限輸入
    const lslInputContainer = section.querySelector('#capability-lsl-input');
    const lslInput = new Input({
      label: '規格下限 (LSL)',
      type: 'number',
      step: 'any',
      placeholder: '例: 90'
    });
    lslInputContainer.appendChild(lslInput.render());

    // 渲染計算按鈕
    const calculateBtnContainer = section.querySelector('#capability-calculate-btn');
    const calculateBtn = new Button({
      text: '計算製程能力',
      variant: 'primary',
      onClick: () => {
        const paramValue = paramSelect.element.querySelector('select').value;
        const uslValue = parseFloat(uslInput.element.querySelector('input').value);
        const lslValue = parseFloat(lslInput.element.querySelector('input').value);

        if (!paramValue) {
          alert('請選擇參數');
          return;
        }

        if (isNaN(uslValue) || isNaN(lslValue)) {
          alert('請輸入有效的規格上下限');
          return;
        }

        performCapabilityAnalysis(spcData, paramValue, uslValue, lslValue);
      }
    });
    calculateBtnContainer.appendChild(calculateBtn.render());

    // 執行製程能力分析
    function performCapabilityAnalysis(data, parameter, usl, lsl) {
      // 提取該參數的所有測量值
      const values = data
        .map(d => d.measurements[parameter])
        .filter(v => v !== null && v !== undefined && !isNaN(v));

      if (values.length === 0) {
        alert('沒有足夠的數據進行分析');
        return;
      }

      // 計算製程能力
      const analysis = calculateProcessCapability(values, usl, lsl);

      if (!analysis.valid) {
        alert(analysis.error);
        return;
      }

      // 顯示結果
      renderCapabilityResults(analysis, parameter);
    }

    // 渲染分析結果
    function renderCapabilityResults(analysis, parameter) {
      const resultsContainer = section.querySelector('#capability-results');
      const { spec, statistics, shortTerm, longTerm, shift, outOfSpec } = analysis;

      const recommendations = getCapabilityRecommendations(analysis);

      resultsContainer.innerHTML = `
        <div class="capability-header">
          <h4>📊 ${parameter} 製程能力分析結果</h4>
        </div>

        <div class="capability-grid">
          <!-- 規格資訊 -->
          <div class="capability-card">
            <div class="card-title">📏 規格資訊</div>
            <div class="capability-info">
              <div class="info-row">
                <span class="info-label">規格上限 (USL):</span>
                <span class="info-value">${spec.usl}</span>
              </div>
              <div class="info-row">
                <span class="info-label">規格下限 (LSL):</span>
                <span class="info-value">${spec.lsl}</span>
              </div>
              <div class="info-row">
                <span class="info-label">規格中心:</span>
                <span class="info-value">${spec.target.toFixed(4)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">公差:</span>
                <span class="info-value">${spec.tolerance.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <!-- 基本統計 -->
          <div class="capability-card">
            <div class="card-title">📈 基本統計</div>
            <div class="capability-info">
              <div class="info-row">
                <span class="info-label">樣本數 (n):</span>
                <span class="info-value">${statistics.n}</span>
              </div>
              <div class="info-row">
                <span class="info-label">平均值 (μ):</span>
                <span class="info-value">${statistics.mean}</span>
              </div>
              <div class="info-row">
                <span class="info-label">標準差 (σ):</span>
                <span class="info-value">${statistics.stdDev}</span>
              </div>
              <div class="info-row">
                <span class="info-label">範圍:</span>
                <span class="info-value">${statistics.min} ~ ${statistics.max}</span>
              </div>
            </div>
          </div>

          <!-- 短期製程能力 -->
          <div class="capability-card ${shortTerm.cpk !== null && shortTerm.cpk < 1.33 ? 'card-warning' : ''}">
            <div class="card-title">⚡ 短期製程能力 (Within)</div>
            <div class="capability-info">
              ${shortTerm.cp !== null ? `
                <div class="info-row highlight">
                  <span class="info-label">Cp:</span>
                  <span class="info-value">
                    ${shortTerm.cp}
                    <span class="capability-badge badge-${shortTerm.cpLevel.color}">
                      ${shortTerm.cpLevel.level} - ${shortTerm.cpLevel.label}
                    </span>
                  </span>
                </div>
                <div class="info-row highlight">
                  <span class="info-label">Cpk:</span>
                  <span class="info-value">
                    ${shortTerm.cpk}
                    <span class="capability-badge badge-${shortTerm.cpkLevel.color}">
                      ${shortTerm.cpkLevel.level} - ${shortTerm.cpkLevel.label}
                    </span>
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">Cpu:</span>
                  <span class="info-value">${shortTerm.cpkUpper}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Cpl:</span>
                  <span class="info-value">${shortTerm.cpkLower}</span>
                </div>
              ` : `
                <div class="info-row">
                  <span class="info-label text-tertiary">數據不足</span>
                  <span class="info-value text-tertiary">需要至少 5 個數據點</span>
                </div>
              `}
            </div>
          </div>

          <!-- 長期製程能力 -->
          <div class="capability-card ${longTerm.ppk < 1.33 ? 'card-warning' : ''}">
            <div class="card-title">🔄 長期製程能力 (Overall)</div>
            <div class="capability-info">
              <div class="info-row highlight">
                <span class="info-label">Pp:</span>
                <span class="info-value">
                  ${longTerm.pp}
                  <span class="capability-badge badge-${longTerm.ppLevel.color}">
                    ${longTerm.ppLevel.level} - ${longTerm.ppLevel.label}
                  </span>
                </span>
              </div>
              <div class="info-row highlight">
                <span class="info-label">Ppk:</span>
                <span class="info-value">
                  ${longTerm.ppk}
                  <span class="capability-badge badge-${longTerm.ppkLevel.color}">
                    ${longTerm.ppkLevel.level} - ${longTerm.ppkLevel.label}
                  </span>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Ppu:</span>
                <span class="info-value">${longTerm.ppkUpper}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Ppl:</span>
                <span class="info-value">${longTerm.ppkLower}</span>
              </div>
            </div>
          </div>

          <!-- 製程偏移 -->
          <div class="capability-card ${Math.abs(shift.percentage) > 10 ? 'card-alert' : ''}">
            <div class="card-title">📍 製程偏移</div>
            <div class="capability-info">
              <div class="info-row">
                <span class="info-label">偏移量:</span>
                <span class="info-value">${shift.value}</span>
              </div>
              <div class="info-row highlight">
                <span class="info-label">偏移比例:</span>
                <span class="info-value ${Math.abs(shift.percentage) > 10 ? 'text-error' : 'text-success'}">
                  ${shift.percentage > 0 ? '+' : ''}${shift.percentage}%
                </span>
              </div>
            </div>
          </div>

          <!-- 超規格統計 -->
          <div class="capability-card ${outOfSpec.total > 0 ? 'card-alert' : ''}">
            <div class="card-title">🚨 超規格統計</div>
            <div class="capability-info">
              <div class="info-row">
                <span class="info-label">超上限:</span>
                <span class="info-value ${outOfSpec.aboveUSL > 0 ? 'text-error' : ''}">
                  ${outOfSpec.aboveUSL} 個
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">超下限:</span>
                <span class="info-value ${outOfSpec.belowLSL > 0 ? 'text-error' : ''}">
                  ${outOfSpec.belowLSL} 個
                </span>
              </div>
              <div class="info-row highlight">
                <span class="info-label">總計:</span>
                <span class="info-value ${outOfSpec.total > 0 ? 'text-error' : 'text-success'}">
                  ${outOfSpec.total} 個 (${outOfSpec.percentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 建議事項 -->
        <div class="capability-recommendations">
          <h5>💡 改善建議</h5>
          <ul>
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      `;

      resultsContainer.style.display = 'block';
    }

    return section;
  }

  /**
   * 建立數據表格區域
   */
  function createDataTableSection(spcData) {
    const section = document.createElement('div');
    section.className = 'data-table-section';

    const recentData = spcData.slice(-20).reverse(); // 最近 20 筆

    let tableRows = '';
    recentData.forEach(data => {
      const statusBadge = getStatusBadge(data.status);
      const timestamp = new Date(data.timestamp).toLocaleString('zh-TW');

      const measurementsStr = Object.entries(data.measurements)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');

      tableRows += `
        <tr>
          <td>${data.batchNo}</td>
          <td class="text-sm">${timestamp}</td>
          <td class="text-sm">${measurementsStr}</td>
          <td>${statusBadge}</td>
          <td>${data.operator}</td>
          <td class="table-actions">
            <button class="btn-sm btn-outline" onclick="window.editSPCData('${data.id}')">編輯</button>
            <button class="btn-sm btn-danger" onclick="window.deleteSPCData('${data.id}')">刪除</button>
          </td>
        </tr>
      `;
    });

    section.innerHTML = `
      <h3>📝 最近數據記錄</h3>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>批號</th>
              <th>時間</th>
              <th>測量值</th>
              <th>狀態</th>
              <th>操作員</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="6" class="text-center text-secondary">無數據</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

    return section;
  }

  /**
   * 取得狀態徽章 HTML
   */
  function getStatusBadge(status) {
    const badges = {
      normal: '<span class="badge badge-success">正常</span>',
      warning: '<span class="badge badge-warning">警告</span>',
      alert: '<span class="badge badge-danger">超限</span>'
    };
    return badges[status] || badges.normal;
  }

  /**
   * 清空顯示
   */
  function clearDisplay() {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>選擇配方以開始分析</h3>
        <p>請從上方下拉選單選擇要分析的配方</p>
      </div>
    `;

    if (currentChart) {
      currentChart.destroy();
      currentChart = null;
    }
  }

  /**
   * 顯示數據來源設定Modal
   */
  function showDataSourceConfig() {
    const modal = new Modal({
      title: '數據來源設定',
      content: createDataSourceConfigContent()
    });

    modal.open();
  }

  /**
   * 建立數據來源設定內容
   */
  function createDataSourceConfigContent() {
    const config = SPCDataSource.getConfig();

    const div = document.createElement('div');
    div.className = 'datasource-config';

    div.innerHTML = `
      <div class="config-section">
        <h4>選擇數據來源</h4>
        <select id="active-source" class="form-select">
          <option value="${DataSourceType.MANUAL}" ${config.activeSource === DataSourceType.MANUAL ? 'selected' : ''}>手動輸入</option>
          <option value="${DataSourceType.FILE_IMPORT}" ${config.activeSource === DataSourceType.FILE_IMPORT ? 'selected' : ''}>檔案匯入 (CSV/JSON)</option>
          <option value="${DataSourceType.API}" ${config.activeSource === DataSourceType.API ? 'selected' : ''}>RESTful API</option>
          <option value="${DataSourceType.ADVANTECH_ECU}" ${config.activeSource === DataSourceType.ADVANTECH_ECU ? 'selected' : ''}>研華 ECU</option>
          <option value="${DataSourceType.DATA_PLATFORM}" ${config.activeSource === DataSourceType.DATA_PLATFORM ? 'selected' : ''}>數據中台</option>
          <option value="${DataSourceType.WEBHOOK}" ${config.activeSource === DataSourceType.WEBHOOK ? 'selected' : ''}>Webhook</option>
        </select>
      </div>

      <div id="config-details" class="config-details">
        <!-- 根據選擇的數據源動態顯示配置表單 -->
      </div>
    `;

    const detailsContainer = div.querySelector('#config-details');
    const sourceSelect = div.querySelector('#active-source');

    // 渲染初始配置
    renderSourceConfig(config.activeSource, detailsContainer, config);

    // 監聽數據源切換
    sourceSelect.addEventListener('change', (e) => {
      renderSourceConfig(e.target.value, detailsContainer, config);
    });

    // 建立操作按鈕區域
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.style.marginTop = 'var(--spacing-lg)';
    footer.style.display = 'flex';
    footer.style.gap = 'var(--spacing-sm)';
    footer.style.justifyContent = 'flex-end';

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal-overlay')?.remove()
    });

    const saveBtn = new Button({
      text: '儲存',
      variant: 'primary',
      onClick: () => {
        const activeSource = sourceSelect.value;
        const newConfig = { ...config, activeSource };

        // 根據數據源類型保存配置
        if (activeSource === DataSourceType.API) {
          newConfig.sources.api = {
            enabled: true,
            endpoint: div.querySelector('#api-endpoint')?.value || '',
            apiKey: div.querySelector('#api-key')?.value || '',
            pollInterval: parseInt(div.querySelector('#poll-interval')?.value) || 60000
          };
        } else if (activeSource === DataSourceType.ADVANTECH_ECU) {
          newConfig.sources.advantech_ecu = {
            enabled: true,
            ecuUrl: div.querySelector('#ecu-url')?.value || '',
            ecuApiKey: div.querySelector('#ecu-api-key')?.value || '',
            pollInterval: parseInt(div.querySelector('#ecu-poll-interval')?.value) || 30000
          };
        } else if (activeSource === DataSourceType.DATA_PLATFORM) {
          newConfig.sources.data_platform = {
            enabled: true,
            platformUrl: div.querySelector('#platform-url')?.value || '',
            apiKey: div.querySelector('#platform-api-key')?.value || '',
            datasetId: div.querySelector('#dataset-id')?.value || '',
            pollInterval: parseInt(div.querySelector('#platform-poll-interval')?.value) || 60000
          };
        }

        SPCDataSource.saveConfig(newConfig);
        alert('數據來源設定已儲存');
        document.querySelector('.modal-overlay')?.remove();
      }
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(saveBtn.render());
    div.appendChild(footer);

    return div;
  }

  /**
   * 根據數據源類型渲染配置表單
   */
  function renderSourceConfig(sourceType, container, config) {
    let html = '';

    switch (sourceType) {
      case DataSourceType.MANUAL:
        html = `
          <div class="config-info">
            <p class="text-secondary">
              <strong>手動輸入模式</strong><br>
              使用「新增數據」按鈕手動輸入 SPC 數據點。適合小量數據或測試環境。
            </p>
          </div>
        `;
        break;

      case DataSourceType.FILE_IMPORT:
        html = `
          <div class="config-info">
            <p class="text-secondary">
              <strong>檔案匯入模式</strong><br>
              支援 CSV 和 JSON 格式的批次數據匯入。
            </p>
            <button class="btn-primary" id="import-file-btn" style="margin-top: 12px;">
              📁 選擇檔案並匯入
            </button>
            <input type="file" id="file-input" accept=".csv,.json" style="display: none;">
          </div>
        `;
        break;

      case DataSourceType.API:
        const apiConfig = config.sources.api || {};
        html = `
          <div class="config-form">
            <div class="form-group">
              <label>API 端點 *</label>
              <input type="text" id="api-endpoint" class="form-input"
                     placeholder="https://api.example.com/spc/data"
                     value="${apiConfig.endpoint || ''}">
            </div>
            <div class="form-group">
              <label>API 金鑰</label>
              <input type="password" id="api-key" class="form-input"
                     placeholder="您的 API Key"
                     value="${apiConfig.apiKey || ''}">
            </div>
            <div class="form-group">
              <label>輪詢間隔（毫秒）</label>
              <input type="number" id="poll-interval" class="form-input"
                     placeholder="60000"
                     value="${apiConfig.pollInterval || 60000}">
              <small class="text-secondary">建議: 60000ms (1分鐘)</small>
            </div>
          </div>
        `;
        break;

      case DataSourceType.ADVANTECH_ECU:
        const ecuConfig = config.sources.advantech_ecu || {};
        html = `
          <div class="config-form">
            <div class="form-group">
              <label>研華 ECU URL *</label>
              <input type="text" id="ecu-url" class="form-input"
                     placeholder="http://192.168.1.100:8080"
                     value="${ecuConfig.ecuUrl || ''}">
            </div>
            <div class="form-group">
              <label>ECU API 金鑰</label>
              <input type="password" id="ecu-api-key" class="form-input"
                     placeholder="ECU API Key"
                     value="${ecuConfig.ecuApiKey || ''}">
            </div>
            <div class="form-group">
              <label>輪詢間隔（毫秒）</label>
              <input type="number" id="ecu-poll-interval" class="form-input"
                     placeholder="30000"
                     value="${ecuConfig.pollInterval || 30000}">
              <small class="text-secondary">建議: 30000ms (30秒)</small>
            </div>
          </div>
        `;
        break;

      case DataSourceType.DATA_PLATFORM:
        const platformConfig = config.sources.data_platform || {};
        html = `
          <div class="config-form">
            <div class="form-group">
              <label>數據中台 URL *</label>
              <input type="text" id="platform-url" class="form-input"
                     placeholder="https://data-platform.example.com"
                     value="${platformConfig.platformUrl || ''}">
            </div>
            <div class="form-group">
              <label>API 金鑰</label>
              <input type="password" id="platform-api-key" class="form-input"
                     placeholder="Platform API Key"
                     value="${platformConfig.apiKey || ''}">
            </div>
            <div class="form-group">
              <label>數據集 ID</label>
              <input type="text" id="dataset-id" class="form-input"
                     placeholder="dataset-12345"
                     value="${platformConfig.datasetId || ''}">
            </div>
            <div class="form-group">
              <label>輪詢間隔（毫秒）</label>
              <input type="number" id="platform-poll-interval" class="form-input"
                     placeholder="60000"
                     value="${platformConfig.pollInterval || 60000}">
            </div>
          </div>
        `;
        break;

      case DataSourceType.WEBHOOK:
        html = `
          <div class="config-info">
            <p class="text-secondary">
              <strong>Webhook 接收模式</strong><br>
              需要後端服務支援。當有新數據時，外部系統會主動推送到指定端點。
            </p>
            <div class="webhook-info" style="margin-top: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
              <strong>Webhook URL:</strong><br>
              <code style="color: var(--primary-color);">POST /api/spc/webhook</code>
            </div>
          </div>
        `;
        break;
    }

    container.innerHTML = html;

    // 綁定檔案匯入事件
    if (sourceType === DataSourceType.FILE_IMPORT) {
      const importBtn = container.querySelector('#import-file-btn');
      const fileInput = container.querySelector('#file-input');

      importBtn?.addEventListener('click', () => fileInput.click());
      fileInput?.addEventListener('change', handleFileImport);
    }
  }

  /**
   * 處理檔案匯入
   */
  async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const format = file.name.endsWith('.json') ? 'json' : 'csv';

      // 詢問使用者是否要覆蓋 recipeId
      const shouldOverride = selectedRecipeId && confirm(
        `是否將匯入的數據關聯到當前選擇的配方？\n\n` +
        `點擊「確定」：數據將關聯到當前配方\n` +
        `點擊「取消」：使用檔案中的 recipeId`
      );

      const result = await SPCDataSource.importFromFile(file, format, shouldOverride ? selectedRecipeId : null);

      alert(`成功匯入 ${result.count} 筆數據！`);
      document.querySelector('.modal-overlay')?.remove();

      // 如果當前有選擇配方，重新載入數據
      if (selectedRecipeId) {
        loadRecipeData(selectedRecipeId);
      }
    } catch (error) {
      alert('匯入失敗：' + error.message);
    }

    // 重置 file input
    event.target.value = '';
  }

  /**
   * 顯示新增數據Modal
   */
  function showAddDataModal() {
    if (!selectedRecipeId) {
      alert('請先選擇配方');
      return;
    }

    const modal = new Modal({
      title: '新增 SPC 數據',
      content: createAddDataForm()
    });

    modal.open();
  }

  /**
   * 建立新增數據表單
   */
  function createAddDataForm() {
    const div = document.createElement('div');
    div.className = 'add-data-form';

    const recipe = FormModel.getById(selectedRecipeId);

    div.innerHTML = `
      <div class="form-group">
        <label>批號 *</label>
        <input type="text" id="batch-no" class="form-input" placeholder="例如：B20250109001" required>
      </div>

      <div class="form-group">
        <label>測量值（JSON 格式）*</label>
        <textarea id="measurements" class="form-textarea" rows="6" placeholder='例如：{"temperature": 95.5, "pressure": 1.2}'></textarea>
        <small class="text-secondary">請輸入有效的 JSON 格式</small>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>操作員</label>
          <input type="text" id="operator" class="form-input" placeholder="操作員姓名">
        </div>

        <div class="form-group">
          <label>班別</label>
          <select id="shift" class="form-select">
            <option value="">--</option>
            <option value="A班">A班</option>
            <option value="B班">B班</option>
            <option value="C班">C班</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>備註</label>
        <textarea id="notes" class="form-textarea" rows="2"></textarea>
      </div>
    `;

    // 建立操作按鈕區域
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.style.marginTop = 'var(--spacing-lg)';
    footer.style.display = 'flex';
    footer.style.gap = 'var(--spacing-sm)';
    footer.style.justifyContent = 'flex-end';

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal-overlay')?.remove()
    });

    const submitBtn = new Button({
      text: '新增',
      variant: 'primary',
      onClick: () => {
        try {
          const batchNo = div.querySelector('#batch-no').value.trim();
          const measurementsStr = div.querySelector('#measurements').value.trim();
          const operator = div.querySelector('#operator').value.trim();
          const shift = div.querySelector('#shift').value;
          const notes = div.querySelector('#notes').value.trim();

          if (!batchNo) {
            alert('請輸入批號');
            return;
          }

          if (!measurementsStr) {
            alert('請輸入測量值');
            return;
          }

          const measurements = JSON.parse(measurementsStr);

          const newData = SPCDataSource.manualInput({
            recipeId: selectedRecipeId,
            batchNo,
            measurements,
            operator,
            shift,
            notes
          });

          alert('數據已新增！');
          document.querySelector('.modal-overlay')?.remove();

          // 重新載入數據
          loadRecipeData(selectedRecipeId);
        } catch (error) {
          alert('新增失敗：' + error.message);
        }
      }
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(submitBtn.render());
    div.appendChild(footer);

    return div;
  }

  // 建立編輯數據表單
  function createEditDataForm(data) {
    const div = document.createElement('div');
    div.className = 'add-data-form';

    div.innerHTML = `
      <div class="form-group">
        <label>批號 *</label>
        <input type="text" id="edit-batch-no" class="form-input" value="${data.batchNo || ''}" required>
      </div>

      <div class="form-group">
        <label>測量值（JSON 格式）*</label>
        <textarea id="edit-measurements" class="form-textarea" rows="6">${JSON.stringify(data.measurements, null, 2)}</textarea>
        <small class="text-secondary">請輸入有效的 JSON 格式</small>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>操作員</label>
          <input type="text" id="edit-operator" class="form-input" value="${data.operator || ''}">
        </div>

        <div class="form-group">
          <label>班別</label>
          <select id="edit-shift" class="form-select">
            <option value="">--</option>
            <option value="A班" ${data.shift === 'A班' ? 'selected' : ''}>A班</option>
            <option value="B班" ${data.shift === 'B班' ? 'selected' : ''}>B班</option>
            <option value="C班" ${data.shift === 'C班' ? 'selected' : ''}>C班</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>備註</label>
        <textarea id="edit-notes" class="form-textarea" rows="2">${data.notes || ''}</textarea>
      </div>
    `;

    // 建立操作按鈕區域
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.style.marginTop = 'var(--spacing-lg)';
    footer.style.display = 'flex';
    footer.style.gap = 'var(--spacing-sm)';
    footer.style.justifyContent = 'flex-end';

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal-overlay')?.remove()
    });

    const updateBtn = new Button({
      text: '更新',
      variant: 'primary',
      onClick: () => {
        try {
          const batchNo = div.querySelector('#edit-batch-no').value.trim();
          const measurementsStr = div.querySelector('#edit-measurements').value.trim();
          const operator = div.querySelector('#edit-operator').value.trim();
          const shift = div.querySelector('#edit-shift').value;
          const notes = div.querySelector('#edit-notes').value.trim();

          if (!batchNo) {
            alert('請輸入批號');
            return;
          }

          if (!measurementsStr) {
            alert('請輸入測量值');
            return;
          }

          const measurements = JSON.parse(measurementsStr);

          SPCModel.update(data.id, {
            batchNo,
            measurements,
            operator,
            shift,
            notes
          });

          alert('數據已更新！');
          document.querySelector('.modal-overlay')?.remove();

          // 重新載入數據
          if (selectedRecipeId) {
            loadRecipeData(selectedRecipeId);
          }
        } catch (error) {
          alert('更新失敗：' + error.message);
        }
      }
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(updateBtn.render());
    div.appendChild(footer);

    return div;
  }

  // 全域函數（用於表格操作）
  window.editSPCData = function(id) {
    const data = SPCModel.getById(id);
    if (!data) {
      alert('找不到數據');
      return;
    }

    const modal = new Modal({
      title: `編輯 SPC 數據 - ${data.batchNo}`,
      content: createEditDataForm(data)
    });

    modal.open();
  };

  window.deleteSPCData = function(id) {
    if (confirm('確定要刪除此筆數據嗎？')) {
      SPCModel.delete(id);
      alert('已刪除');
      if (selectedRecipeId) {
        loadRecipeData(selectedRecipeId);
      }
    }
  };

  addStyles();
  return container;
}

function addStyles() {
  if (!document.getElementById('spc-page-styles')) {
    const style = document.createElement('style');
    style.id = 'spc-page-styles';
    style.textContent = `
      .spc-page {
        padding: var(--spacing-xl);
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-xl);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      .selection-bar {
        margin-bottom: var(--spacing-xl);
        padding: var(--spacing-lg);
        background: var(--bg-secondary);
        border-radius: var(--radius-lg);
      }

      .spc-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
      }

      .stats-section h3,
      .chart-section h3,
      .capability-section h3,
      .data-table-section h3 {
        font-size: 1.25rem;
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--spacing-md);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
      }

      .stat-card.stat-alert {
        border-color: var(--error-color);
        background: rgba(239, 68, 68, 0.05);
      }

      .stat-card.stat-warning {
        border-color: var(--warning-color);
        background: rgba(251, 191, 36, 0.05);
      }

      .stat-icon {
        font-size: 2rem;
      }

      .stat-content {
        flex: 1;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .chart-section {
        padding: var(--spacing-lg);
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
      }

      .chart-controls {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: var(--spacing-lg);
      }

      .chart-container {
        position: relative;
        height: 400px;
        margin-top: var(--spacing-md);
      }

      .capability-section {
        padding: var(--spacing-lg);
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
      }

      .capability-setup {
        margin-bottom: var(--spacing-lg);
      }

      .setup-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr auto;
        gap: var(--spacing-md);
        align-items: flex-end;
      }

      .capability-results {
        margin-top: var(--spacing-xl);
      }

      .capability-header {
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 2px solid var(--border-color);
      }

      .capability-header h4 {
        margin: 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }

      .capability-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
      }

      .capability-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        transition: all 0.2s;
      }

      .capability-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .capability-card.card-warning {
        border-color: var(--warning-color);
        background: rgba(251, 191, 36, 0.05);
      }

      .capability-card.card-alert {
        border-color: var(--error-color);
        background: rgba(239, 68, 68, 0.05);
      }

      .capability-card .card-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-sm);
        border-bottom: 1px solid var(--border-color);
      }

      .capability-info {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-xs) 0;
      }

      .info-row.highlight {
        background: var(--bg-color);
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        margin: var(--spacing-xs) 0;
      }

      .info-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .info-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
      }

      .capability-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .badge-green {
        background: rgba(34, 197, 94, 0.1);
        color: rgb(22, 163, 74);
      }

      .badge-blue {
        background: rgba(59, 130, 246, 0.1);
        color: rgb(37, 99, 235);
      }

      .badge-yellow {
        background: rgba(251, 191, 36, 0.1);
        color: rgb(202, 138, 4);
      }

      .badge-orange {
        background: rgba(249, 115, 22, 0.1);
        color: rgb(234, 88, 12);
      }

      .badge-red {
        background: rgba(239, 68, 68, 0.1);
        color: rgb(220, 38, 38);
      }

      .badge-gray {
        background: rgba(156, 163, 175, 0.1);
        color: rgb(107, 114, 128);
      }

      .text-success {
        color: rgb(22, 163, 74);
      }

      .text-error {
        color: rgb(220, 38, 38);
      }

      .text-tertiary {
        color: var(--text-tertiary);
      }

      .capability-recommendations {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-lg);
      }

      .capability-recommendations h5 {
        margin: 0 0 var(--spacing-md) 0;
        font-size: 1rem;
        color: var(--text-primary);
      }

      .capability-recommendations ul {
        margin: 0;
        padding-left: var(--spacing-lg);
        list-style: none;
      }

      .capability-recommendations li {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .capability-recommendations li:before {
        content: '';
        display: inline-block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--primary-color);
        margin-right: var(--spacing-sm);
        vertical-align: middle;
      }

      .data-table-section {
        padding: var(--spacing-lg);
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
      }

      .data-table-section {
        padding: var(--spacing-lg);
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .badge {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .badge-success {
        background: #d1fae5;
        color: #065f46;
      }

      .badge-warning {
        background: #fef3c7;
        color: #92400e;
      }

      .badge-danger {
        background: #fee2e2;
        color: #991b1b;
      }

      .datasource-config,
      .add-data-form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .config-section {
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
      }

      .form-input,
      .form-textarea,
      .form-select {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-family: inherit;
        font-size: 1rem;
      }

      .form-textarea {
        resize: vertical;
        font-family: monospace;
      }

      .table-actions {
        display: flex;
        gap: var(--spacing-xs);
      }

      .btn-sm {
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: 0.875rem;
      }
    `;
    document.head.appendChild(style);
  }
}
