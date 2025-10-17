import { FieldPalette } from '../components/form-builder/FieldPalette.js';
import { FormCanvas } from '../components/form-builder/FormCanvas.js';
import { PropertyPanel } from '../components/form-builder/PropertyPanel.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Modal } from '../components/common/Modal.js';
import { FormModel } from '../utils/dataModel.js';
import { auditLogger } from '../utils/auditLogger.js';

export function FormBuilderPage() {
  const container = document.createElement('div');
  container.className = 'form-builder-page';

  let currentForm = null;
  let formNameInput = null;
  let formDescInput = null;

  // 檢查是否編輯現有表單
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const formId = urlParams.get('id');

  if (formId) {
    currentForm = FormModel.getById(formId);
  }

  // 頁首
  const header = document.createElement('div');
  header.className = 'builder-header';

  const headerLeft = document.createElement('div');
  headerLeft.innerHTML = `
    <h2>${currentForm ? '編輯表單' : '建立新表單'}</h2>
  `;

  const headerRight = document.createElement('div');
  headerRight.className = 'header-actions';

  const saveBtn = new Button({
    text: '儲存表單',
    variant: 'primary',
    onClick: () => saveForm()
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

  // 表單資訊
  const formInfo = document.createElement('div');
  formInfo.className = 'form-info';

  formNameInput = new Input({
    label: '表單名稱',
    placeholder: '請輸入表單名稱',
    value: currentForm?.name || '',
    required: true
  });

  formDescInput = new Input({
    label: '表單說明',
    placeholder: '請輸入表單說明',
    value: currentForm?.description || ''
  });

  formInfo.appendChild(formNameInput.render());
  formInfo.appendChild(formDescInput.render());
  container.appendChild(formInfo);

  // 建立三欄佈局
  const builderContent = document.createElement('div');
  builderContent.className = 'builder-content';

  // 左側：欄位元件庫
  const leftPanel = document.createElement('div');
  leftPanel.className = 'builder-panel builder-left';
  const fieldPalette = new FieldPalette();
  leftPanel.appendChild(fieldPalette.render());

  // 中間：表單畫布
  const centerPanel = document.createElement('div');
  centerPanel.className = 'builder-panel builder-center';
  const formCanvas = new FormCanvas();
  centerPanel.appendChild(formCanvas.render());

  // 右側：屬性面板
  const rightPanel = document.createElement('div');
  rightPanel.className = 'builder-panel builder-right';
  const propertyPanel = new PropertyPanel();
  rightPanel.appendChild(propertyPanel.render());

  builderContent.appendChild(leftPanel);
  builderContent.appendChild(centerPanel);
  builderContent.appendChild(rightPanel);
  container.appendChild(builderContent);

  // 載入現有表單資料
  if (currentForm && currentForm.fields) {
    formCanvas.setFields(currentForm.fields);
  }

  // 事件綁定
  fieldPalette.element.addEventListener('fieldClick', (e) => {
    formCanvas.addField(e.detail.field);
  });

  formCanvas.onFieldSelect = (field) => {
    propertyPanel.setSelectedField(field);
  };

  formCanvas.onFieldsChange = (fields) => {
    // 欄位變更時可以做額外處理
  };

  propertyPanel.onFieldUpdate = (fieldId, updates) => {
    formCanvas.updateField(fieldId, updates);
  };

  // 儲存表單
  function saveForm() {
    const formName = formNameInput.getValue();
    const formDesc = formDescInput.getValue();
    const fields = formCanvas.getFieldsWithLayout();

    if (!formName.trim()) {
      alert('請輸入表單名稱');
      return;
    }

    // 檢查是否有任何欄位（fields 是 rows 陣列）
    const hasFields = fields.some(row => row.fields && row.fields.length > 0);
    if (!hasFields) {
      alert('請至少新增一個欄位');
      return;
    }

    const isEdit = !!currentForm?.id;
    const formData = {
      id: currentForm?.id,
      name: formName,
      description: formDesc,
      fields: fields
    };

    const form = new FormModel(formData);
    form.save();

    // 記錄操作日誌
    if (isEdit) {
      auditLogger.logUpdateForm(form.id, formName);
    } else {
      auditLogger.logCreateForm(form.id, formName);
    }

    const modal = new Modal({
      title: '儲存成功',
      content: '<p>表單已成功儲存</p>',
      showClose: false
    });

    const modalBody = document.createElement('div');
    modalBody.innerHTML = '<p>表單已成功儲存</p>';

    const okBtn = new Button({
      text: '確定',
      variant: 'primary',
      onClick: () => {
        modal.close();
        window.location.hash = '#/forms';
      }
    });

    modalBody.appendChild(okBtn.render());
    modal.setContent(modalBody);
    modal.render();
    modal.open();
  }

  addStyles();
  return container;
}

function addStyles() {
  if (!document.getElementById('form-builder-page-styles')) {
    const style = document.createElement('style');
    style.id = 'form-builder-page-styles';
    style.textContent = `
      .form-builder-page {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .builder-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-lg);
        border-bottom: 1px solid var(--border-color);
      }

      .builder-header h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-md);
      }

      .form-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-lg);
        background: var(--bg-color);
        border-radius: var(--radius-lg);
      }

      .builder-content {
        flex: 1;
        display: grid;
        grid-template-columns: 220px 1fr 260px;
        gap: var(--spacing-lg);
        min-height: 0;
      }

      .builder-panel {
        min-height: 0;
      }

      .builder-left,
      .builder-right {
        overflow-y: auto;
      }

      .builder-center {
        overflow-y: auto;
      }

      @media (max-width: 1200px) {
        .builder-content {
          grid-template-columns: 200px 1fr 240px;
        }
      }

      @media (max-width: 992px) {
        .builder-content {
          grid-template-columns: 1fr;
        }

        .builder-left,
        .builder-right {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
