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
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 max-w-lg mx-auto z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-colors duration-300 ${
        isFinished 
          ? 'bg-emerald-950/90 border-emerald-500 shadow-emerald-900/40 text-emerald-100' 
          : 'bg-[#12151e]/95 border-[#283046] shadow-black/60 text-slate-100'
      }`}>
        {/* Progress bar line */}
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full mb-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isFinished ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg border transition-transform ${
              isFinished 
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-bounce' 
                : isRunning 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              {formattedTime}
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Timer className="w-3.5 h-3.5 text-emerald-400" />
                {isFinished ? 'Отдых окончен! В бой!' : 'Таймер отдыха'}
              </div>
              <div className="text-sm font-bold truncate max-w-[150px] sm:max-w-[200px] text-slate-200">
                {exerciseName || 'Следующий подход'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => addTime(30)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 active:scale-95 transition"
              title="+30 сек"
            >
              +30с
            </button>
            <button
              onClick={() => addTime(-15)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 active:scale-95 transition"
              title="-15 сек"
            >
              -15с
            </button>

            {!isFinished && (
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`p-2 rounded-xl border active:scale-95 transition ${
                  isRunning
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                }`}
                title={isRunning ? 'Пауза' : 'Старт'}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
            )}

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border transition ${
                isMuted
                  ? 'bg-slate-800 border-slate-700 text-slate-500'
                  : 'bg-slate-800 border-slate-700 text-cyan-400'
              }`}
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition"
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
