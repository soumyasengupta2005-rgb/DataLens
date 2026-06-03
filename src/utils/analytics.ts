export interface ColumnStats {
  name: string;
  type: "numeric" | "categorical" | "date";
  count: number;
  missing: number;
  unique: number;
  isIdentifier?: boolean;
  // numeric only
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  variance?: number;
  q1?: number;
  q3?: number;
  skewness?: number;
  // categorical only
  topValues?: { value: string; count: number }[];
}

export interface Correlation {
  col1: string;
  col2: string;
  r: number;
  strength:
    | "strong-positive"
    | "moderate-positive"
    | "weak"
    | "moderate-negative"
    | "strong-negative";
  insight: string;
}

export interface Outlier {
  column: string;
  rowIndex: number;
  value: number;
  zscore: number;
  direction: "high" | "low";
  insight: string;
}

export interface TrendResult {
  column: string;
  direction: "increasing" | "decreasing" | "stable" | "volatile";
  slope: number;
  rSquared: number;
  insight: string;
}

export interface InsightCard {
  id: string;
  type: "info" | "positive" | "negative" | "warning" | "neutral";
  icon: string;
  title: string;
  description: string;
  value?: string;
  category: "summary" | "correlation" | "trend" | "outlier" | "distribution";
}

export interface AnalysisResult {
  rowCount: number;
  colCount: number;
  numericColumns: string[];
  categoricalColumns: string[];
  columnStats: Record<string, ColumnStats>;
  correlations: Correlation[];
  outliers: Outlier[];
  trends: TrendResult[];
  insights: InsightCard[];
  heatmapData: { col1: string; col2: string; r: number }[][];
  rawData: Record<string, number[]>;
}

// --- Math Helpers ---
export function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function stdDev(arr: number[]): number {
  const m = mean(arr);
  const variance =
    arr.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

export function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let num = 0,
    dx2 = 0,
    dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  if (dx2 === 0 || dy2 === 0) return 0;
  return num / Math.sqrt(dx2 * dy2);
}

export function skewness(arr: number[]): number {
  const m = mean(arr);
  const sd = stdDev(arr);
  if (sd === 0) return 0;
  const n = arr.length;
  const cubedDiffs = arr.reduce((acc, v) => acc + Math.pow((v - m) / sd, 3), 0);
  return (n / ((n - 1) * (n - 2))) * cubedDiffs;
}

function linearRegression(y: number[]): { slope: number; rSquared: number } {
  const n = y.length;
  if (n < 2) return { slope: 0, rSquared: 0 };
  const x = Array.from({ length: n }, (_, i) => i);
  const mx = mean(x);
  const my = mean(y);
  let num = 0,
    denom = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    denom += (x[i] - mx) ** 2;
  }
  const slope = denom === 0 ? 0 : num / denom;
  const intercept = my - slope * mx;
  const predicted = x.map((xi) => slope * xi + intercept);
  const ssTot = y.reduce((acc, yi) => acc + (yi - my) ** 2, 0);
  const ssRes = y.reduce((acc, yi, i) => acc + (yi - predicted[i]) ** 2, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, rSquared };
}

function detectColumnType(
  values: string[],
): "numeric" | "categorical" | "date" {
  const nonEmpty = values.filter(
    (v) => v !== "" && v !== null && v !== undefined,
  );
  const numericCount = nonEmpty.filter(
    (v) => !isNaN(Number(v)) && v.trim() !== "",
  ).length;
  if (numericCount / nonEmpty.length > 0.8) return "numeric";
  const dateCount = nonEmpty.filter((v) => !isNaN(Date.parse(v))).length;
  if (dateCount / nonEmpty.length > 0.7) return "date";
  return "categorical";
}

function correlationStrength(r: number): Correlation["strength"] {
  const abs = Math.abs(r);
  if (abs >= 0.8) return r > 0 ? "strong-positive" : "strong-negative";
  if (abs >= 0.5) return r > 0 ? "moderate-positive" : "moderate-negative";
  return "weak";
}

function correlationInsight(col1: string, col2: string, r: number): string {
  const abs = Math.abs(r);
  const dir = r > 0 ? "positive" : "negative";
  if (abs >= 0.9)
    return `Extremely strong ${dir} relationship between "${col1}" and "${col2}" (r=${r.toFixed(2)}). They move almost in perfect ${r > 0 ? "sync" : "opposition"}.`;
  if (abs >= 0.8)
    return `Strong ${dir} correlation between "${col1}" and "${col2}" (r=${r.toFixed(2)}). As one increases, the other tends to ${r > 0 ? "increase" : "decrease"} significantly.`;
  if (abs >= 0.6)
    return `Moderate ${dir} correlation between "${col1}" and "${col2}" (r=${r.toFixed(2)}). There's a noticeable ${dir} trend between these variables.`;
  if (abs >= 0.4)
    return `Weak ${dir} correlation between "${col1}" and "${col2}" (r=${r.toFixed(2)}). The relationship exists but is not strongly defined.`;
  return `Very little linear relationship between "${col1}" and "${col2}" (r=${r.toFixed(2)}).`;
}

function trendInsight(
  col: string,
  slope: number,
  rSq: number,
  dir: TrendResult["direction"],
): string {
  const slopeAbs = Math.abs(slope).toFixed(3);
  const fit = rSq > 0.8 ? "consistent" : rSq > 0.5 ? "moderate" : "weak";
  if (dir === "increasing")
    return `"${col}" shows a ${fit} upward trend (slope: +${slopeAbs}). Values are growing over time with ${(rSq * 100).toFixed(0)}% trend fit.`;
  if (dir === "decreasing")
    return `"${col}" shows a ${fit} downward trend (slope: ${slope.toFixed(3)}). Values are declining over time with ${(rSq * 100).toFixed(0)}% trend fit.`;
  if (dir === "volatile")
    return `"${col}" is highly volatile with no clear directional trend. Values fluctuate significantly around the mean.`;
  return `"${col}" remains relatively stable over the dataset with minimal directional change.`;
}

function outlierInsight(
  col: string,
  value: number,
  zscore: number,
  dir: "high" | "low",
): string {
  const mag = Math.abs(zscore);
  const severity = mag > 4 ? "extreme" : mag > 3 ? "significant" : "notable";
  return `${severity.charAt(0).toUpperCase() + severity.slice(1)} ${dir === "high" ? "high" : "low"} outlier detected in "${col}": value ${value.toLocaleString()} is ${mag.toFixed(1)} standard deviations from the mean. This may indicate a ${dir === "high" ? "peak event or data error" : "dip or anomaly"}.`;
}

export function analyzeData(rawData: Record<string, string>[]): AnalysisResult {
  if (!rawData.length) throw new Error("No data to analyze");

  const columns = Object.keys(rawData[0]);
  const columnStats: Record<string, ColumnStats> = {};
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];
  const numericData: Record<string, number[]> = {};

  // --- Per-column analysis ---
  for (const col of columns) {
    const rawValues = rawData.map((r) => (r[col] ?? "").toString().trim());
    const type = detectColumnType(rawValues);
    const missing = rawValues.filter(
      (v) => v === "" || v === "null" || v === "undefined" || v === "NaN",
    ).length;
    const nonMissing = rawValues.filter(
      (v) => v !== "" && v !== "null" && v !== "undefined",
    );
    const unique = new Set(nonMissing).size;

    const stat: ColumnStats = {
      name: col,
      type,
      count: rawValues.length,
      missing,
      unique,
    };

    if (type === "numeric") {
      numericColumns.push(col);
      const nums = nonMissing.map(Number).filter((n) => !isNaN(n));
      numericData[col] = nums;
      const sorted = [...nums].sort((a, b) => a - b);
      stat.min = sorted[0];
      stat.max = sorted[sorted.length - 1];
      stat.mean = mean(nums);
      stat.median = median(nums);
      stat.stdDev = stdDev(nums);
      stat.variance = stat.stdDev ** 2;
      stat.q1 = percentile(nums, 25);
      stat.q3 = percentile(nums, 75);
      stat.skewness = skewness(nums);

      const lowerCol = col.toLowerCase();

      stat.isIdentifier =
        lowerCol === "id" ||
        lowerCol.endsWith("_id") ||
        lowerCol.endsWith("_ids") ||
        lowerCol.includes("index") ||
        lowerCol.includes("serial");
    } else {
      categoricalColumns.push(col);
      const freq: Record<string, number> = {};
      for (const v of nonMissing) freq[v] = (freq[v] || 0) + 1;
      stat.topValues = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    }

    columnStats[col] = stat;
  }
  const analysisColumns = numericColumns.filter(
    (col) => !columnStats[col]?.isIdentifier,
  );

  // --- Correlations ---
  const correlations: Correlation[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < analysisColumns.length; i++) {
    for (let j = i + 1; j < analysisColumns.length; j++) {
      const c1 = analysisColumns[i];
      const c2 = analysisColumns[j];
      const key = [c1, c2].sort().join("||");
      if (seen.has(key)) continue;
      seen.add(key);
      const r = pearsonCorrelation(numericData[c1], numericData[c2]);
      correlations.push({
        col1: c1,
        col2: c2,
        r,
        strength: correlationStrength(r),
        insight: correlationInsight(c1, c2, r),
      });
    }
  }
  correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  // --- Trends ---
  const trends: TrendResult[] = analysisColumns.map((col) => {
    const { slope, rSquared } = linearRegression(numericData[col]);
    const sd = columnStats[col].stdDev ?? 0;
    const m = columnStats[col].mean ?? 0;
    const cv = m !== 0 ? sd / Math.abs(m) : 0;
    let direction: TrendResult["direction"];
    if (cv > 0.8 && rSquared < 0.3) direction = "volatile";
    else if (Math.abs(slope) < 0.001 * (m || 1) && rSquared < 0.1)
      direction = "stable";
    else if (slope > 0) direction = "increasing";
    else direction = "decreasing";
    return {
      column: col,
      direction,
      slope,
      rSquared,
      insight: trendInsight(col, slope, rSquared, direction),
    };
  });

  // --- Outliers ---
  const outliers: Outlier[] = [];
  for (const col of analysisColumns) {
    const nums = numericData[col];
    const m = mean(nums);
    const sd = stdDev(nums);
    if (sd === 0) continue;
    for (let i = 0; i < rawData.length; i++) {
      const val = Number(rawData[i][col]);
      if (isNaN(val)) continue;
      const z = (val - m) / sd;
      if (Math.abs(z) >= 2.5) {
        outliers.push({
          column: col,
          rowIndex: i,
          value: val,
          zscore: z,
          direction: z > 0 ? "high" : "low",
          insight: outlierInsight(col, val, z, z > 0 ? "high" : "low"),
        });
      }
    }
  }
  outliers.sort((a, b) => Math.abs(b.zscore) - Math.abs(a.zscore));

  // --- Heatmap Data ---
  const heatmapData: { col1: string; col2: string; r: number }[][] =
    analysisColumns.map((c1) =>
      analysisColumns.map((c2) => {
        if (c1 === c2) return { col1: c1, col2: c2, r: 1 };
        const corr = correlations.find(
          (c) =>
            (c.col1 === c1 && c.col2 === c2) ||
            (c.col1 === c2 && c.col2 === c1),
        );
        return { col1: c1, col2: c2, r: corr?.r ?? 0 };
      }),
    );

  // --- Natural Language Insights ---
  const insights: InsightCard[] = [];

  // Summary
  insights.push({
    id: "dataset-overview",
    type: "info",
    icon: "📊",
    title: "Dataset Overview",
    description: `Your dataset contains ${rawData.length.toLocaleString()} rows and ${columns.length} columns — ${numericColumns.length} numeric, ${categoricalColumns.length} categorical.`,
    value: `${rawData.length.toLocaleString()} rows`,
    category: "summary",
  });

  const highMissingCols = columns.filter(
    (c) => columnStats[c].missing / rawData.length > 0.05,
  );
  if (highMissingCols.length > 0) {
    insights.push({
      id: "missing-data",
      type: "warning",
      icon: "⚠️",
      title: "Missing Data Detected",
      description: `Columns ${highMissingCols.map((c) => `"${c}"`).join(", ")} have notable missing values. Consider imputation before modeling.`,
      category: "summary",
    });
  } else {
    insights.push({
      id: "data-complete",
      type: "positive",
      icon: "✅",
      title: "Data Completeness",
      description: `No significant missing values detected. Dataset appears clean and ready for analysis.`,
      category: "summary",
    });
  }

  // Numeric column insights
  for (const col of analysisColumns.slice(0, 6)) {
    const st = columnStats[col];
    const cv = st.mean && st.mean !== 0 ? st.stdDev! / Math.abs(st.mean) : 0;
    const skew = st.skewness ?? 0;

    if (cv > 1) {
      insights.push({
        id: `high-var-${col}`,
        type: "warning",
        icon: "📉",
        title: `High Variability in "${col}"`,
        description: `"${col}" has a coefficient of variation of ${(cv * 100).toFixed(0)}%, indicating extremely high variability. The std dev (${st.stdDev?.toFixed(2)}) is larger than the mean (${st.mean?.toFixed(2)}).`,
        category: "distribution",
      });
    } else if (cv < 0.1) {
      insights.push({
        id: `low-var-${col}`,
        type: "info",
        icon: "📏",
        title: `Low Variability in "${col}"`,
        description: `"${col}" is highly consistent with a coefficient of variation of only ${(cv * 100).toFixed(1)}%. Values cluster tightly around the mean of ${st.mean?.toFixed(2)}.`,
        category: "distribution",
      });
    }

    if (Math.abs(skew) > 1.5) {
      const dir = skew > 0 ? "right (positively)" : "left (negatively)";
      insights.push({
        id: `skew-${col}`,
        type: "info",
        icon: "↗️",
        title: `Skewed Distribution in "${col}"`,
        description: `"${col}" is skewed ${dir} (skewness=${skew.toFixed(2)}). ${skew > 0 ? "A few high values are pulling the mean upward." : "A few low values are pulling the mean downward."}`,
        category: "distribution",
      });
    }

    // Range insight
    const range = (st.max ?? 0) - (st.min ?? 0);
    insights.push({
      id: `range-${col}`,
      type: "neutral",
      icon: "📐",
      title: `Range of "${col}"`,
      description: `"${col}" ranges from ${st.min?.toLocaleString()} to ${st.max?.toLocaleString()} — a spread of ${range.toLocaleString()}. Median is ${st.median?.toFixed(2)}, mean is ${st.mean?.toFixed(2)}.`,
      value: `${st.mean?.toFixed(2)} avg`,
      category: "summary",
    });
  }

  // Correlation insights
  const strongCorrs = correlations
    .filter((c) => Math.abs(c.r) >= 0.7)
    .slice(0, 4);
  for (const corr of strongCorrs) {
    insights.push({
      id: `corr-${corr.col1}-${corr.col2}`,
      type: corr.r > 0 ? "positive" : "negative",
      icon: corr.r > 0 ? "🔗" : "🔄",
      title: `${corr.r > 0 ? "Positive" : "Negative"} Correlation: ${corr.col1} ↔ ${corr.col2}`,
      description: corr.insight,
      value: `r = ${corr.r.toFixed(2)}`,
      category: "correlation",
    });
  }

  if (correlations.length && Math.abs(correlations[0].r) < 0.3) {
    insights.push({
      id: "no-strong-corr",
      type: "info",
      icon: "🔍",
      title: "No Strong Correlations Found",
      description: `Numeric variables appear mostly independent of each other. The strongest relationship is r=${correlations[0]?.r.toFixed(2)} between "${correlations[0]?.col1}" and "${correlations[0]?.col2}".`,
      category: "correlation",
    });
  }

  // Trend insights
  const upTrends = trends.filter((t) => t.direction === "increasing");
  const downTrends = trends.filter((t) => t.direction === "decreasing");
  const volatileTrends = trends.filter((t) => t.direction === "volatile");

  if (upTrends.length > 0) {
    insights.push({
      id: "up-trends",
      type: "positive",
      icon: "📈",
      title: `${upTrends.length} Column${upTrends.length > 1 ? "s Are" : " Is"} Trending Up`,
      description: `${upTrends.map((t) => `"${t.column}"`).join(", ")} show${upTrends.length === 1 ? "s" : ""} an increasing trend across the dataset sequence.`,
      category: "trend",
    });
  }
  if (downTrends.length > 0) {
    insights.push({
      id: "down-trends",
      type: "negative",
      icon: "📉",
      title: `${downTrends.length} Column${downTrends.length > 1 ? "s Are" : " Is"} Trending Down`,
      description: `${downTrends.map((t) => `"${t.column}"`).join(", ")} show${downTrends.length === 1 ? "s" : ""} a declining trend. Worth investigating if this is expected.`,
      category: "trend",
    });
  }
  if (volatileTrends.length > 0) {
    insights.push({
      id: "volatile",
      type: "warning",
      icon: "⚡",
      title: `High Volatility Detected`,
      description: `${volatileTrends.map((t) => `"${t.column}"`).join(", ")} show${volatileTrends.length === 1 ? "s" : ""} high variance with no clear trend direction. This may indicate noise or cyclic patterns.`,
      category: "trend",
    });
  }

  // Outlier insights
  if (outliers.length === 0) {
    insights.push({
      id: "no-outliers",
      type: "positive",
      icon: "🎯",
      title: "No Major Outliers Detected",
      description:
        "All values fall within 2.5 standard deviations of their column mean. Data distribution appears normal.",
      category: "outlier",
    });
  } else {
    const topOutliers = outliers.slice(0, 3);
    for (const o of topOutliers) {
      insights.push({
        id: `outlier-${o.column}-${o.rowIndex}`,
        type: "warning",
        icon: "🚨",
        title: `Outlier in "${o.column}" (Row ${o.rowIndex + 1})`,
        description: o.insight,
        value: `z = ${o.zscore.toFixed(2)}`,
        category: "outlier",
      });
    }
  }

  return {
    rowCount: rawData.length,
    colCount: columns.length,
    numericColumns,
    categoricalColumns,
    columnStats,
    correlations,
    outliers: outliers.slice(0, 20),
    trends,
    insights,
    heatmapData,
    rawData: numericData,
  };
}
