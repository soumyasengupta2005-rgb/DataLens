import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, Zap, BarChart2, Brain, GitBranch } from 'lucide-react';

interface Props {
  onFile: (file: File) => void;
  error: string | null;
}

const features = [
  { icon: BarChart2, label: 'Auto Charts', desc: 'Line, bar, scatter & more', color: 'text-cyan-400' },
  { icon: Brain, label: 'AI Insights', desc: 'Rule-based NL summaries', color: 'text-purple-400' },
  { icon: GitBranch, label: 'Correlations', desc: 'Heatmap + explanations', color: 'text-pink-400' },
  { icon: Zap, label: 'Outlier Alert', desc: 'Z-score anomaly detection', color: 'text-amber-400' },
];

const sampleCSV = `Month,Sales,Revenue,Customers,Returns
Jan,120,45000,320,12
Feb,135,52000,350,15
Mar,98,38000,280,8
Apr,210,78000,520,22
May,185,69000,470,19
Jun,240,90000,580,25
Jul,195,73000,495,20
Aug,88,34000,260,7
Sep,265,99000,630,28
Oct,310,115000,750,33
Nov,290,108000,720,30
Dec,380,142000,900,40`;

export default function UploadScreen({ onFile, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) onFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  const downloadSample = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Hero Header */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold tracking-widest uppercase"
          style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Instant CSV Intelligence
        </div>

        <h1 className="text-6xl md:text-7xl font-black mb-4 leading-none tracking-tight">
          <span className="shimmer-text">DataLens</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
          Upload any CSV and get{' '}
          <span className="text-cyan-400 font-semibold">instant charts</span>,{' '}
          <span className="text-purple-400 font-semibold">correlation maps</span>, and{' '}
          <span className="text-pink-400 font-semibold">human-like insights</span> 
        </p>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 animate-slide-up stagger-2">
        {features.map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="glass-card p-4 text-center group cursor-default">
            <Icon className={`w-6 h-6 ${color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
            <div className="text-sm font-semibold text-white">{label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      <div className="w-full max-w-2xl animate-slide-up stagger-3">
        <div
          className={`upload-zone p-16 text-center cursor-pointer transition-all ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />

          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 transition-all ${dragOver ? 'animate-bounce' : 'animate-float'}`}
            style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)' }}>
            <Upload className="w-10 h-10 text-cyan-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {dragOver ? 'Drop it here!' : 'Drop your CSV file'}
          </h2>
          <p className="text-slate-400 mb-6">
            or{' '}
            <span className="text-cyan-400 underline underline-offset-2 cursor-pointer hover:text-cyan-300">
              browse to upload
            </span>
          </p>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>CSV format only</span>
            </div>
            <span>·</span>
            <span>Any size</span>
            <span>·</span>
            <span>Processed locally</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-xl text-sm text-red-300 animate-fade-in"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); downloadSample(); }}
            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors underline underline-offset-2"
          >
            Download sample CSV to try →
          </button>
        </div>
      </div>

      {/* Bottom badges */}
      <div className="mt-12 flex flex-wrap justify-center gap-3 animate-slide-up stagger-5">
        {['🔒 No data leaves your browser', '⚡ Instant analysis', '🎨 Beautiful visualizations', '🧠 Smart insights'].map(label => (
          <span key={label} className="text-xs px-3 py-1.5 rounded-full text-slate-400"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {label}
          </span>
        ))}
      </div>
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

