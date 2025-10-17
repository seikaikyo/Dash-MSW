# Dash RMS 專案記憶檔

## 專案背景

**專案名稱**: Dash RMS (Recipe Management System)
**版本**: 0.5.6
**建立日期**: 2025-10-09
**最後更新**: 2025-10-12
**來源**: 從 Dash BPM v0.6.0 獨立複製開發
**GitHub**: https://github.com/seikaikyo/Dash-RMS
**生產環境**: https://dash-rms.vercel.app

## 專案起源

### 使用者需求

使用者在完成 Dash BPM v0.6.0 後，提出建構 RMS (配方管理系統) 與 EAP (設備自動程式系統) 的需求。

### 業務流程

```
RMS (配方簽核) → EAP (程式轉換) → ECU (設備控制) → 生產機台
```

### 關鍵決策

使用者明確選擇：**複製 BPM 並獨立開發**，而非建立整合平台。

原因：
1. BPM 簽核流程系統已完整成熟
2. RMS 與 EAP 有不同的業務邏輯
3. 獨立開發可以更靈活客製化
4. 各系統可獨立演進

## 產業背景

### AMC 化學濾網產業

**公司業務**: 製造 AMC (Airborne Molecular Contamination) 化學濾網

**產品類型**:
- 活性碳濾網
- 化學濾網
- 複合濾網

**應用場景**: 半導體廠房、精密製造等高潔淨度要求環境

### 關鍵需求

1. **配方欄位暫定**: 使用者要求初期配方欄位可以是暫定版本
2. **API 介面預留**: 必須預留 API 介面供 EAP 系統整合
3. **EAP 整合**: EAP 透過 ECU 獲取配方資料（未來可能下放配方到機台）

## 產品策略問題

### 使用者的關鍵提問

> "如果不同產業這樣會不會又要重做？還是可以做比較公版的樣式，再針對產業進行模組調整與客製化呢？"

### 解決方案：模組化架構

採用「核心 + 產業模組」架構：

**核心層（Core）**:
- 通用配方管理
- 簽核流程引擎
- 版本控制
- 審計日誌
- 報表統計

**產業層（Industries）**:
- 各產業定義自己的欄位 (fields.config.js)
- 各產業定義驗證規則 (validations.js)
- 各產業定義範本 (templates.js)

**配置層（Configuration）**:
- 透過 industry.config.js 切換產業模組
- 動態載入產業模組

### 架構優勢

- ✅ 80% 程式碼跨產業重用
- ✅ 新產業部署快速（僅需新增產業模組）
- ✅ 各產業獨立演進
- ✅ 維護成本低

## 技術架構

### 從 BPM 繼承的功能

- 完整簽核流程引擎（並簽/串簽/條件分支）
- 使用者認證與權限管理
- 操作日誌系統
- 報表統計功能
- 人員與部門管理
- 拖拽式流程設計器

### RMS 客製化功能

1. **術語調整**:
   - 「表單」→「配方」
   - 「流程」→「審核流程」

2. **模組化架構**:
   - 產業模組系統
   - 動態欄位載入
   - 產業配置管理

3. **API 介面層**:
   - 配方查詢 API
   - 配方匯出 API (供 EAP 使用)
   - Webhook 通知機制

4. **產業特定功能**:
   - AMC 濾網配方結構
   - 配方驗證規則
   - 配方範本系統

## 專案結構

### 目錄組織

```
RMS/
├── src/
│   ├── industries/              # 產業模組（新增）
│   │   └── amc-filter/
│   │       ├── fields.config.js    # 欄位定義
│   │       ├── validations.js      # 驗證規則
│   │       └── templates.js        # 配方範本
│   ├── api/                     # API 介面層（新增）
│   │   └── endpoints.js
│   ├── config/                  # 系統配置（新增）
│   │   └── industry.config.js
│   ├── components/              # 元件（繼承自 BPM）
│   ├── pages/                   # 頁面（繼承自 BPM）
│   ├── utils/                   # 工具（繼承自 BPM）
│   └── styles/                  # 樣式（繼承自 BPM）
```

### 核心檔案說明

**industries/amc-filter/fields.config.js**:
- 定義 AMC 濾網配方的所有欄位
- 分為 4 個群組：基本資訊、材料配方、製程參數、品質標準
- 包含欄位驗證規則（pattern, min, max 等）
- 提供 getAllFields(), getRequiredFields() 等輔助函數

**industries/amc-filter/validations.js**:
- 自訂驗證邏輯（如配方編號格式驗證）
- 跨欄位驗證（如複合濾網必須填寫活性碳資訊）
- 提供警告機制（如高溫高壓組合警告）
- validateRecipe() 方法驗證整份配方

**industries/amc-filter/templates.js**:
- 提供 4 種預設配方範本
- 標準活性碳濾網、高效化學濾網、複合式濾網、低溫活性碳濾網
- 每個範本包含完整的預設值

**config/industry.config.js**:
- 定義當前使用的產業模組
- 列出所有支援的產業模組
- 提供產業切換機制 (switchIndustry)
- 自動從 localStorage 載入產業設定

**api/endpoints.js**:
- 定義所有 API 端點
- RecipeAPI: 配方查詢、匯出、批次匯出、EAP 通知
- StatsAPI: 統計資訊、趨勢分析
- API_ROUTES: 路由表（供未來後端實作）

## AMC 濾網配方結構

### 基本資訊
- **配方編號**: AMC-YYYY-XXX 格式，必填
- **產品名稱**: 必填
- **濾網類型**: 活性碳/化學/複合，必填
- **配方版本**: 預設 1.0

### 材料配方
- **化學藥劑**: 必填
- **濃度**: 0-100%，必填
- **活性碳類型**: 選填
- **碳重**: 單位 g，選填
- **添加劑**: 文字描述，選填

### 製程參數
- **反應溫度**: 0-300°C，必填（>200°C 會警告）
- **壓力**: 0-10 bar，必填
- **混合時間**: 分鐘，必填
- **固化時間**: 小時，必填
- **濕度**: 0-100%，選填

### 品質標準
- **過濾效率**: 90-100%，必填（<95% 會警告）
- **使用壽命**: 月，選填
- **測試方法**: 文字描述，選填
- **認證標準**: 如 ISO 14644-1，選填

### 驗證規則

**跨欄位驗證**:
- 複合濾網建議填寫活性碳資訊
- 高溫（>150°C）+ 高壓（>5 bar）組合會警告

**範本類型**:
1. 標準活性碳濾網（120°C, 2 bar, 95% 效率）
2. 高效化學濾網（150°C, 3 bar, 99% 效率）
3. 複合式濾網（135°C, 2.5 bar, 97% 效率）
4. 低溫活性碳濾網（80°C, 1.5 bar, 93% 效率）

## API 介面設計

### 配方查詢

**查詢已核准配方**:
```javascript
GET /api/recipes?status=approved
RecipeAPI.getApprovedRecipes({ filterType, fromDate, toDate })
```

**查詢單一配方**:
```javascript
GET /api/recipes/:id
RecipeAPI.getRecipeById(recipeId)
```

### 配方匯出 (供 EAP 使用)

**匯出格式**:
```json
{
  "recipeId": "RCP-001",
  "recipeNo": "AMC-2024-001",
  "productName": "高效化學濾網",
  "version": "1.0",
  "status": "approved",
  "approvedAt": "2024-10-09T10:00:00Z",
  "timestamp": 1728456789000,
  "parameters": {
    "basic": { ... },
    "materials": { ... },
    "process": { ... },
    "quality": { ... }
  }
}
```

**API 方法**:
```javascript
RecipeAPI.exportRecipe(recipeId)          // 單一匯出
RecipeAPI.exportMultiple([id1, id2])      // 批次匯出
```

### Webhook 通知

當配方核准時，推送到 EAP:
```javascript
POST http://eap-system/api/recipes/import
Body: {
  "event": "recipe.approved",
  "data": { ... }
}

// 程式呼叫
RecipeAPI.notifyEAP(recipeId, webhookUrl)
```

### 統計 API

```javascript
StatsAPI.getRecipeStats()           // 總體統計
StatsAPI.getRecipeTrends(30)        // 30 天趨勢
```

## 系統整合策略

### 三種整合方案

**方案 1: API 輪詢 (Polling)**
- EAP 定時查詢 RMS
- 適合批次處理
- 簡單但延遲較高

**方案 2: Webhook 推送 (Push)** ⭐ 建議
- RMS 主動推送到 EAP
- 即時性高
- 適合生產環境

**方案 3: 檔案交換 (File Exchange)**
- JSON 檔案匯出/匯入
- 適合 MVP
- 最簡單的實作方式

### 資料流向

```
1. 使用者建立配方 (RMS)
2. 配方送審 (RMS 簽核流程)
3. 配方核准 (RMS)
4. 通知 EAP (API/Webhook)
5. EAP 下載配方參數
6. EAP 轉換為設備程式
7. 透過 ECU 更新機台
8. 機台按配方生產
```

## 開發狀態

### v0.5.6 (2025-10-12) - Golden Recipe 品質報表數值格式化修正 🔧

**已完成** ✅:
- [x] **品質報表數值格式化**
  - [x] 修正 CPK 數值顯示過多小數位問題（1.9780021347649852 → 1.98）
  - [x] 修正平均良率顯示 undefined 的問題
  - [x] 統一數值格式規則：良率、效率 1 位小數，CPK 2 位小數
- [x] **資料模型屬性名稱修正**
  - [x] 品質統計使用正確的屬性名 `avgYield` 而非 `avgYieldRate`
  - [x] 待審核卡片使用正確屬性名
  - [x] 配方卡片使用正確屬性名
- [x] **版本更新與部署**
  - [x] 更新 CHANGELOG.md 至 v0.5.6
  - [x] 更新 MEMORY.md 至 v0.5.6
  - [x] 更新 package.json 至 v0.5.6

**技術改進**:
- ✅ 統一使用 `.toFixed()` 格式化數值
- ✅ 修正資料模型屬性名稱不一致問題
- ✅ 改善使用者體驗（數值易讀）

**Bug 修正**:
- 🐛 修正 CPK 顯示小數點後 16 位的問題（src/pages/GoldenRecipePage.js:587, 605, 298, 411）
- 🐛 修正平均良率顯示 undefined（avgYieldRate → avgYield）
- 🐛 修正認證條件檢查數值格式不一致

### v0.5.5 (2025-10-11) - 人員管理與資料模型修正 🐛

**已完成** ✅:
- [x] **UserModel 資料模型修正**
  - [x] UserModel constructor 加入 employeeId 欄位
  - [x] UserModel constructor 加入 position 欄位
  - [x] 確保模擬中心生成的使用者包含完整資料
- [x] **部門管理統計修正**
  - [x] DepartmentsPage 改用 getUsers() 取代直接存取 localStorage
  - [x] 修正部門編輯時使用 storage.set() 更新使用者資料
  - [x] 確保部門人數統計使用正確的 storage prefix (rms_users)
- [x] **人員編輯表單部門顯示修正**
  - [x] renderUserForm 加入部門字串/物件判斷邏輯
  - [x] 正確處理 user.department 可能是字串或物件的情況
  - [x] 正確處理 departments 陣列可能包含字串或物件
  - [x] 在清單顯示時加入相同的部門處理邏輯
- [x] **人員管理功能完善**
  - [x] 人員清單表格加入「帳號」欄位
  - [x] 人員表單加入「帳號」輸入欄位（建立後無法修改）
  - [x] 新增「重設密碼」功能按鈕（管理員功能）
  - [x] 新增「修改密碼」功能（Header 右上角 🔐 按鈕）
  - [x] dataSimulator 使用流水號編排職稱（系統管理員01、主管01、員工01...）
- [x] **版本更新與部署**
  - [x] Git commit (7c8f7ce) - 人員管理功能
  - [x] Git commit (f61fd55) - UserModel 與部門統計修正
  - [x] Git commit (27caba3) - 部門顯示修正
  - [x] 推送至 GitHub
  - [x] 部署至 Vercel 生產環境
- [x] **新增除錯工具**
  - [x] check-users.html - 檢查 localStorage 中的使用者資料結構

**技術改進**:
- ✅ 統一使用 storage API 確保資料一致性
- ✅ 加強資料類型判斷（字串 vs 物件）
- ✅ 完善密碼管理機制（預設密碼 = 帳號）
- ✅ 職位流水號生成邏輯

**Bug 修正**:
- 🐛 修正 UserModel 缺少 employeeId 和 position 欄位
- 🐛 修正部門人數統計為 0 的問題
- 🐛 修正人員編輯表單部門顯示為 [object Object] 的問題

### v0.5.4 (2025-10-11) - 專案結構整理與文件優化 🧹

**已完成** ✅:
- [x] **專案結構整理**
  - [x] 建立 `.github/dev-docs/` 目錄
  - [x] 移動 11 個開發文件至 dev-docs/
  - [x] 建立開發文件索引 (.github/dev-docs/README.md)
  - [x] 刪除 9 個過時測試文件
  - [x] 根目錄從 30+ 個文件精簡至 11 個核心文件
- [x] **文件更新**
  - [x] README.md 新增線上展示區塊（Vercel 網址）
  - [x] 新增 v0.5.4 版本更新日誌
  - [x] 更新 .gitignore（忽略測試文件、臨時文件、編輯器備份）
  - [x] 工作說明書版本更新至 v0.5.4
- [x] **新增文件**
  - [x] docs/ 新增兩份 PDF（工作說明書、招標簡表）
  - [x] docs/招標簡表.html
- [x] **版本更新與部署**
  - [x] 版本號：0.5.3 → 0.5.4
  - [x] Git commit (f53d342) 並推送至 GitHub
  - [x] 部署至 Vercel 生產環境

**成果**:
- ✅ 專案結構更清晰，易於維護
- ✅ 開發文件分類明確
- ✅ Git 追蹤更精確
- ✅ 文件完整可用於招標提案

### v0.5.3 (2025-10-11) - 自訂角色管理功能 🔑

**已完成** ✅:
- [x] **自訂角色管理功能**
  - [x] 表格式權限編輯器（39 個權限：17 頁面 + 22 功能）
  - [x] 範本快速套用（系統管理員/主管/一般員工）
  - [x] 完整 CRUD 功能（建立、編輯、刪除）
  - [x] 群組化權限管理（6 大功能群組）
  - [x] 即時統計（已選權限數量）
  - [x] 角色徽章系統（6 種顏色）
  - [x] 權限快取機制（PermissionManager）
  - [x] LocalStorage 持久化
- [x] **權限管理頁面 UI 優化**
  - [x] Modal 寬度優化（編輯器 1200px、列表 1000px）
  - [x] 權限列表區域高度 60vh
- [x] **技術改進**
  - [x] Modal 元件使用修正
  - [x] 事件監聽優化
  - [x] PermissionsPage.js 重構

### v0.5.2 (2025-10-11) - 權限控制系統完整實作 🔒

**已完成** ✅:
- [x] **權限配置檔**
  - [x] src/config/permissions.config.js（39 個權限定義）
  - [x] src/config/roles.config.js（角色與權限對應）
- [x] **三種內建角色**
  - [x] 系統管理員（完整權限）
  - [x] 主管（管理與審核權限）
  - [x] 一般員工（基本操作權限）
- [x] **權限管理器**
  - [x] src/utils/permissionManager.js（集中權限檢查）
- [x] **權限管理頁面**
  - [x] src/pages/PermissionsPage.js（視覺化管理介面）
- [x] **動態選單與路由保護**
  - [x] Sidebar 根據角色顯示可訪問項目
  - [x] Router 層級權限檢查
  - [x] 無權限顯示「權限不足」頁面
- [x] **角色徽章與資源擁有權檢查**
  - [x] Header 顯示角色標籤
  - [x] 一般員工僅能編輯自己的配方

### v0.5.0-0.5.1 - 核心功能完善

**已完成** ✅:
- [x] 版本控制系統（自動追蹤、比對、回滾）
- [x] 自動化測試系統（測試執行引擎、測試劇本）
- [x] SPC 統計製程管制模組（管制圖、Cp/Cpk、異常偵測）
- [x] Golden Recipe 系統（自動評分、候選推薦、認證管理）
- [x] 範本管理系統（CRUD、匯入/匯出）
- [x] 資料模擬中心（測試資料生成、壓力測試）
- [x] 簽核中心改為列表式分頁
- [x] 全域樣式系統優化

### v0.1.0 (2025-10-09) - 初始化

**已完成** ✅:
- [x] 從 BPM v0.6.0 複製專案
- [x] 建立 Git 倉庫並設定 remote
- [x] 建立產業模組目錄結構
- [x] 建立 AMC 濾網產業模組
- [x] 建立產業配置系統
- [x] 建立 API 介面層
- [x] 建立專案文件

### 下一步計劃

**Phase 1: UI 整合與調整**
1. 更新側邊欄選單文字
2. 更新頁面標題與描述
3. 調整術語（表單→配方、流程→審核流程）
4. FormsPage → RecipesPage
5. FormBuilderPage → RecipeBuilderPage

**Phase 2: 產業模組整合**
1. 表單建置器整合產業模組
2. 動態載入配方欄位
3. 產業切換 UI
4. 配方範本選擇功能
5. 驗證規則整合

**Phase 3: API 整合與測試**
1. 測試 API 端點
2. 模擬 EAP 整合
3. Webhook 測試
4. 配方匯出測試

**Phase 4: 部署與發布**
1. 本地測試
2. Git commit
3. Push 到 GitHub
4. 部署到 Vercel

## 技術細節

### 動態模組載入

```javascript
import { getCurrentIndustry } from './config/industry.config.js';

// 取得當前產業
const industry = getCurrentIndustry();

// 動態載入欄位定義
const fieldsModule = await industry.fields();
const { amcFilterFields, fieldGroups } = fieldsModule;

// 動態載入驗證規則
const validationsModule = await industry.validations();
const { validateRecipe } = validationsModule;

// 動態載入範本
const templatesModule = await industry.templates();
const { amcFilterTemplates } = templatesModule;
```

### 產業切換機制

```javascript
import { switchIndustry } from './config/industry.config.js';

// 切換到食品產業
try {
  switchIndustry('food');
  // 重新載入頁面以套用新產業
  window.location.reload();
} catch (error) {
  console.error('切換產業失敗:', error.message);
}
```

### 配方驗證流程

```javascript
import { validateRecipe } from './industries/amc-filter/validations.js';

// 驗證配方
const result = validateRecipe(recipeData);

if (!result.valid) {
  // 顯示錯誤（阻止提交）
  result.errors.forEach(err => {
    console.error(`${err.field}: ${err.message}`);
  });
}

if (result.warnings.length > 0) {
  // 顯示警告（允許提交，但提醒使用者）
  result.warnings.forEach(warn => {
    console.warn(`${warn.field}: ${warn.message}`);
  });
}
```

### API 使用範例

```javascript
import { RecipeAPI, StatsAPI } from './api/endpoints.js';

// 查詢已核准配方
const approved = RecipeAPI.getApprovedRecipes({
  filterType: 'chemical',
  fromDate: '2024-01-01'
});

// 匯出配方給 EAP
const exported = RecipeAPI.exportRecipe('RCP-001');

// 批次匯出
const batch = RecipeAPI.exportMultiple(['RCP-001', 'RCP-002']);

// 通知 EAP
await RecipeAPI.notifyEAP('RCP-001', 'http://eap-system/api/recipes/import');

// 統計資訊
const stats = StatsAPI.getRecipeStats();
const trends = StatsAPI.getRecipeTrends(30);
```

## 未來規劃

### 短期 (v0.2.0) - 基礎功能完善
- [ ] 配方版本控制
- [ ] 配方複製功能
- [ ] 配方匯入/匯出
- [ ] 配方比對功能

### 中期 (v0.3.0) - 系統整合
- [ ] EAP Webhook 整合
- [ ] 配方狀態管理（草稿/審核中/已核准/生產中/已廢棄）
- [ ] 生產記錄追蹤
- [ ] 配方使用統計

### 長期 (v1.0.0+) - 多產業支援
- [ ] 新增食品產業模組
- [ ] 新增製藥產業模組
- [ ] 後端 API 實作
- [ ] 資料庫整合
- [ ] 多語言支援

## 重要提醒

1. **配方欄位是暫定的**: 使用者明確表示目前的配方欄位結構是暫定版本，未來可能調整

2. **必須保留 API 介面**: API 設計是為了 EAP 整合，必須保持穩定

3. **模組化是核心**: 整個系統設計圍繞產業模組化，這是支援多產業的關鍵

4. **獨立開發理念**: RMS 是獨立系統，不是 BPM 的一部分，雖然共用核心技術

5. **從 BPM 繼承**: 保留完整的簽核流程系統，只需調整術語和欄位結構

## 會話記錄

### 關鍵對話

**Q1**: "接下來我想建構 RMS(Recipe Management System)跟EAP(Equipment Automatic Program)你有什麼想法嗎？因為我覺得這兩套都會用到簽核流程"

**A1**: 分析了三種架構方案，建議先建構 RMS（較接近 BPM）。

---

**Q2**: "我說一下我的想法，因為RMS流程走完後就要透過EAP下放透過ECU更新到機台按照配方生產，既然已經有完整的簽核流程系統，我們複製出來獨立開發是不是比較好？"

**A2**: 完全同意，提出 3 階段方案並說明資料整合策略。

---

**Q3**: "go 1 另外RMS的配方資料欄位可以先暫定嗎？我們是做 AMC 化學濾網的，EAP透過 ECU 去獲取（未來可能會下放配方）到濾網相關製程機台，需要預留API介面"

**A3**: 立即執行，複製 BPM 專案並開始建構 RMS。

---

**Q4**: "如果不同產業這樣會不會又要重做？還是可以做比較公版的樣式，再針對產業進行模組調整與客製化呢？"

**A4**: 提出模組化架構（核心 + 產業模組），實現 80% 程式碼重用。

---

**使用者**: "繼續"

**動作**: 建立完整的產業模組系統與 API 介面層。

---

## MSW v2.1 更新記錄 (2025-10-17)

### 專案轉型：從 RMS 到 MSW

**專案名稱**: Dash MSW (Manufacturing System for Workflow)
**版本**: v2.1.0
**定位**: 柳營再生濾網製程管理系統
**GitHub**: https://github.com/seikaikyo/Dash-MSW.git
**生產環境**: https://dash-msw.vercel.app

### 核心功能實作

#### 1. 工單號自動產生器 (WorkOrderNumberGenerator)
- **格式**: MSW-YYYY-NNNN (例: MSW-2025-0001)
- **功能**:
  - 年度自動重置序號
  - 併發重複檢查（使用 `_generatedInSession` Set）
  - 批次建立保護機制
- **檔案**: `src/utils/workOrderNumberGenerator.js`
- **關鍵方法**:
  - `generate()`: 產生唯一工單號
  - `clearSession()`: 清除批次追蹤
  - `validate()`: 驗證格式
  - `exists()`: 檢查是否存在

#### 2. 生管派工頁面 (DispatchPage)
- **路由**: `#/dispatch`
- **權限**: SYSTEM_ADMIN、MANAGER
- **功能**:
  - 批次建立工單（1-100筆）
  - 統計儀表板（總數、待處理、進行中、已完成）
  - 工單列表管理
  - 篩選與搜尋功能
- **檔案**: `src/pages/DispatchPage.js`
- **整合**: 使用 WorkOrderNumberGenerator 產生工單號

#### 3. 作業員工單列表頁面 (OperatorWorkListPage)
- **進入方式**: 一般員工登入後自動顯示
- **設計理念**: 平板友善、框線設計、大字體
- **功能**:
  - 工單卡片網格顯示
  - 多重篩選（狀態、類型、搜尋）
  - 進度視覺化
  - 點擊進入站點作業
- **檔案**: `src/pages/OperatorWorkListPage.js`
- **UI 特色**:
  - 3px 粗框線 (#495057)
  - 字體放大 (1.125rem - 2.5rem)
  - 純白背景、高對比度
  - 響應式設計（手機/平板/桌面）

#### 4. 工單自動載入機制
- **URL 參數**: `?workOrderNo=MSW-2025-0001`
- **功能**: 自動填充所有欄位、自動選中 radio 按鈕
- **整合站點**: DegumStation、OvenStation (可擴展至其他站點)
- **取消返回**: 一般員工返回工單列表，其他角色重置表單

#### 5. 自動化測試系統整合
- **測試中心**: TestPage 整合 6 項工單號測試
- **測試項目**:
  1. 📋 工單號碼產生器
  2. 🔢 工單號唯一性
  3. 📝 工單號格式驗證
  4. 🏭 批次建立功能
  5. 📊 工單資料完整性
  6. 📅 年度序號機制
- **原始檔案**: `auto-test-system.html`
- **整合檔案**: `src/pages/TestPage.js`
- **按鈕**: "🔢 工單號系統"

### 權限配置更新

#### 頁面權限
```javascript
// src/config/permissions.config.js
DISPATCH: 'page:dispatch'  // 生管派工頁面
```

#### 角色權限
```javascript
// src/config/roles.config.js
SYSTEM_ADMIN: [..., 'page:dispatch']
MANAGER: [..., 'page:dispatch']
OPERATOR: // 無 dispatch 權限，直接顯示工單列表
```

#### 選單整合
```javascript
// src/utils/permissionManager.js
{
  name: '🏭 生管派工',
  route: '#/dispatch',
  permission: 'page:dispatch'
}
```

### 路由系統更新

#### 一般員工特殊路由
```javascript
// src/main.js
if (currentUser.role === 'OPERATOR') {
  // 不顯示 Layout，直接渲染 OperatorWorkListPage
  const workListPage = OperatorWorkListPage();
  appContainer.appendChild(workListPage);
  return;
}
```

#### 後台路由
```javascript
router.on('/dispatch', () => {
  renderPage(DispatchPage());
});
```

### 資料模型擴充

#### FormInstanceModel 新增欄位
```javascript
{
  data: {
    workOrderNo: "MSW-2025-0001",  // ✨ 新增
    batchNo: "BATCH-2025-0001",     // ✨ 新增
    sourceFactory: "柳營廠",
    filterType: "活性碳濾網",
    quantity: 50,
    regenerationCycle: "R0 (首次再生)",
    // ... 其他站點資料
  }
}
```

### 檔案清單

#### 新增檔案 (9個)
1. `src/utils/workOrderNumberGenerator.js` - 工單號產生器
2. `src/pages/DispatchPage.js` - 生管派工頁面
3. `src/pages/OperatorWorkListPage.js` - 作業員工單列表
4. `test-complete-workflow.html` - 完整流程測試指引
5. `auto-test-system.html` - 自動化測試系統
6. `TESTING_REPORT.md` - 測試報告
7. `USER_GUIDE.md` - 使用者指南
8. `DEPLOYMENT_SUMMARY.md` - 部署摘要
9. `src/pages/DispatchPage.old.js` - 舊版備份

#### 修改檔案 (8個)
1. `src/main.js` - 路由與一般員工邏輯
2. `src/config/permissions.config.js` - 新增 DISPATCH 權限
3. `src/config/roles.config.js` - 角色權限配置
4. `src/utils/permissionManager.js` - 選單項目
5. `src/pages/ApplyPage.js` - 使用 WorkOrderNumberGenerator
6. `src/pages/TestPage.js` - 整合工單號測試
7. `src/utils/dataSimulator.js` - 使用 WorkOrderNumberGenerator
8. `src/pages/stations/DegumStation.js` - 自動載入與取消邏輯

### 已知問題與修正

#### 問題 1: 工單號重複 (✅ 已解決)
- **原因**: 批次建立時併發產生重複序號
- **解決**: 新增 `_generatedInSession` Set 追蹤

#### 問題 2: 取消按鈕返回錯誤 (✅ 已解決)
- **原因**: 未判斷用戶角色
- **解決**: DegumStation.js 加入角色判斷邏輯

#### 問題 3: 作業員頁面 UI 不清晰 (✅ 已解決)
- **原因**: 灰色背景、字體太小
- **解決**: 改為白背景、框線設計、放大字體

### 測試結果

#### 自動化測試
- ✅ 工單號碼產生器運作正常
- ✅ 唯一性檢查通過
- ✅ 格式驗證正確
- ✅ 批次建立功能正常
- ✅ 資料完整性驗證通過
- ✅ 年度序號機制正常

#### 手動測試
- ✅ 生管派工批次建立
- ✅ 作業員登入顯示工單列表
- ✅ 工單篩選功能
- ✅ 工單自動載入
- ✅ 取消返回列表

### 部署資訊

- **GitHub**: https://github.com/seikaikyo/Dash-MSW.git
- **作者**: seikaikyo (phpbbtw@gmail.com)
- **Vercel**: dash-msw.vercel.app
- **版本**: v2.1.0
- **更新日期**: 2025-10-17

### 下一步計劃

#### 短期 (v2.2)
- [ ] 其他站點模組的取消按鈕修正
- [ ] 工單列表排序功能
- [ ] 批次刪除工單
- [ ] 工單匯出功能

#### 中期 (v2.5)
- [ ] WMS 倉儲管理模組
- [ ] 能源管理模組
- [ ] 工單範本功能
- [ ] 排程日曆視圖

#### 長期 (v3.0)
- [ ] IoTEdge RestfulAPI 整合
- [ ] 工單排程演算法
- [ ] 機器學習預測
- [ ] AGV 自動搬運接口

## 從 BPM 到 RMS 的演進

### 繼承功能 (100% 保留)
- ✅ 完整簽核流程引擎（並簽/串簽/條件分支）
- ✅ 使用者認證與權限管理
- ✅ 操作日誌系統
- ✅ 報表統計功能
- ✅ 人員與部門管理
- ✅ 拖拽式流程設計器

### 新增功能 (RMS 專屬)
- ✅ 產業模組化架構
- ✅ 動態欄位載入系統
- ✅ 配方驗證與警告機制
- ✅ 配方範本系統
- ✅ API 介面層（EAP 整合）
- ✅ 產業切換機制

### 客製化調整
- 「表單」→「配方」
- 「流程」→「審核流程」
- 新增 AMC 濾網專業欄位
- 新增配方匯出格式

## 關鍵技術決策

### 1. 為何選擇模組化架構？

**問題**: 不同產業配方欄位差異大，如何避免重複開發？

**解決**:
- 核心功能（簽核流程）與產業特定功能（配方欄位）分離
- 使用動態 import 載入產業模組
- 每個產業獨立定義欄位、驗證、範本

**優勢**:
- 新增產業只需新增模組資料夾
- 核心功能一次開發，永久重用
- 各產業獨立演進互不影響

### 2. 為何預留 API 介面？

**原因**: EAP 系統需要獲取 RMS 已核准的配方

**設計**:
- RESTful API 風格
- 支援查詢、匯出、批次操作
- Webhook 推送機制

**未來擴展**: 可直接實作後端 API，介面保持不變

### 3. 為何獨立開發而非整合平台？

**BPM vs RMS**:
- BPM: 通用簽核流程系統
- RMS: 配方管理系統（產業特定）

**決策**: 獨立開發保持系統簡潔，避免過度耦合

## 專案文件完整性

### docs/ 目錄文件清單

#### 📄 **正式文件（可直接用於招標/提案）**

1. **工作說明書（Statement of Work）** - v0.5.4
   - 格式：Markdown + HTML + PDF（8 頁）
   - 內容：13 個章節完整
     - 專案概述、系統架構、功能規格（10 大模組）
     - 技術規格、資料模型、API 介面規格
     - 品質要求、測試要求、部署要求
     - 維護與支援、專案時程、驗收標準
   - 狀態：✅ 可直接使用

2. **招標簡表** - v1.0
   - 格式：Markdown + HTML + PDF（8 頁）
   - 內容：10 個章節完整
     - 專案概述、專案範圍（11 個模組）
     - 專案時程（9 個階段、6 個月工期）
     - 廠商資格、投標須知、合約條款重點
     - 報價參考（78 個工項詳細列表、1,776 小時）
     - 人力成本參考、預算範圍（200-350 萬）
     - 投標廠商檢核表、常見問題（10 個 FAQ）
   - 狀態：✅ 可直接使用
   - 需補充：聯絡資訊、重要時程日期

#### 📋 **技術設計文件**

3. **Golden Recipe 設計文件**
   - 檔案：docs/GOLDEN_RECIPE_DESIGN.md
   - 內容：業務流程、核心機制、資料模型、API 規格、UI 設計、SPC 整合、效益分析
   - 狀態：✅ 完整

4. **範本管理計畫**
   - 檔案：docs/TEMPLATE_MANAGEMENT_PLAN.md
   - 內容：範本系統的詳細設計規劃
   - 狀態：✅ 完整

### 文件架構重構 (2025-10-11)

#### 重大改進
在 v0.5.5 發布後，使用者指出版本更新文件架構需要改善：

**問題**：
1. README.md 包含大量詳細版本更新說明（543-780 行）
2. 版本順序混亂（v0.5.0 標題在前，但內容是新版本）
3. CHANGELOG.md 位於 `.github/dev-docs/` 而非根目錄

**解決方案**：
1. **建立 CHANGELOG.md 於根目錄** - 遵循業界標準
   - 從 `.github/dev-docs/CHANGELOG.md` 移至根目錄
   - 補充 v0.5.5、v0.5.4、v0.5.3 完整內容
   - 版本由新到舊排列（v0.5.5 → v0.5.4 → v0.5.3...）
   - 遵循 Keep a Changelog 格式

2. **精簡 README.md** - 移除詳細版本更新（節省 200+ 行）
   - 移除 v0.5.5 到 v0.2.0 的詳細說明
   - 改為「詳細的版本更新內容請參閱 CHANGELOG.md」
   - 保留「核心功能列表」與「RBAC 專屬章節」
   - 保留「未來規劃」但更新內容

3. **更新未來規劃** - 移除已完成項目
   - 移除「配方版本控制完整功能」（v0.5.0 已完成）
   - 移除「配方複製與匯入/匯出」（v0.5.0 已完成）
   - 更新「EAP Webhook」為「後端實作」（前端 API 已完成）
   - 重新組織為三大類：功能擴展、系統整合、產業擴展

**Git 提交記錄**：
- `d817adb` - refactor: 重構版本更新文件架構
- `f81c5e0` - docs: 更新未來規劃，移除已完成功能

**最終架構**：
```
RMS/
├── README.md          # 專案介紹、快速開始、RBAC、核心功能、未來規劃
├── CHANGELOG.md       # ✨ 新增：完整版本更新歷史（由新到舊）
├── MEMORY.md          # 專案記憶與技術細節
└── .github/dev-docs/  # 開發文件（11 個，移除 CHANGELOG.md）
```

### 開發文件組織

#### 📁 **.github/dev-docs/** - 開發歷程文件（10 個）

- TESTING.md - 測試指南
- TEST_CHECKLIST.md - 測試檢查清單
- TEST_COMPLETED.md - 已完成測試項目
- TEST_REPORT.md - 測試報告
- CONDITION_BRANCH_TEST.md - 條件分支測試
- PHASE5_PLAN.md - Phase 5 開發計畫
- PHASE5_COMPLETE_TEST.md - Phase 5 完整測試
- QUICK_START.md - 快速開始指南
- STRUCTURE.md - 專案結構說明
- dev.md - 開發者筆記
- README.md - 開發文件索引

### 文件使用建議

#### 📊 **給經理的使用方式**

1. **招標簡表.pdf**
   - ✅ 立即可用於招標案
   - 包含完整工項報價參考（78 項工作、1,776 小時）
   - 包含廠商資格要求與評選標準
   - 包含付款里程碑（9 個階段）
   - 包含 FAQ 與投標檢核表

2. **工作說明書.pdf**
   - ✅ 立即可用作為技術規格書
   - 包含完整系統架構與功能規格
   - 包含 API 介面規格
   - 包含測試與驗收標準
   - 系統版本已更新至 v0.5.4

3. **原型系統展示**
   - 網址：https://dash-rms.vercel.app
   - GitHub：https://github.com/seikaikyo/Dash-RMS
   - 測試帳號：user001 / user001（一般員工）
   - 測試帳號：admin / admin（系統管理員）

### 文件優勢總結

1. **專業完整**：章節結構清晰，內容詳實
2. **工時精準**：1,776 小時拆分至 78 個工項
3. **預算合理**：200-350 萬範圍符合市場行情
4. **風險控管**：包含完整合約條款與罰則
5. **實務導向**：FAQ 涵蓋實務常見問題
6. **即戰力高**：可直接用於招標或提案

## 結語

Dash RMS 是一個從成熟的 BPM 系統衍生出來的專業配方管理系統，採用創新的模組化架構，既保持了核心功能的穩定性，又提供了產業客製化的靈活性。這個設計使得系統可以快速適配不同產業，同時保持高度的程式碼重用率。

系統的核心價值在於：
1. **成熟的簽核引擎**: 從 BPM v0.6.0 繼承，經過充分測試
2. **靈活的模組架構**: 支援多產業擴展
3. **完善的 API 設計**: 為系統整合做好準備
4. **專業的配方管理**: 針對製造業配方場景深度客製化
5. **完整的文件體系**: 提供招標簡表、工作說明書、技術設計文件，可直接用於商務提案

---

**最後更新**: 2025-10-12
**當前版本**: v0.5.6
**記憶狀態**: ✅ 已更新 Golden Recipe 品質報表數值格式化修正
