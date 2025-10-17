# Phase 5 開發計畫

**版本**：v0.4.0 - v0.9.0
**開始日期**：2025-10-09
**預計完成**：依各階段進度

---

## 總覽

Phase 5 包含 6 個主要功能模組，按照依賴關係和優先級排序：

| 階段 | 功能 | 優先級 | 依賴 | 預計工時 | 狀態 |
|------|------|--------|------|----------|------|
| 1 | 條件分支執行邏輯 | ⭐⭐⭐⭐⭐ | 無 | 2-3天 | 🚧 開發中 |
| 2 | 報表統計與圖表 | ⭐⭐⭐⭐ | 無 | 3-4天 | 📋 計劃中 |
| 3 | 使用者登入系統 | ⭐⭐⭐ | 無 | 2-3天 | 📋 計劃中 |
| 4 | 權限管理 | ⭐⭐⭐ | 階段3 | 2-3天 | 📋 計劃中 |
| 5 | 表單版本控制 | ⭐ | 無 | 2-3天 | 📋 計劃中 |
| - | Email 通知功能 | - | 階段3 | 3-4天 | 🔮 未來擴充 |

---

## 階段 1: 條件分支執行邏輯 【v0.4.0】

### 目標
實作智慧化流程控制，根據表單資料自動選擇分支路徑

### 使用場景範例
1. **請假天數判斷**
   - 請假天數 ≤ 3 天：部門主管核准即可
   - 請假天數 > 3 天：需要總經理核准

2. **金額判斷**
   - 報支金額 ≤ 10,000：部門主管核准
   - 報支金額 > 10,000：財務主管 + 總經理核准

3. **部門判斷**
   - 部門 == "財務部"：需要財務長核准
   - 其他部門：一般流程

4. **複合條件**
   - (部門 == "IT部" AND 金額 > 50,000)：需要CTO核准
   - 其他：一般流程

### 技術設計

#### 1. ConditionEvaluator（條件判斷引擎）

**檔案位置**：`src/utils/conditionEvaluator.js`

**核心功能**：
```javascript
class ConditionEvaluator {
  // 評估單一條件
  evaluateCondition(formData, condition) {
    const { field, operator, value } = condition;
    const fieldValue = formData[field];

    switch (operator) {
      case '>': return Number(fieldValue) > Number(value);
      case '<': return Number(fieldValue) < Number(value);
      case '>=': return Number(fieldValue) >= Number(value);
      case '<=': return Number(fieldValue) <= Number(value);
      case '==': return fieldValue == value;
      case '!=': return fieldValue != value;
      case 'contains': return String(fieldValue).includes(value);
      default: return false;
    }
  }

  // 評估條件組（支援 AND/OR）
  evaluateConditionGroup(formData, conditionGroup) {
    const { conditions, logic } = conditionGroup; // logic: 'AND' | 'OR'

    if (logic === 'AND') {
      return conditions.every(cond => this.evaluateCondition(formData, cond));
    } else {
      return conditions.some(cond => this.evaluateCondition(formData, cond));
    }
  }
}
```

#### 2. 條件節點資料結構

**WorkflowModel 擴充**：
```javascript
{
  type: 'condition',
  label: '條件判斷',
  // 新增條件規則配置
  conditionRules: [
    {
      id: 'rule1',
      name: '請假天數 > 3',
      outputPoint: 'out-right',  // 對應的輸出點
      conditionGroup: {
        logic: 'AND',
        conditions: [
          {
            field: 'days',      // 表單欄位 ID
            operator: '>',
            value: '3'
          }
        ]
      }
    },
    {
      id: 'rule2',
      name: '請假天數 ≤ 3',
      outputPoint: 'out-bottom',
      conditionGroup: {
        logic: 'AND',
        conditions: [
          {
            field: 'days',
            operator: '<=',
            value: '3'
          }
        ]
      }
    }
  ],
  defaultOutputPoint: 'out-left'  // 預設輸出（無條件符合時）
}
```

#### 3. NodePropertyPanel UI 擴充

**新增條件設定區塊**：
```html
<div class="condition-rules">
  <h4>條件規則設定</h4>

  <!-- 規則列表 -->
  <div class="rule-list">
    <div class="rule-item">
      <div class="rule-header">
        <span>規則 1: 請假天數 > 3</span>
        <button>編輯</button>
        <button>刪除</button>
      </div>
      <div class="rule-info">
        輸出點: out-right (右側)
      </div>
    </div>
  </div>

  <button>+ 新增規則</button>
</div>

<!-- 規則編輯 Modal -->
<div class="rule-editor">
  <label>規則名稱</label>
  <input type="text" placeholder="例：請假天數 > 3">

  <label>輸出點</label>
  <select>
    <option value="out-right">右側 (out-right)</option>
    <option value="out-bottom">下方 (out-bottom)</option>
    <option value="out-left">左側 (out-left)</option>
  </select>

  <label>條件設定</label>
  <div class="conditions-group">
    <select name="logic">
      <option value="AND">全部符合 (AND)</option>
      <option value="OR">任一符合 (OR)</option>
    </select>

    <div class="condition-list">
      <div class="condition-item">
        <select name="field">
          <option value="days">請假天數</option>
          <option value="type">請假類型</option>
          <!-- 動態從表單欄位載入 -->
        </select>

        <select name="operator">
          <option value=">">大於 (>)</option>
          <option value="<">小於 (<)</option>
          <option value=">=">大於等於 (>=)</option>
          <option value="<=">小於等於 (<=)</option>
          <option value="==">等於 (==)</option>
          <option value="!=">不等於 (!=)</option>
          <option value="contains">包含</option>
        </select>

        <input type="text" name="value" placeholder="比較值">

        <button>刪除條件</button>
      </div>
    </div>

    <button>+ 新增條件</button>
  </div>
</div>
```

#### 4. ApprovalEngine 整合

**修改 processCondition() 方法**：
```javascript
processCondition(node) {
  const formData = this.instance.data;
  const evaluator = new ConditionEvaluator();

  // 取得節點的條件規則
  const rules = node.conditionRules || [];

  // 依序評估規則
  for (const rule of rules) {
    const result = evaluator.evaluateConditionGroup(formData, rule.conditionGroup);

    if (result) {
      // 條件符合，選擇對應的輸出分支
      const nextNodes = this.getNextNodesByPoint(node.id, rule.outputPoint);

      if (nextNodes.length > 0) {
        // 記錄條件判斷結果
        this.recordHistory({
          nodeId: node.id,
          nodeName: node.label,
          action: 'condition',
          result: 'matched',
          comment: `條件符合：${rule.name}，走 ${rule.outputPoint} 分支`
        });

        // 移動到下一節點
        this.instance.currentNodeId = nextNodes[0].id;
        this.instance.save();

        return {
          status: 'pending',
          message: `條件判斷完成：${rule.name}`
        };
      }
    }
  }

  // 無條件符合，使用預設輸出
  const defaultNodes = this.getNextNodesByPoint(node.id, node.defaultOutputPoint);

  if (defaultNodes.length > 0) {
    this.recordHistory({
      nodeId: node.id,
      nodeName: node.label,
      action: 'condition',
      result: 'default',
      comment: '無條件符合，使用預設分支'
    });

    this.instance.currentNodeId = defaultNodes[0].id;
    this.instance.save();

    return {
      status: 'pending',
      message: '使用預設分支'
    };
  }

  throw new Error('條件節點無有效輸出');
}

// 新增方法：根據輸出點取得下一節點
getNextNodesByPoint(nodeId, outputPoint) {
  const connections = this.workflow.connections.filter(
    c => c.from === nodeId && c.fromPoint === outputPoint
  );
  return connections.map(c => this.workflow.nodes.find(n => n.id === c.to)).filter(Boolean);
}
```

### 實作檢查清單

- [ ] **步驟 1**: 建立 ConditionEvaluator 類別
  - [ ] 實作 evaluateCondition() 方法
  - [ ] 實作 evaluateConditionGroup() 方法
  - [ ] 支援各種運算子（>, <, >=, <=, ==, !=, contains）
  - [ ] 撰寫單元測試

- [ ] **步驟 2**: 更新 NodePropertyPanel
  - [ ] 新增條件規則設定區塊
  - [ ] 實作規則列表顯示
  - [ ] 實作新增/編輯/刪除規則
  - [ ] 實作條件編輯器 Modal
  - [ ] 動態載入表單欄位選項
  - [ ] 儲存條件規則到節點資料

- [ ] **步驟 3**: 更新 WorkflowModel
  - [ ] 擴充資料結構支援 conditionRules
  - [ ] 更新儲存/載入邏輯

- [ ] **步驟 4**: 修改 ApprovalEngine
  - [ ] 實作新的 processCondition() 方法
  - [ ] 實作 getNextNodesByPoint() 方法
  - [ ] 記錄條件判斷結果到歷史

- [ ] **步驟 5**: 測試
  - [ ] 測試簡單數值條件
  - [ ] 測試文字條件
  - [ ] 測試複合條件（AND/OR）
  - [ ] 測試預設分支
  - [ ] 測試流程視覺化顯示

- [ ] **步驟 6**: 文件更新
  - [ ] 更新 README.md
  - [ ] 更新 MEMORY.md
  - [ ] 建立使用範例
  - [ ] 更新測試文件

### 測試場景

#### 場景 1: 請假天數判斷
```
表單欄位：
- 請假天數 (days): 數字

流程設計：
開始 → 條件分支 → 結束
         ├─ days > 3 → 單簽(總經理) → 結束
         └─ days ≤ 3 → 單簽(部門主管) → 結束

測試案例：
1. days = 2 → 應走部門主管分支
2. days = 5 → 應走總經理分支
```

#### 場景 2: 複合條件
```
表單欄位：
- 部門 (department): 文字
- 金額 (amount): 數字

流程設計：
開始 → 條件分支 → 結束
         ├─ (department == "財務部" AND amount > 10000) → 並簽(財務長+總經理)
         └─ 其他 → 單簽(部門主管)

測試案例：
1. department="財務部", amount=15000 → 應走並簽分支
2. department="IT部", amount=15000 → 應走部門主管分支
3. department="財務部", amount=5000 → 應走部門主管分支
```

---

## 階段 2-6：待後續展開

各階段詳細計畫請參考 MEMORY.md

---

## 開發注意事項

1. **版本控制**
   - 每個階段完成後建立 Git tag（v0.4.0, v0.5.0...）
   - 每個功能完成後更新 README.md 版本日誌

2. **測試要求**
   - 每個功能必須經過完整測試
   - 更新 TEST_CHECKLIST.md
   - 記錄測試結果

3. **文件更新**
   - 同步更新 MEMORY.md
   - 更新使用者文件
   - 記錄已知問題

4. **向後相容**
   - 確保新功能不影響現有功能
   - 提供資料遷移方案（如需要）

---

## 開發進度追蹤

**當前階段**: 階段 1 - 條件分支執行邏輯
**開始日期**: 2025-10-09
**預計完成**: 2025-10-11

**完成度**: 0% (0/5 功能完成)

- [ ] 階段 1: 條件分支執行邏輯
- [ ] 階段 2: 報表統計與圖表
- [ ] 階段 3: 使用者登入系統
- [ ] 階段 4: 權限管理
- [ ] 階段 5: 表單版本控制

**未來擴充**:
- [ ] Email 通知功能（暫不排入開發計畫）
