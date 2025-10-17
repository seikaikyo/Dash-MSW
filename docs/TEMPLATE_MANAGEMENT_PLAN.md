# 配方範本管理系統規劃

## 概述

配方範本系統需要從「寫死在程式碼」升級為「可透過 UI 管理的動態系統」，並提供類似審核流程設計器的拖拽式編輯體驗。

## 目前問題

### 現況
```javascript
// 寫死在 src/industries/amc-filter/templates.js
export const amcFilterTemplates = [
  {
    name: '標準配方範本',
    description: '適用於一般化學濾網生產',
    defaultValues: {
      filterType: '化學濾網',
      chemicalAgent: '活性氧化鋁',
      // ... 固定值
    }
  }
];
```

### 問題點
1. ❌ 無法透過 UI 新增/編輯範本
2. ❌ 需要修改程式碼才能調整
3. ❌ 無法動態調整欄位結構
4. ❌ 無版本控制
5. ❌ 無使用統計

## 新系統架構

### 1. 範本管理頁面（TemplatesPage）

```
┌─────────────────────────────────────────────────────────┐
│ 配方範本管理                      [建立範本] [匯入範本] │
├─────────────────────────────────────────────────────────┤
│ 搜尋: [________________]  產業: [AMC化學濾網 ▼]        │
│                                                         │
│ 📋 標準配方範本                      [編輯] [複製] [刪除]│
│    產業: AMC化學濾網 | 分類: 標準 | 使用次數: 45       │
│    欄位數: 16 | 版本: 1.2 | 建立時間: 2025-09-01      │
│                                                         │
│ 📋 高效化學濾網範本                  [編輯] [複製] [刪除]│
│    產業: AMC化學濾網 | 分類: 標準 | 使用次數: 32       │
│    欄位數: 16 | 版本: 1.0 | 建立時間: 2025-09-15      │
│                                                         │
│ 📋 自訂複合濾網範本                  [編輯] [複製] [刪除]│
│    產業: AMC化學濾網 | 分類: 自訂 | 使用次數: 8        │
│    欄位數: 20 | 版本: 2.1 | 建立時間: 2025-10-01      │
└─────────────────────────────────────────────────────────┘
```

### 2. 範本編輯器（TemplateDesigner）

類似審核流程設計器的拖拽介面：

```
┌─────────────────────────────────────────────────────────┐
│ 編輯範本: 標準配方範本              [儲存] [取消] [預覽]│
├──────────────┬──────────────────────────────────────────┤
│ 欄位工具箱   │ 配方範本畫布                              │
│              │                                          │
│ 基本資訊     │  ┌─────────────────────────────────┐    │
│ ┌──────────┐ │  │ 📦 基本資訊                     │    │
│ │ 📝 文字   │ │  ├─────────────────────────────────┤    │
│ │ 🔢 數字   │ │  │ [文字] 配方編號 (自動)          │    │
│ │ 📅 日期   │ │  │ [文字] 產品名稱 (必填)          │    │
│ │ 📋 選單   │ │  │ [選單] 濾網類型 (必填)          │    │
│ │ 📄 備註   │ │  └─────────────────────────────────┘    │
│ └──────────┘ │                                          │
│              │  ┌─────────────────────────────────┐    │
│ 材料配方     │  │ 🧪 材料配方                     │    │
│ ┌──────────┐ │  ├─────────────────────────────────┤    │
│ │ 拖曳欄位 │ │  │ [選單] 化學藥劑                 │    │
│ │ 到右側   │ │  │ [數字] 濃度 (%, 0-100)          │    │
│ └──────────┘ │  │ [選單] 活性碳類型               │    │
│              │  │ [數字] 碳重 (g, 0-1000)         │    │
│ 製程參數     │  │ [+ 新增欄位]                    │    │
│              │  └─────────────────────────────────┘    │
│ 品質標準     │                                          │
│              │  ┌─────────────────────────────────┐    │
│ [新增群組]   │  │ ⚙️ 製程參數                     │    │
│              │  ├─────────────────────────────────┤    │
│              │  │ [數字] 反應溫度 (°C)            │    │
│              │  │ [數字] 壓力 (bar)               │    │
│              │  │ [+ 新增欄位]                    │    │
│              │  └─────────────────────────────────┘    │
└──────────────┴──────────────────────────────────────────┘
```

### 3. 欄位屬性編輯器

點擊欄位後彈出屬性面板：

```
┌────────────────────────────────┐
│ 欄位屬性                       │
├────────────────────────────────┤
│ 欄位名稱: [反應溫度__________] │
│ 欄位類型: [數字 ▼]            │
│ 是否必填: [✓] 必填            │
│                                │
│ 數字設定:                      │
│ 最小值: [0________________]   │
│ 最大值: [300______________]   │
│ 單位: [°C________________]    │
│ 步進值: [1________________]   │
│                                │
│ 預設值: [180______________]   │
│                                │
│ 提示文字:                      │
│ [請輸入反應溫度_____________] │
│                                │
│ 驗證規則:                      │
│ [+ 新增規則]                   │
│                                │
│         [取消]      [確定]     │
└────────────────────────────────┘
```

## 資料結構

### 範本儲存格式

```javascript
{
  id: "TPL-001",
  name: "標準配方範本",
  description: "適用於一般化學濾網生產",
  category: "standard", // standard, custom, imported
  industryType: "amc-filter",

  // 範本結構定義
  fieldGroups: [
    {
      id: "group-1",
      name: "基本資訊",
      icon: "📦",
      order: 1,
      fields: [
        {
          id: "field-1",
          name: "productName",
          label: "產品名稱",
          type: "text",
          required: true,
          defaultValue: "高效化學濾網",
          placeholder: "請輸入產品名稱",
          validation: {
            minLength: 2,
            maxLength: 50
          }
        },
        {
          id: "field-2",
          name: "filterType",
          label: "濾網類型",
          type: "select",
          required: true,
          options: [
            { value: "化學濾網", label: "化學濾網" },
            { value: "活性碳濾網", label: "活性碳濾網" },
            { value: "複合濾網", label: "複合濾網" }
          ],
          defaultValue: "化學濾網"
        }
      ]
    },
    {
      id: "group-2",
      name: "材料配方",
      icon: "🧪",
      order: 2,
      fields: [
        {
          id: "field-3",
          name: "concentration",
          label: "濃度",
          type: "number",
          required: true,
          min: 0,
          max: 100,
          step: 0.1,
          unit: "%",
          defaultValue: 15
        }
      ]
    }
  ],

  // 元數據
  createdAt: "2025-10-09T10:00:00Z",
  createdBy: "ENG-001",
  updatedAt: "2025-10-09T14:00:00Z",
  version: "1.2",

  // 使用統計
  usageCount: 45,

  // 標籤
  tags: ["標準", "化學濾網", "常用"],

  // 狀態
  isPublic: true,
  isActive: true
}
```

## 實作階段

### Phase 1: 範本資料模型 ✅
- ✅ TemplateModel CRUD API
- ✅ 範本儲存於 localStorage
- ✅ 版本控制
- ✅ 匯入/匯出功能

### Phase 2: 範本列表頁面 ⏳
- 範本列表展示
- 搜尋與篩選
- 複製、刪除操作
- 使用統計顯示

### Phase 3: 範本編輯器（拖拽式） 📋
- 欄位工具箱
- 拖放介面（@dnd-kit）
- 欄位群組管理
- 即時預覽

### Phase 4: 欄位屬性編輯器 📋
- 欄位類型設定
- 驗證規則設定
- 預設值設定
- 條件顯示邏輯

### Phase 5: 與配方建置器整合 📋
- RecipeBuilderPage 讀取動態範本
- 範本套用功能
- 範本使用統計更新

## UI/UX 設計要點

### 1. 拖拽互動
```javascript
// 使用 @dnd-kit 實作
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';

// 欄位可拖拽
<Draggable id="field-text" data={{ type: 'text' }}>
  📝 文字欄位
</Draggable>

// 畫布可放置
<Droppable id="canvas">
  {fields.map(field => (
    <SortableField key={field.id} field={field} />
  ))}
</Droppable>
```

### 2. 欄位類型庫

```javascript
const FIELD_TYPES = {
  text: {
    icon: '📝',
    label: '文字',
    defaultConfig: {
      type: 'text',
      placeholder: '請輸入文字',
      maxLength: 255
    }
  },
  number: {
    icon: '🔢',
    label: '數字',
    defaultConfig: {
      type: 'number',
      min: 0,
      max: 999999,
      step: 1
    }
  },
  select: {
    icon: '📋',
    label: '選單',
    defaultConfig: {
      type: 'select',
      options: []
    }
  },
  date: {
    icon: '📅',
    label: '日期',
    defaultConfig: {
      type: 'date'
    }
  },
  textarea: {
    icon: '📄',
    label: '多行文字',
    defaultConfig: {
      type: 'textarea',
      rows: 4
    }
  },
  checkbox: {
    icon: '☑️',
    label: '勾選',
    defaultConfig: {
      type: 'checkbox',
      defaultValue: false
    }
  },
  radio: {
    icon: '🔘',
    label: '單選',
    defaultConfig: {
      type: 'radio',
      options: []
    }
  }
};
```

### 3. 驗證規則編輯器

```javascript
const VALIDATION_RULES = {
  required: { label: '必填', type: 'boolean' },
  minLength: { label: '最小長度', type: 'number' },
  maxLength: { label: '最大長度', type: 'number' },
  min: { label: '最小值', type: 'number' },
  max: { label: '最大值', type: 'number' },
  pattern: { label: '正則表達式', type: 'text' },
  email: { label: 'Email 格式', type: 'boolean' },
  url: { label: 'URL 格式', type: 'boolean' },
  custom: { label: '自訂驗證', type: 'function' }
};
```

## 功能比較

### 審核流程設計器 vs 範本編輯器

| 特性 | 審核流程設計器 | 範本編輯器 |
|------|----------------|------------|
| 拖拽元素 | 節點（開始/結束/審核） | 欄位（文字/數字/選單） |
| 佈局 | 自由位置、連線 | 垂直列表、群組 |
| 連接關係 | 流程線連接 | 群組層級結構 |
| 驗證 | 流程完整性 | 欄位設定完整性 |
| 預覽 | 流程圖 | 表單預覽 |

### 共同技術

- 使用 `@dnd-kit` 拖拽庫
- 狀態管理（拖拽中/編輯中）
- 即時預覽
- JSON 資料儲存

## 整合流程

### 1. 配方建置時選擇範本

```
RecipeBuilderPage:
1. 顯示「使用範本」按鈕
2. 彈出範本選擇對話框
3. 從 TemplateModel.getAll() 讀取範本列表
4. 使用者選擇範本
5. 根據範本的 fieldGroups 渲染表單
6. 填入 defaultValues
```

### 2. 範本使用統計

```javascript
// RecipeBuilderPage.js
async function applyTemplate(templateId) {
  const template = TemplateModel.getById(templateId);

  // 增加使用次數
  TemplateModel.incrementUsage(templateId);

  // 根據範本渲染欄位
  renderFieldsFromTemplate(template);
}
```

### 3. 範本版本控制

```
版本規則:
- 新建範本: 1.0
- 小修改（新增欄位、調整預設值）: 1.1, 1.2 ...
- 大改版（結構變更）: 2.0

版本歷史:
- 保存每次修改的快照
- 可回滾到歷史版本
- 比較版本差異
```

## 效益

### 對使用者
- ✅ 無需程式技能即可建立範本
- ✅ 拖拽式操作，直覺易用
- ✅ 即時預覽，所見即所得
- ✅ 範本可複製、分享

### 對系統
- ✅ 範本與程式碼解耦
- ✅ 易於維護與擴展
- ✅ 支援多產業動態切換
- ✅ 使用數據可追蹤

### 對開發
- ✅ 減少硬編碼範本
- ✅ 降低維護成本
- ✅ 新增產業模組更容易
- ✅ 使用者可自助管理

## 下一步行動

1. **完成 Phase 2**：建立範本列表頁面
2. **設計 Phase 3**：範本編輯器 UI/UX 細節設計
3. **原型開發**：拖拽功能原型驗證
4. **測試整合**：與 RecipeBuilderPage 整合測試
5. **文件撰寫**：使用者操作手冊

## 參考資料

- @dnd-kit 文件: https://docs.dndkit.com/
- 表單建構器範例: Typeform, Google Forms
- 流程設計器範例: n8n, Zapier
