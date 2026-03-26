// ============================================================
// 去識別化數據模型 — 對應控制台 50 項 CQL 指標
// 沒有假數據，只有結構定義；數值全部為 null（待查詢）
// 正式數據由控制台「連線 UI/UX」匯出後填入
// ============================================================

// ─── 類型定義 ───

export interface DiseaseItem {
  id: string;
  name: string;
  cql: string;
  patients: number | null;
  encounters: number | null;
  cityData?: Record<string, number>;
}

export interface QualityIndicator {
  id: string;
  number: string;
  name: string;
  code: string;
  category: 'medication' | 'outpatient' | 'inpatient' | 'surgery' | 'outcome';
  numerator: number | null;
  denominator: number | null;
  rate: number | null;
  unit: string;
}

export interface HealthIndicator {
  id: string;
  name: string;
  cql: string;
  description: string;
  count: number | null;
  rate: number | null;
  countLabel: string;
  rateLabel: string;
  rateUnit: string;
}

export interface ESGIndicator {
  id: string;
  name: string;
  cql: string;
  description: string;
  count: number | null;
  rate: number | null;
  unit: string;
  countLabel: string;
  rateLabel: string;
}

// ─── 傳染病管制（5 項 CQL）───

export const diseaseItems: DiseaseItem[] = [
  { id: 'covid19', name: 'COVID-19', cql: 'InfectiousDisease_COVID19_Surveillance', patients: null, encounters: null },
  { id: 'influenza', name: '流感', cql: 'InfectiousDisease_Influenza_Surveillance', patients: null, encounters: null },
  { id: 'conjunctivitis', name: '急性結膜炎', cql: 'InfectiousDisease_AcuteConjunctivitis_Surveillance', patients: null, encounters: null },
  { id: 'enterovirus', name: '腸病毒', cql: 'InfectiousDisease_Enterovirus_Surveillance', patients: null, encounters: null },
  { id: 'diarrhea', name: '腹瀉群聚', cql: 'InfectiousDisease_AcuteDiarrhea_Surveillance', patients: null, encounters: null },
];

// ─── 醫療品質指標（39 項 CQL）───

export const qualityIndicators: QualityIndicator[] = [
  // 用藥安全 (18)
  { id: 'indicator-01', number: '01', name: '門診注射劑使用率', code: '3127', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-02', number: '02', name: '門診抗生素使用率', code: '1140.01', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-1', number: '03-1', name: '同院降血壓藥重疊', code: '1710', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-2', number: '03-2', name: '同院降血脂藥重疊', code: '1711', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-3', number: '03-3', name: '同院降血糖藥重疊', code: '1712', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-4', number: '03-4', name: '同院抗思覺失調藥重疊', code: '1726', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-5', number: '03-5', name: '同院抗憂鬱藥重疊', code: '1727', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-6', number: '03-6', name: '同院安眠鎮靜藥重疊', code: '1728', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-7', number: '03-7', name: '同院抗血栓藥重疊', code: '3375', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-8', number: '03-8', name: '同院前列腺藥重疊', code: '3376', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-9', number: '03-9', name: '跨院降血壓藥重疊', code: '1713', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-10', number: '03-10', name: '跨院降血脂藥重疊', code: '1714', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-11', number: '03-11', name: '跨院降血糖藥重疊', code: '1715', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-12', number: '03-12', name: '跨院抗思覺失調藥重疊', code: '1729', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-13', number: '03-13', name: '跨院抗憂鬱藥重疊', code: '1730', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-14', number: '03-14', name: '跨院安眠鎮靜藥重疊', code: '1731', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-15', number: '03-15', name: '跨院抗血栓藥重疊', code: '3377', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-03-16', number: '03-16', name: '跨院前列腺藥重疊', code: '3378', category: 'medication', numerator: null, denominator: null, rate: null, unit: '%' },
  // 門診品質 (5)
  { id: 'indicator-04', number: '04', name: '慢性病連續處方箋使用率', code: '1318', category: 'outpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-05', number: '05', name: '處方10種以上藥品率', code: '3128', category: 'outpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-06', number: '06', name: '小兒氣喘急診率', code: '1315Q', category: 'outpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-07', number: '07', name: '糖尿病HbA1c檢驗率', code: '109.01Q', category: 'outpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-08', number: '08', name: '同日同院同疾病再就診率', code: '1322', category: 'outpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  // 住院品質 (6)
  { id: 'indicator-09', number: '09', name: '14天內非計畫再入院率', code: '1077.01Q', category: 'inpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-10', number: '10', name: '出院後3天內急診率', code: '108.01', category: 'inpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-11-1', number: '11-1', name: '整體剖腹產率', code: '1136.01', category: 'inpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-11-2', number: '11-2', name: '產婦要求剖腹產率', code: '1137.01', category: 'inpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-11-3', number: '11-3', name: '有適應症剖腹產率', code: '1138.01', category: 'inpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-11-4', number: '11-4', name: '初產婦剖腹產率', code: '1075.01', category: 'inpatient', numerator: null, denominator: null, rate: null, unit: '%' },
  // 手術品質 (8)
  { id: 'indicator-12', number: '12', name: '清淨手術抗生素超3天率', code: '1155', category: 'surgery', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-13', number: '13', name: '體外震波碎石平均利用次數', code: '20.01Q', category: 'surgery', numerator: null, denominator: null, rate: null, unit: '次' },
  { id: 'indicator-14', number: '14', name: '子宮肌瘤術14天再入院率', code: '473.01', category: 'surgery', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-15-1', number: '15-1', name: '膝關節置換90天深部感染率', code: '353.01', category: 'surgery', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-15-2', number: '15-2', name: '全膝置換90天深部感染率', code: '3249', category: 'surgery', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-15-3', number: '15-3', name: '部分膝置換90天深部感染率', code: '3250', category: 'surgery', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-16', number: '16', name: '住院手術傷口感染率', code: '1658Q', category: 'surgery', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-19', number: '19', name: '清淨手術傷口感染率', code: '2524Q', category: 'surgery', numerator: null, denominator: null, rate: null, unit: '%' },
  // 結果品質 (2)
  { id: 'indicator-17', number: '17', name: '急性心肌梗塞死亡率', code: '1662Q', category: 'outcome', numerator: null, denominator: null, rate: null, unit: '%' },
  { id: 'indicator-18', number: '18', name: '失智症安寧療護利用率', code: '2795Q', category: 'outcome', numerator: null, denominator: null, rate: null, unit: '%' },
];

// ─── 國民健康指標（3 項 CQL）───

export const healthIndicators: HealthIndicator[] = [
  { id: 'covid19-vaccine', name: 'COVID-19 疫苗接種率', cql: 'COVID19VaccinationCoverage', description: '監測 COVID-19 疫苗接種涵蓋率與劑次完成度', count: null, rate: null, countLabel: '接種人數', rateLabel: '接種率', rateUnit: '劑/人' },
  { id: 'influenza-vaccine', name: '流感疫苗接種率', cql: 'InfluenzaVaccinationCoverage', description: '追蹤季節性流感疫苗接種涵蓋率', count: null, rate: null, countLabel: '接種人數', rateLabel: '接種率', rateUnit: '劑/人' },
  { id: 'hypertension', name: '高血壓活動個案數', cql: 'HypertensionActiveCases', description: '監測高血壓患者的管理與控制情況', count: null, rate: null, countLabel: '活動個案', rateLabel: '控制率', rateUnit: '%' },
];

// ─── ESG 永續指標（3 項 CQL）───

export const esgIndicators: ESGIndicator[] = [
  { id: 'antibiotic', name: '抗生素使用率', cql: 'Antibiotic_Utilization', description: '監測抗生素合理使用與抗藥性管理 (國際算法)', count: null, rate: null, unit: '%', countLabel: '病人數', rateLabel: '使用率' },
  { id: 'ehr', name: '電子病歷採用率', cql: 'EHR_Adoption_Rate', description: '追蹤病歷資料是否以結構化電子格式完整記錄', count: null, rate: null, unit: '%', countLabel: '病人數', rateLabel: '採用率' },
  { id: 'waste', name: '醫療廢棄物管理', cql: 'Waste', description: '監測醫療廢棄物產生與處理情況', count: null, rate: null, unit: '%', countLabel: '廢棄物量', rateLabel: '回收率' },
];

// ─── 統計 ───

export const stats = {
  cqlModules: 50,
  qualityIndicators: 39,
  diseaseItems: 5,
  healthIndicators: 3,
  esgIndicators: 3,
  lastUpdated: '',
};

// ─── 類別名稱對照 ───

export const categoryLabels: Record<string, string> = {
  medication: '用藥安全',
  outpatient: '門診品質',
  inpatient: '住院品質',
  surgery: '手術品質',
  outcome: '結果品質',
};

export const categoryColors: Record<string, string> = {
  medication: 'emerald',
  outpatient: 'blue',
  inpatient: 'violet',
  surgery: 'amber',
  outcome: 'rose',
};
