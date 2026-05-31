import { useState } from 'react';
import { AnalysisResult, Correlation } from '../utils/analytics';

interface Props {
  analysis: AnalysisResult;
}

function getColor(r: number): string {
  if (r >= 0.8) return '#00f5ff';
  if (r >= 0.6) return '#06b6d4';
  if (r >= 0.4) return '#3b82f6';
  if (r >= 0.2) return '#6366f1';
  if (r >= -0.2) return '#334155';
  if (r >= -0.4) return '#7c3aed';
  if (r >= -0.6) return '#9333ea';
  if (r >= -0.8) return '#c026d3';
  return '#ec4899';
}

function getTextColor(r: number): string {
  return Math.abs(r) > 0.5 ? '#fff' : '#94a3b8';
}

function strengthLabel(r: number): { label: string; color: string } {
  const a = Math.abs(r);
  if (a >= 0.9) return { label: 'Very Strong', color: r > 0 ? '#00f5ff' : '#ec4899' };
  if (a >= 0.7) return { label: 'Strong', color: r > 0 ? '#06b6d4' : '#c026d3' };
  if (a >= 0.5) return { label: 'Moderate', color: r > 0 ? '#3b82f6' : '#7c3aed' };
  if (a >= 0.3) return { label: 'Weak', color: '#6366f1' };
  return { label: 'Very Weak', color: '#334155' };
}

export default function CorrelationHeatmap({ analysis }: Props) {
  const { numericColumns, heatmapData, correlations } = analysis;
  const [hoveredCell, setHoveredCell] = useState<{ col1: string; col2: string; r: number } | null>(null);
  const [selectedCorr, setSelectedCorr] = useState<Correlation | null>(null);

  if (numericColumns.length < 2) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-4xl mb-4">🔗</div>
        <div className="text-slate-400">Need at least 2 numeric columns to compute correlations.</div>
      </div>
    );
  }

  const shortName = (s: string) => s.length > 10 ? s.slice(0, 9) + '…' : s;
  const topCorrs = correlations.filter(c => Math.abs(c.r) >= 0.4).slice(0, 6);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #ec4899, #8b5cf6)' }} />
        Correlation Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Heatmap */}
        <div className="glass-card p-5">
          <div className="text-sm font-semibold text-slate-300 mb-4">Correlation Heatmap</div>

          {/* Legend */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-500">-1.0</span>
            <div className="flex-1 h-3 rounded-full" style={{
              background: 'linear-gradient(90deg, #ec4899, #7c3aed, #334155, #3b82f6, #00f5ff)'
            }} />
            <span className="text-xs text-slate-500">+1.0</span>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block">
              {/* Column headers */}
              <div className="flex" style={{ marginLeft: '80px' }}>
                {numericColumns.map(col => (
                  <div key={col} className="w-12 text-center text-xs text-slate-500 mb-1 truncate" style={{ width: '48px' }}>
                    <span className="block rotate-[-45deg] origin-bottom-left translate-y-2 translate-x-3 truncate max-w-[40px]">
                      {shortName(col)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px' }}>
                {heatmapData.map((row, ri) => (
                  <div key={ri} className="flex items-center gap-1 mb-1">
                    <div className="text-xs text-slate-400 text-right pr-2 truncate" style={{ width: '80px' }}>
                      {shortName(numericColumns[ri])}
                    </div>
                    {row.map((cell, ci) => (
                      <div
                        key={ci}
                        className="heatmap-cell flex items-center justify-center text-xs font-bold cursor-pointer"
                        style={{
                          width: '44px',
                          height: '44px',
                          background: getColor(cell.r),
                          opacity: ri === ci ? 0.5 : 1,
                          color: getTextColor(cell.r),
                          fontSize: '10px',
                        }}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (ri !== ci) {
                            const found = correlations.find(c =>
                              (c.col1 === cell.col1 && c.col2 === cell.col2) ||
                              (c.col1 === cell.col2 && c.col2 === cell.col1)
                            );
                            if (found) setSelectedCorr(found);
                          }
                        }}
                      >
                        {ri === ci ? '1' : cell.r.toFixed(1)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hover tooltip */}
          {hoveredCell && hoveredCell.col1 !== hoveredCell.col2 && (
            <div className="mt-4 p-3 rounded-xl text-sm animate-fade-in"
              style={{ background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  <span className="text-white font-semibold">{hoveredCell.col1}</span> × <span className="text-white font-semibold">{hoveredCell.col2}</span>
                </span>
                <span className="font-bold text-lg" style={{ color: getColor(hoveredCell.r) }}>
                  r = {hoveredCell.r.toFixed(3)}
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: strengthLabel(hoveredCell.r).color }}>
                {strengthLabel(hoveredCell.r).label} {hoveredCell.r > 0 ? 'Positive' : 'Negative'} Correlation
              </div>
            </div>
          )}
        </div>

        {/* Top correlations list */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-300">Notable Relationships</div>
          {topCorrs.length === 0 ? (
            <div className="glass-card p-6 text-center text-slate-400 text-sm">
              No strong correlations found (threshold: |r| ≥ 0.4)
            </div>
          ) : (
            topCorrs.map((corr, i) => {
              const { label: sLabel, color: sColor } = strengthLabel(corr.r);
              const isSelected = selectedCorr?.col1 === corr.col1 && selectedCorr?.col2 === corr.col2;
              return (
                <div
                  key={i}
                  className="glass-card p-4 cursor-pointer animate-slide-up transition-all"
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    animationFillMode: 'both',
                    borderColor: isSelected ? 'rgba(0,245,255,0.5)' : undefined,
                    background: isSelected ? 'rgba(0,245,255,0.08)' : undefined,
                  }}
                  onClick={() => setSelectedCorr(isSelected ? null : corr)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">
                      <span className="font-semibold text-white">{corr.col1}</span>
                      <span className="text-slate-500 mx-2">{corr.r > 0 ? '↗' : '↘'}</span>
                      <span className="font-semibold text-white">{corr.col2}</span>
                    </div>
                    <div className="font-black text-lg stat-number" style={{ color: getColor(corr.r) }}>
                      {corr.r.toFixed(2)}
                    </div>
                  </div>

                  {/* Bar visualization */}
                  <div className="relative h-1.5 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="absolute top-0 h-1.5 rounded-full" style={{
                      left: corr.r < 0 ? `${(1 - Math.abs(corr.r)) * 50}%` : '50%',
                      width: `${Math.abs(corr.r) * 50}%`,
                      background: getColor(corr.r),
                    }} />
                    <div className="absolute top-[-3px] left-1/2 w-0.5 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
                  </div>

                  <div className="text-xs font-semibold" style={{ color: sColor }}>{sLabel} {corr.r > 0 ? 'Positive' : 'Negative'}</div>

                  {isSelected && (
                    <div className="mt-3 text-xs text-slate-400 leading-relaxed border-t pt-3 animate-fade-in"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      {corr.insight}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* All correlations summary */}
          <div className="glass-card p-4 text-sm">
            <div className="text-slate-400 mb-2">All {correlations.length} Pairs</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Strong +', count: correlations.filter(c => c.r >= 0.7).length, color: '#00f5ff' },
                { label: 'Neutral', count: correlations.filter(c => Math.abs(c.r) < 0.3).length, color: '#475569' },
                { label: 'Strong -', count: correlations.filter(c => c.r <= -0.7).length, color: '#ec4899' },
              ].map(({ label, count, color }) => (
                <div key={label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-lg font-black" style={{ color }}>{count}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected correlation detail */}
      {selectedCorr && (
        <div className="glass-card p-5 animate-slide-up"
          style={{ borderColor: 'rgba(0,245,255,0.3)', background: 'rgba(0,245,255,0.03)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-cyan-400 font-semibold uppercase tracking-widest mb-1">Detailed Insight</div>
              <div className="text-white font-semibold mb-2">{selectedCorr.col1} ↔ {selectedCorr.col2}</div>
              <p className="text-slate-300 text-sm leading-relaxed">{selectedCorr.insight}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-3xl font-black" style={{ color: getColor(selectedCorr.r) }}>
                {selectedCorr.r.toFixed(3)}
              </div>
              <div className="text-xs text-slate-500">Pearson r</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
