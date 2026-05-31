import { Canvas } from "@react-pdf/renderer";

// ─── shared helpers ───────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ─── PDFLineChart ─────────────────────────────────────────────────────────────
// Full-width trend line chart with gradient fill simulation, grid lines,
// axis labels, and Y-tick values.

interface LineChartProps {
  data: number[];
  /** Canvas width in PDF points. Default 495 (fits A4 with 32pt side padding). */
  width?: number;
  /** Canvas height in PDF points. Default 200. */
  height?: number;
  color?: string;
}

export function PDFLineChart({
  data,
  width = 495,
  height = 200,
  color = "#00f5ff",
}: LineChartProps) {
  if (!data || data.length === 0) return null;

  // ── layout constants ──────────────────────────────────────────────────────
  const PAD_LEFT = 52; // room for Y-axis labels
  const PAD_RIGHT = 16;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 32; // room for X-axis labels
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max === min ? 1 : max - min;

  const toX = (i: number) =>
    PAD_LEFT +
    (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const toY = (v: number) => PAD_TOP + chartH - ((v - min) / range) * chartH;

  // Y-axis ticks (5 evenly spaced)
  const Y_TICKS = 5;
  const yTicks = Array.from(
    { length: Y_TICKS },
    (_, i) => min + (range / (Y_TICKS - 1)) * i,
  );

  // X-axis labels: show ~6 evenly spaced indices
  const X_LABEL_COUNT = Math.min(6, data.length);
  const xLabelIndices = Array.from({ length: X_LABEL_COUNT }, (_, i) =>
    Math.round((i / (X_LABEL_COUNT - 1)) * (data.length - 1)),
  );

  return (
    <Canvas
      style={{ width, height }}
      paint={(p: any) => {
        // ── background ──────────────────────────────────────────────────────
        p.rect(0, 0, width, height).fillColor("#0b1733").fill();

        // ── grid lines ──────────────────────────────────────────────────────
        yTicks.forEach((tick) => {
          const y = toY(tick);
          p.strokeColor("#1e293b")
            .lineWidth(0.5)
            .moveTo(PAD_LEFT, y)
            .lineTo(width - PAD_RIGHT, y)
            .stroke();

          // Y label
          const label =
            Math.abs(tick) >= 1000
              ? (tick / 1000).toFixed(1) + "k"
              : tick % 1 === 0
                ? tick.toFixed(0)
                : tick.toFixed(1);
          p.fontSize(7)
            .fillColor("#64748b")
            .text(label, 2, y - 4, { width: PAD_LEFT - 6, align: "right" });
        });

        // ── axes ────────────────────────────────────────────────────────────
        p.strokeColor("#334155")
          .lineWidth(1)
          .moveTo(PAD_LEFT, PAD_TOP)
          .lineTo(PAD_LEFT, PAD_TOP + chartH)
          .stroke();
        p.strokeColor("#334155")
          .lineWidth(1)
          .moveTo(PAD_LEFT, PAD_TOP + chartH)
          .lineTo(width - PAD_RIGHT, PAD_TOP + chartH)
          .stroke();

        // ── X-axis labels ───────────────────────────────────────────────────
        xLabelIndices.forEach((idx) => {
          const x = toX(idx);
          p.fontSize(7)
            .fillColor("#64748b")
            .text(String(idx + 1), x - 8, PAD_TOP + chartH + 6, {
              width: 20,
              align: "center",
            });
        });

        // ── shaded area (fill below line) ───────────────────────────────────
        if (data.length > 1) {
          const baseY = PAD_TOP + chartH;
          p.save();

          // Build the closed path
          p.moveTo(toX(0), baseY);
          data.forEach((v, i) => p.lineTo(toX(i), toY(v)));
          p.lineTo(toX(data.length - 1), baseY);

          // Use a semi-transparent version of the chart color
          // @react-pdf Canvas fillColor doesn't support rgba directly,
          // so we use opacity
          p.fillColor(color).fillOpacity(0.08).fill();
          p.fillOpacity(1); // reset
          p.restore();
        }

        // ── line ────────────────────────────────────────────────────────────
        if (data.length > 1) {
          p.strokeColor(color).lineWidth(2);
          p.moveTo(toX(0), toY(data[0]));
          for (let i = 1; i < data.length; i++) {
            p.lineTo(toX(i), toY(data[i]));
          }
          p.stroke();
        }

        // ── dots ────────────────────────────────────────────────────────────
        const showDots = data.length <= 60;
        if (showDots) {
          data.forEach((v, i) => {
            p.fillColor(color).circle(toX(i), toY(v), 2).fill();
          });
        }

        return null;
      }}
    />
  );
}

// ─── PDFBarChart ──────────────────────────────────────────────────────────────
// Horizontal bar chart, great for comparing column stats (mean, median, etc.)
// or top-N categories.

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  items: BarItem[];
  width?: number;
  height?: number;
  barColor?: string;
}

export function PDFBarChart({
  items,
  width = 495,
  height = 200,
  barColor = "#8b5cf6",
}: BarChartProps) {
  if (!items || items.length === 0) return null;

  const PAD_LEFT = 90;
  const PAD_RIGHT = 50;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 12;
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;

  const maxVal = Math.max(...items.map((d) => Math.abs(d.value)));
  const barH = clamp(Math.floor((chartH / items.length) * 0.6), 6, 22);
  const rowH = chartH / items.length;

  return (
    <Canvas
      style={{ width, height }}
      paint={(p: any) => {
        p.rect(0, 0, width, height).fillColor("#0b1733").fill();

        // vertical grid
        [0.25, 0.5, 0.75, 1].forEach((frac) => {
          const x = PAD_LEFT + frac * chartW;
          p.strokeColor("#1e293b")
            .lineWidth(0.5)
            .moveTo(x, PAD_TOP)
            .lineTo(x, PAD_TOP + chartH)
            .stroke();
        });

        // Y axis
        p.strokeColor("#334155")
          .lineWidth(1)
          .moveTo(PAD_LEFT, PAD_TOP)
          .lineTo(PAD_LEFT, PAD_TOP + chartH)
          .stroke();

        items.forEach((item, i) => {
          const cy = PAD_TOP + rowH * i + rowH / 2;
          const barW =
            maxVal === 0 ? 0 : (Math.abs(item.value) / maxVal) * chartW;
          const col = item.color || barColor;

          // bar
          p.rect(PAD_LEFT, cy - barH / 2, barW, barH)
            .fillColor(col)
            .fillOpacity(0.85)
            .fill()
            .fillOpacity(1);

          // label (left)
          const labelText =
            item.label.length > 14 ? item.label.slice(0, 13) + "…" : item.label;
          p.fontSize(8)
            .fillColor("#94a3b8")
            .text(labelText, 2, cy - 5, {
              width: PAD_LEFT - 6,
              align: "right",
            });

          // value (right of bar)
          const valLabel =
            Math.abs(item.value) >= 1000
              ? (item.value / 1000).toFixed(1) + "k"
              : item.value % 1 === 0
                ? item.value.toFixed(0)
                : item.value.toFixed(2);
          p.fontSize(8)
            .fillColor("#e2e8f0")
            .text(valLabel, PAD_LEFT + barW + 4, cy - 5, { width: 40 });
        });

        return null;
      }}
    />
  );
}

// ─── PDFHistogram ─────────────────────────────────────────────────────────────
// Distribution histogram — shows the frequency of values in bins.

interface HistogramProps {
  data: number[];
  bins?: number;
  width?: number;
  height?: number;
  color?: string;
}

export function PDFHistogram({
  data,
  bins = 20,
  width = 495,
  height = 180,
  color = "#a855f7",
}: HistogramProps) {
  if (!data || data.length === 0) return null;

  const PAD_LEFT = 44;
  const PAD_RIGHT = 16;
  const PAD_TOP = 14;
  const PAD_BOTTOM = 28;
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;

  let min = Infinity;
  let max = -Infinity;

  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max === min ? 1 : max - min;
  const binW = range / bins;

  // build bin counts
  const counts = Array(bins).fill(0);
  data.forEach((v) => {
    const idx = clamp(Math.floor((v - min) / binW), 0, bins - 1);
    counts[idx]++;
  });

  let maxCount = 1;

  for (const c of counts) {
    if (c > maxCount) maxCount = c;
  }
  const barW = chartW / bins;

  return (
    <Canvas
      style={{ width, height }}
      paint={(p: any) => {
        p.rect(0, 0, width, height).fillColor("#0b1733").fill();

        // grid
        [0.25, 0.5, 0.75, 1].forEach((frac) => {
          const y = PAD_TOP + chartH - frac * chartH;
          p.strokeColor("#1e293b")
            .lineWidth(0.5)
            .moveTo(PAD_LEFT, y)
            .lineTo(width - PAD_RIGHT, y)
            .stroke();
        });

        // axes
        p.strokeColor("#334155")
          .lineWidth(1)
          .moveTo(PAD_LEFT, PAD_TOP)
          .lineTo(PAD_LEFT, PAD_TOP + chartH)
          .stroke();
        p.strokeColor("#334155")
          .lineWidth(1)
          .moveTo(PAD_LEFT, PAD_TOP + chartH)
          .lineTo(width - PAD_RIGHT, PAD_TOP + chartH)
          .stroke();

        // bars
        counts.forEach((count, i) => {
          const bh = (count / maxCount) * chartH;
          const x = PAD_LEFT + i * barW;
          const y = PAD_TOP + chartH - bh;
          const gap = Math.max(1, barW * 0.1);

          p.rect(x + gap / 2, y, barW - gap, bh)
            .fillColor(color)
            .fillOpacity(0.8)
            .fill()
            .fillOpacity(1);
        });

        // X labels (min, mid, max)
        const midVal = min + range / 2;
        const fmt = (v: number) =>
          Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(1);

        p.fontSize(7).fillColor("#64748b");
        p.text(fmt(min), PAD_LEFT, PAD_TOP + chartH + 6, { width: 30 });
        p.text(fmt(midVal), PAD_LEFT + chartW / 2 - 15, PAD_TOP + chartH + 6, {
          width: 30,
          align: "center",
        });
        p.text(fmt(max), width - PAD_RIGHT - 30, PAD_TOP + chartH + 6, {
          width: 30,
          align: "right",
        });

        // Y label (max count)
        p.fontSize(7)
          .fillColor("#64748b")
          .text(String(maxCount), 2, PAD_TOP - 2, {
            width: PAD_LEFT - 4,
            align: "right",
          });

        return null;
      }}
    />
  );
}

// ─── PDFCorrelationHeatmap ────────────────────────────────────────────────────
// Mini heatmap — given an NxN matrix with labels, renders colored cells.

interface HeatmapProps {
  labels: string[];
  /** Row-major matrix, labels.length × labels.length */
  matrix: number[][];
  width?: number;
  height?: number;
}

export function PDFCorrelationHeatmap({
  labels,
  matrix,
  width = 495,
  height = 300,
}: HeatmapProps) {
  if (!labels.length || !matrix.length) return null;

  const n = labels.length;
  const PAD = 60; // room for axis labels
  const cellSize = Math.min(
    Math.floor((width - PAD) / n),
    Math.floor((height - PAD) / n),
  );
  const gridW = cellSize * n;
  const gridH = cellSize * n;
  const offsetX = PAD;
  const offsetY = PAD * 0.6;

  const toColor = (r: number): string => {
    // r in [-1, 1] → red…white…green
    const clamped = clamp(r, -1, 1);
    if (clamped >= 0) {
      // 0 → #0f172a  1 → #00f5ff
      const t = clamped;
      const R = Math.round(15 + t * (0 - 15));
      const G = Math.round(23 + t * (245 - 23));
      const B = Math.round(42 + t * (255 - 42));
      return `#${R.toString(16).padStart(2, "0")}${G.toString(16).padStart(2, "0")}${B.toString(16).padStart(2, "0")}`;
    } else {
      // 0 → #0f172a  -1 → #ec4899
      const t = -clamped;
      const R = Math.round(15 + t * (236 - 15));
      const G = Math.round(23 + t * (72 - 23));
      const B = Math.round(42 + t * (153 - 42));
      return `#${R.toString(16).padStart(2, "0")}${G.toString(16).padStart(2, "0")}${B.toString(16).padStart(2, "0")}`;
    }
  };

  const canvasW = offsetX + gridW + 16;

  return (
    <Canvas
      style={{ width: canvasW, height: offsetY + gridH + 16 }}
      paint={(p: any) => {
        p.rect(0, 0, canvasW, offsetY + gridH + 16)
          .fillColor("#0b1733")
          .fill();

        for (let row = 0; row < n; row++) {
          for (let col = 0; col < n; col++) {
            const val = matrix[row]?.[col] ?? 0;
            const x = offsetX + col * cellSize;
            const y = offsetY + row * cellSize;

            p.rect(x + 1, y + 1, cellSize - 2, cellSize - 2)
              .fillColor(toColor(val))
              .fillOpacity(0.9)
              .fill()
              .fillOpacity(1);

            // correlation value text (only if cell is large enough)
            if (cellSize >= 24) {
              const textColor = Math.abs(val) > 0.5 ? "#000000" : "#94a3b8";
              p.fontSize(6)
                .fillColor(textColor)
                .text(val.toFixed(2), x + 2, y + cellSize / 2 - 4, {
                  width: cellSize - 4,
                  align: "center",
                });
            }
          }

          // row label (column name)
          const shortLabel =
            labels[row].length > 10
              ? labels[row].slice(0, 9) + "…"
              : labels[row];
          p.fontSize(7)
            .fillColor("#94a3b8")
            .text(shortLabel, 2, offsetY + row * cellSize + cellSize / 2 - 4, {
              width: offsetX - 4,
              align: "right",
            });
        }

        // column header labels (rotated text not supported in Canvas,
        // so we draw them at a small font diagonally offset)
        for (let col = 0; col < n; col++) {
          const shortLabel =
            labels[col].length > 8
              ? labels[col].slice(0, 7) + "…"
              : labels[col];
          const x = offsetX + col * cellSize + cellSize / 2 - 10;
          p.fontSize(6)
            .fillColor("#94a3b8")
            .text(shortLabel, x, 4, { width: cellSize + 10 });
        }

        return null;
      }}
    />
  );
}
