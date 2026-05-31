import { useState } from 'react';
import { AnalysisResult } from '../utils/analytics';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  analysis: AnalysisResult;
}

export default function OutliersPanel({ analysis }: Props) {
  const { outliers, numericColumns, columnStats } = analysis;
  const [selectedCol, setSelectedCol] = useState(
    outliers.length > 0 ? outliers[0].column : (numericColumns[0] || '')
  );

  const colOutliers = outliers.filter(o => o.column === selectedCol);
  const st = columnStats[selectedCol];

  const scatterData = numericColumns.length > 0 && st ? (() => {
    const isOutlierIdx = new Set(colOutliers.map(o => o.rowIndex));
    return Array.from({ length: Math.min(st.count, 80) }, (_, i) => {
      const isOut = isOutlierIdx.has(i);
      const base = isOut
        ? (colOutliers.find(o => o.rowIndex === i)?.value ?? st.mean ?? 0)
        : (st.mean ?? 0) + (Math.random() - 0.5) * (st.stdDev ?? 0) * 1.5;
      return { index: i + 1, value: parseFloat(base.toFixed(2)), outlier: isOut };
    });
  })() : [];

  const CustomDot = (props: { cx?: number; cy?: number; payload?: { outlier: boolean } }) => {
    const { cx = 0, cy = 0, payload } = props;
    if (payload?.outlier) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={7} fill="#f59e0b" opacity={0.9} />
          <circle cx={cx} cy={cy} r={12} fill="none" stroke="#f59e0b" strokeWidth={1} opacity={0.4} />
        </g>
      );
    }
    return <circle cx={cx} cy={cy} r={3} fill="#00f5ff" opacity={0.4} />;
  };

  const zLabel = (z: number) => {
    const a = Math.abs(z);
    if (a > 4) return { label: 'Extreme', color: '#ef4444' };
    if (a > 3) return { label: 'High', color: '#f59e0b' };
    return { label: 'Notable', color: '#f97316' };
  };

  if (numericColumns.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-4xl mb-4">⚡</div>
        <div className="text-slate-400">No numeric columns available for outlier analysis.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #f59e0b, #ef4444)' }} />
        Outlier Detection
      </h2>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm text-slate-400">Analyzing column:</div>
        <div className="flex gap-1 flex-wrap">
          {numericColumns.map(col => (
            <button key={col} onClick={() => setSelectedCol(col)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: selectedCol === col ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedCol === col ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: selectedCol === col ? '#f59e0b' : '#64748b',
              }}>
              {col}
            </button>
          ))}
        </div>
      </div>

      {outliers.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <div className="text-5xl mb-4">🎯</div>
          <div className="text-xl font-bold text-white mb-2">Clean Data!</div>
          <div className="text-slate-400">No outliers detected beyond 2.5 standard deviations in any column.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Scatter chart */}
          <div className="glass-card p-5">
            <div className="text-sm font-semibold text-slate-300 mb-1">{selectedCol} — Distribution</div>
            <div className="text-xs text-slate-500 mb-4">
              🟡 Outliers (z &gt; 2.5σ) &nbsp;·&nbsp; 🔵 Normal values
            </div>
            {st && (
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="index" name="Row" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="value" name="Value" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="custom-tooltip" style={{ padding: '8px 12px' }}>
                          <div className="text-xs text-slate-400">Row #{d?.index}</div>
                          <div className="text-sm font-bold text-white">{d?.value?.toLocaleString()}</div>
                          {d?.outlier && <div className="text-xs text-amber-400">⚠️ Outlier detected</div>}
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={st.mean} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: 'mean', fill: '#64748b', fontSize: 10 }} />
                  <ReferenceLine y={(st.mean ?? 0) + 2.5 * (st.stdDev ?? 0)} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" />
                  <ReferenceLine y={(st.mean ?? 0) - 2.5 * (st.stdDev ?? 0)} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 4" />
                  <Scatter data={scatterData} shape={<CustomDot />}>
                    {scatterData.map((entry, i) => (
                      <Cell key={i} fill={entry.outlier ? '#f59e0b' : '#00f5ff'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
            {st && (
              <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="font-bold text-white">{st.mean?.toFixed(2)}</div>
                  <div className="text-slate-500">Mean</div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="font-bold text-white">±{st.stdDev?.toFixed(2)}</div>
                  <div className="text-slate-500">Std Dev</div>
                </div>
                <div className="p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)' }}>
                  <div className="font-bold text-amber-400">{colOutliers.length}</div>
                  <div className="text-slate-500">Outliers</div>
                </div>
              </div>
            )}
          </div>

          {/* Outlier list */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-300">
              {colOutliers.length > 0 ? `${colOutliers.length} Outlier${colOutliers.length > 1 ? 's' : ''} in "${selectedCol}"` : `No outliers in "${selectedCol}"`}
            </div>

            {colOutliers.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-400 text-sm">
                ✅ No outliers detected in this column
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {colOutliers.map((o, i) => {
                  const { label, color } = zLabel(o.zscore);
                  return (
                    <div key={i} className="glass-card p-4 animate-slide-up"
                      style={{
                        borderColor: 'rgba(245,158,11,0.2)',
                        background: 'rgba(245,158,11,0.04)',
                        animationDelay: `${i * 0.06}s`,
                        animationFillMode: 'both',
                      }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="outlier-badge" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                              {o.direction === 'high' ? '↑' : '↓'} {label}
                            </span>
                            <span className="text-xs text-slate-500">Row #{o.rowIndex + 1}</span>
                          </div>
                          <div className="text-lg font-black text-white stat-number">{o.value.toLocaleString()}</div>
                          <div className="text-xs text-slate-400 mt-1 leading-relaxed">{o.insight}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-black stat-number" style={{ color }}>
                            {o.zscore >= 0 ? '+' : ''}{o.zscore.toFixed(2)}σ
                          </div>
                          <div className="text-xs text-slate-500">z-score</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* All columns with outlier count */}
            <div className="glass-card p-4">
              <div className="text-xs text-slate-500 mb-3 font-semibold">Outliers by Column</div>
              <div className="space-y-2">
                {numericColumns.map(col => {
                  const count = outliers.filter(o => o.column === col).length;
                  const pct = st?.count ? count / (st.count) * 100 : 0;
                  return (
                    <div key={col} className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                      onClick={() => setSelectedCol(col)}>
                      <div className="w-24 text-xs text-slate-400 truncate">{col}</div>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct * 10, 100)}%`,
                            background: count > 0 ? '#f59e0b' : '#1e293b',
                          }} />
                      </div>
                      <div className="w-4 text-xs text-right" style={{ color: count > 0 ? '#f59e0b' : '#475569' }}>
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
