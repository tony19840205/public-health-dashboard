# 公共健康數據平台 | Public Health Dashboard

基於 FHIR 標準的開放式醫療數據展示平台，提供匿名化的公共健康統計資訊。

## 功能

- **首頁儀表板** — 傳染病趨勢、醫療品質指標、ESG 永續指標
- **數據查詢** — 搜尋、篩選、排序、匯出統計數據
- **AI 健康問答** — 基於公開統計數據的智慧分析（LLM 待接入）
- **關於頁面** — 平台說明與數據流程

## 技術架構

- **Next.js 14** + **TypeScript**
- **Tailwind CSS** — 響應式設計
- **Recharts** — 互動式圖表
- **Lucide Icons** — 精美圖標
- 靜態匯出 (`output: 'export'`)，部署至 GitHub Pages

## 開發

```bash
npm install
npm run dev
```

瀏覽器開啟 http://localhost:3000

## 部署

Push 至 `main` branch 後，GitHub Actions 自動建置並部署至 GitHub Pages。

## 資料安全

- 所有對外數據皆經去識別化處理
- 不包含任何個人可識別資訊
- 內部醫療資料與外部展示完全隔離
