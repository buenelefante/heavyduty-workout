import React, { useState, useEffect } from 'react';
import { Dumbbell, Zap, Disc, Timer, Shield, Cloud, RefreshCw } from 'lucide-react';
import { db } from './db/db';
import { WorkoutSession } from './types/workout';
import { WorkoutsView } from './components/WorkoutsView';
import { ActiveWorkoutView } from './components/ActiveWorkoutView';
import { AnalyticsView } from './components/AnalyticsView';
import { HistoryView } from './components/HistoryView';
import { CalculatorsView } from './components/CalculatorsView';
import { SettingsModal } from './components/SettingsModal';
import { Navigation, TabType } from './components/Navigation';
import { RestTimerFloating } from './components/RestTimerFloating';
import { PlateCalculatorModal } from './components/PlateCalculatorModal';
import { SyncModal } from './components/SyncModal';
import { calculateWorkoutTonnage } from './utils/strength';
import { 
  getSavedSyncKey, 
  saveSyncKey, 
  performSync, 
  generateSyncKey 
} from './utils/syncService';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('workouts');
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [isPlateModalOpen, setIsPlateModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncingBackground, setIsSyncingBackground] = useState(false);

  // Floating Rest Timer State
  const [restTimer, setRestTimer] = useState<{
    isOpen: boolean;
    initialSeconds: number;
    exerciseName?: string;
  }>({
    isOpen: false,
    initialSeconds: 90,
  });

  // Restore active workout and handle QR Code deep link / auto sync
  useEffect(() => {
    async function initApp() {
      // 1. Restore active workout
      const ongoing = await db.workouts.filter((w) => !w.completed).last();
      if (ongoing) {
        setActiveWorkout(ongoing);
      }

      // 2. Check for deep link pairing (?sync=HD-XXXX-XXXX)
      const urlParams = new URLSearchParams(window.location.search);
      const deepLinkSyncKey = urlParams.get('sync');
      if (deepLinkSyncKey) {
        saveSyncKey(deepLinkSyncKey);
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsSyncingBackground(true);
        await performSync(deepLinkSyncKey);
        setIsSyncingBackground(false);
        setIsSyncModalOpen(true);
      } else {
        // Background sync on launch if key exists
        const savedKey = getSavedSyncKey();
        if (savedKey && navigator.onLine) {
          setIsSyncingBackground(true);
          await performSync(savedKey);
          setIsSyncingBackground(false);
        }
      }
    }

    initApp();

    // Auto-sync when coming back online from gym
    const handleOnline = async () => {
      const savedKey = getSavedSyncKey();
      if (savedKey) {
        setIsSyncingBackground(true);
        await performSync(savedKey);
        setIsSyncingBackground(false);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const handleStartWorkout = (session: WorkoutSession) => {
    setActiveWorkout(session);
    setActiveTab('active');
  };

  const handleUpdateWorkout = async (updated: WorkoutSession) => {
    setActiveWorkout(updated);
    await db.workouts.put(updated);
  };

  const handleFinishWorkout = async () => {
    if (!activeWorkout) return;

    const { tonnageKg, totalSets, totalReps } = calculateWorkoutTonnage(activeWorkout.exercises);

    const finished: WorkoutSession = {
      ...activeWorkout,
      totalTonnageKg: tonnageKg,
      totalSets,
      totalReps,
      completed: true,
      endTime: new Date().toISOString(),
    };

    await db.workouts.put(finished);
    setActiveWorkout(null);
    setRestTimer((prev) => ({ ...prev, isOpen: false }));
    setActiveTab('history');

    // Auto-sync to Cloud for iPad / Android sync
    const savedKey = getSavedSyncKey();
    if (savedKey && navigator.onLine) {
      setIsSyncingBackground(true);
      performSync(savedKey).finally(() => setIsSyncingBackground(false));
    }
  };

  const handleCancelWorkout = async () => {
    if (!activeWorkout) return;
    if (window.confirm('Отменить и удалить текущую незавершенную тренировку?')) {
      await db.workouts.delete(activeWorkout.id);
      setActiveWorkout(null);
      setRestTimer((prev) => ({ ...prev, isOpen: false }));
      setActiveTab('workouts');
    }
  };

  const triggerRestTimer = (seconds: number, exerciseName: string) => {
    setRestTimer({
      isOpen: true,
      initialSeconds: seconds,
      exerciseName,
    });
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0c0e16]/90 backdrop-blur-xl border-b border-[#1e2336] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div
            onClick={() => setActiveTab('workouts')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                HEAVYDUTY
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  5×5+
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                StrongLifts 3-Day Hypertrophy
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cloud Sync Button */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700/80 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold"
              title="Синхронизация между iPad и Android"
            >
              <Cloud className={`w-4 h-4 text-cyan-400 ${isSyncingBackground ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">Синхр</span>
            </button>

            {/* Quick Plate Calculator Barbell Button */}
            <button
              onClick={() => setIsPlateModalOpen(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700/80 active:scale-95 transition flex items-center gap-1 text-xs font-bold"
              title="Быстрый калькулятор блинов"
            >
              <Disc className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Блины</span>
            </button>

            {/* Offline badge */}
            <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline-First</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'workouts' && (
          <WorkoutsView
            onStartWorkout={handleStartWorkout}
            activeWorkoutSession={activeWorkout}
            onContinueActiveWorkout={() => setActiveTab('active')}
          />
        )}

        {activeTab === 'active' && activeWorkout && (
          <ActiveWorkoutView
            workout={activeWorkout}
            onUpdateWorkout={handleUpdateWorkout}
            onFinishWorkout={handleFinishWorkout}
            onCancelWorkout={handleCancelWorkout}
            onTriggerRestTimer={triggerRestTimer}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'history' && <HistoryView />}

        {activeTab === 'calculators' && <CalculatorsView />}

        {activeTab === 'settings' && <SettingsModal />}
      </main>

      {/* Persistent Floating Rest Timer */}
      <RestTimerFloating
        isOpen={restTimer.isOpen}
        initialSeconds={restTimer.initialSeconds}
        exerciseName={restTimer.exerciseName}
        onClose={() => setRestTimer((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Global Quick Plate Calculator Modal */}
      <PlateCalculatorModal
        isOpen={isPlateModalOpen}
        onClose={() => setIsPlateModalOpen(false)}
      />

      {/* Cloud Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        hasActiveWorkout={!!activeWorkout && !activeWorkout.completed}
      />
    </div>
  );
};
export default App;
