# Golden Recipe 篩選機制設計

## 概述

Golden Recipe（黃金配方）是經過生產驗證、品質穩定、性能優異的配方版本。本文件說明如何在 Dash RMS 中實作 Golden Recipe 的篩選與管理機制。

## 業務流程

```
1. 配方建立 → 2. 簽核通過 → 3. 生產使用 → 4. 品質檢驗 → 5. 數據回傳 → 6. 配方評分 → 7. Golden 認證
```

## 核心機制

### 1. 配方執行追蹤

每次配方被 EAP 下載並用於生產時，系統記錄：

```javascript
{
  recipeId: "RCP-001",
  recipeVersion: "1.2",
  executionId: "EXEC-2025-001",
  executionTime: "2025-10-09T10:00:00Z",
  batchNo: "BATCH-20251009-001",
  productionLine: "LINE-01",
  operator: "OP-001"
}
```

### 2. 品質數據回傳（SPC 整合）

SPC/MES 系統完成品質檢驗後，透過 API 回傳數據：

```javascript
POST /api/recipes/:id/quality-feedback

{
  executionId: "EXEC-2025-001",
  batchNo: "BATCH-20251009-001",
  qualityMetrics: {
    yieldRate: 98.5,              // 良率 (%)
    filterEfficiency: 96.2,       // 過濾效率 (%)
    lifespan: 36,                 // 使用壽命 (月)
    defectRate: 1.5,              // 不良率 (%)
    cpk: 1.67,                    // 製程能力指標
    stabilityScore: 95            // 穩定性評分
  },
  testResults: {
    passed: true,
    testDate: "2025-10-09T14:00:00Z",
    inspector: "QA-001"
  },
  issues: []                      // 問題記錄（如有）
}
```

### 3. 配方評分系統

根據累積的品質數據計算配方綜合得分：

**評分公式**：
```
總分 = (良率 × 0.3) + (過濾效率 × 0.25) + (壽命達標率 × 0.2) +
       (CPK × 10 × 0.15) + (穩定性 × 0.1)
```

**評分標準**：
- **90-100 分**：優秀配方（Golden Recipe 候選）
- **80-89 分**：良好配方
- **70-79 分**：合格配方
- **< 70 分**：需要改善

**最低樣本數要求**：
- 至少 10 批次生產數據
- 至少 30 天時間跨度
- 至少 3 條不同產線驗證

### 4. Golden Recipe 認證條件

**自動認證條件（系統自動標記）**：
1. ✅ 配方評分 ≥ 92 分
2. ✅ 累積執行批次 ≥ 30 次
3. ✅ 最近 20 批次良率 ≥ 97%
4. ✅ 製程能力 CPK ≥ 1.33
5. ✅ 無重大品質異常記錄
6. ✅ 至少 3 個月生產驗證
7. ✅ 跨產線穩定性驗證

**人工認證（工程師/品管主管）**：
- 工程師可手動標記配方為 Golden
- 需要填寫認證理由與審核意見
- 需要品管主管二次審核確認

### 5. Golden Recipe 特殊管理

**權限管理**：
- Golden Recipe 只能由特定權限人員修改
- 修改 Golden Recipe 需要特殊審核流程（更嚴格）
- 任何變更都會保留完整的變更歷史

**版本控制**：
- Golden Recipe 會被鎖定，防止意外修改
- 創建新版本時會繼承 Golden 標記（需重新驗證）
- 可以降級 Golden Recipe（品質下降時）

**優先級**：
- 在配方列表中標記 🏆 圖示
- 排序時優先顯示
- EAP 下載時優先推薦

## 資料模型

### Recipe Model 擴充

```javascript
{
  id: "RCP-001",
  name: "高效化學濾網",
  version: "1.2",

  // Golden Recipe 相關欄位
  isGolden: true,                    // 是否為 Golden Recipe
  goldenCertifiedAt: "2025-10-09",   // 認證時間
  goldenCertifiedBy: "ENG-001",      // 認證人員
  goldenScore: 94.5,                 // Golden 評分

  // 品質統計
  qualityStats: {
    totalExecutions: 45,             // 總執行次數
    avgYieldRate: 98.2,              // 平均良率
    avgEfficiency: 96.5,             // 平均效率
    avgCpk: 1.55,                    // 平均 CPK
    lastExecutionDate: "2025-10-08",
    qualityTrend: "stable"           // 品質趨勢: improving/stable/declining
  },

  // 執行記錄
  executions: [
    { executionId, batchNo, date, metrics, result }
  ]
}
```

### Quality Feedback Model

```javascript
{
  id: "QF-001",
  recipeId: "RCP-001",
  recipeVersion: "1.2",
  executionId: "EXEC-2025-001",
  batchNo: "BATCH-001",

  qualityMetrics: {
    yieldRate: 98.5,
    filterEfficiency: 96.2,
    lifespan: 36,
    defectRate: 1.5,
    cpk: 1.67,
    stabilityScore: 95
  },

  testResults: {
    passed: true,
    testDate: "2025-10-09T14:00:00Z",
    inspector: "QA-001",
    testReport: "report-001.pdf"
  },

  productionInfo: {
    productionLine: "LINE-01",
    operator: "OP-001",
    startTime: "2025-10-09T10:00:00Z",
    endTime: "2025-10-09T12:00:00Z"
  },

  issues: [],                        // 問題記錄
  notes: "",                         // 備註

  createdAt: "2025-10-09T14:00:00Z",
  source: "SPC-SYSTEM"               // 數據來源
}
```

## API 介面

### 1. 品質數據回傳

```http
POST /api/recipes/:recipeId/quality-feedback
Authorization: Bearer {spc-system-token}

{
  "executionId": "EXEC-2025-001",
  "batchNo": "BATCH-001",
  "qualityMetrics": { ... },
  "testResults": { ... }
}
```

### 2. 查詢配方品質統計

```http
GET /api/recipes/:recipeId/quality-stats
```

### 3. Golden Recipe 認證

```http
POST /api/recipes/:recipeId/certify-golden
Authorization: Bearer {engineer-token}

{
  "reason": "連續 30 批次良率 > 98%，製程穩定",
  "reviewedBy": "QA-MANAGER-001"
}
```

### 4. 取得 Golden Recipe 列表

```http
GET /api/recipes/golden
```

## UI 設計

### 配方列表頁面增強

```
┌─────────────────────────────────────────────────────────┐
│ 配方管理                                    [建立配方]  │
├─────────────────────────────────────────────────────────┤
│ 配方編號        │ 配方名稱          │ 版本 │ 狀態        │
├─────────────────┼───────────────────┼──────┼─────────────┤
│ 🏆 AMC-2025-001 │ 高效化學濾網      │ 1.2  │ Golden ⭐️  │
│    良率: 98.2%  │ 評分: 94.5 分     │      │ 45 次執行   │
├─────────────────┼───────────────────┼──────┼─────────────┤
│ AMC-2025-002    │ 標準活性碳濾網    │ 2.0  │ 良好 ✓      │
│    良率: 95.8%  │ 評分: 87.3 分     │      │ 12 次執行   │
└─────────────────────────────────────────────────────────┘
```

### 配方詳情頁面 - Golden Recipe 區塊

```
┌─────────────────────────────────────────────────────────┐
│ 🏆 Golden Recipe 認證資訊                              │
├─────────────────────────────────────────────────────────┤
│ 認證時間：2025-09-15                                    │
│ 認證人員：張工程師 (ENG-001)                            │
│ 審核主管：李品管主管 (QA-MGR-001)                       │
│ Golden 評分：94.5 分                                    │
│                                                         │
│ 品質統計：                                              │
│ • 總執行次數：45 批次                                   │
│ • 平均良率：98.2%                                       │
│ • 平均 CPK：1.55                                        │
│ • 品質趨勢：穩定 ✓                                      │
│                                                         │
│ [查看品質報表] [降級 Golden] [版本歷史]                │
└─────────────────────────────────────────────────────────┘
```

### 品質數據趨勢圖表

```
良率趨勢 (最近 30 批次)
100% ┤     ●─●─●───●─●─●
 98% ┤   ●           ●   ●─●
 96% ┤ ●                     ●
 94% ┤
     └───────────────────────────→
      批次 1       15       30

      平均: 98.2%  Golden 標準: ≥97%
```

## 實作階段

### Phase 1：基礎數據收集（MVP）
- ✅ 配方執行記錄
- ✅ 品質數據回傳 API
- ✅ 基本品質統計

### Phase 2：評分與認證
- ⏳ 配方評分演算法
- ⏳ Golden Recipe 自動認證
- ⏳ 人工認證流程

### Phase 3：進階分析
- 📋 品質趨勢分析
- 📋 配方比較工具
- 📋 智能推薦系統

### Phase 4：AI 優化（未來）
- 📋 機器學習預測配方品質
- 📋 參數優化建議
- 📋 異常檢測與預警

## 與 SPC/MES 系統整合

### 整合方式 1：Webhook（推薦）

SPC 系統完成檢驗後主動推送：

```javascript
// SPC System
async function onQualityTestComplete(testResult) {
  await fetch('https://rms.company.com/api/quality-feedback', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer {spc-system-token}',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipeId: testResult.recipeId,
      executionId: testResult.executionId,
      qualityMetrics: testResult.metrics
    })
  });
}
```

### 整合方式 2：定時拉取

RMS 定時向 SPC 系統查詢新的品質數據：

```javascript
// RMS Scheduler (每小時執行)
async function syncQualityData() {
  const newData = await spcClient.getQualityDataSince(lastSyncTime);
  for (const data of newData) {
    await QualityFeedbackModel.create(data);
    await updateRecipeQualityStats(data.recipeId);
  }
}
```

### 整合方式 3：檔案交換

SPC 系統匯出 CSV/JSON 檔案，RMS 定時讀取：

```
/shared/quality-data/
  ├── 2025-10-09-quality-report.csv
  ├── 2025-10-08-quality-report.csv
  └── ...
```

## 安全性考量

1. **API 認證**：SPC 系統需要專用的 API Token
2. **數據驗證**：嚴格驗證品質數據的格式與合理性
3. **權限控制**：Golden 認證需要特定角色權限
4. **審計日誌**：所有 Golden 相關操作都要記錄

## 效益分析

### 對生產的影響
- ✅ 快速識別最佳配方
- ✅ 降低試錯成本
- ✅ 提升整體良率
- ✅ 縮短新人培訓時間

### 對品質的影響
- ✅ 建立品質標準
- ✅ 持續改善循環
- ✅ 數據驅動決策
- ✅ 可追溯性完整

### 對管理的影響
- ✅ 配方生命週期管理
- ✅ 知識沉澱與傳承
- ✅ 標準化流程
- ✅ 績效評估依據

## 總結

Golden Recipe 機制是配方管理系統的重要進階功能，透過整合 SPC 品質數據，實現配方的持續優化與標準化。建議採用漸進式實作，先建立基礎數據收集能力，再逐步加入評分、認證、分析等進階功能。
