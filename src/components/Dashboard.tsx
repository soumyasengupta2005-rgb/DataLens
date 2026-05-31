import { useState, useRef } from "react";
import { AnalysisResult } from "../utils/analytics";
import {
  RefreshCw,
  Database,
  TrendingUp,
  GitBranch,
  Zap,
  MessageSquare,
  BarChart2,
} from "lucide-react";
import SummaryCards from "./SummaryCards";
import InsightsPanel from "./InsightsPanel";
import ChartsPanel from "./ChartsPanel";
import CorrelationHeatmap from "./CorrelationHeatmap";
import OutliersPanel from "./OutliersPanel";
import TrendsPanel from "./TrendsPanel";
import { pdf } from "@react-pdf/renderer";
import ReportDocument from "../report/pdf/ReportDocument";
interface Props {
  analysis: AnalysisResult;
  fileName: string;
  onReset: () => void;
}

const tabs = [
  { id: "overview", label: "Overview", icon: Database },
  { id: "charts", label: "Charts", icon: BarChart2 },
  { id: "correlations", label: "Correlations", icon: GitBranch },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "outliers", label: "Outliers", icon: Zap },
  { id: "insights", label: "Insights", icon: MessageSquare },
];

export default function Dashboard({ analysis, fileName, onReset }: Props) {
  const [activeTab, setActiveTab] = useState("overview");
  const reportRef = useRef<HTMLDivElement>(null);
  const handleDownloadReport = async () => {
    try {
      const blob = await pdf(
        <ReportDocument analysis={analysis} fileName={fileName} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `${fileName.replace(".csv", "")}-report.pdf`;

      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header
        className="sticky top-0 z-50 px-4 py-3"
        style={{
          background: "rgba(5,8,22,0.9)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black shimmer-text">DataLens</span>
            <span
              className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full text-slate-400"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {fileName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="hidden sm:block">
              {analysis.rowCount.toLocaleString()} rows · {analysis.colCount}{" "}
              cols
            </span>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #1a0b2e, #3b0764)",
                border: "1px solid rgba(236,72,153,0.18)",
                boxShadow: "0 0 24px rgba(168,85,247,0.16)",
              }}
            >
              Download Report
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #1a0b2e, #3b0764)",
                border: "1px solid rgba(236,72,153,0.18)",
                boxShadow: "0 0 24px rgba(168,85,247,0.16)",
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New File
            </button>
          </div>
        </div>
      </header>
      {/* Tabs */}
      <div
        className="px-4 pt-4 pb-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 overflow-x-auto pb-2 no-scrollbar">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`tab-btn flex items-center gap-1.5 whitespace-nowrap ${activeTab === id ? "active" : ""}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {id === "outliers" && analysis.outliers.length > 0 && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: "rgba(245,158,11,0.2)",
                      color: "#f59e0b",
                    }}
                  >
                    {analysis.outliers.length}
                  </span>
                )}
                {id === "insights" && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: "rgba(139,92,246,0.2)",
                      color: "#8b5cf6",
                    }}
                  >
                    {analysis.insights.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Content */}
      <main ref={reportRef} className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === "overview" && (
            <div className="animate-fade-in space-y-6">
              <SummaryCards analysis={analysis} />
              <ChartsPanel analysis={analysis} compact />
            </div>
          )}
          {activeTab === "charts" && (
            <div className="animate-fade-in">
              <ChartsPanel analysis={analysis} compact={false} />
            </div>
          )}
          {activeTab === "correlations" && (
            <div className="animate-fade-in">
              <CorrelationHeatmap analysis={analysis} />
            </div>
          )}
          {activeTab === "trends" && (
            <div className="animate-fade-in">
              <TrendsPanel analysis={analysis} />
            </div>
          )}
          {activeTab === "outliers" && (
            <div className="animate-fade-in">
              <OutliersPanel analysis={analysis} />
            </div>
          )}
          {activeTab === "insights" && (
            <div className="animate-fade-in">
              <InsightsPanel analysis={analysis} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
const Footer = () => (
  <footer
    style={{
      backgroundColor: "#050816",
      borderTop: "1px solid #1e293b",
      padding: "32px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    }}
  >
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: "#00f5ff",
      }}
    >
      DATALENS
    </span>

    <div style={{ width: 40, height: 1, backgroundColor: "#1e293b" }} />

    <span style={{ fontSize: 14, color: "#94a3b8" }}>
      Built by <span style={{ color: "#f8fafc", fontWeight: 600 }}>Soumya</span>
    </span>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        marginTop: 2,
      }}
    >
      {[
        {
          href: "mailto:soumya.ckd2005@gmail.com",
          title: "Gmail",
          path: (
            <>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 7l10 7 10-7" />
            </>
          ),
        },
        {
          href: "https://www.linkedin.com/in/soumya-sengupta-a8346633a",
          title: "LinkedIn",
          path: (
            <>
              <rect x="2" y="2" width="20" height="20" rx="4" />
              <path d="M7 10v7M7 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" />
            </>
          ),
        },
        {
          href: "https://github.com/soumyasengupta2005-rgb",
          title: "GitHub",
          path: (
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          ),
        },
      ].map(({ href, title, path }) => (
        <a
          key={title}
          href={href}
          title={title}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid #1e293b",
            backgroundColor: "#0f172a",
            color: "#64748b",
            textDecoration: "none",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "#00f5ff";
            (e.currentTarget as HTMLAnchorElement).style.color = "#00f5ff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor =
              "#1e293b";
            (e.currentTarget as HTMLAnchorElement).style.color = "#64748b";
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {path}
          </svg>
        </a>
      ))}
    </div>
  </footer>
);
