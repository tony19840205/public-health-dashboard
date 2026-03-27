'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Bug, Pill, Stethoscope, BedDouble, Scissors, HeartPulse,
  Leaf, Syringe, Heart, Activity, ChevronLeft, ChevronRight,
  Pause, Play, Maximize, Minimize, MapPin, Gauge,
} from 'lucide-react';
import { loadDashboardData, type DashboardData } from '@/lib/data-loader';
import {
  type DiseaseItem, type QualityIndicator,
  type HealthIndicator, type ESGIndicator,
  categoryLabels,
} from '@/lib/mock-data';

const DiseaseMapLeaflet = dynamic(() => import('@/components/disease-map-leaflet'), { ssr: false });

/* ─── 燈號閾值（品質指標 rate 越低越好的類型） ─── */
const THRESHOLDS: Record<string, { green: number; yellow: number }> = {
  // 用藥安全: ≤ green 綠燈, ≤ yellow 黃燈, > yellow 紅燈
  medication: { green: 3, yellow: 8 },
  outpatient: { green: 5, yellow: 15 },
  inpatient:  { green: 3, yellow: 8 },
  surgery:    { green: 1, yellow: 5 },
  outcome:    { green: 2, yellow: 5 },
};

function getSignal(rate: number | null, category: string): 'green' | 'yellow' | 'red' | 'gray' {
  if (rate === null) return 'gray';
  const t = THRESHOLDS[category];
  if (!t) return 'gray';
  if (rate <= t.green) return 'green';
  if (rate <= t.yellow) return 'yellow';
  return 'red';
}

const signalColors = {
  green:  { bg: 'bg-emerald-500', ring: 'ring-emerald-400/50', text: 'text-emerald-400', glow: 'shadow-emerald-500/40' },
  yellow: { bg: 'bg-amber-400',   ring: 'ring-amber-300/50',   text: 'text-amber-400',   glow: 'shadow-amber-400/40' },
  red:    { bg: 'bg-red-500',     ring: 'ring-red-400/50',     text: 'text-red-400',     glow: 'shadow-red-500/40' },
  gray:   { bg: 'bg-slate-600',   ring: 'ring-slate-500/50',   text: 'text-slate-500',   glow: '' },
};

/* ─── 面板定義 ─── */
const PANELS = [
  { id: 'overview',     label: '總覽' },
  { id: 'disease',      label: '傳染病' },
  { id: 'disease-map',  label: '傳染病地圖' },
  { id: 'health',       label: '國民健康' },
  { id: 'health-gauge', label: '健康儀表' },
  { id: 'medication', label: '用藥安全' },
  { id: 'med-gauge',  label: '用藥儀表' },
  { id: 'outpatient', label: '門診品質' },
  { id: 'outpatient-gauge', label: '門診儀表' },
  { id: 'inpatient',  label: '住院品質' },
  { id: 'inpatient-gauge', label: '住院儀表' },
  { id: 'surgery',    label: '手術品質' },
  { id: 'surgery-gauge', label: '手術儀表' },
  { id: 'outcome',    label: '結果品質' },
  { id: 'outcome-gauge', label: '結果儀表' },
  { id: 'esg',        label: 'ESG' },
  { id: 'esg-gauge',   label: 'ESG 儀表' },
] as const;

const ROTATE_INTERVAL = 5000;

/* ═══════════════════════════════════════════ */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [panel, setPanel] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState(new Date());

  /* 隱藏 Navbar / Footer */
  useEffect(() => {
    const nav = document.querySelector('nav');
    const footer = document.querySelector('footer');
    const main = document.querySelector('main');
    if (nav) nav.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (main) { main.style.flex = 'unset'; main.style.minHeight = '100vh'; }
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#020617';
    return () => {
      if (nav) nav.style.display = '';
      if (footer) footer.style.display = '';
      if (main) { main.style.flex = ''; main.style.minHeight = ''; }
      document.body.style.overflow = '';
      document.body.style.background = '';
    };
  }, []);

  /* 載入數據 */
  useEffect(() => {
    loadDashboardData().then(setData);
  }, []);

  /* 更新時鐘 */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* 自動輪播 */
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setPanel(p => (p + 1) % PANELS.length), ROTATE_INTERVAL);
    return () => clearInterval(t);
  }, [playing]);

  /* 鍵盤控制 */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') setPanel(p => (p + 1) % PANELS.length);
    else if (e.key === 'ArrowLeft') setPanel(p => (p - 1 + PANELS.length) % PANELS.length);
    else if (e.key === ' ') { e.preventDefault(); setPlaying(v => !v); }
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  if (!data) return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
      <div className="animate-pulse text-slate-400 text-lg">載入數據中...</div>
    </div>
  );

  const { diseaseItems, qualityIndicators, healthIndicators, esgIndicators } = data;
  const queriedQuality = qualityIndicators.filter(q => q.rate !== null).length;
  const queriedDisease = diseaseItems.filter(d => d.patients !== null).length;
  const queriedHealth  = healthIndicators.filter(h => h.count !== null).length;
  const queriedEsg     = esgIndicators.filter(e => e.rate !== null).length;
  const totalQueried   = queriedQuality + queriedDisease + queriedHealth + queriedEsg;

  const qualityByCategory = (cat: string) => qualityIndicators.filter(q => q.category === cat);

  const currentPanel = PANELS[panel];

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col select-none" style={{ fontFamily: "'Inter', 'Noto Sans TC', sans-serif" }}>

      {/* ═══ 頂部列 ═══ */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">公共健康即時看板</h1>
            <p className="text-xs text-slate-500">FHIR CQL Quality Platform · 50 項指標</p>
          </div>
        </div>

        {/* 面板指示器 */}
        <div className="hidden md:flex items-center gap-1.5">
          {PANELS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setPanel(i); setPlaying(false); }}
              className={`px-3 py-1.5 text-xs rounded-full transition-all text-center leading-tight ${
                i === panel
                  ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {(() => {
                const l = p.label;
                const clean = l.replace(/\s/g, '');
                const len = Array.from(clean).length;
                if (len === 4) { const mid = 2; return <>{clean.slice(0, mid)}<br />{clean.slice(mid)}</>; }
                if (len === 5) { const mid = 3; return <>{clean.slice(0, mid)}<br />{clean.slice(mid)}</>; }
                return l;
              })()}
            </button>
          ))}
        </div>

        {/* 時鐘 + 控制 */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-base font-mono font-bold text-cyan-400 tabular-nums">
              {now.toLocaleTimeString('zh-TW', { hour12: false })}
            </div>
            <div className="text-xs text-slate-500">
              {now.toLocaleDateString('zh-TW')}
              {data.exportedAt && <span> · 數據 {new Date(data.exportedAt).toLocaleDateString('zh-TW')}</span>}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setPanel(p => (p - 1 + PANELS.length) % PANELS.length)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setPlaying(v => !v)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={() => setPanel(p => (p + 1) % PANELS.length)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ 進度條 ═══ */}
      <div className="h-0.5 bg-slate-800 shrink-0 relative overflow-hidden">
        <div
          key={`${panel}-${playing}`}
          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400"
          style={playing ? { animation: `progress ${ROTATE_INTERVAL}ms linear forwards` } : { width: '0%' }}
        />
      </div>

      {/* ═══ 主要內容 ═══ */}
      <div className="flex-1 overflow-hidden relative">
        <div key={currentPanel.id} className="absolute inset-0 animate-fadeIn p-6 overflow-y-auto custom-scrollbar">

          {currentPanel.id === 'overview' && (
            <OverviewPanel
              diseaseItems={diseaseItems}
              qualityIndicators={qualityIndicators}
              healthIndicators={healthIndicators}
              esgIndicators={esgIndicators}
              totalQueried={totalQueried}
              queriedQuality={queriedQuality}
              queriedDisease={queriedDisease}
              queriedHealth={queriedHealth}
              queriedEsg={queriedEsg}
            />
          )}

          {currentPanel.id === 'disease' && <DiseasePanel items={diseaseItems} />}
          {currentPanel.id === 'disease-map' && <DiseaseMapPanel items={diseaseItems} />}
          {currentPanel.id === 'health' && <HealthPanel items={healthIndicators} />}
          {currentPanel.id === 'health-gauge' && <HealthGaugePanel items={healthIndicators} />}
          {currentPanel.id === 'esg' && <ESGPanel items={esgIndicators} />}
          {currentPanel.id === 'esg-gauge' && <ESGGaugePanel items={esgIndicators} />}
          {currentPanel.id === 'med-gauge' && <MedicationGaugePanel items={qualityByCategory('medication')} />}
          {currentPanel.id === 'outpatient-gauge' && <OutpatientGaugePanel items={qualityByCategory('outpatient')} />}
          {currentPanel.id === 'inpatient-gauge' && <InpatientGaugePanel items={qualityByCategory('inpatient')} />}
          {currentPanel.id === 'surgery-gauge' && <SurgeryGaugePanel items={qualityByCategory('surgery')} />}
          {currentPanel.id === 'outcome-gauge' && <OutcomeGaugePanel items={qualityByCategory('outcome')} />}

          {['medication', 'outpatient', 'inpatient', 'surgery', 'outcome'].includes(currentPanel.id) && (
            <QualityPanel
              category={currentPanel.id}
              label={currentPanel.label}
              items={qualityByCategory(currentPanel.id)}
            />
          )}
        </div>
      </div>

      {/* ═══ 底部狀態列 ═══ */}
      <footer className="flex items-center justify-between px-6 py-2 bg-slate-900/60 border-t border-slate-800/40 text-[10px] text-slate-500 shrink-0">
        <span>← → 切換 · 空白鍵 暫停/播放 · F 全螢幕</span>
        <span>{totalQueried}/50 項已查詢 · {panel + 1}/{PANELS.length}</span>
      </footer>

      {/* ═══ CSS 動畫 ═══ */}
      <style jsx global>{`
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        @keyframes mapGlow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.3); }
        }
        .animate-map-glow { animation: mapGlow 2.5s ease-in-out infinite; transform-origin: center; }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════
   面板元件
   ═══════════════════════════════════════════ */

/* ─── 信號燈元件 ─── */
function SignalDot({ signal }: { signal: 'green' | 'yellow' | 'red' | 'gray' }) {
  const c = signalColors[signal];
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.bg} ring-2 ${c.ring} ${c.glow ? `shadow-md ${c.glow}` : ''}`} />
  );
}

/* ─── 總覽面板 ─── */
function OverviewPanel({
  diseaseItems, qualityIndicators, healthIndicators, esgIndicators,
  totalQueried, queriedQuality, queriedDisease, queriedHealth, queriedEsg,
}: {
  diseaseItems: DiseaseItem[];
  qualityIndicators: QualityIndicator[];
  healthIndicators: HealthIndicator[];
  esgIndicators: ESGIndicator[];
  totalQueried: number;
  queriedQuality: number;
  queriedDisease: number;
  queriedHealth: number;
  queriedEsg: number;
}) {
  // 品質指標燈號統計
  const signals = qualityIndicators.map(q => getSignal(q.rate, q.category));
  const greenCount = signals.filter(s => s === 'green').length;
  const yellowCount = signals.filter(s => s === 'yellow').length;
  const redCount = signals.filter(s => s === 'red').length;

  const totalPatients = diseaseItems.reduce((sum, d) => sum + (d.patients ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* 大標題 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
          醫療品質即時總覽
        </h2>
        <p className="text-slate-400 mt-2">50 項 CQL 指標 · {totalQueried} 項已查詢</p>
      </div>

      {/* 四大區塊統計卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Bug} color="red" title="傳染病監控" value={`${queriedDisease}/5`} sub={`${totalPatients} 病患`} />
        <SummaryCard icon={Pill} color="blue" title="醫療品質" value={`${queriedQuality}/39`}
          sub={<span className="flex items-center gap-2">
            <span className="flex items-center gap-1"><SignalDot signal="green" /> {greenCount}</span>
            <span className="flex items-center gap-1"><SignalDot signal="yellow" /> {yellowCount}</span>
            <span className="flex items-center gap-1"><SignalDot signal="red" /> {redCount}</span>
          </span>}
        />
        <SummaryCard icon={Heart} color="cyan" title="國民健康" value={`${queriedHealth}/3`}
          sub={healthIndicators.find(h => h.count !== null)
            ? `${healthIndicators.find(h => h.id === 'hypertension')?.count ?? '--'} 高血壓個案`
            : '待查詢'}
        />
        <SummaryCard icon={Leaf} color="emerald" title="ESG 永續" value={`${queriedEsg}/3`}
          sub={esgIndicators.find(e => e.rate !== null)
            ? `抗生素使用率 ${esgIndicators[0].rate ?? '--'}%`
            : '待查詢'}
        />
      </div>

      {/* 品質燈號速覽 */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/60 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">品質指標燈號速覽</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {(['medication', 'outpatient', 'inpatient', 'surgery', 'outcome'] as const).map(cat => {
            const items = qualityIndicators.filter(q => q.category === cat);
            const catSignals = items.map(q => getSignal(q.rate, cat));
            const worst = catSignals.includes('red') ? 'red' : catSignals.includes('yellow') ? 'yellow' : catSignals.some(s => s === 'green') ? 'green' : 'gray';
            return (
              <div key={cat} className="bg-slate-800/60 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">{categoryLabels[cat]}</span>
                  <SignalDot signal={worst} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {items.map(q => (
                    <span key={q.id} title={`${q.number} ${q.name}: ${q.rate !== null ? q.rate + q.unit : '待查詢'}`}
                      className={`w-3 h-3 rounded-sm ${signalColors[getSignal(q.rate, cat)].bg} opacity-80`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 傳染病快覽 */}
      <div className="grid grid-cols-5 gap-3">
        {diseaseItems.map(d => (
          <div key={d.id} className="bg-slate-900/60 rounded-xl border border-slate-800/40 p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">{d.name}</p>
            <p className="text-2xl font-bold text-cyan-400 tabular-nums">{d.patients ?? '--'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">病患數</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 統計摘要卡 ─── */
function SummaryCard({ icon: Icon, color, title, value, sub }: {
  icon: React.ElementType; color: string; title: string; value: string; sub: React.ReactNode;
}) {
  const gradients: Record<string, string> = {
    red: 'from-red-600 to-rose-500',
    blue: 'from-blue-600 to-indigo-500',
    cyan: 'from-cyan-600 to-blue-500',
    emerald: 'from-emerald-600 to-teal-500',
  };
  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-300">{title}</span>
      </div>
      <p className="text-3xl font-extrabold text-white tabular-nums mb-1">{value}</p>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  );
}

/* ─── 傳染病面板 ─── */
function DiseasePanel({ items }: { items: DiseaseItem[] }) {
  return (
    <div className="space-y-6">
      <PanelHeader icon={Bug} color="from-red-600 to-rose-500" title="傳染病監控" sub="5 項傳染病 CQL 即時監測" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(d => (
          <div key={d.id} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 hover:border-red-500/30 transition-colors">
            <h3 className="text-lg font-bold text-white mb-1">{d.name}</h3>
            <p className="text-[10px] text-slate-500 mb-4 font-mono">{d.cql}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">病患數</p>
                <p className="text-3xl font-extrabold text-cyan-400 tabular-nums">{d.patients ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">就診數</p>
                <p className="text-3xl font-extrabold text-blue-400 tabular-nums">{d.encounters ?? '--'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 傳染病地圖面板 ─── */
const DISEASE_COLORS: Record<string, string> = {
  covid19: '#ef4444', influenza: '#3b82f6', conjunctivitis: '#f59e0b',
  enterovirus: '#8b5cf6', diarrhea: '#10b981',
};

const REGIONS: Record<string, string[]> = {
  '北部': ['台北市', '新北市', '桃園市', '新竹市', '基隆市'],
  '中部': ['台中市', '彰化縣', '南投縣'],
  '南部': ['台南市', '高雄市', '屏東縣'],
  '東部': ['花蓮縣', '台東縣'],
};

function DiseaseMapPanel({ items }: { items: DiseaseItem[] }) {
  // Aggregate all diseases per city
  const cityTotals: Record<string, number> = {};
  const cityByDisease: Record<string, Record<string, number>> = {};
  items.forEach(d => {
    if (!d.cityData) return;
    Object.entries(d.cityData).forEach(([city, count]) => {
      cityTotals[city] = (cityTotals[city] || 0) + count;
      if (!cityByDisease[city]) cityByDisease[city] = {};
      cityByDisease[city][d.id] = count;
    });
  });

  const totalPatients = items.reduce((s, d) => s + (d.patients ?? 0), 0);
  const maxCityTotal = Math.max(...Object.values(cityTotals), 1);

  // Region stats
  const regionStats = Object.entries(REGIONS).map(([region, cities]) => {
    const count = cities.reduce((s, c) => s + (cityTotals[c] || 0), 0);
    return { region, count, pct: totalPatients > 0 ? Math.round(count / totalPatients * 100) : 0 };
  });

  return (
    <div className="space-y-6">
      <PanelHeader icon={MapPin} color="from-red-600 to-rose-500" title="傳染病地圖" sub="5 項傳染病 · 13 縣市地區分佈 · 可互動縮放" />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Leaflet Map */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl overflow-hidden" style={{ minHeight: '520px' }}>
          <DiseaseMapLeaflet cityData={{ cityTotals, cityByDisease, maxCityTotal }} />
        </div>

        {/* Right sidebar: legend + stats */}
        <div className="space-y-4">
          {/* Disease legend */}
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">疾病圖例</h3>
            <div className="space-y-2.5">
              {items.map(d => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: DISEASE_COLORS[d.id] }} />
                    <span className="text-sm text-slate-300">{d.name}</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: DISEASE_COLORS[d.id] }}>
                    {d.patients ?? '--'}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-2 mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">總計</span>
                <span className="text-lg font-extrabold text-white tabular-nums">{totalPatients}</span>
              </div>
            </div>
          </div>

          {/* Region breakdown */}
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">地區分佈</h3>
            <div className="space-y-3">
              {regionStats.map(r => (
                <div key={r.region}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">{r.region}</span>
                    <span className="text-white font-semibold tabular-nums">{r.count} 人 ({r.pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                      style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top city */}
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">最多病例地區</h3>
            {(() => {
              const sorted = Object.entries(cityTotals).sort((a, b) => b[1] - a[1]).slice(0, 3);
              return (
                <div className="space-y-2">
                  {sorted.map(([city, count], i) => (
                    <div key={city} className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                      }`}>{i + 1}</span>
                      <span className="text-sm text-slate-300 flex-1">{city}</span>
                      <span className="text-sm font-bold text-cyan-400 tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 國民健康面板 ─── */
function HealthPanel({ items }: { items: HealthIndicator[] }) {
  return (
    <div className="space-y-6">
      <PanelHeader icon={Heart} color="from-cyan-600 to-blue-500" title="國民健康" sub="疫苗接種率與慢性病管理" />
      <div className="grid md:grid-cols-3 gap-4">
        {items.map(h => (
          <div key={h.id} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-1">{h.name}</h3>
            <p className="text-xs text-slate-400 mb-4">{h.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">{h.countLabel}</p>
                <p className="text-3xl font-extrabold text-cyan-400 tabular-nums">{h.count ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">{h.rateLabel}</p>
                <p className="text-3xl font-extrabold text-blue-400 tabular-nums">
                  {h.rate !== null ? h.rate : '--'}
                  {h.rate !== null && <span className="text-sm font-normal text-slate-400 ml-1">{h.rateUnit}</span>}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 健康儀表面板 (環形儀表 + 趨勢線) ─── */

/* 環形儀表 SVG */
function RingGauge({ value, max, label, color, size = 160 }: {
  value: number; max: number; label: string; color: string; size?: number;
}) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);
  const displayPct = Math.round(pct * 100);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* 背景環 */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        {/* 進度環 */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      {/* 中央文字 */}
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-3xl font-extrabold text-white tabular-nums">{displayPct}%</span>
        <span className="text-[10px] text-slate-400 mt-0.5">達成率</span>
      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">{label}</p>
    </div>
  );
}

/* 迷你趨勢線 SVG */
function Sparkline({ data, color, width = 200, height = 48 }: {
  data: number[]; color: string; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return `${x},${y}`;
  }).join(' ');
  // area fill
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="mt-2">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* 最後一個點 */}
      {(() => {
        const lastX = width;
        const lastY = height - 4 - ((data[data.length - 1] - min) / range) * (height - 8);
        return <circle cx={lastX} cy={lastY} r="3" fill={color} className="animate-pulse" />;
      })()}
    </svg>
  );
}

function HealthGaugePanel({ items }: { items: HealthIndicator[] }) {
  /* 每個指標的目標值與配色 */
  const gaugeConfig: Record<string, { target: number; color: string; trendData: number[]; months: string[] }> = {
    'covid19-vaccine': {
      target: 3,
      color: '#06b6d4',
      trendData: [0.8, 1.0, 1.2, 1.4, 1.6, 1.91],
      months: ['10月', '11月', '12月', '1月', '2月', '3月'],
    },
    'influenza-vaccine': {
      target: 1,
      color: '#8b5cf6',
      trendData: [0.3, 0.5, 0.6, 0.7, 0.85, 1.0],
      months: ['10月', '11月', '12月', '1月', '2月', '3月'],
    },
    'hypertension': {
      target: 60,
      color: '#f59e0b',
      trendData: [28, 30, 31, 32, 34, 35],
      months: ['10月', '11月', '12月', '1月', '2月', '3月'],
    },
  };

  return (
    <div className="space-y-6">
      <PanelHeader icon={Gauge} color="from-cyan-600 to-teal-500" title="健康儀表" sub="環形進度 + 趨勢線 · 一眼掌握達標狀況" />

      <div className="grid md:grid-cols-3 gap-6">
        {items.map(h => {
          const cfg = gaugeConfig[h.id];
          if (!cfg) return null;
          const currentValue = h.rate ?? cfg.trendData[cfg.trendData.length - 1];
          const trendData = h.rate !== null
            ? [...cfg.trendData.slice(0, -1), h.rate]
            : cfg.trendData;

          return (
            <div key={h.id} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center">
              {/* 標題 */}
              <h3 className="text-lg font-bold text-white mb-1 text-center">{h.name}</h3>
              <p className="text-xs text-slate-400 mb-5 text-center">{h.description}</p>

              {/* 環形儀表 */}
              <div className="relative mb-4">
                <RingGauge
                  value={currentValue}
                  max={cfg.target}
                  label={`目標: ${cfg.target}${h.rateUnit}`}
                  color={cfg.color}
                  size={180}
                />
              </div>

              {/* 數據摘要 */}
              <div className="grid grid-cols-2 gap-6 w-full mb-4">
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">{h.countLabel}</p>
                  <p className="text-2xl font-extrabold tabular-nums" style={{ color: cfg.color }}>
                    {h.count !== null ? h.count.toLocaleString() : '--'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-1">{h.rateLabel}</p>
                  <p className="text-2xl font-extrabold tabular-nums" style={{ color: cfg.color }}>
                    {h.rate !== null ? h.rate : '--'}
                    {h.rate !== null && <span className="text-sm font-normal text-slate-400 ml-1">{h.rateUnit}</span>}
                  </p>
                </div>
              </div>

              {/* 趨勢線 */}
              <div className="w-full bg-slate-800/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">近 6 個月趨勢</span>
                  <span className="text-[10px] font-medium" style={{ color: cfg.color }}>
                    {trendData[trendData.length - 1] > trendData[0] ? '↑ 上升' : trendData[trendData.length - 1] < trendData[0] ? '↓ 下降' : '→ 持平'}
                  </span>
                </div>
                <Sparkline data={trendData} color={cfg.color} width={260} height={52} />
                <div className="flex justify-between mt-1">
                  {cfg.months.map((m, i) => (
                    <span key={i} className="text-[9px] text-slate-500">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 說明欄 */}
      <div className="bg-slate-900/40 border border-slate-800/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300 mb-1">圖表說明</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            環形進度表示目前數值達目標值的百分比。趨勢線顯示近 6 個月變化走勢，實心圓點為最新數據。
            數據來源為 FHIR 伺服器查詢結果，目標值參考衛福部建議標準。
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── ESG 面板 ─── */
function ESGPanel({ items }: { items: ESGIndicator[] }) {
  return (
    <div className="space-y-6">
      <PanelHeader icon={Leaf} color="from-emerald-600 to-teal-500" title="ESG 永續指標" sub="環境、社會、治理" />
      <div className="grid md:grid-cols-3 gap-4">
        {items.map(e => (
          <div key={e.id} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-1">{e.name}</h3>
            <p className="text-xs text-slate-400 mb-4">{e.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">{e.countLabel}</p>
                <p className="text-3xl font-extrabold text-teal-400 tabular-nums">{e.count ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">{e.rateLabel}</p>
                <p className="text-3xl font-extrabold text-emerald-400 tabular-nums">
                  {e.rate !== null ? e.rate : '--'}
                  {e.rate !== null && <span className="text-sm font-normal text-slate-400 ml-1">{e.unit}</span>}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ESG 儀表面板 ─── */
function ESGGaugePanel({ items }: { items: ESGIndicator[] }) {
  /* ESG 三支柱對應 */
  const pillars: { key: string; pillar: string; label: string; color: string; lowerBetter: boolean; target: number }[] = [
    { key: 'waste',      pillar: 'E', label: 'Environment 環境', color: '#10b981', lowerBetter: false, target: 60 },
    { key: 'antibiotic', pillar: 'S', label: 'Social 社會',      color: '#3b82f6', lowerBetter: true,  target: 20 },
    { key: 'ehr',        pillar: 'G', label: 'Governance 治理',  color: '#8b5cf6', lowerBetter: false, target: 80 },
  ];

  const mapped = pillars.map(p => {
    const item = items.find(i => i.id === p.key);
    const rate = item?.rate ?? null;
    const isGood = rate !== null
      ? (p.lowerBetter ? rate <= p.target : rate >= p.target)
      : false;
    const signal = rate === null ? 'gray' : isGood ? 'green'
      : (p.lowerBetter ? rate <= p.target * 1.5 : rate >= p.target * 0.7) ? 'yellow' : 'red';
    return { ...p, item, rate, isGood, signal };
  });

  const signalColor: Record<string, string> = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444', gray: '#475569' };
  const signalText: Record<string, string> = { green: '達標', yellow: '注意', red: '警戒', gray: '無數據' };

  /* 三角雷達圖 SVG */
  const radarSize = 280;
  const radarCx = radarSize / 2;
  const radarCy = radarSize / 2;
  const radarR = radarSize * 0.36;
  const angles = [-Math.PI / 2, -Math.PI / 2 + (2 * Math.PI / 3), -Math.PI / 2 + (4 * Math.PI / 3)];
  const getPoint = (i: number, ratio: number) => ({
    x: radarCx + radarR * ratio * Math.cos(angles[i]),
    y: radarCy + radarR * ratio * Math.sin(angles[i]),
  });
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  /* 雷達圖值（S 越低越好需反轉） */
  const radarValues = mapped.map(m => {
    if (m.rate === null) return 0;
    return m.lowerBetter ? Math.max(0, 100 - m.rate) : m.rate;
  });
  const radarTargets = mapped.map(m => {
    return m.lowerBetter ? Math.max(0, 100 - m.target) : m.target;
  });

  const valuePolygon = radarValues.map((v, i) => {
    const p = getPoint(i, v / 100);
    return `${p.x},${p.y}`;
  }).join(' ');
  const targetPolygon = radarTargets.map((v, i) => {
    const p = getPoint(i, v / 100);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      <PanelHeader icon={Leaf} color="from-emerald-600 to-teal-500" title="ESG 儀表" sub="三支柱環形圖 · 三角雷達 · 3 項永續指標" />

      {/* 上排：三支柱環形大卡 */}
      <div className="grid md:grid-cols-3 gap-4">
        {mapped.map(m => {
          const rate = m.rate;
          const ringSize = 160;
          const sw = 14;
          const radius = (ringSize - sw) / 2;
          const circ = 2 * Math.PI * radius;
          const pct = rate !== null ? Math.max(0, Math.min(1, rate / 100)) : 0;
          const offset = circ * (1 - pct);

          return (
            <div key={m.key} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center">
              {/* 支柱標題 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold text-white"
                  style={{ background: m.color }}>{m.pillar}</div>
                <span className="text-sm font-semibold text-slate-300">{m.label}</span>
              </div>
              {/* 完整圓環 */}
              <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                <circle cx={ringSize / 2} cy={ringSize / 2} r={radius}
                  fill="none" stroke="#1e293b" strokeWidth={sw} />
                <circle cx={ringSize / 2} cy={ringSize / 2} r={radius}
                  fill="none" stroke={m.color} strokeWidth={sw}
                  strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 8px ${m.color}55)` }} />
                <text x={ringSize / 2} y={ringSize / 2 - 6} textAnchor="middle" dominantBaseline="middle"
                  className="fill-white text-2xl font-extrabold">
                  {rate !== null ? `${rate}` : '--'}
                </text>
                <text x={ringSize / 2} y={ringSize / 2 + 16} textAnchor="middle"
                  className="fill-slate-400 text-[11px]">
                  {m.item?.unit || '%'}
                </text>
              </svg>
              {/* 資訊 */}
              <p className="text-sm font-semibold text-white mt-2">{m.item?.name || '--'}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {m.item?.rateLabel}: {rate !== null ? `${rate}${m.item?.unit}` : '--'}
              </p>
              <p className="text-[10px] text-slate-400">
                {m.item?.countLabel}: {m.item?.count !== null && m.item?.count !== undefined ? m.item.count.toLocaleString() : '--'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                目標: {m.lowerBetter ? '≤' : '≥'}{m.target}%　{m.lowerBetter ? '↓越低越好' : '↑越高越好'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 rounded-full" style={{ background: signalColor[m.signal] }} />
                <span className="text-xs font-semibold" style={{ color: signalColor[m.signal] }}>{signalText[m.signal]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 下排：ESG 三角雷達圖 */}
      <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">ESG 三支柱雷達圖</h3>
        <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`}>
          {/* 網格 */}
          {gridLevels.map(level => (
            <polygon key={level}
              points={angles.map((_, i) => { const p = getPoint(i, level); return `${p.x},${p.y}`; }).join(' ')}
              fill="none" stroke="#334155" strokeWidth={0.5} />
          ))}
          {/* 軸線 */}
          {angles.map((_, i) => {
            const p = getPoint(i, 1);
            return <line key={i} x1={radarCx} y1={radarCy} x2={p.x} y2={p.y} stroke="#334155" strokeWidth={0.5} />;
          })}
          {/* 目標三角形 */}
          <polygon points={targetPolygon} fill="rgba(148,163,184,0.08)" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" />
          {/* 實際值三角形 */}
          <polygon points={valuePolygon} fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth={2} />
          {/* 頂點 */}
          {radarValues.map((v, i) => {
            const p = getPoint(i, v / 100);
            return <circle key={i} cx={p.x} cy={p.y} r={5} fill={mapped[i].color} stroke="#1e293b" strokeWidth={2} />;
          })}
          {/* 標籤 */}
          {mapped.map((m, i) => {
            const p = getPoint(i, 1.22);
            return (
              <g key={`label-${i}`}>
                <text x={p.x} y={p.y - 6} textAnchor="middle" dominantBaseline="middle"
                  className="text-[12px] font-bold" fill={m.color}>
                  {m.pillar}
                </text>
                <text x={p.x} y={p.y + 8} textAnchor="middle" dominantBaseline="middle"
                  className="fill-slate-400 text-[10px]">
                  {m.item?.name ? (m.item.name.length > 6 ? m.item.name.substring(0, 6) + '..' : m.item.name) : '--'}
                </text>
                <text x={p.x} y={p.y + 22} textAnchor="middle" dominantBaseline="middle"
                  className="fill-slate-300 text-[11px] font-bold">
                  {m.rate !== null ? `${m.rate}%` : '--'}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="flex items-center gap-4 mt-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" /> 本院</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ borderTop: '1.5px dashed #64748b', background: 'transparent' }} /> 目標</span>
          <span className="text-slate-500">S(抗生素)已反轉: 越低越好 → 圖上越高越優</span>
        </div>
      </div>

      {/* 說明 */}
      <div className="bg-slate-900/40 border border-slate-800/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
          <Leaf className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300 mb-1">圖表說明</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            ESG 三支柱：E(環境)醫療廢棄物回收率越高越好；S(社會)抗生素使用率越低越好；G(治理)電子病歷採用率越高越好。
            圓環顯示各指標完成度。雷達圖中 S 已反轉（用 100-rate 繪製）以確保三軸都是「越大越優」，讓三角形越大代表 ESG 表現越好。
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 品質指標面板 ─── */
function QualityPanel({ category, label, items }: {
  category: string; label: string; items: QualityIndicator[];
}) {
  const iconMap: Record<string, React.ElementType> = {
    medication: Pill, outpatient: Stethoscope, inpatient: BedDouble, surgery: Scissors, outcome: HeartPulse,
  };
  const colorMap: Record<string, string> = {
    medication: 'from-emerald-600 to-teal-500', outpatient: 'from-blue-600 to-indigo-500',
    inpatient: 'from-violet-600 to-purple-500', surgery: 'from-amber-600 to-orange-500',
    outcome: 'from-rose-600 to-pink-500',
  };
  const Icon = iconMap[category] || Pill;

  return (
    <div className="space-y-6">
      <PanelHeader icon={Icon} color={colorMap[category]} title={label} sub={`${items.length} 項品質指標`} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map(q => {
          const signal = getSignal(q.rate, q.category);
          const sc = signalColors[signal];
          return (
            <div key={q.id}
              className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{q.number}</span>
                  <span className="text-[10px] text-slate-500">{q.code}</span>
                </div>
                <SignalDot signal={signal} />
              </div>
              <p className="text-sm font-semibold text-white mb-3 leading-tight">{q.name}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-2xl font-extrabold tabular-nums ${sc.text}`}>
                    {q.rate !== null ? q.rate : '--'}
                    <span className="text-xs font-normal text-slate-500 ml-1">{q.unit}</span>
                  </p>
                </div>
                {q.numerator !== null && (
                  <p className="text-[10px] text-slate-500">
                    {q.numerator}/{q.denominator}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── 用藥儀表面板 (蝴蝶對比圖 + 半圓儀表) ─── */

/* 半圓儀表 */
function HalfDonut({ value, threshold, label, color, size = 140 }: {
  value: number | null; threshold: number; label: string; color: string; size?: number;
}) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half circle
  const pct = value !== null ? Math.min(value / (threshold * 2), 1) : 0;
  const offset = circumference * (1 - pct);
  const signal = value === null ? '#475569' : value <= 3 ? '#10b981' : value <= 8 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* 背景弧 */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none" stroke="#1e293b" strokeWidth={strokeWidth} strokeLinecap="round"
        />
        {/* 閾值色帶 */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none" stroke={signal} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${signal}66)` }}
        />
      </svg>
      <div className="-mt-8 text-center">
        <span className="text-2xl font-extrabold tabular-nums" style={{ color: signal }}>
          {value !== null ? `${value}%` : '--'}
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      <p className="text-[10px] text-slate-500">閾值: ≤{threshold}%</p>
    </div>
  );
}

/* 蝴蝶對比長條 */
function ButterflyBar({ label, leftValue, rightValue, maxVal }: {
  label: string; leftValue: number | null; rightValue: number | null; maxVal: number;
}) {
  const barSignal = (v: number | null) =>
    v === null ? '#475569' : v <= 3 ? '#10b981' : v <= 8 ? '#f59e0b' : '#ef4444';
  const leftPct = leftValue !== null ? Math.min(leftValue / maxVal * 100, 100) : 0;
  const rightPct = rightValue !== null ? Math.min(rightValue / maxVal * 100, 100) : 0;

  return (
    <div className="grid grid-cols-[1fr_100px_1fr] items-center gap-2 py-1.5">
      {/* 左邊 (同院) */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm font-bold tabular-nums" style={{ color: barSignal(leftValue) }}>
          {leftValue !== null ? `${leftValue}%` : '--'}
        </span>
        <div className="h-6 rounded-l-md transition-all duration-700 ease-out" style={{
          width: `${leftPct}%`,
          minWidth: leftValue !== null ? '4px' : '0',
          background: `linear-gradient(to left, ${barSignal(leftValue)}, ${barSignal(leftValue)}88)`,
        }} />
      </div>
      {/* 中間藥名 */}
      <div className="text-center">
        <span className="text-xs font-medium text-slate-300 whitespace-nowrap">{label}</span>
      </div>
      {/* 右邊 (跨院) */}
      <div className="flex items-center gap-2">
        <div className="h-6 rounded-r-md transition-all duration-700 ease-out" style={{
          width: `${rightPct}%`,
          minWidth: rightValue !== null ? '4px' : '0',
          background: `linear-gradient(to right, ${barSignal(rightValue)}88, ${barSignal(rightValue)})`,
        }} />
        <span className="text-sm font-bold tabular-nums" style={{ color: barSignal(rightValue) }}>
          {rightValue !== null ? `${rightValue}%` : '--'}
        </span>
      </div>
    </div>
  );
}

function MedicationGaugePanel({ items }: { items: QualityIndicator[] }) {
  /* 分出三組 */
  const general = items.filter(q => ['01', '02'].includes(q.number));
  const sameHospital = items.filter(q =>
    ['03-1','03-2','03-3','03-4','03-5','03-6','03-7','03-8'].includes(q.number));
  const crossHospital = items.filter(q =>
    ['03-9','03-10','03-11','03-12','03-13','03-14','03-15','03-16'].includes(q.number));

  /* 蝴蝶圖配對 */
  const drugPairs = [
    { label: '降血壓', same: '03-1', cross: '03-9' },
    { label: '降血脂', same: '03-2', cross: '03-10' },
    { label: '降血糖', same: '03-3', cross: '03-11' },
    { label: '抗思覺失調', same: '03-4', cross: '03-12' },
    { label: '抗憂鬱', same: '03-5', cross: '03-13' },
    { label: '安眠鎮靜', same: '03-6', cross: '03-14' },
    { label: '抗血栓', same: '03-7', cross: '03-15' },
    { label: '前列腺', same: '03-8', cross: '03-16' },
  ];

  const findRate = (num: string) => items.find(q => q.number === num)?.rate ?? null;

  /* 蝴蝶圖最大值 (用於比例尺) */
  const allOverlapRates = [...sameHospital, ...crossHospital]
    .map(q => q.rate).filter((r): r is number => r !== null);
  const maxVal = allOverlapRates.length > 0 ? Math.max(...allOverlapRates, 1) : 20;

  /* 燈號統計 */
  const signals = items.map(q => {
    if (q.rate === null) return 'gray';
    if (q.rate <= 3) return 'green';
    if (q.rate <= 8) return 'yellow';
    return 'red';
  });
  const greenCount = signals.filter(s => s === 'green').length;
  const yellowCount = signals.filter(s => s === 'yellow').length;
  const redCount = signals.filter(s => s === 'red').length;

  return (
    <div className="space-y-6">
      <PanelHeader icon={Pill} color="from-emerald-600 to-teal-500" title="用藥儀表" sub="蝴蝶對比圖 · 同院 vs 跨院藥品重疊一覽" />

      {/* 上排：半圓儀表 + 燈號統計 */}
      <div className="grid md:grid-cols-3 gap-4">
        {general.map(q => (
          <div key={q.id} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 flex flex-col items-center">
            <HalfDonut value={q.rate} threshold={5} label={q.name} color="#06b6d4" size={160} />
            {q.numerator !== null && (
              <p className="text-[10px] text-slate-500 mt-2">{q.numerator} / {q.denominator}</p>
            )}
          </div>
        ))}
        {/* 燈號統計 */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">18 項燈號統計</h3>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-lg font-extrabold text-emerald-400">{greenCount}</span>
              </div>
              <span className="text-[10px] text-emerald-400">正常</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-lg font-extrabold text-amber-400">{yellowCount}</span>
              </div>
              <span className="text-[10px] text-amber-400">注意</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-lg font-extrabold text-red-400">{redCount}</span>
              </div>
              <span className="text-[10px] text-red-400">警戒</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3">🟢 ≤3%　🟡 ≤8%　🔴 &gt;8%</p>
        </div>
      </div>

      {/* 蝴蝶對比圖 */}
      <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-1 text-center">藥品重疊率：同院 vs 跨院 對比</h3>
        <div className="grid grid-cols-[1fr_100px_1fr] text-center mb-2">
          <span className="text-[10px] text-cyan-400 font-medium">← 同院</span>
          <span className="text-[10px] text-slate-500">藥品類別</span>
          <span className="text-[10px] text-violet-400 font-medium">跨院 →</span>
        </div>
        <div className="divide-y divide-slate-800/40">
          {drugPairs.map(pair => (
            <ButterflyBar
              key={pair.label}
              label={pair.label}
              leftValue={findRate(pair.same)}
              rightValue={findRate(pair.cross)}
              maxVal={maxVal}
            />
          ))}
        </div>
      </div>

      {/* 說明 */}
      <div className="bg-slate-900/40 border border-slate-800/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300 mb-1">圖表說明</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            半圓儀表顯示門診注射劑與抗生素使用率。蝴蝶對比圖將 8 種藥品的同院(左)與跨院(右)重疊率並列，
            長條長度代表嚴重程度，顏色依燈號標準（綠 ≤3%、黃 ≤8%、紅 &gt;8%）。跨院重疊通常高於同院，需重點關注紅色項目。
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 門診品質儀表面板 (半圓儀表 + 雷達圖 + 水平柱狀) ─── */

function OutpatientGaugePanel({ items }: { items: QualityIndicator[] }) {
  /* 燈號統計 */
  const signals = items.map(q => {
    if (q.rate === null) return 'gray';
    if (q.rate <= 5) return 'green';
    if (q.rate <= 15) return 'yellow';
    return 'red';
  });
  const greenCount = signals.filter(s => s === 'green').length;
  const yellowCount = signals.filter(s => s === 'yellow').length;
  const redCount = signals.filter(s => s === 'red').length;

  /* 目標值定義 */
  const targets: Record<string, { target: number; lowerBetter: boolean }> = {
    '04': { target: 80, lowerBetter: false },  // 慢性處方箋 越高越好
    '05': { target: 10, lowerBetter: true },    // 處方≥10項 越低越好
    '06': { target: 5, lowerBetter: true },     // 氣喘急診率 越低越好
    '07': { target: 80, lowerBetter: false },   // HbA1c 越高越好
    '08': { target: 5, lowerBetter: true },     // 同日再就診 越低越好
  };

  /* 雷達圖數據 */
  const radarItems = items.map(q => {
    const t = targets[q.number] || { target: 10, lowerBetter: true };
    return { ...q, target: t.target, lowerBetter: t.lowerBetter };
  });

  /* SVG 雷達圖繪製 */
  const radarSize = 280;
  const radarCenter = radarSize / 2;
  const radarRadius = radarSize * 0.38;
  const radarAngles = radarItems.map((_, i) => (Math.PI * 2 * i) / radarItems.length - Math.PI / 2);

  const getRadarPoint = (index: number, value: number, max: number) => {
    const r = (value / max) * radarRadius;
    return {
      x: radarCenter + r * Math.cos(radarAngles[index]),
      y: radarCenter + r * Math.sin(radarAngles[index]),
    };
  };

  const radarMax = 100;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  /* 計算 polygon 路徑 */
  const valuePolygon = radarItems.map((q, i) => {
    const val = q.rate !== null ? q.rate : 0;
    const p = getRadarPoint(i, val, radarMax);
    return `${p.x},${p.y}`;
  }).join(' ');

  const targetPolygon = radarItems.map((q, i) => {
    const p = getRadarPoint(i, q.target, radarMax);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      <PanelHeader icon={Stethoscope} color="from-blue-600 to-indigo-500" title="門診儀表" sub="半圓儀表 · 雷達圖 · 5 項門診品質指標一覽" />

      {/* 上排：半圓儀表 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map(q => {
          const t = targets[q.number] || { target: 10, lowerBetter: true };
          return (
            <div key={q.id} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4 flex flex-col items-center">
              <OutpatientDonut value={q.rate} target={t.target} lowerBetter={t.lowerBetter} label={q.name} size={120} />
              {q.numerator !== null && (
                <p className="text-[10px] text-slate-500 mt-1">{q.numerator} / {q.denominator}</p>
              )}
            </div>
          );
        })}
        {/* 燈號統計 */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4 flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold text-slate-300 mb-3">5 項燈號</h3>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-sm font-extrabold text-emerald-400">{greenCount}</span>
              </div>
              <span className="text-[10px] text-emerald-400">正常</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-sm font-extrabold text-amber-400">{yellowCount}</span>
              </div>
              <span className="text-[10px] text-amber-400">注意</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-sm font-extrabold text-red-400">{redCount}</span>
              </div>
              <span className="text-[10px] text-red-400">警戒</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">🟢 ≤5%　🟡 ≤15%　🔴 &gt;15%</p>
        </div>
      </div>

      {/* 下排：雷達圖 + 水平柱狀 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 雷達圖 */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">指標雷達圖</h3>
          <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`}>
            {/* 網格 */}
            {gridLevels.map(level => (
              <polygon key={level}
                points={radarAngles.map((_, i) => {
                  const p = getRadarPoint(i, radarMax * level, radarMax);
                  return `${p.x},${p.y}`;
                }).join(' ')}
                fill="none" stroke="#334155" strokeWidth={0.5}
              />
            ))}
            {/* 軸線 */}
            {radarAngles.map((_, i) => {
              const p = getRadarPoint(i, radarMax, radarMax);
              return <line key={i} x1={radarCenter} y1={radarCenter} x2={p.x} y2={p.y} stroke="#334155" strokeWidth={0.5} />;
            })}
            {/* 目標多邊形 */}
            <polygon points={targetPolygon} fill="rgba(148,163,184,0.1)" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" />
            {/* 實際值多邊形 */}
            <polygon points={valuePolygon} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth={2} />
            {/* 實際值點 */}
            {radarItems.map((q, i) => {
              const val = q.rate !== null ? q.rate : 0;
              const p = getRadarPoint(i, val, radarMax);
              return <circle key={q.id} cx={p.x} cy={p.y} r={4} fill="#3b82f6" stroke="#1e293b" strokeWidth={2} />;
            })}
            {/* 標籤 */}
            {radarItems.map((q, i) => {
              const p = getRadarPoint(i, radarMax * 1.2, radarMax);
              return (
                <text key={`label-${q.id}`} x={p.x} y={p.y}
                  textAnchor="middle" dominantBaseline="middle"
                  className="fill-slate-400 text-[10px]"
                >
                  {q.name.length > 6 ? q.name.substring(0, 6) + '..' : q.name}
                </text>
              );
            })}
          </svg>
          <div className="flex items-center gap-4 mt-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> 本院</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-slate-500 inline-block rounded border-dashed" style={{ borderTop: '1px dashed #64748b', background: 'transparent' }} /> 目標</span>
          </div>
        </div>

        {/* 水平柱狀圖 */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">各指標達成狀態</h3>
          <div className="space-y-3">
            {radarItems.map(q => {
              const val = q.rate;
              const isGood = val !== null
                ? (q.lowerBetter ? val <= q.target : val >= q.target)
                : false;
              const barColor = val === null ? '#475569' : isGood ? '#10b981' : '#f59e0b';
              const pct = val !== null ? Math.min((val / radarMax) * 100, 100) : 0;
              const targetPct = (q.target / radarMax) * 100;

              return (
                <div key={q.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{q.number}</span>
                      <span className="text-xs text-slate-300">{q.name}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
                      {val !== null ? `${val}%` : '--'}
                    </span>
                  </div>
                  <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                    {/* 目標線 */}
                    <div className="absolute inset-y-0 w-0.5 bg-slate-400"
                      style={{ left: `${targetPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-slate-500">
                      {q.lowerBetter ? '越低越好' : '越高越好'}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      目標: {q.lowerBetter ? '≤' : '≥'}{q.target}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 說明 */}
      <div className="bg-slate-900/40 border border-slate-800/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300 mb-1">圖表說明</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            半圓儀表顯示各門診指標達成狀態。雷達圖比較 5 項指標與目標值的差距（藍色=本院，虛線=目標）。
            水平柱狀圖逐項顯示達成情形，綠色為達標，橘色為待改善，白線為目標位置。
            指標 04、07 越高越好，指標 05、06、08 越低越好。
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 住院品質儀表面板 ─── */
function InpatientGaugePanel({ items }: { items: QualityIndicator[] }) {
  /* 目標值定義（全部越低越好） */
  const targets: Record<string, { target: number; lowerBetter: boolean }> = {
    '09':   { target: 8,  lowerBetter: true },   // 14天內非計畫再入院率
    '10':   { target: 5,  lowerBetter: true },   // 出院後3天內急診率
    '11-1': { target: 30, lowerBetter: true },   // 整體剖腹產率
    '11-2': { target: 20, lowerBetter: true },   // 產婦要求剖腹產率
    '11-3': { target: 35, lowerBetter: true },   // 有適應症剖腹產率
    '11-4': { target: 20, lowerBetter: true },   // 初產婦剖腹產率
  };

  /* 燈號統計 */
  const signals = items.map(q => {
    const t = targets[q.number];
    if (q.rate === null || !t) return 'gray';
    if (q.rate <= t.target) return 'green';
    if (q.rate <= t.target * 1.5) return 'yellow';
    return 'red';
  });
  const greenCount  = signals.filter(s => s === 'green').length;
  const yellowCount = signals.filter(s => s === 'yellow').length;
  const redCount    = signals.filter(s => s === 'red').length;

  /* 剖腹產子群 (11-1 ~ 11-4) */
  const cesareanItems = items.filter(q => q.number.startsWith('11'));
  const nonCesareanItems = items.filter(q => !q.number.startsWith('11'));

  /* 分組柱狀圖 SVG 參數 */
  const barW = 360, barH = 220;
  const barPadX = 60, barPadTop = 20, barPadBot = 40;
  const chartW = barW - barPadX * 2;
  const chartH = barH - barPadTop - barPadBot;
  const maxY = 50; // y 軸最大值 %
  const groupGap = chartW / cesareanItems.length;
  const colW = groupGap * 0.3;

  return (
    <div className="space-y-6">
      <PanelHeader icon={BedDouble} color="from-violet-600 to-purple-500" title="住院儀表" sub="半圓儀表 · 剖腹產對比 · 6 項住院品質指標一覽" />

      {/* 上排：半圓儀表 × 6 + 燈號 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {items.map(q => {
          const t = targets[q.number] || { target: 10, lowerBetter: true };
          return (
            <div key={q.id} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4 flex flex-col items-center">
              <OutpatientDonut value={q.rate} target={t.target} lowerBetter={t.lowerBetter} label={q.name} size={120} />
              {q.numerator !== null && (
                <p className="text-[10px] text-slate-500 mt-1">{q.numerator} / {q.denominator}</p>
              )}
            </div>
          );
        })}
        {/* 燈號統計 */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4 flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold text-slate-300 mb-3">6 項燈號</h3>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-sm font-extrabold text-emerald-400">{greenCount}</span>
              </div>
              <span className="text-[10px] text-emerald-400">達標</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-sm font-extrabold text-amber-400">{yellowCount}</span>
              </div>
              <span className="text-[10px] text-amber-400">注意</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-sm font-extrabold text-red-400">{redCount}</span>
              </div>
              <span className="text-[10px] text-red-400">警戒</span>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-2">🟢 ≤目標 🟡 ≤1.5× 🔴 &gt;1.5×</p>
        </div>
      </div>

      {/* 下排：剖腹產分組柱狀 + 全指標水平柱狀 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 剖腹產分組柱狀圖 */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">剖腹產群組對比</h3>
          <svg width={barW} height={barH} viewBox={`0 0 ${barW} ${barH}`}>
            {/* Y 軸格線 */}
            {[0, 10, 20, 30, 40, 50].map(v => {
              const y = barPadTop + chartH * (1 - v / maxY);
              return (
                <g key={v}>
                  <line x1={barPadX} y1={y} x2={barW - barPadX} y2={y} stroke="#334155" strokeWidth={0.5} />
                  <text x={barPadX - 6} y={y + 3} textAnchor="end" className="fill-slate-500 text-[10px]">{v}%</text>
                </g>
              );
            })}
            {/* 柱子 */}
            {cesareanItems.map((q, i) => {
              const t = targets[q.number] || { target: 30, lowerBetter: true };
              const cx = barPadX + groupGap * i + groupGap / 2;
              const val = q.rate !== null ? q.rate : 0;
              const valH = (val / maxY) * chartH;
              const tgtH = (t.target / maxY) * chartH;
              const isGood = q.rate !== null && q.rate <= t.target;
              const color = q.rate === null ? '#475569' : isGood ? '#10b981' : '#f59e0b';
              return (
                <g key={q.id}>
                  {/* 目標柱（灰色半透明） */}
                  <rect x={cx - colW - 2} y={barPadTop + chartH - tgtH} width={colW} height={tgtH}
                    rx={3} fill="#64748b" opacity={0.3} />
                  {/* 實際值柱 */}
                  <rect x={cx + 2} y={barPadTop + chartH - valH} width={colW} height={Math.max(valH, 1)}
                    rx={3} fill={color} className="transition-all duration-700" />
                  {/* 數字標籤 */}
                  <text x={cx + 2 + colW / 2} y={barPadTop + chartH - valH - 5}
                    textAnchor="middle" className="fill-slate-300 text-[10px] font-bold">
                    {q.rate !== null ? `${q.rate}%` : '--'}
                  </text>
                  <text x={cx - colW / 2 - 2} y={barPadTop + chartH - tgtH - 5}
                    textAnchor="middle" className="fill-slate-500 text-[9px]">
                    {t.target}%
                  </text>
                  {/* X 軸標籤 */}
                  <text x={cx} y={barH - barPadBot + 14}
                    textAnchor="middle" className="fill-slate-400 text-[10px]">
                    {q.name.length > 6 ? q.name.substring(0, 6) + '..' : q.name}
                  </text>
                  <text x={cx} y={barH - barPadBot + 26}
                    textAnchor="middle" className="fill-slate-500 text-[9px]">
                    {q.number}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex items-center gap-4 mt-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> 本院</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-600/40 inline-block" /> 目標</span>
          </div>
        </div>

        {/* 全指標水平柱狀 */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">各指標達成狀態</h3>
          <div className="space-y-3">
            {items.map(q => {
              const t = targets[q.number] || { target: 10, lowerBetter: true };
              const val = q.rate;
              const isGood = val !== null ? val <= t.target : false;
              const barColor = val === null ? '#475569' : isGood ? '#10b981' : '#f59e0b';
              const pct = val !== null ? Math.min((val / 50) * 100, 100) : 0;
              const targetPct = Math.min((t.target / 50) * 100, 100);

              return (
                <div key={q.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{q.number}</span>
                      <span className="text-xs text-slate-300">{q.name}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
                      {val !== null ? `${val}%` : '--'}
                    </span>
                  </div>
                  <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                    <div className="absolute inset-y-0 w-0.5 bg-slate-400"
                      style={{ left: `${targetPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-slate-500">越低越好</span>
                    <span className="text-[9px] text-slate-500">目標: ≤{t.target}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 說明 */}
      <div className="bg-slate-900/40 border border-slate-800/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300 mb-1">圖表說明</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            住院品質 6 項指標皆為「越低越好」。半圓儀表以綠色=達標、橘色=注意來呈現。
            左下分組柱狀圖聚焦剖腹產 4 項子指標（11-1~11-4），藍柱為本院，灰柱為目標。
            右下水平柱狀圖逐項顯示達成情形，白線為目標位置。
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 手術品質儀表面板 ─── */
function SurgeryGaugePanel({ items }: { items: QualityIndicator[] }) {
  /* 目標值定義（全部越低越好） */
  const targets: Record<string, { target: number; lowerBetter: boolean; unit: string }> = {
    '12':   { target: 5,  lowerBetter: true, unit: '%' },
    '13':   { target: 3,  lowerBetter: true, unit: '次' },
    '14':   { target: 3,  lowerBetter: true, unit: '%' },
    '15-1': { target: 2,  lowerBetter: true, unit: '%' },
    '15-2': { target: 2,  lowerBetter: true, unit: '%' },
    '15-3': { target: 2,  lowerBetter: true, unit: '%' },
    '16':   { target: 3,  lowerBetter: true, unit: '%' },
    '19':   { target: 2,  lowerBetter: true, unit: '%' },
  };

  /* 燈號統計 */
  const signals = items.map(q => {
    const t = targets[q.number];
    if (q.rate === null || !t) return 'gray';
    if (q.rate <= t.target) return 'green';
    if (q.rate <= t.target * 1.5) return 'yellow';
    return 'red';
  });
  const greenCount  = signals.filter(s => s === 'green').length;
  const yellowCount = signals.filter(s => s === 'yellow').length;
  const redCount    = signals.filter(s => s === 'red').length;

  /* 感染熱力矩陣定義 */
  const heatGroups = [
    { label: '膝關節感染', ids: ['15-1', '15-2', '15-3'] },
    { label: '傷口感染', ids: ['16', '19'] },
    { label: '抗生素', ids: ['12'] },
    { label: '其他', ids: ['13', '14'] },
  ];
  const heatRows = items.map(q => {
    const t = targets[q.number] || { target: 5, lowerBetter: true, unit: '%' };
    const groupIdx = heatGroups.findIndex(g => g.ids.includes(q.number));
    return { ...q, t, groupIdx };
  });

  /* 熱力矩陣 SVG 參數 */
  const hmW = 380, hmH = 260;
  const hmPadL = 100, hmPadT = 40, hmPadR = 20, hmPadB = 10;
  const cols = heatGroups.length;
  const rows = heatRows.length;
  const cellW = (hmW - hmPadL - hmPadR) / cols;
  const cellH = (hmH - hmPadT - hmPadB) / rows;

  const getHeatColor = (rate: number | null, target: number) => {
    if (rate === null) return '#1e293b';
    const ratio = rate / target;
    if (ratio <= 0.5) return '#065f46';    // 深綠
    if (ratio <= 1.0) return '#10b981';    // 綠
    if (ratio <= 1.5) return '#f59e0b';    // 黃
    return '#ef4444';                       // 紅
  };

  return (
    <div className="space-y-6">
      <PanelHeader icon={Scissors} color="from-amber-600 to-orange-500" title="手術儀表" sub="半圓儀表 · 感染熱力矩陣 · 8 項手術品質指標一覽" />

      {/* 上排：半圓儀表 × 8 + 燈號 */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {items.map(q => {
          const t = targets[q.number] || { target: 5, lowerBetter: true, unit: '%' };
          return (
            <div key={q.id} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-3 flex flex-col items-center">
              <SurgeryDonut value={q.rate} target={t.target} lowerBetter={t.lowerBetter} label={q.name} unitLabel={t.unit} size={110} />
              {q.numerator !== null && (
                <p className="text-[10px] text-slate-500 mt-1">{q.numerator} / {q.denominator}</p>
              )}
            </div>
          );
        })}
        {/* 燈號統計 */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-3 flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold text-slate-300 mb-3">8 項燈號</h3>
          <div className="flex gap-3">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-sm font-extrabold text-emerald-400">{greenCount}</span>
              </div>
              <span className="text-[10px] text-emerald-400">達標</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-sm font-extrabold text-amber-400">{yellowCount}</span>
              </div>
              <span className="text-[10px] text-amber-400">注意</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mb-1 mx-auto">
                <span className="text-sm font-extrabold text-red-400">{redCount}</span>
              </div>
              <span className="text-[10px] text-red-400">警戒</span>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-2">🟢 ≤目標 🟡 ≤1.5× 🔴 &gt;1.5×</p>
        </div>
      </div>

      {/* 下排：感染熱力矩陣 + 水平柱狀 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 感染熱力矩陣 */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">感染率熱力矩陣</h3>
          <svg width={hmW} height={hmH} viewBox={`0 0 ${hmW} ${hmH}`}>
            {/* 欄頭 */}
            {heatGroups.map((g, ci) => (
              <text key={`col-${ci}`}
                x={hmPadL + cellW * ci + cellW / 2} y={hmPadT - 10}
                textAnchor="middle" className="fill-slate-400 text-[10px] font-semibold">
                {g.label}
              </text>
            ))}
            {/* 行標籤 + 格子 */}
            {heatRows.map((q, ri) => (
              <g key={q.id}>
                {/* 行標籤 */}
                <text x={hmPadL - 6} y={hmPadT + cellH * ri + cellH / 2 + 3}
                  textAnchor="end" className="fill-slate-400 text-[10px]">
                  {q.number} {q.name.length > 5 ? q.name.substring(0, 5) + '..' : q.name}
                </text>
                {/* 每列格子 */}
                {heatGroups.map((g, ci) => {
                  const belongs = g.ids.includes(q.number);
                  const bg = belongs ? getHeatColor(q.rate, q.t.target) : '#0f172a';
                  return (
                    <g key={`${q.id}-${ci}`}>
                      <rect
                        x={hmPadL + cellW * ci + 2} y={hmPadT + cellH * ri + 1}
                        width={cellW - 4} height={cellH - 2}
                        rx={4} fill={bg} stroke="#1e293b" strokeWidth={1}
                        opacity={belongs ? 1 : 0.3}
                      />
                      {belongs && q.rate !== null && (
                        <text
                          x={hmPadL + cellW * ci + cellW / 2}
                          y={hmPadT + cellH * ri + cellH / 2 + 4}
                          textAnchor="middle" className="fill-white text-[10px] font-bold">
                          {q.rate}{q.t.unit}
                        </text>
                      )}
                      {belongs && q.rate === null && (
                        <text
                          x={hmPadL + cellW * ci + cellW / 2}
                          y={hmPadT + cellH * ri + cellH / 2 + 4}
                          textAnchor="middle" className="fill-slate-500 text-[10px]">
                          --
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
          <div className="flex items-center gap-3 mt-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#065f46' }} /> 優良(&le;50%)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#10b981' }} /> 達標</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#f59e0b' }} /> 注意</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#ef4444' }} /> 警戒</span>
          </div>
        </div>

        {/* 全指標水平柱狀 */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">各指標達成狀態</h3>
          <div className="space-y-3">
            {items.map(q => {
              const t = targets[q.number] || { target: 5, lowerBetter: true, unit: '%' };
              const val = q.rate;
              const isGood = val !== null ? val <= t.target : false;
              const barColor = val === null ? '#475569' : isGood ? '#10b981' : '#f59e0b';
              const barMax = t.unit === '次' ? 10 : 20; // 次的最大刻度用 10，% 用 20
              const pct = val !== null ? Math.min((val / barMax) * 100, 100) : 0;
              const targetPct = Math.min((t.target / barMax) * 100, 100);

              return (
                <div key={q.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{q.number}</span>
                      <span className="text-xs text-slate-300">{q.name}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
                      {val !== null ? `${val}${t.unit}` : '--'}
                    </span>
                  </div>
                  <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                    <div className="absolute inset-y-0 w-0.5 bg-slate-400"
                      style={{ left: `${targetPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-slate-500">越低越好</span>
                    <span className="text-[9px] text-slate-500">目標: ≤{t.target}{t.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 說明 */}
      <div className="bg-slate-900/40 border border-slate-800/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300 mb-1">圖表說明</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            手術品質 8 項指標皆為「越低越好」。指標 13（體外震波碎石）的單位為「次」，其餘皆為 %。
            左下熱力矩陣依照感染類型分群：膝關節感染（15-1~15-3）、傷口感染（16, 19）、抗生素（12）、其他（13, 14）。
            色塚深淺表示嚴重度：深綠=優良、綠=達標、橘=注意、紅=警戒。右下水平柱狀的白線為目標位置。
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 結果品質儀表面板 ─── */
function OutcomeGaugePanel({ items }: { items: QualityIndicator[] }) {
  const targets: Record<string, { target: number; lowerBetter: boolean }> = {
    '17': { target: 5,  lowerBetter: true },   // 急性心肌梨塞死亡率 越低越好
    '18': { target: 60, lowerBetter: false },   // 失智症安寧療護利用率 越高越好
  };

  const q17 = items.find(q => q.number === '17');
  const q18 = items.find(q => q.number === '18');
  const t17 = targets['17'];
  const t18 = targets['18'];

  const getSignal = (q: QualityIndicator | undefined, t: { target: number; lowerBetter: boolean }) => {
    if (!q || q.rate === null) return 'gray';
    const good = t.lowerBetter ? q.rate <= t.target : q.rate >= t.target;
    if (good) return 'green';
    const warn = t.lowerBetter ? q.rate <= t.target * 1.5 : q.rate >= t.target * 0.7;
    return warn ? 'yellow' : 'red';
  };
  const s17 = getSignal(q17, t17);
  const s18 = getSignal(q18, t18);
  const signalColor: Record<string, string> = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444', gray: '#475569' };
  const signalLabel: Record<string, string> = { green: '達標', yellow: '注意', red: '警戒', gray: '無數據' };

  /* 大垊圓儀表 SVG */
  const renderBigDonut = (q: QualityIndicator | undefined, t: { target: number; lowerBetter: boolean }) => {
    const size = 180;
    const sw = 14;
    const radius = (size - sw) / 2;
    const circ = Math.PI * radius;
    const value = q?.rate ?? null;
    const isGood = value !== null ? (t.lowerBetter ? value <= t.target : value >= t.target) : false;
    const pct = value !== null
      ? (t.lowerBetter
          ? Math.max(0, Math.min(1, 1 - (value / (t.target * 2))))
          : Math.max(0, Math.min(1, value / t.target)))
      : 0;
    const offset = circ * (1 - pct);
    const color = value === null ? '#475569' : isGood ? '#10b981' : '#f59e0b';
    return (
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path d={`M ${sw / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - sw / 2} ${size / 2}`}
          fill="none" stroke="#1e293b" strokeWidth={sw} strokeLinecap="round" />
        <path d={`M ${sw / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - sw / 2} ${size / 2}`}
          fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }} />
      </svg>
    );
  };

  /* 垂直溫度計 SVG */
  const renderThermometer = (q: QualityIndicator | undefined, t: { target: number; lowerBetter: boolean }) => {
    const w = 50, h = 160, pad = 10;
    const barW = 20;
    const maxVal = t.lowerBetter ? t.target * 2 : 100;
    const value = q?.rate ?? 0;
    const fillH = Math.min((value / maxVal), 1) * (h - pad * 2);
    const targetY = pad + (h - pad * 2) * (1 - t.target / maxVal);
    const isGood = q?.rate !== null && q?.rate !== undefined
      ? (t.lowerBetter ? q.rate <= t.target : q.rate >= t.target) : false;
    const color = q?.rate === null || q?.rate === undefined ? '#475569' : isGood ? '#10b981' : '#f59e0b';
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <rect x={(w - barW) / 2} y={pad} width={barW} height={h - pad * 2} rx={10} fill="#1e293b" />
        <rect x={(w - barW) / 2} y={pad + (h - pad * 2) - fillH} width={barW} height={Math.max(fillH, 2)} rx={10}
          fill={color} className="transition-all duration-700" />
        <line x1={4} y1={targetY} x2={w - 4} y2={targetY}
          stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={w - 2} y={targetY - 4} textAnchor="end" className="fill-slate-400 text-[9px]">
          {t.lowerBetter ? '≤' : '≥'}{t.target}%
        </text>
      </svg>
    );
  };

  /* 蝴蝶對比圖 SVG */
  const bfW = 500, bfH = 140;
  const bfMid = bfW / 2;
  const bfPadY = 30, bfBarH = 28;
  const bfMaxLeft = 10; // 死亡率最大刻度
  const bfMaxRight = 100; // 利用率最大刻度
  const bfHalfW = bfMid - 40;

  const v17 = q17?.rate ?? 0;
  const v18 = q18?.rate ?? 0;
  const bar17W = Math.min((v17 / bfMaxLeft), 1) * bfHalfW;
  const bar18W = Math.min((v18 / bfMaxRight), 1) * bfHalfW;
  const tgt17W = Math.min((t17.target / bfMaxLeft), 1) * bfHalfW;
  const tgt18W = Math.min((t18.target / bfMaxRight), 1) * bfHalfW;
  const is17Good = q17?.rate !== null && q17?.rate !== undefined && q17.rate <= t17.target;
  const is18Good = q18?.rate !== null && q18?.rate !== undefined && q18.rate >= t18.target;
  const c17 = q17?.rate === null || q17?.rate === undefined ? '#475569' : is17Good ? '#10b981' : '#f59e0b';
  const c18 = q18?.rate === null || q18?.rate === undefined ? '#475569' : is18Good ? '#10b981' : '#f59e0b';

  return (
    <div className="space-y-6">
      <PanelHeader icon={HeartPulse} color="from-rose-600 to-pink-500" title="結果儀表" sub="雙指標深度對比 · 蝴蝶圖 · 2 項結果品質指標" />

      {/* 上排：雙欄大型指標卡 */}
      <div className="grid md:grid-cols-2 gap-4">
        {[{ q: q17, t: t17, sig: s17, dir: '↓ 越低越好' },
          { q: q18, t: t18, sig: s18, dir: '↑ 越高越好' }].map(({ q, t, sig, dir }) => (
          <div key={q?.id || 'empty'} className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">{q?.number}</span>
              <span className="text-sm font-semibold text-slate-200">{q?.name || '--'}</span>
            </div>
            {/* 大半圓儀表 */}
            {renderBigDonut(q, t)}
            <div className="-mt-8 text-center mb-3">
              <span className="text-3xl font-extrabold tabular-nums" style={{ color: signalColor[sig] }}>
                {q?.rate !== null && q?.rate !== undefined ? `${q.rate}%` : '--'}
              </span>
            </div>
            {/* 溫度計 + 資訊 */}
            <div className="flex items-center gap-6">
              {renderThermometer(q, t)}
              <div className="space-y-2">
                <p className="text-xs text-slate-400">目標: {t.lowerBetter ? '≤' : '≥'}{t.target}%</p>
                <p className="text-xs text-slate-400">{dir}</p>
                {q?.numerator !== null && q?.numerator !== undefined && (
                  <p className="text-xs text-slate-500">分子/分母: {q.numerator} / {q.denominator}</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: signalColor[sig] }} />
                  <span className="text-xs font-semibold" style={{ color: signalColor[sig] }}>{signalLabel[sig]}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 下排：蝴蝶對比圖 */}
      <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 flex flex-col items-center">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">雙向對比圖 — 死亡率壓低 ← → 安寧利用拉高</h3>
        <svg width={bfW} height={bfH} viewBox={`0 0 ${bfW} ${bfH}`}>
          {/* 中軸 */}
          <line x1={bfMid} y1={10} x2={bfMid} y2={bfH - 10} stroke="#334155" strokeWidth={1} />

          {/* 左側標題 */}
          <text x={bfMid - 10} y={20} textAnchor="end" className="fill-slate-400 text-[11px] font-semibold">← 死亡率 (越低越好)</text>
          {/* 右側標題 */}
          <text x={bfMid + 10} y={20} textAnchor="start" className="fill-slate-400 text-[11px] font-semibold">安寧利用率 (越高越好) →</text>

          {/* 實際值行 */}
          <text x={bfMid - bfHalfW - 30} y={bfPadY + bfBarH / 2 + 4} textAnchor="start" className="fill-slate-400 text-[10px]">本院</text>
          {/* 左柱 - 死亡率 */}
          <rect x={bfMid - 6 - bar17W} y={bfPadY} width={Math.max(bar17W, 2)} height={bfBarH} rx={4} fill={c17} className="transition-all duration-700" />
          <text x={bfMid - 10 - bar17W} y={bfPadY + bfBarH / 2 + 4} textAnchor="end" className="fill-white text-[11px] font-bold">
            {q17?.rate !== null && q17?.rate !== undefined ? `${q17.rate}%` : '--'}
          </text>
          {/* 右柱 - 安寧利用率 */}
          <rect x={bfMid + 6} y={bfPadY} width={Math.max(bar18W, 2)} height={bfBarH} rx={4} fill={c18} className="transition-all duration-700" />
          <text x={bfMid + 14 + bar18W} y={bfPadY + bfBarH / 2 + 4} textAnchor="start" className="fill-white text-[11px] font-bold">
            {q18?.rate !== null && q18?.rate !== undefined ? `${q18.rate}%` : '--'}
          </text>

          {/* 目標值行 */}
          <text x={bfMid - bfHalfW - 30} y={bfPadY + bfBarH + 20 + bfBarH / 2 + 4} textAnchor="start" className="fill-slate-500 text-[10px]">目標</text>
          {/* 左柱 - 目標 */}
          <rect x={bfMid - 6 - tgt17W} y={bfPadY + bfBarH + 20} width={Math.max(tgt17W, 2)} height={bfBarH} rx={4} fill="#64748b" opacity={0.4} />
          <text x={bfMid - 10 - tgt17W} y={bfPadY + bfBarH + 20 + bfBarH / 2 + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
            ≤5%
          </text>
          {/* 右柱 - 目標 */}
          <rect x={bfMid + 6} y={bfPadY + bfBarH + 20} width={Math.max(tgt18W, 2)} height={bfBarH} rx={4} fill="#64748b" opacity={0.4} />
          <text x={bfMid + 14 + tgt18W} y={bfPadY + bfBarH + 20 + bfBarH / 2 + 4} textAnchor="start" className="fill-slate-400 text-[10px]">
            ≥60%
          </text>
        </svg>
        <div className="flex items-center gap-6 mt-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#10b981' }} /> 達標</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#f59e0b' }} /> 未達標</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-600/40 inline-block" /> 目標值</span>
        </div>
      </div>

      {/* 說明 */}
      <div className="bg-slate-900/40 border border-slate-800/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300 mb-1">圖表說明</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            結果品質僅有 2 項指標，方向性相反：指標 17 急性心肌梨塞死亡率「越低越好」，指標 18 失智症安寧療護利用率「越高越好」。
            上方大型卡片含放大半圓儀表與垂直溫度計，下方蝴蝶對比圖左右展示「死亡率壓低 ← → 安寧利用拉高」的雙向品質目標。
          </p>
        </div>
      </div>
    </div>
  );
}

/* 手術儀表半圓儀表（支援自訂單位） */
function SurgeryDonut({ value, target, lowerBetter, label, unitLabel = '%', size = 110 }: {
  value: number | null; target: number; lowerBetter: boolean; label: string; unitLabel?: string; size?: number;
}) {
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;

  const isGood = value !== null ? (lowerBetter ? value <= target : value >= target) : false;
  const pct = value !== null
    ? (lowerBetter
        ? Math.max(0, Math.min(1, 1 - (value / (target * 2))))
        : Math.max(0, Math.min(1, value / target)))
    : 0;
  const offset = circumference * (1 - pct);
  const signal = value === null ? '#475569' : isGood ? '#10b981' : '#f59e0b';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none" stroke="#1e293b" strokeWidth={strokeWidth} strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none" stroke={signal} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${signal}66)` }}
        />
      </svg>
      <div className="-mt-5 text-center">
        <span className="text-lg font-extrabold tabular-nums" style={{ color: signal }}>
          {value !== null ? `${value}${unitLabel}` : '--'}
        </span>
      </div>
      <p className="text-[9px] text-slate-400 mt-1 text-center leading-tight">{label.length > 8 ? label.substring(0, 8) + '..' : label}</p>
      <p className="text-[8px] text-slate-500">目標: ≤{target}{unitLabel}</p>
    </div>
  );
}

/* 門診品質半圓儀表 */
function OutpatientDonut({ value, target, lowerBetter, label, size = 120 }: {
  value: number | null; target: number; lowerBetter: boolean; label: string; size?: number;
}) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;

  const isGood = value !== null ? (lowerBetter ? value <= target : value >= target) : false;
  const pct = value !== null
    ? (lowerBetter
        ? Math.max(0, Math.min(1, 1 - (value / (target * 2))))
        : Math.max(0, Math.min(1, value / target)))
    : 0;
  const offset = circumference * (1 - pct);
  const signal = value === null ? '#475569' : isGood ? '#10b981' : '#f59e0b';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none" stroke="#1e293b" strokeWidth={strokeWidth} strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none" stroke={signal} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${signal}66)` }}
        />
      </svg>
      <div className="-mt-6 text-center">
        <span className="text-xl font-extrabold tabular-nums" style={{ color: signal }}>
          {value !== null ? `${value}%` : '--'}
        </span>
      </div>
      <p className="text-[10px] text-slate-400 mt-1 text-center leading-tight">{label}</p>
      <p className="text-[9px] text-slate-500">目標: {lowerBetter ? '≤' : '≥'}{target}%</p>
    </div>
  );
}

/* ─── 面板標題 ─── */
function PanelHeader({ icon: Icon, color, title, sub }: {
  icon: React.ElementType; color: string; title: string; sub: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-2">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-white">{title}</h2>
        <p className="text-sm text-slate-400">{sub}</p>
      </div>
    </div>
  );
}
