import { Button } from '../components/common/Button.js';
import { Card } from '../components/common/Card.js';
import { Modal } from '../components/common/Modal.js';
import { wmsManager } from '../modules/wms/wmsModel.js';
import { WMSService } from '../modules/wms/wmsService.js';
import { authService } from '../utils/authService.js';

export function WMSPage() {
  const container = document.createElement('div');
  container.className = 'wms-page';

  const currentUser = authService.getCurrentUser();

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <h2>📦 WMS 倉儲管理系統</h2>
    <p class="text-secondary">Pallet 管理、庫位分配、入出庫作業</p>
  `;
  container.appendChild(header);

  // 統計卡片區
  const statsGrid = document.createElement('div');
  statsGrid.className = 'stats-grid';
  statsGrid.id = 'stats-grid';
  container.appendChild(statsGrid);

  // 快速操作區
  const quickActions = document.createElement('div');
  quickActions.className = 'quick-actions-section';
  quickActions.innerHTML = `<h3>快速操作</h3>`;

  const actionsGrid = document.createElement('div');
  actionsGrid.className = 'actions-grid';

  const actions = [
    {
      icon: '📥',
      title: '成品入庫',
      desc: '建立新 Pallet 並入庫',
      onClick: () => showInboundModal()
    },
    {
      icon: '📤',
      title: '批次出庫',
      desc: 'FIFO 批次出貨作業',
      onClick: () => showOutboundModal()
    },
    {
      icon: '🔍',
      title: 'RFID 查詢',
      desc: '依 RFID 追蹤濾網',
      onClick: () => showRFIDSearchModal()
    },
    {
      icon: '📊',
      title: '庫存報表',
      desc: '查看完整庫存分析',
      onClick: () => showInventoryReport()
    }
  ];

  actions.forEach(action => {
    const actionCard = document.createElement('div');
    actionCard.className = 'action-card';
    actionCard.innerHTML = `
      <div class="action-icon">${action.icon}</div>
      <div class="action-title">${action.title}</div>
      <div class="action-desc">${action.desc}</div>
    `;
    actionCard.addEventListener('click', action.onClick);
    actionsGrid.appendChild(actionCard);
  });

  quickActions.appendChild(actionsGrid);
  container.appendChild(quickActions);

  // Pallet 列表區
  const palletSection = document.createElement('div');
  palletSection.className = 'pallet-section';
  palletSection.innerHTML = `
    <div class="section-header">
      <h3>Pallet 列表</h3>
      <div class="header-controls">
        <input type="text" id="pallet-search" class="search-input" placeholder="搜尋 Pallet ID、庫位或訂單號..." />
        <div class="filter-tabs" id="filter-tabs">
          <button class="tab-btn active" data-status="all">全部</button>
          <button class="tab-btn" data-status="empty">空棧板</button>
          <button class="tab-btn" data-status="partial">部分裝載</button>
          <button class="tab-btn" data-status="full">已滿載</button>
          <button class="tab-btn" data-status="shipped">已出貨</button>
        </div>
      </div>
    </div>
    <div id="pallet-list" class="pallet-table-container"></div>
  `;
  container.appendChild(palletSection);

  // 初始化數據
  let currentStatusFilter = 'all';
  let currentSearchKeyword = '';

  renderStats();
  renderPalletList();

  // 綁定篩選標籤事件
  const filterTabs = container.querySelectorAll('.tab-btn');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      filterTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentStatusFilter = e.target.dataset.status;
      renderPalletList();
    });
  });

  // 綁定搜尋事件
  const searchInput = container.querySelector('#pallet-search');
  searchInput.addEventListener('input', (e) => {
    currentSearchKeyword = e.target.value;
    renderPalletList();
  });

  addStyles();
  return container;

  // ========== 功能函數 ==========

  function renderStats() {
    const report = WMSService.getInventoryReport();
    const stagnantPallets = WMSService.getStagnantPallets(30);

    const statsGrid = container.querySelector('#stats-grid');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-value">${report.pallet?.total || 0}</div>
          <div class="stat-label">總 Pallet 數</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔢</div>
        <div class="stat-content">
          <div class="stat-value">${report.filters?.total || 0}</div>
          <div class="stat-label">總濾網數</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📍</div>
        <div class="stat-content">
          <div class="stat-value">${report.location?.occupied || 0}</div>
          <div class="stat-label">已占用庫位</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-value">${report.location?.utilizationRate || '0%'}</div>
          <div class="stat-label">庫位利用率</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-content">
          <div class="stat-value">${stagnantPallets.length}</div>
          <div class="stat-label">滯倉超過30天</div>
        </div>
      </div>
    `;
  }

  function renderPalletList() {
    const palletList = container.querySelector('#pallet-list');
    let pallets = wmsManager.getAllPallets();

    // 狀態篩選
    if (currentStatusFilter !== 'all') {
      pallets = pallets.filter(p => p.status === currentStatusFilter);
    }

    // 關鍵字搜尋
    if (currentSearchKeyword) {
      const keyword = currentSearchKeyword.toLowerCase();
      pallets = pallets.filter(p => {
        return p.id.toLowerCase().includes(keyword) ||
               (p.location && p.location.toLowerCase().includes(keyword)) ||
               (p.customerOrderNo && p.customerOrderNo.toLowerCase().includes(keyword));
      });
    }

    // 按入庫時間排序（最新在前）
    pallets.sort((a, b) => {
      const timeA = a.inboundTime ? new Date(a.inboundTime).getTime() : 0;
      const timeB = b.inboundTime ? new Date(b.inboundTime).getTime() : 0;
      return timeB - timeA;
    });

    if (pallets.length === 0) {
      palletList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>沒有符合條件的 Pallet</h3>
          <p>${wmsManager.getAllPallets().length === 0 ? '點選上方「成品入庫」開始建立第一個 Pallet' : '請嘗試其他搜尋條件或篩選選項'}</p>
        </div>
      `;
      return;
    }

    // 創建表格
    palletList.innerHTML = createPalletTable(pallets);

    // 綁定表格中的按鈕事件
    palletList.querySelectorAll('.btn-table-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const palletId = e.target.dataset.palletId;
        showPalletDetail(palletId);
      });
    });

    palletList.querySelectorAll('.btn-table-outbound').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const palletId = e.target.dataset.palletId;
        showSingleOutboundModal(palletId);
      });
    });
  }

  function createPalletTable(pallets) {
    const statusColors = {
      empty: '#9ca3af',
      partial: '#f59e0b',
      full: '#10b981',
      shipped: '#6366f1'
    };

    const statusLabels = {
      empty: '空棧板',
      partial: '部分裝載',
      full: '已滿載',
      shipped: '已出貨'
    };

    const rows = pallets.map(pallet => {
      const fillRate = ((pallet.filterIds.length / pallet.maxCapacity) * 100).toFixed(0);
      const inboundDate = pallet.inboundTime
        ? new Date(pallet.inboundTime).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : 'N/A';
      const daysInStorage = pallet.inboundTime
        ? Math.floor((Date.now() - new Date(pallet.inboundTime).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return `
        <tr>
          <td>
            <div class="table-pallet-id">
              <span class="pallet-icon-small">📦</span>
              ${pallet.id}
            </div>
          </td>
          <td>
            <span class="table-status-badge" style="background: ${statusColors[pallet.status]}20; color: ${statusColors[pallet.status]};">
              ${statusLabels[pallet.status]}
            </span>
          </td>
          <td>${pallet.filterIds.length} / ${pallet.maxCapacity}</td>
          <td>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${fillRate}%; background: ${statusColors[pallet.status]};"></div>
            </div>
            <span class="progress-text">${fillRate}%</span>
          </td>
          <td>${pallet.location || '-'}</td>
          <td>${inboundDate}</td>
          <td class="${daysInStorage > 30 ? 'text-warning' : ''}">${daysInStorage} 天</td>
          <td>${pallet.customerOrderNo || '-'}</td>
          <td class="table-actions">
            <button class="btn-table btn-table-detail" data-pallet-id="${pallet.id}">詳情</button>
            ${pallet.status !== 'shipped' ? `
              <button class="btn-table btn-table-outbound" data-pallet-id="${pallet.id}">出庫</button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <table class="pallet-table">
        <thead>
          <tr>
            <th>Pallet ID</th>
            <th>狀態</th>
            <th>濾網數量</th>
            <th>裝載率</th>
            <th>庫位</th>
            <th>入庫日期</th>
            <th>倉儲天數</th>
            <th>訂單號</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  function createPalletCard(pallet) {
    const card = document.createElement('div');
    card.className = 'pallet-card';

    const statusColors = {
      empty: '#9ca3af',
      partial: '#f59e0b',
      full: '#10b981',
      shipped: '#6366f1'
    };

    const statusLabels = {
      empty: '空棧板',
      partial: '部分裝載',
      full: '已滿載',
      shipped: '已出貨'
    };

    const fillRate = ((pallet.filterIds.length / pallet.maxCapacity) * 100).toFixed(0);
    const inboundDate = pallet.inboundTime ? new Date(pallet.inboundTime).toLocaleDateString('zh-TW') : 'N/A';
    const daysInStorage = pallet.inboundTime
      ? Math.floor((Date.now() - new Date(pallet.inboundTime).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    card.innerHTML = `
      <div class="pallet-card-header">
        <div class="pallet-id">
          <span class="pallet-icon">📦</span>
          <strong>${pallet.id}</strong>
        </div>
        <div class="pallet-status" style="background: ${statusColors[pallet.status]}20; color: ${statusColors[pallet.status]};">
          ${statusLabels[pallet.status]}
        </div>
      </div>
      <div class="pallet-card-body">
        <div class="pallet-info-row">
          <span class="info-label">濾網數量</span>
          <span class="info-value">${pallet.filterIds.length} / ${pallet.maxCapacity}</span>
        </div>
        <div class="pallet-info-row">
          <span class="info-label">裝載率</span>
          <span class="info-value">${fillRate}%</span>
        </div>
        <div class="pallet-info-row">
          <span class="info-label">庫位</span>
          <span class="info-value">${pallet.location || '未入庫'}</span>
        </div>
        <div class="pallet-info-row">
          <span class="info-label">入庫日期</span>
          <span class="info-value">${inboundDate}</span>
        </div>
        <div class="pallet-info-row">
          <span class="info-label">倉儲天數</span>
          <span class="info-value ${daysInStorage > 30 ? 'text-warning' : ''}">${daysInStorage} 天</span>
        </div>
        ${pallet.outboundTime ? `
        <div class="pallet-info-row">
          <span class="info-label">出貨單號</span>
          <span class="info-value">${pallet.customerOrderNo || 'N/A'}</span>
        </div>
        ` : ''}
      </div>
      <div class="pallet-card-actions">
        <button class="btn-detail" data-pallet-id="${pallet.id}">查看詳情</button>
        ${pallet.status !== 'shipped' ? `
        <button class="btn-outbound" data-pallet-id="${pallet.id}">出庫</button>
        ` : ''}
      </div>
    `;

    // 綁定事件
    const detailBtn = card.querySelector('.btn-detail');
    detailBtn.addEventListener('click', () => showPalletDetail(pallet.id));

    const outboundBtn = card.querySelector('.btn-outbound');
    if (outboundBtn) {
      outboundBtn.addEventListener('click', () => showSingleOutboundModal(pallet.id));
    }

    return card;
  }

  function showInboundModal() {
    const modalContent = `
      <div class="modal-form">
        <div class="scanner-mode-tabs">
          <button class="mode-tab active" data-mode="scan">🔍 掃描模式</button>
          <button class="mode-tab" data-mode="manual">⌨️ 手動輸入</button>
        </div>

        <div id="scan-mode" class="scan-mode-content">
          <div class="scanner-section">
            <div class="scanner-icon">📷</div>
            <h4>掃描條碼 / QR Code / RFID</h4>
            <p class="text-secondary">請使用掃描器掃描濾網標籤</p>
            <input
              type="text"
              id="scanner-input"
              class="scanner-input"
              placeholder="點擊此處，然後使用掃描器掃描..."
              autofocus
            />
            <small>掃描後按 Enter 或繼續掃描下一個</small>
          </div>

          <div class="scanned-items-section">
            <h4>已掃描項目（<span id="scanned-count">0</span> / 48）</h4>
            <div id="scanned-items-list" class="scanned-items-list"></div>
            <button id="clear-scanned" class="btn-clear-scanned">清除全部</button>
          </div>
        </div>

        <div id="manual-mode" class="manual-mode-content" style="display: none;">
          <div class="form-group">
            <label>濾網 ID 列表（以逗號或換行分隔）</label>
            <textarea id="filter-ids" placeholder="例如: FLT001, FLT002, FLT003" rows="4"></textarea>
            <small>最多可輸入 48 個濾網 ID</small>
          </div>
          <div class="form-group">
            <label>RFID 標籤列表（選填，以逗號或換行分隔）</label>
            <textarea id="rfid-tags" placeholder="例如: RFID001, RFID002" rows="3"></textarea>
          </div>
        </div>
      </div>
    `;

    const modal = new Modal({
      title: '📥 成品入庫',
      content: modalContent,
      buttons: [
        {
          text: '取消',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        },
        {
          text: '確認入庫',
          variant: 'primary',
          onClick: (modal) => {
            let filterIds = [];
            let rfidTags = [];

            // 判斷當前模式
            const scanMode = modal.element.querySelector('#scan-mode');
            const isScanMode = scanMode.style.display !== 'none';

            if (isScanMode) {
              // 掃描模式：從已掃描列表獲取
              const scannedItems = modal.element.querySelectorAll('.scanned-item');
              filterIds = Array.from(scannedItems).map(item => item.dataset.filterId);
              rfidTags = Array.from(scannedItems).map(item => item.dataset.rfidTag || '');
            } else {
              // 手動模式：從文字區域獲取
              const filterIdsInput = modal.element.querySelector('#filter-ids').value;
              const rfidTagsInput = modal.element.querySelector('#rfid-tags').value;

              if (!filterIdsInput.trim()) {
                alert('請輸入濾網 ID 列表');
                return;
              }

              filterIds = filterIdsInput.split(/[,\n]/).map(id => id.trim()).filter(id => id);
              rfidTags = rfidTagsInput.split(/[,\n]/).map(tag => tag.trim()).filter(tag => tag);
            }

            if (filterIds.length === 0) {
              alert('請至少掃描或輸入一個濾網 ID');
              return;
            }

            if (filterIds.length > 48) {
              alert(`濾網數量超過限制！\n當前: ${filterIds.length} 片\n最大容量: 48 片`);
              return;
            }

            try {
              const result = WMSService.createAndInboundPallet(filterIds, rfidTags);
              alert(`✅ 入庫成功！\nPallet ID: ${result.pallet.id}\n庫位: ${result.location.id}\n濾網數量: ${filterIds.length}`);
              modal.close();
              renderStats();
              renderPalletList();
            } catch (error) {
              alert(`❌ 入庫失敗: ${error.message}`);
            }
          }
        }
      ]
    });

    modal.open();

    // 綁定模式切換事件
    const modeTabs = modal.element.querySelectorAll('.mode-tab');
    const scanModeDiv = modal.element.querySelector('#scan-mode');
    const manualModeDiv = modal.element.querySelector('#manual-mode');

    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const mode = tab.dataset.mode;
        if (mode === 'scan') {
          scanModeDiv.style.display = 'block';
          manualModeDiv.style.display = 'none';
          modal.element.querySelector('#scanner-input').focus();
        } else {
          scanModeDiv.style.display = 'none';
          manualModeDiv.style.display = 'block';
        }
      });
    });

    // 掃描功能
    const scannedItems = new Set();
    const scannerInput = modal.element.querySelector('#scanner-input');
    const scannedList = modal.element.querySelector('#scanned-items-list');
    const scannedCount = modal.element.querySelector('#scanned-count');
    const clearBtn = modal.element.querySelector('#clear-scanned');

    scannerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const scannedValue = scannerInput.value.trim();

        if (!scannedValue) return;

        if (scannedItems.size >= 48) {
          alert('已達最大容量（48 片）');
          scannerInput.value = '';
          return;
        }

        if (scannedItems.has(scannedValue)) {
          alert('此項目已掃描過');
          scannerInput.value = '';
          return;
        }

        // 添加到列表
        scannedItems.add(scannedValue);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'scanned-item';
        itemDiv.dataset.filterId = scannedValue;
        itemDiv.dataset.rfidTag = scannedValue; // 假設 RFID 和濾網 ID 相同
        itemDiv.innerHTML = `
          <span class="item-icon">✅</span>
          <span class="item-id">${scannedValue}</span>
          <button class="btn-remove-item" data-id="${scannedValue}">×</button>
        `;

        scannedList.appendChild(itemDiv);
        scannedCount.textContent = scannedItems.size;
        scannerInput.value = '';

        // 綁定移除按鈕
        itemDiv.querySelector('.btn-remove-item').addEventListener('click', () => {
          scannedItems.delete(scannedValue);
          itemDiv.remove();
          scannedCount.textContent = scannedItems.size;
        });
      }
    });

    clearBtn.addEventListener('click', () => {
      if (confirm('確定要清除所有已掃描項目？')) {
        scannedItems.clear();
        scannedList.innerHTML = '';
        scannedCount.textContent = '0';
        scannerInput.value = '';
        scannerInput.focus();
      }
    });
  }

  function showOutboundModal() {
    const modalContent = `
      <div class="modal-form">
        <div class="form-group">
          <label>出貨數量</label>
          <input type="number" id="outbound-quantity" placeholder="輸入出貨 Pallet 數量" min="1" />
        </div>
        <div class="form-group">
          <label>客戶訂單號</label>
          <input type="text" id="customer-order" placeholder="例如: ORD-2025-0001" />
        </div>
        <div class="info-box">
          <p><strong>📋 出貨規則</strong></p>
          <ul>
            <li>優先出最早入庫的 Pallet（FIFO 原則）</li>
            <li>只出貨狀態為「已滿載」的 Pallet</li>
            <li>自動更新庫位狀態</li>
          </ul>
        </div>
      </div>
    `;

    const modal = new Modal({
      title: '📤 批次出庫',
      content: modalContent,
      buttons: [
        {
          text: '取消',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        },
        {
          text: '確認出庫',
          variant: 'primary',
          onClick: (modal) => {
            const quantity = parseInt(modal.element.querySelector('#outbound-quantity').value);
            const customerOrderNo = modal.element.querySelector('#customer-order').value;

            if (!quantity || quantity < 1) {
              alert('請輸入有效的出貨數量');
              return;
            }

            if (!customerOrderNo.trim()) {
              alert('請輸入客戶訂單號');
              return;
            }

            try {
              const result = WMSService.batchOutbound(quantity, customerOrderNo);
              alert(`✅ 出貨成功！\n出貨 Pallet 數: ${result.shippedPallets.length}\n總濾網數: ${result.totalFilters}\nPallet IDs: ${result.shippedPallets.map(p => p.id).join(', ')}`);
              modal.close();
              renderStats();
              renderPalletList();
            } catch (error) {
              alert(`❌ 出貨失敗: ${error.message}`);
            }
          }
        }
      ]
    });

    modal.open();
  }

  function showSingleOutboundModal(palletId) {
    const pallet = wmsManager.getPallet(palletId);
    if (!pallet) {
      alert('找不到此 Pallet');
      return;
    }

    const modalContent = `
      <div class="modal-form">
        <div class="form-group">
          <label>Pallet ID</label>
          <input type="text" value="${pallet.id}" disabled />
        </div>
        <div class="form-group">
          <label>客戶訂單號</label>
          <input type="text" id="customer-order" placeholder="例如: ORD-2025-0001" />
        </div>
      </div>
    `;

    const modal = new Modal({
      title: '📤 單一 Pallet 出庫',
      content: modalContent,
      buttons: [
        {
          text: '取消',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        },
        {
          text: '確認出庫',
          variant: 'primary',
          onClick: (modal) => {
            const customerOrderNo = modal.element.querySelector('#customer-order').value;

            if (!customerOrderNo.trim()) {
              alert('請輸入客戶訂單號');
              return;
            }

            try {
              pallet.outbound(customerOrderNo);
              wmsManager.saveToStorage();
              alert(`✅ 出貨成功！\nPallet ID: ${pallet.id}\n訂單號: ${customerOrderNo}`);
              modal.close();
              renderStats();
              renderPalletList();
            } catch (error) {
              alert(`❌ 出貨失敗: ${error.message}`);
            }
          }
        }
      ]
    });

    modal.open();
  }

  function showRFIDSearchModal() {
    const modalContent = `
      <div class="modal-form">
        <div class="form-group">
          <label>RFID 標籤號</label>
          <input type="text" id="rfid-search" placeholder="輸入 RFID 標籤號" />
        </div>
        <div id="search-result" class="search-result"></div>
      </div>
    `;

    const modal = new Modal({
      title: '🔍 RFID 查詢',
      content: modalContent,
      buttons: [
        {
          text: '關閉',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        },
        {
          text: '查詢',
          variant: 'primary',
          onClick: (modal) => {
            const rfidTag = modal.element.querySelector('#rfid-search').value;
            const resultDiv = modal.element.querySelector('#search-result');

            if (!rfidTag.trim()) {
              resultDiv.innerHTML = '<p class="text-error">請輸入 RFID 標籤號</p>';
              return;
            }

            try {
              const result = WMSService.findFilterByRFID(rfidTag);
              if (result) {
                resultDiv.innerHTML = `
                  <div class="result-card">
                    <h4>✅ 找到濾網</h4>
                    <p><strong>濾網 ID:</strong> ${result.filterId}</p>
                    <p><strong>所屬 Pallet:</strong> ${result.pallet.id}</p>
                    <p><strong>庫位:</strong> ${result.pallet.location || '未入庫'}</p>
                    <p><strong>狀態:</strong> ${result.pallet.status}</p>
                  </div>
                `;
              } else {
                resultDiv.innerHTML = '<p class="text-error">❌ 找不到此 RFID 標籤</p>';
              }
            } catch (error) {
              resultDiv.innerHTML = `<p class="text-error">❌ 查詢失敗: ${error.message}</p>`;
            }
          }
        }
      ]
    });

    modal.open();
  }

  function showPalletDetail(palletId) {
    const pallet = wmsManager.getPallet(palletId);
    if (!pallet) {
      alert('找不到此 Pallet');
      return;
    }

    const modalContent = `
      <div class="pallet-detail">
        <div class="detail-section">
          <h4>基本資訊</h4>
          <table class="detail-table">
            <tr><td>Pallet ID</td><td>${pallet.id}</td></tr>
            <tr><td>狀態</td><td>${pallet.status}</td></tr>
            <tr><td>最大容量</td><td>${pallet.maxCapacity}</td></tr>
            <tr><td>當前裝載</td><td>${pallet.filterIds.length}</td></tr>
            <tr><td>庫位</td><td>${pallet.location || '未入庫'}</td></tr>
          </table>
        </div>
        <div class="detail-section">
          <h4>時間記錄</h4>
          <table class="detail-table">
            <tr><td>建立時間</td><td>${new Date(pallet.createdAt).toLocaleString('zh-TW')}</td></tr>
            <tr><td>入庫時間</td><td>${pallet.inboundTime ? new Date(pallet.inboundTime).toLocaleString('zh-TW') : 'N/A'}</td></tr>
            <tr><td>出庫時間</td><td>${pallet.outboundTime ? new Date(pallet.outboundTime).toLocaleString('zh-TW') : 'N/A'}</td></tr>
            ${pallet.customerOrderNo ? `<tr><td>訂單號</td><td>${pallet.customerOrderNo}</td></tr>` : ''}
          </table>
        </div>
        <div class="detail-section">
          <h4>濾網列表（${pallet.filterIds.length} 個）</h4>
          <div class="filter-list">
            ${pallet.filterIds.length > 0
              ? pallet.filterIds.map((id, idx) => `<span class="filter-tag">${id}</span>`).join('')
              : '<p class="text-secondary">無濾網</p>'
            }
          </div>
        </div>
        ${pallet.rfidTags.length > 0 ? `
        <div class="detail-section">
          <h4>RFID 標籤（${pallet.rfidTags.length} 個）</h4>
          <div class="filter-list">
            ${pallet.rfidTags.map(tag => `<span class="rfid-tag">${tag}</span>`).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;

    const modal = new Modal({
      title: `📦 Pallet 詳情 - ${pallet.id}`,
      content: modalContent,
      buttons: [
        {
          text: '關閉',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        }
      ]
    });

    modal.open();
  }

  function showInventoryReport() {
    const report = WMSService.getInventoryReport();
    const stagnantPallets = WMSService.getStagnantPallets(30);

    const modalContent = `
      <div class="inventory-report">
        <div class="report-section">
          <h4>📊 庫存統計</h4>
          <table class="report-table">
            <tr><td>總 Pallet 數</td><td>${report.pallet?.total || 0}</td></tr>
            <tr><td>總濾網數</td><td>${report.filters?.total || 0}</td></tr>
            <tr><td>空棧板</td><td>${report.pallet?.empty || 0}</td></tr>
            <tr><td>部分裝載</td><td>${report.pallet?.partial || 0}</td></tr>
            <tr><td>已滿載</td><td>${report.pallet?.full || 0}</td></tr>
            <tr><td>已出貨</td><td>${report.pallet?.shipped || 0}</td></tr>
          </table>
        </div>
        <div class="report-section">
          <h4>📍 庫位狀態</h4>
          <table class="report-table">
            <tr><td>總庫位數</td><td>${report.location?.total || 0}</td></tr>
            <tr><td>已占用</td><td>${report.location?.occupied || 0}</td></tr>
            <tr><td>空閒</td><td>${report.location?.empty || 0}</td></tr>
            <tr><td>利用率</td><td>${report.location?.utilizationRate || '0%'}</td></tr>
          </table>
        </div>
        ${stagnantPallets.length > 0 ? `
        <div class="report-section">
          <h4>⚠️ 滯倉警示（超過 30 天）</h4>
          <div class="stagnant-list">
            ${stagnantPallets.map(p => `
              <div class="stagnant-item">
                <span>${p.id}</span>
                <span>${p.daysInWarehouse || 0} 天</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;

    const modal = new Modal({
      title: '📊 庫存報表',
      content: modalContent,
      buttons: [
        {
          text: '關閉',
          variant: 'secondary',
          onClick: (modal) => modal.close()
        }
      ]
    });

    modal.open();
  }
}

function addStyles() {
  if (!document.getElementById('wms-page-styles')) {
    const style = document.createElement('style');
    style.id = 'wms-page-styles';
    style.textContent = `
      .wms-page {
        padding: var(--spacing-xl);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      .stat-icon {
        font-size: 2rem;
      }

      .stat-content {
        flex: 1;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .quick-actions-section {
        margin-bottom: var(--spacing-xl);
      }

      .quick-actions-section h3 {
        margin-bottom: var(--spacing-md);
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg);
      }

      .action-card {
        background: var(--bg-color);
        border: 2px dashed var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .action-card:hover {
        border-color: var(--primary-color);
        background: var(--primary-light);
        transform: translateY(-2px);
      }

      .action-icon {
        font-size: 3rem;
        margin-bottom: var(--spacing-md);
      }

      .action-title {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
        color: var(--text-primary);
      }

      .action-desc {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .pallet-section {
        margin-top: var(--spacing-xl);
      }

      .section-header {
        margin-bottom: var(--spacing-lg);
      }

      .section-header h3 {
        margin-bottom: var(--spacing-md);
      }

      .header-controls {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .search-input {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        font-family: var(--font-family);
        transition: all 0.2s;
      }

      .search-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-light);
      }

      .filter-tabs {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .tab-btn {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        background: var(--bg-color);
        color: var(--text-secondary);
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s;
      }

      .tab-btn:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .tab-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .pallet-table-container {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }

      .pallet-table {
        width: 100%;
        border-collapse: collapse;
      }

      .pallet-table thead {
        background: var(--bg-secondary);
      }

      .pallet-table th {
        padding: var(--spacing-md);
        text-align: left;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        border-bottom: 2px solid var(--border-color);
        white-space: nowrap;
      }

      .pallet-table tbody tr {
        transition: background 0.2s;
      }

      .pallet-table tbody tr:hover {
        background: var(--bg-secondary);
      }

      .pallet-table td {
        padding: var(--spacing-md);
        font-size: 0.875rem;
        border-bottom: 1px solid var(--border-color);
        vertical-align: middle;
      }

      .table-pallet-id {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-weight: 600;
      }

      .pallet-icon-small {
        font-size: 1.2rem;
      }

      .table-status-badge {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-md);
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;
      }

      .progress-bar {
        width: 80px;
        height: 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;
        display: inline-block;
        vertical-align: middle;
        margin-right: var(--spacing-sm);
      }

      .progress-fill {
        height: 100%;
        transition: width 0.3s;
      }

      .progress-text {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .table-actions {
        display: flex;
        gap: var(--spacing-xs);
      }

      .btn-table {
        padding: var(--spacing-xs) var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--bg-color);
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.75rem;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .btn-table-detail:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .btn-table-outbound:hover {
        background: #10b981;
        color: white;
        border-color: #10b981;
      }

      .pallet-card {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
        transition: all 0.2s;
      }

      .pallet-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .pallet-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
      }

      .pallet-id {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: 1rem;
      }

      .pallet-icon {
        font-size: 1.5rem;
      }

      .pallet-status {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-md);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .pallet-card-body {
        margin-bottom: var(--spacing-md);
      }

      .pallet-info-row {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-xs) 0;
        font-size: 0.875rem;
      }

      .info-label {
        color: var(--text-secondary);
      }

      .info-value {
        font-weight: 600;
        color: var(--text-primary);
      }

      .text-warning {
        color: #f59e0b !important;
      }

      .pallet-card-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      .pallet-card-actions button {
        flex: 1;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--bg-color);
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s;
      }

      .btn-detail:hover {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .btn-outbound:hover {
        background: #10b981;
        color: white;
        border-color: #10b981;
      }

      .modal-form {
        padding: var(--spacing-md);
      }

      .form-group {
        margin-bottom: var(--spacing-lg);
      }

      .form-group label {
        display: block;
        margin-bottom: var(--spacing-sm);
        font-weight: 600;
        color: var(--text-primary);
      }

      .form-group input,
      .form-group textarea {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-family: var(--font-family);
        font-size: 0.875rem;
      }

      .form-group small {
        display: block;
        margin-top: var(--spacing-xs);
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }

      .info-box {
        background: var(--primary-light);
        border: 1px solid var(--primary-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        margin-top: var(--spacing-md);
      }

      .info-box p {
        margin: 0 0 var(--spacing-sm) 0;
      }

      .info-box ul {
        margin: 0;
        padding-left: var(--spacing-lg);
      }

      .info-box li {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xs);
      }

      .search-result,
      .pallet-detail,
      .inventory-report {
        padding: var(--spacing-md);
      }

      .result-card,
      .detail-section,
      .report-section {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-md);
      }

      .result-card h4,
      .detail-section h4,
      .report-section h4 {
        margin-bottom: var(--spacing-md);
      }

      .detail-table,
      .report-table {
        width: 100%;
        font-size: 0.875rem;
      }

      .detail-table td,
      .report-table td {
        padding: var(--spacing-xs) 0;
      }

      .detail-table td:first-child,
      .report-table td:first-child {
        color: var(--text-secondary);
        width: 40%;
      }

      .detail-table td:last-child,
      .report-table td:last-child {
        font-weight: 600;
        text-align: right;
      }

      .filter-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }

      .filter-tag,
      .rfid-tag {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--primary-light);
        color: var(--primary-color);
        border-radius: var(--radius-md);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .rfid-tag {
        background: #dbeafe;
        color: #1e40af;
      }

      .stagnant-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .stagnant-item {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-sm);
        background: #fef2f2;
        border-left: 3px solid #f59e0b;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
      }

      .text-error {
        color: var(--error-color);
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--text-secondary);
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-md);
      }

      /* 掃描器樣式 */
      .scanner-mode-tabs {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-lg);
        border-bottom: 2px solid var(--border-color);
      }

      .mode-tab {
        padding: var(--spacing-sm) var(--spacing-lg);
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
        margin-bottom: -2px;
      }

      .mode-tab:hover {
        color: var(--primary-color);
      }

      .mode-tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .scanner-section {
        background: var(--bg-secondary);
        border: 2px dashed var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        text-align: center;
        margin-bottom: var(--spacing-lg);
      }

      .scanner-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-md);
      }

      .scanner-section h4 {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: 1.125rem;
      }

      .scanner-input {
        width: 100%;
        max-width: 400px;
        padding: var(--spacing-md);
        font-size: 1rem;
        border: 2px solid var(--primary-color);
        border-radius: var(--radius-md);
        text-align: center;
        margin-top: var(--spacing-md);
        font-family: 'Courier New', monospace;
      }

      .scanner-input:focus {
        outline: none;
        box-shadow: 0 0 0 4px var(--primary-light);
      }

      .scanned-items-section {
        margin-top: var(--spacing-lg);
      }

      .scanned-items-section h4 {
        margin-bottom: var(--spacing-md);
        font-size: 1rem;
      }

      .scanned-items-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        background: var(--bg-color);
        margin-bottom: var(--spacing-md);
      }

      .scanned-items-list:empty::before {
        content: '尚未掃描任何項目';
        display: block;
        text-align: center;
        color: var(--text-tertiary);
        padding: var(--spacing-xl);
      }

      .scanned-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-xs);
        transition: all 0.2s;
      }

      .scanned-item:hover {
        background: var(--primary-light);
      }

      .item-icon {
        font-size: 1.2rem;
      }

      .item-id {
        flex: 1;
        font-family: 'Courier New', monospace;
        font-weight: 600;
      }

      .btn-remove-item {
        width: 24px;
        height: 24px;
        border: none;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
        transition: all 0.2s;
      }

      .btn-remove-item:hover {
        background: #dc2626;
        transform: scale(1.1);
      }

      .btn-clear-scanned {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid #ef4444;
        background: white;
        color: #ef4444;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 600;
        transition: all 0.2s;
      }

      .btn-clear-scanned:hover {
        background: #ef4444;
        color: white;
      }
    `;
    document.head.appendChild(style);
  }
}
