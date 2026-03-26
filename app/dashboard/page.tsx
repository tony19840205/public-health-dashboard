'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bug, Pill, Stethoscope, BedDouble, Scissors, HeartPulse,
  Leaf, Syringe, Heart, Activity, ChevronLeft, ChevronRight,
  Pause, Play, Maximize, Minimize, MapPin,
} from 'lucide-react';
import { loadDashboardData, type DashboardData } from '@/lib/data-loader';
import {
  type DiseaseItem, type QualityIndicator,
  type HealthIndicator, type ESGIndicator,
  categoryLabels,
} from '@/lib/mock-data';

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
  { id: 'medication', label: '用藥安全' },
  { id: 'outpatient', label: '門診品質' },
  { id: 'inpatient',  label: '住院品質' },
  { id: 'surgery',    label: '手術品質' },
  { id: 'outcome',    label: '結果品質' },
  { id: 'esg',        label: 'ESG' },
] as const;

const ROTATE_INTERVAL = 8000;

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
              className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                i === panel
                  ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {p.label}
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
          {currentPanel.id === 'esg' && <ESGPanel items={esgIndicators} />}

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
const CITY_COORDS: Record<string, [number, number]> = {
  '台北市': [25.0330, 121.5654], '新北市': [25.0116, 121.4648],
  '桃園市': [24.9936, 121.3010], '新竹市': [24.8138, 120.9675],
  '基隆市': [25.1276, 121.7392], '台中市': [24.1477, 120.6736],
  '彰化縣': [24.0518, 120.5161], '南投縣': [23.9609, 120.9719],
  '台南市': [22.9998, 120.2269], '高雄市': [22.6273, 120.3014],
  '屏東縣': [22.5519, 120.5487], '花蓮縣': [23.9871, 121.6015],
  '台東縣': [22.7583, 121.1444],
};

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

  // SVG coordinate mapping: lat/lng -> SVG x,y
  // Bounding box: lat 21.9~25.4, lng 119.9~122.0
  const mapToSVG = (lat: number, lng: number): [number, number] => {
    const x = 60 + (lng - 119.9) / (122.0 - 119.9) * 280;
    const y = 20 + (25.4 - lat) / (25.4 - 21.9) * 460;
    return [x, y];
  };

  return (
    <div className="space-y-6">
      <PanelHeader icon={MapPin} color="from-red-600 to-rose-500" title="傳染病地圖" sub="5 項傳染病 · 13 縣市地區分佈" />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* SVG Map */}
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4 flex items-center justify-center">
          <svg viewBox="0 0 400 500" className="w-full max-w-[500px] h-auto">
            {/* Taiwan outline (simplified) */}
            <path d="M255,38 C265,35 280,42 290,55 C300,68 305,85 308,100 C312,120 318,140 322,165 C328,190 330,215 328,240 C325,260 320,280 312,300 C305,320 295,340 282,358 C270,375 255,390 240,402 C228,412 215,420 200,428 C188,434 175,438 165,438 C152,435 142,428 135,418 C128,405 122,390 118,375 C112,355 108,335 107,315 C108,295 112,275 118,255 C125,235 130,215 132,195 C132,175 128,155 130,138 C135,120 145,105 158,92 C172,78 188,65 205,55 C220,47 240,40 255,38 Z" 
              className="fill-slate-800/40 stroke-slate-600/60" strokeWidth="1.5" />
            {/* City dots with glow */}
            {Object.entries(CITY_COORDS).map(([city, [lat, lng]]) => {
              const [cx, cy] = mapToSVG(lat, lng);
              const total = cityTotals[city] || 0;
              const r = total > 0 ? 5 + (total / maxCityTotal) * 18 : 3;
              // Dominant disease color for this city
              const diseases = cityByDisease[city] || {};
              const dominant = Object.entries(diseases).sort((a, b) => b[1] - a[1])[0];
              const color = dominant ? DISEASE_COLORS[dominant[0]] : '#475569';
              return (
                <g key={city}>
                  {total > 0 && (
                    <circle cx={cx} cy={cy} r={r + 4} fill={color} opacity={0.15} className="animate-map-glow" />
                  )}
                  <circle cx={cx} cy={cy} r={r} fill={color} opacity={total > 0 ? 0.8 : 0.3}
                    stroke={total > 0 ? color : '#475569'} strokeWidth={total > 0 ? 1.5 : 0.5} />
                  <text x={cx} y={cy - r - 4} textAnchor="middle" className="fill-slate-300" fontSize="9" fontWeight="600">
                    {city.replace('市', '').replace('縣', '')}
                  </text>
                  {total > 0 && (
                    <text x={cx} y={cy + 3.5} textAnchor="middle" className="fill-white" fontSize="8" fontWeight="700">
                      {total}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
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
