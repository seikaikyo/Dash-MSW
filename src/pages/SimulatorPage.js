import { Button } from '../components/common/Button.js';
import { dataSimulator } from '../utils/dataSimulator.js';
import { FormModel } from '../utils/dataModel.js';
import { GoldenRecipeManager, QualityFeedbackModel } from '../utils/goldenRecipeModel.js';
import { WorkOrderHelper } from '../utils/workOrderHelper.js';

export class SimulatorPage {
  constructor() {
    this.isRunning = false;
    this.results = null;
  }

  render() {
    const page = document.createElement('div');
    page.className = 'simulator-page';

    page.innerHTML = `
      <div class="simulator-header">
        <h2>🎭 資料模擬中心</h2>
        <p class="text-secondary">生成測試資料、執行壓力測試、快速建立展示環境</p>
      </div>

      <div class="simulator-stats" id="simulator-stats">
        <div class="stat-card">
          <div class="stat-label">配方數量</div>
          <div class="stat-value" id="stat-forms">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">工作流程</div>
          <div class="stat-value" id="stat-workflows">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">申請單</div>
          <div class="stat-value" id="stat-instances">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">使用者</div>
          <div class="stat-value" id="stat-users">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">部門</div>
          <div class="stat-value" id="stat-departments">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">SPC 數據</div>
          <div class="stat-value" id="stat-spc">0</div>
        </div>
      </div>

      <div class="simulator-sections">
        <!-- 快速生成 -->
        <div class="section-card">
          <h3>⚡ 快速生成</h3>
          <p>一鍵生成完整測試環境資料</p>
          <div id="quick-generate-buttons" class="button-group"></div>
        </div>

        <!-- 個別生成 -->
        <div class="section-card">
          <h3>🎯 個別生成</h3>
          <p>針對特定類型生成資料</p>
          <div id="individual-generate-buttons" class="button-group"></div>
        </div>

        <!-- 壓力測試 -->
        <div class="section-card">
          <h3>💪 壓力測試</h3>
          <p>測試系統處理大量資料的能力</p>
          <div id="stress-test-config">
            <div class="config-row">
              <label>配方數量：</label>
              <input type="number" id="stress-forms" value="100" min="10" max="1000">
            </div>
            <div class="config-row">
              <label>申請單數量：</label>
              <input type="number" id="stress-instances" value="500" min="10" max="5000">
            </div>
            <div class="config-row">
              <label>使用者數量：</label>
              <input type="number" id="stress-users" value="50" min="10" max="500">
            </div>
            <div class="config-row">
              <label>每配方 SPC 數據：</label>
              <input type="number" id="stress-spc" value="100" min="10" max="1000">
            </div>
          </div>
          <div id="stress-test-buttons" class="button-group"></div>
        </div>

        <!-- Golden Recipe 測試工具 -->
        <div class="section-card">
          <h3>🏆 Golden Recipe 測試工具</h3>
          <p>測試 Golden Recipe 評分與認證邏輯</p>
          <div id="golden-test-buttons" class="button-group"></div>
          <div id="golden-test-result"></div>
        </div>

        <!-- 清除資料 -->
        <div class="section-card danger">
          <h3>🗑️ 清除資料</h3>
          <p>清除所有模擬生成的資料</p>
          <div id="clear-buttons" class="button-group"></div>
        </div>
      </div>

      <div id="result-container"></div>

      <style>
        .simulator-page {
          padding: 20px;
        }

        .simulator-header {
          margin-bottom: 24px;
        }

        .simulator-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
        }

        .simulator-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .stat-label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #3b82f6;
        }

        .simulator-sections {
          display: grid;
          gap: 20px;
        }

        .section-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .section-card.danger {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .section-card h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .section-card p {
          margin: 0 0 16px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .button-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .config-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .config-row label {
          min-width: 140px;
          font-size: 14px;
          font-weight: 500;
        }

        .config-row input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        #stress-test-config {
          margin-bottom: 16px;
        }

        .progress-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .progress-content {
          background: white;
          padding: 32px;
          border-radius: 12px;
          text-align: center;
          min-width: 300px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .result-summary {
          background: #f0fdf4;
          border: 1px solid #10b981;
          border-radius: 8px;
          padding: 20px;
          margin-top: 24px;
        }

        .result-summary h3 {
          margin: 0 0 16px 0;
          color: #065f46;
        }

        .result-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
        }

        .result-label {
          font-weight: 500;
          color: #374151;
        }

        .result-value {
          font-weight: 700;
          color: #10b981;
        }

        .error-summary {
          background: #fef2f2;
          border: 1px solid #ef4444;
          border-radius: 8px;
          padding: 20px;
          margin-top: 24px;
        }

        .error-summary h3 {
          margin: 0 0 16px 0;
          color: #991b1b;
        }

        .error-item {
          padding: 8px 12px;
          background: white;
          border-radius: 6px;
          margin-bottom: 8px;
          color: #dc2626;
          font-family: monospace;
          font-size: 13px;
        }
      </style>
    `;

    this.renderButtons(page);

    // 延遲更新統計，等待 DOM 插入
    setTimeout(() => this.updateStats(), 0);

    return page;
  }

  renderButtons(page) {
    // 快速生成按鈕
    const quickContainer = page.querySelector('#quick-generate-buttons');
    const quickBtn = new Button({
      text: '🚀 生成完整測試環境',
      variant: 'primary',
      onClick: () => this.generateCompleteEnvironment()
    });
    quickContainer.appendChild(quickBtn.render());

    // 個別生成按鈕
    const individualContainer = page.querySelector('#individual-generate-buttons');

    const deptBtn = new Button({
      text: '🏢 生成部門 (8個)',
      variant: 'outline',
      onClick: () => this.generateDepartments()
    });

    const usersBtn = new Button({
      text: '👥 生成使用者 (20位)',
      variant: 'outline',
      onClick: () => this.generateUsers()
    });

    const formsBtn = new Button({
      text: '📝 生成配方 (15個)',
      variant: 'outline',
      onClick: () => this.generateForms()
    });

    const workflowsBtn = new Button({
      text: '🔄 生成流程 (10個)',
      variant: 'outline',
      onClick: () => this.generateWorkflows()
    });

    const instancesBtn = new Button({
      text: '📋 生成申請單 (30個)',
      variant: 'outline',
      onClick: () => this.generateInstances()
    });

    const spcBtn = new Button({
      text: '📊 生成SPC數據',
      variant: 'outline',
      onClick: () => this.generateSPCData()
    });

    const qualityDataBtn = new Button({
      text: '🏭 生成生產品質數據',
      variant: 'outline',
      onClick: () => this.generateProductionQualityData()
    });

    individualContainer.appendChild(deptBtn.render());
    individualContainer.appendChild(usersBtn.render());
    individualContainer.appendChild(formsBtn.render());
    individualContainer.appendChild(workflowsBtn.render());
    individualContainer.appendChild(instancesBtn.render());
    individualContainer.appendChild(spcBtn.render());
    individualContainer.appendChild(qualityDataBtn.render());

    // Golden Recipe 測試按鈕
    const goldenTestContainer = page.querySelector('#golden-test-buttons');

    const goldenQuickTestBtn = new Button({
      text: '⚡ 快速測試',
      variant: 'primary',
      onClick: () => this.runGoldenQuickTest()
    });

    const goldenDebugScoreBtn = new Button({
      text: '🔍 分析評分',
      variant: 'outline',
      onClick: () => this.debugGoldenScores()
    });

    const goldenCandidatesBtn = new Button({
      text: '🎯 檢查候選',
      variant: 'outline',
      onClick: () => this.checkGoldenCandidates()
    });

    const goldenCertifiedBtn = new Button({
      text: '🏆 檢查已認證',
      variant: 'outline',
      onClick: () => this.checkCertifiedGolden()
    });

    goldenTestContainer.appendChild(goldenQuickTestBtn.render());
    goldenTestContainer.appendChild(goldenDebugScoreBtn.render());
    goldenTestContainer.appendChild(goldenCandidatesBtn.render());
    goldenTestContainer.appendChild(goldenCertifiedBtn.render());

    // 壓力測試按鈕
    const stressContainer = page.querySelector('#stress-test-buttons');
    const stressBtn = new Button({
      text: '💪 開始壓力測試',
      variant: 'primary',
      onClick: () => this.runStressTest()
    });
    stressContainer.appendChild(stressBtn.render());

    // 清除按鈕
    const clearContainer = page.querySelector('#clear-buttons');
    const clearBtn = new Button({
      text: '🗑️ 清除所有資料',
      variant: 'danger',
      onClick: () => this.clearAllData()
    });
    clearContainer.appendChild(clearBtn.render());
  }

  showProgress(message) {
    const overlay = document.createElement('div');
    overlay.className = 'progress-overlay';
    overlay.innerHTML = `
      <div class="progress-content">
        <div class="spinner"></div>
        <div>${message}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  hideProgress(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  updateStats() {
    const stats = dataSimulator.getStatistics();

    const formEl = document.getElementById('stat-forms');
    const workflowEl = document.getElementById('stat-workflows');
    const instanceEl = document.getElementById('stat-instances');
    const userEl = document.getElementById('stat-users');
    const deptEl = document.getElementById('stat-departments');
    const spcEl = document.getElementById('stat-spc');

    if (formEl) formEl.textContent = stats.forms;
    if (workflowEl) workflowEl.textContent = stats.workflows;
    if (instanceEl) instanceEl.textContent = stats.instances;
    if (userEl) userEl.textContent = stats.users;
    if (deptEl) deptEl.textContent = stats.departments;
    if (spcEl) spcEl.textContent = stats.spcData;
  }

  showResult(result, duration = 0) {
    const container = document.getElementById('result-container');

    if (result.errors && result.errors.length > 0) {
      container.innerHTML = `
        <div class="error-summary">
          <h3>❌ 執行失敗</h3>
          ${result.errors.map(err => `<div class="error-item">${err}</div>`).join('')}
        </div>
      `;
    } else {
      const resultKeys = Object.keys(result).filter(k => k !== 'errors');
      container.innerHTML = `
        <div class="result-summary">
          <h3>✅ 執行成功 ${duration ? `(${duration}ms)` : ''}</h3>
          <div class="result-grid">
            ${resultKeys.map(key => `
              <div class="result-item">
                <span class="result-label">${this.getLabel(key)}</span>
                <span class="result-value">${result[key]}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    this.updateStats();
  }

  getLabel(key) {
    const labels = {
      departments: '部門',
      users: '使用者',
      forms: '配方',
      workflows: '工作流程',
      instances: '申請單',
      spcData: 'SPC 數據',
      goldenRecipes: 'Golden Recipe',
      qualityFeedbacks: '品質回饋數據',
      superhighQuality: '超高品質配方',
      highQuality: '高品質配方',
      mediumQuality: '中等品質配方',
      lowQuality: '低品質配方',
      stationsAssigned: '分配到站點的工單',
      energyRecords: '能源記錄',
      pallets: 'Pallet 數量',
      duration: '執行時間 (ms)'
    };
    return labels[key] || key;
  }

  async generateCompleteEnvironment() {
    const progress = this.showProgress('正在生成完整測試環境...');

    try {
      const result = await dataSimulator.generateCompleteEnvironment();
      this.hideProgress(progress);
      this.showResult(result);
      alert('完整測試環境生成成功！');
    } catch (error) {
      this.hideProgress(progress);
      this.showResult({ errors: [error.message] });
      alert(`生成失敗：${error.message}`);
    }
  }

  async generateDepartments() {
    const progress = this.showProgress('正在生成部門資料...');

    try {
      const result = dataSimulator.generateDepartments(8);
      this.hideProgress(progress);
      this.showResult({ departments: result.length });
      alert(`成功生成 ${result.length} 個部門！`);
    } catch (error) {
      this.hideProgress(progress);
      alert(`生成失敗：${error.message}`);
    }
  }

  async generateUsers() {
    const progress = this.showProgress('正在生成使用者資料...');

    try {
      const result = dataSimulator.generateUsers(20);
      this.hideProgress(progress);
      this.showResult({ users: result.length });
      alert(`成功生成 ${result.length} 位使用者！`);
    } catch (error) {
      this.hideProgress(progress);
      alert(`生成失敗：${error.message}`);
    }
  }

  async generateForms() {
    const progress = this.showProgress('正在生成配方資料...');

    try {
      const result = dataSimulator.generateForms(15);
      this.hideProgress(progress);
      this.showResult({ forms: result.length });
      alert(`成功生成 ${result.length} 個配方！`);
    } catch (error) {
      this.hideProgress(progress);
      alert(`生成失敗：${error.message}`);
    }
  }

  async generateWorkflows() {
    const progress = this.showProgress('正在生成工作流程...');

    try {
      const result = dataSimulator.generateWorkflows(10);
      this.hideProgress(progress);
      this.showResult({ workflows: result.length });
      alert(`成功生成 ${result.length} 個工作流程！`);
    } catch (error) {
      this.hideProgress(progress);
      alert(`生成失敗：${error.message}`);
    }
  }

  async generateInstances() {
    const progress = this.showProgress('正在生成申請單...');

    try {
      const result = dataSimulator.generateInstances(30);
      this.hideProgress(progress);
      this.showResult({ instances: result.length });
      alert(`成功生成 ${result.length} 個申請單！`);
    } catch (error) {
      this.hideProgress(progress);
      alert(`生成失敗：${error.message}`);
    }
  }

  async generateSPCData() {
    const progress = this.showProgress('正在生成 SPC 數據...');

    try {
      const forms = dataSimulator.generatedData.forms;
      if (forms.length === 0) {
        alert('請先生成配方資料！');
        this.hideProgress(progress);
        return;
      }

      const result = dataSimulator.generateSPCData(forms[0].id, 50);
      this.hideProgress(progress);
      this.showResult({ spcData: result.length });
      alert(`成功為配方 ${forms[0].name} 生成 ${result.length} 筆 SPC 數據！`);
    } catch (error) {
      this.hideProgress(progress);
      alert(`生成失敗：${error.message}`);
    }
  }

  async generateProductionQualityData() {
    const progress = this.showProgress('正在生成生產品質數據...');

    try {
      const forms = dataSimulator.generatedData.forms;
      if (forms.length === 0) {
        alert('請先生成配方資料！');
        this.hideProgress(progress);
        return;
      }

      // 讓用戶選擇品質分佈（預設值已優化以適應 LocalStorage 限制）
      const highCount = parseInt(prompt('高品質配方數量（將符合 Golden Recipe 標準）:', '1') || '1');
      const mediumCount = parseInt(prompt('中等品質配方數量:', '2') || '2');
      const lowCount = parseInt(prompt('低品質配方數量:', '1') || '1');
      const minBatches = parseInt(prompt('最小批次數量（建議25以上符合認證條件）:', '25') || '25');
      const maxBatches = parseInt(prompt('最大批次數量（建議與最小值相同以控制空間）:', '25') || '25');

      const result = dataSimulator.generateProductionQualityData({
        highQualityCount: highCount,
        mediumQualityCount: mediumCount,
        lowQualityCount: lowCount,
        minBatches: minBatches,
        maxBatches: maxBatches
      });

      this.hideProgress(progress);
      this.showResult({
        qualityFeedbacks: result.totalFeedbacks,
        highQuality: result.highQualityRecipes,
        mediumQuality: result.mediumQualityRecipes,
        lowQuality: result.lowQualityRecipes
      });

      alert(`生產品質數據生成成功！\n` +
            `總共生成 ${result.totalFeedbacks} 筆品質回饋數據\n` +
            `高品質配方: ${result.highQualityRecipes} 個\n` +
            `中等品質配方: ${result.mediumQualityRecipes} 個\n` +
            `低品質配方: ${result.lowQualityRecipes} 個\n\n` +
            `💡 提示：請到 Golden Recipe 頁面執行「掃描並評分所有配方」以自動篩選候選配方`);
    } catch (error) {
      this.hideProgress(progress);
      alert(`生成失敗：${error.message}`);
    }
  }

  async runStressTest() {
    const forms = parseInt(document.getElementById('stress-forms').value);
    const instances = parseInt(document.getElementById('stress-instances').value);
    const users = parseInt(document.getElementById('stress-users').value);
    const spcDataPerRecipe = parseInt(document.getElementById('stress-spc').value);

    if (!confirm(`確定要生成大量資料嗎？\n配方: ${forms}\n申請單: ${instances}\n使用者: ${users}\nSPC數據/配方: ${spcDataPerRecipe}`)) {
      return;
    }

    const progress = this.showProgress('正在執行壓力測試...');

    try {
      const result = await dataSimulator.stressTest({
        forms,
        instances,
        users,
        spcDataPerRecipe
      });

      this.hideProgress(progress);
      this.showResult(result, result.duration);

      if (result.errors.length === 0) {
        alert(`壓力測試完成！\n耗時: ${result.duration}ms\n配方: ${result.forms}\n申請單: ${result.instances}\nSPC數據: ${result.spcData}`);
      } else {
        alert(`壓力測試失敗：${result.errors.join(', ')}`);
      }
    } catch (error) {
      this.hideProgress(progress);
      alert(`壓力測試錯誤：${error.message}`);
    }
  }

  clearAllData() {
    if (!confirm('確定要清除所有模擬資料嗎？此操作無法復原！')) {
      return;
    }

    try {
      dataSimulator.clearAllSimulatedData();
      this.updateStats();
      document.getElementById('result-container').innerHTML = '';
      alert('所有資料已清除！');
    } catch (error) {
      alert(`清除失敗：${error.message}`);
    }
  }

  // Golden Recipe 測試工具方法
  async runGoldenQuickTest() {
    const resultDiv = document.getElementById('golden-test-result');
    resultDiv.innerHTML = '<p style="color: #6b7280;">執行中...</p>';

    try {
      // 步驟 1: 清除
      dataSimulator.clearAllSimulatedData();

      // 步驟 2: 生成配方
      const recipes = dataSimulator.generateForms(4);

      // 步驟 3: 生成品質數據
      const qualityResult = dataSimulator.generateProductionQualityData({
        superhighQualityCount: 1,
        highQualityCount: 2,
        mediumQualityCount: 0,
        lowQualityCount: 1,
        minBatches: 25,
        maxBatches: 25
      });

      // 步驟 4: 檢查評分
      const allRecipes = FormModel.getAll();
      const scoredRecipes = allRecipes.filter(r => r.goldenScore !== undefined);

      // 步驟 5: 檢查候選
      const candidates = GoldenRecipeManager.getGoldenCandidates();

      // 步驟 6: 檢查自動認證
      const goldenRecipes = GoldenRecipeManager.getAllGoldenRecipes();

      resultDiv.innerHTML = `
        <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-top: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #065f46;">✅ 快速測試完成</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 14px;">
            <div><strong>配方總數:</strong> ${recipes.length}</div>
            <div><strong>品質數據:</strong> ${qualityResult.totalFeedbacks} 筆</div>
            <div><strong>超高品質:</strong> ${qualityResult.superhighQualityRecipes} 個（自動認證）</div>
            <div><strong>高品質:</strong> ${qualityResult.highQualityRecipes} 個（候選）</div>
            <div><strong>已評分:</strong> ${scoredRecipes.length} 個</div>
            <div><strong>Golden 候選:</strong> ${candidates.length} 個</div>
            <div><strong>Golden 認證:</strong> ${goldenRecipes.length} 個</div>
          </div>
        </div>
      `;

      this.updateStats();
      alert('Golden Recipe 快速測試完成！');
    } catch (error) {
      resultDiv.innerHTML = `<div style="color: #dc2626; margin-top: 16px;">❌ 測試失敗: ${error.message}</div>`;
      alert(`測試失敗：${error.message}`);
    }
  }

  async debugGoldenScores() {
    const resultDiv = document.getElementById('golden-test-result');

    try {
      const allRecipes = FormModel.getAll();
      const scoredRecipes = allRecipes
        .filter(r => r.goldenScore !== undefined)
        .map(r => {
          const feedbacks = QualityFeedbackModel.getByRecipeId(r.id);
          return {
            name: r.name,
            goldenScore: r.goldenScore,
            isGolden: r.isGolden,
            feedbackCount: feedbacks.length,
            qualityStats: r.qualityStats
          };
        })
        .sort((a, b) => (b.goldenScore || 0) - (a.goldenScore || 0));

      if (scoredRecipes.length === 0) {
        resultDiv.innerHTML = '<p style="color: #6b7280; margin-top: 16px;">沒有已評分的配方</p>';
        return;
      }

      resultDiv.innerHTML = `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px;">
          <h4 style="margin: 0 0 12px 0;">📊 配方評分分析（共 ${scoredRecipes.length} 個）</h4>
          <div style="max-height: 400px; overflow-y: auto;">
            ${scoredRecipes.map(r => `
              <div style="border-bottom: 1px solid #f3f4f6; padding: 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <strong>${r.name}</strong>
                  <span style="font-size: 20px; font-weight: 700; color: ${r.goldenScore >= 92 ? '#10b981' : r.goldenScore >= 85 ? '#f59e0b' : '#6b7280'}">
                    ${r.goldenScore.toFixed(1)}
                  </span>
                </div>
                <div style="font-size: 13px; color: #6b7280;">
                  回饋數: ${r.feedbackCount} |
                  ${r.isGolden ? '🏆 已認證' : r.goldenScore >= 85 ? '🎯 候選' : '⏳ 未達標'}
                </div>
                ${r.qualityStats ? `
                  <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                    良率: ${(Number(r.qualityStats.avgYield) || 0).toFixed(1)}% |
                    效率: ${(Number(r.qualityStats.avgEfficiency) || 0).toFixed(1)}% |
                    壽命: ${(Number(r.qualityStats.avgLifespan) || 0).toFixed(1)}月 |
                    CPK: ${(Number(r.qualityStats.avgCpk) || 0).toFixed(2)}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (error) {
      resultDiv.innerHTML = `<div style="color: #dc2626; margin-top: 16px;">❌ 錯誤: ${error.message}</div>`;
    }
  }

  async checkGoldenCandidates() {
    const resultDiv = document.getElementById('golden-test-result');

    try {
      const candidates = GoldenRecipeManager.getGoldenCandidates();

      if (candidates.length === 0) {
        resultDiv.innerHTML = '<p style="color: #6b7280; margin-top: 16px;">沒有 Golden Recipe 候選配方（評分需 ≥85）</p>';
        return;
      }

      resultDiv.innerHTML = `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-top: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #92400e;">🎯 Golden Recipe 候選（共 ${candidates.length} 個）</h4>
          ${candidates.map(c => `
            <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${c.name}</strong>
                <span style="font-size: 18px; font-weight: 700; color: #f59e0b;">
                  ${c.goldenScore.toFixed(1)}
                </span>
              </div>
              ${c.qualityStats ? `
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                  良率: ${(Number(c.qualityStats.avgYield) || 0).toFixed(1)}% |
                  效率: ${(Number(c.qualityStats.avgEfficiency) || 0).toFixed(1)}% |
                  壽命: ${(Number(c.qualityStats.avgLifespan) || 0).toFixed(1)}月 |
                  CPK: ${(Number(c.qualityStats.avgCpk) || 0).toFixed(2)}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      resultDiv.innerHTML = `<div style="color: #dc2626; margin-top: 16px;">❌ 錯誤: ${error.message}</div>`;
    }
  }

  async checkCertifiedGolden() {
    const resultDiv = document.getElementById('golden-test-result');

    try {
      const goldenRecipes = GoldenRecipeManager.getAllGoldenRecipes();

      if (goldenRecipes.length === 0) {
        resultDiv.innerHTML = '<p style="color: #6b7280; margin-top: 16px;">沒有已認證的 Golden Recipe</p>';
        return;
      }

      resultDiv.innerHTML = `
        <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-top: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #065f46;">🏆 已認證 Golden Recipe（共 ${goldenRecipes.length} 個）</h4>
          ${goldenRecipes.map(g => `
            <div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${g.name}</strong>
                <span style="font-size: 18px; font-weight: 700; color: #10b981;">
                  ${g.goldenScore.toFixed(1)}
                </span>
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                認證時間: ${new Date(g.goldenCertifiedAt).toLocaleString('zh-TW')}
                ${g.goldenCertifiedBy ? ` | 認證人: ${g.goldenCertifiedBy}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      resultDiv.innerHTML = `<div style="color: #dc2626; margin-top: 16px;">❌ 錯誤: ${error.message}</div>`;
    }
  }
}
