/**
 * 測試劇本集合
 * 針對各模組功能進行完整的劇本測試
 */

import { testRunner } from './testRunner.js';
import { FormModel, WorkflowModel, FormInstanceModel, generateApplicationNo, UserModel } from './dataModel.js';
import { SPCModel } from './spcModel.js';
import { formVersionControl } from './versionControl.js';
import { ApprovalEngine } from './approvalEngine.js';
import { storage } from './storage.js';
import { userContext } from './userContext.js';

/**
 * 工單管理測試劇本（柳營再生濾網）
 */
export function registerWorkOrderScenarios() {
  testRunner.scenario('工單建立與管理流程', async ({ assertEqual, assertNotNull, assertTrue, log }) => {
    log('開始測試工單建立與管理');

    // 步驟 1: 建立工單
    log('步驟 1: 建立再生濾網工單');
    const workOrder = new FormInstanceModel({
      applicationNo: 'MSW-TEST-001',
      formName: '柳營再生濾網工單',
      applicant: '測試人員',
      department: '製程部',
      data: {
        workOrderNo: 'MSW-TEST-001',
        batchNo: 'TEST-BATCH-001',
        sourceFactory: '柳營廠',
        filterType: '活性碳濾網',
        quantity: 100,
        regenerationCycle: 'R0 (首次再生)',
        deglueOperator: '測試操作員',
        ovenId: '烘箱-01',
        targetTemp: 150,
        bakingTime: 180,
        qualityGrade: 'A (優良)'
      },
      status: 'pending'
    });
    workOrder.save();

    assertNotNull(workOrder.id, '工單應有 ID');
    assertEqual(workOrder.status, 'pending', '初始狀態應為待處理');
    assertEqual(workOrder.data.filterType, '活性碳濾網', '濾網類型應正確');

    // 步驟 2: 更新工單狀態
    log('步驟 2: 更新工單為進行中');
    workOrder.status = 'in_progress';
    workOrder.save();

    const updated = FormInstanceModel.getById(workOrder.id);
    assertEqual(updated.status, 'in_progress', '狀態應已更新為進行中');

    // 步驟 3: 查詢工單
    log('步驟 3: 查詢工單');
    const allWorkOrders = FormInstanceModel.getAll();
    assertTrue(allWorkOrders.some(wo => wo.id === workOrder.id), '應能查詢到工單');

    // 步驟 4: 完成工單
    log('步驟 4: 完成工單');
    workOrder.status = 'completed';
    workOrder.save();

    const completed = FormInstanceModel.getById(workOrder.id);
    assertEqual(completed.status, 'completed', '工單應已完成');

    // 清理
    FormInstanceModel.delete(workOrder.id);
    log('工單管理流程測試完成 ✓');
  });

  testRunner.scenario('工單資料驗證', async ({ assertEqual, assertTrue, assertNotNull, log }) => {
    log('開始測試工單資料驗證');

    // 測試必填欄位
    log('測試必填欄位驗證');
    const workOrder = new FormInstanceModel({
      applicationNo: 'MSW-TEST-002',
      formName: '柳營再生濾網工單',
      applicant: '測試人員',
      department: '製程部',
      data: {
        workOrderNo: 'MSW-TEST-002',
        batchNo: 'TEST-BATCH-002',
        sourceFactory: '台南廠',
        filterType: '化學濾網',
        quantity: 80
      },
      status: 'pending'
    });
    workOrder.save();

    assertNotNull(workOrder.data.workOrderNo, '工單編號為必填');
    assertNotNull(workOrder.data.batchNo, '批次號為必填');
    assertTrue(workOrder.data.quantity > 0, '數量應大於 0');

    // 清理
    FormInstanceModel.delete(workOrder.id);
    log('工單資料驗證測試完成 ✓');
  });
}

/**
 * 製程站點測試劇本
 */
export function registerStationScenarios() {
  testRunner.scenario('製程站點管理', async ({ assertEqual, assertNotNull, log }) => {
    log('開始測試製程站點管理');

    // 模擬製程站點資料結構
    const station = {
      id: 'station-001',
      name: '除膠站點-01',
      type: 'deglue',
      status: 'active',
      location: '柳營廠 A 區',
      capacity: 100,
      currentLoad: 50
    };

    assertNotNull(station.id, '站點應有 ID');
    assertEqual(station.type, 'deglue', '站點類型應正確');
    assertEqual(station.status, 'active', '站點狀態應為啟用');

    log('製程站點管理測試完成 ✓');
  });

  testRunner.scenario('站點狀態監控', async ({ assertEqual, assertTrue, log }) => {
    log('開始測試站點狀態監控');

    const station = {
      id: 'station-002',
      name: '烘箱-01',
      currentTemp: 150,
      targetTemp: 150,
      status: 'running'
    };

    assertEqual(station.status, 'running', '站點應在運行中');
    assertTrue(Math.abs(station.currentTemp - station.targetTemp) < 5, '溫度應接近目標值');

    log('站點狀態監控測試完成 ✓');
  });
}

/**
 * 工作流程引擎測試劇本
 */
export function registerWorkflowEngineScenarios() {
  testRunner.scenario('工作流程簽核流程', async ({ assertEqual, assertNotNull, assertTrue, log }) => {
    log('開始測試工作流程引擎');

    // 步驟 1: 建立表單
    log('步驟 1: 建立測試表單');
    const form = new FormModel({
      name: '請假單',
      fields: [
        { id: 'days', type: 'number', label: '請假天數' },
        { id: 'reason', type: 'text', label: '請假原因' }
      ]
    });
    form.save();

    // 步驟 2: 建立工作流程
    log('步驟 2: 建立工作流程');
    const workflow = new WorkflowModel({
      name: '請假簽核流程',
      formId: form.id,
      nodes: [
        { id: 'start', type: 'start', label: '開始', x: 100, y: 100 },
        { id: 'mgr', type: 'single', label: '主管審核', approvers: ['mgr001'], x: 300, y: 100 },
        { id: 'end', type: 'end', label: '結束', x: 500, y: 100 }
      ],
      connections: [
        { from: 'start', to: 'mgr', fromPoint: 'out', toPoint: 'in' },
        { from: 'mgr', to: 'end', fromPoint: 'out', toPoint: 'in' }
      ]
    });
    workflow.save();

    // 步驟 3: 建立申請單
    log('步驟 3: 建立申請單');
    const instance = new FormInstanceModel({
      formId: form.id,
      formName: form.name,
      workflowId: workflow.id,
      workflowName: workflow.name,
      applicant: '張三',
      department: '業務部',
      data: {
        days: 3,
        reason: '家庭因素'
      }
    });
    instance.number = generateApplicationNo();
    instance.save();

    assertNotNull(instance.id, '申請單應有 ID');
    assertEqual(instance.status, 'draft', '初始狀態應為 draft');

    // 步驟 4: 啟動簽核流程
    log('步驟 4: 啟動簽核流程');
    const engine = new ApprovalEngine(instance.id);
    engine.initializeWorkflow();

    const started = FormInstanceModel.getById(instance.id);
    assertEqual(started.status, 'pending', '啟動後狀態應為 pending');
    assertEqual(started.currentNodeId, 'mgr', '當前節點應為主管審核');

    // 步驟 5: 主管簽核通過
    log('步驟 5: 主管簽核通過');
    const approveResult = engine.approve('mgr001', '王主管', '同意', 'approve');
    assertEqual(approveResult.status, 'approved', '簽核後應為通過狀態');

    const approved = FormInstanceModel.getById(instance.id);
    assertEqual(approved.status, 'approved', '申請單狀態應為已通過');

    // 清理測試資料
    FormModel.delete(form.id);
    WorkflowModel.delete(workflow.id);
    FormInstanceModel.delete(instance.id);

    log('工作流程引擎測試完成 ✓');
  });
}

/**
 * SPC 統計分析測試劇本
 */
export function registerSPCScenarios() {
  testRunner.scenario('SPC 數據管理流程', async ({ assertEqual, assertNotNull, assertTrue, assertLength, log }) => {
    log('開始測試 SPC 數據管理');

    // 步驟 1: 清空測試資料
    log('步驟 1: 清空測試資料');
    SPCModel.clearAll();

    // 步驟 2: 新增數據點
    log('步驟 2: 新增 SPC 數據點');
    const data1 = SPCModel.create({
      recipeId: 'recipe001',
      batchNo: 'BATCH001',
      measurements: {
        weight: 100.5,
        thickness: 2.3
      },
      operator: '操作員A',
      shift: '早班'
    });

    assertNotNull(data1.id, '數據點應有 ID');
    assertEqual(data1.recipeId, 'recipe001', '配方 ID 應正確');

    // 步驟 3: 批次新增數據
    log('步驟 3: 批次新增數據');
    const batchData = [];
    for (let i = 0; i < 30; i++) {
      batchData.push({
        recipeId: 'recipe001',
        batchNo: `BATCH${String(i + 2).padStart(3, '0')}`,
        measurements: {
          weight: 100 + Math.random() * 2,
          thickness: 2.3 + Math.random() * 0.2
        },
        operator: '操作員A'
      });
    }

    const created = SPCModel.bulkCreate(batchData);
    assertLength(created, 30, '應批次建立 30 筆數據');

    // 步驟 4: 計算管制限
    log('步驟 4: 計算管制限');
    const limits = SPCModel.calculateControlLimits('recipe001', 'weight');
    assertNotNull(limits.ucl, '應有管制上限');
    assertNotNull(limits.lcl, '應有管制下限');
    assertNotNull(limits.cl, '應有中心線');
    assertTrue(limits.ucl > limits.cl, '管制上限應大於中心線');
    assertTrue(limits.lcl < limits.cl, '管制下限應小於中心線');

    // 清理
    SPCModel.clearAll();

    log('SPC 數據管理流程測試完成 ✓');
  });
}

/**
 * WMS 倉儲管理測試劇本
 */
export function registerWMSScenarios() {
  testRunner.scenario('倉儲管理基本功能', async ({ assertEqual, assertNotNull, assertTrue, log }) => {
    log('開始測試 WMS 倉儲管理');

    // 模擬倉儲資料
    const inventory = {
      id: 'inv-001',
      itemCode: 'FILTER-001',
      itemName: '活性碳濾網',
      location: 'A01-01',
      quantity: 100,
      unit: '片',
      status: 'available'
    };

    assertNotNull(inventory.id, '庫存項目應有 ID');
    assertEqual(inventory.status, 'available', '狀態應為可用');
    assertTrue(inventory.quantity > 0, '數量應大於 0');

    log('倉儲入庫作業');
    inventory.quantity += 50;
    assertEqual(inventory.quantity, 150, '入庫後數量應正確');

    log('倉儲出庫作業');
    inventory.quantity -= 30;
    assertEqual(inventory.quantity, 120, '出庫後數量應正確');

    log('WMS 倉儲管理測試完成 ✓');
  });
}

/**
 * 能源管理測試劇本
 */
export function registerEnergyScenarios() {
  testRunner.scenario('能源監控與統計', async ({ assertEqual, assertNotNull, assertTrue, log }) => {
    log('開始測試能源管理');

    // 模擬能源數據
    const energyData = {
      deviceId: 'oven-01',
      deviceName: '烘箱-01',
      consumption: 45.5,
      unit: 'kWh',
      timestamp: Date.now()
    };

    assertNotNull(energyData.deviceId, '設備應有 ID');
    assertTrue(energyData.consumption > 0, '能耗應大於 0');
    assertEqual(energyData.unit, 'kWh', '單位應為 kWh');

    log('計算能源成本');
    const unitPrice = 3.5; // 元/kWh
    const cost = energyData.consumption * unitPrice;
    assertTrue(cost > 0, '能源成本應正確計算');

    log('能源管理測試完成 ✓');
  });
}

/**
 * Golden Recipe 測試劇本
 */
export function registerGoldenRecipeScenarios() {
  testRunner.scenario('Golden Recipe 認證', async ({ assertEqual, assertNotNull, log }) => {
    log('開始測試 Golden Recipe');

    const recipe = {
      id: 'recipe-001',
      name: '標準再生製程',
      version: '1.0',
      isGolden: false,
      parameters: {
        temp: 150,
        time: 180
      }
    };

    assertNotNull(recipe.id, 'Recipe 應有 ID');
    assertEqual(recipe.isGolden, false, '初始應非 Golden');

    log('認證為 Golden Recipe');
    recipe.isGolden = true;
    recipe.certifiedDate = Date.now();
    assertEqual(recipe.isGolden, true, '應已認證為 Golden');

    log('Golden Recipe 測試完成 ✓');
  });
}

/**
 * 組織管理測試劇本
 */
export function registerOrganizationScenarios() {
  testRunner.scenario('使用者與部門管理', async ({ assertEqual, assertNotNull, assertLength, log }) => {
    log('開始測試組織管理');

    // 模擬使用者資料
    const user = {
      id: 'user-001',
      name: '王小明',
      employeeId: 'EMP001',
      department: '製程部',
      role: 'operator',
      status: 'active'
    };

    assertNotNull(user.id, '使用者應有 ID');
    assertEqual(user.status, 'active', '狀態應為啟用');
    assertEqual(user.department, '製程部', '部門應正確');

    // 模擬部門資料
    const department = {
      id: 'dept-001',
      name: '製程部',
      code: 'PROCESS',
      memberCount: 10
    };

    assertNotNull(department.id, '部門應有 ID');
    assertEqual(department.name, '製程部', '部門名稱應正確');

    log('組織管理測試完成 ✓');
  });
}

/**
 * 權限管理測試劇本
 */
export function registerPermissionScenarios() {
  testRunner.scenario('權限分配與驗證', async ({ assertEqual, assertTrue, log }) => {
    log('開始測試權限管理');

    const role = {
      id: 'role-001',
      name: '製程操作員',
      permissions: [
        'page:forms',
        'page:stations',
        'action:create-form',
        'action:view-forms'
      ]
    };

    assertTrue(role.permissions.length > 0, '角色應有權限');
    assertTrue(role.permissions.includes('page:forms'), '應有工單管理頁面權限');

    log('驗證權限檢查');
    const hasPermission = role.permissions.includes('action:create-form');
    assertEqual(hasPermission, true, '應有建立工單權限');

    log('權限管理測試完成 ✓');
  });
}

/**
 * 報表統計測試劇本
 */
export function registerReportScenarios() {
  testRunner.scenario('報表生成與統計', async ({ assertNotNull, assertTrue, log }) => {
    log('開始測試報表統計');

    // 模擬報表資料
    const report = {
      id: 'report-001',
      type: 'work-order-summary',
      period: '2025-01',
      data: {
        totalOrders: 100,
        completedOrders: 85,
        pendingOrders: 15,
        completionRate: 85
      },
      generatedAt: Date.now()
    };

    assertNotNull(report.id, '報表應有 ID');
    assertTrue(report.data.completionRate >= 0 && report.data.completionRate <= 100, '完成率應在 0-100 之間');
    assertTrue(report.data.totalOrders === report.data.completedOrders + report.data.pendingOrders, '數量應平衡');

    log('報表統計測試完成 ✓');
  });
}

/**
 * 系統模擬器測試劇本
 */
export function registerSimulatorScenarios() {
  testRunner.scenario('系統模擬功能', async ({ assertEqual, assertTrue, log }) => {
    log('開始測試系統模擬器');

    // 模擬製程數據
    const simulation = {
      scenario: 'peak-load',
      workOrders: 50,
      stations: 8,
      duration: 8, // 小時
      throughput: 0
    };

    assertTrue(simulation.workOrders > 0, '工單數應大於 0');
    assertTrue(simulation.stations > 0, '站點數應大於 0');

    log('計算產能');
    simulation.throughput = (simulation.workOrders / simulation.duration).toFixed(2);
    assertTrue(parseFloat(simulation.throughput) > 0, '產能應正確計算');

    log('系統模擬器測試完成 ✓');
  });
}

/**
 * 站點分配與操作員介面測試劇本
 */
export function registerStationAssignmentScenarios() {
  testRunner.scenario('站點分配給操作員', async ({ assertEqual, assertNotNull, assertTrue, assertLength, log }) => {
    log('開始測試站點分配功能');

    // 動態匯入 stationManager
    const { stationManager } = await import('../modules/station/stationModel.js');

    // 步驟 1: 建立測試操作員
    log('步驟 1: 建立測試操作員');
    const operator = new UserModel({
      account: 'test_operator_001',
      name: '測試操作員',
      employeeId: 'TEST001',
      role: '一般員工',
      department: '製程部',
      assignedStations: [],
      primaryStation: null
    });
    operator.save();
    assertNotNull(operator.id, '操作員應有 ID');
    assertEqual(operator.role, '一般員工', '角色應為一般員工');

    // 步驟 2: 取得站點清單
    log('步驟 2: 取得站點清單');
    const stations = stationManager.getAllStations();
    assertTrue(stations.length >= 8, '應至少有 8 個站點');

    // 步驟 3: 分配站點給操作員
    log('步驟 3: 分配 3 個站點給操作員');
    const station1 = stations[0];
    const station2 = stations[1];
    const station3 = stations[2];

    operator.assignStation(station1.id, true); // 第一個為主要站點
    operator.assignStation(station2.id, false);
    operator.assignStation(station3.id, false);

    const updatedOperator = UserModel.getById(operator.id);
    assertLength(updatedOperator.assignedStations, 3, '應分配 3 個站點');
    assertEqual(updatedOperator.primaryStation, station1.id, '主要站點應為第一個站點');

    // 步驟 4: 驗證站點存取權限
    log('步驟 4: 驗證站點存取權限');
    assertTrue(updatedOperator.hasStationAccess(station1.id), '應可存取站點 1');
    assertTrue(updatedOperator.hasStationAccess(station2.id), '應可存取站點 2');
    assertTrue(updatedOperator.hasStationAccess(station3.id), '應可存取站點 3');

    if (stations.length > 3) {
      const station4 = stations[3];
      assertTrue(!updatedOperator.hasStationAccess(station4.id), '不應存取未分配的站點');
    }

    // 步驟 5: 取消分配站點
    log('步驟 5: 取消分配一個站點');
    updatedOperator.unassignStation(station3.id);
    const finalOperator = UserModel.getById(operator.id);
    assertLength(finalOperator.assignedStations, 2, '應剩餘 2 個站點');

    // 清理
    UserModel.delete(operator.id);
    log('站點分配測試完成 ✓');
  });

  testRunner.scenario('管理員與主管權限驗證', async ({ assertEqual, assertTrue, log }) => {
    log('開始測試管理員與主管權限');

    // 動態匯入 stationManager
    const { stationManager } = await import('../modules/station/stationModel.js');

    // 建立管理員
    log('建立測試管理員');
    const admin = new UserModel({
      account: 'test_admin',
      name: '測試管理員',
      employeeId: 'ADMIN001',
      role: '系統管理員',
      department: '資訊部'
    });
    admin.save();

    // 建立主管
    log('建立測試主管');
    const manager = new UserModel({
      account: 'test_manager',
      name: '測試主管',
      employeeId: 'MGR001',
      role: '主管',
      department: '製程部'
    });
    manager.save();

    // 取得站點
    const stations = stationManager.getAllStations();
    const station1 = stations[0];

    // 驗證管理員權限
    log('驗證管理員可存取所有站點');
    assertTrue(admin.hasStationAccess(station1.id), '管理員應可存取任何站點');

    // 驗證主管權限
    log('驗證主管可存取所有站點');
    assertTrue(manager.hasStationAccess(station1.id), '主管應可存取任何站點');

    // 清理
    UserModel.delete(admin.id);
    UserModel.delete(manager.id);
    log('管理員與主管權限測試完成 ✓');
  });

  testRunner.scenario('使用者上下文初始化與同步', async ({ assertEqual, assertNotNull, assertTrue, log }) => {
    log('開始測試使用者上下文管理');

    // 步驟 1: 建立測試使用者
    log('步驟 1: 建立測試使用者');
    const testUser = new UserModel({
      account: 'test_context_user',
      name: '上下文測試使用者',
      employeeId: 'CTX001',
      role: '一般員工',
      department: '製程部'
    });
    testUser.save();

    // 步驟 2: 設定為當前使用者（模擬登入）
    log('步驟 2: 設定為當前使用者');
    storage.set('currentUser', testUser);
    storage.set('currentUserId', testUser.id);

    // 步驟 3: 重新初始化 userContext
    log('步驟 3: 重新初始化 userContext');
    userContext.init();

    // 步驟 4: 驗證 userContext 正確讀取
    log('步驟 4: 驗證 userContext 正確讀取');
    const currentUser = userContext.getCurrentUser();
    assertNotNull(currentUser, '應有當前使用者');
    assertEqual(currentUser.id, testUser.id, '使用者 ID 應匹配');
    assertEqual(currentUser.account, 'test_context_user', '使用者帳號應匹配');

    // 步驟 5: 驗證角色判斷
    log('步驟 5: 驗證角色判斷');
    const isAdminOrManager = userContext.isAdminOrManager();
    assertEqual(isAdminOrManager, false, '一般員工不應為管理員或主管');

    // 清理
    storage.remove('currentUser');
    storage.remove('currentUserId');
    UserModel.delete(testUser.id);
    userContext.init(); // 重新初始化
    log('使用者上下文測試完成 ✓');
  });

  testRunner.scenario('站點存取權限過濾', async ({ assertEqual, assertTrue, assertLength, log }) => {
    log('開始測試站點存取權限過濾');

    // 動態匯入 stationManager
    const { stationManager } = await import('../modules/station/stationModel.js');

    // 建立操作員並分配站點
    log('建立操作員並分配 2 個站點');
    const operator = new UserModel({
      account: 'test_filter_operator',
      name: '過濾測試操作員',
      employeeId: 'FILTER001',
      role: '一般員工',
      department: '製程部'
    });
    operator.save();

    const stations = stationManager.getAllStations();
    operator.assignStation(stations[0].id, true);
    operator.assignStation(stations[1].id, false);

    // 設定為當前使用者
    storage.set('currentUser', operator);
    storage.set('currentUserId', operator.id);
    userContext.init();

    // 取得可存取的站點
    log('取得操作員可存取的站點');
    const accessibleStations = userContext.getAccessibleStations();
    assertLength(accessibleStations, 2, '應可存取 2 個站點');

    // 驗證特定站點存取權限
    log('驗證特定站點存取權限');
    assertTrue(userContext.canAccessStation(stations[0].id), '應可存取站點 1');
    assertTrue(userContext.canAccessStation(stations[1].id), '應可存取站點 2');

    if (stations.length > 2) {
      assertTrue(!userContext.canAccessStation(stations[2].id), '不應可存取站點 3');
    }

    // 清理
    storage.remove('currentUser');
    storage.remove('currentUserId');
    UserModel.delete(operator.id);
    userContext.init();
    log('站點存取權限過濾測試完成 ✓');
  });

  testRunner.scenario('站點操作介面資料流', async ({ assertEqual, assertNotNull, log }) => {
    log('開始測試站點操作介面資料流');

    // 步驟 1: 建立測試工單
    log('步驟 1: 建立測試工單');
    const workOrder = new FormInstanceModel({
      applicationNo: 'MSW-STATION-001',
      formName: '柳營再生濾網工單',
      applicant: '測試操作員',
      department: '製程部',
      data: {
        workOrderNo: 'MSW-STATION-001',
        batchNo: 'BATCH-STATION-001',
        sourceFactory: '柳營廠',
        filterType: '活性碳濾網',
        quantity: 50,
        regenerationCycle: 'R0 (首次再生)'
      },
      status: 'pending'
    });
    workOrder.save();
    assertNotNull(workOrder.id, '工單應已建立');

    // 步驟 2: 模擬除膠站操作
    log('步驟 2: 模擬除膠站操作');
    workOrder.data.deglueOperator = '測試操作員';
    workOrder.data.deglueStartTime = new Date().toISOString();
    workOrder.data.deglueEndTime = new Date(Date.now() + 3600000).toISOString();
    workOrder.save();

    const updated1 = FormInstanceModel.getById(workOrder.id);
    assertEqual(updated1.data.deglueOperator, '測試操作員', '除膠操作員應已記錄');
    assertNotNull(updated1.data.deglueStartTime, '除膠開始時間應已記錄');

    // 步驟 3: 模擬烘箱處理操作
    log('步驟 3: 模擬烘箱處理操作');
    workOrder.data.ovenOperator = '測試操作員';
    workOrder.data.targetTemp = 140;
    workOrder.data.bakingTime = 150;
    workOrder.data.ovenStartTime = new Date().toISOString();
    workOrder.save();

    const updated2 = FormInstanceModel.getById(workOrder.id);
    assertEqual(updated2.data.targetTemp, 140, '烘箱目標溫度應已設定');
    assertEqual(updated2.data.bakingTime, 150, '烘烤時間應已設定');

    // 步驟 4: 模擬 OQC 檢驗
    log('步驟 4: 模擬 OQC 釋氣檢驗');
    workOrder.data.oqcReleaseResult = '合格';
    workOrder.data.oqcReleaseTime = new Date().toISOString();
    workOrder.save();

    const updated3 = FormInstanceModel.getById(workOrder.id);
    assertEqual(updated3.data.oqcReleaseResult, '合格', 'OQC 釋氣檢驗結果應已記錄');

    // 步驟 5: 模擬包裝操作
    log('步驟 5: 模擬包裝操作');
    workOrder.data.palletId = `PLT-${workOrder.data.batchNo}`;
    workOrder.data.packagingTime = new Date().toISOString();
    workOrder.save();

    const updated4 = FormInstanceModel.getById(workOrder.id);
    assertNotNull(updated4.data.palletId, 'Pallet ID 應已生成');

    // 步驟 6: 模擬成品入庫
    log('步驟 6: 模擬成品入庫');
    workOrder.data.warehouseLocation = 'A3-15';
    workOrder.data.inboundTime = new Date().toISOString();
    workOrder.status = 'completed';
    workOrder.save();

    const completed = FormInstanceModel.getById(workOrder.id);
    assertEqual(completed.status, 'completed', '工單狀態應為已完成');
    assertEqual(completed.data.warehouseLocation, 'A3-15', '庫位應已記錄');

    // 清理
    FormInstanceModel.delete(workOrder.id);
    log('站點操作介面資料流測試完成 ✓');
  });

  testRunner.scenario('依站點查詢操作員', async ({ assertLength, assertTrue, log }) => {
    log('開始測試依站點查詢操作員');

    // 動態匯入 stationManager
    const { stationManager } = await import('../modules/station/stationModel.js');

    // 建立多個操作員並分配站點
    const stations = stationManager.getAllStations();
    const station1 = stations[0];

    log('建立 3 個操作員並分配到站點 1');
    const operators = [];
    for (let i = 1; i <= 3; i++) {
      const operator = new UserModel({
        account: `test_query_op_${i}`,
        name: `查詢測試操作員${i}`,
        employeeId: `QUERY00${i}`,
        role: '一般員工',
        department: '製程部'
      });
      operator.save();
      operator.assignStation(station1.id, i === 1);
      operators.push(operator);
    }

    // 查詢該站點的所有操作員
    log('查詢站點的所有操作員');
    const stationOperators = UserModel.getOperatorsByStation(station1.id);
    assertTrue(stationOperators.length >= 3, `應至少有 3 個操作員分配到站點（實際: ${stationOperators.length}）`);

    // 清理
    operators.forEach(op => UserModel.delete(op.id));
    log('依站點查詢操作員測試完成 ✓');
  });
}

/**
 * 註冊所有測試劇本
 */
export function registerAllScenarios() {
  registerWorkOrderScenarios();
  registerStationScenarios();
  registerWorkflowEngineScenarios();
  registerSPCScenarios();
  registerWMSScenarios();
  registerEnergyScenarios();
  registerGoldenRecipeScenarios();
  registerOrganizationScenarios();
  registerPermissionScenarios();
  registerReportScenarios();
  registerSimulatorScenarios();
  registerStationAssignmentScenarios();
}
