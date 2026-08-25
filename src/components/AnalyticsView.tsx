import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Flame, 
  Award, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  Dumbbell,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { db } from '../db/db';
import { WorkoutSession, PersonalRecord } from '../types/workout';
import { calculateMuscleRecovery, calculate1RM } from '../utils/strength';
import { INITIAL_EXERCISES } from '../data/exercises';

export const AnalyticsView: React.FC = () => {
  const [completedWorkouts, setCompletedWorkouts] = useState<WorkoutSession[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('squat');

  useEffect(() => {
    async function loadData() {
      const workouts = await db.workouts.filter((w) => w.completed).sortBy('startTime');
      setCompletedWorkouts(workouts);

      const prs = await db.personalRecords.toArray();
      setPersonalRecords(prs);
    }
    loadData();
  }, []);

  const recoveryData = calculateMuscleRecovery(completedWorkouts);

  // 1RM Progress Data for Selected Exercise
  const exerciseProgressData = completedWorkouts
    .map((w) => {
      const matchingEx = w.exercises.find((e) => e.exerciseId === selectedExerciseId);
      if (!matchingEx) return null;

      const completedSets = matchingEx.sets.filter((s) => s.completed);
      if (completedSets.length === 0) return null;

      let max1RM = 0;
      let maxWeight = 0;
      for (const s of completedSets) {
        const est = calculate1RM(s.weightKg, s.reps);
        if (est > max1RM) max1RM = est;
        if (s.weightKg > maxWeight) maxWeight = s.weightKg;
      }

      return {
        date: new Date(w.endTime || w.startTime).toLocaleDateString('ru-RU', {
          month: 'short',
          day: 'numeric',
        }),
        estimated1RM: max1RM,
        maxWeight,
      };
    })
    .filter(Boolean);

  // Weekly Tonnage Data
  const volumeData = completedWorkouts.slice(-10).map((w, idx) => ({
    name: `Сессия ${idx + 1}`,
    date: new Date(w.endTime || w.startTime).toLocaleDateString('ru-RU', {
      month: 'short',
      day: 'numeric',
    }),
    tonnage: w.totalTonnageKg,
  }));

  const keyExercises = [
    { id: 'squat', name: 'Приседания' },
    { id: 'bench-press', name: 'Жим лежа' },
    { id: 'deadlift', name: 'Становая тяга' },
    { id: 'overhead-press', name: 'Армейский жим' },
    { id: 'barbell-rows', name: 'Тяга в наклоне' },
    { id: 'incline-bench', name: 'Наклонный жим' },
    { id: 'barbell-curl', name: 'Бицепс штанга' },
    { id: 'skullcrushers', name: 'Французский жим' },
  ];

  return (
    <div className="min-h-screen pb-32 pt-4 px-3 sm:px-6 max-w-4xl mx-auto text-slate-100">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
          <Activity className="w-4 h-4" />
          Биомеханика & Статистика
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Прогресс & Восстановление</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Отслеживание прогрессивной перегрузки, 1RM и готовности мышечных групп к следующей нагрузке.
        </p>
      </div>

      {/* Muscle Recovery Heatmap / Status */}
      <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Статус восстановления мышц (48–72ч)
            </h2>
            <p className="text-xs text-slate-400">Готовность мышечных волокон к новой силовой сессии</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {recoveryData.map((item) => {
            const isFull = item.recoveryPercentage >= 90;
            const isMid = item.recoveryPercentage >= 40 && item.recoveryPercentage < 90;

            return (
              <div
                key={item.muscle}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">{item.muscleNameRu}</span>
                  <span
                    className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-md ${
                      isFull
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isMid
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {item.recoveryPercentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull
                        ? 'bg-emerald-400'
                        : isMid
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.recoveryPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {isFull
                      ? 'Полностью готова'
                      : isMid
                      ? 'В процессе суперкомпенсации'
                      : 'Фаза истощения / отдых'}
                  </span>
                  {item.hoursSinceLastWorkout !== null && (
                    <span className="font-mono text-slate-500">{item.hoursSinceLastWorkout}ч назад</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1RM Progression Chart */}
      <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Динамика 1RM (Одноповторный максимум)
            </h2>
            <p className="text-xs text-slate-400">Рост силовых показателей по упражнениям</p>
          </div>

          {/* Exercise Selector Chips */}
          <div className="flex flex-wrap gap-1.5">
            {keyExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedExerciseId(ex.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                  selectedExerciseId === ex.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>

        {exerciseProgressData.length === 0 ? (
          <div className="h-48 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
            <Dumbbell className="w-8 h-8 text-slate-600 mb-2" />
            Для этого упражнения еще нет завершенных тренировок.
            <br />
            Выполните упражнение в Workout A, B или C, чтобы увидеть график прогресса!
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseProgressData as any}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" кг" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f121a',
                    borderColor: '#262c3e',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="estimated1RM"
                  name="Расчетный 1RM"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="maxWeight"
                  name="Рабочий вес"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#06b6d4', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Volume Load / Tonnage Chart */}
      <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Тоннаж тренировок (Суммарный объем в кг)
          </h2>
          <p className="text-xs text-slate-400">Общая поднятая нагрузка за последние тренировки</p>
        </div>

        {volumeData.length === 0 ? (
          <div className="h-44 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
            История тренировок пуста. Завершите первую тренировку!
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" кг" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f121a',
                    borderColor: '#262c3e',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="tonnage" name="Тоннаж (кг)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Personal Records Hall of Fame */}
      <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Личные рекорды (PR)</h2>
        </div>

        {personalRecords.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 text-center">
            Рекорды будут автоматически зафиксированы при выполнении первого подхода!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {personalRecords.map((pr) => (
              <div
                key={pr.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-100">{pr.exerciseName}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {pr.maxWeightKg} кг × {pr.maxReps} повт.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">1RM Рекорд</div>
                  <div className="font-mono font-black text-lg text-emerald-400">{pr.estimated1RMKg} кг</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
