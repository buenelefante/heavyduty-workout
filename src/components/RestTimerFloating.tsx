import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, Plus, Minus, Timer } from 'lucide-react';
import { sound, triggerHapticVibration } from '../utils/sound';

interface RestTimerProps {
  initialSeconds: number;
  exerciseName?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  soundEnabled?: boolean;
}

export const RestTimerFloating: React.FC<RestTimerProps> = ({
  initialSeconds,
  exerciseName,
  isOpen,
  onClose,
  onComplete,
  soundEnabled = true,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isMuted, setIsMuted] = useState(!soundEnabled);

  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setRemainingSeconds(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds, isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isOpen && isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev === 4 || prev === 3 || prev === 2) {
            if (!isMuted) sound.playCountdownPip();
          }
          if (prev <= 1) {
            if (!isMuted) sound.playTimerCompletionGong();
            triggerHapticVibration([100, 100, 300, 100, 500]);
            setIsRunning(false);
            if (onComplete) onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isRunning, remainingSeconds, isMuted, onComplete]);

  if (!isOpen) return null;

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 100;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const addTime = (secs: number) => {
    setRemainingSeconds((prev) => Math.max(0, prev + secs));
    setTotalSeconds((prev) => Math.max(prev, remainingSeconds + secs));
  };

  const isFinished = remainingSeconds === 0;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-2.5 right-2.5 sm:left-4 sm:right-4 max-w-lg mx-auto z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`p-3 sm:p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-colors duration-300 ${
        isFinished 
          ? 'bg-emerald-950/95 border-emerald-500 shadow-emerald-900/50 text-emerald-100' 
          : 'bg-[#12151e]/95 border-[#283046] shadow-black/70 text-slate-100'
      }`}>
        {/* Progress bar line */}
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full mb-2.5 sm:mb-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isFinished ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Desktop / Tablet: Single-row Layout (sm:) */}
        {/* Mobile: Two-row Layout (<sm) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
          {/* Top Row on Mobile: Timer + Exercise + Close Button */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl flex items-center justify-center font-mono font-bold text-base sm:text-lg border transition-transform ${
                isFinished 
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-bounce' 
                  : isRunning 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                {formattedTime}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Timer className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{isFinished ? 'Отдых окончен! В бой!' : 'Таймер отдыха'}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold truncate text-slate-200">
                  {exerciseName || 'Следующий подход'}
                </div>
              </div>
            </div>

            {/* Mobile Close Button (shown on top right on mobile only) */}
            <button
              onClick={onClose}
              className="sm:hidden p-2 rounded-xl bg-slate-800/90 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 flex-shrink-0 transition active:scale-95"
              title="Закрыть таймер"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Row on Mobile (Grid of 4 full-width buttons), Inline on Desktop */}
          <div className="grid grid-cols-4 sm:flex sm:items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => addTime(-15)}
              className="py-2 sm:py-1.5 px-2 rounded-xl sm:rounded-lg bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 text-xs font-bold text-slate-300 text-center active:scale-95 transition border border-slate-700/50 sm:border-transparent"
              title="-15 сек"
            >
              -15с
            </button>

            <button
              onClick={() => addTime(30)}
              className="py-2 sm:py-1.5 px-2 rounded-xl sm:rounded-lg bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 text-xs font-bold text-slate-300 text-center active:scale-95 transition border border-slate-700/50 sm:border-transparent"
              title="+30 сек"
            >
              +30с
            </button>

            {!isFinished ? (
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`py-2 sm:p-2 rounded-xl border flex items-center justify-center active:scale-95 transition ${
                  isRunning
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                }`}
                title={isRunning ? 'Пауза' : 'Старт'}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`py-2 sm:p-2 rounded-xl border flex items-center justify-center transition active:scale-95 ${
                isMuted
                  ? 'bg-slate-800 border-slate-700 text-slate-500'
                  : 'bg-slate-800 border-slate-700 text-cyan-400'
              }`}
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Desktop Close Button (hidden on mobile, shown on sm:) */}
            <button
              onClick={onClose}
              className="hidden sm:flex p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition"
              title="Закрыть таймер"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
