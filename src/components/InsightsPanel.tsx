import { useState } from 'react';
import { AnalysisResult, InsightCard } from '../utils/analytics';

interface Props {
  analysis: AnalysisResult;
}

const categoryConfig = {
  summary: { label: 'Summary', color: '#00f5ff', bg: 'rgba(0,245,255,0.08)', border: 'rgba(0,245,255,0.2)' },
  correlation: { label: 'Correlation', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
  trend: { label: 'Trend', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  outlier: { label: 'Outlier', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  distribution: { label: 'Distribution', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.2)' },
};

const typeConfig = {
  info: { border: 'rgba(96,165,250,0.2)', glow: 'rgba(96,165,250,0.05)' },
  positive: { border: 'rgba(16,185,129,0.2)', glow: 'rgba(16,185,129,0.05)' },
  negative: { border: 'rgba(239,68,68,0.2)', glow: 'rgba(239,68,68,0.05)' },
  warning: { border: 'rgba(245,158,11,0.25)', glow: 'rgba(245,158,11,0.06)' },
  neutral: { border: 'rgba(255,255,255,0.08)', glow: 'rgba(255,255,255,0.02)' },
};

type Category = 'all' | InsightCard['category'];

export default function InsightsPanel({ analysis }: Props) {
  const { insights } = analysis;
  const [filter, setFilter] = useState<Category>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'all' ? insights : insights.filter(i => i.category === filter);

  const categoryCounts: Record<string, number> = {};
  for (const ins of insights) {
    categoryCounts[ins.category] = (categoryCounts[ins.category] || 0) + 1;
  }

  const filters: { id: Category; label: string }[] = [
    { id: 'all', label: `All (${insights.length})` },
    ...Object.keys(categoryConfig).map(cat => ({
      id: cat as Category,
      label: `${categoryConfig[cat as keyof typeof categoryConfig].label} (${categoryCounts[cat] || 0})`,
    })).filter(f => categoryCounts[f.id] > 0),
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #8b5cf6, #ec4899)' }} />
          Natural Language Insights
        </h2>
        <div className="text-xs px-2.5 py-1 rounded-full text-purple-300"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
          🧠 Rule-based AI
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(({ id, label }) => {
          const cfg = id !== 'all' ? categoryConfig[id as keyof typeof categoryConfig] : null;
          return (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filter === id
                  ? (cfg?.bg ?? 'rgba(255,255,255,0.1)')
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === id ? (cfg?.border ?? 'rgba(255,255,255,0.3)') : 'rgba(255,255,255,0.08)'}`,
                color: filter === id ? (cfg?.color ?? 'white') : '#64748b',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Insights grid */}
      <div className="space-y-3">
        {filtered.map((insight, i) => {
          const catCfg = categoryConfig[insight.category];
          const typeCfg = typeConfig[insight.type];
          const isExpanded = expanded === insight.id;

          return (
            <div
              key={insight.id}
              className="insight-card glass-card p-4 cursor-pointer animate-slide-up"
              style={{
                background: typeCfg.glow,
                borderColor: typeCfg.border,
                animationDelay: `${i * 0.05}s`,
                animationFillMode: 'both',
              }}
              onClick={() => setExpanded(isExpanded ? null : insight.id)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: catCfg.bg, border: `1px solid ${catCfg.border}` }}>
                  {insight.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-white text-sm leading-snug">{insight.title}</div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {insight.value && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full stat-number"
                          style={{ background: catCfg.bg, color: catCfg.color, border: `1px solid ${catCfg.border}` }}>
                          {insight.value}
                        </span>
                      )}
                      <span className="text-slate-500 text-lg">{isExpanded ? '−' : '+'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
                      style={{ background: catCfg.bg, color: catCfg.color, fontSize: '9px' }}>
                      {catCfg.label}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
                      style={{
                        background: insight.type === 'positive' ? 'rgba(16,185,129,0.1)' : insight.type === 'negative' ? 'rgba(239,68,68,0.1)' : insight.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(96,165,250,0.1)',
                        color: insight.type === 'positive' ? '#10b981' : insight.type === 'negative' ? '#ef4444' : insight.type === 'warning' ? '#f59e0b' : '#60a5fa',
                        fontSize: '9px',
                      }}>
                      {insight.type}
                    </span>
                  </div>

                  {isExpanded && (
                    <p className="mt-3 text-sm text-slate-300 leading-relaxed border-t pt-3 animate-fade-in"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      {insight.description}
                    </p>
                  )}

                  {!isExpanded && (
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-1">
                      {insight.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card p-12 text-center text-slate-400 text-sm">
          No insights in this category.
        </div>
      )}

      {/* Stats footer */}
      <div className="glass-card p-5">
        <div className="text-sm font-semibold text-slate-400 mb-4">Insight Breakdown</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(categoryConfig).map(([cat, cfg]) => (
            <div key={cat} className="text-center p-3 rounded-xl"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="text-2xl font-black" style={{ color: cfg.color }}>
                {categoryCounts[cat] || 0}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{cfg.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
