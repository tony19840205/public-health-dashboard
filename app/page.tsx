'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity, ShieldCheck, TrendingUp, Building2,
  BarChart3, ArrowRight,
  Sparkles, AlertTriangle, Pill, Stethoscope,
  BedDouble, Scissors, HeartPulse, Leaf, Bug, Syringe, Heart,
} from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import {
  diseaseItems as defaultDiseaseItems,
  qualityIndicators as defaultQualityIndicators,
  healthIndicators as defaultHealthIndicators,
  esgIndicators as defaultEsgIndicators,
  stats as defaultStats,
  categoryLabels,
  categoryColors,
  type QualityIndicator,
} from '@/lib/mock-data';
import { loadDashboardData } from '@/lib/data-loader';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, React.ElementType> = {
  medication: Pill,
  outpatient: Stethoscope,
  inpatient: BedDouble,
  surgery: Scissors,
  outcome: HeartPulse,
};

const catColorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  medication: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  outpatient: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  inpatient: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  surgery: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  outcome: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
};

export default function HomePage() {
  const [diseaseItems, setDiseaseItems] = useState(defaultDiseaseItems);
  const [qualityIndicators, setQualityIndicators] = useState(defaultQualityIndicators);
  const [healthIndicators, setHealthIndicators] = useState(defaultHealthIndicators);
  const [esgIndicators, setEsgIndicators] = useState(defaultEsgIndicators);
  const [stats, setStats] = useState(defaultStats);
  const [dataSource, setDataSource] = useState<'mock' | 'real'>('mock');

  useEffect(() => {
    loadDashboardData().then((d) => {
      if (d.exportedAt) setDataSource('real');
      setDiseaseItems(d.diseaseItems);
      setQualityIndicators(d.qualityIndicators);
      setHealthIndicators(d.healthIndicators);
      setEsgIndicators(d.esgIndicators);
      setStats(d.stats);
    });
  }, []);

  // 按類別分組品質指標
  const grouped = qualityIndicators.reduce<Record<string, QualityIndicator[]>>((acc, ind) => {
    (acc[ind.category] ??= []).push(ind);
    return acc;
  }, {});

  // 計算有數據的指標數
  const queriedCount = qualityIndicators.filter(i => i.rate !== null).length;
  const diseaseQueried = diseaseItems.filter(i => i.patients !== null).length;
  const esgQueried = esgIndicators.filter(i => i.rate !== null).length;
  const healthQueried = healthIndicators.filter(i => i.count !== null).length;

  return (
    <div>
      {/* ─── Data Source Banner ─── */}
      {dataSource === 'mock' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">尚未匯入數據</span>
              <span className="hidden sm:inline"> — 待醫療品質控制台執行 CQL 查詢並匯出後，將自動顯示真實數據</span>
            </p>
          </div>
        </div>
      )}
      {dataSource === 'real' && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm text-emerald-800">
              <span className="font-semibold">真實數據</span> — 來自醫療品質控制台 CQL 查詢匯出
            </p>
          </div>
        </div>
      )}

      {/* ─── Hero ─── */}
      <section className="hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-violet-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>FHIR + CQL 驅動 · 去識別化 · 50 項指標</span>
              {dataSource === 'real' && (
                <span className="ml-2 px-2 py-0.5 bg-emerald-400/25 rounded-full text-xs font-medium">● 真實數據</span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
              公共健康數據<br />透明開放平台
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed">
              整合 FHIR 醫療標準與 CQL 臨床查詢語言，涵蓋傳染病監控、39 項醫療品質指標與 ESG 永續報告。<br />
              所有資料皆經去識別化處理，保護病患隱私。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/data/"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg shadow-black/10"
              >
                <BarChart3 className="w-5 h-5" />
                瀏覽指標數據
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="CQL 模組" value={stats.cqlModules} subtitle="臨床查詢模組" icon={Activity} variant="blue" />
          <StatCard title="品質指標" value={stats.qualityIndicators} subtitle="醫療品質量測" icon={TrendingUp} variant="emerald" />
          <StatCard title="疾病監控" value={stats.diseaseItems} subtitle="傳染病監測項目" icon={ShieldCheck} variant="amber" />
          <StatCard title="國民健康" value={stats.healthIndicators} subtitle="疫苗與慢性病" icon={Heart} variant="blue" />
          <StatCard title="ESG 指標" value={stats.esgIndicators} subtitle="永續發展指標" icon={Leaf} variant="violet" />
        </div>
      </section>

      {/* ─── 傳染病監控 ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="section-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Bug className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">傳染病監控</h2>
                <p className="text-sm text-slate-500">5 項傳染病 CQL 監測{diseaseQueried > 0 && ` · ${diseaseQueried} 項已查詢`}</p>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {diseaseItems.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                <p className="text-sm font-semibold text-slate-800 mb-2">{item.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {item.patients !== null ? item.patients : '--'}
                  </span>
                  <span className="text-xs text-slate-500">病患數</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  就診：{item.encounters !== null ? item.encounters : '--'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 國民健康 ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="section-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Syringe className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">國民健康</h2>
                <p className="text-sm text-slate-500">疫苗接種與慢性病管理{healthQueried > 0 && ` · ${healthQueried} 項已查詢`}</p>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {healthIndicators.map((item) => (
              <div key={item.id} className="p-5 rounded-xl border border-indigo-200 bg-indigo-50 hover:shadow-sm transition-shadow">
                <p className="text-sm font-semibold text-slate-800 mb-1">{item.name}</p>
                <p className="text-xs text-slate-500 mb-3">{item.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">{item.countLabel}</p>
                    <p className="text-xl font-bold text-slate-900">{item.count !== null ? item.count.toLocaleString() : '--'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{item.rateLabel}</p>
                    <p className="text-xl font-bold text-slate-900">{item.rate !== null ? `${item.rate}${item.rateUnit || '%'}` : '--'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 醫療品質指標總覽 ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="section-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">醫療品質指標</h2>
                <p className="text-sm text-slate-500">39 項指標 · 5 大類別{queriedCount > 0 && ` · ${queriedCount} 項已查詢`}</p>
              </div>
            </div>
            <Link href="/data/" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 mt-3 sm:mt-0">
              查看完整指標 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, indicators]) => {
              const colors = catColorMap[cat];
              const Icon = categoryIcons[cat] || Activity;
              const queried = indicators.filter(i => i.rate !== null).length;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn('w-4 h-4', colors.text)} />
                    <h3 className={cn('text-sm font-bold', colors.text)}>
                      {categoryLabels[cat]}
                    </h3>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colors.badge)}>
                      {indicators.length} 項{queried > 0 && ` · ${queried} 有數據`}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {indicators.slice(0, 4).map((ind) => (
                      <div
                        key={ind.id}
                        className={cn('p-3 rounded-xl border', colors.bg, colors.border)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', colors.badge)}>
                            {ind.number}
                          </span>
                          <span className="text-xs text-slate-500 truncate">{ind.code}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 truncate mb-1">{ind.name}</p>
                        <span className="text-xl font-bold text-slate-900">
                          {ind.rate !== null ? `${ind.rate}${ind.unit}` : '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {indicators.length > 4 && (
                    <p className="text-xs text-slate-400 mt-1 ml-1">
                      還有 {indicators.length - 4} 項指標 →{' '}
                      <Link href="/data/" className="text-blue-500 hover:underline">查看全部</Link>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── ESG 永續指標 ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="section-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">ESG 永續指標</h2>
              <p className="text-sm text-slate-500">3 項 CQL 永續指標{esgQueried > 0 && ` · ${esgQueried} 項已查詢`}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {esgIndicators.map((item) => (
              <div key={item.id} className="p-5 rounded-xl border border-teal-200 bg-teal-50 hover:shadow-sm transition-shadow">
                <p className="text-sm font-semibold text-slate-800 mb-1">{item.name}</p>
                <p className="text-xs text-slate-500 mb-3">{item.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">{item.countLabel}</p>
                    <p className="text-xl font-bold text-slate-900">{item.count !== null ? item.count.toLocaleString() : '--'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{item.rateLabel}</p>
                    <p className="text-xl font-bold text-slate-900">{item.rate !== null ? `${item.rate}${item.unit}` : '--'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}
