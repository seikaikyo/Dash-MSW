# MSW 濾網再生製造系統 - 完整介面概覽

## 🎯 系統定位

Dash MSW (Manufacturing System for Workflow) 是專為**柳營再生濾網製程**設計的生產管理系統，整合了工單管理、製程控制、倉儲管理、能源監控等功能。

---

## 📋 主要功能模組

### 1. **工作區** (首頁)
- **總覽儀表板** (`/`)
  - 進行中工單數量
  - 總工單統計
  - 已完成工單
  - 今日處理量
  - 快速操作入口

---

### 2. **生產管理**

#### 📝 工單管理 (`/forms`)
- 建立、查看、編輯工單
- 工單狀態追蹤
- 配方參數記錄
- 工單歷史查詢

#### 🏭 製程站點 (`/stations`)
- 站點狀態監控（清洗、乾燥、檢測、包裝、RFID、輸送）
- 站點容量管理
- 即時效能指標
- **IoT Edge 設備警報** （即時顯示設備異常）
- 設備維護排程

#### 🔄 製程流程 (`/workflows`)
- 流程設計與管理
- 流程模板
- 簽核流程配置

---

### 3. **倉儲與物流**

#### 📦 WMS 倉儲管理 (`/wms`)
- 倉庫管理（原料倉、成品倉、再生區）
- 庫存追蹤
- 入庫/出庫記錄
- 庫存預警
- RFID 物料追蹤

#### ⚡ 能源管理 (`/energy`)
- 即時能耗監控
- 月度能耗比較
- 能源消耗趨勢
- 成本分析

---

### 4. **品質管理**

#### 🏆 Golden Process (`/golden`)
- 標準製程認證
- Golden Recipe 管理
- 製程參數標準化

#### 📊 SPC 品管 (`/spc`)
- 統計製程管制
- 品質趨勢分析
- 異常偵測

---

### 5. **組織管理**

#### 👥 人員管理 (`/users`)
- 使用者帳號管理
- 角色權限配置
- 密碼修改

#### 🏢 部門管理 (`/departments`)
- 部門組織架構
- 人員歸屬管理

---

### 6. **系統設定**

#### 📈 報表統計 (`/reports`)
- 生產報表
- 效能分析
- 資料匯出

#### 🔐 權限管理 (`/permissions`)
- 角色權限配置
- 頁面訪問控制
- 功能權限管理

---

## 🔧 核心技術特色

### IoT Edge 整合
- **即時設備監控**: 自動輪詢設備狀態
- **警報系統**: 多級警報（資訊、警告、錯誤、嚴重）
- **事件驅動架構**: Publish/Subscribe 模式
- **Mock 模式**: 無需實際硬體即可開發測試

### 設備通訊服務
- **Modbus TCP 協議**: 工業標準通訊
- **多設備類型支持**: 清洗、乾燥、檢測、包裝設備
- **自動重連機制**: 設備斷線自動恢復
- **WebSocket 代理**: 瀏覽器端即時通訊

### RFID 追蹤系統
- **標籤讀寫**: 單標籤與批量掃描
- **位置追蹤**: 濾網完整旅程記錄
- **異常偵測**: 遺失、異常移動、滯留檢測
- **事件記錄**: 完整的歷史軌跡

---

## 🎨 使用者介面

### 頂部導航欄
```
♻️ Dash MSW  |  總覽  工單  站點  倉儲  能源
                                    [使用者資訊] [切換角色] [🔐] [登出]
```

### 側邊欄菜單
根據使用者角色動態顯示：

**工作區**
- 📊 總覽

**生產管理**
- 📝 工單管理
- 🏭 製程站點
- 🔄 製程流程

**倉儲與物流**
- 📦 WMS 倉儲
- ⚡ 能源管理

**品質管理**
- 🏆 Golden Process
- 📊 SPC 品管

**組織管理**
- 👥 人員管理
- 🏢 部門管理

**系統設定**
- 📈 報表統計
- 🔐 權限管理

---

## 👥 角色權限

### 系統管理員
- 所有功能完整訪問權限
- 使用者與權限管理
- 系統配置管理

### 主管
- 工單審核與管理
- 報表查看
- 團隊資源管理
- Golden Process 認證

### 一般員工
- 建立與編輯自己的工單
- 查看製程站點
- 查看 SPC 數據
- 倉儲查詢

---

## 🚀 快速開始

### 訪問系統
```
http://localhost:3002/
```

### 預設帳號
```
帳號: admin
密碼: admin
```

### IoT Edge 測試工具
```
http://localhost:3002/test-iotedge.html
```

---

## 📊 資料持久化

所有資料儲存在瀏覽器 **LocalStorage**：
- `rms_users` - 使用者資料
- `rms_departments` - 部門資料
- `rms_form_instances` - 工單資料
- `msw_wms_warehouses` - 倉庫資料
- `msw_energy_records` - 能源記錄
- `msw_stations` - 站點資料
- `msw_iotedge_devices` - IoT 設備資料

---

## 🔍 開發者工具

### Console 可用物件
```javascript
// IoT Edge 服務
window.iotEdgeService

// 設備服務
window.deviceService

// RFID 服務
window.rfidService

// 站點管理
window.stationManager

// WMS 管理
window.warehouseManager

// 能源管理
window.energyManager
```

### 測試警報生成
```javascript
// 註冊設備
iotEdgeService.registerEdgeDevice('test-device', {
  name: '測試設備',
  apiUrl: 'http://192.168.1.100:8080/api',
  type: 'cleaning',
  location: '測試區'
});

// 生成警報
iotEdgeService.generateTestAlert('test-device', 'warning');
iotEdgeService.generateTestAlert('test-device', 'error');
iotEdgeService.generateTestAlert('test-device', 'critical');

// 查看警報
iotEdgeService.getAllAlerts();
```

---

## ✅ 已實現功能清單

### ✅ 核心系統
- [x] 使用者認證與權限管理
- [x] 角色權限系統（RBAC）
- [x] 響應式佈局
- [x] 深色/淺色主題
- [x] 多使用者切換

### ✅ 生產管理
- [x] 工單管理系統
- [x] 製程站點監控
- [x] 站點效能統計
- [x] Golden Process 管理
- [x] SPC 品質管制

### ✅ 倉儲物流
- [x] WMS 倉儲系統
- [x] 庫存管理
- [x] 出入庫記錄
- [x] 能源監控系統
- [x] 能耗統計分析

### ✅ IoT 整合
- [x] IoT Edge 服務
- [x] 設備通訊服務
- [x] RFID 追蹤系統
- [x] 即時警報系統
- [x] 事件訂閱機制

### ✅ 資料視覺化
- [x] 儀表板統計卡片
- [x] 趨勢圖表
- [x] 能耗比較圖
- [x] 站點狀態監控
- [x] 庫存統計圖表

---

## 🎯 系統特色

1. **無需後端**: 純前端系統，快速部署
2. **Mock 模式**: 完整模擬真實設備，方便開發測試
3. **即時更新**: 事件驅動架構，即時反應設備狀態
4. **模組化設計**: 清晰的模組劃分，易於維護擴展
5. **工業標準**: 支援 Modbus TCP、RFID 等工業協議
6. **權限管控**: 細粒度的頁面與功能權限控制

---

## 📝 更新日誌

### v1.0.0 (2025-10-15)
- ✅ 完成 MSW 系統核心功能
- ✅ 整合 IoT Edge 服務
- ✅ 實現設備通訊與 RFID 追蹤
- ✅ WMS、能源、站點管理模組上線
- ✅ 優化使用者介面，移除非 MSW 功能
- ✅ 完整的權限管理系統

---

## 🛠️ 技術堆疊

- **前端框架**: Vanilla JavaScript (ES6+)
- **模組系統**: ES Modules
- **樣式**: CSS Variables + Custom Properties
- **構建工具**: Vite
- **資料儲存**: LocalStorage
- **通訊協議**: WebSocket, Modbus TCP
- **設備追蹤**: RFID

---

## 📞 支援與回饋

如有問題或建議，請聯繫開發團隊。

**系統版本**: v1.0.0
**最後更新**: 2025-10-15
**開發者**: Dash Team
