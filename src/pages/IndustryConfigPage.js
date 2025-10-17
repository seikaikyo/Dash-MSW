import { Button } from '../components/common/Button.js';
import { Modal } from '../components/common/Modal.js';
import { TemplateFieldEditor } from '../components/template-editor/TemplateFieldEditor.js';
import { IndustryFieldsManager } from '../utils/industryFieldsManager.js';
import { getCurrentIndustry } from '../config/industry.config.js';

/**
 * 產業模組配置管理頁面
 * 允許管理員編輯產業模組的欄位定義
 */
export function IndustryConfigPage() {
  const container = document.createElement('div');
  container.className = 'industry-config-page';

  const industry = getCurrentIndustry();
  let config = IndustryFieldsManager.getConfig(industry.id);
  let fieldEditorInstance = null;

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';

  const headerLeft = document.createElement('div');
  headerLeft.innerHTML = `
    <h2>🏭 產業模組配置</h2>
    <p class="text-secondary">${industry.name} - 欄位定義管理</p>
  `;

  const headerRight = document.createElement('div');
  headerRight.className = 'header-actions';

  const exportBtn = new Button({
    text: '匯出配置',
    variant: 'outline',
    onClick: () => exportConfig()
  });

  const importBtn = new Button({
    text: '匯入配置',
    variant: 'outline',
    onClick: () => showImportModal()
  });

  const resetBtn = new Button({
    text: '重置為預設',
    variant: 'outline',
    onClick: () => resetConfig()
  });

  const saveBtn = new Button({
    text: '儲存配置',
    variant: 'primary',
    onClick: () => saveConfig()
  });

  headerRight.appendChild(exportBtn.render());
  headerRight.appendChild(importBtn.render());
  headerRight.appendChild(resetBtn.render());
  headerRight.appendChild(saveBtn.render());

  header.appendChild(headerLeft);
  header.appendChild(headerRight);
  container.appendChild(header);

  // 配置統計
  const stats = IndustryFieldsManager.getConfigStats(industry.id);
  const statsBar = document.createElement('div');
  statsBar.className = 'stats-bar';
  statsBar.innerHTML = `
    <div class="stat-item">
      <span class="stat-label">欄位群組：</span>
      <span class="stat-value">${stats.totalGroups}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">總欄位數：</span>
      <span class="stat-value">${stats.totalFields}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">必填欄位：</span>
      <span class="stat-value">${stats.requiredFieldsCount}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">自訂欄位：</span>
      <span class="stat-value">${stats.customFieldsCount}</span>
    </div>
    ${stats.lastModified ? `
      <div class="stat-item">
        <span class="stat-label">最後修改：</span>
        <span class="stat-value">${new Date(stats.lastModified).toLocaleString('zh-TW')}</span>
      </div>
    ` : ''}
  `;
  container.appendChild(statsBar);

  // 欄位編輯器
  const editorSection = document.createElement('div');
  editorSection.className = 'editor-section';

  const editorHeader = document.createElement('div');
  editorHeader.className = 'section-header';
  editorHeader.innerHTML = `
    <h3>欄位編輯器</h3>
    <p class="text-secondary">設定此產業模組在建立配方時顯示的欄位</p>
  `;
  editorSection.appendChild(editorHeader);

  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  editorContainer.id = 'industry-field-editor';

  // 載入現有配置或預設配置
  const initialFields = IndustryFieldsManager.getAllFieldsFromGroups(config.fieldGroups || []);

  fieldEditorInstance = new TemplateFieldEditor({
    fields: initialFields,
    onChange: (fields) => {
      console.log('Fields updated:', fields);
    }
  });

  editorContainer.appendChild(fieldEditorInstance.render());
  editorSection.appendChild(editorContainer);
  container.appendChild(editorSection);

  // 說明區域
  const helpSection = document.createElement('div');
  helpSection.className = 'help-section';
  helpSection.innerHTML = `
    <h4>💡 使用說明</h4>
    <ul>
      <li><strong>欄位編輯：</strong>從左側工具箱拖曳欄位類型，或點擊快速新增</li>
      <li><strong>列佈局：</strong>使用「新增列」按鈕建立新的欄位列，同一列的欄位會並排顯示</li>
      <li><strong>拖曳排序：</strong>在同一列內拖曳欄位調整順序</li>
      <li><strong>屬性編輯：</strong>點擊欄位後在右側面板編輯屬性（名稱、標籤、必填等）</li>
      <li><strong>儲存配置：</strong>完成編輯後點擊「儲存配置」，之後建立配方時會使用新的欄位配置</li>
      <li><strong>重置：</strong>點擊「重置為預設」可恢復產業模組的原始欄位定義</li>
    </ul>
  `;
  container.appendChild(helpSection);

  // 儲存配置
  function saveConfig() {
    if (!fieldEditorInstance) {
      alert('欄位編輯器未初始化');
      return;
    }

    const fields = fieldEditorInstance.getFields();

    // 驗證欄位
    const validation = IndustryFieldsManager.validateFields(fields);
    if (!validation.valid) {
      alert('欄位驗證失敗：\n' + validation.errors.join('\n'));
      return;
    }

    // 按照 row 分組
    const fieldGroups = groupFieldsByRow(fields);

    // 儲存配置
    IndustryFieldsManager.updateFieldGroups(industry.id, fieldGroups);

    alert(`✅ 配置已儲存！\n\n總共 ${fieldGroups.length} 個群組，${fields.length} 個欄位\n下次建立配方時將使用新的欄位配置`);

    // 重新載入統計
    refreshStats();
  }

  // 將欄位按 row 分組
  function groupFieldsByRow(fields) {
    const groups = [];
    const rowMap = {};

    fields.forEach(field => {
      const row = field.row || 0;
      if (!rowMap[row]) {
        rowMap[row] = [];
      }
      rowMap[row].push(field);
    });

    Object.keys(rowMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach((row, index) => {
      groups.push({
        title: `欄位群組 ${index + 1}`,
        icon: '📋',
        fields: rowMap[row]
      });
    });

    return groups;
  }

  // 匯出配置
  function exportConfig() {
    const jsonString = IndustryFieldsManager.exportConfig(industry.id);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${industry.id}-fields-config.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert('配置已匯出！');
  }

  // 顯示匯入 Modal
  function showImportModal() {
    const modal = new Modal({
      title: '匯入產業模組配置',
      content: createImportForm()
    });

    modal.open();
  }

  // 建立匯入表單
  function createImportForm() {
    const div = document.createElement('div');
    div.className = 'import-form';

    div.innerHTML = `
      <div class="form-group">
        <label>選擇配置檔案</label>
        <input type="file" id="config-file" accept=".json" class="form-input">
        <small class="form-hint">請選擇先前匯出的 JSON 配置檔案</small>
      </div>
    `;

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelBtn = new Button({
      text: '取消',
      variant: 'outline',
      onClick: () => document.querySelector('.modal-overlay')?.remove()
    });

    const importSubmitBtn = new Button({
      text: '匯入',
      variant: 'primary',
      onClick: async () => {
        const fileInput = div.querySelector('#config-file');
        const file = fileInput.files[0];

        if (!file) {
          alert('請選擇檔案');
          return;
        }

        try {
          const text = await file.text();
          const result = IndustryFieldsManager.importConfig(industry.id, text);

          if (result.success) {
            alert('✅ 配置匯入成功！頁面將重新載入');
            window.location.reload();
          } else {
            alert('匯入失敗：' + result.error);
          }
        } catch (error) {
          alert('匯入失敗：' + error.message);
        }
      }
    });

    footer.appendChild(cancelBtn.render());
    footer.appendChild(importSubmitBtn.render());
    div.appendChild(footer);

    return div;
  }

  // 重置配置
  function resetConfig() {
    if (!confirm('確定要重置為預設配置嗎？\n\n這將清除所有自訂的欄位配置，並恢復產業模組的原始設定。')) {
      return;
    }

    IndustryFieldsManager.resetToDefault(industry.id);
    alert('✅ 已重置為預設配置！頁面將重新載入');
    window.location.reload();
  }

  // 刷新統計
  function refreshStats() {
    const newStats = IndustryFieldsManager.getConfigStats(industry.id);
    statsBar.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">欄位群組：</span>
        <span class="stat-value">${newStats.totalGroups}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">總欄位數：</span>
        <span class="stat-value">${newStats.totalFields}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">必填欄位：</span>
        <span class="stat-value">${newStats.requiredFieldsCount}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">自訂欄位：</span>
        <span class="stat-value">${newStats.customFieldsCount}</span>
      </div>
      ${newStats.lastModified ? `
        <div class="stat-item">
          <span class="stat-label">最後修改：</span>
          <span class="stat-value">${new Date(newStats.lastModified).toLocaleString('zh-TW')}</span>
        </div>
      ` : ''}
    `;
  }

  addStyles();
  return container;
}

function addStyles() {
  if (!document.getElementById('industry-config-page-styles')) {
    const style = document.createElement('style');
    style.id = 'industry-config-page-styles';
    style.textContent = `
      .industry-config-page {
        padding: var(--spacing-xl);
        max-width: 1600px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-lg);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      .stats-bar {
        display: flex;
        gap: var(--spacing-lg);
        padding: var(--spacing-lg);
        background: var(--bg-secondary);
        border-radius: var(--radius-lg);
        margin-bottom: var(--spacing-xl);
        flex-wrap: wrap;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .stat-value {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .editor-section {
        margin-bottom: var(--spacing-xl);
      }

      .section-header {
        margin-bottom: var(--spacing-lg);
      }

      .section-header h3 {
        margin: 0 0 var(--spacing-xs) 0;
        font-size: 1.25rem;
        color: var(--text-primary);
      }

      .editor-container {
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
      }

      .help-section {
        padding: var(--spacing-lg);
        background: var(--bg-secondary);
        border-radius: var(--radius-lg);
        border-left: 4px solid var(--primary-color);
      }

      .help-section h4 {
        margin: 0 0 var(--spacing-md) 0;
        color: var(--text-primary);
      }

      .help-section ul {
        margin: 0;
        padding-left: var(--spacing-lg);
        color: var(--text-secondary);
      }

      .help-section li {
        margin-bottom: var(--spacing-sm);
        line-height: 1.6;
      }

      .import-form {
        min-width: 400px;
      }
    `;
    document.head.appendChild(style);
  }
}
