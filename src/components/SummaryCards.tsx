import { AnalysisResult } from '../utils/analytics';
import { Database, Hash, TrendingUp, AlertTriangle, GitBranch, CheckCircle } from 'lucide-react';

interface Props {
  analysis: AnalysisResult;
}

export default function SummaryCards({ analysis }: Props) {
  const { rowCount, colCount, numericColumns, categoricalColumns, correlations, outliers, columnStats } = analysis;

  const strongCorrs = correlations.filter(c => Math.abs(c.r) >= 0.7).length;
  const firstNumCol = numericColumns[0];
  const avgValue = firstNumCol ? columnStats[firstNumCol].mean : null;

  const cards = [
    {
      icon: Database,
      label: 'Total Rows',
      value: rowCount.toLocaleString(),
      sub: `${colCount} columns`,
      color: 'cyan',
      bg: 'rgba(0,245,255,0.08)',
      border: 'rgba(0,245,255,0.2)',
      iconColor: '#00f5ff',
    },
    {
      icon: Hash,
      label: 'Numeric Columns',
      value: numericColumns.length.toString(),
      sub: `${categoricalColumns.length} categorical`,
      color: 'purple',
      bg: 'rgba(139,92,246,0.08)',
      border: 'rgba(139,92,246,0.2)',
      iconColor: '#8b5cf6',
    },
    {
      icon: GitBranch,
      label: 'Strong Correlations',
      value: strongCorrs.toString(),
      sub: `of ${correlations.length} pairs`,
      color: 'pink',
      bg: 'rgba(236,72,153,0.08)',
      border: 'rgba(236,72,153,0.2)',
      iconColor: '#ec4899',
    },
    {
      icon: AlertTriangle,
      label: 'Outliers Found',
      value: outliers.length.toString(),
      sub: outliers.length > 0 ? 'Check outliers tab' : 'Clean data',
      color: outliers.length > 0 ? 'amber' : 'green',
      bg: outliers.length > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
      border: outliers.length > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
      iconColor: outliers.length > 0 ? '#f59e0b' : '#10b981',
    },
    {
      icon: TrendingUp,
      label: firstNumCol ? `Avg ${firstNumCol}` : 'Analysis Ready',
      value: (avgValue !== null && avgValue !== undefined) ? avgValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '✓',
      sub: firstNumCol ? `mean value` : 'All systems go',
      color: 'green',
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.2)',
      iconColor: '#10b981',
    },
    {
      icon: CheckCircle,
      label: 'Data Quality',
      value: (() => {
        const totalMissing = Object.values(columnStats).reduce((acc, s) => acc + s.missing, 0);
        const totalCells = rowCount * colCount;
        const pct = totalCells > 0 ? ((1 - totalMissing / totalCells) * 100) : 100;
        return `${pct.toFixed(1)}%`;
      })(),
      sub: 'completeness',
      color: 'cyan',
      bg: 'rgba(0,245,255,0.06)',
      border: 'rgba(0,245,255,0.15)',
      iconColor: '#00f5ff',
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #00f5ff, #8b5cf6)' }} />
        Dataset Summary
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(({ icon: Icon, label, value, sub, bg, border, iconColor }, i) => (
          <div
            key={label}
            className="glass-card p-4 animate-slide-up"
            style={{
              background: bg,
              borderColor: border,
              animationDelay: `${i * 0.08}s`,
              animationFillMode: 'both',
            }}
          >
            <Icon className="w-5 h-5 mb-3" style={{ color: iconColor }} />
            <div className="text-2xl font-black text-white stat-number mb-0.5 animate-count-up"
              style={{ animationDelay: `${i * 0.08 + 0.2}s`, animationFillMode: 'both' }}>
              {value}
            </div>
            <div className="text-xs font-semibold text-slate-300">{label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Column Quick Stats */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Column Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {numericColumns.slice(0, 6).map((col, i) => {
            const st = columnStats[col];
            const range = (st.max ?? 0) - (st.min ?? 0);
            const pctFromMin = range > 0 ? ((st.mean ?? 0) - (st.min ?? 0)) / range * 100 : 50;
            return (
              <div key={col} className="glass-card p-4 animate-slide-up"
                style={{ animationDelay: `${0.3 + i * 0.08}s`, animationFillMode: 'both' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-semibold text-white truncate max-w-[120px]">{col}</div>
                    <div className="text-xs text-slate-500">numeric</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-cyan-400 stat-number">
                      {st.mean?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500">mean</div>
                  </div>
                </div>

                {/* Mini bar showing mean vs range */}
                <div className="relative mb-2">
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="absolute top-0 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${pctFromMin}%`,
                      background: 'linear-gradient(90deg, #00f5ff, #8b5cf6)',
                      transition: 'width 1s ease',
                    }} />
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                  <span>{st.min?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                  <span className="text-slate-400">σ={st.stdDev?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span>{st.max?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Categorical columns */}
        {categoricalColumns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {categoricalColumns.slice(0, 3).map((col, i) => {
              const st = columnStats[col];
              const top = st.topValues ?? [];
              const total = top.reduce((s, t) => s + t.count, 0);
              const colors = ['#00f5ff', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
              return (
                <div key={col} className="glass-card p-4 animate-slide-up"
                  style={{ animationDelay: `${0.5 + i * 0.08}s`, animationFillMode: 'both' }}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-semibold text-white truncate">{col}</div>
                    <div className="text-xs px-2 py-0.5 rounded-full text-purple-300"
                      style={{ background: 'rgba(139,92,246,0.15)' }}>
                      categorical
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {top.slice(0, 4).map(({ value, count }, vi) => (
                      <div key={vi} className="flex items-center gap-2">
                        <div className="w-20 text-xs text-slate-400 truncate">{value}</div>
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${total > 0 ? (count / total) * 100 : 0}%`,
                              background: colors[vi],
                              opacity: 0.8,
                            }} />
                        </div>
                        <div className="text-xs text-slate-500 w-6 text-right">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
