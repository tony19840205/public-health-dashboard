/**
 * 數據載入器 — 嘗試讀取控制台匯出的真實數據，
 * 找不到時降級使用內建預設結構（值均為 null）
 */

import {
  diseaseItems as defaultDiseaseItems,
  qualityIndicators as defaultQualityIndicators,
  healthIndicators as defaultHealthIndicators,
  esgIndicators as defaultEsgIndicators,
  stats as defaultStats,
  type DiseaseItem,
  type QualityIndicator,
  type HealthIndicator,
  type ESGIndicator,
} from './mock-data';

export interface DashboardData {
  exportedAt?: string;
  diseaseItems: DiseaseItem[];
  qualityIndicators: QualityIndicator[];
  healthIndicators: HealthIndicator[];
  esgIndicators: ESGIndicator[];
  stats: typeof defaultStats;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const STORAGE_KEY = 'fhir-dashboard-data';

/** 從 localStorage 讀取快取 */
function loadCache(): DashboardData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.exportedAt) return null;
    return parsed as DashboardData;
  } catch {
    return null;
  }
}

/** 寫入 localStorage 快取 */
function saveCache(data: DashboardData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded — ignore */ }
}

/** 判斷資料是否含有任何非 null 的查詢結果 */
function hasRealData(data: DashboardData): boolean {
  return !!(
    data.exportedAt &&
    (data.diseaseItems.some(d => d.patients !== null) ||
     data.qualityIndicators.some(q => q.rate !== null) ||
     data.healthIndicators.some(h => h.count !== null) ||
     data.esgIndicators.some(e => e.rate !== null))
  );
}

/** 取得完整儀表板數據（快取 → 遠端 → 預設兜底） */
export async function loadDashboardData(): Promise<DashboardData> {
  const cached = loadCache();

  try {
    const res = await fetch(`${basePath}/data/dashboard-data.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    const remote: DashboardData = {
      exportedAt: raw.exportedAt,
      diseaseItems: raw.diseaseItems ?? defaultDiseaseItems,
      qualityIndicators: raw.qualityIndicators ?? defaultQualityIndicators,
      healthIndicators: raw.healthIndicators ?? defaultHealthIndicators,
      esgIndicators: raw.esgIndicators ?? defaultEsgIndicators,
      stats: raw.stats ?? defaultStats,
    };

    // 遠端有實際數據 → 更新快取並回傳
    if (hasRealData(remote)) {
      saveCache(remote);
      return remote;
    }

    // 遠端沒有實際數據但快取有 → 回傳快取
    if (cached && hasRealData(cached)) return cached;

    return remote;
  } catch {
    // 網路失敗但快取有數據 → 回傳快取
    if (cached) return cached;

    return {
      diseaseItems: defaultDiseaseItems,
      qualityIndicators: defaultQualityIndicators,
      healthIndicators: defaultHealthIndicators,
      esgIndicators: defaultEsgIndicators,
      stats: defaultStats,
    };
  }
}
