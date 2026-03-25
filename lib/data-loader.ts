/**
 * 數據載入器 — 嘗試讀取控制台匯出的真實數據，
 * 找不到時降級使用內建預設結構（值均為 null）
 */

import {
  diseaseItems as defaultDiseaseItems,
  qualityIndicators as defaultQualityIndicators,
  esgIndicators as defaultEsgIndicators,
  stats as defaultStats,
  type DiseaseItem,
  type QualityIndicator,
  type ESGIndicator,
} from './mock-data';

export interface DashboardData {
  exportedAt?: string;
  diseaseItems: DiseaseItem[];
  qualityIndicators: QualityIndicator[];
  esgIndicators: ESGIndicator[];
  stats: typeof defaultStats;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** 取得完整儀表板數據（真實優先，預設兜底） */
export async function loadDashboardData(): Promise<DashboardData> {
  try {
    const res = await fetch(`${basePath}/data/dashboard-data.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    return {
      exportedAt: raw.exportedAt,
      diseaseItems: raw.diseaseItems ?? defaultDiseaseItems,
      qualityIndicators: raw.qualityIndicators ?? defaultQualityIndicators,
      esgIndicators: raw.esgIndicators ?? defaultEsgIndicators,
      stats: raw.stats ?? defaultStats,
    };
  } catch {
    return {
      diseaseItems: defaultDiseaseItems,
      qualityIndicators: defaultQualityIndicators,
      esgIndicators: defaultEsgIndicators,
      stats: defaultStats,
    };
  }
}
