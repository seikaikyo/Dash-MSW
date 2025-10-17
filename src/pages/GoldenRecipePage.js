import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';
import { Modal } from '../components/common/Modal.js';
import { Input } from '../components/common/Input.js';
import { FormModel, UserModel } from '../utils/dataModel.js';
import { GoldenRecipeManager, QualityFeedbackModel, GoldenRecipeAPI } from '../utils/goldenRecipeModel.js';
import { authService } from '../utils/authService.js';

/**
 * Golden Recipe 管理頁面
 */
export function GoldenRecipePage() {
  const container = document.createElement('div');
  container.className = 'golden-recipe-page';

  let currentView = 'golden'; // golden, candidates, pending, all
  let currentViewMode = 'card'; // 'list' or 'card'

  // 取得當前使用者（從全域認證服務）
  let currentUser = authService.getCurrentUser();

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header-with-info';

  const headerTitle = document.createElement('div');
  headerTitle.innerHTML = `
    <h2>🏆 Golden Recipe 管理</h2>
    <p class="text-secondary">經過驗證的優秀配方管理與品質追蹤</p>
  `;

  const infoBtn = new Button({
    text: '💡 功能說明',
    variant: 'outline',
    onClick: () => showInfoModal()
  });

  header.appendChild(headerTitle);
  header.appendChild(infoBtn.render());
  container.appendChild(header);

  // Tab 切換與視圖切換
  const controlBar = document.createElement('div');
  controlBar.className = 'control-bar';

  const tabBar = document.createElement('div');
  tabBar.className = 'tab-bar';

  const tabs = [
    { id: 'golden', label: '🏆 Golden Recipes', count: () => GoldenRecipeManager.getAllGoldenRecipes().length },
    { id: 'candidates', label: '⭐ 候選配方', count: () => GoldenRecipeManager.getGoldenCandidates().length },
    { id: 'pending', label: '⏳ 待我審核', count: () => currentUser ? GoldenRecipeManager.getPendingReviewsForUser(currentUser.id).length : 0 },
    { id: 'all', label: '📊 所有配方', count: () => FormModel.getAll().length }
  ];

  tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${currentView === tab.id ? 'active' : ''}`;
    btn.innerHTML = `${tab.label} <span class="tab-count">${tab.count()}</span>`;
    btn.onclick = () => switchView(tab.id);
    tabBar.appendChild(btn);
  });

  // 視圖切換按鈕
  const viewToggle = document.createElement('div');
  viewToggle.className = 'view-toggle';
  viewToggle.innerHTML = `
    <button class="view-btn ${currentViewMode === 'list' ? 'active' : ''}" data-view="list" title="清單視圖">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="3" width="12" height="2"></rect>
        <rect x="2" y="7" width="12" height="2"></rect>
        <rect x="2" y="11" width="12" height="2"></rect>
      </svg>
    </button>
    <button class="view-btn ${currentViewMode === 'card' ? 'active' : ''}" data-view="card" title="卡片視圖">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="2" width="5" height="5"></rect>
        <rect x="9" y="2" width="5" height="5"></rect>
        <rect x="2" y="9" width="5" height="5"></rect>
        <rect x="9" y="9" width="5" height="5"></rect>
      </svg>
    </button>
  `;

  // 視圖切換事件
  viewToggle.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const newMode = e.currentTarget.dataset.view;
      if (newMode !== currentViewMode) {
        currentViewMode = newMode;
        viewToggle.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        renderContent();
      }
    });
  });

  controlBar.appendChild(tabBar);
  controlBar.appendChild(viewToggle);
  container.appendChild(controlBar);

  // 內容區域
  const content = document.createElement('div');
  content.className = 'content-area';
  content.id = 'content-area';
  container.appendChild(content);

  // 初始化顯示
  renderContent();

  function switchView(viewId) {
    currentView = viewId;

    // 更新 tab 狀態
    const btns = tabBar.querySelectorAll('.tab-btn');
    btns.forEach((btn, i) => {
      if (tabs[i].id === viewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
      // 更新計數
      btn.querySelector('.tab-count').textContent = tabs[i].count();
    });

    renderContent();
  }

  function updateTabCounts() {
    const btns = tabBar.querySelectorAll('.tab-btn');
    btns.forEach((btn, i) => {
      btn.querySelector('.tab-count').textContent = tabs[i].count();
    });
  }

  function renderContent() {
    content.innerHTML = '';

    switch (currentView) {
      case 'golden':
        renderGoldenRecipes();
        break;
      case 'candidates':
        renderCandidates();
        break;
      case 'pending':
        renderPendingReviews();
        break;
      case 'all':
        renderAllRecipes();
        break;
    }

    // 更新 tab 計數
    updateTabCounts();
  }

  // 創建配方列表表格（list 視圖）
  function createRecipesTable(recipes, showGoldenColumn = false) {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';

    if (recipes.length === 0) {
      return tableContainer;
    }

    const rows = recipes.map(recipe => {
      const recipeNoField = recipe.fields?.find(f => f.name === 'recipeNo');
      const versionField = recipe.fields?.find(f => f.name === 'version');
      const recipeNo = recipeNoField?.value || '-';
      const version = versionField?.value || '-';
      const goldenScore = recipe.goldenScore || 0;
      const qualityStats = recipe.qualityStats || {};

      // 評分等級和顏色
      let scoreColor = '#3b82f6';
      if (goldenScore >= 92) scoreColor = '#10b981';
      else if (goldenScore >= 80) scoreColor = '#3b82f6';
      else if (goldenScore >= 70) scoreColor = '#f59e0b';
      else scoreColor = '#ef4444';

      return `
        <tr>
          ${showGoldenColumn ? `<td><span class="table-golden-badge">🏆</span></td>` : ''}
          <td>
            <div class="table-recipe-name">${recipe.name || '未命名配方'}</div>
            <div class="table-recipe-no">${recipeNo} v${version}</div>
          </td>
          <td>
            <div class="table-score" style="color: ${scoreColor};">
              ${goldenScore.toFixed(1)}
            </div>
          </td>
          <td>${qualityStats.totalExecutions || 0} 批</td>
          <td>${(qualityStats.avgYield || 0).toFixed(1)}%</td>
          <td>${(qualityStats.avgEfficiency || 0).toFixed(1)}%</td>
          <td>${(qualityStats.avgCpk || 0).toFixed(2)}</td>
          <td>
            ${recipe.isGolden ? `
              <div class="table-cert-info">
                ${recipe.goldenCertifiedBy || '-'}
                <div class="table-cert-date">${new Date(recipe.goldenCertifiedAt).toLocaleDateString('zh-TW')}</div>
              </div>
            ` : '-'}
          </td>
          <td class="table-actions">
            <button class="btn-table btn-detail" data-recipe-id="${recipe.id}">品質報表</button>
            ${recipe.isGolden ?
              `<button class="btn-table btn-edit" data-recipe-id="${recipe.id}" data-action="degrade">降級</button>` :
              `<button class="btn-table btn-edit" data-recipe-id="${recipe.id}" data-action="certify">認證</button>`
            }
          </td>
        </tr>
      `;
    }).join('');

    tableContainer.innerHTML = `
      <table class="recipes-table">
        <thead>
          <tr>
            ${showGoldenColumn ? '<th style="width: 50px;">Golden</th>' : ''}
            <th>配方名稱</th>
            <th>評分</th>
            <th>批次</th>
            <th>良率</th>
            <th>效率</th>
            <th>CPK</th>
            <th>認證資訊</th>
            <th style="width: 180px;">操作</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    // 添加事件監聽
    tableContainer.querySelectorAll('.btn-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const recipeId = e.target.dataset.recipeId;
        showQualityReport(recipeId);
      });
    });

    tableContainer.querySelectorAll('[data-action="certify"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const recipeId = e.target.dataset.recipeId;
        showCertifyModal(recipeId);
      });
    });

    tableContainer.querySelectorAll('[data-action="degrade"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const recipeId = e.target.dataset.recipeId;
        showDegradeModal(recipeId);
      });
    });

    return tableContainer;
  }

  function renderGoldenRecipes() {
    const goldenRecipes = GoldenRecipeManager.getAllGoldenRecipes();

    if (goldenRecipes.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <h3>尚未有 Golden Recipe</h3>
          <p>當配方達到品質標準後，系統會自動認證或由工程師手動認證</p>
        </div>
      `;
      return;
    }

    const sortedRecipes = goldenRecipes.sort((a, b) => (b.goldenScore || 0) - (a.goldenScore || 0));

    if (currentViewMode === 'list') {
      const table = createRecipesTable(sortedRecipes, true);
      content.appendChild(table);
    } else {
      sortedRecipes.forEach(recipe => {
        const card = createRecipeCard(recipe, true);
        content.appendChild(card);
      });
    }
  }

  function renderCandidates() {
    const candidates = GoldenRecipeManager.getGoldenCandidates();

    if (candidates.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <h3>目前沒有候選配方</h3>
          <p>配方評分達到 85 分以上且尚未認證為 Golden 的配方會顯示在此</p>
        </div>
      `;
      return;
    }

    if (currentViewMode === 'list') {
      const table = createRecipesTable(candidates, false);
      content.appendChild(table);
    } else {
      candidates.forEach(recipe => {
        const card = createRecipeCard(recipe, false);
        content.appendChild(card);
      });
    }
  }

  function renderPendingReviews() {
    if (!currentUser) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⏳</div>
          <h3>無法取得使用者資訊</h3>
          <p>請確認您已登入系統</p>
        </div>
      `;
      return;
    }

    console.log('當前使用者 ID:', currentUser.id);
    console.log('當前使用者名稱:', currentUser.name);
    console.log('當前使用者角色:', currentUser.role);

    // 顯示所有有審核者的配方（debug用）
    const allRecipes = FormModel.getAll();
    const recipesWithReviewers = allRecipes.filter(r => r.reviewers && r.reviewers.length > 0);
    console.log('所有有審核者的配方:', recipesWithReviewers);

    // 檢查第一個配方的審核者
    if (recipesWithReviewers.length > 0) {
      const firstRecipe = recipesWithReviewers[0];
      console.log('第一個配方名稱:', firstRecipe.name);
      console.log('第一個配方認證狀態:', firstRecipe.certificationStatus);
      console.log('第一個配方審核者:', firstRecipe.reviewers);
      console.log('第一個配方審核者 ID 列表:', firstRecipe.reviewers.map(r => r.id));
    }

    const pendingReviews = GoldenRecipeManager.getPendingReviewsForUser(currentUser.id);
    console.log('待審核配方數量:', pendingReviews.length);
    console.log('待審核配方:', pendingReviews);

    if (pendingReviews.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>沒有待審核的認證申請</h3>
          <p>目前沒有需要您審核的 Golden Recipe 認證申請</p>
          <p style="margin-top: 16px; font-size: 0.875rem; color: #6b7280;">
            當前使用者: ${currentUser.name} (ID: ${currentUser.id})<br>
            有審核者的配方: ${recipesWithReviewers.length} 個
          </p>
        </div>
      `;
      return;
    }

    pendingReviews.forEach(recipe => {
      const card = createPendingReviewCard(recipe);
      content.appendChild(card);
    });
  }

  function renderAllRecipes() {
    const allRecipes = FormModel.getAll()
      .filter(r => r.goldenScore !== undefined)
      .sort((a, b) => (b.goldenScore || 0) - (a.goldenScore || 0));

    if (allRecipes.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>尚未有品質數據</h3>
          <p>配方需要有生產品質回饋數據才能計算評分</p>
        </div>
      `;
      return;
    }

    if (currentViewMode === 'list') {
      const table = createRecipesTable(allRecipes, false);
      content.appendChild(table);
    } else {
      allRecipes.forEach(recipe => {
        const card = createRecipeCard(recipe, recipe.isGolden);
        content.appendChild(card);
      });
    }
  }

  function createPendingReviewCard(recipe) {
    const recipeNoField = recipe.fields.find(f => f.name === 'recipeNo');
    const versionField = recipe.fields.find(f => f.name === 'version');
    const recipeNo = recipeNoField?.value || '-';
    const version = versionField?.value || '-';

    const qualityStats = recipe.qualityStats || {};
    const goldenScore = recipe.goldenScore || 0;

    // 找到當前使用者的審核資訊
    const myReview = recipe.reviewers.find(r => r.id === currentUser.id);

    const cardDiv = document.createElement('div');
    cardDiv.className = 'recipe-card pending-review-card';

    cardDiv.innerHTML = `
      <div class="recipe-card-header">
        <div class="recipe-title">
          <span class="pending-badge">⏳ 待審核</span>
          <h3>${recipe.name || '未命名配方'}</h3>
          <div class="recipe-meta">
            <span class="font-mono">${recipeNo}</span>
            <span class="badge badge-version">${version}</span>
            <span class="badge badge-score">Golden Score: ${goldenScore.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div class="recipe-card-body">
        <div class="certification-info">
          <div class="info-row">
            <span>申請時間：</span>
            <span>${new Date(recipe.goldenCertifiedAt).toLocaleString('zh-TW')}</span>
          </div>
          <div class="info-row">
            <span>申請人員：</span>
            <span>${recipe.goldenCertifiedBy}</span>
          </div>
          <div class="info-row">
            <span>認證理由：</span>
            <span>${recipe.goldenCertificationReason || '-'}</span>
          </div>
        </div>

        <div class="quality-summary">
          <h4>品質指標</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">執行次數</span>
              <span class="stat-value">${qualityStats.totalExecutions || 0} 批</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均良率</span>
              <span class="stat-value">${(qualityStats.avgYield || 0).toFixed(1)}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">過濾效率</span>
              <span class="stat-value">${(qualityStats.avgEfficiency || 0).toFixed(1)}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">CPK</span>
              <span class="stat-value">${(qualityStats.avgCpk || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="review-status">
          <h4>審核進度</h4>
          <div class="reviewers-list">
            ${recipe.reviewers.map((r, i) => {
              const isProxy = r.isProxy;
              const isMine = r.id === currentUser.id || (isProxy && r.proxyById === currentUser.id);
              const statusText = r.status === 'approved'
                ? `✅ 已核准${isProxy ? ` (代: ${r.proxyByName})` : ''}`
                : r.status === 'rejected'
                  ? `❌ 已退回${isProxy ? ` (代: ${r.proxyByName})` : ''}`
                  : `⏳ 待審核${currentUser.role === '系統管理員' ? ' (可代理)' : ''}`;

              return `
              <div class="reviewer-item-detail ${isMine ? 'current-user' : ''} ${r.status === 'approved' ? 'reviewer-approved' : r.status === 'rejected' ? 'reviewer-rejected' : 'reviewer-pending'}">
                <span class="reviewer-order">${i + 1}</span>
                <span class="reviewer-name">${r.name}${r.id === currentUser.id ? ' (您)' : ''}</span>
                <span class="reviewer-dept">${r.department}</span>
                <span class="reviewer-status">
                  ${statusText}
                </span>
              </div>
            `}).join('')}
          </div>
        </div>
      </div>

      <div class="recipe-card-footer" data-recipe-id="${recipe.id}">
      </div>
    `;

    // 按鈕區域
    const footer = cardDiv.querySelector('.recipe-card-footer');
    const actions = createReviewActions(recipe, myReview);
    footer.appendChild(actions);

    return cardDiv;
  }

  function createRecipeCard(recipe, isGolden) {
    const recipeNoField = recipe.fields.find(f => f.name === 'recipeNo');
    const versionField = recipe.fields.find(f => f.name === 'version');
    const recipeNo = recipeNoField?.value || '-';
    const version = versionField?.value || '-';

    const qualityStats = recipe.qualityStats || {};
    const goldenScore = recipe.goldenScore || 0;

    const cardDiv = document.createElement('div');
    cardDiv.className = 'recipe-card';

    // 評分等級
    let scoreClass = 'score-good';
    let scoreLabel = '良好';
    if (goldenScore >= 92) {
      scoreClass = 'score-excellent';
      scoreLabel = '優秀';
    } else if (goldenScore >= 80) {
      scoreClass = 'score-good';
      scoreLabel = '良好';
    } else if (goldenScore >= 70) {
      scoreClass = 'score-fair';
      scoreLabel = '合格';
    } else {
      scoreClass = 'score-poor';
      scoreLabel = '需改善';
    }

    // 品質趨勢
    const trendIcons = {
      'improving': '📈 改善中',
      'stable': '➡️ 穩定',
      'declining': '📉 下降',
      'insufficient-data': '❓ 數據不足'
    };
    const trendText = trendIcons[qualityStats.qualityTrend] || '❓ 數據不足';

    cardDiv.innerHTML = `
      <div class="recipe-card-header">
        <div class="recipe-title">
          ${isGolden ? '<span class="golden-badge">🏆 Golden</span>' : ''}
          <h3>${recipe.name || '未命名配方'}</h3>
          <div class="recipe-meta">
            <span class="font-mono">${recipeNo}</span>
            <span class="badge badge-version">${version}</span>
          </div>
        </div>
        <div class="recipe-score ${scoreClass}">
          <div class="score-value">${goldenScore.toFixed(1)}</div>
          <div class="score-label">${scoreLabel}</div>
        </div>
      </div>

      <div class="recipe-card-body">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">執行次數</span>
            <span class="stat-value">${qualityStats.totalExecutions || 0} 批</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均良率</span>
            <span class="stat-value">${(qualityStats.avgYield || 0).toFixed(1)}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">過濾效率</span>
            <span class="stat-value">${(qualityStats.avgEfficiency || 0).toFixed(1)}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">CPK</span>
            <span class="stat-value">${(qualityStats.avgCpk || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="quality-trend">
          <span>品質趨勢：${trendText}</span>
        </div>

        ${isGolden ? `
          <div class="golden-info">
            <div class="info-row">
              <span>認證時間：</span>
              <span>${new Date(recipe.goldenCertifiedAt).toLocaleDateString('zh-TW')}</span>
            </div>
            <div class="info-row">
              <span>認證人員：</span>
              <span>${recipe.goldenCertifiedBy}</span>
            </div>
            ${recipe.reviewers && recipe.reviewers.length > 0 ? `
              <div class="info-row">
                <span>審核主管：</span>
                <span class="reviewers-list">
                  ${recipe.reviewers.map((r, i) => {
                    const proxyText = r.isProxy ? ` (代: ${r.proxyByName})` : '';
                    const statusIcon = r.status === 'approved' ? '✅' : r.status === 'rejected' ? '❌' : '⏳';
                    return `
                    <span class="reviewer-item ${r.status === 'approved' ? 'reviewer-approved' : r.status === 'rejected' ? 'reviewer-rejected' : 'reviewer-pending'}">
                      ${i + 1}. ${r.name} ${statusIcon}${proxyText}
                    </span>
                  `}).join('')}
                </span>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <div class="recipe-card-footer" data-recipe-id="${recipe.id}">
      </div>
    `;

    // 按鈕區域
    const footer = cardDiv.querySelector('.recipe-card-footer');
    const actions = createRecipeActions(recipe, isGolden);
    footer.appendChild(actions);

    return cardDiv;
  }

  function createReviewActions(recipe, myReview) {
    const div = document.createElement('div');
    div.className = 'card-actions';

    // 查看品質報表
    const viewBtn = new Button({
      text: '品質報表',
      variant: 'outline',
      size: 'sm',
      onClick: () => showQualityReport(recipe.id)
    });
    div.appendChild(viewBtn.render());

    // 核准按鈕
    const approveBtn = new Button({
      text: '✅ 核准',
      variant: 'success',
      size: 'sm',
      onClick: () => showApproveModal(recipe.id)
    });
    div.appendChild(approveBtn.render());

    // 退回按鈕
    const rejectBtn = new Button({
      text: '❌ 退回',
      variant: 'danger',
      size: 'sm',
      onClick: () => showRejectModal(recipe.id)
    });
    div.appendChild(rejectBtn.render());

    return div;
  }

  function createRecipeActions(recipe, isGolden) {
    const div = document.createElement('div');
    div.className = 'card-actions';

    // 查看詳情按鈕
    const viewBtn = new Button({
      text: '品質報表',
      variant: 'outline',
      size: 'sm',
      onClick: () => showQualityReport(recipe.id)
    });
    div.appendChild(viewBtn.render());

    // 新增品質數據按鈕（測試用）
    const addDataBtn = new Button({
      text: '新增品質數據',
      variant: 'outline',
      size: 'sm',
      onClick: () => showAddQualityDataModal(recipe.id)
    });
    div.appendChild(addDataBtn.render());

    if (isGolden) {
      // 降級按鈕
      const degradeBtn = new Button({
        text: '降級',
        variant: 'danger',
        size: 'sm',
        onClick: () => showDegradeModal(recipe.id)
      });
      div.appendChild(degradeBtn.render());
    } else {
      // 手動認證按鈕
      const certifyBtn = new Button({
        text: '認證為 Golden',
        variant: 'primary',
        size: 'sm',
        onClick: () => showCertifyModal(recipe.id)
      });
      div.appendChild(certifyBtn.render());
    }

    return div;
  }

  function showQualityReport(recipeId) {
    const report = GoldenRecipeManager.getQualityReport(recipeId);

    const modal = new Modal({
      title: '📊 品質報表',
      content: createQualityReportContent(report),
      footer: createQualityReportFooter(),
      
    });

    modal.open();
  }

  function createQualityReportContent(report) {
    const { recipe, feedbacks, statistics, goldenScore, isGolden, meetsCriteria } = report;

    const recipeNoField = recipe.fields.find(f => f.name === 'recipeNo');
    const versionField = recipe.fields.find(f => f.name === 'version');
    const recipeNo = recipeNoField?.value || '-';
    const version = versionField?.value || '-';

    const div = document.createElement('div');
    div.className = 'quality-report';

    div.innerHTML = `
      <div class="report-header">
        <h3>${recipe.name}</h3>
        <p class="font-mono">${recipeNo} v${version}</p>
        ${isGolden ? '<span class="golden-badge">🏆 Golden Recipe</span>' : ''}
      </div>

      <div class="report-section">
        <h4>品質統計</h4>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Golden 評分</div>
            <div class="stat-value large">${goldenScore.toFixed(1)} 分</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">執行次數</div>
            <div class="stat-value">${statistics.totalExecutions || 0} 批</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">平均良率</div>
            <div class="stat-value">${(statistics.avgYield || 0).toFixed(1)}%</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">平均 CPK</div>
            <div class="stat-value">${(statistics.avgCpk || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div class="report-section">
        <h4>Golden 認證條件檢查</h4>
        <div class="criteria-check">
          <div class="check-item ${feedbacks.length >= 10 ? 'passed' : 'failed'}">
            ${feedbacks.length >= 10 ? '✅' : '❌'} 執行批次 ≥ 10 次 (目前: ${feedbacks.length})
          </div>
          <div class="check-item ${goldenScore >= 92 ? 'passed' : 'failed'}">
            ${goldenScore >= 92 ? '✅' : '❌'} Golden 評分 ≥ 92 分 (目前: ${goldenScore.toFixed(1)})
          </div>
          <div class="check-item ${(statistics.avgYield || 0) >= 97 ? 'passed' : 'failed'}">
            ${(statistics.avgYield || 0) >= 97 ? '✅' : '❌'} 平均良率 ≥ 97% (目前: ${(statistics.avgYield || 0).toFixed(1)}%)
          </div>
          <div class="check-item ${(statistics.avgCpk || 0) >= 1.33 ? 'passed' : 'failed'}">
            ${(statistics.avgCpk || 0) >= 1.33 ? '✅' : '❌'} CPK ≥ 1.33 (目前: ${(statistics.avgCpk || 0).toFixed(2)})
          </div>
          <div class="check-item ${meetsCriteria ? 'passed' : 'pending'}">
            ${meetsCriteria ? '✅ 符合所有條件' : '⏳ 尚未符合所有條件'}
          </div>
        </div>
      </div>

      <div class="report-section">
        <h4>品質數據記錄 (最近 10 筆)</h4>
        <div class="feedbacks-table">
          ${createFeedbacksTable(feedbacks.slice(-10).reverse())}
        </div>
      </div>
    `;

    return div;
  }

  function createFeedbacksTable(feedbacks) {
    if (feedbacks.length === 0) {
      return '<p class="text-secondary">尚無品質數據</p>';
    }

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>批次號</th>
            <th>良率</th>
            <th>效率</th>
            <th>CPK</th>
            <th>結果</th>
            <th>日期</th>
          </tr>
        </thead>
        <tbody>
          ${feedbacks.map(fb => `
            <tr>
              <td class="font-mono text-sm">${fb.batchNo || fb.executionId}</td>
              <td>${fb.qualityMetrics.yieldRate.toFixed(1)}%</td>
              <td>${fb.qualityMetrics.filterEfficiency.toFixed(1)}%</td>
              <td>${fb.qualityMetrics.cpk.toFixed(2)}</td>
              <td>${fb.testResults.passed ? '<span class="badge badge-success">✓ 通過</span>' : '<span class="badge badge-danger">✗ 不通過</span>'}</td>
              <td class="text-sm">${new Date(fb.createdAt).toLocaleDateString('zh-TW')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function createQualityReportFooter() {
    const div = document.createElement('div');
    const closeBtn = new Button({
      text: '關閉',
      variant: 'outline',
      onClick: () => document.querySelector('.modal')?.remove()
    });
    div.appendChild(closeBtn.render());
    return div;
  }

  function showAddQualityDataModal(recipeId) {
    const modal = new Modal({
      title: '新增品質數據',
      content: createAddQualityDataForm(recipeId),
      
    });

    modal.open();
  }

  function createAddQualityDataForm(recipeId) {
    const div = document.createElement('div');
    div.className = 'quality-data-form';

    div.innerHTML = `
      <p class="text-secondary" style="margin-bottom: 16px;">
        模擬從 SPC 系統接收品質數據（實際環境中由 SPC 系統自動回傳）
      </p>

      <div class="form-group">
        <label>批次號</label>
        <input type="text" id="batchNo" value="BATCH-${Date.now()}" class="form-input">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>良率 (%)</label>
          <input type="number" id="yieldRate" value="${90 + Math.random() * 10}" step="0.1" min="0" max="100" class="form-input">
        </div>
        <div class="form-group">
          <label>過濾效率 (%)</label>
          <input type="number" id="filterEfficiency" value="${90 + Math.random() * 10}" step="0.1" min="0" max="100" class="form-input">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>使用壽命 (月)</label>
          <input type="number" id="lifespan" value="${Math.floor(24 + Math.random() * 12)}" min="0" class="form-input">
        </div>
        <div class="form-group">
          <label>不良率 (%)</label>
          <input type="number" id="defectRate" value="${Math.random() * 5}" step="0.1" min="0" max="100" class="form-input">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>CPK</label>
          <input type="number" id="cpk" value="${1 + Math.random() * 1}" step="0.01" min="0" class="form-input">
        </div>
        <div class="form-group">
          <label>穩定性評分</label>
          <input type="number" id="stabilityScore" value="${85 + Math.random() * 15}" step="1" min="0" max="100" class="form-input">
        </div>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" id="testPassed" checked>
          測試通過
        </label>
      </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const submitBtn = new Button({
      text: '提交',
      variant: 'primary',
      onClick: async () => {
        const data = {
          batchNo: div.querySelector('#batchNo').value,
          qualityMetrics: {
            yieldRate: parseFloat(div.querySelector('#yieldRate').value),
            filterEfficiency: parseFloat(div.querySelector('#filterEfficiency').value),
            lifespan: parseInt(div.querySelector('#lifespan').value),
            defectRate: parseFloat(div.querySelector('#defectRate').value),
            cpk: parseFloat(div.querySelector('#cpk').value),
            stabilityScore: parseFloat(div.querySelector('#stabilityScore').value)
          },
          testResults: {
            passed: div.querySelector('#testPassed').checked
          },
          source: 'MANUAL-TEST'
        };

        const result = await GoldenRecipeAPI.submitQualityFeedback(recipeId, data);

        if (result.success) {
          alert('品質數據已新增！');
          document.querySelector('.modal')?.remove();
          renderContent(); // 重新渲染頁面
        } else {
          alert('新增失敗：' + result.error);
        }
      }
    });

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal')?.remove()
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(submitBtn.render());
    div.appendChild(footer);

    return div;
  }

  function showCertifyModal(recipeId) {
    const modal = new Modal({
      title: '認證為 Golden Recipe',
      content: createCertifyForm(recipeId),
      
    });

    modal.open();
  }

  function createCertifyForm(recipeId) {
    // 取得所有主管
    const allUsers = UserModel.getAll();
    const managers = allUsers.filter(u => u.role === '主管' || u.role === '系統管理員');
    const currentUser = allUsers.find(u => u.role === '系統管理員') || allUsers[0]; // 預設為第一個管理員或第一個使用者

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="form-group">
        <label>認證理由</label>
        <textarea id="certifyReason" rows="4" class="form-input" placeholder="請說明認證為 Golden Recipe 的理由..."></textarea>
      </div>
      <div class="form-group">
        <label>認證人員（提出者）</label>
        <select id="certifiedBy" class="form-input">
          ${currentUser ? `<option value="${currentUser.id}">${currentUser.name} (${currentUser.department})</option>` : ''}
          ${allUsers.filter(u => u.id !== currentUser?.id).map(u =>
            `<option value="${u.id}">${u.name} (${u.department} - ${u.role})</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>審核主管（可多選，依審核順序）</label>
        <p class="form-hint">💡 選擇需要審核的主管，順序為：組長 → 課長 → 部門經理 → 處長 → 研發長</p>
        <div class="reviewers-checkboxes" id="reviewersCheckboxes">
          ${managers.length === 0 ? '<p class="text-secondary">目前沒有主管人員</p>' : ''}
          ${managers.map((m, index) => `
            <label class="checkbox-label">
              <input type="checkbox" name="reviewers" value="${m.id}" data-index="${index}">
              <span>${m.name} (${m.department} - ${m.role})</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const certifyBtn = new Button({
      text: '確認認證',
      variant: 'primary',
      onClick: () => {
        const reason = div.querySelector('#certifyReason').value;
        const certifiedById = div.querySelector('#certifiedBy').value;

        // 收集所有勾選的審核主管
        const reviewerCheckboxes = div.querySelectorAll('input[name="reviewers"]:checked');
        const reviewerIds = Array.from(reviewerCheckboxes).map(cb => cb.value);

        if (!reason) {
          alert('請填寫認證理由');
          return;
        }

        if (!certifiedById) {
          alert('請選擇認證人員');
          return;
        }

        if (reviewerIds.length === 0) {
          if (!confirm('未選擇審核主管，是否直接認證（不經審核）？')) {
            return;
          }
        }

        // 取得使用者姓名
        const certifiedByUser = UserModel.getById(certifiedById);
        const reviewers = reviewerIds.map(id => {
          const user = UserModel.getById(id);
          return user ? {
            id: user.id,
            name: user.name,
            department: user.department,
            role: user.role,
            status: 'pending' // 待審核
          } : null;
        }).filter(r => r !== null);

        GoldenRecipeManager.certifyGoldenRecipe(recipeId, {
          certifiedBy: certifiedByUser ? `${certifiedByUser.name} (${certifiedByUser.department})` : certifiedById,
          reason: reason,
          reviewers: reviewers, // 審核主管清單
          reviewedBy: reviewers.length > 0 ? reviewers.map(r => r.name).join(', ') : '-' // 相容舊欄位
        });

        alert(`已提交 Golden Recipe 認證申請！${reviewers.length > 0 ? `\n待審核主管：${reviewers.map(r => r.name).join(' → ')}` : ''}`);
        document.querySelector('.modal')?.remove();
        renderContent();
      }
    });

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal')?.remove()
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(certifyBtn.render());
    div.appendChild(footer);

    return div;
  }

  function showApproveModal(recipeId) {
    const recipe = FormModel.getById(recipeId);
    const modal = new Modal({
      title: '核准 Golden Recipe 認證',
      content: createApproveForm(recipeId, recipe),
    });

    modal.open();
  }

  function createApproveForm(recipeId, recipe) {
    const div = document.createElement('div');
    div.innerHTML = `
      <p style="margin-bottom: 16px;">
        您即將核准配方 <strong>${recipe.name}</strong> 的 Golden Recipe 認證申請。
      </p>
      <div class="form-group">
        <label>審核意見（選填）</label>
        <textarea id="approveComment" rows="3" class="form-input" placeholder="填寫審核意見或建議..."></textarea>
      </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const approveBtn = new Button({
      text: '確認核准',
      variant: 'success',
      onClick: () => {
        const comment = div.querySelector('#approveComment').value;

        try {
          GoldenRecipeManager.approveGoldenRecipe(recipeId, currentUser.id, { comment });

          const updatedRecipe = FormModel.getById(recipeId);
          const allApproved = updatedRecipe.reviewers.every(r => r.status === 'approved');

          alert(allApproved
            ? '✅ 已核准！全部主管已核准，配方已正式認證為 Golden Recipe。'
            : '✅ 已核准！等待其他主管審核。');

          document.querySelector('.modal')?.remove();
          renderContent();
        } catch (error) {
          alert('核准失敗：' + error.message);
        }
      }
    });

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal')?.remove()
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(approveBtn.render());
    div.appendChild(footer);

    return div;
  }

  function showRejectModal(recipeId) {
    const recipe = FormModel.getById(recipeId);
    const modal = new Modal({
      title: '退回 Golden Recipe 認證',
      content: createRejectForm(recipeId, recipe),
    });

    modal.open();
  }

  function createRejectForm(recipeId, recipe) {
    const div = document.createElement('div');
    div.innerHTML = `
      <p class="text-warning" style="margin-bottom: 16px;">
        ⚠️ 您即將退回配方 <strong>${recipe.name}</strong> 的 Golden Recipe 認證申請。
      </p>
      <div class="form-group">
        <label>退回理由 *</label>
        <textarea id="rejectReason" rows="4" class="form-input" placeholder="請說明退回理由，例如：品質數據不足、需要更多測試批次等..."></textarea>
      </div>
      <div class="form-group">
        <label>改善建議（選填）</label>
        <textarea id="rejectComment" rows="3" class="form-input" placeholder="提供改善建議或需補充的資料..."></textarea>
      </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const rejectBtn = new Button({
      text: '確認退回',
      variant: 'danger',
      onClick: () => {
        const reason = div.querySelector('#rejectReason').value;
        const comment = div.querySelector('#rejectComment').value;

        if (!reason) {
          alert('請填寫退回理由');
          return;
        }

        try {
          GoldenRecipeManager.rejectGoldenRecipe(recipeId, currentUser.id, {
            reason,
            comment
          });

          alert('❌ 已退回認證申請。');
          document.querySelector('.modal')?.remove();
          renderContent();
        } catch (error) {
          alert('退回失敗：' + error.message);
        }
      }
    });

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal')?.remove()
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(rejectBtn.render());
    div.appendChild(footer);

    return div;
  }

  function showDegradeModal(recipeId) {
    const modal = new Modal({
      title: '降級 Golden Recipe',
      content: createDegradeForm(recipeId),

    });

    modal.open();
  }

  function showInfoModal() {
    const modal = new Modal({
      title: '💡 Golden Recipe 功能說明',
      content: createInfoContent(),

    });

    modal.open();

    // 為功能說明 modal 增加寬度
    const modalElement = modal.element.querySelector('.modal');
    if (modalElement) {
      modalElement.classList.add('modal-wide');
    }
  }

  function createInfoContent() {
    const div = document.createElement('div');
    div.className = 'info-content';

    div.innerHTML = `
      <div class="info-section">
        <h3>🎯 什麼是 Golden Recipe？</h3>
        <p>
          Golden Recipe（黃金配方）是經過大量生產驗證、品質穩定、性能優異的配方版本。
          系統透過整合 SPC 品質檢驗數據，自動追蹤配方的實際生產表現，篩選出最佳配方。
        </p>
      </div>

      <div class="info-section">
        <h3>⭐ 四大核心功能</h3>
        <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <div class="feature-content">
            <h4>1. 品質數據追蹤</h4>
            <p>記錄每次配方執行的品質指標（良率、效率、CPK、壽命等），累積批次數據進行統計分析，計算品質趨勢（改善中/穩定/下降）。</p>
            <div class="feature-detail">
              <strong>實際運作：</strong>
              <ul>
                <li>配方用於生產 → SPC 系統檢驗 → 數據自動回傳 RMS</li>
                <li>支援 Webhook 推送、API 輪詢、檔案交換三種整合方式</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🔢</div>
          <div class="feature-content">
            <h4>2. Golden 評分系統</h4>
            <p>基於多維度品質指標的智能評分演算法，綜合評估配方品質表現。</p>
            <div class="feature-detail">
              <strong>評分公式：</strong>
              <div class="formula">
                總分 = 良率(30%) + 效率(25%) + 壽命(20%) + CPK(15%) + 穩定性(10%)
              </div>
              <ul>
                <li><strong>92-100 分</strong>：優秀（Golden 候選）</li>
                <li><strong>80-89 分</strong>：良好</li>
                <li><strong>70-79 分</strong>：合格</li>
                <li><strong>&lt; 70 分</strong>：需改善</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon">✅</div>
          <div class="feature-content">
            <h4>3. 認證與審核機制</h4>
            <p>系統提供自動認證與手動申請兩種方式，搭配多層級主管審核流程。</p>
            <div class="feature-detail">
              <strong>自動認證條件：</strong>
              <ul>
                <li>✅ 執行批次 ≥ 10 次</li>
                <li>✅ 時間跨度 ≥ 30 天</li>
                <li>✅ Golden Score ≥ 92 分</li>
                <li>✅ 最近 20 批次良率 ≥ 97%</li>
                <li>✅ CPK ≥ 1.33</li>
                <li>✅ 無重大品質異常</li>
              </ul>
              <strong>手動認證流程：</strong>
              <ul>
                <li>📝 工程師提出認證申請並填寫理由</li>
                <li>👥 可選擇多位主管進行審核（組長→課長→部經理→處長→研發長）</li>
                <li>⏳ 審核狀態即時追蹤（待審核/已核准/已退回）</li>
                <li>✅ 全部主管核准後正式認證為 Golden Recipe</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📈</div>
          <div class="feature-content">
            <h4>4. 持續優化循環</h4>
            <p>追蹤 Golden Recipe 的品質趨勢，自動降級表現下降的配方，形成持續改善循環。</p>
            <div class="feature-detail">
              <strong>優化流程：</strong>
              <ol>
                <li>持續收集生產數據</li>
                <li>監控品質趨勢變化</li>
                <li>識別異常與下降</li>
                <li>觸發警示與降級</li>
                <li>分析原因並改善</li>
              </ol>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div class="info-section">
        <h3>🎁 系統效益</h3>
        <div class="benefits-grid">
          <div class="benefit-item">
            <div class="benefit-icon">🎯</div>
            <strong>快速識別最佳配方</strong>
            <p>透過數據自動篩選，無需人工比對</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-icon">📉</div>
            <strong>降低試錯成本</strong>
            <p>優先使用經過驗證的配方，減少失敗</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-icon">📊</div>
            <strong>提升整體良率</strong>
            <p>推廣 Golden Recipe，提高生產穩定性</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-icon">📚</div>
            <strong>知識沉澱傳承</strong>
            <p>建立標準化流程，新人快速上手</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-icon">🔍</div>
            <strong>完整可追溯性</strong>
            <p>所有品質數據皆可回溯查詢</p>
          </div>
          <div class="benefit-item">
            <div class="benefit-icon">🔄</div>
            <strong>持續改善循環</strong>
            <p>數據驅動決策，不斷優化配方</p>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3>🔧 如何使用</h3>
        <ol class="usage-steps">
          <li><strong>配方生產執行</strong> - 使用配方進行生產並記錄執行 ID</li>
          <li><strong>品質檢驗完成</strong> - SPC 系統完成檢驗並記錄數據</li>
          <li><strong>數據回傳 RMS</strong> - 透過 API 或手動新增品質數據</li>
          <li><strong>系統自動評分</strong> - 計算 Golden Score 並更新統計</li>
          <li><strong>達標自動認證</strong> - 符合條件自動標記為 Golden</li>
          <li><strong>查看品質報表</strong> - 檢視詳細的品質統計與趨勢</li>
        </ol>
      </div>

      <div class="info-footer">
        <p class="note">
          💡 <strong>提示：</strong>在測試環境中，可使用「新增品質數據」功能手動輸入測試數據，
          觀察配方評分與認證機制的運作。實際生產環境中，數據應由 SPC 系統自動回傳。
        </p>
      </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const closeBtn = new Button({
      text: '我知道了',
      variant: 'primary',
      onClick: () => document.querySelector('.modal')?.remove()
    });

    footer.appendChild(closeBtn.render());
    div.appendChild(footer);

    return div;
  }

  function createDegradeForm(recipeId) {
    const div = document.createElement('div');
    div.innerHTML = `
      <p class="text-warning" style="margin-bottom: 16px;">
        ⚠️ 此操作將移除 Golden Recipe 標記，確定要繼續嗎？
      </p>
      <div class="form-group">
        <label>降級理由</label>
        <textarea id="degradeReason" rows="4" class="form-input" placeholder="請說明降級理由..."></textarea>
      </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const degradeBtn = new Button({
      text: '確認降級',
      variant: 'danger',
      onClick: () => {
        const reason = div.querySelector('#degradeReason').value;

        if (!reason) {
          alert('請填寫降級理由');
          return;
        }

        GoldenRecipeManager.degradeGoldenRecipe(recipeId, reason);

        alert('已降級 Golden Recipe');
        document.querySelector('.modal')?.remove();
        renderContent();
      }
    });

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal')?.remove()
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(degradeBtn.render());
    div.appendChild(footer);

    return div;
  }

  addStyles();
  return container;
}

function addStyles() {
  if (!document.getElementById('golden-recipe-styles')) {
    const style = document.createElement('style');
    style.id = 'golden-recipe-styles';
    style.textContent = `
      .golden-recipe-page {
        padding: var(--spacing-xl);
      }

      .page-header-with-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-xl);
      }

      .page-header-with-info h2 {
        margin-bottom: var(--spacing-xs);
      }

      .text-secondary {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .control-bar {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: var(--spacing-xl);
        border-bottom: 2px solid var(--border-color);
      }

      .tab-bar {
        display: flex;
        gap: var(--spacing-sm);
      }

      .view-toggle {
        display: flex;
        gap: 4px;
        padding-bottom: var(--spacing-md);
      }

      .view-btn {
        padding: 6px 10px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
      }

      .view-btn:hover {
        background: var(--bg-color);
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .view-btn.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
      }

      .view-btn svg {
        display: block;
      }

      .tab-btn {
        padding: var(--spacing-md) var(--spacing-lg);
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-secondary);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .tab-btn:hover {
        color: var(--primary-color);
      }

      .tab-btn.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .tab-count {
        background: var(--bg-secondary);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
      }

      .tab-btn.active .tab-count {
        background: var(--primary-light);
        color: var(--primary-color);
      }

      .content-area {
        display: grid;
        gap: var(--spacing-lg);
      }

      .recipe-card {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
        transition: all 0.2s;
      }

      .recipe-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .recipe-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
      }

      .recipe-title h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
      }

      .recipe-meta {
        display: flex;
        gap: var(--spacing-sm);
        align-items: center;
      }

      .golden-badge {
        display: inline-block;
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #8B4513;
        padding: var(--spacing-xs) var(--spacing-md);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
        box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
      }

      .recipe-score {
        text-align: center;
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        min-width: 100px;
      }

      .score-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: var(--spacing-xs);
      }

      .score-label {
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: uppercase;
      }

      .score-excellent {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }

      .score-good {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
      }

      .score-fair {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
      }

      .score-poor {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
      }

      .recipe-card-body {
        margin-bottom: var(--spacing-md);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .stat-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .quality-trend {
        padding: var(--spacing-sm);
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
        margin-bottom: var(--spacing-md);
        font-size: 0.875rem;
      }

      .golden-info {
        background: rgba(255, 215, 0, 0.1);
        padding: var(--spacing-md);
        border-radius: var(--radius-sm);
        border-left: 4px solid #ffd700;
      }

      .golden-info .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-xs);
        font-size: 0.875rem;
      }

      .recipe-card-footer {
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border-color);
      }

      .card-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .quality-report {
        max-height: 70vh;
        overflow-y: auto;
      }

      .report-header {
        text-align: center;
        padding-bottom: var(--spacing-lg);
        border-bottom: 2px solid var(--border-color);
        margin-bottom: var(--spacing-lg);
      }

      .report-header h3 {
        font-size: 1.5rem;
        margin-bottom: var(--spacing-sm);
      }

      .report-section {
        margin-bottom: var(--spacing-xl);
      }

      .report-section h4 {
        font-size: 1.125rem;
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
      }

      .stat-box {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        text-align: center;
      }

      .stat-box .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xs);
      }

      .stat-box .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
      }

      .stat-box .stat-value.large {
        font-size: 2rem;
      }

      .criteria-check {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
      }

      .check-item {
        padding: var(--spacing-sm);
        margin-bottom: var(--spacing-xs);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
      }

      .check-item.passed {
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
      }

      .check-item.failed {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }

      .check-item.pending {
        background: rgba(251, 191, 36, 0.1);
        color: #d97706;
      }

      .feedbacks-table {
        overflow-x: auto;
      }

      .quality-data-form .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
      }

      .quality-data-form .form-group {
        margin-bottom: var(--spacing-md);
      }

      .quality-data-form label {
        display: block;
        margin-bottom: var(--spacing-xs);
        font-weight: 500;
      }

      .quality-data-form .form-input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 1rem;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-lg);
        padding-top: var(--spacing-lg);
        border-top: 1px solid var(--border-color);
      }

      .empty-state {
        text-align: center;
        padding: calc(var(--spacing-xl) * 3);
        background: var(--bg-color);
        border-radius: var(--radius-lg);
        border: 2px dashed var(--border-color);
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
      }

      .empty-state h3 {
        font-size: 1.25rem;
        color: var(--text-primary);
        margin-bottom: var(--spacing-sm);
      }

      .empty-state p {
        color: var(--text-secondary);
      }

      .badge-success {
        background: #d1fae5;
        color: #059669;
      }

      .badge-danger {
        background: #fee2e2;
        color: #dc2626;
      }

      .text-warning {
        color: #d97706;
      }

      /* 功能說明樣式 */
      .info-content {
        max-height: 70vh;
        overflow-y: auto;
        padding: 0 var(--spacing-lg);
      }

      .info-section {
        margin-bottom: var(--spacing-xl);
        padding-bottom: var(--spacing-lg);
        border-bottom: 1px solid var(--border-color);
      }

      .info-section:last-child {
        border-bottom: none;
      }

      .info-section h3 {
        font-size: 1.25rem;
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
      }

      .info-section p {
        color: var(--text-secondary);
        line-height: 1.6;
        margin-bottom: var(--spacing-md);
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
      }

      .feature-card {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .feature-icon {
        font-size: 2rem;
        flex-shrink: 0;
      }

      .feature-content h4 {
        font-size: 1.125rem;
        margin-bottom: var(--spacing-sm);
        color: var(--text-primary);
      }

      .feature-content p {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .feature-detail {
        background: var(--bg-color);
        padding: var(--spacing-md);
        border-radius: var(--radius-sm);
        margin-top: var(--spacing-sm);
        font-size: 0.875rem;
      }

      .feature-detail strong {
        color: var(--text-primary);
        display: block;
        margin-bottom: var(--spacing-xs);
      }

      .feature-detail ul,
      .feature-detail ol {
        margin-left: var(--spacing-lg);
        margin-top: var(--spacing-xs);
      }

      .feature-detail li {
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
      }

      .formula {
        background: var(--primary-light);
        color: var(--primary-color);
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-weight: 600;
        margin: var(--spacing-sm) 0;
        text-align: center;
      }

      .benefits-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-md);
      }

      .benefit-item {
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        text-align: center;
      }

      .benefit-icon {
        font-size: 2rem;
        margin-bottom: var(--spacing-sm);
      }

      .benefit-item strong {
        display: block;
        margin-bottom: var(--spacing-xs);
        color: var(--text-primary);
      }

      .benefit-item p {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .usage-steps {
        margin-left: var(--spacing-xl);
      }

      .usage-steps li {
        margin-bottom: var(--spacing-md);
        line-height: 1.6;
        color: var(--text-secondary);
      }

      .usage-steps strong {
        color: var(--text-primary);
      }

      .info-footer {
        background: rgba(59, 130, 246, 0.1);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-top: var(--spacing-lg);
      }

      .info-footer .note {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.6;
      }

      .note {
        padding: var(--spacing-sm);
        background: rgba(251, 191, 36, 0.1);
        border-left: 3px solid #fbbf24;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-top: var(--spacing-sm);
      }

      .modal-wide {
        max-width: 1100px !important;
      }

      /* 認證表單樣式 */
      .form-hint {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: var(--spacing-xs) 0;
      }

      .reviewers-checkboxes {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        max-height: 200px;
        overflow-y: auto;
        padding: var(--spacing-sm);
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--bg-color);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s;
      }

      .checkbox-label:hover {
        background: var(--primary-light);
      }

      .checkbox-label input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      /* 審核主管列表顯示 */
      .reviewers-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .reviewer-item {
        display: inline-block;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
      }

      .reviewer-pending {
        background: rgba(251, 191, 36, 0.1);
        color: #d97706;
      }

      .reviewer-approved {
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
      }

      .reviewer-rejected {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }

      /* 待審核卡片樣式 */
      .pending-review-card {
        border: 2px solid #fbbf24;
        background: linear-gradient(to bottom, #fffbeb 0%, var(--bg-color) 50px);
      }

      .pending-badge {
        display: inline-block;
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: white;
        padding: var(--spacing-xs) var(--spacing-md);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
        box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
      }

      .certification-info {
        background: rgba(251, 191, 36, 0.1);
        padding: var(--spacing-md);
        border-radius: var(--radius-sm);
        margin-bottom: var(--spacing-md);
      }

      .certification-info .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-xs);
        font-size: 0.875rem;
      }

      .certification-info .info-row:last-child {
        margin-bottom: 0;
      }

      .quality-summary {
        margin-bottom: var(--spacing-md);
      }

      .quality-summary h4 {
        font-size: 1rem;
        margin-bottom: var(--spacing-sm);
        color: var(--text-primary);
      }

      .review-status {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-sm);
      }

      .review-status h4 {
        font-size: 1rem;
        margin-bottom: var(--spacing-sm);
        color: var(--text-primary);
      }

      .reviewer-item-detail {
        display: grid;
        grid-template-columns: 30px 1fr 150px 120px;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--bg-color);
        border-radius: var(--radius-sm);
        margin-bottom: var(--spacing-xs);
        font-size: 0.875rem;
      }

      .reviewer-item-detail.current-user {
        border: 2px solid var(--primary-color);
        background: rgba(59, 130, 246, 0.05);
      }

      .reviewer-order {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: var(--bg-secondary);
        border-radius: 50%;
        font-weight: 600;
        font-size: 0.75rem;
      }

      .reviewer-name {
        font-weight: 500;
        color: var(--text-primary);
      }

      .reviewer-dept {
        color: var(--text-secondary);
      }

      .reviewer-status {
        text-align: right;
        font-weight: 500;
      }

      .badge-score {
        background: var(--primary-light);
        color: var(--primary-color);
      }

      /* List View Table Styles */
      .table-container {
        background: white;
        border-radius: var(--radius-md);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
      }

      .recipes-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      .recipes-table thead {
        background: var(--bg-secondary);
      }

      .recipes-table th {
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        color: var(--text-primary);
        border-bottom: 2px solid var(--border-color);
        white-space: nowrap;
      }

      .recipes-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
        vertical-align: middle;
      }

      .recipes-table tbody tr {
        transition: background-color 0.15s;
      }

      .recipes-table tbody tr:hover {
        background: var(--bg-secondary);
      }

      .recipes-table tbody tr:last-child td {
        border-bottom: none;
      }

      .table-golden-badge {
        font-size: 1.25rem;
      }

      .table-recipe-name {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2px;
      }

      .table-recipe-no {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-family: monospace;
      }

      .table-score {
        font-size: 1.125rem;
        font-weight: 700;
      }

      .table-cert-info {
        font-size: 0.8125rem;
      }

      .table-cert-date {
        color: var(--text-secondary);
        font-size: 0.75rem;
        margin-top: 2px;
      }

      .table-actions {
        white-space: nowrap;
      }

      .btn-table {
        padding: 4px 12px;
        font-size: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: white;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.15s;
        margin-right: 4px;
      }

      .btn-table:last-child {
        margin-right: 0;
      }

      .btn-table.btn-detail {
        color: var(--primary-color);
        border-color: var(--primary-color);
      }

      .btn-table.btn-detail:hover {
        background: var(--primary-color);
        color: white;
      }

      .btn-table.btn-edit {
        color: var(--text-secondary);
      }

      .btn-table.btn-edit:hover {
        background: var(--bg-secondary);
        border-color: var(--text-primary);
        color: var(--text-primary);
      }
    `;
    document.head.appendChild(style);
  }
}
