/**
 * 生管派工頁面
 * 批次建立工單、生產排程、派工管理
 */

import { FormInstanceModel } from '../utils/dataModel.js';
import { WorkOrderNumberGenerator } from '../utils/workOrderNumberGenerator.js';
import { userContext } from '../utils/userContext.js';
import { Button } from '../components/common/Button.js';

export function DispatchPage() {
  const container = document.createElement('div');
  container.className = 'dispatch-page';

  const currentUser = userContext.getCurrentUser();

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <h2>🏭 生管派工</h2>
    <p class="text-secondary">批次建立工單、生產排程與派工管理</p>
  `;
  container.appendChild(header);

  // 統計卡片區
  const statsSection = createStatsSection();
  container.appendChild(statsSection);

  // 批次開單區
  const batchCreateSection = createBatchCreateSection();
  container.appendChild(batchCreateSection);

  // 排程視圖區（取代工單列表）
  const scheduleViewSection = createScheduleViewSection();
  container.appendChild(scheduleViewSection);

  addStyles();
  return container;

  // ========== 功能函數 ==========

  /**
   * 建立統計卡片區
   */
  function createStatsSection() {
    const section = document.createElement('div');
    section.className = 'stats-section';

    const allWorkOrders = FormInstanceModel.getAll();
    const pending = allWorkOrders.filter(wo => wo.status === 'pending').length;
    const inProgress = allWorkOrders.filter(wo => wo.status === 'in_progress').length;
    const completed = allWorkOrders.filter(wo => wo.status === 'completed' || wo.status === 'approved').length;
    const total = allWorkOrders.length;

    section.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">總工單數</div>
            <div class="stat-value">${total}</div>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-label">待處理</div>
            <div class="stat-value">${pending}</div>
          </div>
        </div>
        <div class="stat-card progress">
          <div class="stat-icon">⚙️</div>
          <div class="stat-content">
            <div class="stat-label">進行中</div>
            <div class="stat-value">${inProgress}</div>
          </div>
        </div>
        <div class="stat-card completed">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-label">已完成</div>
            <div class="stat-value">${completed}</div>
          </div>
        </div>
      </div>
    `;

    return section;
  }

  /**
   * 建立批次開單區
   */
  function createBatchCreateSection() {
    const section = document.createElement('div');
    section.className = 'batch-create-section card';

    section.innerHTML = `
      <div class="card-header">
        <h3>📝 批次建立工單</h3>
      </div>
      <div class="card-body">
        <div class="batch-form">
          <div class="form-row">
            <div class="form-field">
              <label>濾網類型 <span class="required">*</span></label>
              <select id="filter-type" class="form-input">
                <option value="">請選擇...</option>
                <option value="活性碳濾網">活性碳濾網</option>
                <option value="化學濾網">化學濾網</option>
                <option value="複合濾網">複合濾網</option>
                <option value="高效濾網">高效濾網</option>
              </select>
            </div>

            <div class="form-field">
              <label>來源廠別 <span class="required">*</span></label>
              <select id="source-factory" class="form-input">
                <option value="">請選擇...</option>
                <option value="柳營廠">柳營廠</option>
                <option value="台南廠">台南廠</option>
                <option value="高雄廠">高雄廠</option>
                <option value="桃園廠">桃園廠</option>
              </select>
            </div>

            <div class="form-field">
              <label>再生次數 <span class="required">*</span></label>
              <select id="regeneration-cycle" class="form-input">
                <option value="">請選擇...</option>
                <option value="R0 (首次再生)">R0 (首次再生)</option>
                <option value="R1 (第二次)">R1 (第二次)</option>
                <option value="R2 (第三次)">R2 (第三次)</option>
                <option value="R3 (第四次)">R3 (第四次)</option>
                <option value="R4 (第五次)">R4 (第五次)</option>
                <option value="R5 (第六次)">R5 (第六次)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>每批數量 (片) <span class="required">*</span></label>
              <input type="number" id="quantity-per-batch" class="form-input" min="1" max="48" value="18" placeholder="每批濾網片數 (1-48)">
              <small class="field-hint">標準 Pallet 容量: 18片，最大: 48片</small>
            </div>

            <div class="form-field">
              <label>批次數量 <span class="required">*</span></label>
              <input type="number" id="batch-count" class="form-input" min="1" max="50" value="5" placeholder="要建立幾批工單">
              <small class="field-hint">一次最多建立 50 批工單</small>
            </div>

            <div class="form-field">
              <label>備註</label>
              <input type="text" id="remarks" class="form-input" placeholder="選填...">
            </div>
          </div>

          <div class="preview-section" id="preview-section" style="display: none;">
            <h4>📋 預覽將建立的工單</h4>
            <div id="preview-content"></div>
          </div>

          <div class="action-buttons">
            <button class="btn-secondary" id="btn-preview">👁️ 預覽</button>
            <button class="btn-primary" id="btn-create-batch">✓ 批次建立</button>
          </div>
        </div>
      </div>
    `;

    // 綁定事件
    setTimeout(() => {
      const previewBtn = section.querySelector('#btn-preview');
      const createBtn = section.querySelector('#btn-create-batch');

      previewBtn.addEventListener('click', handlePreview);
      createBtn.addEventListener('click', handleBatchCreate);
    }, 0);

    return section;
  }

  /**
   * 預覽將建立的工單
   */
  function handlePreview() {
    const formData = getFormData();
    if (!validateFormData(formData)) return;

    const previewSection = document.getElementById('preview-section');
    const previewContent = document.getElementById('preview-content');

    const totalQuantity = formData.quantityPerBatch * formData.batchCount;
    const previewNumbers = [];

    for (let i = 0; i < Math.min(formData.batchCount, 5); i++) {
      previewNumbers.push(WorkOrderNumberGenerator.preview());
    }

    previewContent.innerHTML = `
      <div class="preview-info">
        <div class="preview-item">
          <strong>濾網類型：</strong>${formData.filterType}
        </div>
        <div class="preview-item">
          <strong>來源廠別：</strong>${formData.sourceFactory}
        </div>
        <div class="preview-item">
          <strong>再生次數：</strong>${formData.regenerationCycle}
        </div>
        <div class="preview-item">
          <strong>批次數量：</strong>${formData.batchCount} 批
        </div>
        <div class="preview-item">
          <strong>每批數量：</strong>${formData.quantityPerBatch} 片
        </div>
        <div class="preview-item highlight">
          <strong>總數量：</strong>${totalQuantity} 片
        </div>
        <div class="preview-item">
          <strong>工單號範例：</strong>
          <div class="preview-numbers">
            ${previewNumbers.map((no, idx) => `<span class="preview-no">${no}</span>`).join('')}
            ${formData.batchCount > 5 ? '<span class="preview-more">... 等</span>' : ''}
          </div>
        </div>
      </div>
    `;

    previewSection.style.display = 'block';
  }

  /**
   * 批次建立工單
   */
  function handleBatchCreate() {
    const formData = getFormData();
    if (!validateFormData(formData)) return;

    if (!confirm(`確定要建立 ${formData.batchCount} 批工單嗎？\n總共 ${formData.quantityPerBatch * formData.batchCount} 片濾網`)) {
      return;
    }

    const createdWorkOrders = [];
    const now = Date.now();

    // 清除之前的批次追蹤
    WorkOrderNumberGenerator.clearSession();

    for (let i = 0; i < formData.batchCount; i++) {
      const workOrderNo = WorkOrderNumberGenerator.generate();
      const batchNo = `BATCH-${workOrderNo.replace('MSW-', '')}`;

      const workOrderData = {
        workOrderNo: workOrderNo,
        batchNo: batchNo,
        sourceFactory: formData.sourceFactory,
        filterType: formData.filterType,
        quantity: formData.quantityPerBatch,
        regenerationCycle: formData.regenerationCycle,
        remarks: formData.remarks || '',
        // 預設空值，等待站點作業填寫
        deglueOperator: '',
        deglueStartTime: '',
        deglueEndTime: '',
        ovenId: '',
        targetTemp: '',
        bakingTime: '',
        ovenStartTime: '',
        ovenEndTime: '',
        degassingTest: '待檢驗',
        aoiResult: '待檢驗',
        rfidUpdate: '待更換',
        palletId: '',
        warehouseLocation: '',
        createdBy: currentUser ? currentUser.name : '生管',
        createdAt: now + (i * 1000) // 每批間隔1秒，避免時間戳完全相同
      };

      const instance = new FormInstanceModel({
        applicationNo: workOrderNo,
        formName: '柳營再生濾網工單',
        applicant: currentUser ? currentUser.name : '生管',
        department: currentUser ? currentUser.department : '生管部',
        data: workOrderData,
        status: 'pending'
      });

      instance.createdAt = workOrderData.createdAt;
      instance.save();
      createdWorkOrders.push(workOrderNo);
    }

    // 批次建立完成後清除追蹤
    WorkOrderNumberGenerator.clearSession();

    alert(`✅ 成功建立 ${formData.batchCount} 批工單！\n\n工單號範圍：\n${createdWorkOrders[0]} ~ ${createdWorkOrders[createdWorkOrders.length - 1]}`);

    // 清空表單
    document.getElementById('filter-type').value = '';
    document.getElementById('source-factory').value = '';
    document.getElementById('regeneration-cycle').value = '';
    document.getElementById('batch-count').value = '5';
    document.getElementById('quantity-per-batch').value = '18';
    document.getElementById('remarks').value = '';
    document.getElementById('preview-section').style.display = 'none';

    // 重新載入工單列表
    const listSection = document.querySelector('.work-order-list-section');
    if (listSection) {
      const newListSection = createWorkOrderListSection();
      listSection.replaceWith(newListSection);
    }

    // 更新統計
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
      const newStatsSection = createStatsSection();
      statsSection.replaceWith(newStatsSection);
    }
  }

  /**
   * 取得表單資料
   */
  function getFormData() {
    return {
      filterType: document.getElementById('filter-type').value,
      sourceFactory: document.getElementById('source-factory').value,
      regenerationCycle: document.getElementById('regeneration-cycle').value,
      quantityPerBatch: parseInt(document.getElementById('quantity-per-batch').value),
      batchCount: parseInt(document.getElementById('batch-count').value),
      remarks: document.getElementById('remarks').value
    };
  }

  /**
   * 驗證表單資料
   */
  function validateFormData(data) {
    if (!data.filterType) {
      alert('請選擇濾網類型');
      return false;
    }
    if (!data.sourceFactory) {
      alert('請選擇來源廠別');
      return false;
    }
    if (!data.regenerationCycle) {
      alert('請選擇再生次數');
      return false;
    }
    if (!data.quantityPerBatch || data.quantityPerBatch < 1 || data.quantityPerBatch > 48) {
      alert('每批數量必須在 1-48 之間');
      return false;
    }
    if (!data.batchCount || data.batchCount < 1 || data.batchCount > 50) {
      alert('批次數量必須在 1-50 之間');
      return false;
    }
    return true;
  }

  /**
   * 建立排程視圖區（整合三種視圖）
   */
  function createScheduleViewSection() {
    const section = document.createElement('div');
    section.className = 'schedule-view-section card';

    section.innerHTML = `
      <div class="card-header">
        <h3>📅 生產排程視圖</h3>
        <div class="view-tabs">
          <button class="view-tab active" data-view="calendar">📅 日曆視圖</button>
          <button class="view-tab" data-view="gantt">📊 甘特圖</button>
          <button class="view-tab" data-view="kanban">📋 看板視圖</button>
        </div>
      </div>
      <div class="card-body">
        <div id="view-container"></div>
      </div>
    `;

    // 初始化視圖
    setTimeout(() => {
      const viewContainer = section.querySelector('#view-container');
      const tabs = section.querySelectorAll('.view-tab');

      // 預設顯示日曆視圖
      viewContainer.innerHTML = renderCalendarView();

      // 綁定切換事件
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // 更新 active 狀態
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          // 切換視圖
          const view = tab.dataset.view;
          switch (view) {
            case 'calendar':
              viewContainer.innerHTML = renderCalendarView();
              break;
            case 'gantt':
              viewContainer.innerHTML = renderGanttView();
              break;
            case 'kanban':
              viewContainer.innerHTML = renderKanbanView();
              initKanbanDragDrop();
              break;
          }
        });
      });
    }, 0);

    return section;
  }

  /**
   * 渲染日曆視圖
   */
  function renderCalendarView() {
    const allWorkOrders = FormInstanceModel.getAll();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // 取得當月第一天和最後一天
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();

    // 按日期分組工單
    const workOrdersByDate = {};
    allWorkOrders.forEach(wo => {
      const createdDate = new Date(wo.createdAt);
      const dateKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(createdDate.getDate()).padStart(2, '0')}`;
      if (!workOrdersByDate[dateKey]) {
        workOrdersByDate[dateKey] = [];
      }
      workOrdersByDate[dateKey].push(wo);
    });

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    let calendarHTML = `
      <div class="calendar-container">
        <div class="calendar-header">
          <h3>${currentYear} 年 ${monthNames[currentMonth]}</h3>
          <div class="calendar-legend">
            <span class="legend-item"><span class="legend-dot pending"></span>待處理</span>
            <span class="legend-item"><span class="legend-dot progress"></span>進行中</span>
            <span class="legend-item"><span class="legend-dot completed"></span>已完成</span>
          </div>
        </div>
        <div class="calendar-grid">
          <div class="calendar-weekdays">
            ${weekDays.map(day => `<div class="weekday">${day}</div>`).join('')}
          </div>
          <div class="calendar-days">
    `;

    // 填充空白日期
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarHTML += `<div class="calendar-day empty"></div>`;
    }

    // 填充實際日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayWorkOrders = workOrdersByDate[dateKey] || [];
      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

      const pending = dayWorkOrders.filter(wo => wo.status === 'pending').length;
      const inProgress = dayWorkOrders.filter(wo => wo.status === 'in_progress').length;
      const completed = dayWorkOrders.filter(wo => wo.status === 'completed' || wo.status === 'approved').length;

      calendarHTML += `
        <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateKey}">
          <div class="day-number">${day}</div>
          ${dayWorkOrders.length > 0 ? `
            <div class="day-orders">
              ${pending > 0 ? `<span class="order-badge pending" title="待處理">${pending}</span>` : ''}
              ${inProgress > 0 ? `<span class="order-badge progress" title="進行中">${inProgress}</span>` : ''}
              ${completed > 0 ? `<span class="order-badge completed" title="已完成">${completed}</span>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }

    calendarHTML += `
          </div>
        </div>
      </div>
    `;

    return calendarHTML;
  }

  /**
   * 渲染甘特圖視圖
   */
  function renderGanttView() {
    const allWorkOrders = FormInstanceModel.getAll()
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, 20); // 只顯示最近 20 筆

    if (allWorkOrders.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">📭</div><div>尚無工單資料</div></div>`;
    }

    const stations = ['除膠', '烘箱', '釋氣測試', 'AOI檢測', 'RFID', '包裝', '入庫'];

    let ganttHTML = `
      <div class="gantt-container">
        <div class="gantt-header">
          <h4>工單進度甘特圖（最近 20 筆）</h4>
        </div>
        <div class="gantt-chart">
    `;

    allWorkOrders.forEach(wo => {
      // 計算進度
      let completedStations = 0;
      if (wo.data.deglueEndTime) completedStations++;
      if (wo.data.ovenEndTime) completedStations++;
      if (wo.data.degassingTest === '合格') completedStations++;
      if (wo.data.aoiResult === 'OK') completedStations++;
      if (wo.data.rfidUpdate === '已更換') completedStations++;
      if (wo.data.palletId) completedStations++;
      if (wo.data.warehouseLocation) completedStations++;

      const progress = Math.round((completedStations / stations.length) * 100);
      const statusColor = wo.status === 'completed' || wo.status === 'approved' ? '#10b981' :
                          wo.status === 'in_progress' ? '#3b82f6' : '#f59e0b';

      ganttHTML += `
        <div class="gantt-row">
          <div class="gantt-label">
            <div class="gantt-wo-no">${wo.data.workOrderNo || wo.applicationNo}</div>
            <div class="gantt-wo-info">${wo.data.filterType} ${wo.data.quantity}片</div>
          </div>
          <div class="gantt-bar-container">
            <div class="gantt-bar" style="width: ${progress}%; background: ${statusColor};">
              <span class="gantt-progress">${progress}%</span>
            </div>
          </div>
          <div class="gantt-stations">
            ${stations.map((station, idx) => {
              const isCompleted = idx < completedStations;
              return `<span class="station-dot ${isCompleted ? 'completed' : ''}" title="${station}"></span>`;
            }).join('')}
          </div>
        </div>
      `;
    });

    ganttHTML += `
        </div>
      </div>
    `;

    return ganttHTML;
  }

  /**
   * 渲染看板視圖
   */
  function renderKanbanView() {
    const allWorkOrders = FormInstanceModel.getAll();

    const pending = allWorkOrders.filter(wo => wo.status === 'pending');
    const inProgress = allWorkOrders.filter(wo => wo.status === 'in_progress');
    const completed = allWorkOrders.filter(wo => wo.status === 'completed' || wo.status === 'approved');

    const renderKanbanCards = (workOrders) => {
      if (workOrders.length === 0) {
        return `<div class="kanban-empty">暫無工單</div>`;
      }

      return workOrders.map(wo => `
        <div class="kanban-card" data-id="${wo.id}" data-status="${wo.status}">
          <div class="kanban-card-header">
            <strong>${wo.data.workOrderNo || wo.applicationNo}</strong>
          </div>
          <div class="kanban-card-body">
            <div class="kanban-info">📦 ${wo.data.filterType}</div>
            <div class="kanban-info">🏭 ${wo.data.sourceFactory}</div>
            <div class="kanban-info">📊 ${wo.data.quantity} 片</div>
            <div class="kanban-info">🔄 ${wo.data.regenerationCycle}</div>
          </div>
          <div class="kanban-card-footer">
            <small>${new Date(wo.createdAt).toLocaleDateString('zh-TW')}</small>
          </div>
        </div>
      `).join('');
    };

    return `
      <div class="kanban-container">
        <div class="kanban-column pending">
          <div class="kanban-column-header">
            <h4>⏳ 待處理</h4>
            <span class="kanban-count">${pending.length}</span>
          </div>
          <div class="kanban-column-body" data-status="pending">
            ${renderKanbanCards(pending)}
          </div>
        </div>
        <div class="kanban-column progress">
          <div class="kanban-column-header">
            <h4>⚙️ 進行中</h4>
            <span class="kanban-count">${inProgress.length}</span>
          </div>
          <div class="kanban-column-body" data-status="in_progress">
            ${renderKanbanCards(inProgress)}
          </div>
        </div>
        <div class="kanban-column completed">
          <div class="kanban-column-header">
            <h4>✅ 已完成</h4>
            <span class="kanban-count">${completed.length}</span>
          </div>
          <div class="kanban-column-body" data-status="completed">
            ${renderKanbanCards(completed)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 初始化看板拖拽功能
   */
  function initKanbanDragDrop() {
    // 簡單的拖拽實現（未來可以整合更完整的拖拽庫）
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-column-body');

    cards.forEach(card => {
      card.setAttribute('draggable', 'true');

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });

    columns.forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.classList.add('drag-over');
      });

      column.addEventListener('dragleave', () => {
        column.classList.remove('drag-over');
      });

      column.addEventListener('drop', (e) => {
        e.preventDefault();
        column.classList.remove('drag-over');

        const card = document.querySelector('.dragging');
        if (card) {
          const newStatus = column.dataset.status;
          const woId = card.dataset.id;

          // 更新工單狀態
          const wo = FormInstanceModel.getById(woId);
          if (wo) {
            wo.status = newStatus;
            wo.save();

            // 重新渲染看板
            const viewContainer = document.querySelector('#view-container');
            viewContainer.innerHTML = renderKanbanView();
            initKanbanDragDrop();

            // 更新統計
            const statsSection = document.querySelector('.stats-section');
            if (statsSection) {
              statsSection.replaceWith(createStatsSection());
            }
          }
        }
      });
    });
  }

  /**
   * 建立工單列表區（已廢棄，整合到排程視圖）
   */
  function createWorkOrderListSection() {
    const section = document.createElement('div');
    section.className = 'work-order-list-section card';

    const allWorkOrders = FormInstanceModel.getAll();
    // 按建立時間排序，最新的在前
    allWorkOrders.sort((a, b) => b.createdAt - a.createdAt);

    section.innerHTML = `
      <div class="card-header">
        <h3>📋 工單列表</h3>
        <div class="header-actions">
          <select id="status-filter" class="filter-select">
            <option value="all">全部狀態</option>
            <option value="pending">待處理</option>
            <option value="in_progress">進行中</option>
            <option value="completed">已完成</option>
            <option value="approved">已核准</option>
          </select>
        </div>
      </div>
      <div class="card-body">
        <div class="work-order-table-container">
          <table class="work-order-table">
            <thead>
              <tr>
                <th>工單號</th>
                <th>批次號</th>
                <th>濾網類型</th>
                <th>來源廠別</th>
                <th>數量</th>
                <th>再生次數</th>
                <th>狀態</th>
                <th>建立時間</th>
                <th>建立人</th>
              </tr>
            </thead>
            <tbody id="work-order-tbody">
              ${renderWorkOrderRows(allWorkOrders)}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 綁定篩選事件
    setTimeout(() => {
      const statusFilter = section.querySelector('#status-filter');
      if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
          const tbody = section.querySelector('#work-order-tbody');
          const filteredOrders = e.target.value === 'all'
            ? allWorkOrders
            : allWorkOrders.filter(wo => wo.status === e.target.value);
          tbody.innerHTML = renderWorkOrderRows(filteredOrders);
        });
      }
    }, 0);

    return section;
  }

  /**
   * 渲染工單表格行
   */
  function renderWorkOrderRows(workOrders) {
    if (workOrders.length === 0) {
      return `
        <tr>
          <td colspan="9" class="empty-row">
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <div>尚無工單資料</div>
            </div>
          </td>
        </tr>
      `;
    }

    const statusLabels = {
      pending: '待處理',
      in_progress: '進行中',
      completed: '已完成',
      approved: '已核准',
      rejected: '已退回'
    };

    const statusColors = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      completed: '#10b981',
      approved: '#10b981',
      rejected: '#ef4444'
    };

    return workOrders.map(wo => {
      const createdDate = new Date(wo.createdAt).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const status = wo.status || 'pending';
      const statusLabel = statusLabels[status] || status;
      const statusColor = statusColors[status] || '#9ca3af';

      return `
        <tr>
          <td><strong>${wo.data.workOrderNo || wo.applicationNo}</strong></td>
          <td>${wo.data.batchNo || '-'}</td>
          <td>${wo.data.filterType || '-'}</td>
          <td>${wo.data.sourceFactory || '-'}</td>
          <td>${wo.data.quantity || 0} 片</td>
          <td>${wo.data.regenerationCycle || '-'}</td>
          <td>
            <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor};">
              ${statusLabel}
            </span>
          </td>
          <td style="font-size: 13px;">${createdDate}</td>
          <td>${wo.applicant || '-'}</td>
        </tr>
      `;
    }).join('');
  }
}

/**
 * 樣式
 */
function addStyles() {
  if (document.getElementById('dispatch-page-styles')) return;

  const style = document.createElement('style');
  style.id = 'dispatch-page-styles';
  style.textContent = `
    .dispatch-page {
      padding: var(--spacing-xl);
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: var(--spacing-xl);
    }

    .page-header h2 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .text-secondary {
      color: var(--text-secondary);
      font-size: 0.9375rem;
    }

    /* 統計卡片 */
    .stats-section {
      margin-bottom: var(--spacing-xl);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--spacing-lg);
    }

    .stat-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .stat-card.total {
      border-left: 4px solid #3b82f6;
    }

    .stat-card.pending {
      border-left: 4px solid #f59e0b;
    }

    .stat-card.progress {
      border-left: 4px solid #8b5cf6;
    }

    .stat-card.completed {
      border-left: 4px solid #10b981;
    }

    .stat-icon {
      font-size: 2.5rem;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* 卡片 */
    .card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: var(--spacing-xl);
      overflow: hidden;
    }

    .card-header {
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .card-body {
      padding: var(--spacing-xl);
    }

    /* 表單 */
    .batch-form {
      max-width: 1200px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg);
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

    .required {
      color: var(--error-color);
    }

    .form-input {
      padding: 10px 14px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-family: var(--font-family);
      transition: all 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    .field-hint {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    /* 預覽區 */
    .preview-section {
      margin: var(--spacing-xl) 0;
      padding: var(--spacing-lg);
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: var(--radius-lg);
      border: 2px solid #3b82f6;
    }

    .preview-section h4 {
      margin: 0 0 var(--spacing-md) 0;
      color: #1e40af;
      font-size: 1rem;
    }

    .preview-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-md);
    }

    .preview-item {
      padding: var(--spacing-sm);
      background: white;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .preview-item.highlight {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      font-weight: 600;
    }

    .preview-numbers {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .preview-no {
      display: inline-block;
      padding: 4px 10px;
      background: #3b82f6;
      color: white;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .preview-more {
      color: var(--text-secondary);
      font-style: italic;
    }

    /* 按鈕 */
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      margin-top: var(--spacing-xl);
    }

    .btn-primary, .btn-secondary {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .btn-secondary {
      background: white;
      color: var(--text-primary);
      border: 2px solid var(--border-color);
    }

    .btn-secondary:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    /* 工單表格 */
    .header-actions {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .filter-select {
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .work-order-table-container {
      overflow-x: auto;
    }

    .work-order-table {
      width: 100%;
      border-collapse: collapse;
    }

    .work-order-table thead {
      background: #f9fafb;
    }

    .work-order-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      white-space: nowrap;
    }

    .work-order-table td {
      padding: 12px 16px;
      font-size: 0.875rem;
      color: #1f2937;
      border-bottom: 1px solid #f3f4f6;
    }

    .work-order-table tbody tr:hover {
      background: #f9fafb;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-block;
      white-space: nowrap;
    }

    .empty-row {
      text-align: center;
      padding: var(--spacing-xxl) !important;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 3rem;
    }

    /* 視圖切換標籤 */
    .view-tabs {
      display: flex;
      gap: 8px;
    }

    .view-tab {
      padding: 8px 16px;
      background: transparent;
      border: 2px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-secondary);
      transition: all 0.2s;
    }

    .view-tab:hover {
      background: rgba(59, 130, 246, 0.1);
      color: var(--primary-color);
    }

    .view-tab.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    /* 日曆視圖 */
    .calendar-container {
      padding: var(--spacing-lg);
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 2px solid #e5e7eb;
    }

    .calendar-header h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .calendar-legend {
      display: flex;
      gap: var(--spacing-md);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .legend-dot.pending {
      background: #f59e0b;
    }

    .legend-dot.progress {
      background: #3b82f6;
    }

    .legend-dot.completed {
      background: #10b981;
    }

    .calendar-grid {
      background: white;
      border-radius: 8px;
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      margin-bottom: 2px;
    }

    .weekday {
      padding: 12px;
      text-align: center;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-secondary);
      background: #f9fafb;
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .calendar-day {
      min-height: 100px;
      padding: 8px;
      background: white;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 0.2s;
    }

    .calendar-day.empty {
      background: #f9fafb;
      cursor: default;
    }

    .calendar-day:not(.empty):hover {
      background: #f9fafb;
      border-color: var(--primary-color);
    }

    .calendar-day.today {
      background: #eff6ff;
      border: 2px solid #3b82f6;
    }

    .day-number {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .day-orders {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .order-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      text-align: center;
    }

    .order-badge.pending {
      background: #f59e0b;
    }

    .order-badge.progress {
      background: #3b82f6;
    }

    .order-badge.completed {
      background: #10b981;
    }

    /* 甘特圖視圖 */
    .gantt-container {
      padding: var(--spacing-lg);
    }

    .gantt-header {
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 2px solid #e5e7eb;
    }

    .gantt-header h4 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .gantt-chart {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .gantt-row {
      display: grid;
      grid-template-columns: 200px 1fr 150px;
      gap: 16px;
      align-items: center;
      padding: 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .gantt-row:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .gantt-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .gantt-wo-no {
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--primary-color);
      font-family: 'Courier New', monospace;
    }

    .gantt-wo-info {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    .gantt-bar-container {
      background: #e5e7eb;
      border-radius: 4px;
      height: 24px;
      overflow: hidden;
      position: relative;
    }

    .gantt-bar {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 8px;
      border-radius: 4px;
      transition: width 0.3s ease;
      position: relative;
    }

    .gantt-progress {
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .gantt-stations {
      display: flex;
      gap: 6px;
      justify-content: center;
    }

    .station-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #e5e7eb;
      border: 2px solid #9ca3af;
      transition: all 0.2s;
    }

    .station-dot.completed {
      background: #10b981;
      border-color: #059669;
    }

    /* 看板視圖 */
    .kanban-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
    }

    .kanban-column {
      background: #f9fafb;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      overflow: hidden;
    }

    .kanban-column.pending {
      border-top: 4px solid #f59e0b;
    }

    .kanban-column.progress {
      border-top: 4px solid #3b82f6;
    }

    .kanban-column.completed {
      border-top: 4px solid #10b981;
    }

    .kanban-column-header {
      padding: var(--spacing-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      border-bottom: 2px solid #e5e7eb;
    }

    .kanban-column-header h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .kanban-count {
      background: var(--primary-color);
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .kanban-column-body {
      padding: var(--spacing-md);
      min-height: 400px;
      max-height: 600px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .kanban-column-body.drag-over {
      background: rgba(59, 130, 246, 0.1);
    }

    .kanban-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      cursor: move;
      transition: all 0.2s;
    }

    .kanban-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .kanban-card.dragging {
      opacity: 0.5;
    }

    .kanban-card-header {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .kanban-card-header strong {
      font-size: 0.9375rem;
      color: var(--primary-color);
      font-family: 'Courier New', monospace;
    }

    .kanban-card-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .kanban-info {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    .kanban-card-footer {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #f3f4f6;
    }

    .kanban-card-footer small {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .kanban-empty {
      text-align: center;
      padding: var(--spacing-xl);
      color: var(--text-secondary);
      font-style: italic;
    }

    /* 響應式設計 */
    @media (max-width: 1200px) {
      .kanban-container {
        grid-template-columns: 1fr;
      }

      .gantt-row {
        grid-template-columns: 150px 1fr 120px;
        gap: 12px;
      }
    }

    @media (max-width: 768px) {
      .calendar-day {
        min-height: 80px;
      }

      .gantt-row {
        grid-template-columns: 1fr;
      }

      .gantt-stations {
        justify-content: flex-start;
      }
    }
  `;

  document.head.appendChild(style);
}
