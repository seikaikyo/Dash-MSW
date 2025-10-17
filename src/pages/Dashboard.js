import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { FormInstanceModel } from '../utils/dataModel.js';
import { ApprovalEngine } from '../utils/approvalEngine.js';
import { authService } from '../utils/authService.js';

export function DashboardPage() {
  const container = document.createElement('div');
  container.className = 'dashboard-page';

  // 取得當前使用者
  const currentUser = authService.getCurrentUser();

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <h2>♻️ MSW 濾網再生製造系統</h2>
    <p class="text-secondary">歡迎使用 Dash MSW - 柳營再生濾網製程管理系統，${currentUser?.name || '使用者'}</p>
  `;
  container.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'dashboard-grid';

  // 計算實際統計數字
  const allInstances = FormInstanceModel.getAll();

  // 進行中工單
  const runningCount = allInstances.filter(i => i.status === 'pending' || i.status === 'in_progress').length;

  // 總工單數
  const totalCount = allInstances.length;

  // 已完成工單
  const completedCount = allInstances.filter(i => i.status === 'approved' || i.status === 'completed').length;

  // 今日處理量（模擬數據）
  const todayProcessed = Math.floor(Math.random() * 50) + 100;

  // 統計卡片
  const statsCards = [
    { title: '進行中工單', count: runningCount.toString(), color: 'primary', icon: '⚙️', link: '#/forms' },
    { title: '總工單數', count: totalCount.toString(), color: 'info', icon: '📝', link: '#/forms' },
    { title: '已完成', count: completedCount.toString(), color: 'success', icon: '✅', link: '#/forms' },
    { title: '今日處理量', count: `${todayProcessed} 件`, color: 'warning', icon: '📊', link: '#/stations' }
  ];

  statsCards.forEach(stat => {
    const cardEl = document.createElement('a');
    cardEl.href = stat.link;
    cardEl.className = 'stat-card-link';
    cardEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">${stat.icon}</div>
        <div class="stat-count">${stat.count}</div>
        <div class="stat-title">${stat.title}</div>
      </div>
    `;
    grid.appendChild(cardEl);
  });

  container.appendChild(grid);

  // 快速操作
  const quickActions = document.createElement('div');
  quickActions.className = 'quick-actions';
  quickActions.style.marginTop = 'var(--spacing-xl)';

  const actionsCard = new Card({
    title: '快速操作',
    content: createQuickActionsContent()
  });

  container.appendChild(actionsCard.render());

  addStyles();
  return container;
}

function createQuickActionsContent() {
  const div = document.createElement('div');
  div.className = 'actions-grid';

  const actions = [
    { text: '建立工單', icon: '📝', href: '#/apply' },
    { text: '製程站點', icon: '🏭', href: '#/stations' },
    { text: 'WMS 倉儲', icon: '📦', href: '#/wms' },
    { text: '能源管理', icon: '⚡', href: '#/energy' },
    { text: 'Golden Recipe', icon: '🏆', href: '#/golden' },
    { text: 'SPC 品管', icon: '📊', href: '#/spc' },
    { text: '測試中心', icon: '🧪', href: '#/test' },
    { text: '系統模擬器', icon: '🎮', href: '#/simulator' }
  ];

  actions.forEach(action => {
    const actionBtn = document.createElement('a');
    actionBtn.href = action.href;
    actionBtn.className = 'action-item';
    actionBtn.innerHTML = `
      <div class="action-icon">${action.icon}</div>
      <div class="action-text">${action.text}</div>
    `;
    div.appendChild(actionBtn);
  });

  return div;
}

function addStyles() {
  if (!document.getElementById('dashboard-styles')) {
    const style = document.createElement('style');
    style.id = 'dashboard-styles';
    style.textContent = `
      .page-header {
        margin-bottom: var(--spacing-xl);
      }

      .page-header h2 {
        font-size: 1.875rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--spacing-sm);
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
      }

      .stat-card-link {
        display: block;
        text-decoration: none;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        transition: all 0.2s;
      }

      .stat-card-link:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--primary-color);
      }

      .stat-card {
        text-align: center;
        padding: var(--spacing-xl);
      }

      .stat-icon {
        font-size: 2.5rem;
        margin-bottom: var(--spacing-sm);
      }

      .stat-count {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: var(--spacing-sm);
      }

      .stat-title {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg);
      }

      .action-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--spacing-xl);
        border: 2px dashed var(--border-color);
        border-radius: var(--radius-lg);
        text-decoration: none;
        transition: all 0.2s;
        cursor: pointer;
      }

      .action-item:hover {
        border-color: var(--primary-color);
        background: var(--primary-light);
      }

      .action-icon {
        font-size: 3rem;
        margin-bottom: var(--spacing-md);
      }

      .action-text {
        font-weight: 500;
        color: var(--text-primary);
      }
    `;
    document.head.appendChild(style);
  }
}
