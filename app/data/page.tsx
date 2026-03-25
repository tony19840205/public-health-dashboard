'use client';

import { useState, useEffect } from 'react';
import {
  Search, AlertTriangle, Pill, Stethoscope,
  BedDouble, Scissors, HeartPulse, Activity,
  Bug, Leaf, Syringe,
} from 'lucide-react';
import {
  diseaseItems as defaultDiseaseItems,
  qualityIndicators as defaultQualityIndicators,
  healthIndicators as defaultHealthIndicators,
  esgIndicators as defaultEsgIndicators,
  categoryLabels,
  type QualityIndicator,
} from '@/lib/mock-data';
import { loadDashboardData } from '@/lib/data-loader';
import { cn } from '@/lib/utils';

const categories = ['all', 'medication', 'outpatient', 'inpatient', 'surgery', 'outcome'] as const;
type Category = (typeof categories)[number];

const categoryMeta: Record<string, { label: string; icon: React.ElementType; color: string; activeBg: string }> = {
  all:        { label: '全部', icon: Activity, color: 'text-slate-600', activeBg: 'bg-slate-900 text-white' },
  medication: { label: '用藥安全', icon: Pill, color: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white' },
  outpatient: { label: '門診品質', icon: Stethoscope, color: 'text-blue-600', activeBg: 'bg-blue-600 text-white' },
  inpatient:  { label: '住院品質', icon: BedDouble, color: 'text-violet-600', activeBg: 'bg-violet-600 text-white' },
  surgery:    { label: '手術品質', icon: Scissors, color: 'text-amber-600', activeBg: 'bg-amber-600 text-white' },
  outcome:    { label: '結果品質', icon: HeartPulse, color: 'text-rose-600', activeBg: 'bg-rose-600 text-white' },
};

const catCardColors: Record<string, { bg: string; border: string; badge: string }> = {
  medication: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  outpatient: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  inpatient:  { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
  surgery:    { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  outcome:    { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700' },
};

export default function DataPage() {
  const [qualityIndicators, setQualityIndicators] = useState(defaultQualityIndicators);
  const [diseaseItems, setDiseaseItems] = useState(defaultDiseaseItems);
  const [healthIndicators, setHealthIndicators] = useState(defaultHealthIndicators);
  const [esgIndicators, setEsgIndicators] = useState(defaultEsgIndicators);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [dataSource, setDataSource] = useState<'mock' | 'real'>('mock');

  useEffect(() => {
    loadDashboardData().then((d) => {
      if (d.exportedAt) setDataSource('real');
      setQualityIndicators(d.qualityIndicators);
      setDiseaseItems(d.diseaseItems);
      setHealthIndicators(d.healthIndicators);
      setEsgIndicators(d.esgIndicators);
    });
  }, []);

  const filtered = qualityIndicators.filter((ind) => {
    const matchCat = activeCategory === 'all' || ind.category === activeCategory;
    const matchSearch =
      ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.number.includes(searchTerm) ||
      ind.code.includes(searchTerm);
    return matchCat && matchSearch;
  });

  const queriedCount = qualityIndicators.filter(i => i.rate !== null).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Data Source Banner */}
      {dataSource === 'mock' && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">尚未匯入數據</span> — 所有數值顯示 &quot;--&quot;，待控制台查詢後匯出
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">數據查詢</h1>
        <p className="text-slate-500 mt-1">
          50 項 CQL 指標 · 39 醫療品質 · 5 傳染病 · 3 國民健康 · 3 ESG
          {queriedCount > 0 && <span className="text-emerald-600 font-medium"> · {queriedCount} 項已有數據</span>}
        </p>
      </div>

      {/* ═══════════════════════════════════════════
          傳染病監控
          ═══════════════════════════════════════════ */}
      <section className="section-card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Bug className="w-4 h-4 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">傳染病監控</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">5 項</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {diseaseItems.map((item) => (
            <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
              <p className="text-sm font-semibold text-slate-800 mb-1">{item.name}</p>
              <p className="text-[10px] text-slate-400 mb-2 truncate">{item.cql}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500">病患數</p>
                  <p className="text-lg font-bold text-slate-900">{item.patients !== null ? item.patients : '--'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">就診數</p>
                  <p className="text-lg font-bold text-slate-900">{item.encounters !== null ? item.encounters : '--'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          國民健康
          ═══════════════════════════════════════════ */}
      <section className="section-card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Syringe className="w-4 h-4 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">國民健康</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">3 項</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {healthIndicators.map((item) => (
            <div key={item.id} className="p-5 rounded-xl border border-indigo-200 bg-indigo-50 hover:shadow-sm transition-shadow">
              <p className="text-sm font-semibold text-slate-800 mb-1">{item.name}</p>
              <p className="text-[10px] text-slate-400 mb-1 truncate">{item.cql}</p>
              <p className="text-xs text-slate-500 mb-3">{item.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">{item.countLabel}</p>
                  <p className="text-lg font-bold text-slate-900">{item.count !== null ? item.count.toLocaleString() : '--'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{item.rateLabel}</p>
                  <p className="text-lg font-bold text-slate-900">{item.rate !== null ? `${item.rate}%` : '--'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          醫療品質指標 (39)
          ═══════════════════════════════════════════ */}
      <section className="section-card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">醫療品質指標</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">39 項</span>
          </div>
        </div>

        {/* Search + Category tabs */}
        <div className="mb-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋指標名稱、編號或代碼..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const meta = categoryMeta[cat];
              const Icon = meta.icon;
              const count = cat === 'all' ? qualityIndicators.length : qualityIndicators.filter(i => i.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    activeCategory === cat
                      ? meta.activeBg
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {meta.label}
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    activeCategory === cat ? 'bg-white/20' : 'bg-slate-200'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Indicator Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((ind) => {
            const colors = catCardColors[ind.category];
            return (
              <div
                key={ind.id}
                className={cn('p-4 rounded-xl border transition-shadow hover:shadow-sm', colors.bg, colors.border)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded', colors.badge)}>
                    {ind.number}
                  </span>
                  <span className="text-xs text-slate-500">{ind.code}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full ml-auto', colors.badge)}>
                    {categoryLabels[ind.category]}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 mb-3">{ind.name}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 mb-0.5">分子</p>
                    <p className="text-sm font-bold text-slate-900">
                      {ind.numerator !== null ? ind.numerator.toLocaleString() : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 mb-0.5">分母</p>
                    <p className="text-sm font-bold text-slate-900">
                      {ind.denominator !== null ? ind.denominator.toLocaleString() : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 mb-0.5">比率</p>
                    <p className="text-lg font-bold text-slate-900">
                      {ind.rate !== null ? `${ind.rate}${ind.unit}` : '--'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2" />
            <p>沒有符合搜尋條件的指標</p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          ESG 永續指標
          ═══════════════════════════════════════════ */}
      <section className="section-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-teal-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">ESG 永續指標</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">3 項</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {esgIndicators.map((item) => (
            <div key={item.id} className="p-5 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
              <p className="text-sm font-semibold text-slate-800 mb-1">{item.name}</p>
              <p className="text-[10px] text-slate-400 mb-3 truncate">{item.cql}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {item.rate !== null ? item.rate : '--'}
                </span>
                <span className="text-sm text-slate-500">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
