import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { Modal } from '../components/common/Modal.js';
import { FormModel } from '../utils/dataModel.js';
import { auditLogger } from '../utils/auditLogger.js';
import { getCurrentIndustry } from '../config/industry.config.js';
import { TemplateModel } from '../utils/templateModel.js';
import { IndustryFieldsManager } from '../utils/industryFieldsManager.js';

/**
 * RecipeBuilderPage - 配方建置器頁面
 *
 * 整合產業模組，動態載入配方欄位
 */
export async function RecipeBuilderPage() {
  const container = document.createElement('div');
  container.className = 'recipe-builder-page';

  // 載入當前產業模組
  const industry = getCurrentIndustry();
  const fieldsModule = await industry.fields();
  const validationsModule = await industry.validations();

  const { fieldGroups: defaultFieldGroups, getAllFields } = fieldsModule;
  const { validateRecipe } = validationsModule;

  // 載入產業模組配置（如果有自訂配置，優先使用）
  const industryConfig = IndustryFieldsManager.getConfig(industry.id);
  const fieldGroups = IndustryFieldsManager.mergeFields(defaultFieldGroups, industryConfig);

  // 從 TemplateModel 載入範本（依產業類型篩選）
  const templates = TemplateModel.getByIndustry(industry.id);

  let currentRecipe = null;
  let recipeData = {};
  let selectedTemplate = null;
  let fieldComponents = {}; // 儲存欄位元件參考

  // 檢查是否編輯現有配方
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const recipeId = urlParams.get('id');

  if (recipeId) {
    currentRecipe = FormModel.getById(recipeId);
    if (currentRecipe) {
      recipeData = currentRecipe.fields.reduce((acc, field) => {
        acc[field.name] = field.value || '';
        return acc;
      }, {});
    }
  }

  // 頁首
  const header = document.createElement('div');
  header.className = 'builder-header';

  const headerLeft = document.createElement('div');
  headerLeft.innerHTML = `
    <h2>${currentRecipe ? '編輯配方' : '建立新配方'}</h2>
    <p class="text-secondary">${industry.name} - ${industry.description}</p>
  `;

  const headerRight = document.createElement('div');
  headerRight.className = 'header-actions';

  // 範本按鈕
  if (!currentRecipe && templates.length > 0) {
    const templateBtn = new Button({
      text: '使用範本',
      variant: 'outline',
      onClick: () => showTemplateModal()
    });
    headerRight.appendChild(templateBtn.render());
  }

  const saveBtn = new Button({
    text: '儲存配方',
    variant: 'primary',
    onClick: () => saveRecipe()
  });

  const cancelBtn = new Button({
    text: '取消',
    variant: 'outline',
    onClick: () => {
      if (confirm('確定要取消嗎？未儲存的變更將會遺失。')) {
        window.location.hash = '#/forms';
      }
    }
  });

  headerRight.appendChild(cancelBtn.render());
  headerRight.appendChild(saveBtn.render());

  header.appendChild(headerLeft);
  header.appendChild(headerRight);
  container.appendChild(header);

  // 配方表單
  const formContainer = document.createElement('div');
  formContainer.className = 'recipe-form-container';

  // 基本資訊（配方名稱、描述）
  const basicInfo = document.createElement('div');
  basicInfo.className = 'recipe-basic-info';
  basicInfo.innerHTML = `
    <h3>基本資訊</h3>
  `;

  const recipeNameInput = new Input({
    label: '配方名稱',
    placeholder: '請輸入配方名稱',
    value: currentRecipe?.name || '',
    required: true,
    onChange: (value) => {
      recipeData.recipeName = value;
    }
  });

  const recipeDescInput = new Input({
    label: '配方說明',
    placeholder: '請輸入配方說明',
    value: currentRecipe?.description || '',
    onChange: (value) => {
      recipeData.recipeDescription = value;
    }
  });

  basicInfo.appendChild(recipeNameInput.render());
  basicInfo.appendChild(recipeDescInput.render());
  formContainer.appendChild(basicInfo);

  // 渲染欄位群組
  fieldGroups.forEach(group => {
    const groupContainer = document.createElement('div');
    groupContainer.className = 'recipe-field-group';

    const groupHeader = document.createElement('div');
    groupHeader.className = 'group-header';
    groupHeader.innerHTML = `
      <h3>${group.icon} ${group.label}</h3>
    `;
    groupContainer.appendChild(groupHeader);

    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'group-fields';

    // 渲染欄位
    group.fields.forEach(field => {
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'field-wrapper';

      const result = createFieldComponent(field, recipeData);
      if (result) {
        fieldWrapper.appendChild(result.element);
        fieldsContainer.appendChild(fieldWrapper);
        // 儲存元件參考
        if (result.component) {
          fieldComponents[field.name] = result.component;
        }
      }
    });

    groupContainer.appendChild(fieldsContainer);
    formContainer.appendChild(groupContainer);
  });

  container.appendChild(formContainer);

  // 顯示範本選擇 Modal
  function showTemplateModal() {
    const modal = new Modal({
      title: '選擇配方範本',
      content: createTemplateSelector()
    });

    modal.open();
  }

  // 建立範本選擇器
  function createTemplateSelector() {
    const selector = document.createElement('div');
    selector.className = 'template-selector';

    if (templates.length === 0) {
      selector.innerHTML = `
        <div class="empty-state">
          <p>目前沒有可用的範本</p>
          <p class="text-secondary">請到「配方範本」頁面建立範本</p>
        </div>
      `;
      return selector;
    }

    templates.forEach(template => {
      const templateCard = document.createElement('div');
      templateCard.className = 'template-card';

      const categoryLabels = {
        standard: '標準範本',
        custom: '自訂範本'
      };

      templateCard.innerHTML = `
        <div class="template-header">
          <h4>${template.name}</h4>
          <span class="badge badge-outline">${categoryLabels[template.category] || template.category}</span>
        </div>
        <p class="text-secondary">${template.description || ''}</p>
        <div class="template-meta">
          <span class="meta-item">📋 ${template.fields?.length || 0} 個欄位</span>
          <span class="meta-item">🔢 v${template.version}</span>
          <span class="meta-item">📊 使用 ${template.usageCount || 0} 次</span>
        </div>
        ${template.tags && template.tags.length > 0 ? `
          <div class="template-tags">
            ${template.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      `;

      templateCard.addEventListener('click', () => {
        applyTemplate(template);
      });

      selector.appendChild(templateCard);
    });

    return selector;
  }

  // 套用範本
  function applyTemplate(template) {
    selectedTemplate = template;

    // 從範本欄位建立預設值對象（支援新舊格式）
    let defaultValues = {};

    // 新格式：template.fields 陣列
    if (template.fields && Array.isArray(template.fields)) {
      template.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaultValues[field.name] = field.defaultValue;
        }
      });
    }
    // 舊格式：template.defaultValues 物件（來自舊的 templates.js）
    else if (template.defaultValues) {
      defaultValues = { ...template.defaultValues };
    }

    // 合併到 recipeData
    recipeData = { ...recipeData, ...defaultValues };

    // 更新基本資訊欄位（處理命名映射）
    if (defaultValues.productName) {
      recipeNameInput.setValue(defaultValues.productName);
      recipeData.recipeName = defaultValues.productName;
    }
    if (defaultValues.description) {
      recipeDescInput.setValue(defaultValues.description);
      recipeData.recipeDescription = defaultValues.description;
    }

    // 更新所有動態欄位
    Object.keys(defaultValues).forEach(fieldName => {
      const value = defaultValues[fieldName];
      const component = fieldComponents[fieldName];

      if (value !== undefined && component && component.setValue) {
        component.setValue(value);
      }
    });

    // 更新 textarea 欄位（沒有元件包裝）
    document.querySelectorAll('.recipe-form-container textarea').forEach(textarea => {
      const fieldName = textarea.dataset.fieldName;
      if (fieldName && defaultValues[fieldName] !== undefined) {
        textarea.value = defaultValues[fieldName];
      }
    });

    // 更新範本使用統計
    TemplateModel.incrementUsage(template.id);

    // 關閉 modal
    document.querySelector('.modal-overlay')?.remove();

    // 計算實際填入的欄位數
    const filledCount = Object.keys(defaultValues).length;

    // 顯示提示
    alert(`已套用範本：${template.name}\n已填入 ${filledCount} 個欄位的預設值`);
  }

  // 建立欄位元件
  function createFieldComponent(field, data) {
    const value = data[field.name] || field.defaultValue || '';

    switch (field.type) {
      case 'text': {
        const component = new Input({
          label: field.label + (field.required ? ' *' : ''),
          placeholder: field.placeholder || '',
          value: value,
          required: field.required,
          onChange: (val) => {
            data[field.name] = val;
          }
        });
        return { element: component.render(), component };
      }

      case 'number': {
        const component = new Input({
          label: field.label + (field.required ? ' *' : ''),
          type: 'number',
          placeholder: field.placeholder || '',
          value: value,
          required: field.required,
          min: field.min,
          max: field.max,
          step: field.step,
          onChange: (val) => {
            data[field.name] = val;
          }
        });
        return { element: component.render(), component };
      }

      case 'select': {
        const component = new Select({
          label: field.label + (field.required ? ' *' : ''),
          options: field.options || [],
          value: value,
          required: field.required,
          onChange: (val) => {
            data[field.name] = val;
          }
        });
        return { element: component.render(), component };
      }

      case 'textarea': {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.innerHTML = `
          <label>${field.label}${field.required ? ' *' : ''}</label>
          <textarea
            class="form-textarea"
            data-field-name="${field.name}"
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
          >${value}</textarea>
        `;

        const textarea = wrapper.querySelector('textarea');
        textarea.addEventListener('input', (e) => {
          data[field.name] = e.target.value;
        });

        return { element: wrapper, component: null };
      }

      default:
        return null;
    }
  }

  // 產生配方編號
  function generateRecipeNo() {
    const year = new Date().getFullYear();
    const existingRecipes = FormModel.getAll();

    // 找出今年的最大流水號
    const yearPrefix = `AMC-${year}-`;
    const existingNos = existingRecipes
      .map(r => {
        // 從 fields 中找出 recipeNo 欄位
        const recipeNoField = r.fields.find(f => f.name === 'recipeNo');
        return recipeNoField?.value || '';
      })
      .filter(no => no.startsWith(yearPrefix))
      .map(no => parseInt(no.split('-')[2]) || 0);

    const maxNo = existingNos.length > 0 ? Math.max(...existingNos) : 0;
    const newNo = (maxNo + 1).toString().padStart(3, '0');

    return `${yearPrefix}${newNo}`;
  }

  // 儲存配方
  async function saveRecipe() {
    // 取得配方名稱與描述
    const recipeName = recipeData.recipeName || recipeNameInput.getValue();
    const recipeDesc = recipeData.recipeDescription || recipeDescInput.getValue();

    if (!recipeName) {
      alert('請輸入配方名稱');
      return;
    }

    // 驗證配方
    const validation = validateRecipe(recipeData);

    if (!validation.valid) {
      const errors = validation.errors.map(e => `${e.field}: ${e.message}`).join('\n');
      alert('配方驗證失敗：\n' + errors);
      return;
    }

    // 顯示警告（如果有）
    if (validation.warnings.length > 0) {
      const warnings = validation.warnings.map(w => `${w.field}: ${w.message}`).join('\n');
      if (!confirm('配方驗證警告：\n' + warnings + '\n\n是否繼續儲存？')) {
        return;
      }
    }

    // 自動產生配方編號和版本
    const recipeNo = currentRecipe ?
      currentRecipe.fields.find(f => f.name === 'recipeNo')?.value :
      generateRecipeNo();
    const version = currentRecipe ?
      (parseFloat(currentRecipe.fields.find(f => f.name === 'version')?.value || '1.0') + 0.1).toFixed(1) :
      '1.0';

    // 將自動產生的欄位加入 recipeData
    recipeData.recipeNo = recipeNo;
    recipeData.version = version;

    // 轉換為 FormModel 格式
    const fields = getAllFields().map(field => ({
      id: field.name,
      name: field.name,
      label: field.label,
      type: field.type,
      value: recipeData[field.name] || '',
      required: field.required || false,
      options: field.options || []
    }));

    // 添加系統自動欄位
    fields.push(
      {
        id: 'recipeNo',
        name: 'recipeNo',
        label: '配方編號',
        type: 'text',
        value: recipeNo,
        required: true,
        options: []
      },
      {
        id: 'version',
        name: 'version',
        label: '配方版本',
        type: 'text',
        value: version,
        required: true,
        options: []
      }
    );

    try {
      let savedRecipe;

      if (currentRecipe) {
        // 更新現有配方
        currentRecipe.name = recipeName;
        currentRecipe.description = recipeDesc;
        currentRecipe.fields = fields;
        currentRecipe.industry = industry.id;
        currentRecipe.template = selectedTemplate?.id || null;
        savedRecipe = currentRecipe.save();
        auditLogger.logUpdateForm(currentRecipe.id, recipeName);
        alert(`配方更新成功！\n配方編號：${recipeNo}\n版本：${version}`);
      } else {
        // 建立新配方
        const newRecipe = new FormModel({
          name: recipeName,
          description: recipeDesc,
          fields: fields,
          industry: industry.id,
          template: selectedTemplate?.id || null
        });
        savedRecipe = newRecipe.save();
        auditLogger.logCreateForm(recipeName);
        alert(`配方建立成功！\n配方編號：${recipeNo}\n版本：${version}`);
      }

      window.location.hash = '#/forms';
    } catch (error) {
      alert('儲存失敗：' + error.message);
    }
  }

  addStyles();
  return container;
}

function addStyles() {
  if (!document.getElementById('recipe-builder-styles')) {
    const style = document.createElement('style');
    style.id = 'recipe-builder-styles';
    style.textContent = `
      .recipe-builder-page {
        padding: var(--spacing-xl);
        max-width: 1200px;
        margin: 0 auto;
      }

      .builder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-xl);
        padding-bottom: var(--spacing-lg);
        border-bottom: 2px solid var(--border-color);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-md);
      }

      .recipe-form-container {
        background: var(--bg-color);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
      }

      .recipe-basic-info {
        margin-bottom: var(--spacing-xl);
        padding-bottom: var(--spacing-xl);
        border-bottom: 1px solid var(--border-color);
      }

      .recipe-basic-info h3 {
        margin-bottom: var(--spacing-lg);
        color: var(--text-primary);
      }

      .recipe-field-group {
        margin-bottom: var(--spacing-xl);
      }

      .group-header {
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .group-header h3 {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.125rem;
      }

      .group-fields {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
        padding: var(--spacing-lg);
      }

      .field-wrapper {
        min-width: 0;
      }

      .form-textarea {
        width: 100%;
        min-height: 100px;
        padding: var(--spacing-sm);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-family: var(--font-family);
        font-size: 0.875rem;
        resize: vertical;
      }

      .form-textarea:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      /* 範本選擇器 */
      .template-selector {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--spacing-lg);
        padding: var(--spacing-lg);
        max-height: 500px;
        overflow-y: auto;
      }

      .template-selector .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: var(--spacing-xxl);
        color: var(--text-tertiary);
      }

      .template-card {
        padding: var(--spacing-lg);
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all 0.2s;
      }

      .template-card:hover {
        border-color: var(--primary-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .template-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
      }

      .template-header h4 {
        margin: 0;
        color: var(--text-primary);
        flex: 1;
      }

      .template-card p {
        margin: 0 0 var(--spacing-md);
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .template-meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
        font-size: 0.75rem;
        color: var(--text-tertiary);
      }

      .template-meta .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .template-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-sm);
      }

      .template-tags .tag {
        display: inline-block;
        padding: 2px 8px;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 0.7rem;
        color: var(--text-secondary);
      }
    `;
    document.head.appendChild(style);
  }
}
