import { lazy, Suspense, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from '@/screens/HomeScreen';
import PlaySetupScreen from '@/screens/PlaySetupScreen';
import NavBar from '@/components/ui/NavBar';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAnalysisStore } from '@/store/analysisStore';

const GameScreen          = lazy(() => import('@/screens/GameScreen'));
const AnalysisScreen      = lazy(() => import('@/screens/AnalysisScreen'));
const PuzzlesScreen       = lazy(() => import('@/screens/PuzzlesScreen'));
const HistoryScreen       = lazy(() => import('@/screens/HistoryScreen'));
const ProfileScreen       = lazy(() => import('@/screens/ProfileScreen'));
const CognitiveTestScreen = lazy(() => import('@/screens/CognitiveTestScreen'));

function DeepAnalysisBar() {
  const { isDeepAnalyzing, deepAnalysisProgress, cancelDeepAnalysis } = useAnalysisStore();
  if (!isDeepAnalyzing) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-chess-surface/95 backdrop-blur border-b border-chess-border/40 px-4 py-2 flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-chess-border/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-chess-accent transition-all duration-300"
          style={{ width: `${Math.round(deepAnalysisProgress * 100)}%` }}
        />
      </div>
      <span className="text-xs text-chess-text-secondary whitespace-nowrap">
        Analyse profonde {Math.round(deepAnalysisProgress * 100)}%
      </span>
      <button
        onClick={cancelDeepAnalysis}
        className="text-xs text-chess-text-muted hover:text-chess-text-primary underline"
      >
        Annuler
      </button>
    </div>
  );
}

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (isOnline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-chess-blunder/90 px-4 py-1.5 text-center text-xs font-medium text-white">
      Hors ligne — Les fonctionnalités réseau sont indisponibles
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <OfflineBanner />
      <DeepAnalysisBar />
      <div className="flex flex-col min-h-dvh app-bg text-chess-text-primary">
        <div className="flex-1 nav-pad">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/play" element={<PlaySetupScreen />} />
              <Route path="/game" element={<GameScreen />} />
              <Route path="/analysis" element={<AnalysisScreen />} />
              <Route path="/puzzles" element={<PuzzlesScreen />} />
              <Route path="/history" element={<HistoryScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/cognitive" element={<CognitiveTestScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
        <NavBar />
      </div>
    </HashRouter>
  );
}
