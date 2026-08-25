import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Trophy, 
  Share2, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { db } from '../db/db';
import { WorkoutSession } from '../types/workout';

export const HistoryView: React.FC = () => {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  const loadWorkouts = async () => {
    const list = await db.workouts
      .filter((w) => w.completed)
      .reverse()
      .sortBy('startTime');
    setWorkouts(list);
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const handleDeleteWorkout = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Удалить эту запись тренировки из истории?')) {
      await db.workouts.delete(id);
      loadWorkouts();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} мин ${secs} сек`;
  };

  return (
    <div className="min-h-screen pb-32 pt-4 px-3 sm:px-6 max-w-4xl mx-auto text-slate-100">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
          <Calendar className="w-4 h-4" />
          Журнал тренировок
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">История тренировок</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Подробный отчет о каждой завершенной тренировочной сессии StrongLifts Plus.
        </p>
      </div>

      {workouts.length === 0 ? (
        <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-12 text-center text-slate-400">
          <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-200">Пока нет завершенных тренировок</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Начните Workout A, B или C во вкладке «Тренировки», чтобы здесь появился подробный журнал.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((w) => {
            const isExpanded = expandedWorkoutId === w.id;
            const formattedDate = new Date(w.startTime).toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={w.id}
                onClick={() => setExpandedWorkoutId(isExpanded ? null : w.id)}
                className={`bg-[#121520] border rounded-3xl p-5 transition cursor-pointer ${
                  isExpanded ? 'border-emerald-500/50 shadow-xl' : 'border-[#23293a] hover:border-slate-700'
                }`}
              >
                {/* Summary Row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-mono font-bold text-xs">
                        {w.workoutType}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">{formattedDate}</span>
                    </div>
                    <h2 className="text-lg font-extrabold text-white">{w.name}</h2>

                    {/* Workout-level notes badge */}
                    {w.notes && (
                      <div className="mt-2 text-xs text-slate-300 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 max-w-xl">
                        <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="italic truncate">{w.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4 bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-800 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        {formatDuration(w.durationSeconds)}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-300 font-mono">
                        <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                        {w.totalTonnageKg} кг
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteWorkout(w.id, e)}
                      className="p-2 rounded-xl text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Удалить тренировку"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-5 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {w.exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 text-xs"
                        >
                          <div className="font-bold text-sm text-slate-200 mb-1 flex items-center justify-between">
                            <span>{ex.exerciseNameRu || ex.exerciseName}</span>
                            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              {ex.targetMuscleGroup}
                            </span>
                          </div>

                          {/* Exercise-level Note */}
                          {ex.notes && (
                            <div className="mb-2.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5">
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              <span>{ex.notes}</span>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            {ex.sets.map((set) => (
                              <div
                                key={set.id}
                                className={`flex items-center justify-between px-2.5 py-1 rounded-xl ${
                                  set.completed ? 'bg-slate-950/60 text-slate-200' : 'bg-slate-950/20 text-slate-500 line-through'
                                }`}
                              >
                                <span className="font-mono text-slate-400 font-semibold">Сет {set.setNumber}</span>
                                <span className="font-mono font-bold">
                                  {set.isTimeBased
                                    ? `${set.actualSeconds || set.targetSeconds || 30} сек`
                                    : `${set.weightKg > 0 ? `${set.weightKg} кг × ` : ''}${set.reps} повт.`}
                                </span>
                                {set.completed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <span className="text-[10px] text-slate-500">Пропущен</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
