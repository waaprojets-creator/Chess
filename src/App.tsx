import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from '@/screens/HomeScreen';
import PlaySetupScreen from '@/screens/PlaySetupScreen';
import GameScreen from '@/screens/GameScreen';
import AnalysisScreen from '@/screens/AnalysisScreen';
import PuzzlesScreen from '@/screens/PuzzlesScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import NavBar from '@/components/ui/NavBar';
import { useAnalysisStore } from '@/store/analysisStore';

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

export default function App() {
  return (
    <HashRouter>
      <DeepAnalysisBar />
      <div className="flex flex-col min-h-dvh app-bg text-chess-text-primary">
        <div className="flex-1 nav-pad">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/play" element={<PlaySetupScreen />} />
            <Route path="/game" element={<GameScreen />} />
            <Route path="/analysis" element={<AnalysisScreen />} />
            <Route path="/puzzles" element={<PuzzlesScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <NavBar />
      </div>
    </HashRouter>
  );
}
