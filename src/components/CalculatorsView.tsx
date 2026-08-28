import React, { useState, useEffect } from 'react';
import { Disc, Calculator, Flame, Zap, Minus, Plus, Info } from 'lucide-react';
import { calculateBarbellPlates, calculate1RM, calculate1RMTable } from '../utils/strength';
import { db } from '../db/db';

export const CalculatorsView: React.FC = () => {
  // Plate Calculator State
  const [targetWeight, setTargetWeight] = useState<number>(100);
  const [barWeight, setBarWeight] = useState<number>(20);
  const [availablePlates, setAvailablePlates] = useState<number[]>([20, 15, 10, 5, 2.5, 1.25]);

  // 1RM Calculator State
  const [oneRMWeight, setOneRMWeight] = useState<number>(90);
  const [oneRMReps, setOneRMReps] = useState<number>(6);

  useEffect(() => {
    async function loadSettings() {
      const s = await db.settings.get('global-settings');
      if (s) {
        setBarWeight(s.barWeightKg || 20);
        if (s.platesKg && s.platesKg.length > 0) {
          setAvailablePlates(s.platesKg.filter((p) => p <= 20));
        }
      }
    }
    loadSettings();
  }, []);

  const { platesPerSide, achievedWeightKg, remainderKg } = calculateBarbellPlates(
    targetWeight,
    barWeight,
    availablePlates
  );

  const brzycki1RM = calculate1RM(oneRMWeight, oneRMReps, 'brzycki');
  const epley1RM = calculate1RM(oneRMWeight, oneRMReps, 'epley');
  const intensityTable = calculate1RMTable(brzycki1RM);

  return (
    <div className="min-h-screen pb-32 pt-4 px-3 sm:px-6 max-w-4xl mx-auto text-slate-100">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
          <Calculator className="w-4 h-4" />
          Инструменты
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Силовые калькуляторы</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Расчет навески олимпийских блинов на штангу и расчет одноповторного максимума (1RM).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Barbell Plate Calculator */}
        <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Disc className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Калькулятор блинов</h2>
                <p className="text-xs text-slate-400">Навеска на одну сторону грифа</p>
              </div>
            </div>

            {/* Target Weight Picker */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center mb-4">
              <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Целевой вес штанги</div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setTargetWeight((prev) => Math.max(barWeight, prev - 5))}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="font-mono text-3xl font-black text-emerald-400 min-w-[120px]">
                  {targetWeight} <span className="text-sm font-sans text-slate-400">кг</span>
                </div>
                <button
                  onClick={() => setTargetWeight((prev) => prev + 5)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Bar toggle */}
              <div className="flex justify-center gap-1.5 mt-3">
                {[20, 15, 10].map((w) => (
                  <button
                    key={w}
                    onClick={() => setBarWeight(w)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      barWeight === w ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Гриф {w} кг
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Barbell */}
            <div className="bg-[#0b0d14] rounded-2xl p-3 border border-slate-800/80 mb-4">
              <div className="text-[11px] text-center text-slate-400 mb-1">
                С одной стороны: <b className="text-emerald-400 font-mono">{(targetWeight - barWeight) / 2} кг</b>
              </div>
              <div className="relative h-20 flex items-center justify-center overflow-x-auto py-1">
                <div className="absolute left-2 right-2 h-3 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 rounded-sm" />
                <div className="relative z-10 w-3 h-14 bg-slate-700 border-r border-slate-500 rounded-sm mr-1.5 shadow" />
                <div className="relative z-10 flex items-center gap-0.5">
                  {platesPerSide.length === 0 ? (
                    <div className="text-[10px] text-slate-500 italic pl-2">Пустой гриф ({barWeight}кг)</div>
                  ) : (
                    platesPerSide.flatMap((p, pIdx) =>
                      Array.from({ length: p.countPerSide }).map((_, cIdx) => (
                        <div
                          key={`${pIdx}-${cIdx}`}
                          style={{
                            height: `${Math.max(30, (p.diameterPercent / 100) * 70)}px`,
                            backgroundColor: p.color,
                            width: '14px',
                          }}
                          className="rounded-sm border border-black/40 shadow flex flex-col items-center justify-center font-mono font-bold text-[8px] text-white select-none"
                        >
                          <span className="rotate-90">{p.plateWeight}</span>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Plates breakdown */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 uppercase">Надеть на сторону:</div>
              <div className="grid grid-cols-2 gap-2">
                {platesPerSide.map((p) => (
                  <div
                    key={p.plateWeight}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-mono font-bold text-slate-200">{p.plateWeight} кг</span>
                    </div>
                    <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      × {p.countPerSide}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. 1RM Estimator & Intensity Matrix */}
        <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Калькулятор 1RM</h2>
                <p className="text-xs text-slate-400">Расчет максимума и процентов нагрузки</p>
              </div>
            </div>

            {/* Weight & Reps inputs */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <label className="text-xs text-slate-400 block mb-1">Вес (кг)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={oneRMWeight === 0 ? '' : oneRMWeight}
                  placeholder="—"
                  onChange={(e) => {
                    const val = e.target.value;
                    setOneRMWeight(val === '' ? 0 : Math.max(0, Number(val)));
                  }}
                  className="w-full bg-transparent font-mono font-extrabold text-xl text-emerald-400 outline-none"
                />
              </div>
              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                <label className="text-xs text-slate-400 block mb-1">Повторы</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={oneRMReps === 0 ? '' : oneRMReps}
                  placeholder="—"
                  onChange={(e) => {
                    const val = e.target.value;
                    setOneRMReps(val === '' ? 0 : Math.max(0, Number(val)));
                  }}
                  className="w-full bg-transparent font-mono font-extrabold text-xl text-cyan-400 outline-none"
                />
              </div>
            </div>

            {/* Big 1RM Card */}
            <div className="bg-gradient-to-br from-emerald-950/60 to-cyan-950/40 border border-emerald-500/30 rounded-2xl p-4 text-center mb-4">
              <div className="text-xs text-emerald-300 font-semibold uppercase flex items-center justify-center gap-1.5 mb-1">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                Расчетный 1RM
              </div>
              <div className="font-mono text-4xl font-black text-white">
                {brzycki1RM} <span className="text-lg text-emerald-400 font-sans">кг</span>
              </div>
            </div>

            {/* Intensity Table */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 max-h-48 overflow-y-auto">
              {intensityTable.slice(0, 6).map((row) => (
                <div key={row.percentage} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-8 font-bold text-emerald-400">{row.percentage}%</span>
                    <span className="text-slate-400">~{row.estimatedReps} повт.</span>
                  </div>
                  <div className="font-mono font-extrabold text-slate-100">{row.weightKg} кг</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
