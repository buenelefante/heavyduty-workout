import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  Plus, 
  Trash2, 
  Disc, 
  Calculator, 
  Timer, 
  Flame, 
  Trophy, 
  Clock, 
  Dumbbell, 
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Smile,
  Scale
} from 'lucide-react';
import { WorkoutSession, WorkoutExercise, ExerciseSet, SetType } from '../types/workout';
import { db } from '../db/db';
import { calculate1RM, calculateWorkoutTonnage } from '../utils/strength';
import { sound, triggerHapticVibration } from '../utils/sound';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { OneRMCalculatorModal } from './OneRMCalculatorModal';

interface ActiveWorkoutViewProps {
  workout: WorkoutSession;
  onUpdateWorkout: (updated: WorkoutSession) => void;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
  onTriggerRestTimer: (seconds: number, exerciseName: string) => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({
  workout,
  onUpdateWorkout,
  onFinishWorkout,
  onCancelWorkout,
  onTriggerRestTimer,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(workout.durationSeconds || 0);
  const [selectedExerciseForPlates, setSelectedExerciseForPlates] = useState<{ weight: number } | null>(null);
  const [selectedExerciseFor1RM, setSelectedExerciseFor1RM] = useState<{ weight: number; reps: number } | null>(null);
  const [previousPerformanceMap, setPreviousPerformanceMap] = useState<Record<string, { weightKg: number; reps: number; seconds?: number }>>({});
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [activePlankTimers, setActivePlankTimers] = useState<Record<string, { remaining: number; running: boolean }>>({});
  const [isWorkoutNotesOpen, setIsWorkoutNotesOpen] = useState(Boolean(workout.notes));
  const [openExerciseNoteIds, setOpenExerciseNoteIds] = useState<Record<string, boolean>>({});

  // Timer interval for total workout duration (updates UI counter without thrashing state)
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch previous performance from DB for all exercises
  useEffect(() => {
    async function loadPreviousLogs() {
      const allCompleted = await db.workouts
        .filter((w) => w.completed && w.id !== workout.id)
        .reverse()
        .sortBy('startTime');

      const map: Record<string, { weightKg: number; reps: number; seconds?: number }> = {};
      for (const ex of workout.exercises) {
        for (const prevWorkout of allCompleted) {
          const matchingEx = prevWorkout.exercises.find((e) => e.exerciseId === ex.exerciseId);
          if (matchingEx) {
            const completedSets = matchingEx.sets.filter((s) => s.completed);
            if (completedSets.length > 0) {
              const bestSet = completedSets[0];
              map[ex.exerciseId] = {
                weightKg: bestSet.weightKg,
                reps: bestSet.reps,
                seconds: bestSet.actualSeconds || bestSet.targetSeconds,
              };
              break;
            }
          }
        }
      }
      setPreviousPerformanceMap(map);
    }

    loadPreviousLogs();
  }, [workout.id]);

  // Handle active plank stopwatch ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlankTimers((prev) => {
        let changed = false;
        const updated = { ...prev };
        for (const [setId, timer] of Object.entries(prev)) {
          if (timer.running && timer.remaining > 0) {
            changed = true;
            const newRemaining = timer.remaining - 1;
            updated[setId] = { ...timer, remaining: newRemaining };
            if (newRemaining === 0) {
              sound.playTimerCompletionGong();
              triggerHapticVibration([100, 100, 200]);
              updated[setId] = { remaining: 0, running: false };
            }
          }
        }
        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update a single set in an exercise
  const handleUpdateSet = (exerciseIndex: number, setIndex: number, changes: Partial<ExerciseSet>) => {
    const updatedExercises = [...workout.exercises];
    const currentSet = updatedExercises[exerciseIndex].sets[setIndex];
    const updatedSet = { ...currentSet, ...changes };

    updatedExercises[exerciseIndex].sets[setIndex] = updatedSet;
    const { tonnageKg, totalSets, totalReps } = calculateWorkoutTonnage(updatedExercises);

    onUpdateWorkout({
      ...workout,
      exercises: updatedExercises,
      totalTonnageKg: tonnageKg,
      totalSets,
      totalReps,
    });
  };

  // Toggle set completion + trigger Rest Timer & PR check
  const handleToggleSetComplete = async (exerciseIndex: number, setIndex: number) => {
    const targetExercise = workout.exercises[exerciseIndex];
    const targetSet = targetExercise.sets[setIndex];
    const willBeCompleted = !targetSet.completed;

    handleUpdateSet(exerciseIndex, setIndex, { completed: willBeCompleted });

    if (willBeCompleted) {
      triggerHapticVibration([50]);

      // Check for Personal Record (PR)
      if (!targetExercise.isBodyweight || targetSet.weightKg > 0) {
        const est1RM = calculate1RM(targetSet.weightKg, targetSet.reps);
        const existingPR = await db.personalRecords.where('exerciseId').equals(targetExercise.exerciseId).first();

        if (!existingPR || est1RM > existingPR.estimated1RMKg) {
          // New PR!
          sound.playPRCelebrationFanfare();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899'],
          });

          await db.personalRecords.put({
            id: `pr-${targetExercise.exerciseId}`,
            exerciseId: targetExercise.exerciseId,
            exerciseName: targetExercise.exerciseName,
            maxWeightKg: targetSet.weightKg,
            maxReps: targetSet.reps,
            estimated1RMKg: est1RM,
            date: new Date().toISOString(),
            workoutSessionId: workout.id,
          });
        }
      }

      // Automatically trigger rest timer for this exercise
      const restSecs = targetExercise.defaultRestSeconds || 90;
      onTriggerRestTimer(restSecs, targetExercise.exerciseNameRu || targetExercise.exerciseName);
    }
  };

  // Add new set to exercise
  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = [...workout.exercises];
    const ex = updatedExercises[exerciseIndex];
    const lastSet = ex.sets[ex.sets.length - 1];

    const newSet: ExerciseSet = {
      id: `set-${Date.now()}-${Math.random()}`,
      setNumber: ex.sets.length + 1,
      type: 'normal',
      weightKg: lastSet ? lastSet.weightKg : 20,
      reps: lastSet ? lastSet.reps : 8,
      targetReps: lastSet ? lastSet.targetReps : 8,
      targetSeconds: lastSet ? lastSet.targetSeconds : undefined,
      isTimeBased: ex.isTimeBased,
      completed: false,
    };

    ex.sets.push(newSet);
    onUpdateWorkout({ ...workout, exercises: updatedExercises });
  };

  // Remove set
  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...workout.exercises];
    const ex = updatedExercises[exerciseIndex];
    if (ex.sets.length <= 1) return;

    ex.sets.splice(setIndex, 1);
    ex.sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });

    const { tonnageKg, totalSets, totalReps } = calculateWorkoutTonnage(updatedExercises);
    onUpdateWorkout({
      ...workout,
      exercises: updatedExercises,
      totalTonnageKg: tonnageKg,
      totalSets,
      totalReps,
    });
  };

  // Format stopwatch
  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${hrs > 0 ? `${hrs}:` : ''}${mins < 10 && hrs > 0 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const { tonnageKg } = calculateWorkoutTonnage(workout.exercises);

  return (
    <div className="min-h-screen pb-36 pt-4 px-3 sm:px-6 max-w-4xl mx-auto text-slate-100">
      {/* Workout Top Bar */}
      <div className="sticky top-2 z-30 bg-[#10131d]/90 backdrop-blur-xl border border-[#262c3e] rounded-2xl p-4 mb-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              {workout.workoutType !== 'custom' ? `StrongLifts Plus • ${workout.workoutType}` : 'Custom'}
            </span>
            <span className="text-xs text-slate-400">Активная тренировка</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
            {workout.name}
          </h1>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-bold text-sm text-slate-200">{timeFormatted}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <Dumbbell className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-bold text-sm text-slate-200">
              {tonnageKg} <span className="text-xs font-sans text-slate-400">кг</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Scale className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="—"
              value={workout.bodyWeightKg ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                const num = parseFloat(val);
                const updated = !isNaN(num) && num > 0 ? num : undefined;
                onUpdateWorkout({
                  ...workout,
                  bodyWeightKg: updated,
                });
                if (val.trim()) {
                  localStorage.setItem('heavyduty_last_bodyweight', val.trim());
                }
              }}
              className="w-12 bg-transparent text-center font-mono font-bold text-sm text-cyan-300 outline-none"
              title="Вес тела на эту тренировку"
            />
            <span className="text-xs font-sans text-slate-500 pointer-events-none">кг</span>
          </div>

          <button
            onClick={() => setShowFinishModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Завершить
          </button>
        </div>
      </div>

      {/* Workout-level Notes Collapsible Banner */}
      <div className="bg-[#121520] border border-[#212738] rounded-2xl p-3.5 mb-6 shadow-md">
        <div
          onClick={() => setIsWorkoutNotesOpen(!isWorkoutNotesOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Заметки к тренировке</span>
            {workout.notes && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Заполнено
              </span>
            )}
          </div>
          <div className="text-slate-400">
            {isWorkoutNotesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {isWorkoutNotesOpen && (
          <div className="mt-3 pt-3 border-t border-slate-800 animate-in fade-in">
            <textarea
              value={workout.notes || ''}
              onChange={(e) => onUpdateWorkout({ ...workout, notes: e.target.value })}
              placeholder="Как прошла тренировка, самочувствие, сон, питание, памп..."
              rows={2}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 outline-none resize-none transition"
            />
          </div>
        )}
      </div>

      {/* Exercises List */}
      <div className="space-y-6">
        {workout.exercises.map((exercise, exIdx) => {
          const prevLog = previousPerformanceMap[exercise.exerciseId];
          const completedCount = exercise.sets.filter((s) => s.completed).length;
          const isExNoteOpen = openExerciseNoteIds[exercise.id] || Boolean(exercise.notes);

          return (
            <div
              key={exercise.id}
              className="bg-[#121520] border border-[#212738] rounded-3xl p-4 sm:p-5 shadow-lg relative overflow-hidden"
            >
              {/* Exercise Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-extrabold text-emerald-400">
                    {exIdx + 1}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      {exercise.exerciseNameRu || exercise.exerciseName}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-slate-300 font-medium">{exercise.exerciseName}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold uppercase">{exercise.targetMuscleGroup}</span>
                      <span>•</span>
                      <span className="text-slate-400 font-mono">{exercise.sets.length} × {exercise.isTimeBased ? `${exercise.sets[0]?.targetSeconds || 30}с` : (exercise.sets[0]?.targetReps || 8)}</span>
                    </div>
                  </div>
                </div>

                {/* Exercise Tools: Plate Calc, 1RM Calc, Note Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setOpenExerciseNoteIds((prev) => ({
                        ...prev,
                        [exercise.id]: !prev[exercise.id],
                      }));
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                      exercise.notes
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title="Заметка к упражнению"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Заметка</span>
                  </button>

                  {exercise.isBarbell && (
                    <button
                      onClick={() => {
                        const currentWeight = exercise.sets[0]?.weightKg || 60;
                        setSelectedExerciseForPlates({ weight: currentWeight });
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition active:scale-95"
                      title="Калькулятор блинов на штангу"
                    >
                      <Disc className="w-3.5 h-3.5 text-emerald-400" />
                      Блины
                    </button>
                  )}

                  {!exercise.isTimeBased && (
                    <button
                      onClick={() => {
                        const firstSet = exercise.sets[0];
                        setSelectedExerciseFor1RM({
                          weight: firstSet?.weightKg || 80,
                          reps: firstSet?.reps || 8,
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition active:scale-95"
                      title="Расчет 1RM"
                    >
                      <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                      1RM
                    </button>
                  )}
                </div>
              </div>

              {/* Exercise Notes Inline Field */}
              {isExNoteOpen && (
                <div className="mt-3 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <FileText className="w-3.5 h-3.5" />
                      Заметка к упражнению:
                    </span>
                    <button
                      onClick={() => {
                        setOpenExerciseNoteIds((prev) => ({
                          ...prev,
                          [exercise.id]: false,
                        }));
                      }}
                      className="text-slate-500 hover:text-slate-300 text-[10px]"
                    >
                      Свернуть
                    </button>
                  </div>
                  <input
                    type="text"
                    value={exercise.notes || ''}
                    onChange={(e) => {
                      const updated = [...workout.exercises];
                      updated[exIdx].notes = e.target.value;
                      onUpdateWorkout({ ...workout, exercises: updated });
                    }}
                    placeholder="Например: хват шире плеч, на 3 подходе было тяжело..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500/50 outline-none transition"
                  />
                </div>
              )}

              {/* Previous Benchmark Notice */}
              {prevLog && (
                <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Прошлый результат:
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {exercise.isTimeBased
                      ? `${prevLog.seconds || 30} сек`
                      : `${prevLog.weightKg > 0 ? `${prevLog.weightKg} кг × ` : ''}${prevLog.reps} повт.`}
                  </span>
                </div>
              )}

              {/* Sets Table */}
              <div className="mt-4 space-y-2.5">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  <div className="col-span-1 text-center">Сет</div>
                  <div className="col-span-2 text-center hidden sm:block">Тип</div>
                  <div className={`${exercise.isBodyweight && !exercise.isTimeBased ? 'col-span-3' : 'col-span-4 sm:col-span-3'} text-center`}>
                    {exercise.isTimeBased ? 'Цель (сек)' : 'Вес (кг)'}
                  </div>
                  <div className="col-span-4 sm:col-span-3 text-center">
                    {exercise.isTimeBased ? 'Таймер' : 'Повторы'}
                  </div>
                  <div className="col-span-3 text-center">Готово</div>
                </div>

                {/* Set Rows */}
                {exercise.sets.map((set, setIdx) => {
                  const plankTimer = activePlankTimers[set.id] || {
                    remaining: set.targetSeconds || 30,
                    running: false,
                  };

                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded-2xl border transition-all ${
                        set.completed
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Set Number */}
                      <div className="col-span-1 flex justify-center">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                          set.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {set.setNumber}
                        </span>
                      </div>

                      {/* Set Type Dropdown (Desktop) */}
                      <div className="col-span-2 hidden sm:block">
                        <select
                          value={set.type}
                          onChange={(e) => handleUpdateSet(exIdx, setIdx, { type: e.target.value as SetType })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold py-1.5 px-2 text-slate-300 outline-none"
                        >
                          <option value="normal">Обычный</option>
                          <option value="warm_up">Разминка</option>
                          <option value="failure">Отказ</option>
                          <option value="drop_set">Дропсет</option>
                          <option value="rest_pause">Rest-Pause</option>
                        </select>
                      </div>

                      {/* Weight (or Target Seconds) Input */}
                      <div className={`${exercise.isBodyweight && !exercise.isTimeBased ? 'col-span-3' : 'col-span-4 sm:col-span-3'}`}>
                        {exercise.isTimeBased ? (
                          <div className="flex items-center justify-center font-mono font-extrabold text-sm text-cyan-400 bg-slate-950/60 py-1.5 rounded-xl border border-slate-800">
                            {set.targetSeconds || 30} сек
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center w-full bg-slate-950/60 rounded-xl border border-slate-800 px-2 py-1">
                              <input
                                type="number"
                                inputMode="decimal"
                                disabled={set.completed}
                                value={set.weightKg === 0 ? '' : set.weightKg}
                                placeholder={exercise.isBodyweight ? 'Свой вес' : '—'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateSet(exIdx, setIdx, {
                                    weightKg: val === '' ? 0 : Number(val),
                                  });
                                }}
                                className="w-full bg-transparent font-mono font-extrabold text-sm text-center text-emerald-400 outline-none disabled:opacity-75"
                              />
                              <span className="text-[10px] text-slate-500 font-semibold">кг</span>
                            </div>

                            {/* Micro-increment buttons */}
                            {!set.completed && !exercise.isBodyweight && (
                              <div className="flex gap-1 mt-1">
                                {[-2.5, +2.5, +5].map((inc) => (
                                  <button
                                    key={inc}
                                    onClick={() =>
                                      handleUpdateSet(exIdx, setIdx, {
                                        weightKg: Math.max(0, Math.round((set.weightKg + inc) * 10) / 10),
                                      })
                                    }
                                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-slate-300 rounded transition active:scale-95"
                                  >
                                    {inc > 0 ? `+${inc}` : inc}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Reps Input / In-place Plank Stopwatch */}
                      <div className="col-span-4 sm:col-span-3">
                        {exercise.isTimeBased ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                const isCurrentlyRunning = plankTimer.running;
                                setActivePlankTimers((prev) => ({
                                  ...prev,
                                  [set.id]: {
                                    remaining: isCurrentlyRunning ? plankTimer.remaining : (plankTimer.remaining || 30),
                                    running: !isCurrentlyRunning,
                                  },
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs flex items-center gap-1 transition ${
                                plankTimer.running
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25'
                              }`}
                            >
                              <Timer className="w-3.5 h-3.5" />
                              {plankTimer.remaining}с {plankTimer.running ? '⏸' : '▶'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center w-full bg-slate-950/60 rounded-xl border border-slate-800 px-2 py-1">
                              <input
                                type="number"
                                inputMode="numeric"
                                disabled={set.completed}
                                value={set.reps === 0 ? '' : set.reps}
                                placeholder="—"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateSet(exIdx, setIdx, {
                                    reps: val === '' ? 0 : Math.max(0, Number(val)),
                                  });
                                }}
                                className="w-full bg-transparent font-mono font-extrabold text-sm text-center text-cyan-400 outline-none disabled:opacity-75"
                              />
                              <span className="text-[10px] text-slate-500 font-semibold">повт</span>
                            </div>

                            {/* Reps steppers */}
                            {!set.completed && (
                              <div className="flex gap-1 mt-1">
                                {[-1, +1].map((inc) => (
                                  <button
                                    key={inc}
                                    onClick={() =>
                                      handleUpdateSet(exIdx, setIdx, {
                                        reps: Math.max(1, set.reps + inc),
                                      })
                                    }
                                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[9px] font-bold text-slate-300 rounded transition"
                                  >
                                    {inc > 0 ? `+${inc}` : inc}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Complete Checkbox Button */}
                      <div className="col-span-3 flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-md ${
                            set.completed
                              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                              : 'bg-slate-800/90 hover:bg-slate-700 text-slate-400 border border-slate-700'
                          }`}
                          title={set.completed ? 'Отменить выполнение' : 'Выполнить подход'}
                        >
                          <Check className={`w-6 h-6 ${set.completed ? 'stroke-[3]' : 'stroke-[2]'}`} />
                        </button>

                        {exercise.sets.length > 1 && !set.completed && (
                          <button
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="p-1.5 text-slate-600 hover:text-rose-400 transition"
                            title="Удалить подход"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Set Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleAddSet(exIdx)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  Добавить подход
                </button>

                <div className="text-xs text-slate-400 font-medium">
                  Выполнено: <b className="text-emerald-400 font-mono">{completedCount}</b> / {exercise.sets.length}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Finish / Summary Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#121520] border border-[#283045] w-full max-w-md rounded-3xl p-6 shadow-2xl text-slate-100 relative">
            <div className="text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4 text-slate-950 shadow-xl shadow-emerald-500/20">
                <Trophy className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black text-white">Отличная работа!</h2>
              <p className="text-sm text-slate-400 mt-1">
                Тренировка завершена. Все результаты сохранены в базу.
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400 font-medium mb-1">Время</div>
                <div className="font-mono font-extrabold text-base text-emerald-400">{timeFormatted}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400 font-medium mb-1">Тоннаж</div>
                <div className="font-mono font-extrabold text-base text-amber-400">{tonnageKg} кг</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400 font-medium mb-1">Подходы</div>
                <div className="font-mono font-extrabold text-base text-cyan-400">
                  {workout.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0)}
                </div>
              </div>
            </div>

            {/* Notes input in finish modal */}
            <div className="mb-5 text-left">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Заметки к тренировке (самочувствие, сон, предтрен):
              </label>
              <textarea
                value={workout.notes || ''}
                onChange={(e) => onUpdateWorkout({ ...workout, notes: e.target.value })}
                placeholder="Как прошла тренировка?..."
                rows={2}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 outline-none resize-none transition"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowFinishModal(false);
                  onUpdateWorkout({ ...workout, durationSeconds: elapsedSeconds });
                  onFinishWorkout();
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Сохранить тренировку
              </button>

              <button
                onClick={() => setShowFinishModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Вернуться к тренировке
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plate Calculator Modal */}
      {selectedExerciseForPlates && (
        <PlateCalculatorModal
          isOpen={true}
          initialWeightKg={selectedExerciseForPlates.weight}
          onClose={() => setSelectedExerciseForPlates(null)}
        />
      )}

      {/* 1RM Calculator Modal */}
      {selectedExerciseFor1RM && (
        <OneRMCalculatorModal
          isOpen={true}
          initialWeightKg={selectedExerciseFor1RM.weight}
          initialReps={selectedExerciseFor1RM.reps}
          onClose={() => setSelectedExerciseFor1RM(null)}
        />
      )}
    </div>
  );
};
