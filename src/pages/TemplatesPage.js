import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { Modal } from '../components/common/Modal.js';
import { Card } from '../components/common/Card.js';
import { TemplateModel } from '../utils/templateModel.js';
import { getCurrentIndustry } from '../config/industry.config.js';
import { initializeAllTemplates } from '../utils/initializeTemplates.js';
import { TemplateFieldEditor } from '../components/template-editor/TemplateFieldEditor.js';

/**
 * 配方範本管理頁面
 */
export function TemplatesPage() {
  const container = document.createElement('div');
  container.className = 'templates-page';

  // 首次載入時初始化預設範本
  initializeAllTemplates();

  let allTemplates = TemplateModel.getAll();
  let filteredTemplates = [...allTemplates];
  let currentFilter = { industry: 'all', category: 'all', search: '', sortBy: 'createdAt-desc' };

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';

  const headerLeft = document.createElement('div');
  headerLeft.innerHTML = `
    <h2>📋 配方範本管理</h2>
    <p class="text-secondary">建立和管理配方範本，提升配方建立效率</p>
  `;

  const headerRight = document.createElement('div');
  headerRight.className = 'header-actions';

  const createBtn = new Button({
    text: '建立範本',
    variant: 'primary',
    onClick: () => showCreateModal()
  });

  const importBtn = new Button({
    text: '匯入範本',
    variant: 'outline',
    onClick: () => showImportModal()
  });

  headerRight.appendChild(importBtn.render());
  headerRight.appendChild(createBtn.render());

  header.appendChild(headerLeft);
  header.appendChild(headerRight);
  container.appendChild(header);

  // 篩選列
  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';

  // 搜尋框
  const searchInput = new Input({
    label: '搜尋範本',
    placeholder: '搜尋範本名稱、描述或標籤...',
    onChange: (value) => {
      currentFilter.search = value;
      applyFilters();
    }
  });

  // 產業篩選
  const industrySelect = new Select({
    label: '產業類型',
    options: [
      { value: 'all', label: '所有產業' },
      { value: 'amc-filter', label: 'AMC 化學濾網' },
      { value: 'food', label: '食品製造' },
      { value: 'pharma', label: '製藥產業' }
    ],
    onChange: (value) => {
      currentFilter.industry = value;
      applyFilters();
    }
  });

  // 分類篩選
  const categorySelect = new Select({
    label: '範本分類',
    options: [
      { value: 'all', label: '所有分類' },
      { value: 'standard', label: '標準範本' },
      { value: 'custom', label: '自訂範本' },
      { value: 'imported', label: '匯入範本' }
    ],
    onChange: (value) => {
      currentFilter.category = value;
      applyFilters();
    }
  });

  const sortSelect = new Select({
    label: '排序方式',
    value: currentFilter.sortBy,
    options: [
      { value: 'createdAt-desc', label: '建立時間（新→舊）' },
      { value: 'createdAt-asc', label: '建立時間（舊→新）' },
      { value: 'name-asc', label: '名稱（A→Z）' },
      { value: 'name-desc', label: '名稱（Z→A）' },
      { value: 'usageCount-desc', label: '使用次數（高→低）' },
      { value: 'usageCount-asc', label: '使用次數（低→高）' }
    ],
    onChange: (value) => {
      currentFilter.sortBy = value;
      applyFilters();
    }
  });

  filterBar.appendChild(searchInput.render());
  filterBar.appendChild(industrySelect.render());
  filterBar.appendChild(categorySelect.render());
  filterBar.appendChild(sortSelect.render());
  container.appendChild(filterBar);

  // 統計資訊
  const stats = document.createElement('div');
  stats.className = 'stats-row';
  stats.id = 'stats-row';
  updateStats();
  container.appendChild(stats);

  // 範本列表
  const templatesList = document.createElement('div');
  templatesList.className = 'templates-list';
  templatesList.id = 'templates-list';
  container.appendChild(templatesList);

  renderTemplatesList();

  function applyFilters() {
    filteredTemplates = allTemplates.filter(template => {
      // 產業篩選
      if (currentFilter.industry !== 'all' && template.industryType !== currentFilter.industry) {
        return false;
      }

      // 分類篩選
      if (currentFilter.category !== 'all' && template.category !== currentFilter.category) {
        return false;
      }

      // 搜尋篩選
      if (currentFilter.search) {
        const keyword = currentFilter.search.toLowerCase();
        const matchName = (template.name || '').toLowerCase().includes(keyword);
        const matchDesc = (template.description || '').toLowerCase().includes(keyword);
        const matchTags = template.tags?.some(tag => tag.toLowerCase().includes(keyword));

        if (!matchName && !matchDesc && !matchTags) {
          return false;
        }
      }

      return true;
    });

    // 排序
    const [sortField, sortOrder] = currentFilter.sortBy.split('-');
    filteredTemplates.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'usageCount':
          aValue = a.usageCount || 0;
          bValue = b.usageCount || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    updateStats();
    renderTemplatesList();
  }

  function updateStats() {
    const statsData = TemplateModel.getStatistics();
    stats.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">總範本數</span>
        <span class="stat-value">${statsData.total}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">啟用中</span>
        <span class="stat-value">${statsData.active}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">標準範本</span>
        <span class="stat-value">${statsData.byCategory.standard || 0}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">自訂範本</span>
        <span class="stat-value">${statsData.byCategory.custom || 0}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">顯示中</span>
        <span class="stat-value highlight">${filteredTemplates.length}</span>
      </div>
    `;
  }

  function renderTemplatesList() {
    templatesList.innerHTML = '';

    if (filteredTemplates.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <div class="empty-icon">📋</div>
        <h3>${allTemplates.length === 0 ? '尚未建立任何範本' : '沒有符合條件的範本'}</h3>
        <p>${allTemplates.length === 0 ? '點選「建立範本」開始建立第一個範本' : '請嘗試其他搜尋條件'}</p>
      `;
      templatesList.appendChild(empty);
      return;
    }

    // 按使用次數排序
    const sortedTemplates = [...filteredTemplates].sort((a, b) => {
      return (b.usageCount || 0) - (a.usageCount || 0);
    });

    sortedTemplates.forEach(template => {
      const card = createTemplateCard(template);
      templatesList.appendChild(card);
    });
  }

  function createTemplateCard(template) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'template-card';

    // 分類標籤
    const categoryLabels = {
      standard: '標準',
      custom: '自訂',
      imported: '匯入'
    };

    const categoryColors = {
      standard: '#3b82f6',
      custom: '#10b981',
      imported: '#f59e0b'
    };

    // 產業標籤
    const industryLabels = {
      'amc-filter': 'AMC 化學濾網',
      'food': '食品製造',
      'pharma': '製藥產業'
    };

    cardDiv.innerHTML = `
      <div class="template-card-header">
        <div class="template-title">
          <h3>${template.name || '未命名範本'}</h3>
          <div class="template-meta">
            <span class="badge" style="background: ${categoryColors[template.category]}20; color: ${categoryColors[template.category]};">
              ${categoryLabels[template.category] || template.category}
            </span>
            <span class="badge badge-secondary">
              ${industryLabels[template.industryType] || template.industryType}
            </span>
            ${!template.isActive ? '<span class="badge badge-inactive">已停用</span>' : ''}
          </div>
        </div>
        <div class="template-stats">
          <div class="stat-mini">
            <span class="stat-mini-value">${template.usageCount || 0}</span>
            <span class="stat-mini-label">使用次數</span>
          </div>
        </div>
      </div>

      <div class="template-card-body">
        <p class="template-description">${template.description || '暫無描述'}</p>

        <div class="template-info">
          <div class="info-item">
            <span class="info-label">欄位數量：</span>
            <span>${template.fields?.length || 0} 個</span>
          </div>
          <div class="info-item">
            <span class="info-label">版本：</span>
            <span>v${template.version || '1.0'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">建立時間：</span>
            <span>${new Date(template.createdAt).toLocaleDateString('zh-TW')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">更新時間：</span>
            <span>${new Date(template.updatedAt).toLocaleDateString('zh-TW')}</span>
          </div>
        </div>

        ${template.tags && template.tags.length > 0 ? `
          <div class="template-tags">
            ${template.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>

      <div class="template-card-footer">
      </div>
    `;

    // 操作按鈕
    const footer = cardDiv.querySelector('.template-card-footer');
    const actions = createTemplateActions(template);
    footer.appendChild(actions);

    return cardDiv;
  }

  function createTemplateActions(template) {
    const div = document.createElement('div');
    div.className = 'card-actions';

    // 預覽按鈕
    const previewBtn = new Button({
      text: '預覽',
      variant: 'outline',
      size: 'sm',
      onClick: () => showPreviewModal(template)
    });

    // 編輯按鈕
    const editBtn = new Button({
      text: '編輯',
      variant: 'outline',
      size: 'sm',
      onClick: () => showEditModal(template)
    });

    // 複製按鈕
    const duplicateBtn = new Button({
      text: '複製',
      variant: 'outline',
      size: 'sm',
      onClick: () => {
        if (confirm(`確定要複製範本「${template.name}」嗎？`)) {
          TemplateModel.duplicate(template.id);
          allTemplates = TemplateModel.getAll();
          applyFilters();
          alert('範本已複製！');
        }
      }
    });

    // 匯出按鈕
    const exportBtn = new Button({
      text: '匯出',
      variant: 'outline',
      size: 'sm',
      onClick: () => exportTemplate(template)
    });

    // 刪除按鈕
    const deleteBtn = new Button({
      text: '刪除',
      variant: 'danger',
      size: 'sm',
      onClick: () => {
        if (confirm(`確定要刪除範本「${template.name}」嗎？此操作無法復原。`)) {
          TemplateModel.delete(template.id);
          allTemplates = TemplateModel.getAll();
          applyFilters();
          alert('範本已刪除！');
        }
      }
    });

    div.appendChild(previewBtn.render());
    div.appendChild(editBtn.render());
    div.appendChild(duplicateBtn.render());
    div.appendChild(exportBtn.render());
    div.appendChild(deleteBtn.render());

    return div;
  }

  function showPreviewModal(template) {
    const modal = new Modal({
      title: `📋 範本預覽：${template.name}`,
      content: createPreviewContent(template)
    });

    modal.open();
  }

  function createPreviewContent(template) {
    const div = document.createElement('div');
    div.className = 'template-preview';

    div.innerHTML = `
      <div class="preview-section">
        <h4>基本資訊</h4>
        <div class="preview-info">
          <div class="preview-row">
            <span class="preview-label">範本名稱：</span>
            <span>${template.name}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">描述：</span>
            <span>${template.description || '暫無描述'}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">分類：</span>
            <span>${template.category}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">產業：</span>
            <span>${template.industryType}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">版本：</span>
            <span>v${template.version}</span>
          </div>
        </div>
      </div>

      <div class="preview-section">
        <h4>欄位結構 (${template.fields?.length || 0} 個欄位)</h4>
        <div class="fields-list">
          ${template.fields && template.fields.length > 0 ?
            template.fields.map((field, index) => `
              <div class="field-item">
                <div class="field-number">${index + 1}</div>
                <div class="field-info">
                  <div class="field-name">${field.label || field.name}</div>
                  <div class="field-meta">
                    類型: ${getFieldTypeLabel(field.type)}
                    ${field.required ? ' | 必填' : ''}
                    ${field.defaultValue ? ` | 預設: ${field.defaultValue}` : ''}
                  </div>
                </div>
              </div>
            `).join('') :
            '<p class="text-secondary">尚未定義欄位</p>'
          }
        </div>
      </div>

      ${template.tags && template.tags.length > 0 ? `
        <div class="preview-section">
          <h4>標籤</h4>
          <div class="tags-list">
            ${template.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const closeBtn = new Button({
      text: '關閉',
      variant: 'outline',
      onClick: () => document.querySelector('.modal')?.remove()
    });

    const useBtn = new Button({
      text: '使用此範本',
      variant: 'primary',
      onClick: () => {
        TemplateModel.incrementUsage(template.id);
        window.location.hash = `#/forms/builder?template=${template.id}`;
      }
    });

    footer.appendChild(closeBtn.render());
    footer.appendChild(useBtn.render());
    div.appendChild(footer);

    return div;
  }

  function getFieldTypeLabel(type) {
    const labels = {
      text: '文字',
      number: '數字',
      date: '日期',
      select: '選單',
      textarea: '多行文字',
      checkbox: '勾選',
      radio: '單選'
    };
    return labels[type] || type;
  }

  function exportTemplate(template) {
    try {
      const jsonData = TemplateModel.export(template.id);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${template.id}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('範本已匯出！');
    } catch (error) {
      alert('匯出失敗：' + error.message);
    }
  }

  function showEditModal(template) {
    const modal = new Modal({
      title: `編輯範本：${template.name}`,
      content: createEditForm(template)
    });

    const modalElement = modal.render();

    // 為 Modal 添加寬版樣式
    const modalDialog = modalElement.querySelector('.modal');
    if (modalDialog) {
      modalDialog.classList.add('modal-wide-xl');
    }

    modal.open();
  }

  function createEditForm(template) {
    const div = document.createElement('div');
    div.className = 'template-form';

    div.innerHTML = `
      <div class="form-group">
        <label>範本名稱 *</label>
        <input type="text" id="template-name" class="form-input" value="${template.name}" required>
      </div>

      <div class="form-group">
        <label>描述</label>
        <textarea id="template-description" class="form-input" rows="3">${template.description || ''}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>產業類型</label>
          <select id="template-industry" class="form-input" disabled>
            <option value="${template.industryType}" selected>
              ${template.industryType === 'amc-filter' ? 'AMC 化學濾網' :
                template.industryType === 'food' ? '食品製造' : '製藥產業'}
            </option>
          </select>
          <small class="form-hint">產業類型建立後無法更改</small>
        </div>

        <div class="form-group">
          <label>分類</label>
          <select id="template-category" class="form-input">
            <option value="standard" ${template.category === 'standard' ? 'selected' : ''}>標準範本</option>
            <option value="custom" ${template.category === 'custom' ? 'selected' : ''}>自訂範本</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>標籤（用逗號分隔）</label>
        <input type="text" id="template-tags" class="form-input" value="${(template.tags || []).join(', ')}">
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" id="template-active" ${template.isActive !== false ? 'checked' : ''}>
          啟用此範本
        </label>
      </div>

      <div class="form-section">
        <h4>欄位編輯器</h4>
        <div id="edit-field-editor-container"></div>
      </div>
    `;

    // 渲染欄位編輯器
    let editFieldEditorInstance = null;
    setTimeout(() => {
      const editEditorContainer = div.querySelector('#edit-field-editor-container');
      if (editEditorContainer) {
        editFieldEditorInstance = new TemplateFieldEditor({
          fields: template.fields || [],
          onChange: (fields) => {
            console.log('Fields updated:', fields);
          }
        });
        editEditorContainer.appendChild(editFieldEditorInstance.render());
      }
    }, 0);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal')?.remove()
    });

    const saveBtn = new Button({
      text: '儲存',
      variant: 'primary',
      onClick: () => {
        const name = div.querySelector('#template-name').value.trim();
        const description = div.querySelector('#template-description').value.trim();
        const category = div.querySelector('#template-category').value;
        const tagsInput = div.querySelector('#template-tags').value.trim();
        const isActive = div.querySelector('#template-active').checked;

        if (!name) {
          alert('請輸入範本名稱');
          return;
        }

        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

        // 從編輯器獲取欄位
        const fields = editFieldEditorInstance ? editFieldEditorInstance.getFields() : template.fields;

        try {
          TemplateModel.update(template.id, {
            name,
            description,
            category,
            tags,
            isActive,
            fields
          });

          alert('範本已更新！');
          document.querySelector('.modal')?.remove();
          allTemplates = TemplateModel.getAll();
          applyFilters();
        } catch (error) {
          alert('更新失敗：' + error.message);
        }
      }
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(saveBtn.render());
    div.appendChild(footer);

    return div;
  }

  function showCreateModal() {
    const modal = new Modal({
      title: '建立新範本',
      content: createTemplateForm()
    });

    const modalElement = modal.render();

    // 為 Modal 添加寬版樣式
    const modalDialog = modalElement.querySelector('.modal');
    if (modalDialog) {
      modalDialog.classList.add('modal-wide-xl');
    }

    modal.open();
  }

  function createTemplateForm() {
    const div = document.createElement('div');
    div.className = 'template-form';

    div.innerHTML = `
      <div class="form-group">
        <label>範本名稱 *</label>
        <input type="text" id="template-name" class="form-input" placeholder="例如：標準配方範本" required>
      </div>

      <div class="form-group">
        <label>描述</label>
        <textarea id="template-description" class="form-input" rows="3" placeholder="說明此範本的用途..."></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>產業類型 *</label>
          <select id="template-industry" class="form-input" required>
            <option value="amc-filter">AMC 化學濾網</option>
            <option value="food">食品製造</option>
            <option value="pharma">製藥產業</option>
          </select>
        </div>

        <div class="form-group">
          <label>分類 *</label>
          <select id="template-category" class="form-input" required>
            <option value="standard">標準範本</option>
            <option value="custom">自訂範本</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>標籤（用逗號分隔）</label>
        <input type="text" id="template-tags" class="form-input" placeholder="例如：標準,常用,推薦">
      </div>

      <div class="form-section">
        <h4>欄位設定</h4>
        <p class="form-hint">拖拽左側欄位到畫布，或點擊快速新增</p>
        <div id="field-editor-container"></div>
      </div>
    `;

    // 建立欄位編輯器
    let fieldEditorInstance = null;
    setTimeout(() => {
      const editorContainer = div.querySelector('#field-editor-container');
      if (editorContainer) {
        fieldEditorInstance = new TemplateFieldEditor({
          fields: [],
          onChange: (fields) => {
            // 欄位變更時的回調
            console.log('Fields updated:', fields);
          }
        });
        editorContainer.appendChild(fieldEditorInstance.render());
      }
    }, 0);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal')?.remove()
    });

    const createBtn = new Button({
      text: '建立',
      variant: 'primary',
      onClick: () => {
        const name = div.querySelector('#template-name').value.trim();
        const description = div.querySelector('#template-description').value.trim();
        const industry = div.querySelector('#template-industry').value;
        const category = div.querySelector('#template-category').value;
        const tagsInput = div.querySelector('#template-tags').value.trim();

        if (!name) {
          alert('請輸入範本名稱');
          return;
        }

        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

        // 從欄位編輯器取得欄位
        const fields = fieldEditorInstance ? fieldEditorInstance.getFields() : [];

        try {
          const newTemplate = TemplateModel.create({
            name,
            description,
            industryType: industry,
            category,
            fields,
            tags,
            createdBy: 'USER',
            isPublic: true
          });

          alert(`範本「${name}」已建立！共 ${fields.length} 個欄位`);
          document.querySelector('.modal')?.remove();
          allTemplates = TemplateModel.getAll();
          applyFilters();
        } catch (error) {
          alert('建立失敗：' + error.message);
        }
      }
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(createBtn.render());
    div.appendChild(footer);

    return div;
  }

  function showImportModal() {
    const modal = new Modal({
      title: '匯入範本',
      content: createImportForm()
    });

    modal.open();
  }

  function createImportForm() {
    const div = document.createElement('div');
    div.className = 'import-form';

    div.innerHTML = `
      <p class="text-secondary" style="margin-bottom: 16px;">
        選擇要匯入的範本檔案（JSON 格式）
      </p>

      <div class="file-upload">
        <input type="file" id="template-file" accept=".json" style="display: none;">
        <button class="upload-btn" id="upload-trigger">
          📁 選擇檔案
        </button>
        <span id="file-name" class="file-name">尚未選擇檔案</span>
      </div>

      <div id="preview-data" class="preview-data" style="display: none;">
        <h4>範本預覽</h4>
        <pre id="preview-json"></pre>
      </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal')?.remove()
    });

    const importBtn = new Button({
      text: '確認匯入',
      variant: 'primary',
      onClick: () => {
        const fileInput = div.querySelector('#template-file');
        const file = fileInput.files[0];

        if (!file) {
          alert('請先選擇檔案');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = e.target.result;
            const imported = TemplateModel.import(jsonData);
            alert(`範本「${imported.name}」已成功匯入！`);
            document.querySelector('.modal')?.remove();
            allTemplates = TemplateModel.getAll();
            applyFilters();
          } catch (error) {
            alert('匯入失敗：' + error.message);
          }
        };
        reader.readAsText(file);
      }
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(importBtn.render());
    div.appendChild(footer);

    // 綁定檔案選擇事件
    setTimeout(() => {
      const fileInput = div.querySelector('#template-file');
      const uploadTrigger = div.querySelector('#upload-trigger');
      const fileName = div.querySelector('#file-name');
      const previewData = div.querySelector('#preview-data');
      const previewJson = div.querySelector('#preview-json');

      uploadTrigger.onclick = () => fileInput.click();

      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          fileName.textContent = file.name;

          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              previewData.style.display = 'block';
              previewJson.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
              alert('檔案格式錯誤');
            }
          };
          reader.readAsText(file);
        }
      };
    }, 100);

    return div;
  }

  addStyles();
  return container;
}

function addStyles() {
  if (!document.getElementById('templates-page-styles')) {
    const style = document.createElement('style');
    style.id = 'templates-page-styles';
    style.textContent = `
      .modal-wide-xl {
        max-width: 1400px !important;
      }

      .templates-page {
        padding: var(--spacing-xl);
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

      .filter-bar {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
      }

      .stats-row {
        display: flex;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
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
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary-color);
      }

      .stat-value.highlight {
        color: #10b981;
      }

      .templates-list {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--spacing-lg);
      }

      .template-card {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        transition: all 0.2s;
      }

      .template-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .template-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
      }

      .template-title h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
      }

      .template-meta {
        display: flex;
        gap: var(--spacing-xs);
        flex-wrap: wrap;
      }

      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
      }

      .badge-secondary {
        background: var(--bg-secondary);
        color: var(--text-secondary);
      }

      .badge-inactive {
        background: #fee2e2;
        color: #dc2626;
      }

      .template-stats {
        text-align: center;
      }

      .stat-mini-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
      }

      .stat-mini-label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .template-card-body {
        margin-bottom: var(--spacing-md);
      }

      .template-description {
        color: var(--text-secondary);
        line-height: 1.6;
        margin-bottom: var(--spacing-md);
      }

      .template-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
      }

      .info-item {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .info-label {
        font-weight: 500;
        color: var(--text-primary);
      }

      .template-tags {
        display: flex;
        gap: var(--spacing-xs);
        flex-wrap: wrap;
      }

      .tag {
        padding: 2px 8px;
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .template-card-footer {
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border-color);
      }

      .card-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .empty-state {
        text-align: center;
        padding: calc(var(--spacing-xl) * 3);
        background: var(--bg-color);
        border-radius: var(--radius-lg);
        border: 2px dashed var(--border-color);
        grid-column: 1 / -1;
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

      /* 預覽樣式 */
      .template-preview {
        max-height: 70vh;
        overflow-y: auto;
      }

      .preview-section {
        margin-bottom: var(--spacing-xl);
        padding-bottom: var(--spacing-lg);
        border-bottom: 1px solid var(--border-color);
      }

      .preview-section:last-of-type {
        border-bottom: none;
      }

      .preview-section h4 {
        font-size: 1.125rem;
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
      }

      .preview-info {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
      }

      .preview-row {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
        font-size: 0.875rem;
      }

      .preview-row:last-child {
        margin-bottom: 0;
      }

      .preview-label {
        font-weight: 600;
        color: var(--text-primary);
        min-width: 100px;
      }

      .fields-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .field-item {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .field-number {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--primary-color);
        color: white;
        border-radius: 50%;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
      }

      .field-info {
        flex: 1;
      }

      .field-name {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--spacing-xs);
      }

      .field-meta {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .tags-list {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      /* 匯入表單 */
      .import-form {
        min-height: 200px;
      }

      .file-upload {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-lg);
        background: var(--bg-secondary);
        border: 2px dashed var(--border-color);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-md);
      }

      .upload-btn {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-weight: 500;
      }

      .upload-btn:hover {
        background: var(--primary-dark);
      }

      .file-name {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }

      .preview-data {
        margin-top: var(--spacing-md);
      }

      .preview-data h4 {
        font-size: 1rem;
        margin-bottom: var(--spacing-sm);
      }

      .preview-data pre {
        background: var(--bg-secondary);
        padding: var(--spacing-md);
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        max-height: 300px;
        overflow: auto;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-lg);
        padding-top: var(--spacing-lg);
        border-top: 1px solid var(--border-color);
      }

      /* 表單樣式 */
      .template-form {
        max-height: 70vh;
        overflow-y: auto;
      }

      .form-group {
        margin-bottom: var(--spacing-md);
      }

      .form-group label {
        display: block;
        margin-bottom: var(--spacing-xs);
        font-weight: 500;
        color: var(--text-primary);
      }

      .form-input {
        width: 100%;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 1rem;
        font-family: inherit;
      }

      .form-input:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .form-input:disabled {
        background: var(--bg-secondary);
        cursor: not-allowed;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
      }

      .form-section {
        margin-top: var(--spacing-lg);
        padding-top: var(--spacing-lg);
        border-top: 1px solid var(--border-color);
      }

      .form-section h4 {
        font-size: 1rem;
        margin-bottom: var(--spacing-sm);
      }

      .form-hint {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-top: var(--spacing-xs);
      }

      .form-note {
        background: rgba(59, 130, 246, 0.1);
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-top: var(--spacing-sm);
      }
    `;
    document.head.appendChild(style);
  }
}
