# 系統開發手冊

## 開發原則

1. 清爽專業設計: 使用統一 UI 風格，遵循現代網頁設計原則，保持界面簡潔專業
2. 技術使用: 使用簡單易用的開發語言，避免直接套用複雜的框架
3. 復用既有資源: 優先使用既有文件和組件，避免重複建立相似功能
4. 階段性提交: 每個完整階段進行 commit 和 README 更新，確保版本控制清晰
5. 完整測試驗證: 系統必須完整測試後才提供給用戶，確保功能正常運行
6. 高效 Token 使用: 避免重複說明，專注核心功能實現和問題解決
7. 全程使用正體中文進行互動，嚴格禁止使用簡體中文包含內容與用語文法
8. 適當使用 emoji 不應浮濫
9. 主動分析後如果有需要拆解結構，應詢問我是否根據功能拆分程式碼並取得同意

## Git 配置

- Git User: seikaikyo
- Git Email: phpbbtw@gmail.com
- 重要: 所有 commit 必須使用此帳號，否則 Vercel 部署會失敗
- 配置指令:
  ```bash
  git config user.name "seikaikyo"
  git config user.email "phpbbtw@gmail.com"
  ```

## Vercel 部署流程

1. **手動部署** (推薦):
   ```bash
   vercel --prod --yes
   ```
2. **更新別名**:
   ```bash
   vercel alias set [deployment-url] dash-msw.vercel.app
   ```
3. **注意事項**:
   - GitHub 自動部署不穩定，建議使用 CLI 手動部署
   - 每次部署後必須更新 alias 指向最新版本
   - 確認 Git author 為 seikaikyo，否則會出現權限錯誤
   - 部署完成後檢查 Vercel 面板確認版本正確

## 版本發布流程

1. 更新 package.json 版本號
2. 更新 README.md 版本資訊與 changelog
3. Commit 並 push 到 GitHub
4. 建立 Git tag: `git tag v{版本號}`
5. Push tag: `git push origin v{版本號}`
6. 部署到 Vercel: `vercel --prod --yes`
7. 更新 alias 指向新版本

## 技術架構

- 建置工具: Vite ^7.1.9
- 核心: Vanilla JavaScript (ES6+)
- PDF 生成: jsPDF ^3.0.3
- 畫布處理: html2canvas ^1.4.1
- 拖曳功能: @dnd-kit (core, sortable, utilities)
- 資料儲存: LocalStorage

## 常用指令

```bash
# 開發
npm run dev

# 建置
npm run build

# 預覽建置結果
npm run preview

# Git 提交
git add .
git commit -m "訊息"
git push

# Vercel 部署
vercel --prod --yes
vercel alias set [url] dash-msw.vercel.app
```

## 分析文章與報告原則

1. 客觀務實: 用數據說話，減少主觀評價，語調客觀中性，不過度推銷，重點放在事實陳述
2. 銀行參考導向: 適合作為銀行內部評估參考，提供完整財務分析架構，便於銀行人員快速理解狀況
3. 專業格式: 保持正式文件格式，章節架構清晰完整，數據表格易於閱讀
