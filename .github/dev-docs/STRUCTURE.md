# BPM 系統專案架構

## 資料夾結構

```
BPM/
├── public/                    # 靜態資源
├── src/
│   ├── components/           # 元件目錄
│   │   ├── common/          # 共用元件（Button, Input, Modal 等）
│   │   ├── form-builder/    # 表單建置器相關元件
│   │   ├── workflow-designer/ # 流程設計器相關元件
│   │   └── approval/        # 簽核相關元件
│   ├── pages/               # 頁面元件
│   ├── utils/               # 工具函數
│   ├── styles/              # 全域樣式
│   └── assets/              # 圖片、圖示等資源
├── dev.md                   # 開發規範
├── STRUCTURE.md            # 專案架構說明（本檔案）
└── package.json            # 專案配置
```

## 核心模組規劃

### 1. 共用元件（components/common/）
- Button.js - 按鈕元件
- Input.js - 輸入框元件
- Select.js - 下拉選單元件
- Modal.js - 彈窗元件
- Card.js - 卡片元件
- Sidebar.js - 側邊欄元件
- Header.js - 頁首元件

### 2. 表單建置器（components/form-builder/）
- FormBuilder.js - 表單建置器主元件
- FieldPalette.js - 欄位元件庫（拖拽來源）
- FormCanvas.js - 表單編輯畫布
- PropertyPanel.js - 屬性設定面板
- FieldComponents/ - 各種表單欄位元件

### 3. 流程設計器（components/workflow-designer/）
- WorkflowDesigner.js - 流程設計器主元件
- NodePalette.js - 節點元件庫
- WorkflowCanvas.js - 流程編輯畫布
- NodeComponents/ - 各種流程節點元件（單簽、並簽、串簽等）

### 4. 簽核系統（components/approval/）
- ApprovalEngine.js - 簽核引擎（處理簽核邏輯）
- ApprovalForm.js - 申請表單元件
- ApprovalList.js - 待簽核列表
- ApprovalHistory.js - 簽核歷史記錄

### 5. 工具層（utils/）
- storage.js - LocalStorage 封裝
- router.js - 路由管理
- validator.js - 表單驗證
- dataModel.js - 資料模型定義

### 6. 頁面（pages/）
- Dashboard.js - 儀表板
- FormManagement.js - 表單管理頁
- WorkflowManagement.js - 流程管理頁
- ApprovalCenter.js - 簽核中心
- Reports.js - 報表統計

## 資料模型設計

### Forms（表單定義）
```javascript
{
  id: string,
  name: string,
  description: string,
  fields: [
    {
      id: string,
      type: string,
      label: string,
      required: boolean,
      validation: {},
      options: {}
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Workflows（流程定義）
```javascript
{
  id: string,
  name: string,
  formId: string,
  nodes: [
    {
      id: string,
      type: string, // 'single', 'parallel', 'sequential', 'condition'
      approvers: [],
      config: {}
    }
  ],
  connections: [
    {
      from: string,
      to: string,
      condition: {}
    }
  ],
  createdAt: timestamp
}
```

### FormInstances（表單實例）
```javascript
{
  id: string,
  formId: string,
  workflowId: string,
  applicant: string,
  data: {},
  status: string, // 'draft', 'pending', 'approved', 'rejected'
  currentNode: string,
  history: [],
  createdAt: timestamp
}
```

### ApprovalHistory（簽核記錄）
```javascript
{
  id: string,
  instanceId: string,
  nodeId: string,
  approver: string,
  action: string, // 'approve', 'reject', 'return'
  comment: string,
  timestamp: timestamp
}
```

## 開發階段規劃

### Phase 1: 基礎架構（目前階段）
- [x] 初始化專案結構
- [ ] 建立 package.json 和安裝依賴
- [ ] 建立 Vite 配置檔
- [ ] 設計基礎 UI 框架
- [ ] 建立共用元件庫
- [ ] 建立路由系統
- [ ] 設計資料層

### Phase 2: 表單建置器
- [ ] 建立表單建置器頁面框架
- [ ] 實作欄位元件庫
- [ ] 實作拖拽功能
- [ ] 實作屬性設定面板
- [ ] 實作表單預覽功能

### Phase 3: 流程設計器
- [ ] 建立流程設計器頁面框架
- [ ] 實作流程節點元件
- [ ] 實作節點連接功能
- [ ] 實作條件設定

### Phase 4: 簽核系統
- [ ] 建立簽核引擎
- [ ] 建立申請介面
- [ ] 建立簽核介面
- [ ] 建立歷史記錄查詢

### Phase 5: 報表與優化
- [ ] 建立報表統計
- [ ] 整合測試
- [ ] 效能優化
- [ ] 使用者體驗優化
