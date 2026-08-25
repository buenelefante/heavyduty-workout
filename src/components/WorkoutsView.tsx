import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Flame, 
  Sparkles, 
  Dumbbell, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  TrendingUp, 
  Info, 
  Zap,
  Plus
} from 'lucide-react';
import { ProgramTemplate, WorkoutSession, WorkoutExercise } from '../types/workout';
import { STRONGLIFTS_PLUS_PROGRAMS, INITIAL_EXERCISES } from '../data/exercises';
import { db } from '../db/db';

interface WorkoutsViewProps {
  onStartWorkout: (session: WorkoutSession) => void;
  activeWorkoutSession: WorkoutSession | null;
  onContinueActiveWorkout: () => void;
}

export const WorkoutsView: React.FC<WorkoutsViewProps> = ({
  onStartWorkout,
  activeWorkoutSession,
  onContinueActiveWorkout,
}) => {
  const [lastCompletedWorkout, setLastCompletedWorkout] = useState<WorkoutSession | null>(null);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [nextSuggestedCode, setNextSuggestedCode] = useState<'A' | 'B' | 'C'>('A');

  useEffect(() => {
    async function checkWorkoutHistory() {
      const allCompleted = await db.workouts
        .filter((w) => w.completed)
        .reverse()
        .sortBy('startTime');

      setCompletedCount(allCompleted.length);

      if (allCompleted.length > 0) {
        const last = allCompleted[0];
        setLastCompletedWorkout(last);

        // Stronglifts 3-day rotation: A -> B -> C -> A
        if (last.workoutType === 'A') setNextSuggestedCode('B');
        else if (last.workoutType === 'B') setNextSuggestedCode('C');
        else setNextSuggestedCode('A');
      } else {
        setNextSuggestedCode('A');
      }
    }

    checkWorkoutHistory();
  }, [activeWorkoutSession]);

  // Create and launch a workout from a template with progressive overload logic
  const handleLaunchProgram = async (program: ProgramTemplate) => {
    const allCompleted = await db.workouts
      .filter((w) => w.completed)
      .reverse()
      .sortBy('startTime');

    const exercises: WorkoutExercise[] = [];

    for (const progEx of program.exercises) {
      const def = INITIAL_EXERCISES.find((e) => e.id === progEx.exerciseId);
      if (!def) continue;

      // Find last time this exercise was performed to suggest weight
      let suggestedWeight = progEx.defaultWeightKg || 0;
      let allSetsWereHitLastTime = false;

      for (const prevW of allCompleted) {
        const prevEx = prevW.exercises.find((e) => e.exerciseId === progEx.exerciseId);
        if (prevEx && prevEx.sets.length > 0) {
          const completedSets = prevEx.sets.filter((s) => s.completed);
          if (completedSets.length > 0) {
            suggestedWeight = completedSets[0].weightKg;
            // Check if user hit all target reps on all sets last time
            allSetsWereHitLastTime = completedSets.every(
              (s) => s.reps >= (s.targetReps || progEx.targetReps || 8)
            );
            break;
          }
        }
      }

      // Auto progressive overload suggestion: +2.5kg for heavy compound barbell if all reps were hit!
      if (allSetsWereHitLastTime && def.isBarbell && suggestedWeight > 0) {
        suggestedWeight = Math.round((suggestedWeight + 2.5) * 10) / 10;
      }

      const sets = Array.from({ length: progEx.targetSets }).map((_, idx) => ({
        id: `set-${Date.now()}-${progEx.exerciseId}-${idx}`,
        setNumber: idx + 1,
        type: 'normal' as const,
        weightKg: suggestedWeight,
        reps: progEx.targetReps || def.defaultReps || 8,
        targetReps: progEx.targetReps || def.defaultReps || 8,
        targetSeconds: progEx.targetSeconds || def.defaultSeconds,
        isTimeBased: progEx.isTimeBased || def.isTimeBased,
        completed: false,
      }));

      exercises.push({
        id: `ex-${Date.now()}-${progEx.exerciseId}`,
        exerciseId: progEx.exerciseId,
        exerciseName: def.name,
        exerciseNameRu: def.nameRu,
        targetMuscleGroup: def.targetMuscleGroup,
        secondaryMuscles: def.secondaryMuscles,
        isBodyweight: def.isBodyweight,
        isTimeBased: def.isTimeBased,
        isBarbell: def.isBarbell,
        defaultRestSeconds: def.defaultRestSeconds,
        sets,
      });
    }

    const newSession: WorkoutSession = {
      id: `workout-${Date.now()}`,
      name: `StrongLifts Plus - ${program.name}`,
      workoutType: program.code,
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      exercises,
      totalTonnageKg: 0,
      totalSets: 0,
      totalReps: 0,
      completed: false,
    };

    await db.workouts.put(newSession);
    onStartWorkout(newSession);
  };

  // Launch a custom empty workout
  const handleLaunchCustomWorkout = async () => {
    const newSession: WorkoutSession = {
      id: `workout-custom-${Date.now()}`,
      name: 'Свободная силовая тренировка',
      workoutType: 'custom',
      startTime: new Date().toISOString(),
      durationSeconds: 0,
      exercises: [
        {
          id: `ex-${Date.now()}-squat`,
          exerciseId: 'squat',
          exerciseName: 'Squat',
          exerciseNameRu: 'Приседания со штангой',
          targetMuscleGroup: 'quads',
          isBarbell: true,
          isBodyweight: false,
          isTimeBased: false,
          defaultRestSeconds: 120,
          sets: [
            {
              id: `set-1`,
              setNumber: 1,
              type: 'normal',
              weightKg: 60,
              reps: 8,
              targetReps: 8,
              completed: false,
            },
          ],
        },
      ],
      totalTonnageKg: 0,
      totalSets: 0,
      totalReps: 0,
      completed: false,
    };

    await db.workouts.put(newSession);
    onStartWorkout(newSession);
  };

  return (
    <div className="min-h-screen pb-32 pt-4 px-3 sm:px-6 max-w-4xl mx-auto text-slate-100">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-br from-[#131724] via-[#10141f] to-[#090b11] border border-[#262c3e] rounded-3xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                  StrongLifts 5×5 Plus
                </span>
                <span className="text-xs text-slate-400">3 раза в неделю</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white mt-2 tracking-tight">
                Силовая программа & Гипертрофия
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl">
                Проверенный 3-дневный сплит (A / B / C) с акцентом на прогрессивную перегрузку, базу со штангой и гипертрофию верха тела.
              </p>
            </div>

            {/* Total Workouts Counter Badge */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center min-w-[120px]">
              <div className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Всего сессий</div>
              <div className="font-mono text-3xl font-black text-emerald-400 mt-1">{completedCount}</div>
            </div>
          </div>

          {/* Active Workout Resumption Card */}
          {activeWorkoutSession && !activeWorkoutSession.completed && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    У вас есть незавершенная тренировка
                  </div>
                  <div className="text-sm font-bold text-slate-100">{activeWorkoutSession.name}</div>
                </div>
              </div>
              <button
                onClick={onContinueActiveWorkout}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition"
              >
                Продолжить
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Program Routine Cards (A, B, C) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-emerald-400" />
              Программа StrongLifts 5×5 Plus
            </h2>
            <p className="text-xs text-slate-400">Выберите тренировку на сегодня</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STRONGLIFTS_PLUS_PROGRAMS.map((prog) => {
            const isRecommended = prog.code === nextSuggestedCode;

            return (
              <div
                key={prog.id}
                className={`rounded-3xl p-5 border flex flex-col justify-between transition-all duration-200 relative overflow-hidden group ${
                  isRecommended
                    ? 'bg-[#131826] border-emerald-500/60 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'bg-[#12141c] border-[#222738] hover:border-slate-700'
                }`}
              >
                {isRecommended && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-wider py-1 px-3 rounded-bl-xl shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Рекомендуется сегодня
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-8 h-8 rounded-xl font-mono font-black text-sm flex items-center justify-center ${
                      isRecommended ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {prog.code}
                    </span>
                    <h3 className="font-extrabold text-lg text-white">
                      Workout {prog.code}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 min-h-[32px]">
                    {prog.description}
                  </p>

                  {/* Exercise Targets List */}
                  <div className="space-y-2 mb-6">
                    {prog.exercises.map((item, idx) => {
                      const def = INITIAL_EXERCISES.find((e) => e.id === item.exerciseId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs"
                        >
                          <span className="font-medium text-slate-200 truncate max-w-[150px]">
                            {def?.nameRu || def?.name || item.exerciseId}
                          </span>
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[11px]">
                            {item.targetSets} × {item.isTimeBased ? `${item.targetSeconds}с` : item.targetReps}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  onClick={() => handleLaunchProgram(prog)}
                  className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition ${
                    isRecommended
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Начать Workout {prog.code}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Free Custom Workout Option */}
      <div className="p-5 rounded-3xl bg-[#12151f] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Свободная тренировка
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Создать пустую тренировку и добавлять любые упражнения на ходу
          </p>
        </div>
        <button
          onClick={handleLaunchCustomWorkout}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs active:scale-95 transition"
        >
          Начать свободную
        </button>
      </div>
    </div>
  );
};
