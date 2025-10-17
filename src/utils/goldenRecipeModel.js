/**
 * Golden Recipe 管理模組
 *
 * 功能：
 * - 品質數據收集與統計
 * - Golden Recipe 評分與認證
 * - 配方品質追蹤
 */

import { FormModel, UserModel } from './dataModel.js';

/**
 * 品質回饋數據模型
 */
export class QualityFeedbackModel {
  static STORAGE_KEY = 'quality_feedbacks';

  /**
   * 儲存品質回饋數據
   */
  static create(feedbackData) {
    const feedbacks = this.getAll();
    const newFeedback = {
      id: `QF-${Date.now()}`,
      recipeId: feedbackData.recipeId,
      recipeVersion: feedbackData.recipeVersion,
      executionId: feedbackData.executionId || `EXEC-${Date.now()}`,
      batchNo: feedbackData.batchNo,

      qualityMetrics: {
        yieldRate: feedbackData.qualityMetrics.yieldRate || 0,
        filterEfficiency: feedbackData.qualityMetrics.filterEfficiency || 0,
        lifespan: feedbackData.qualityMetrics.lifespan || 0,
        defectRate: feedbackData.qualityMetrics.defectRate || 0,
        cpk: feedbackData.qualityMetrics.cpk || 0,
        stabilityScore: feedbackData.qualityMetrics.stabilityScore || 0
      },

      testResults: {
        passed: feedbackData.testResults?.passed || false,
        testDate: feedbackData.testResults?.testDate || new Date().toISOString(),
        inspector: feedbackData.testResults?.inspector || 'SYSTEM'
      },

      productionInfo: feedbackData.productionInfo || {},
      issues: feedbackData.issues || [],
      notes: feedbackData.notes || '',

      createdAt: feedbackData.testResults?.testDate || new Date().toISOString(),
      source: feedbackData.source || 'MANUAL'
    };

    feedbacks.push(newFeedback);

    // 監控數據大小
    const feedbacksJson = JSON.stringify(feedbacks);
    const sizeKB = (new Blob([feedbacksJson]).size / 1024).toFixed(2);
    console.log(`💾 品質回饋數據: ${feedbacks.length} 筆，大小: ${sizeKB}KB`);

    localStorage.setItem(this.STORAGE_KEY, feedbacksJson);

    // 只在非模擬器來源時立即更新配方統計（避免批次生成時頻繁保存版本）
    if (feedbackData.source !== 'SIMULATOR') {
      this.updateRecipeQualityStats(newFeedback.recipeId);
    }

    return newFeedback;
  }

  /**
   * 取得所有品質回饋
   */
  static getAll() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('讀取品質回饋資料失敗:', error);
      return [];
    }
  }

  /**
   * 根據配方 ID 取得品質回饋
   */
  static getByRecipeId(recipeId) {
    const feedbacks = this.getAll();
    return feedbacks.filter(fb => fb.recipeId === recipeId);
  }

  /**
   * 更新配方的品質統計資料
   */
  static updateRecipeQualityStats(recipeId) {
    const recipe = FormModel.getById(recipeId);
    if (!recipe) return;

    const feedbacks = this.getByRecipeId(recipeId);
    if (feedbacks.length === 0) return;

    // 計算平均值
    const avgYieldRate = this.calculateAverage(feedbacks, 'qualityMetrics.yieldRate');
    const avgEfficiency = this.calculateAverage(feedbacks, 'qualityMetrics.filterEfficiency');
    const avgCpk = this.calculateAverage(feedbacks, 'qualityMetrics.cpk');
    const avgDefectRate = this.calculateAverage(feedbacks, 'qualityMetrics.defectRate');

    // 計算品質趨勢
    const qualityTrend = this.calculateQualityTrend(feedbacks);

    // 計算 Golden Score
    const goldenScore = this.calculateGoldenScore(feedbacks);

    // 更新配方資料（儲存數值而非字串，方便後續運算與格式化）
    recipe.qualityStats = {
      totalExecutions: feedbacks.length,
      avgYield: avgYieldRate,
      avgEfficiency: avgEfficiency,
      avgLifespan: this.calculateAverage(feedbacks, 'qualityMetrics.lifespan'),
      avgCpk: avgCpk,
      avgDefectRate: avgDefectRate,
      lastExecutionDate: feedbacks[feedbacks.length - 1].createdAt,
      qualityTrend: qualityTrend
    };

    recipe.goldenScore = goldenScore;

    // 檢查是否符合 Golden Recipe 自動認證條件
    if (this.checkGoldenCriteria(recipe, feedbacks)) {
      if (!recipe.isGolden) {
        recipe.isGolden = true;
        recipe.goldenCertifiedAt = new Date().toISOString();
        recipe.goldenCertifiedBy = 'SYSTEM-AUTO';
        recipe.goldenCertificationReason = '自動認證：符合所有 Golden Recipe 標準';
      }
    }

    // 使用 save() 方法更新配方
    recipe.save();
  }

  /**
   * 計算平均值
   */
  static calculateAverage(feedbacks, path) {
    const values = feedbacks.map(fb => {
      const keys = path.split('.');
      let value = fb;
      for (const key of keys) {
        value = value?.[key];
      }
      return value || 0;
    });

    const sum = values.reduce((acc, val) => acc + val, 0);
    return values.length > 0 ? sum / values.length : 0;
  }

  /**
   * 計算品質趨勢
   */
  static calculateQualityTrend(feedbacks) {
    if (feedbacks.length < 5) return 'insufficient-data';

    // 取最近 10 筆與之前 10 筆比較
    const recentCount = Math.min(10, Math.floor(feedbacks.length / 2));
    const recent = feedbacks.slice(-recentCount);
    const previous = feedbacks.slice(-recentCount * 2, -recentCount);

    if (previous.length === 0) return 'stable';

    const recentAvg = this.calculateAverage(recent, 'qualityMetrics.yieldRate');
    const previousAvg = this.calculateAverage(previous, 'qualityMetrics.yieldRate');

    const diff = recentAvg - previousAvg;

    if (diff > 1) return 'improving';
    if (diff < -1) return 'declining';
    return 'stable';
  }

  /**
   * 計算 Golden Score
   *
   * 評分公式：
   * 總分 = (良率 × 0.3) + (過濾效率 × 0.25) + (壽命達標率 × 0.2) +
   *        (CPK × 10 × 0.15) + (穩定性 × 0.1)
   */
  static calculateGoldenScore(feedbacks) {
    if (feedbacks.length === 0) return 0;

    const avgYieldRate = this.calculateAverage(feedbacks, 'qualityMetrics.yieldRate');
    const avgEfficiency = this.calculateAverage(feedbacks, 'qualityMetrics.filterEfficiency');
    const avgLifespan = this.calculateAverage(feedbacks, 'qualityMetrics.lifespan');
    const avgCpk = this.calculateAverage(feedbacks, 'qualityMetrics.cpk');
    const avgStability = this.calculateAverage(feedbacks, 'qualityMetrics.stabilityScore');

    // 壽命達標率（假設標準是 24 個月，允許超過 100%）
    const lifespanRate = (avgLifespan / 24) * 100;

    const score = (
      avgYieldRate * 0.3 +
      avgEfficiency * 0.25 +
      lifespanRate * 0.2 +
      avgCpk * 10 * 0.15 +
      avgStability * 0.1
    );

    return Math.round(score * 10) / 10; // 四捨五入到小數點第一位
  }

  /**
   * 檢查是否符合 Golden Recipe 自動認證條件
   */
  static checkGoldenCriteria(recipe, feedbacks) {
    // 最低樣本數要求
    if (feedbacks.length < 10) return false;

    // 時間跨度要求（至少 30 天）
    const firstDate = new Date(feedbacks[0].createdAt);
    const lastDate = new Date(feedbacks[feedbacks.length - 1].createdAt);
    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    if (daysDiff < 30) return false;

    // Golden Score 要求
    if (recipe.goldenScore < 92) return false;

    // 最近 20 批次良率要求
    const recent20 = feedbacks.slice(-20);
    const recent20AvgYield = this.calculateAverage(recent20, 'qualityMetrics.yieldRate');
    if (recent20AvgYield < 97) return false;

    // CPK 要求
    const avgCpk = this.calculateAverage(feedbacks, 'qualityMetrics.cpk');
    if (avgCpk < 1.33) return false;

    // 無重大品質異常
    const hasIssues = feedbacks.some(fb => fb.issues && fb.issues.length > 0);
    if (hasIssues) return false;

    return true;
  }
}

/**
 * Golden Recipe 管理類別
 */
export class GoldenRecipeManager {

  /**
   * 手動認證 Golden Recipe（提出申請）
   */
  static certifyGoldenRecipe(recipeId, certificationData) {
    const recipe = FormModel.getById(recipeId);
    if (!recipe) {
      throw new Error('配方不存在');
    }

    // 如果有審核主管，配方暫時不標記為 Golden，等待審核
    const needsApproval = certificationData.reviewers && certificationData.reviewers.length > 0;

    recipe.isGolden = !needsApproval; // 無審核主管時直接認證
    recipe.goldenCertifiedAt = new Date().toISOString();
    recipe.goldenCertifiedBy = certificationData.certifiedBy;
    recipe.goldenCertificationReason = certificationData.reason;
    recipe.goldenReviewedBy = certificationData.reviewedBy;
    recipe.reviewers = certificationData.reviewers || [];
    recipe.certificationStatus = needsApproval ? 'pending' : 'approved'; // 認證狀態

    // 使用 save() 方法更新配方
    recipe.save();

    return recipe;
  }

  /**
   * 審核主管核准 Golden Recipe 認證
   */
  static approveGoldenRecipe(recipeId, reviewerId, approvalData = {}) {
    const recipe = FormModel.getById(recipeId);
    if (!recipe) {
      throw new Error('配方不存在');
    }

    if (!recipe.reviewers || recipe.reviewers.length === 0) {
      throw new Error('此配方無需審核');
    }

    // 取得審核者資訊
    const currentUser = UserModel.getById(reviewerId);
    const isAdmin = currentUser && (currentUser.role === '系統管理員' || currentUser.role === 'admin');

    // 找到該審核者
    let reviewer = recipe.reviewers.find(r => r.id === reviewerId);

    // 如果不在審核清單中
    if (!reviewer) {
      // 系統管理員可以代理審核第一個 pending 的審核者
      if (isAdmin) {
        reviewer = recipe.reviewers.find(r => r.status === 'pending');
        if (!reviewer) {
          throw new Error('沒有待審核的項目');
        }
        // 標記為代理審核
        reviewer.isProxy = true;
        reviewer.proxyById = reviewerId;
        reviewer.proxyByName = currentUser.name;
      } else {
        throw new Error('您不在此配方的審核清單中');
      }
    } else if (reviewer.status !== 'pending') {
      throw new Error(`此審核已${reviewer.status === 'approved' ? '核准' : '退回'}`);
    }

    // 更新審核者狀態
    reviewer.status = 'approved';
    reviewer.approvedAt = new Date().toISOString();
    reviewer.comment = approvalData.comment || '';

    // 檢查是否所有審核者都已核准
    const allApproved = recipe.reviewers.every(r => r.status === 'approved');

    if (allApproved) {
      // 全部核准，正式認證為 Golden Recipe
      recipe.isGolden = true;
      recipe.certificationStatus = 'approved';
      recipe.goldenFinalApprovedAt = new Date().toISOString();
    }

    recipe.save();
    return recipe;
  }

  /**
   * 審核主管退回 Golden Recipe 認證
   */
  static rejectGoldenRecipe(recipeId, reviewerId, rejectionData) {
    const recipe = FormModel.getById(recipeId);
    if (!recipe) {
      throw new Error('配方不存在');
    }

    if (!recipe.reviewers || recipe.reviewers.length === 0) {
      throw new Error('此配方無需審核');
    }

    // 取得審核者資訊
    const currentUser = UserModel.getById(reviewerId);
    const isAdmin = currentUser && (currentUser.role === '系統管理員' || currentUser.role === 'admin');

    // 找到該審核者
    let reviewer = recipe.reviewers.find(r => r.id === reviewerId);

    // 如果不在審核清單中
    if (!reviewer) {
      // 系統管理員可以代理審核第一個 pending 的審核者
      if (isAdmin) {
        reviewer = recipe.reviewers.find(r => r.status === 'pending');
        if (!reviewer) {
          throw new Error('沒有待審核的項目');
        }
        // 標記為代理審核
        reviewer.isProxy = true;
        reviewer.proxyById = reviewerId;
        reviewer.proxyByName = currentUser.name;
      } else {
        throw new Error('您不在此配方的審核清單中');
      }
    } else if (reviewer.status !== 'pending') {
      throw new Error(`此審核已${reviewer.status === 'approved' ? '核准' : '退回'}`);
    }

    // 更新審核者狀態
    reviewer.status = 'rejected';
    reviewer.rejectedAt = new Date().toISOString();
    reviewer.rejectionReason = rejectionData.reason || '無理由';
    reviewer.comment = rejectionData.comment || '';

    // 只要有一位退回，認證就失敗
    recipe.isGolden = false;
    recipe.certificationStatus = 'rejected';
    recipe.goldenRejectedAt = new Date().toISOString();

    recipe.save();
    return recipe;
  }

  /**
   * 取得待我審核的 Golden Recipe 清單
   */
  static getPendingReviewsForUser(userId) {
    const allRecipes = FormModel.getAll();

    // 取得使用者資訊
    const user = UserModel.getById(userId);
    const isAdmin = user && (user.role === '系統管理員' || user.role === 'admin');

    return allRecipes.filter(recipe => {
      if (!recipe.reviewers || recipe.reviewers.length === 0) return false;
      if (recipe.certificationStatus !== 'pending') return false;

      // 系統管理員可以看到所有待審核的配方
      if (isAdmin) {
        // 只要有任何一個審核者是 pending，就顯示
        return recipe.reviewers.some(r => r.status === 'pending');
      }

      // 一般使用者：檢查該使用者是否在審核清單中且狀態為 pending
      const myReview = recipe.reviewers.find(r => r.id === userId);
      return myReview && myReview.status === 'pending';
    });
  }

  /**
   * 降級 Golden Recipe
   */
  static degradeGoldenRecipe(recipeId, reason) {
    const recipe = FormModel.getById(recipeId);
    if (!recipe) {
      throw new Error('配方不存在');
    }

    recipe.isGolden = false;
    recipe.goldenDegradedAt = new Date().toISOString();
    recipe.goldenDegradedReason = reason;

    // 使用 save() 方法更新配方
    recipe.save();

    return recipe;
  }

  /**
   * 取得所有 Golden Recipes
   */
  static getAllGoldenRecipes() {
    const allRecipes = FormModel.getAll();
    return allRecipes.filter(recipe => recipe.isGolden === true);
  }

  /**
   * 取得 Golden Recipe 候選清單
   */
  static getGoldenCandidates() {
    const allRecipes = FormModel.getAll();
    return allRecipes
      .filter(recipe => !recipe.isGolden && recipe.goldenScore >= 85)
      .sort((a, b) => (b.goldenScore || 0) - (a.goldenScore || 0));
  }

  /**
   * 取得配方的品質報表
   */
  static getQualityReport(recipeId) {
    const recipe = FormModel.getById(recipeId);
    const feedbacks = QualityFeedbackModel.getByRecipeId(recipeId);

    return {
      recipe: recipe,
      feedbacks: feedbacks,
      statistics: recipe.qualityStats || {},
      goldenScore: recipe.goldenScore || 0,
      isGolden: recipe.isGolden || false,
      meetsCriteria: QualityFeedbackModel.checkGoldenCriteria(recipe, feedbacks)
    };
  }
}

/**
 * API 模擬器（用於測試）
 */
export class GoldenRecipeAPI {

  /**
   * 接收品質回饋數據（模擬 SPC 系統回傳）
   */
  static async submitQualityFeedback(recipeId, feedbackData) {
    try {
      const recipe = FormModel.getById(recipeId);
      if (!recipe) {
        return { success: false, error: '配方不存在' };
      }

      // 從配方取得版本
      const versionField = recipe.fields.find(f => f.name === 'version');
      const recipeVersion = versionField?.value || '1.0';

      const feedback = QualityFeedbackModel.create({
        recipeId,
        recipeVersion,
        ...feedbackData
      });

      return {
        success: true,
        feedback: feedback,
        updatedRecipe: FormModel.getById(recipeId)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批次提交品質數據（模擬從 SPC 系統同步）
   */
  static async syncQualityData(qualityDataList) {
    const results = [];

    for (const data of qualityDataList) {
      const result = await this.submitQualityFeedback(data.recipeId, data);
      results.push(result);
    }

    return {
      total: qualityDataList.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    };
  }
}
