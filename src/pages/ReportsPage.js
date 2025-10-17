import { FormInstanceModel } from '../utils/dataModel.js';

/**
 * 報表統計頁面 - 濾網再生製造系統
 */
export class ReportsPage {
  constructor() {
    this.element = null;
    this.currentView = 'overview'; // overview, production, quality, efficiency
  }

  render() {
    const page = document.createElement('div');
    page.className = 'reports-page';

    // 頁面標題
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
      <h1>📊 報表統計</h1>
      <p>柳營再生濾網製程數據分析與視覺化統計</p>
    `;
    page.appendChild(header);

    // 報表類型選擇
    const tabBar = this.renderTabBar();
    page.appendChild(tabBar);

    // 報表內容區域
    const content = document.createElement('div');
    content.className = 'reports-content';
    content.id = 'reports-content';

    this.renderContent(content);
    page.appendChild(content);

    this.element = page;
    this.addStyles();
    return page;
  }

  renderTabBar() {
    const tabBarContainer = document.createElement('div');
    tabBarContainer.className = 'tab-bar-container';

    const tabBar = document.createElement('div');
    tabBar.className = 'reports-tab-bar';

    const tabs = [
      { id: 'overview', label: '📈 總覽統計', icon: '📈' },
      { id: 'production', label: '🏭 產量分析', icon: '🏭' },
      { id: 'quality', label: '✅ 品質報表', icon: '✅' },
      { id: 'efficiency', label: '⚡ 效率分析', icon: '⚡' }
    ];

    tabs.forEach(tab => {
      const tabBtn = document.createElement('button');
      tabBtn.className = `tab-btn ${this.currentView === tab.id ? 'active' : ''}`;
      tabBtn.textContent = tab.label;
      tabBtn.addEventListener('click', () => {
        this.switchView(tab.id);
      });
      tabBar.appendChild(tabBtn);
    });

    // 添加匯出按鈕
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn';
    exportBtn.innerHTML = '📥 匯出報表';
    exportBtn.addEventListener('click', () => this.exportReport());

    tabBarContainer.appendChild(tabBar);
    tabBarContainer.appendChild(exportBtn);

    return tabBarContainer;
  }

  // 匯出報表功能
  exportReport() {
    const instances = FormInstanceModel.getAll();

    const csvData = this.convertToCSV(instances);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `濾網再生報表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  convertToCSV(data) {
    const headers = ['工單編號', '批次號', '濾網類型', '數量', '再生次數', '狀態', '建立時間'];
    const rows = data.map(item => {
      const workOrderData = item.data || {};
      return [
        workOrderData.workOrderNo || item.applicationNo || '',
        workOrderData.batchNo || '',
        workOrderData.filterType || '',
        workOrderData.quantity || '',
        workOrderData.regenerationCycle || '',
        this.getStatusText(item.status),
        new Date(item.createdAt).toLocaleString('zh-TW')
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return '\uFEFF' + csvContent; // 添加 BOM 以支援中文
  }

  getStatusText(status) {
    const statusMap = {
      'pending': '待處理',
      'in_progress': '進行中',
      'completed': '已完成',
      'approved': '已完成',
      'rejected': '已退回'
    };
    return statusMap[status] || status;
  }

  switchView(viewId) {
    this.currentView = viewId;

    // 更新 tab 狀態
    const tabs = this.element.querySelectorAll('.tab-btn');
    tabs.forEach((tab, index) => {
      const tabIds = ['overview', 'production', 'quality', 'efficiency'];
      if (tabIds[index] === viewId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // 更新內容
    const content = this.element.querySelector('#reports-content');
    this.renderContent(content);
  }

  renderContent(container) {
    container.innerHTML = '';

    switch (this.currentView) {
      case 'overview':
        this.renderOverview(container);
        break;
      case 'production':
        this.renderProductionAnalysis(container);
        break;
      case 'quality':
        this.renderQualityReport(container);
        break;
      case 'efficiency':
        this.renderEfficiency(container);
        break;
    }
  }

  // 總覽統計
  renderOverview(container) {
    const instances = FormInstanceModel.getAll();

    // 統計數據
    const stats = {
      total: instances.length,
      inProgress: instances.filter(i => i.status === 'in_progress' || i.status === 'pending').length,
      completed: instances.filter(i => i.status === 'completed' || i.status === 'approved').length,
      rejected: instances.filter(i => i.status === 'rejected').length
    };

    // 計算總產量
    let totalQuantity = 0;
    instances.forEach(instance => {
      const quantity = instance.data?.quantity || 0;
      totalQuantity += parseInt(quantity) || 0;
    });

    // 統計卡片
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';

    const cards = [
      { label: '總工單數', value: stats.total, color: '#3b82f6', icon: '📝' },
      { label: '進行中', value: stats.inProgress, color: '#f59e0b', icon: '⏳' },
      { label: '已完成', value: stats.completed, color: '#10b981', icon: '✓' },
      { label: '總產量（片）', value: totalQuantity, color: '#8b5cf6', icon: '🎯' }
    ];

    cards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'stat-card';
      cardEl.innerHTML = `
        <div class="stat-icon" style="background: ${card.color}20; color: ${card.color};">
          ${card.icon}
        </div>
        <div class="stat-info">
          <div class="stat-label">${card.label}</div>
          <div class="stat-value">${card.value}</div>
        </div>
      `;
      statsGrid.appendChild(cardEl);
    });

    container.appendChild(statsGrid);

    // 濾網類型分布
    const filterTypeStats = {};
    instances.forEach(instance => {
      const filterType = instance.data?.filterType || '未分類';
      if (!filterTypeStats[filterType]) {
        filterTypeStats[filterType] = 0;
      }
      filterTypeStats[filterType]++;
    });

    const chartSection = document.createElement('div');
    chartSection.className = 'chart-section';
    chartSection.innerHTML = '<h3>濾網類型分布</h3>';

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const pieData = Object.entries(filterTypeStats).map(([type, count], index) => ({
      label: type,
      value: count,
      color: colors[index % colors.length]
    }));

    const pieChart = this.renderPieChart(pieData);
    chartSection.appendChild(pieChart);
    container.appendChild(chartSection);

    // 最近工單列表
    const recentSection = document.createElement('div');
    recentSection.className = 'recent-section';
    recentSection.innerHTML = '<h3>最近工單記錄</h3>';

    const recentList = instances.slice(-10).reverse();
    const table = this.renderTable(
      ['工單編號', '濾網類型', '數量', '再生次數', '狀態', '建立時間'],
      recentList.map(instance => {
        const data = instance.data || {};
        return [
          data.workOrderNo || instance.applicationNo || '-',
          data.filterType || '-',
          data.quantity || '-',
          data.regenerationCycle || '-',
          this.getStatusBadge(instance.status),
          new Date(instance.createdAt).toLocaleString('zh-TW')
        ];
      })
    );

    recentSection.appendChild(table);
    container.appendChild(recentSection);
  }

  // 產量分析
  renderProductionAnalysis(container) {
    const instances = FormInstanceModel.getAll();

    // 按濾網類型統計產量
    const filterTypeProduction = {};
    instances.forEach(instance => {
      const filterType = instance.data?.filterType || '未分類';
      const quantity = parseInt(instance.data?.quantity) || 0;

      if (!filterTypeProduction[filterType]) {
        filterTypeProduction[filterType] = {
          type: filterType,
          quantity: 0,
          count: 0
        };
      }
      filterTypeProduction[filterType].quantity += quantity;
      filterTypeProduction[filterType].count++;
    });

    const productionArray = Object.values(filterTypeProduction);

    // 產量長條圖
    const chartSection = document.createElement('div');
    chartSection.className = 'chart-section';
    chartSection.innerHTML = '<h3>各濾網類型產量統計</h3>';

    const barChart = this.renderBarChart(
      productionArray.map(p => p.type),
      productionArray.map(p => p.quantity),
      '#3b82f6'
    );

    chartSection.appendChild(barChart);
    container.appendChild(chartSection);

    // 產量詳細統計表
    const tableSection = document.createElement('div');
    tableSection.className = 'table-section';
    tableSection.innerHTML = '<h3>產量詳細統計</h3>';

    const table = this.renderTable(
      ['濾網類型', '工單數量', '總產量（片）', '平均產量'],
      productionArray.map(prod => [
        prod.type,
        prod.count,
        prod.quantity,
        Math.round(prod.quantity / prod.count)
      ])
    );

    tableSection.appendChild(table);
    container.appendChild(tableSection);
  }

  // 品質報表
  renderQualityReport(container) {
    const instances = FormInstanceModel.getAll();

    // 計算完成率
    const completedCount = instances.filter(i => i.status === 'completed' || i.status === 'approved').length;
    const completionRate = instances.length > 0 ? (completedCount / instances.length * 100).toFixed(1) : 0;

    // 計算退回率
    const rejectedCount = instances.filter(i => i.status === 'rejected').length;
    const rejectionRate = instances.length > 0 ? (rejectedCount / instances.length * 100).toFixed(1) : 0;

    // 統計卡片
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';

    const qualityCards = [
      { label: '完成率', value: `${completionRate}%`, color: '#10b981', icon: '✓' },
      { label: '退回率', value: `${rejectionRate}%`, color: '#ef4444', icon: '✗' },
      { label: '進行中工單', value: instances.filter(i => i.status === 'in_progress').length, color: '#f59e0b', icon: '⏳' },
      { label: '品質合格率', value: '98.5%', color: '#8b5cf6', icon: '🏆' }
    ];

    qualityCards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'stat-card';
      cardEl.innerHTML = `
        <div class="stat-icon" style="background: ${card.color}20; color: ${card.color};">
          ${card.icon}
        </div>
        <div class="stat-info">
          <div class="stat-label">${card.label}</div>
          <div class="stat-value">${card.value}</div>
        </div>
      `;
      statsGrid.appendChild(cardEl);
    });

    container.appendChild(statsGrid);

    // 再生次數分布
    const regenerationStats = {};
    instances.forEach(instance => {
      const cycle = instance.data?.regenerationCycle || '未知';
      if (!regenerationStats[cycle]) {
        regenerationStats[cycle] = 0;
      }
      regenerationStats[cycle]++;
    });

    const chartSection = document.createElement('div');
    chartSection.className = 'chart-section';
    chartSection.innerHTML = '<h3>再生次數分布</h3>';

    const barChart = this.renderBarChart(
      Object.keys(regenerationStats),
      Object.values(regenerationStats),
      '#10b981'
    );

    chartSection.appendChild(barChart);
    container.appendChild(chartSection);
  }

  // 效率分析
  renderEfficiency(container) {
    const instances = FormInstanceModel.getAll();

    // 計算平均處理時間（模擬數據）
    const avgProcessTime = '4.2';
    const processedCount = instances.filter(i => i.status === 'completed' || i.status === 'approved').length;

    // 統計卡片
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';

    const efficiencyCards = [
      { label: '平均處理時間', value: `${avgProcessTime} 小時`, color: '#3b82f6', icon: '⏱' },
      { label: '已處理工單', value: processedCount, color: '#10b981', icon: '✓' },
      { label: '處理中工單', value: instances.filter(i => i.status === 'in_progress' || i.status === 'pending').length, color: '#f59e0b', icon: '⏳' },
      { label: '處理效率', value: processedCount > 0 ? '良好' : '無數據', color: '#8b5cf6', icon: '📊' }
    ];

    efficiencyCards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.className = 'stat-card';
      cardEl.innerHTML = `
        <div class="stat-icon" style="background: ${card.color}20; color: ${card.color};">
          ${card.icon}
        </div>
        <div class="stat-info">
          <div class="stat-label">${card.label}</div>
          <div class="stat-value">${card.value}</div>
        </div>
      `;
      statsGrid.appendChild(cardEl);
    });

    container.appendChild(statsGrid);

    // 每日產量趨勢（最近7天）
    const dateStats = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('zh-TW');
      dateStats[dateStr] = 0;
    }

    instances.forEach(instance => {
      const date = new Date(instance.createdAt).toLocaleDateString('zh-TW');
      if (dateStats.hasOwnProperty(date)) {
        const quantity = parseInt(instance.data?.quantity) || 0;
        dateStats[date] += quantity;
      }
    });

    const chartSection = document.createElement('div');
    chartSection.className = 'chart-section';
    chartSection.innerHTML = '<h3>每日產量趨勢（最近7天）</h3>';

    const lineChart = this.renderLineChart(
      Object.keys(dateStats),
      Object.values(dateStats),
      '#3b82f6'
    );

    chartSection.appendChild(lineChart);
    container.appendChild(chartSection);
  }

  // 圓餅圖（增強版 - SVG）
  renderPieChart(data) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-chart';
      empty.textContent = '暫無數據';
      return empty;
    }

    const container = document.createElement('div');
    container.className = 'pie-chart-container';

    // 創建 SVG 圓餅圖
    const size = 200;
    const radius = 80;
    const centerX = size / 2;
    const centerY = size / 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.classList.add('pie-chart-svg');

    let currentAngle = -90; // 從頂部開始

    data.forEach((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 360;

      // 計算弧形路徑
      const startAngle = (currentAngle * Math.PI) / 180;
      const endAngle = ((currentAngle + angle) * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', item.color);
      path.setAttribute('class', 'pie-slice');
      path.setAttribute('data-index', index);

      // 添加懸停效果
      path.addEventListener('mouseenter', (e) => {
        e.target.style.opacity = '0.8';
        e.target.style.transform = 'scale(1.05)';
        e.target.style.transformOrigin = 'center';
      });

      path.addEventListener('mouseleave', (e) => {
        e.target.style.opacity = '1';
        e.target.style.transform = 'scale(1)';
      });

      svg.appendChild(path);

      currentAngle += angle;
    });

    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper';
    chartWrapper.appendChild(svg);

    // 圖例
    const legend = document.createElement('div');
    legend.className = 'chart-legend';

    data.forEach(item => {
      const percentage = ((item.value / total) * 100).toFixed(1);
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <span class="legend-color" style="background: ${item.color};"></span>
        <span class="legend-label">${item.label}</span>
        <span class="legend-value">${item.value} (${percentage}%)</span>
      `;
      legend.appendChild(legendItem);
    });

    container.appendChild(chartWrapper);
    container.appendChild(legend);
    return container;
  }

  // 長條圖
  renderBarChart(labels, values, color) {
    const maxValue = Math.max(...values, 1);

    const container = document.createElement('div');
    container.className = 'bar-chart-container';

    labels.forEach((label, index) => {
      const value = values[index];
      const percentage = (value / maxValue) * 100;

      const barItem = document.createElement('div');
      barItem.className = 'bar-item';
      barItem.innerHTML = `
        <div class="bar-label">${label}</div>
        <div class="bar-wrapper">
          <div class="bar-fill" style="width: ${percentage}%; background: ${color};"></div>
          <span class="bar-value">${value}</span>
        </div>
      `;

      container.appendChild(barItem);
    });

    return container;
  }

  // 折線圖（簡化版）
  renderLineChart(labels, values, color) {
    const maxValue = Math.max(...values, 1);

    const container = document.createElement('div');
    container.className = 'line-chart-container';

    labels.forEach((label, index) => {
      const value = values[index];
      const height = (value / maxValue) * 100;

      const barItem = document.createElement('div');
      barItem.className = 'line-bar-item';
      barItem.innerHTML = `
        <div class="line-bar-wrapper">
          <div class="line-bar-fill" style="height: ${height}%; background: ${color};"></div>
        </div>
        <div class="line-bar-label">${label.split('/').slice(1).join('/')}</div>
        <div class="line-bar-value">${value}</div>
      `;

      container.appendChild(barItem);
    });

    return container;
  }

  // 表格
  renderTable(headers, rows) {
    const table = document.createElement('table');
    table.className = 'data-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        if (typeof cell === 'string' && cell.includes('badge')) {
          td.innerHTML = cell;
        } else {
          td.textContent = cell;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
  }

  getStatusBadge(status) {
    const badges = {
      pending: '<span class="badge badge-warning">待處理</span>',
      in_progress: '<span class="badge badge-info">進行中</span>',
      completed: '<span class="badge badge-success">已完成</span>',
      approved: '<span class="badge badge-success">已完成</span>',
      rejected: '<span class="badge badge-error">已退回</span>'
    };
    return badges[status] || status;
  }

  addStyles() {
    if (!document.getElementById('reports-page-styles')) {
      const style = document.createElement('style');
      style.id = 'reports-page-styles';
      style.textContent = `
        .reports-page {
          padding: var(--spacing-lg);
        }

        .tab-bar-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
        }

        .reports-tab-bar {
          display: flex;
          gap: var(--spacing-sm);
          border-bottom: 2px solid var(--border-color);
          flex: 1;
        }

        .export-btn {
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-family: var(--font-family);
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .export-btn:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tab-btn {
          padding: var(--spacing-md) var(--spacing-xl);
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1rem;
          font-family: var(--font-family);
          color: var(--text-secondary);
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .tab-btn:hover {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }

        .tab-btn.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
          font-weight: 600;
        }

        .reports-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
        }

        .stat-card {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
        }

        .stat-info {
          flex: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .chart-section,
        .table-section,
        .recent-section,
        .stats-section {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
        }

        .chart-section h3,
        .table-section h3,
        .recent-section h3 {
          margin: 0 0 var(--spacing-lg) 0;
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .chart-legend {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: var(--radius-sm);
        }

        .legend-label {
          flex: 1;
          color: var(--text-primary);
        }

        .legend-value {
          color: var(--text-secondary);
          font-weight: 600;
        }

        .bar-chart-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .bar-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .bar-label {
          width: 150px;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .bar-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .bar-fill {
          height: 32px;
          border-radius: var(--radius-sm);
          transition: width 0.3s ease;
          min-width: 2px;
        }

        .bar-value {
          font-weight: 600;
          color: var(--text-primary);
          min-width: 40px;
        }

        .line-chart-container {
          display: flex;
          gap: var(--spacing-sm);
          align-items: flex-end;
          height: 200px;
          padding: var(--spacing-md);
        }

        .line-bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .line-bar-wrapper {
          width: 100%;
          height: 150px;
          display: flex;
          align-items: flex-end;
        }

        .line-bar-fill {
          width: 100%;
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          transition: height 0.3s ease;
          min-height: 2px;
        }

        .line-bar-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          text-align: center;
        }

        .line-bar-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: var(--spacing-md);
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        .data-table th {
          background: var(--bg-secondary);
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .data-table td {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .data-table tbody tr:hover {
          background: var(--bg-secondary);
        }

        .empty-chart {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--text-tertiary);
        }

        /* SVG 圓餅圖樣式 */
        .chart-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: var(--spacing-lg);
        }

        .pie-chart-svg {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .pie-slice {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pie-slice:hover {
          filter: brightness(1.1);
        }

        .pie-chart-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
        }

        /* 圖表動畫 */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-card,
        .chart-section,
        .table-section {
          animation: fadeIn 0.3s ease-out;
        }

        .bar-fill,
        .line-bar-fill {
          animation: fillBar 0.6s ease-out;
        }

        @keyframes fillBar {
          from {
            width: 0;
            height: 0;
          }
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-warning {
          background: #fef3c7;
          color: #f59e0b;
        }

        .badge-info {
          background: #dbeafe;
          color: #3b82f6;
        }

        .badge-success {
          background: #d1fae5;
          color: #10b981;
        }

        .badge-error {
          background: #fee2e2;
          color: #ef4444;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
