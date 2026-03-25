/**
 * 數據載入器 — 嘗試讀取控制台匯出的真實數據，
 * 找不到時降級使用內建模擬數據
 */

import * as mock from './mock-data';

export interface DashboardData {
  exportedAt?: string;
  diseaseTrendData: typeof mock.diseaseTrendData;
  qualityIndicators: typeof mock.qualityIndicators;
  esgIndicators: typeof mock.esgIndicators;
  qualityBarData: typeof mock.qualityBarData;
  diseaseTableData: typeof mock.diseaseTableData;
  announcements: typeof mock.announcements;
  stats: typeof mock.stats;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** 取得完整儀表板數據（真實優先，模擬兜底） */
export async function loadDashboardData(): Promise<DashboardData> {
  try {
    const res = await fetch(`${basePath}/data/dashboard-data.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    return {
      exportedAt: raw.exportedAt,
      diseaseTrendData: raw.diseaseTrendData ?? mock.diseaseTrendData,
      qualityIndicators: raw.qualityIndicators ?? mock.qualityIndicators,
      esgIndicators: raw.esgIndicators ?? mock.esgIndicators,
      qualityBarData: raw.qualityBarData ?? mock.qualityBarData,
      diseaseTableData: raw.diseaseTableData ?? mock.diseaseTableData,
      announcements: raw.announcements ?? mock.announcements,
      stats: raw.stats ?? mock.stats,
    };
  } catch {
    // JSON 不存在或解析失敗 → 使用模擬數據
    return {
      diseaseTrendData: mock.diseaseTrendData,
      qualityIndicators: mock.qualityIndicators,
      esgIndicators: mock.esgIndicators,
      qualityBarData: mock.qualityBarData,
      diseaseTableData: mock.diseaseTableData,
      announcements: mock.announcements,
      stats: mock.stats,
    };
  }
}
