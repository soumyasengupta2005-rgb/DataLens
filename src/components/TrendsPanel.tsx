import { AnalysisResult, TrendResult } from '../utils/analytics';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface Props {
  analysis: AnalysisResult;
}

const directionConfig = {
  increasing: { icon: '📈', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', label: 'Increasing' },
  decreasing: { icon: '📉', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'Decreasing' },
  stable: { icon: '➡️', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', label: 'Stable' },
  volatile: { icon: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'Volatile' },
};

function MiniTrendChart({ trend, analysis }: { trend: TrendResult; analysis: AnalysisResult }) {
  const { column, direction, slope } = trend;
  const st = analysis.columnStats[column];
  if (!st || st.type !== 'numeric') return null;

  const n = 20;
  const data = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const base = direction === 'increasing' ? (st.min ?? 0) + ((st.max ?? 1) - (st.min ?? 0)) * t
      : direction === 'decreasing' ? (st.max ?? 1) - ((st.max ?? 1) - (st.min ?? 0)) * t
      : (st.mean ?? 0);
    const noise = (st.stdDev ?? 0) * (direction === 'volatile' ? 1.2 : 0.3) * (Math.random() - 0.5);
    const val = base + noise + slope * i * 0.5;
    return { i: i + 1, v: Math.max(st.min ?? val - 1, Math.min(st.max ?? val + 1, val)) };
  });

  const cfg = directionConfig[direction];

  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`grad-${column}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={cfg.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={cfg.color} fill={`url(#grad-${column})`}
          strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function TrendsPanel({ analysis }: Props) {
  const { trends, numericColumns } = analysis;

  if (numericColumns.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-4xl mb-4">📈</div>
        <div className="text-slate-400">No numeric columns found for trend analysis.</div>
      </div>
    );
  }

  const counts = {
    increasing: trends.filter(t => t.direction === 'increasing').length,
    decreasing: trends.filter(t => t.direction === 'decreasing').length,
    stable: trends.filter(t => t.direction === 'stable').length,
    volatile: trends.filter(t => t.direction === 'volatile').length,
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #10b981, #3b82f6)' }} />
        Trend Detection
      </h2>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(counts) as [TrendResult['direction'], number][]).map(([dir, count]) => {
          const cfg = directionConfig[dir];
          return (
            <div key={dir} className="glass-card p-4 text-center"
              style={{ background: cfg.bg, borderColor: cfg.border }}>
              <div className="text-2xl mb-1">{cfg.icon}</div>
              <div className="text-2xl font-black" style={{ color: cfg.color }}>{count}</div>
              <div className="text-xs text-slate-400">{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Trend cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((trend, i) => {
          const cfg = directionConfig[trend.direction];
          return (
            <div key={trend.column} className="glass-card p-4 animate-slide-up"
              style={{
                background: cfg.bg,
                borderColor: cfg.border,
                animationDelay: `${i * 0.07}s`,
                animationFillMode: 'both',
              }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-white truncate max-w-[130px]">{trend.column}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-base">{cfg.icon}</span>
                    <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold stat-number" style={{ color: cfg.color }}>
                    {trend.slope >= 0 ? '+' : ''}{trend.slope.toFixed(3)}
                  </div>
                  <div className="text-xs text-slate-500">slope</div>
                </div>
              </div>

              <MiniTrendChart trend={trend} analysis={analysis} />

              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">R² fit</span>
                  <span className="text-xs font-semibold" style={{ color: cfg.color }}>
                    {(trend.rSquared * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-1 rounded-full transition-all"
                    style={{ width: `${trend.rSquared * 100}%`, background: cfg.color }} />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-400 leading-relaxed">{trend.insight}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
