# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.6] - 2025-10-12

### Fixed
- **Golden Recipe 品質報表數值格式化**
  - 修正 CPK 數值顯示過多小數位（1.9780021347649852 → 1.98）
  - 修正平均良率顯示 undefined 的問題
  - 統一數值格式：良率、效率 1 位小數，CPK 2 位小數
- **資料模型屬性名稱修正**
  - 品質統計使用正確的屬性名 `avgYield` 而非 `avgYieldRate`
  - 確保所有顯示位置使用統一的屬性名稱

### Changed
- **品質報表顯示改進**
  - 品質統計區域：使用 `.toFixed(1)` 格式化良率
  - 品質統計區域：使用 `.toFixed(2)` 格式化 CPK
  - 認證條件檢查：同步格式化數值顯示
  - 配方卡片：統一數值格式化規則

### Technical Details
- 修正位置：`src/pages/GoldenRecipePage.js:583-605` - 品質報表數值格式化
- 修正位置：`src/pages/GoldenRecipePage.js:288-298` - 待審核卡片數值格式化
- 修正位置：`src/pages/GoldenRecipePage.js:401-411` - 配方卡片數值格式化
- 屬性修正：`statistics.avgYieldRate` → `statistics.avgYield`
- 屬性修正：`qualityStats.avgYieldRate` → `qualityStats.avgYield`

## [0.5.5] - 2025-10-11

### Fixed
- **UserModel 資料模型修正**
  - 修正 UserModel constructor 缺少 `employeeId`（工號）欄位
  - 修正 UserModel constructor 缺少 `position`（職稱）欄位
  - 確保模擬中心生成的使用者包含完整資料
- **部門管理統計修正**
  - 修正部門人數統計顯示為 0 的問題
  - DepartmentsPage 改用 `getUsers()` 取代直接存取 localStorage
  - 確保使用正確的 storage prefix (`rms_users`)
- **人員編輯表單修正**
  - 修正編輯人員時部門欄位顯示 `[object Object]` 的問題
  - 加入部門字串/物件判斷邏輯
  - 正確處理 `user.department` 和 departments 陣列的類型

### Added
- **人員管理功能完善**
  - 人員清單表格加入「帳號」欄位顯示
  - 人員表單加入「帳號」輸入欄位（建立後無法修改）
  - 新增「重設密碼」功能（管理員功能，重設為預設密碼）
  - 新增「修改密碼」功能（Header 右上角 🔐 按鈕）
  - 密碼管理機制：預設密碼 = 帳號名稱
- **資料模擬優化**
  - dataSimulator 使用流水號編排職稱（系統管理員01、主管01、員工01...）
  - 取代原本隨機選擇職稱的方式
- **除錯工具**
  - 新增 check-users.html 檢查 localStorage 使用者資料結構

### Changed
- 統一使用 storage API 確保資料一致性
- 加強資料類型判斷（字串 vs 物件）處理
- 職位流水號生成邏輯實作

### Documentation
- MEMORY.md 更新至 v0.5.5
- README.md 新增完整的 RBAC 權限系統說明章節
- Footer 版本號更新至 v0.5.5

### Technical Details
- 修正位置：`src/utils/dataModel.js:424-439` - UserModel constructor
- 修正位置：`src/pages/DepartmentsPage.js:47,130,209` - 改用 getUsers() API
- 修正位置：`src/pages/UsersPage.js:91-93,137-186` - 部門類型判斷邏輯
- 修正位置：`src/utils/dataSimulator.js:159-183` - 流水號職稱生成
- 新增：`src/components/common/Header.js:51,275-400` - 修改密碼功能

## [0.5.4] - 2025-10-11

### Added
- **專案結構整理**
  - 建立 `.github/dev-docs/` 目錄集中存放開發文件（11 個 MD 文件）
  - 新增開發文件索引 `.github/dev-docs/README.md`

### Removed
- 清理根目錄 9 個過時測試文件（test-*.html, test-*.js 等）

### Changed
- 根目錄從 30+ 個文件精簡至 11 個核心文件
- 更新 .gitignore（忽略測試文件、臨時文件、編輯器備份檔）

### Documentation
- README.md 新增線上展示區塊（生產環境網址、GitHub 連結）
- 新增 v0.5.4 版本更新日誌
- 工作說明書版本更新至 v0.5.4
- 新增兩份 PDF（工作說明書、招標簡表）

## [0.5.3] - 2025-10-11

### Added
- **自訂角色管理功能** 🔑
  - 完整 CRUD 功能（建立、編輯、刪除自訂角色）
  - 表格式權限編輯器（39 個權限：17 頁面 + 22 功能）
  - 範本快速套用（系統管理員/主管/一般員工）
  - 群組化權限管理（6 大功能群組）
  - 即時統計（已選權限數量）
  - 角色徽章系統（6 種顏色標籤）
  - 權限快取機制（PermissionManager）
  - LocalStorage 持久化

### Changed
- **權限管理頁面 UI 優化**
  - 角色編輯器 modal 寬度 1200px（95% 螢幕寬）
  - 權限列表 modal 寬度 1000px（90% 螢幕寬）
  - 權限列表區域高度 60vh

### Fixed
- Modal 元件使用修正（統一使用正確的 Modal 初始化模式）
- 事件監聽優化（使用 setTimeout 確保 DOM 渲染完成）
- PermissionsPage.js 完整重構

## [0.5.2] - 2025-10-11

### Fixed
- **測試中心錯誤修正**：修正測試中心的兩個關鍵錯誤
  - 修正 `dataSimulator.js` 中 SPC 數據生成時 `generateChineseName()` 返回物件的問題，現在正確使用 `.name` 屬性
  - 修正版本控制系統無法持久化版本數據的問題：將 FormModel 實例轉換為純物件後再儲存，避免類別方法導致的序列化問題
- **版本控制改進**：FormModel.save() 現在會將類別實例轉換為純物件再傳遞給版本控制系統，確保版本數據正確儲存到 localStorage

### Technical Details
- 修正位置：`src/utils/dataSimulator.js:365` - SPC operator 欄位
- 修正位置：`src/utils/dataModel.js:86-87` - FormModel 版本儲存邏輯
- 受影響的測試：
  - ✅ 版本控制完整流程測試
  - ✅ 完整申請簽核流程測試

## [0.5.1] - 2025-10-11

### Added
- 資料模擬中心與壓力測試功能
- Golden Recipe 生成與管理
- SPC 異常偵測測試

### Fixed
- 修正 SimulatorPage updateStats DOM 時序錯誤
- 修正 dataSimulator Golden Recipe 生成錯誤
- 修正 goldenRecipeModel FormModel.update 錯誤
- 修正 SPC 異常偵測測試缺少 assertEqual 參數

## [0.5.0] - Previous Release

### Added
- Initial release of core features
- 配方管理系統
- 審核流程管理
- 簽核中心
- 報表統計
- Golden Recipe 管理
- SPC 統計分析
- 測試中心
