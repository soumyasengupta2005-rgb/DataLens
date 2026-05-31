import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import { AnalysisResult } from "../../utils/analytics";
import {
  PDFLineChart,
  PDFBarChart,
  PDFHistogram,
  PDFCorrelationHeatmap,
} from "./PDFCharts";

interface Props {
  analysis: AnalysisResult;
  fileName: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    backgroundColor: "#050816",
    padding: 32,
    paddingBottom: 48,           
    color: "#f8fafc",
    fontSize: 12,
    fontFamily: "Helvetica",
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: "#334155",
  },
  footerBrand: {
    fontSize: 8,
    color: "#00f5ff",
    fontWeight: 700,
  },

  // ── Page header typography ───────────────────────────────────────────────────
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#00f5ff",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 20,
    lineHeight: 1.6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#00f5ff",
    marginBottom: 6,
  },

  // Section title with left accent bar
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleBar: {
    width: 3,
    height: 16,
    backgroundColor: "#8b5cf6",
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#8b5cf6",
  },

  // ── Stat cards ──────────────────────────────────────────────────────────────
  cardLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: 700,
  },
  body: {
    fontSize: 11,
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  section: {
    marginTop: 16,
    padding: 18,
    borderRadius: 12,
    backgroundColor: "#0f172a",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  // ── Chart cards ─────────────────────────────────────────────────────────────
  chartCard: {
    backgroundColor: "#0b1733",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  chartCardAccentLine: {
    height: 2,
    borderRadius: 1,
    marginBottom: 12,
  },
  chartMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    padding: 8,
  },
  chartMetaItem: {
    alignItems: "center",
  },
  chartMetaLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
  },
  chartMetaValue: {
    fontSize: 10,
    color: "#f8fafc",
    fontWeight: 700,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#a855f7",
    marginBottom: 3,
  },
  chartDescription: {
    fontSize: 10,
    color: "#94a3b8",
    lineHeight: 1.5,
    marginBottom: 8,
  },

  // ── Insight cards ───────────────────────────────────────────────────────────
  insightCard: {
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  insightTypeBadge: {
    fontSize: 7,
    fontWeight: 700,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#1e293b",
    color: "#64748b",
    textTransform: "uppercase",
  },
  insightTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#f8fafc",
    flex: 1,
  },
  insightBody: {
    fontSize: 10,
    color: "#94a3b8",
    lineHeight: 1.5,
  },

  // ── Cover hero divider ───────────────────────────────────────────────────────
  heroDivider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 14,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function insightAccent(
  type: "info" | "positive" | "negative" | "warning" | "neutral",
): string {
  return {
    positive: "#22c55e",
    negative: "#ec4899",
    warning: "#f59e0b",
    info: "#00f5ff",
    neutral: "#8b5cf6",
  }[type];
}

function insightTypeLabel(
  type: "info" | "positive" | "negative" | "warning" | "neutral",
): string {
  return { positive: "GOOD", negative: "ALERT", warning: "WARN", info: "INFO", neutral: "NOTE" }[type];
}

function stripEmoji(str: string): string {
  return str
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{FE00}-\u{FEFF}]/gu, "")
    .trim();
}


// ── 1. Page numbering — added to Footer render below ─────────────────────────

// ── 2. Dataset Health Score (0–100) ──────────────────────────────────────────
function computeHealthScore(analysis: AnalysisResult, chartColumns: string[]): number {
  let score = 100;
  // Penalise missing data
  const hasMissing = analysis.insights.some((i) => i.id === "missing-data" && i.type === "warning");
  if (hasMissing) score -= 15;
  // Penalise outlier ratio (up to -20)
  const outlierRatio = analysis.outliers.length / Math.max(analysis.rowCount, 1);
  score -= Math.min(20, Math.round(outlierRatio * 10000));
  // Penalise heavily skewed columns (>2 skewness) up to -15
  const heavilySkewed = chartColumns.filter((c) => {
    const sk = analysis.columnStats[c]?.skewness;
    return sk !== undefined && Math.abs(sk) > 2;
  }).length;
  score -= Math.min(15, heavilySkewed * 5);
  // Penalise high-variability columns (CV > 150%) up to -10
  const highCV = chartColumns.filter((c) => {
    const st = analysis.columnStats[c];
    return st && st.mean != null && st.mean !== 0 && ((st.stdDev ?? 0) / Math.abs(st.mean)) > 1.5;
  }).length;
  score -= Math.min(10, highCV * 3);
  return Math.max(0, score);
}

function healthScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ec4899";
}

function healthScoreLabel(score: number): string {
  if (score >= 80) return "HEALTHY";
  if (score >= 60) return "FAIR";
  return "POOR";
}

// ── 3. Correlation strength label ─────────────────────────────────────────────
function corrStrengthLabel(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.8) return "STRONG";
  if (abs >= 0.5) return "MODERATE";
  if (abs >= 0.3) return "WEAK";
  return "NEGLIGIBLE";
}

// ── 5. Human-friendly skew label ──────────────────────────────────────────────
function skewLabel(skewness: number): string {
  const abs = Math.abs(skewness);
  const dir = skewness > 0 ? "right" : "left";
  if (abs > 2) return `Heavily ${dir}-skewed`;
  if (abs > 1) return `Moderately ${dir}-skewed`;
  if (abs > 0.5) return `Mildly ${dir}-skewed`;
  return "Near-symmetric";
}

// ── 7. Data quality badge ──────────────────────────────────────────────────────
function dataQualityBadge(analysis: AnalysisResult): { label: string; color: string } {
  const hasMissing = analysis.insights.some((i) => i.id === "missing-data" && i.type === "warning");
  return hasMissing
    ? { label: "MISSING DATA", color: "#f59e0b" }
    : { label: "CLEAN", color: "#22c55e" };
}

// ── Reusable section title with left accent bar ───────────────────────────────
function SectionTitle({ children }: { children: string }) {
  return (
    <View style={s.sectionTitleRow}>
      <View style={s.sectionTitleBar} />
      <Text style={s.sectionTitle}>{children}</Text>
    </View>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.cardLabel}>{label}</Text>
      <Text style={s.cardValue}>{value}</Text>
    </View>
  );
}

// ── Page footer ───────────────────────────────────────────────────────────────
function Footer({ section, fileName }: { section: string; fileName: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText} fixed>{fileName}  |  {section}</Text>
      <Text style={s.footerBrand} fixed>DataLens</Text>
      <Text
        style={[s.footerText, { marginLeft: 8 }]}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportDocument({ analysis, fileName }: Props) {
  const generatedAt = new Date().toLocaleDateString();
  const strongestCorr = analysis.correlations[0];

  const chartColumns = analysis.numericColumns.filter(
    (col) => !analysis.columnStats[col]?.isIdentifier,
  );

  const histogramColumns = chartColumns.filter((col) => {
    const data = analysis.rawData[col];
    return data && new Set(data).size >= 5;
  });
  console.log("chartColumns", chartColumns);
  console.log("histogramColumns", histogramColumns);

  const meanBarItems = chartColumns.map((col) => ({
    label: col,
    value: analysis.columnStats[col]?.mean ?? 0,
    color: "#00f5ff",
  }));

  const heatmapLabels = chartColumns.slice(0, 10);
  const heatmapMatrix: number[][] = heatmapLabels.map((c1) =>
    heatmapLabels.map((c2) => {
      if (c1 === c2) return 1;
      const entry = analysis.heatmapData
        .flat()
        .find(
          (h) =>
            (h.col1 === c1 && h.col2 === c2) ||
            (h.col1 === c2 && h.col2 === c1),
        );
      return entry?.r ?? 0;
    }),
  );

  const outlierInsightIds = new Set(
    analysis.outliers.map((o) => `outlier-${o.column}-${o.rowIndex}`),
  );
  const digestInsights = analysis.insights
    .slice(4)
    .filter((ins) => !outlierInsightIds.has(ins.id));

  // ── New computed values for improvements ────────────────────────────────────
  const healthScore = computeHealthScore(analysis, chartColumns);
  const qualityBadge = dataQualityBadge(analysis);

  // Most stable / most volatile columns (4. trend page callout)
  const stableCol = analysis.trends.find((t) => t.direction === "stable")?.column
    ?? analysis.trends[0]?.column;
  // Most volatile = first column whose direction is "volatile", else last trend entry
  const volatileCol = analysis.trends.find((t) => t.direction === "volatile")?.column
    ?? analysis.trends[analysis.trends.length - 1]?.column;

  return (
    <Document>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 1 — COVER
      ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <Footer section="Overview" fileName={fileName} />

        {/* Hero */}
        <Text style={s.heroTitle}>DataLens Analytics Report</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 11, color: "#94a3b8" }}>Dataset: {fileName}</Text>
          {/* 7. Data quality badge */}
          <View style={{
            backgroundColor: "#1e293b",
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderWidth: 1,
            borderColor: qualityBadge.color,
          }}>
            <Text style={{ fontSize: 7, fontWeight: 700, color: qualityBadge.color }}>
              {qualityBadge.label}
            </Text>
          </View>
        </View>
        <View style={s.heroDivider} />

        {/* 2. Health score added as 5th stat card */}
        <View style={[s.row, { marginBottom: 0 }]}>
          <View style={s.statCard}>
            <Text style={s.cardLabel}>Generated</Text>
            <Text style={[s.cardValue, { fontSize: 16 }]}>{generatedAt}</Text>
          </View>
          <StatCard label="Rows" value={analysis.rowCount.toLocaleString()} />
          <StatCard label="Columns" value={String(analysis.colCount)} />
          <StatCard label="Strongest r" value={strongestCorr ? strongestCorr.r.toFixed(2) : "N/A"} />
          <View style={[s.statCard, { borderColor: healthScoreColor(healthScore) }]}>
            <Text style={s.cardLabel}>Health Score</Text>
            <Text style={[s.cardValue, { color: healthScoreColor(healthScore) }]}>
              {healthScore}
            </Text>
            <Text style={{ fontSize: 7, color: healthScoreColor(healthScore), marginTop: 2 }}>
              {healthScoreLabel(healthScore)}
            </Text>
          </View>
        </View>

        {/* Executive Summary */}
        <View style={s.section}>
          <SectionTitle>Executive Summary</SectionTitle>
          <Text style={s.body}>
            This dataset contains {analysis.rowCount.toLocaleString()} rows
            across {analysis.colCount} columns ({chartColumns.length} numeric,{" "}
            {analysis.categoricalColumns.length} categorical). The analysis
            surfaced {analysis.insights.length} insights,{" "}
            {analysis.correlations.length} pairwise correlations, and flagged{" "}
            {analysis.outliers.length} outliers.
            {strongestCorr
              ? ` The strongest linear relationship exists between "${strongestCorr.col1}" and "${strongestCorr.col2}" (r = ${strongestCorr.r.toFixed(2)}).`
              : ""}
          </Text>
        </View>

        {/* Dataset Profile */}
        <View style={[s.section, { marginTop: 14 }]}>
          <SectionTitle>Dataset Profile</SectionTitle>
          <View style={s.row}>
            <StatCard label="Insights Found" value={String(analysis.insights.length)} />
            <StatCard label="Correlations" value={String(analysis.correlations.length)} />
            <StatCard label="Outliers" value={String(analysis.outliers.length)} />
            <StatCard label="Numeric Cols" value={String(chartColumns.length)} />
          </View>
        </View>

        {/* Key Insights */}
        <View style={[s.section, { marginTop: 14 }]}>
          <SectionTitle>Key Insights</SectionTitle>
          {analysis.insights.slice(1, 4).map((ins) => (
            <View
              key={ins.id}
              style={[
                s.insightCard,
                { borderLeftWidth: 3, borderLeftColor: insightAccent(ins.type) },
              ]}
            >
              <View style={s.insightHeader}>
                <Text style={[s.insightTypeBadge, { color: insightAccent(ins.type) }]}>
                  {insightTypeLabel(ins.type)}
                </Text>
                <Text style={s.insightTitle}>
                  {stripEmoji(ins.title)}
                  {ins.value ? `  -  ${ins.value}` : ""}
                </Text>
              </View>
              <Text style={s.insightBody}>{ins.description}</Text>
            </View>
          ))}
        </View>

      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 2 — TREND LINES
      ══════════════════════════════════════════════════════════════════════ */}
      {chartColumns.length > 0 && (
        <Page size="A4" style={s.page} wrap>
          <Footer section="Trend Analysis" fileName={fileName} />
          <Text style={s.pageTitle}>Trend Analysis</Text>
          <Text style={s.pageSubtitle}>
            Preview of the first 40 observations for each numeric column.
          </Text>

          {/* 4. Most Stable / Most Volatile callout */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
            {stableCol && (
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: "#0b1733", borderRadius: 8, padding: 8,
                borderLeftWidth: 3, borderLeftColor: "#22c55e" }}>
                <Text style={{ fontSize: 8, color: "#64748b" }}>MOST STABLE</Text>
                <Text style={{ fontSize: 9, fontWeight: 700, color: "#22c55e" }}>{stableCol}</Text>
              </View>
            )}
            {volatileCol && (
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: "#0b1733", borderRadius: 8, padding: 8,
                borderLeftWidth: 3, borderLeftColor: "#ec4899" }}>
                <Text style={{ fontSize: 8, color: "#64748b" }}>MOST VOLATILE</Text>
                <Text style={{ fontSize: 9, fontWeight: 700, color: "#ec4899" }}>{volatileCol}</Text>
              </View>
            )}
          </View>

          {chartColumns.map((col) => {
            const data = analysis.rawData[col].slice(0, 40);
            const stats = analysis.columnStats[col];
            const trend = analysis.trends.find((t) => t.column === col);
            const min = stats?.min ?? Math.min(...data);
            const max = stats?.max ?? Math.max(...data);
            const avg =
              stats?.mean ?? data.reduce((a, b) => a + b, 0) / data.length;

            return (
              <View key={col} style={s.chartCard} wrap={false}>
                {/* Cyan accent line at top of each trend card */}
                <View style={[s.chartCardAccentLine, { backgroundColor: "#00f5ff" }]} />
                <Text style={s.chartTitle}>{col}</Text>
                <Text style={s.chartDescription}>
                  {trend?.insight ?? "Trend data not available."}
                </Text>
                <View style={s.chartMeta}>
                  <View style={s.chartMetaItem}>
                    <Text style={s.chartMetaLabel}>MIN</Text>
                    <Text style={s.chartMetaValue}>{min.toFixed(2)}</Text>
                  </View>
                  <View style={s.chartMetaItem}>
                    <Text style={s.chartMetaLabel}>AVG</Text>
                    <Text style={s.chartMetaValue}>{avg.toFixed(2)}</Text>
                  </View>
                  <View style={s.chartMetaItem}>
                    <Text style={s.chartMetaLabel}>MAX</Text>
                    <Text style={s.chartMetaValue}>{max.toFixed(2)}</Text>
                  </View>
                  {trend && (
                    <View style={s.chartMetaItem}>
                      <Text style={s.chartMetaLabel}>TREND</Text>
                      <Text
                        style={[
                          s.chartMetaValue,
                          {
                            color:
                              trend.direction === "increasing"
                                ? "#22c55e"
                                : trend.direction === "decreasing"
                                  ? "#ec4899"
                                  : "#f59e0b",
                          },
                        ]}
                      >
                        {trend.direction.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <PDFLineChart data={data} width={495} height={160} color="#00f5ff" />
              </View>
            );
          })}
        </Page>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 3 — DISTRIBUTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      {histogramColumns.length > 0 && (
        <Page size="A4" style={s.page} wrap>
          <Footer section="Distributions" fileName={fileName} />
          <Text style={s.pageTitle}>Distributions</Text>
          <Text style={s.pageSubtitle}>
            Frequency histograms showing the spread of values for each numeric column.
          </Text>

          {histogramColumns.map((col) => {
            const data = analysis.rawData[col];
            const stats = analysis.columnStats[col];

            return (
              <View key={col} style={s.chartCard} wrap={false}>
                {/* Purple accent line at top of each histogram card */}
                <View style={[s.chartCardAccentLine, { backgroundColor: "#a855f7" }]} />
                <Text style={s.chartTitle}>{col}</Text>
                <Text style={s.chartDescription}>
                  {stats?.skewness !== undefined
                    ? skewLabel(stats.skewness) + ". "
                    : "Near-symmetric. "}
                  Std dev: {stats?.stdDev?.toFixed(2) ?? "-"}
                  {"  |  "}Q1: {stats?.q1?.toFixed(2) ?? "-"}
                  {"  |  "}Q3: {stats?.q3?.toFixed(2) ?? "-"}
                  {stats?.skewness !== undefined
                    ? `  |  skewness: ${stats.skewness.toFixed(2)}`
                    : ""}
                </Text>
                <PDFHistogram data={data} bins={20} width={495} height={120} color="#a855f7" />
              </View>
            );
          })}
        </Page>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 4 — COLUMN AVERAGES
      ══════════════════════════════════════════════════════════════════════ */}
      {meanBarItems.length > 0 && (
        <Page size="A4" style={s.page} wrap>
          <Footer section="Column Averages" fileName={fileName} />
          <Text style={s.pageTitle}>Column Averages</Text>
          <Text style={s.pageSubtitle}>
            Mean values across all numeric columns — useful for spotting scale
            differences and relative magnitudes.
          </Text>

          <View style={s.chartCard}>
            <View style={[s.chartCardAccentLine, { backgroundColor: "#00f5ff" }]} />
            <Text style={s.chartTitle}>Mean Value per Column</Text>
            <Text style={s.chartDescription}>
              Each bar represents the arithmetic mean of the column, scaled
              relative to the highest absolute mean in the dataset.
            </Text>
            <PDFBarChart
              items={meanBarItems}
              width={495}
              height={Math.max(200, meanBarItems.length * 28)}
              barColor="#00f5ff"
            />
          </View>

          {chartColumns.some(
            (col) => analysis.columnStats[col]?.stdDev !== undefined,
          ) && (
            <View style={s.chartCard}>
              <View style={[s.chartCardAccentLine, { backgroundColor: "#8b5cf6" }]} />
              <Text style={s.chartTitle}>Standard Deviation per Column</Text>
              <Text style={s.chartDescription}>
                Higher bars indicate greater spread around the mean — potential
                volatility or wide value ranges.
              </Text>
              <PDFBarChart
                items={chartColumns.map((col) => ({
                  label: col,
                  value: analysis.columnStats[col]?.stdDev ?? 0,
                  color: "#8b5cf6",
                }))}
                width={495}
                height={Math.max(200, chartColumns.length * 28)}
                barColor="#8b5cf6"
              />
            </View>
          )}
        </Page>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 5 — CORRELATION HEATMAP
      ══════════════════════════════════════════════════════════════════════ */}
      {heatmapLabels.length >= 2 && (
        <Page size="A4" style={s.page} wrap>
          <Footer section="Correlation Analysis" fileName={fileName} />
          <Text style={s.pageTitle}>Correlation Analysis</Text>
          <Text style={s.pageSubtitle}>
            Pairwise Pearson correlations. Cyan cells indicate strong positive
            relationships; pink cells indicate strong negative relationships.
          </Text>

          <View style={s.chartCard}>
            <View style={[s.chartCardAccentLine, { backgroundColor: "#ec4899" }]} />
            <Text style={s.chartTitle}>Correlation Heatmap</Text>
            <Text style={s.chartDescription}>
              {heatmapLabels.length} x {heatmapLabels.length} matrix of r
              values. Diagonal is always 1.00 (self-correlation).
            </Text>
            <PDFCorrelationHeatmap
              labels={heatmapLabels}
              matrix={heatmapMatrix}
              width={495}
              height={Math.max(260, 60 + heatmapLabels.length * 32)}
            />
          </View>

          {analysis.correlations.length > 0 && (
            <View style={[s.section, { marginTop: 0 }]} wrap={false}>
              <SectionTitle>Top Correlations</SectionTitle>
              {analysis.correlations.slice(0, 4).map((corr) => (
                <View
                  key={`${corr.col1}-${corr.col2}`}
                  wrap={false}
                  style={[
                    s.insightCard,
                    { borderLeftWidth: 3, borderLeftColor: corr.r >= 0 ? "#00f5ff" : "#ec4899" },
                  ]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={[s.insightTitle, { flex: 1, marginRight: 8 }]}>
                      {corr.col1} {"<->"} {corr.col2}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{
                        fontSize: 7, fontWeight: 700, color: "#1e293b",
                        backgroundColor:
                          Math.abs(corr.r) >= 0.8 ? "#22c55e"
                          : Math.abs(corr.r) >= 0.5 ? "#f59e0b"
                          : Math.abs(corr.r) >= 0.3 ? "#94a3b8"
                          : "#334155",
                        paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3,
                      }}>
                        {corrStrengthLabel(corr.r)}
                      </Text>
                      <Text style={{
                        fontSize: 11, fontWeight: 700,
                        color:
                          Math.abs(corr.r) >= 0.8 ? "#22c55e"
                          : Math.abs(corr.r) >= 0.5 ? "#f59e0b"
                          : "#94a3b8",
                      }}>
                        r = {corr.r.toFixed(3)}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.insightBody}>{corr.insight}</Text>
                </View>
              ))}
            </View>
          )}
        </Page>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 6 — FULL INSIGHTS DIGEST
      ══════════════════════════════════════════════════════════════════════ */}
      {(digestInsights.length > 0 || analysis.outliers.length > 0) && (
        <Page size="A4" style={s.page} wrap>
          <Footer section="Insights Digest" fileName={fileName} />
          <Text style={s.pageTitle}>Full Insights Digest</Text>
          <Text style={s.pageSubtitle}>
            All remaining insights generated from the dataset, ordered by category.
          </Text>

          {digestInsights.map((ins) => (
            <View
              key={ins.id}
              style={[
                s.insightCard,
                { borderLeftWidth: 3, borderLeftColor: insightAccent(ins.type) },
              ]}
            >
              <View style={s.insightHeader}>
                <Text style={[s.insightTypeBadge, { color: insightAccent(ins.type) }]}>
                  {insightTypeLabel(ins.type)}
                </Text>
                <Text style={s.insightTitle}>
                  {stripEmoji(ins.title)}
                  {ins.value ? `  -  ${ins.value}` : ""}
                </Text>
              </View>
              <Text style={s.insightBody}>{ins.description}</Text>
            </View>
          ))}

          {analysis.outliers.length > 0 && (() => {
            // Group outliers by column, keep the worst z-score per column
            const grouped = analysis.outliers.reduce<Record<string, { maxZ: number; count: number; insight: string }>>(
              (acc, o) => {
                if (!acc[o.column]) {
                  acc[o.column] = { maxZ: o.zscore, count: 1, insight: o.insight };
                } else {
                  acc[o.column].count += 1;
                  if (o.zscore > acc[o.column].maxZ) {
                    acc[o.column].maxZ = o.zscore;
                    acc[o.column].insight = o.insight;
                  }
                }
                return acc;
              },
              {},
            );
            const entries = Object.entries(grouped).sort((a, b) => b[1].maxZ - a[1].maxZ);

            return (
              <View style={[s.section, { marginTop: 16 }]}>
                <SectionTitle>Top Outliers</SectionTitle>
                {entries.map(([col, { maxZ, count, insight }]) => (
                  <View
                    key={col}
                    wrap={false}
                    style={[s.insightCard, { borderLeftWidth: 3, borderLeftColor: "#f59e0b" }]}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={s.insightTitle}>{col}</Text>
                      <Text style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b" }}>
                        {count} {count === 1 ? "outlier" : "outliers"}  |  max z = {maxZ.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={s.insightBody}>{insight}</Text>
                  </View>
                ))}
              </View>
            );
          })()}
        </Page>
      )}

    </Document>
  );
}