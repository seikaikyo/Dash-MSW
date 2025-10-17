import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import {
  getConfigOptions,
  updateConfigOptions,
  addConfigOption,
  removeConfigOption
} from '../utils/systemConfig.js';

/**
 * SystemConfigPage - 系統設定頁面
 * 管理所有可配置的選項清單
 */
export function SystemConfigPage() {
  const container = document.createElement('div');
  container.className = 'system-config-page';

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <h2>⚙️ 系統設定</h2>
    <p class="text-secondary">管理工單欄位的選項清單</p>
  `;
  container.appendChild(header);

  // 配置項目定義
  const configItems = [
    {
      key: 'sourceFactories',
      title: '來源廠別',
      icon: '🏭',
      description: '濾網回收來源廠別選項'
    },
    {
      key: 'filterTypes',
      title: '濾網類型',
      icon: '🔲',
      description: '可處理的濾網類型'
    },
    {
      key: 'ovenIds',
      title: '烘箱編號',
      icon: '🔥',
      description: '可用的烘箱設備'
    },
    {
      key: 'degassingTestResults',
      title: '釋氣檢測結果',
      icon: '🧪',
      description: '釋氣檢測的可能結果'
    },
    {
      key: 'aoiResults',
      title: 'AOI 檢測結果',
      icon: '🔍',
      description: 'AOI 自動光學檢測結果'
    },
    {
      key: 'rfidUpdateStatus',
      title: 'RFID 標籤狀態',
      icon: '📡',
      description: 'RFID 標籤更換狀態'
    },
    {
      key: 'qualityGrades',
      title: '品質等級',
      icon: '⭐',
      description: '產品品質分級'
    },
    {
      key: 'stationLocations',
      title: '站點位置',
      icon: '📍',
      description: '製程站點的實體位置選項'
    }
  ];

  // 創建配置卡片區域
  const configGrid = document.createElement('div');
  configGrid.className = 'config-grid';

  configItems.forEach(item => {
    const card = createConfigCard(item);
    configGrid.appendChild(card);
  });

  container.appendChild(configGrid);

  addStyles();
  return container;

  // ========== 功能函數 ==========

  function createConfigCard(item) {
    const cardContent = document.createElement('div');
    cardContent.className = 'config-card-content';

    // 說明
    const description = document.createElement('p');
    description.className = 'config-description';
    description.textContent = item.description;
    cardContent.appendChild(description);

    // 選項清單容器
    const listContainer = document.createElement('div');
    listContainer.className = 'options-list';
    renderOptionsList(listContainer, item.key);
    cardContent.appendChild(listContainer);

    // 新增選項表單
    const addForm = document.createElement('div');
    addForm.className = 'add-option-form';

    const inputWrapper = document.createElement('div');
    inputWrapper.style.flex = '1';

    const input = document.createElement('input');
    input.className = 'option-input';
    input.type = 'text';
    input.placeholder = '輸入新選項...';
    inputWrapper.appendChild(input);
    addForm.appendChild(inputWrapper);

    const addBtn = new Button({
      text: '新增',
      variant: 'primary',
      onClick: () => {
        const value = input.value.trim();

        if (!value) {
          alert('請輸入選項內容');
          return;
        }

        const options = getConfigOptions(item.key);
        if (options.includes(value)) {
          alert('此選項已存在');
          return;
        }

        if (addConfigOption(item.key, value)) {
          input.value = '';
          renderOptionsList(listContainer, item.key);
        } else {
          alert('新增失敗');
        }
      }
    });
    addForm.appendChild(addBtn.render());
    cardContent.appendChild(addForm);

    const card = new Card({
      title: `${item.icon} ${item.title}`,
      content: cardContent
    });

    return card.render();
  }

  function renderOptionsList(container, configKey) {
    container.innerHTML = '';
    const options = getConfigOptions(configKey);

    if (options.length === 0) {
      container.innerHTML = '<p class="empty-message">目前沒有任何選項</p>';
      return;
    }

    options.forEach((option, index) => {
      const item = document.createElement('div');
      item.className = 'option-item';
      item.draggable = true;
      item.dataset.index = index;

      // 拖曳圖標
      const dragHandle = document.createElement('span');
      dragHandle.className = 'drag-handle';
      dragHandle.innerHTML = '⋮⋮';
      dragHandle.title = '拖曳排序';
      item.appendChild(dragHandle);

      const name = document.createElement('span');
      name.className = 'option-name';
      name.textContent = option;
      item.appendChild(name);

      const actions = document.createElement('div');
      actions.className = 'option-actions';

      // 刪除按鈕
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'action-btn delete-btn';
      deleteBtn.textContent = '刪除';
      deleteBtn.onclick = () => {
        if (confirm(`確定要刪除「${option}」嗎？`)) {
          if (removeConfigOption(configKey, option)) {
            renderOptionsList(container, configKey);
          } else {
            alert('刪除失敗');
          }
        }
      };
      actions.appendChild(deleteBtn);

      item.appendChild(actions);
      container.appendChild(item);

      // 拖曳事件
      item.addEventListener('dragstart', (e) => {
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const draggingItem = container.querySelector('.dragging');
        if (!draggingItem || draggingItem === item) return;

        const rect = item.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
          item.parentNode.insertBefore(draggingItem, item);
        } else {
          item.parentNode.insertBefore(draggingItem, item.nextSibling);
        }
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();

        // 重新收集排序後的選項
        const items = Array.from(container.querySelectorAll('.option-item'));
        const newOptions = items.map(el => el.querySelector('.option-name').textContent);

        updateConfigOptions(configKey, newOptions);
        renderOptionsList(container, configKey);
      });
    });
  }
}

function addStyles() {
  if (!document.getElementById('system-config-page-styles')) {
    const style = document.createElement('style');
    style.id = 'system-config-page-styles';
    style.textContent = `
      .system-config-page {
        padding: var(--spacing-xl);
        max-width: 1400px;
        margin: 0 auto;
      }

      .config-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: var(--spacing-lg);
      }

      .config-card-content {
        padding: var(--spacing-md);
      }

      .config-description {
        margin: 0 0 var(--spacing-md) 0;
        color: var(--text-secondary);
        font-size: 0.8125rem;
        line-height: 1.4;
      }

      .options-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: var(--spacing-md);
        max-height: 280px;
        overflow-y: auto;
        padding: 8px;
        background: var(--bg-secondary);
        border-radius: 6px;
      }

      .options-list::-webkit-scrollbar {
        width: 6px;
      }

      .options-list::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .options-list::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }

      .options-list::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }

      .empty-message {
        text-align: center;
        color: var(--text-secondary);
        padding: var(--spacing-lg);
        margin: 0;
        font-size: 0.875rem;
      }

      .option-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        transition: all 0.15s;
        cursor: move;
      }

      .option-item:hover {
        border-color: var(--primary-color);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .option-item.dragging {
        opacity: 0.5;
        cursor: grabbing;
        transform: rotate(2deg);
      }

      .drag-handle {
        color: #999;
        cursor: grab;
        font-size: 0.9rem;
        user-select: none;
        flex-shrink: 0;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .option-name {
        flex: 1;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .option-actions {
        display: flex;
        gap: 4px;
      }

      .action-btn {
        padding: 2px 8px;
        font-size: 0.75rem;
        border: 1px solid #d0d0d0;
        border-radius: 3px;
        background: white;
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.15s;
        line-height: 1.2;
      }

      .action-btn:hover {
        border-color: var(--primary-color);
        background: var(--primary-light);
      }

      .delete-btn {
        color: var(--error-color);
      }

      .delete-btn:hover {
        border-color: var(--error-color);
        background: #fee;
      }

      .add-option-form {
        display: flex;
        gap: 8px;
        align-items: flex-end;
        padding-top: var(--spacing-sm);
        border-top: 1px solid var(--border-color);
      }

      .option-input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 0.875rem;
        font-family: var(--font-family);
        transition: all 0.2s;
      }

      .option-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-light);
      }

      .option-input::placeholder {
        color: #999;
      }
    `;
    document.head.appendChild(style);
  }
}
