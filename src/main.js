import { Layout } from './components/common/Layout.js';
import { router } from './utils/router.js';
import { authService } from './utils/authService.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/Dashboard.js';
import { FormsPage } from './pages/FormsPage.js';
import { RecipeBuilderPage } from './pages/RecipeBuilderPage.js';
import { ApplyPage } from './pages/ApplyPage.js';
import { ApprovalPage } from './pages/ApprovalPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { DepartmentsPage } from './pages/DepartmentsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { LogsPage } from './pages/LogsPage.js';
import { GoldenRecipePage } from './pages/GoldenRecipePage.js';
import { SPCPage } from './pages/SPCPage.js';
import { TestPage } from './pages/TestPage.js';
import { SimulatorPage } from './pages/SimulatorPage.js';
import { PermissionsPage } from './pages/PermissionsPage.js';
import { WMSPage } from './pages/WMSPage.js';
import { EnergyPage } from './pages/EnergyPage.js';
import { StationPage } from './pages/StationPage.js';
import { SystemConfigPage } from './pages/SystemConfigPage.js';
import { StationWorkPage } from './pages/StationWorkPage.js';
import { ChangeRequestsPage } from './pages/ChangeRequestsPage.js';
import { DispatchPage } from './pages/DispatchPage.js';
import { OperatorWorkListPage } from './pages/OperatorWorkListPage.js';
import { userContext } from './utils/userContext.js';

// 初始化應用程式
class App {
  constructor() {
    this.layout = new Layout();
    this.init();
  }

  init() {
    // 檢查登入狀態
    if (!authService.isAuthenticated()) {
      // 未登入，顯示登入頁面
      const app = document.getElementById('app');
      const loginPage = new LoginPage();
      app.appendChild(loginPage.render());
      return;
    }

    // 檢查用戶角色，一般員工顯示工單列表或站點作業頁面
    const currentUser = userContext.getCurrentUser();
    if (currentUser && currentUser.role === '一般員工') {
      const assignedStations = userContext.getAssignedStations();
      if (assignedStations.length > 0) {
        const app = document.getElementById('app');

        // 檢查是否有工單號參數
        const urlParams = new URLSearchParams(window.location.search);
        const workOrderNo = urlParams.get('workOrderNo');

        if (workOrderNo) {
          // 有工單號，進入站點作業頁面
          const stationWorkPage = StationWorkPage();
          app.appendChild(stationWorkPage);
        } else {
          // 無工單號，顯示工單列表
          const workListPage = OperatorWorkListPage();
          app.appendChild(workListPage);
        }
        return;
      }
    }

    // 已登入，渲染 Layout（管理員/主管使用完整後台）
    const app = document.getElementById('app');
    app.appendChild(this.layout.render());

    // 設定 Layout 給路由使用
    router.setLayout(this.layout);

    // 註冊路由
    this.registerRoutes();

    // 初始化路由
    router.init();
  }

  registerRoutes() {
    // 首頁 / 儀表板
    router.addRoute('/', () => DashboardPage());

    // 表單管理
    router.addRoute('/forms', () => FormsPage());

    // 配方建置器（新版，整合產業模組）
    router.addRoute('/forms/builder', async () => await RecipeBuilderPage());

    // 發起申請
    router.addRoute('/apply', () => ApplyPage());

    // 簽核中心
    router.addRoute('/approval', () => ApprovalPage());

    // 人員管理
    router.addRoute('/users', () => UsersPage());

    // 部門管理
    router.addRoute('/departments', () => DepartmentsPage());

    // 報表統計
    router.addRoute('/reports', () => {
      const page = new ReportsPage();
      return page.render();
    });

    // 操作日誌
    router.addRoute('/logs', () => LogsPage());

    // Golden Recipe 管理
    router.addRoute('/golden', () => GoldenRecipePage());

    // SPC 統計製程管制
    router.addRoute('/spc', () => SPCPage());

    // 測試中心
    router.addRoute('/test', () => {
      const page = new TestPage();
      return page.render();
    });

    // 模擬中心
    router.addRoute('/simulator', () => {
      const page = new SimulatorPage();
      return page.render();
    });

    // 權限管理
    router.addRoute('/permissions', () => {
      const page = new PermissionsPage();
      page.addStyles();
      return page.render();
    });

    // WMS 倉儲管理
    router.addRoute('/wms', () => WMSPage());

    // 能源管理
    router.addRoute('/energy', () => EnergyPage());

    // 製程站點管理
    router.addRoute('/stations', () => StationPage());

    // 系統設定
    router.addRoute('/system-config', () => SystemConfigPage());

    // 工單異動審核
    router.addRoute('/change-requests', () => ChangeRequestsPage());

    // 生管派工選單
    router.addRoute('/dispatch', () => DispatchPage());
  }
}

// 啟動應用程式
new App();
