/**
 * 資料模擬器
 * 生成各種模擬資料用於測試和展示
 */

import { FormModel, WorkflowModel, FormInstanceModel, UserModel, DepartmentModel, generateApplicationNo } from './dataModel.js';
import { SPCModel } from './spcModel.js';
import { QualityFeedbackModel } from './goldenRecipeModel.js';
import { storage } from './storage.js';
import { WorkOrderNumberGenerator } from './workOrderNumberGenerator.js';

export class DataSimulator {
  constructor() {
    this.generatedData = {
      forms: [],
      workflows: [],
      instances: [],
      users: [],
      departments: [],
      spcData: [],
      goldenRecipes: []
    };
  }

  /**
   * 生成隨機日文動漫角色或明星歌手名字（帶登入帳號）
   */
  generateChineseName() {
    const nameData = [
      // 經典動漫角色
      { name: '桐谷和人', account: 'kirito' },
      { name: '結城明日奈', account: 'asuna' },
      { name: '碇真嗣', account: 'shinji' },
      { name: '綾波零', account: 'rei' },
      { name: '惣流明日香', account: 'asuka' },
      { name: '江戸川柯南', account: 'conan' },
      { name: '工藤新一', account: 'shinichi' },
      { name: '毛利蘭', account: 'ran' },
      { name: '灰原哀', account: 'ai' },
      { name: '怪盗基德', account: 'kid' },
      { name: '漩渦鳴人', account: 'naruto' },
      { name: '宇智波佐助', account: 'sasuke' },
      { name: '春野櫻', account: 'sakura' },
      { name: '旗木卡卡西', account: 'kakashi' },
      { name: '波風水門', account: 'minato' },
      { name: '草薙素子', account: 'motoko' },
      { name: '巴特', account: 'batou' },
      { name: '荒卷大輔', account: 'aramaki' },
      { name: '衛宮切嗣', account: 'kiritsugu' },
      { name: '遠坂凛', account: 'rin' },
      { name: '坂田銀時', account: 'gintoki' },
      { name: '神樂', account: 'kagura' },
      { name: '志村新八', account: 'shinpachi' },
      { name: '土方十四郎', account: 'hijikata' },
      { name: '沖田總悟', account: 'okita' },
      { name: '夜神月', account: 'light' },
      { name: 'L', account: 'l' },
      { name: '彌海砂', account: 'misa' },
      { name: '流川楓', account: 'rukawa' },
      { name: '櫻木花道', account: 'hanamichi' },
      { name: '兩津勘吉', account: 'ryotsu' },
      { name: '秋本麗子', account: 'reiko' },
      { name: '中川圭一', account: 'nakagawa' },
      { name: '大原大次郎', account: 'ohara' },
      { name: '本田速人', account: 'honda' },
      { name: '孫悟空', account: 'goku' },
      { name: '貝吉塔', account: 'vegeta' },
      { name: '比克', account: 'piccolo' },
      { name: '克林', account: 'krillin' },
      { name: '特南克斯', account: 'trunks' },
      { name: '猿飛日斬', account: 'hiruzen' },
      { name: '大蛇丸', account: 'orochimaru' },
      { name: '自來也', account: 'jiraiya' },
      { name: '綱手', account: 'tsunade' },
      { name: '我愛羅', account: 'gaara' },
      // 日本明星歌手
      { name: '木村拓哉', account: 'kimutaku' },
      { name: '山下智久', account: 'yamapi' },
      { name: '福山雅治', account: 'fukuyama' },
      { name: '生田斗真', account: 'ikuta' },
      { name: '小栗旬', account: 'oguri' },
      { name: '新垣結衣', account: 'gakky' },
      { name: '石原聰美', account: 'ishihara' },
      { name: '長澤雅美', account: 'masami' },
      { name: '綾瀨遙', account: 'ayase' },
      { name: '北川景子', account: 'keiko' },
      { name: '米津玄師', account: 'yonezu' },
      { name: 'YOASOBI', account: 'yoasobi' },
      { name: 'Ado', account: 'ado' },
      { name: '宇多田光', account: 'utada' },
      { name: '濱崎步', account: 'ayumi' },
      { name: '安室奈美惠', account: 'namie' },
      { name: '西野加奈', account: 'kana' },
      { name: 'LiSA', account: 'lisa' },
      { name: 'RADWIMPS', account: 'radwimps' },
      { name: 'ONE OK ROCK', account: 'oneokrock' },
      { name: '嵐', account: 'arashi' },
      { name: '關8', account: 'kanjani8' },
      { name: 'KinKi Kids', account: 'kinkikids' },
      { name: 'V6', account: 'v6' },
      { name: 'SMAP', account: 'smap' },
      { name: '松田聖子', account: 'seiko' },
      { name: '中森明菜', account: 'akina' },
      { name: '松任谷由實', account: 'yuming' },
      { name: '椎名林檎', account: 'ringo' },
      { name: '平井堅', account: 'hirai' },
      { name: '三浦春馬', account: 'haruma' },
      { name: '竹內結子', account: 'yuko' },
      { name: '菅田將暉', account: 'suda' },
      { name: '橋本環奈', account: 'kanna' },
      { name: '廣瀨鈴', account: 'suzu' },
      { name: '佐藤健', account: 'takeru' },
      { name: '神木隆之介', account: 'kamiki' },
      { name: '吉澤亮', account: 'yoshizawa' },
      { name: '橫濱流星', account: 'ryusei' },
      { name: '中川大志', account: 'taishi' }
    ];

    return nameData[Math.floor(Math.random() * nameData.length)];
  }

  /**
   * 生成部門資料
   */
  generateDepartments(count = 8) {
    const departments = [
      { name: '研發部', description: '產品研發與技術創新' },
      { name: '製造部', description: '生產製造與品質管理' },
      { name: '品保部', description: '品質保證與檢驗' },
      { name: '業務部', description: '銷售與客戶服務' },
      { name: '採購部', description: '原物料採購管理' },
      { name: '財務部', description: '財務會計與預算控制' },
      { name: '人資部', description: '人力資源管理' },
      { name: 'IT部', description: '資訊系統管理' }
    ];

    const saved = [];
    for (let i = 0; i < Math.min(count, departments.length); i++) {
      const dept = new DepartmentModel(departments[i]);
      dept.save();
      saved.push(dept);
      this.generatedData.departments.push(dept);
    }

    return saved;
  }

  /**
   * 生成使用者資料
   */
  async generateUsers(count = 20) {
    const departments = DepartmentModel.getAll();
    if (departments.length === 0) {
      this.generateDepartments();
    }

    const roles = ['一般員工', '主管', '系統管理員'];
    const saved = [];

    // 職位基礎名稱（對應不同角色）
    const positionBaseByRole = {
      '系統管理員': '系統管理員',
      '主管': '主管',
      '一般員工': '員工'
    };

    // 追蹤已使用的帳號，避免重複
    const usedAccounts = new Set();

    // 追蹤每個角色的職位編號
    const positionCounters = {
      '系統管理員': 1,
      '主管': 1,
      '一般員工': 1
    };

    for (let i = 0; i < count; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const role = i < 2 ? '系統管理員' : (i < count * 0.3 ? '主管' : '一般員工');

      // 根據角色生成流水號職位
      const positionBase = positionBaseByRole[role];
      const position = `${positionBase}${String(positionCounters[role]).padStart(2, '0')}`;
      positionCounters[role]++;

      // 生成名字和帳號
      let nameData;
      let account;

      // 避免帳號重複
      do {
        nameData = this.generateChineseName();
        account = nameData.account;
        // 如果帳號已被使用，加上數字後綴
        if (usedAccounts.has(account)) {
          account = `${account}${i + 1}`;
        }
      } while (usedAccounts.has(account));

      usedAccounts.add(account);

      const user = new UserModel({
        account: account,
        name: nameData.name,
        employeeId: `EMP${String(i + 1).padStart(4, '0')}`,
        department: dept.name,
        position: position,
        role: role,
        email: `${account}@company.com`,
        phone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        status: '在職'
      });

      user.save();
      saved.push(user);
      this.generatedData.users.push(user);
    }

    // 為一般員工分配站點
    await this.assignStationsToOperators(saved);

    return saved;
  }

  /**
   * 為一般員工分配站點
   * 確保每個站點至少有一位操作員，然後隨機分配剩餘操作員
   */
  async assignStationsToOperators(users) {
    try {
      const { stationManager } = await import('../modules/station/stationModel.js');
      const stations = stationManager.getAllStations();

      if (stations.length === 0) {
        console.log('⚠ 無可用站點，跳過站點分配');
        return;
      }

      const operators = users.filter(u => u.role === '一般員工');

      if (operators.length === 0) {
        console.log('⚠ 無可用操作員，跳過站點分配');
        return;
      }

      // 追蹤每個站點分配的操作員數量
      const stationAssignmentCount = new Map();
      stations.forEach(s => stationAssignmentCount.set(s.id, 0));

      // 第一輪：確保每個站點至少有一位操作員
      stations.forEach((station, index) => {
        const operator = operators[index % operators.length];

        if (!operator.assignedStations) {
          operator.assignedStations = [];
        }

        // 如果這是該操作員的第一個站點，設為主要站點
        if (operator.assignedStations.length === 0) {
          operator.assignedStations.push(station.id);
          operator.primaryStation = station.id;
        } else if (!operator.assignedStations.includes(station.id)) {
          operator.assignedStations.push(station.id);
        }

        stationAssignmentCount.set(station.id, stationAssignmentCount.get(station.id) + 1);
        operator.save();
      });

      // 第二輪：為操作員隨機分配額外站點（最多 3 個站點）
      operators.forEach(operator => {
        const currentStationCount = operator.assignedStations.length;

        // 隨機決定是否要分配更多站點（最多 3 個）
        if (currentStationCount < 3 && Math.random() > 0.5) {
          const additionalCount = Math.min(
            Math.floor(Math.random() * (3 - currentStationCount)) + 1,
            3 - currentStationCount
          );

          // 隨機選擇還未分配給該操作員的站點
          const availableStations = stations.filter(
            s => !operator.assignedStations.includes(s.id)
          );

          const shuffled = [...availableStations].sort(() => Math.random() - 0.5);

          for (let i = 0; i < Math.min(additionalCount, shuffled.length); i++) {
            operator.assignedStations.push(shuffled[i].id);
            stationAssignmentCount.set(
              shuffled[i].id,
              stationAssignmentCount.get(shuffled[i].id) + 1
            );
          }

          operator.save();
        }
      });

      // 統計報告
      console.log(`✓ 為 ${operators.length} 位作業員分配站點`);
      console.log('📊 站點分配統計：');
      stations.forEach(station => {
        const count = stationAssignmentCount.get(station.id);
        console.log(`  - ${station.name}: ${count} 位操作員`);
      });
    } catch (error) {
      console.warn('分配站點失敗:', error.message);
    }
  }

  /**
   * 生成配方資料
   */
  generateForms(count = 10) {
    const filterTypes = ['活性碳濾網', '化學濾網', '複合濾網', '高效濾網'];
    const chemicals = ['活性氧化鋁', '矽膠', '分子篩', '氧化鋅', '氫氧化鈉'];
    const carbonTypes = ['椰殼活性碳', '煤質活性碳', '木質活性碳'];

    const saved = [];
    const year = new Date().getFullYear();

    for (let i = 0; i < count; i++) {
      const filterType = filterTypes[Math.floor(Math.random() * filterTypes.length)];
      const recipeNo = `AMC-${year}-${String(i + 1).padStart(3, '0')}`;
      const version = '1.0';

      const form = new FormModel({
        name: `${filterType}-${String(i + 1).padStart(3, '0')}`,
        description: `${filterType}生產配方`,
        industry: 'amc-filter',
        fields: [
          { id: 'recipeNo', name: 'recipeNo', type: 'text', label: '配方編號', value: recipeNo, required: true },
          { id: 'version', name: 'version', type: 'text', label: '配方版本', value: version, required: true },
          { id: 'productName', name: 'productName', type: 'text', label: '產品名稱', value: filterType, required: true }
        ]
      });

      form.save(`生成模擬配方 ${i + 1}`);
      saved.push(form);
      this.generatedData.forms.push(form);
    }

    return saved;
  }

  /**
   * 生成工作流程資料
   */
  async generateWorkflows(count = 5) {
    const forms = FormModel.getAll();
    let users = UserModel.getAll();

    if (forms.length === 0) {
      this.generateForms(5);
    }
    if (users.length === 0) {
      users = await this.generateUsers(10);
    }

    const managers = users.filter(u => u.role === '主管');
    const saved = [];

    for (let i = 0; i < Math.min(count, forms.length); i++) {
      const form = forms[i];
      const approvers = managers.slice(0, 2).map(m => m.id);

      const workflow = new WorkflowModel({
        name: `${form.name} 審核流程`,
        formId: form.id,
        nodes: [
          { id: 'start', type: 'start', label: '開始', x: 100, y: 100 },
          { id: 'mgr1', type: 'single', label: '部門主管', approvers: [approvers[0]], x: 300, y: 100 },
          { id: 'mgr2', type: 'single', label: '品保主管', approvers: [approvers[1] || approvers[0]], x: 500, y: 100 },
          { id: 'end', type: 'end', label: '結束', x: 700, y: 100 }
        ],
        connections: [
          { from: 'start', to: 'mgr1', fromPoint: 'out', toPoint: 'in' },
          { from: 'mgr1', to: 'mgr2', fromPoint: 'out', toPoint: 'in' },
          { from: 'mgr2', to: 'end', fromPoint: 'out', toPoint: 'in' }
        ]
      });

      workflow.save();
      saved.push(workflow);
      this.generatedData.workflows.push(workflow);
    }

    return saved;
  }

  /**
   * 生成申請單資料（柳營再生濾網工單）
   */
  async generateInstances(count = 20) {
    let users = UserModel.getAll();
    if (users.length === 0) {
      users = await this.generateUsers(10);
    }

    const saved = [];
    const year = new Date().getFullYear();

    // 柳營再生濾網資料
    const sourceFactories = ['柳營廠', '台南廠', '高雄廠', '桃園廠'];
    const filterTypes = ['活性碳濾網', '化學濾網', '複合濾網', '高效濾網'];
    const regenerationCycles = ['R0 (首次再生)', 'R1 (第二次)', 'R2 (第三次)', 'R3 (第四次)'];
    const ovenIds = ['烘箱-01', '烘箱-02', '烘箱-03', '烘箱-04'];
    const degassingResults = ['合格', '未達標(加抽2片)', '待檢驗'];
    const aoiResults = ['OK', 'NG-污染', 'NG-瑕疵', 'NG-破損'];
    const rfidStatus = ['已更換', '待更換', '異常'];
    const qualityGrades = ['A (優良)', 'B (良好)', 'C (合格)', 'D (不合格)'];
    const statuses = ['pending', 'in_progress', 'completed', 'approved'];

    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const workOrderNo = WorkOrderNumberGenerator.generate();
      const batchNo = `BATCH-${String(i + 1).padStart(4, '0')}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // 生成時間戳
      const createdTime = Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
      const deglueStart = new Date(createdTime + 3600000).toISOString().slice(0, 16);
      const deglueEnd = new Date(createdTime + 7200000).toISOString().slice(0, 16);
      const ovenStart = new Date(createdTime + 7200000).toISOString().slice(0, 16);
      const ovenEnd = new Date(createdTime + 18000000).toISOString().slice(0, 16);
      const inspectionTime = new Date(createdTime + 19000000).toISOString().slice(0, 16);
      const packageTime = new Date(createdTime + 20000000).toISOString().slice(0, 16);

      const data = {
        // 基本資訊
        workOrderNo: workOrderNo,
        batchNo: batchNo,
        sourceFactory: sourceFactories[Math.floor(Math.random() * sourceFactories.length)],
        filterType: filterTypes[Math.floor(Math.random() * filterTypes.length)],
        quantity: 18 + Math.floor(Math.random() * 31), // 18-48 片（符合 Pallet 容量）
        regenerationCycle: regenerationCycles[Math.floor(Math.random() * regenerationCycles.length)],

        // 除膠站點
        deglueOperator: this.generateChineseName().name,
        deglueStartTime: deglueStart,
        deglueEndTime: status !== 'pending' ? deglueEnd : '',

        // 烘箱處理
        ovenId: ovenIds[Math.floor(Math.random() * ovenIds.length)],
        targetTemp: 140 + Math.floor(Math.random() * 30),
        bakingTime: 150 + Math.floor(Math.random() * 100),
        ovenStartTime: status !== 'pending' ? ovenStart : '',
        ovenEndTime: status === 'completed' || status === 'approved' ? ovenEnd : '',

        // OQC 檢驗
        degassingTest: status === 'completed' || status === 'approved' ?
          degassingResults[Math.floor(Math.random() * degassingResults.length)] : '待檢驗',
        aoiResult: status === 'completed' || status === 'approved' ?
          aoiResults[Math.floor(Math.random() * aoiResults.length)] : '待檢驗',
        inspectionOperator: status === 'completed' || status === 'approved' ?
          this.generateChineseName().name : '',
        inspectionTime: status === 'completed' || status === 'approved' ? inspectionTime : '',

        // RFID 與包裝
        rfidUpdate: status === 'completed' || status === 'approved' ?
          rfidStatus[Math.floor(Math.random() * rfidStatus.length)] : '待更換',
        palletId: status === 'completed' || status === 'approved' ?
          `PLT-${String(i + 1).padStart(4, '0')}` : '',
        packageTime: status === 'completed' || status === 'approved' ? packageTime : '',

        // 倉儲管理
        warehouseLocation: status === 'approved' ? `A${Math.floor(i / 10) + 1}-${String((i % 10) + 1).padStart(2, '0')}` : '',
        inboundTime: status === 'approved' ? new Date(createdTime + 21000000).toISOString().slice(0, 16) : '',
        outboundTime: '',
        customerOrderNo: '',

        // 能源數據
        ovenEnergyConsumption: status !== 'pending' ? (80 + Math.random() * 40).toFixed(2) : '',
        totalEnergyCost: status !== 'pending' ? (400 + Math.random() * 200).toFixed(2) : '',
        mauFfuEnergy: status !== 'pending' ? (30 + Math.random() * 20).toFixed(2) : '',

        // 品質標準
        filterEfficiency: status === 'completed' || status === 'approved' ?
          (92 + Math.random() * 6).toFixed(1) : '',
        expectedLifespan: status === 'completed' || status === 'approved' ?
          (6 + Math.floor(Math.random() * 12)) : '',
        qualityGrade: status === 'completed' || status === 'approved' ?
          qualityGrades[Math.floor(Math.random() * qualityGrades.length)] : '',
        remarks: ''
      };

      const instance = new FormInstanceModel({
        applicationNo: workOrderNo,
        formName: '柳營再生濾網工單',
        applicant: user.name,
        department: user.department || '製程部',
        data: data,
        status: status
      });

      instance.createdAt = createdTime;
      instance.save();

      saved.push(instance);
      this.generatedData.instances.push(instance);
    }

    return saved;
  }

  /**
   * 生成 SPC 數據
   */
  generateSPCData(recipeId, dataPoints = 50) {
    const saved = [];
    const baseValue = 100;
    const stdDev = 2;

    for (let i = 0; i < dataPoints; i++) {
      // 生成正態分佈數據
      const value = baseValue + (Math.random() - 0.5) * 2 * stdDev * 3;
      const thickness = 2.3 + (Math.random() - 0.5) * 0.4;

      const data = SPCModel.create({
        recipeId: recipeId,
        batchNo: `BATCH-${String(i + 1).padStart(4, '0')}`,
        timestamp: new Date(Date.now() - (dataPoints - i) * 3600000).toISOString(), // 每小時一筆
        measurements: {
          weight: parseFloat(value.toFixed(2)),
          thickness: parseFloat(thickness.toFixed(2))
        },
        sampleSize: 5,
        operator: this.generateChineseName().name,
        shift: i % 3 === 0 ? '早班' : (i % 3 === 1 ? '中班' : '晚班'),
        status: 'normal'
      });

      saved.push(data);
      this.generatedData.spcData.push(data);
    }

    // 設定管制限
    const limits = SPCModel.calculateControlLimits(recipeId, 'weight');
    SPCModel.setLimit({
      recipeId: recipeId,
      parameter: 'weight',
      ...limits,
      usl: baseValue + 5,
      lsl: baseValue - 5,
      target: baseValue
    });

    return saved;
  }

  /**
   * 為指定配方生成品質回饋數據（模擬生產過程）
   * @param {string} recipeId - 配方 ID
   * @param {number} batchCount - 批次數量
   * @param {string} quality - 品質等級 ('high' | 'medium' | 'low' | 'mixed')
   */
  generateQualityFeedbackForRecipe(recipeId, batchCount = 15, quality = 'mixed') {
    const startDate = Date.now() - 45 * 24 * 60 * 60 * 1000; // 45天前開始
    const saved = [];

    // 監控空間使用
    const initialInfo = storage.getStorageInfo();
    console.log(`🔍 開始生成品質數據，當前使用: ${initialInfo.totalMB}MB (${initialInfo.usagePercent}%)`);

    for (let j = 0; j < batchCount; j++) {
      // 每 5 筆檢查一次空間
      if (j % 5 === 0 && j > 0) {
        const info = storage.getStorageInfo();
        console.log(`  批次 ${j}/${batchCount}，使用: ${info.totalMB}MB (${info.usagePercent}%)`);
      }
      let qualityMetrics;

      // 根據品質等級生成不同範圍的數據
      if (quality === 'superhigh') {
        // 超高品質：自動認證 Golden Recipe（分數≥95）
        // 評分公式: 良率30% + 效率25% + 壽命率20% + CPK×10×15% + 穩定性10%
        qualityMetrics = {
          yieldRate: 99 + Math.random() * 0.8,          // 99-99.8% (30%)
          defectRate: Math.random() * 0.3,              // 0-0.3%
          filterEfficiency: 99.2 + Math.random() * 0.7, // 99.2-99.9% (25%)
          lifespan: 32 + Math.random() * 6,             // 32-38月 (20%) - 達標率133-158%
          cpk: 1.8 + Math.random() * 0.4,               // 1.8-2.2 (15%)
          stabilityScore: 97 + Math.random() * 2.5      // 97-99.5 (10%)
        };
      } else if (quality === 'high') {
        // 高品質：Golden Recipe 候選（分數 85-91，接近但未達自動認證標準）
        qualityMetrics = {
          yieldRate: 96 + Math.random() * 2,            // 96-98% (30%)
          defectRate: 0.5 + Math.random() * 1,          // 0.5-1.5%
          filterEfficiency: 97 + Math.random() * 2,     // 97-99% (25%)
          lifespan: 22 + Math.random() * 6,             // 22-28月 (20%) - 達標率92-117%
          cpk: 1.4 + Math.random() * 0.3,               // 1.4-1.7 (15%)
          stabilityScore: 90 + Math.random() * 5        // 90-95 (10%)
        };
      } else if (quality === 'medium') {
        // 中等品質：接近但未達 Golden Recipe 標準（分數80-91）
        qualityMetrics = {
          yieldRate: 92 + Math.random() * 4,            // 92-96%
          defectRate: 1 + Math.random() * 2,            // 1-3%
          filterEfficiency: 95 + Math.random() * 3,     // 95-98%
          lifespan: 10 + Math.random() * 4,             // 10-14月
          cpk: 1.2 + Math.random() * 0.3,               // 1.2-1.5
          stabilityScore: 85 + Math.random() * 7        // 85-92
        };
      } else if (quality === 'low') {
        // 低品質：不符合標準（分數<80）
        qualityMetrics = {
          yieldRate: 85 + Math.random() * 7,            // 85-92%
          defectRate: 3 + Math.random() * 4,            // 3-7%
          filterEfficiency: 90 + Math.random() * 5,     // 90-95%
          lifespan: 6 + Math.random() * 4,              // 6-10月
          cpk: 0.8 + Math.random() * 0.4,               // 0.8-1.2
          stabilityScore: 70 + Math.random() * 15       // 70-85
        };
      } else {
        // mixed: 混合品質，模擬實際生產波動
        const rand = Math.random();
        if (rand < 0.3) {
          // 30% 高品質
          qualityMetrics = {
            yieldRate: 96 + Math.random() * 3,
            defectRate: Math.random() * 1,
            filterEfficiency: 98 + Math.random() * 1.5,
            lifespan: 14 + Math.random() * 4,
            cpk: 1.5 + Math.random() * 0.5,
            stabilityScore: 92 + Math.random() * 6
          };
        } else if (rand < 0.7) {
          // 40% 中等品質
          qualityMetrics = {
            yieldRate: 92 + Math.random() * 4,
            defectRate: 1 + Math.random() * 2,
            filterEfficiency: 95 + Math.random() * 3,
            lifespan: 10 + Math.random() * 4,
            cpk: 1.2 + Math.random() * 0.3,
            stabilityScore: 85 + Math.random() * 7
          };
        } else {
          // 30% 低品質
          qualityMetrics = {
            yieldRate: 85 + Math.random() * 7,
            defectRate: 3 + Math.random() * 4,
            filterEfficiency: 90 + Math.random() * 5,
            lifespan: 6 + Math.random() * 4,
            cpk: 0.8 + Math.random() * 0.4,
            stabilityScore: 70 + Math.random() * 15
          };
        }
      }

      const feedback = QualityFeedbackModel.create({
        recipeId: recipeId,
        recipeVersion: '1.0',
        batchNo: `B${j + 1}`,  // 縮短批次號
        qualityMetrics: qualityMetrics,
        testResults: {
          passed: qualityMetrics.yieldRate >= 90,
          testDate: new Date(startDate + j * 2.5 * 24 * 60 * 60 * 1000).toISOString(),
          inspector: 'SYS'  // 縮短檢驗員名稱
        },
        // 移除 productionInfo 以節省空間
        source: 'SIMULATOR'
      });

      saved.push(feedback);
    }

    // 批次生成完成後，統一更新配方統計（只保存一次版本）
    QualityFeedbackModel.updateRecipeQualityStats(recipeId);

    console.log(`✓ 配方 ${recipeId.substring(0, 8)} 生成 ${batchCount} 批次品質回饋數據（品質等級: ${quality}）`);
    return saved;
  }

  /**
   * 為多個配方生成品質數據，模擬實際生產情境
   * 讓系統自然地篩選出 Golden Recipe 候選
   */
  generateProductionQualityData(options = {}) {
    const {
      superhighQualityCount = 1,   // 超高品質配方數量（自動認證為 Golden Recipe）
      highQualityCount = 2,        // 高品質配方數量（Golden Recipe 候選）
      mediumQualityCount = 5,      // 中等品質配方數量
      lowQualityCount = 2,         // 低品質配方數量
      minBatches = 30,             // 最小批次數
      maxBatches = 100             // 最大批次數
    } = options;

    const forms = FormModel.getAll();
    if (forms.length === 0) {
      console.log('⚠ 沒有配方，請先生成配方');
      return { superhigh: [], high: [], medium: [], low: [] };
    }

    const result = { superhigh: [], high: [], medium: [], low: [] };
    let formIndex = 0;
    let totalFeedbacks = 0;

    // 為超高品質配方生成數據（自動認證）
    for (let i = 0; i < superhighQualityCount && formIndex < forms.length; i++, formIndex++) {
      const form = forms[formIndex];
      const batchCount = Math.floor(minBatches + Math.random() * (maxBatches - minBatches + 1));

      // 生成超高品質回饋數據
      this.generateQualityFeedbackForRecipe(form.id, batchCount, 'superhigh');
      result.superhigh.push(form);
      totalFeedbacks += batchCount;
    }

    // 為高品質配方生成數據（候選）
    for (let i = 0; i < highQualityCount && formIndex < forms.length; i++, formIndex++) {
      const form = forms[formIndex];
      const batchCount = Math.floor(minBatches + Math.random() * (maxBatches - minBatches + 1));

      // 生成高品質回饋數據
      this.generateQualityFeedbackForRecipe(form.id, batchCount, 'high');
      result.high.push(form);
      totalFeedbacks += batchCount;
    }

    // 為中等品質配方生成數據
    for (let i = 0; i < mediumQualityCount && formIndex < forms.length; i++, formIndex++) {
      const form = forms[formIndex];
      const batchCount = Math.floor(minBatches + Math.random() * (maxBatches - minBatches + 1));

      // 不生成 SPC 數據
      // this.generateSPCData(form.id, 20);

      this.generateQualityFeedbackForRecipe(form.id, batchCount, 'medium');
      result.medium.push(form);
      totalFeedbacks += batchCount;
    }

    // 為低品質配方生成數據
    for (let i = 0; i < lowQualityCount && formIndex < forms.length; i++, formIndex++) {
      const form = forms[formIndex];
      const batchCount = Math.floor(minBatches + Math.random() * (maxBatches - minBatches + 1));

      // 不生成 SPC 數據
      // this.generateSPCData(form.id, 20);

      this.generateQualityFeedbackForRecipe(form.id, batchCount, 'low');
      result.low.push(form);
      totalFeedbacks += batchCount;
    }

    console.log(`✓ 生產品質數據生成完成：超高品質 ${result.superhigh.length}、高品質 ${result.high.length}、中等 ${result.medium.length}、低品質 ${result.low.length}`);

    return {
      totalFeedbacks: totalFeedbacks,
      superhighQualityRecipes: result.superhigh.length,
      highQualityRecipes: result.high.length,
      mediumQualityRecipes: result.medium.length,
      lowQualityRecipes: result.low.length,
      recipes: result  // 保留原始資料供進階使用
    };
  }

  /**
   * 清除所有模擬資料
   */
  clearAllSimulatedData() {
    // 先檢查 LocalStorage 使用情況
    const storageInfo = storage.getStorageInfo();
    if (storageInfo) {
      console.log(`📊 清理前 LocalStorage 使用: ${storageInfo.totalMB}MB / ${storageInfo.limitMB}MB (${storageInfo.usagePercent}%)`);
    }

    // 清除各類資料
    storage.set('forms', []);
    storage.set('workflows', []);
    storage.set('formInstances', []);
    storage.set('users', []);
    storage.set('departments', []);
    storage.set('approvalHistory', []);
    storage.set('form_versions', []);      // 清除配方版本歷史（重要！）

    // 清除品質回饋數據（直接使用 localStorage，因為 QualityFeedbackModel 不用 storage prefix）
    localStorage.removeItem('quality_feedbacks');

    SPCModel.clearAll();

    // 重置生成記錄
    this.generatedData = {
      forms: [],
      workflows: [],
      instances: [],
      users: [],
      departments: [],
      spcData: [],
      goldenRecipes: []
    };

    // 顯示清理後的使用情況
    const newInfo = storage.getStorageInfo();
    if (newInfo) {
      console.log(`✅ 清理後 LocalStorage 使用: ${newInfo.totalMB}MB / ${newInfo.limitMB}MB (${newInfo.usagePercent}%)`);
    }
  }

  /**
   * 生成完整測試環境
   */
  async generateCompleteEnvironment() {
    console.log('開始生成完整測試環境...');

    this.clearAllSimulatedData();

    // 依序生成資料（減少數量以節省空間）
    const departments = this.generateDepartments(5);  // 8 → 5
    console.log(`✓ 生成 ${departments.length} 個部門`);

    const users = await this.generateUsers(10);  // 20 → 10
    console.log(`✓ 生成 ${users.length} 位使用者`);

    const forms = this.generateForms(4);  // 6 → 4（極限精簡）
    console.log(`✓ 生成 ${forms.length} 個配方`);

    const workflows = await this.generateWorkflows(4);  // 5 → 4
    console.log(`✓ 生成 ${workflows.length} 個工作流程`);

    // 生成柳營再生濾網工單（80個，確保每個站點都有充足工單）
    const instances = await this.generateInstances(80);
    console.log(`✓ 生成 ${instances.length} 個柳營再生濾網工單`);

    // 為配方生成生產品質數據（模擬實際生產）
    // 1個超高品質（自動認證）、2個高品質（候選）、1個低品質配方
    // 每個配方固定 25 批次，剛好滿足自動認證條件
    const qualityData = this.generateProductionQualityData({
      superhighQualityCount: 1, // 1個自動認證
      highQualityCount: 2,      // 2個候選
      mediumQualityCount: 0,    // 不生成中等品質
      lowQualityCount: 1,       // 1個低品質
      minBatches: 25,           // 固定 25 批次
      maxBatches: 25            // 固定 25 批次，不隨機
    });

    // 整合資料：分配工單到製程站點
    const stationsAssigned = await this.assignWorkOrdersToStations();
    console.log(`✓ 分配 ${stationsAssigned} 個工單到製程站點`);

    // 整合資料：生成能源記錄
    const energyRecords = await this.generateEnergyRecords();
    console.log(`✓ 生成 ${energyRecords} 筆能源記錄`);

    // 整合資料：生成 WMS Pallet 資料
    const pallets = await this.generateWMSPallets();
    console.log(`✓ 建立並入庫 ${pallets} 個 Pallet`);

    console.log('✓ 完整測試環境生成完成！');
    console.log(`✓ 配方品質分布：超高 ${qualityData.superhighQualityRecipes}、高 ${qualityData.highQualityRecipes}、中 ${qualityData.mediumQualityRecipes}、低 ${qualityData.lowQualityRecipes}`);
    console.log('💡 提示：請到 Golden Recipe 頁面執行「掃描並評分所有配方」以自動篩選候選配方');

    return {
      departments: departments.length,
      users: users.length,
      forms: forms.length,
      workflows: workflows.length,
      instances: instances.length,
      spcData: 0,    // 不生成 SPC 數據以節省空間
      qualityFeedbacks: qualityData.totalFeedbacks,
      superhighQuality: qualityData.superhighQualityRecipes,
      highQuality: qualityData.highQualityRecipes,
      mediumQuality: qualityData.mediumQualityRecipes,
      lowQuality: qualityData.lowQualityRecipes,
      stationsAssigned: stationsAssigned,
      energyRecords: energyRecords,
      pallets: pallets
    };
  }

  /**
   * 壓力測試：大量資料生成
   */
  async stressTest(config = {}) {
    const {
      forms = 100,
      instances = 500,
      spcDataPerRecipe = 100,
      users = 50
    } = config;

    console.log('開始壓力測試...');
    const startTime = Date.now();
    const results = {
      forms: 0,
      instances: 0,
      spcData: 0,
      users: 0,
      duration: 0,
      errors: []
    };

    try {
      // 生成使用者
      console.log(`生成 ${users} 位使用者...`);
      const userList = await this.generateUsers(users);
      results.users = userList.length;

      // 生成配方
      console.log(`生成 ${forms} 個配方...`);
      const formList = this.generateForms(forms);
      results.forms = formList.length;

      // 生成申請單
      console.log(`生成 ${instances} 個申請單...`);
      const instanceList = await this.generateInstances(instances);
      results.instances = instanceList.length;

      // 為部分配方生成 SPC 數據
      console.log(`為前10個配方生成 SPC 數據...`);
      for (let i = 0; i < Math.min(10, formList.length); i++) {
        const spcData = this.generateSPCData(formList[i].id, spcDataPerRecipe);
        results.spcData += spcData.length;
      }

    } catch (error) {
      results.errors.push(error.message);
      console.error('壓力測試錯誤:', error);
    }

    results.duration = Date.now() - startTime;
    console.log(`壓力測試完成！耗時 ${results.duration}ms`);

    return results;
  }

  /**
   * 分配工單到製程站點
   * 根據工單狀態自動分配到對應的製程站點
   */
  async assignWorkOrdersToStations() {
    const { stationManager } = await import('../modules/station/stationModel.js');
    const workOrders = FormInstanceModel.getAll();

    // 只處理進行中的工單
    const inProgressOrders = workOrders.filter(wo => wo.status === 'in_progress');

    const ovenStations = stationManager.getStationsByType('oven');

    let assigned = 0;
    inProgressOrders.forEach((wo, index) => {
      // 隨機選擇一個烘箱站點
      const station = ovenStations[index % ovenStations.length];
      if (station) {
        try {
          // 分配工單到站點
          station.assignJob(wo.data.workOrderNo, wo.data.quantity);
          assigned++;
        } catch (error) {
          console.warn(`分配工單 ${wo.data.workOrderNo} 失敗:`, error.message);
        }
      }
    });

    stationManager.saveToStorage();
    console.log(`✓ 分配 ${assigned} 個工單到製程站點`);
    return assigned;
  }

  /**
   * 生成能源記錄
   * 根據工單的能源數據生成對應的能源記錄
   */
  async generateEnergyRecords() {
    const { energyManager } = await import('../modules/energy/energyModel.js');
    const workOrders = FormInstanceModel.getAll();

    // 只處理非 pending 狀態的工單（已有能源數據）
    const processedOrders = workOrders.filter(wo =>
      wo.status !== 'pending' && wo.data.ovenEnergyConsumption
    );

    let created = 0;
    processedOrders.forEach(wo => {
      const data = wo.data;

      // 烘箱能耗記錄
      if (data.ovenEnergyConsumption) {
        energyManager.createRecord({
          deviceId: data.ovenId,
          deviceType: 'oven',
          deviceName: `烘箱 ${data.ovenId}`,
          workOrderNo: data.workOrderNo,
          startTime: data.ovenStartTime,
          endTime: data.ovenEndTime || new Date().toISOString(),
          energyConsumption: parseFloat(data.ovenEnergyConsumption),
          temperature: data.targetTemp,
          processTime: data.bakingTime,
          filterQuantity: data.quantity,
          source: 'simulation'
        });
        created++;
      }

      // MAU/FFU 能耗記錄
      if (data.mauFfuEnergy) {
        energyManager.createRecord({
          deviceId: 'MAU-01',
          deviceType: 'mau',
          deviceName: 'MAU 空調系統',
          workOrderNo: data.workOrderNo,
          startTime: data.deglueStartTime,
          endTime: data.packageTime || new Date().toISOString(),
          energyConsumption: parseFloat(data.mauFfuEnergy),
          filterQuantity: data.quantity,
          source: 'simulation'
        });
        created++;
      }
    });

    console.log(`✓ 生成 ${created} 筆能源記錄`);
    return created;
  }

  /**
   * 生成 WMS Pallet 資料
   * 根據工單的 palletId 建立實際的 Pallet 物件
   */
  async generateWMSPallets() {
    const { wmsManager, Pallet } = await import('../modules/wms/wmsModel.js');
    const workOrders = FormInstanceModel.getAll();

    // 收集所有已完成或已核准的工單 Pallet
    const palletMap = new Map();

    workOrders.forEach(wo => {
      if ((wo.status === 'completed' || wo.status === 'approved') && wo.data.palletId) {
        const palletId = wo.data.palletId;

        if (!palletMap.has(palletId)) {
          palletMap.set(palletId, {
            id: palletId,
            filterIds: [],
            rfidTags: [],
            batchNos: []
          });
        }

        const pallet = palletMap.get(palletId);

        // 為每片濾網生成 ID（簡化版）
        const filterCount = wo.data.quantity || 50;
        for (let i = 0; i < filterCount; i++) {
          const filterId = `${wo.data.batchNo}-${String(i + 1).padStart(3, '0')}`;
          pallet.filterIds.push(filterId);

          if (wo.data.rfidUpdate === '已更換') {
            pallet.rfidTags.push(`RFID-${filterId}`);
          }
        }

        pallet.batchNos.push(wo.data.batchNo);
      }
    });

    // 建立 Pallet 物件並入庫
    let created = 0;
    palletMap.forEach((palletData, palletId) => {
      // 檢查 Pallet 是否已存在
      let pallet = wmsManager.getPallet(palletId);

      if (!pallet) {
        // 建立新 Pallet（標準容量 18 片，最大容量 48 片）
        pallet = wmsManager.createPallet({
          id: palletId,
          filterIds: palletData.filterIds,
          rfidTags: palletData.rfidTags,
          standardCapacity: 18,
          maxCapacity: 48
        });

        // 自動入庫（分配庫位）
        try {
          wmsManager.allocateLocation(palletId);
          created++;
        } catch (error) {
          console.warn(`Pallet ${palletId} 入庫失敗:`, error.message);
        }
      }
    });

    console.log(`✓ 建立並入庫 ${created} 個 Pallet`);
    return created;
  }

  /**
   * 取得生成統計
   */
  getStatistics() {
    return {
      forms: FormModel.getAll().length,
      workflows: WorkflowModel.getAll().length,
      instances: FormInstanceModel.getAll().length,
      users: UserModel.getAll().length,
      departments: DepartmentModel.getAll().length,
      spcData: SPCModel.getAll().length,
      spcLimits: SPCModel.getAllLimits().length
    };
  }
}

// 匯出單例
export const dataSimulator = new DataSimulator();
