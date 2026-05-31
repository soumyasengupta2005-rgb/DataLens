import { useState } from 'react';
import { AnalysisResult } from '../utils/analytics';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, Legend, Cell
} from 'recharts';

interface Props {
  analysis: AnalysisResult;
  compact?: boolean;
}

const COLORS = ['#00f5ff', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      {label && <div className="text-xs text-slate-400 mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">{typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ChartsPanel({ analysis, compact = false }: Props) {
  const { numericColumns, columnStats, correlations } = analysis;
  const filteredNumericColumns = numericColumns.filter(
    col => !columnStats[col]?.isIdentifier
  );
  const [selectedCol, setSelectedCol] = useState(filteredNumericColumns[0] || '');
  const [chartType, setChartType] = useState<'area' | 'bar' | 'scatter'>('area');

  // Build time-series like data for the selected column
  const buildColData = (col: string) => {
  const values = sampleData(analysis.rawData[col], 400);
  if (!values) return [];

  return values.map((v, i) => ({
    index: i + 1,
    value: v,
  }));
};
  const sampleData = (values: number[], maxPoints = 300) => {
  if (values.length <= maxPoints) return values;

  const step = values.length / maxPoints;

  const sampled = [];

  for (let i = 0; i < maxPoints; i++) {
    sampled.push(values[Math.floor(i * step)]);
  }

  return sampled;
};
  

  // Multi-column overview data
  const buildOverviewData = () => {
    return filteredNumericColumns.map(col => ({
      column: col,
      mean: columnStats[col]?.mean ?? 0
    }));
  };

  const buildOverlayData = () => {
    const cols = filteredNumericColumns.slice(0, 3);
    if (!cols.length) return [];

    const length = Math.min(
      ...cols.map(col => sampleData(analysis.rawData[col])?.length || 0)
    );

    const data = [];

    for (let i = 0; i < length; i++) {
      const row: any = { index: i + 1 };

      for (const col of cols) {
        const values = sampleData(analysis.rawData[col]);
        const min = Math.min(...values);
        const max = Math.max(...values);

        const normalized =
          max === min
            ? 50
            : ((values[i] - min) / (max - min)) * 100;

        row[col] = parseFloat(normalized.toFixed(2));
      }

      data.push(row);
    }

    return data;
  };

  // Scatter data for top correlation pair
  const buildScatterData = () => {
    const topCorr = correlations[0];
    if (!topCorr) return { data: [], col1: '', col2: '' };
    const { col1, col2 } = topCorr;
    const st1 = columnStats[col1];
    const st2 = columnStats[col2];
    if (!st1 || !st2) return { data: [], col1, col2 };
    const count = Math.min(st1.count, st2.count, 60);
    const data = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const r = topCorr.r;
      const x = (st1.min ?? 0) + ((st1.max ?? 1) - (st1.min ?? 0)) * t + (Math.random() - 0.5) * (st1.stdDev ?? 1);
      const yBase = r > 0
        ? (st2.min ?? 0) + ((st2.max ?? 1) - (st2.min ?? 0)) * t
        : (st2.max ?? 1) - ((st2.max ?? 1) - (st2.min ?? 0)) * t;
      const y = yBase + (Math.random() - 0.5) * (st2.stdDev ?? 1) * (1 - Math.abs(r));
      data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
    }
    return { data, col1, col2 };
  };

  const colData = buildColData(selectedCol);
  const overviewData = buildOverviewData();
  const { data: scatterData, col1: sc1, col2: sc2 } = buildScatterData();

  if (filteredNumericColumns.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-4xl mb-4">📊</div>
        <div className="text-slate-400">No numeric columns found for charting.</div>
      </div>
    );
  }

  return (
    <div id="charts-report-section" className="space-y-5">
      {!compact && (
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #00f5ff, #8b5cf6)' }} />
          Charts & Visualizations
        </h2>
      )}

      {/* Column Selector + Chart Type */}
      {!compact && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['area', 'bar', 'scatter'] as const).map(type => (
              <button key={type} onClick={() => setChartType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${chartType === type ? 'text-white' : 'text-slate-500'}`}
                style={chartType === type ? { background: 'rgba(0,245,255,0.15)', color: '#00f5ff' } : {}}>
                {type === 'area' ? '📈 Area' : type === 'bar' ? '📊 Bar' : '⚡ Scatter'}
              </button>
            ))}
          </div>
          {chartType !== 'scatter' && (
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              className="text-sm text-white rounded-xl px-3 py-2 cursor-pointer outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {filteredNumericColumns.map(c => <option key={c} value={c} style={{ background: '#0a0f2e' }}>{c}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Main chart */}
      <div id="trend-chart" className="glass-card p-5">
        {compact && (
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-slate-300">
              {filteredNumericColumns[0]} — Distribution Preview
            </div>
            <div className="text-xs text-slate-500">area chart</div>
          </div>
        )}

        {(!compact && chartType === 'area') || compact ? (
          <div>
            {compact || <div className="text-sm font-semibold text-slate-300 mb-4">{selectedCol} — Trend Over Records</div>}
            <ResponsiveContainer width="100%" height={compact ? 180 : 280}>
              <AreaChart data={compact ? buildColData(filteredNumericColumns[0]) : colData}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="index" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name={compact ? filteredNumericColumns[0] : selectedCol}
                  stroke="#00f5ff" fill="url(#grad1)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#00f5ff', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : chartType === 'bar' ? (
          <div>
            <div className="text-sm font-semibold text-slate-300 mb-4">{selectedCol} — Distribution</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={colData.filter((_, i) => i % 2 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="index" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name={selectedCol} radius={[4, 4, 0, 0]}>
                  {colData.filter((_, i) => i % 2 === 0).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div>
            {scatterData.length > 0 ? (
              <>
                <div className="text-sm font-semibold text-slate-300 mb-1">{sc1} vs {sc2}</div>
                <div className="text-xs text-slate-500 mb-4">Top correlation pair (r={correlations[0]?.r.toFixed(2)})</div>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="x" name={sc1} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="y" name={sc2} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Scatter name={`${sc1} vs ${sc2}`} data={scatterData} fill="#00f5ff" opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="text-center text-slate-400 py-12">Need at least 2 numeric columns for scatter plot.</div>
            )}
          </div>
        )}
      </div>

      {/* Column Overview Bar Chart */}
      {overviewData.length > 1 && (
        <div id="means-chart" className="glass-card p-5">
          <div className="text-sm font-semibold text-slate-300 mb-4">Column Means Comparison</div>
          <ResponsiveContainer width="100%" height={compact ? 160 : 220}>
            <BarChart data={overviewData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="column" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mean" name="Mean" radius={[0, 4, 4, 0]}>
                {overviewData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Multi-line chart for multiple columns */}
      {!compact && filteredNumericColumns.length >= 2 && (
        <div id="overlay-chart" className="glass-card p-5">
          <div className="text-sm font-semibold text-slate-300 mb-1">Multi-Column Overlay</div>
          <div className="text-xs text-slate-500 mb-4">Actual values (first {Math.min(filteredNumericColumns.length, 3)} numeric columns)</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={buildOverlayData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="index" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              {filteredNumericColumns.slice(0, 3).map((col, i) => (
                <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i]} strokeWidth={2}
                  dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
