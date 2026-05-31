import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { analyzeData, AnalysisResult } from './utils/analytics';
import UploadScreen from './components/UploadScreen';
import Dashboard from './components/Dashboard';
import LoadingScreen from './components/LoadingScreen';

export type AppState = 'upload' | 'loading' | 'dashboard';

export default function App() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setFileName(file.name);
    setAppState('loading');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            throw new Error('CSV file appears to be empty.');
          }
          const data = results.data as Record<string, string>[];
          const result = analyzeData(data);
          setTimeout(() => {
            setAnalysis(result);
            setAppState('dashboard');
          }, 1800);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Failed to analyze CSV.');
          setAppState('upload');
        }
      },
      error: (err: Error) => {
        setError(err.message);
        setAppState('upload');
      },
    });
  }, []);

  const handleReset = useCallback(() => {
    setAppState('upload');
    setAnalysis(null);
    setFileName('');
    setError(null);
  }, []);

  return (
    <div className="min-h-screen grid-bg">
      {/* Ambient particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="particle w-2 h-2 bg-cyan-400/20 top-[10%] left-[15%]" style={{ animationDelay: '0s', animationDuration: '8s' }} />
        <div className="particle w-3 h-3 bg-purple-400/20 top-[20%] right-[20%]" style={{ animationDelay: '2s', animationDuration: '10s' }} />
        <div className="particle w-1.5 h-1.5 bg-pink-400/30 top-[60%] left-[8%]" style={{ animationDelay: '1s', animationDuration: '7s' }} />
        <div className="particle w-2 h-2 bg-cyan-400/15 bottom-[20%] right-[10%]" style={{ animationDelay: '3s', animationDuration: '9s' }} />
        <div className="particle w-4 h-4 bg-purple-400/10 bottom-[40%] left-[40%]" style={{ animationDelay: '4s', animationDuration: '12s' }} />
        {/* Gradient orbs */}
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00f5ff, transparent 70%)' }} />
      </div>

      {appState === 'upload' && (
        <UploadScreen onFile={handleFile} error={error} />
      )}
      {appState === 'loading' && (
        <LoadingScreen fileName={fileName} />
      )}
      {appState === 'dashboard' && analysis && (
        <Dashboard analysis={analysis} fileName={fileName} onReset={handleReset} />
      )}
    </div>
  );
}
