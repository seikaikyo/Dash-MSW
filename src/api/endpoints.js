/**
 * RMS API 端點定義
 *
 * 提供配方資料的 API 介面，供 EAP 系統整合使用
 */

import { FormModel } from '../utils/dataModel.js';
import { ApprovalModel } from '../utils/dataModel.js';

/**
 * 配方 API 端點
 */
export const RecipeAPI = {
  /**
   * 查詢已核准的配方列表
   * GET /api/recipes?status=approved
   *
   * @param {Object} filters - 篩選條件
   * @returns {Array} 配方列表
   */
  getApprovedRecipes(filters = {}) {
    const allApplications = ApprovalModel.getAll();

    // 篩選已核准的申請單
    const approvedApps = allApplications.filter(app =>
      app.status === 'approved' && app.formData
    );

    // 將申請單轉換為配方格式
    const recipes = approvedApps.map(app => {
      const form = FormModel.getById(app.formId);
      return {
        recipeId: app.id,
        recipeNo: app.formData.recipeNo || app.id,
        productName: app.formData.productName || '未命名配方',
        filterType: app.formData.filterType,
        version: app.formData.version || '1.0',
        status: 'approved',
        approvedAt: app.approvedAt,
        approvedBy: app.currentApprovers,
        formData: app.formData
      };
    });

    // 應用額外篩選條件
    let filtered = recipes;

    if (filters.recipeNo) {
      filtered = filtered.filter(r =>
        r.recipeNo.includes(filters.recipeNo)
      );
    }

    if (filters.filterType) {
      filtered = filtered.filter(r =>
        r.filterType === filters.filterType
      );
    }

    if (filters.fromDate) {
      filtered = filtered.filter(r =>
        new Date(r.approvedAt) >= new Date(filters.fromDate)
      );
    }

    if (filters.toDate) {
      filtered = filtered.filter(r =>
        new Date(r.approvedAt) <= new Date(filters.toDate)
      );
    }

    return filtered;
  },

  /**
   * 查詢單一配方
   * GET /api/recipes/:id
   *
   * @param {string} recipeId - 配方 ID
   * @returns {Object} 配方詳細資訊
   */
  getRecipeById(recipeId) {
    const app = ApprovalModel.getById(recipeId);

    if (!app) {
      return null;
    }

    if (app.status !== 'approved') {
      throw new Error('配方尚未核准');
    }

    const form = FormModel.getById(app.formId);

    return {
      recipeId: app.id,
      recipeNo: app.formData.recipeNo || app.id,
      productName: app.formData.productName || '未命名配方',
      filterType: app.formData.filterType,
      version: app.formData.version || '1.0',
      status: 'approved',
      approvedAt: app.approvedAt,
      approvedBy: app.currentApprovers,
      applicant: app.applicant,
      formName: form?.name,
      formData: app.formData,
      history: app.history
    };
  },

  /**
   * 匯出配方（供 EAP 使用）
   * GET /api/recipes/:id/export
   *
   * @param {string} recipeId - 配方 ID
   * @returns {Object} 配方匯出資料
   */
  exportRecipe(recipeId) {
    const recipe = this.getRecipeById(recipeId);

    if (!recipe) {
      throw new Error('配方不存在');
    }

    // 轉換為 EAP 可讀取的格式
    return {
      recipeId: recipe.recipeId,
      recipeNo: recipe.recipeNo,
      productName: recipe.productName,
      version: recipe.version,
      status: recipe.status,
      approvedAt: recipe.approvedAt,
      timestamp: Date.now(),

      // 配方參數（依產業模組結構）
      parameters: {
        // 基本資訊
        basic: {
          recipeNo: recipe.formData.recipeNo,
          productName: recipe.formData.productName,
          filterType: recipe.formData.filterType,
          version: recipe.formData.version
        },

        // 材料配方
        materials: {
          chemicalAgent: recipe.formData.chemicalAgent,
          concentration: recipe.formData.concentration,
          activatedCarbon: recipe.formData.activatedCarbon,
          carbonWeight: recipe.formData.carbonWeight,
          additives: recipe.formData.additives
        },

        // 製程參數
        process: {
          temperature: recipe.formData.temperature,
          pressure: recipe.formData.pressure,
          mixingTime: recipe.formData.mixingTime,
          curingTime: recipe.formData.curingTime,
          humidity: recipe.formData.humidity
        },

        // 品質標準
        quality: {
          efficiency: recipe.formData.efficiency,
          lifespan: recipe.formData.lifespan,
          testMethod: recipe.formData.testMethod,
          certifications: recipe.formData.certifications
        }
      }
    };
  },

  /**
   * 批次匯出配方
   * POST /api/recipes/export
   *
   * @param {Array} recipeIds - 配方 ID 列表
   * @returns {Array} 配方匯出資料列表
   */
  exportMultiple(recipeIds) {
    return recipeIds.map(id => {
      try {
        return this.exportRecipe(id);
      } catch (error) {
        return {
          recipeId: id,
          error: error.message
        };
      }
    });
  },

  /**
   * 通知 EAP 系統（Webhook）
   * POST http://eap-system/api/recipes/import
   *
   * @param {string} recipeId - 配方 ID
   * @param {string} webhookUrl - EAP Webhook URL
   * @returns {Promise}
   */
  async notifyEAP(recipeId, webhookUrl) {
    const recipe = this.exportRecipe(recipeId);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'recipe.approved',
          data: recipe
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook 通知失敗: ${response.status}`);
      }

      return {
        success: true,
        recipeId,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Webhook 通知失敗:', error);
      return {
        success: false,
        recipeId,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
};

/**
 * 統計 API 端點
 */
export const StatsAPI = {
  /**
   * 取得配方統計資訊
   */
  getRecipeStats() {
    const allApplications = ApprovalModel.getAll();

    return {
      total: allApplications.length,
      approved: allApplications.filter(a => a.status === 'approved').length,
      pending: allApplications.filter(a => a.status === 'pending').length,
      rejected: allApplications.filter(a => a.status === 'rejected').length,
      withdrawn: allApplications.filter(a => a.status === 'withdrawn').length
    };
  },

  /**
   * 取得配方趨勢統計（依日期）
   */
  getRecipeTrends(days = 30) {
    const allApplications = ApprovalModel.getAll();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentApps = allApplications.filter(app =>
      new Date(app.createdAt) >= startDate
    );

    // 依日期分組
    const trends = {};
    recentApps.forEach(app => {
      const date = new Date(app.createdAt).toLocaleDateString('zh-TW');
      if (!trends[date]) {
        trends[date] = { total: 0, approved: 0, rejected: 0 };
      }
      trends[date].total++;
      if (app.status === 'approved') trends[date].approved++;
      if (app.status === 'rejected') trends[date].rejected++;
    });

    return trends;
  }
};

/**
 * API 路由表（用於未來後端實作）
 */
export const API_ROUTES = {
  // 配方查詢
  'GET /api/recipes': RecipeAPI.getApprovedRecipes,
  'GET /api/recipes/:id': RecipeAPI.getRecipeById,

  // 配方匯出
  'GET /api/recipes/:id/export': RecipeAPI.exportRecipe,
  'POST /api/recipes/export': RecipeAPI.exportMultiple,

  // Webhook
  'POST /api/recipes/notify': RecipeAPI.notifyEAP,

  // 統計
  'GET /api/stats': StatsAPI.getRecipeStats,
  'GET /api/stats/trends': StatsAPI.getRecipeTrends
};
