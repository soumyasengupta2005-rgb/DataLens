import { useEffect, useState } from 'react';

const steps = [
  { label: 'Parsing CSV structure...', pct: 15 },
  { label: 'Computing column statistics...', pct: 35 },
  { label: 'Detecting correlations...', pct: 55 },
  { label: 'Identifying trends & outliers...', pct: 75 },
  { label: 'Generating natural language insights...', pct: 90 },
  { label: 'Rendering visualizations...', pct: 100 },
];

interface Props {
  fileName: string;
}

export default function LoadingScreen({ fileName }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let step = 0;
    const advance = () => {
      if (step < steps.length - 1) {
        step++;
        setStepIdx(step);
        setProgress(steps[step].pct);
        setTimeout(advance, 260 + Math.random() * 180);
      }
    };
    setProgress(steps[0].pct);
    setTimeout(advance, 280);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Spinning orb */}
        <div className="relative inline-flex items-center justify-center w-28 h-28 mb-8">
          <div className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, #00f5ff, #8b5cf6, #ec4899, transparent)',
              animationDuration: '1.5s',
            }} />
          <div className="absolute inset-1 rounded-full"
            style={{ background: '#050816' }} />
          <div className="relative text-3xl">🔬</div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Analyzing Data</h2>
        <p className="text-sm text-slate-500 mb-8 truncate max-w-xs mx-auto">
          📄 {fileName}
        </p>

        {/* Progress bar */}
        <div className="progress-bar mb-3">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #00f5ff, #8b5cf6)',
              boxShadow: '0 0 10px rgba(0,245,255,0.5)',
              transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-500 mb-8">
          <span>{steps[stepIdx].label}</span>
          <span className="text-cyan-400 font-mono">{progress}%</span>
        </div>

        {/* Steps list */}
        <div className="space-y-2 text-left">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-sm transition-all"
              style={{ opacity: i <= stepIdx ? 1 : 0.2 }}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-all ${
                i < stepIdx ? 'bg-green-500' : i === stepIdx ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'
              }`}>
                {i < stepIdx ? '✓' : i === stepIdx ? '◉' : '○'}
              </div>
              <span className={i < stepIdx ? 'text-slate-400 line-through' : i === stepIdx ? 'text-cyan-300' : 'text-slate-600'}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Wave animation */}
        <div className="flex items-center justify-center gap-1 mt-10">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="wave-bar"
              style={{
                animationDelay: `${i * 0.1}s`,
                background: i % 3 === 0 ? '#00f5ff' : i % 3 === 1 ? '#8b5cf6' : '#ec4899',
                height: `${12 + (i % 3) * 6}px`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
