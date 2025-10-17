import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { FormInstanceModel, generateApplicationNo } from '../utils/dataModel.js';
import { authService } from '../utils/authService.js';
import { getCurrentIndustry } from '../config/industry.config.js';
import { IndustryFieldsManager } from '../utils/industryFieldsManager.js';
import { WorkOrderNumberGenerator } from '../utils/workOrderNumberGenerator.js';

/**
 * ApplyPage - 工單建立頁面
 * 用於建立柳營再生濾網製程工單
 */
export async function ApplyPage() {
  const container = document.createElement('div');
  container.className = 'apply-page';

  let workOrderData = {};
  let existingWorkOrder = null;

  // 檢查是否編輯現有工單
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const workOrderId = urlParams.get('id');

  if (workOrderId) {
    existingWorkOrder = FormInstanceModel.getById(workOrderId);
    if (existingWorkOrder) {
      workOrderData = { ...existingWorkOrder.data };
    }
  }

  // 載入當前產業模組（柳營再生濾網）
  const industry = getCurrentIndustry();
  const fieldsModule = await industry.fields();
  const { fieldGroups: defaultFieldGroups } = fieldsModule;

  // 載入產業模組配置
  const industryConfig = IndustryFieldsManager.getConfig(industry.id);
  const fieldGroups = IndustryFieldsManager.mergeFields(defaultFieldGroups, industryConfig);

  // 頁首
  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `
    <h2>${existingWorkOrder ? '📝 編輯工單' : '📝 建立新工單'}</h2>
    <p class="text-secondary">柳營再生濾網製程工單</p>
  `;
  container.appendChild(header);

  // 動作按鈕區
  const actionBar = document.createElement('div');
  actionBar.className = 'action-bar';
  actionBar.style.cssText = 'display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 24px;';

  const cancelBtn = new Button({
    text: '取消',
    variant: 'outline',
    onClick: () => {
      if (confirm('確定要取消嗎？未儲存的變更將會遺失。')) {
        window.location.hash = '#/forms';
      }
    }
  });

  const saveBtn = new Button({
    text: existingWorkOrder ? '更新工單' : '建立工單',
    variant: 'primary',
    onClick: () => saveWorkOrder()
  });

  actionBar.appendChild(cancelBtn.render());
  actionBar.appendChild(saveBtn.render());
  container.appendChild(actionBar);

  // 工單表單區
  const formContainer = document.createElement('div');
  formContainer.className = 'work-order-form';

  // 渲染欄位群組
  fieldGroups.forEach(group => {
    const groupCard = renderFieldGroup(group);
    formContainer.appendChild(groupCard);
  });

  container.appendChild(formContainer);

  addStyles();
  return container;

  // ========== 功能函數 ==========

  function renderFieldGroup(group) {
    const cardContent = document.createElement('div');
    cardContent.className = 'field-group-content';

    group.fields.forEach(field => {
      // 處理群組型欄位（如除膠站點、烘箱處理）
      if (field.type === 'group' && field.fields) {
        const subGroup = document.createElement('div');
        subGroup.className = 'field-subgroup';
        subGroup.innerHTML = `<h4 class="subgroup-title">${field.label}</h4>`;

        field.fields.forEach(subField => {
          const fieldEl = createFieldInput(subField);
          subGroup.appendChild(fieldEl);
        });

        cardContent.appendChild(subGroup);
      } else {
        const fieldEl = createFieldInput(field);
        cardContent.appendChild(fieldEl);
      }
    });

    const card = new Card({
      title: `${group.icon || ''} ${group.title}`,
      content: cardContent
    });

    return card.render();
  }

  function createFieldInput(field) {
    const wrapper = document.createElement('div');
    wrapper.className = 'field-wrapper';

    const initialValue = workOrderData[field.name] || field.value || '';

    // 處理不同欄位類型
    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
      case 'datetime-local':
        const input = new Input({
          label: field.label,
          type: field.type,
          placeholder: field.placeholder || field.description || '',
          value: initialValue,
          required: field.required,
          onChange: (value) => {
            workOrderData[field.name] = value;
          }
        });
        wrapper.appendChild(input.render());
        break;

      case 'select':
        const label = document.createElement('label');
        label.className = 'field-label';
        label.textContent = field.label;
        if (field.required) {
          const required = document.createElement('span');
          required.className = 'field-required';
          required.textContent = ' *';
          label.appendChild(required);
        }
        wrapper.appendChild(label);

        if (field.description) {
          const desc = document.createElement('div');
          desc.className = 'field-description';
          desc.textContent = field.description;
          wrapper.appendChild(desc);
        }

        const radioGroup = document.createElement('div');
        radioGroup.className = 'radio-group';

        (field.options || []).forEach((opt, index) => {
          const radioWrapper = document.createElement('label');
          radioWrapper.className = 'radio-option';

          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = field.name;
          radio.value = opt;
          radio.className = 'radio-input';
          radio.required = field.required && index === 0; // 只在第一個加 required

          if (opt === initialValue) {
            radio.checked = true;
          }

          radio.addEventListener('change', (e) => {
            if (e.target.checked) {
              workOrderData[field.name] = e.target.value;
            }
          });

          const radioLabel = document.createElement('span');
          radioLabel.className = 'radio-label';
          radioLabel.textContent = opt;

          radioWrapper.appendChild(radio);
          radioWrapper.appendChild(radioLabel);
          radioGroup.appendChild(radioWrapper);
        });

        wrapper.appendChild(radioGroup);
        break;

      case 'textarea':
        const textareaLabel = document.createElement('label');
        textareaLabel.className = 'field-label';
        textareaLabel.textContent = field.label;
        if (field.required) {
          const required = document.createElement('span');
          required.className = 'field-required';
          required.textContent = ' *';
          textareaLabel.appendChild(required);
        }
        wrapper.appendChild(textareaLabel);

        const textarea = document.createElement('textarea');
        textarea.className = 'field-textarea';
        textarea.placeholder = field.placeholder || field.description || '';
        textarea.value = initialValue;
        textarea.required = field.required;
        textarea.rows = field.rows || 3;
        textarea.addEventListener('input', (e) => {
          workOrderData[field.name] = e.target.value;
        });

        wrapper.appendChild(textarea);
        break;
    }

    return wrapper;
  }

  function saveWorkOrder() {
    // 簡單驗證
    const requiredFields = [];
    fieldGroups.forEach(group => {
      group.fields.forEach(field => {
        if (field.type === 'group' && field.fields) {
          field.fields.forEach(subField => {
            if (subField.required) {
              requiredFields.push({ name: subField.name, label: subField.label });
            }
          });
        } else if (field.required) {
          requiredFields.push({ name: field.name, label: field.label });
        }
      });
    });

    for (const field of requiredFields) {
      if (!workOrderData[field.name]) {
        alert(`請填寫必填欄位：${field.label}`);
        return;
      }
    }

    // 取得當前登入使用者
    const currentUser = authService.getCurrentUser();

    if (existingWorkOrder) {
      // 更新現有工單
      existingWorkOrder.data = workOrderData;
      existingWorkOrder.updatedAt = Date.now();
      existingWorkOrder.save();

      alert('工單已更新！');
      window.location.hash = '#/forms';
    } else {
      // 建立新工單 - 使用 WorkOrderNumberGenerator 產生唯一工單號
      const workOrderNo = WorkOrderNumberGenerator.generate();

      // 將工單號加入工單資料
      workOrderData.workOrderNo = workOrderNo;

      const instance = new FormInstanceModel({
        applicationNo: workOrderNo, // 使用工單號作為申請單號
        formName: '柳營再生濾網工單',
        applicant: currentUser ? currentUser.name : '訪客',
        department: currentUser ? currentUser.department : '製程部',
        data: workOrderData,
        status: 'pending'
      });

      instance.save();

      alert(`工單建立成功！\n工單編號：${workOrderNo}`);
      window.location.hash = '#/forms';
    }
  }
}

function addStyles() {
  if (!document.getElementById('apply-page-styles')) {
    const style = document.createElement('style');
    style.id = 'apply-page-styles';
    style.textContent = `
      .apply-page {
        padding: var(--spacing-xl);
        max-width: 1200px;
        margin: 0 auto;
      }

      .work-order-form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .field-group-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--spacing-md);
        padding: var(--spacing-md);
      }

      .field-subgroup {
        grid-column: 1 / -1;
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border-radius: 6px;
        border-left: 3px solid var(--primary-color);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--spacing-md);
      }

      .subgroup-title {
        grid-column: 1 / -1;
        margin: 0 0 8px 0;
        color: var(--text-primary);
        font-size: 0.875rem;
        font-weight: 600;
      }

      .field-wrapper {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .field-label {
        font-weight: 500;
        color: var(--text-primary);
        font-size: 0.8125rem;
        line-height: 1.3;
      }

      .field-required {
        color: var(--error-color);
      }

      .field-description {
        font-size: 0.7rem;
        color: var(--text-secondary);
        margin-top: -3px;
        line-height: 1.2;
      }

      .field-textarea {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-family: var(--font-family);
        font-size: 0.875rem;
        resize: vertical;
        min-height: 60px;
      }

      .field-textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-light);
      }

      .radio-group {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
      }

      .radio-option {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border: 1.5px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        background: white;
      }

      .radio-option:hover {
        border-color: var(--primary-color);
        background: var(--primary-light);
      }

      .radio-option:has(.radio-input:checked) {
        border-color: var(--primary-color);
        background: var(--primary-light);
        font-weight: 500;
      }

      .radio-input {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: var(--primary-color);
        margin: 0;
        flex-shrink: 0;
      }

      .radio-label {
        flex: 1;
        font-size: 0.8125rem;
        color: var(--text-primary);
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
    document.head.appendChild(style);
  }
}
