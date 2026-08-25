import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Disc, Info } from 'lucide-react';
import { calculateBarbellPlates } from '../utils/strength';
import { db } from '../db/db';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeightKg?: number;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialWeightKg = 60,
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeightKg);
  const [barWeight, setBarWeight] = useState<number>(20);
  const [availablePlates, setAvailablePlates] = useState<number[]>([20, 15, 10, 5, 2.5, 1.25]);

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
  }, [isOpen]);

  if (!isOpen) return null;

  const { platesPerSide, achievedWeightKg, remainderKg } = calculateBarbellPlates(
    targetWeight,
    barWeight,
    availablePlates
  );

  const incrementWeight = (amount: number) => {
    setTargetWeight((prev) => Math.max(barWeight, Math.round((prev + amount) * 10) / 10));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#12151f] border border-[#262c3e] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Раскладка блинов на гриф</h2>
              <p className="text-xs text-slate-400">Калькулятор навески на штангу</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Weight Controls */}
        <div className="my-5 flex flex-col items-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Целевой вес штанги
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => incrementWeight(-5)}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="font-mono text-4xl font-extrabold text-emerald-400 min-w-[140px] text-center">
              {targetWeight} <span className="text-xl text-slate-400 font-sans font-medium">кг</span>
            </div>

            <button
              onClick={() => incrementWeight(5)}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Increment Buttons */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {[-10, -2.5, -1.25, +1.25, +2.5, +10].map((inc) => (
              <button
                key={inc}
                onClick={() => incrementWeight(inc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                  inc > 0
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {inc > 0 ? `+${inc}` : inc} кг
              </button>
            ))}
          </div>

          {/* Bar weight toggle */}
          <div className="flex items-center gap-2 mt-4 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 pl-2">Гриф:</span>
            {[20, 15, 10].map((weight) => (
              <button
                key={weight}
                onClick={() => setBarWeight(weight)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  barWeight === weight
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {weight} кг {weight === 20 ? '(Олимп.)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Barbell Representation */}
        <div className="bg-[#0b0d14] rounded-2xl p-4 border border-slate-800/80 mb-5">
          <div className="text-xs text-center text-slate-400 mb-2 font-medium">
            Схема навески с одной стороны ({targetWeight > barWeight ? (targetWeight - barWeight) / 2 : 0} кг на сторону):
          </div>

          <div className="relative h-28 flex items-center justify-center overflow-x-auto py-2">
            {/* Barbell sleeve */}
            <div className="absolute left-4 right-4 h-4 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 rounded-sm shadow-inner z-0" />
            
            {/* Inner Collar / Stopper */}
            <div className="relative z-10 w-4 h-16 bg-slate-700 border-r-2 border-slate-500 rounded-sm mr-2 shadow-md" />

            {/* Plates stacked from inside out */}
            <div className="relative z-10 flex items-center gap-1">
              {platesPerSide.length === 0 ? (
                <div className="text-xs text-slate-500 italic pl-4">Пустой гриф ({barWeight} кг)</div>
              ) : (
                platesPerSide.flatMap((p, pIdx) =>
                  Array.from({ length: p.countPerSide }).map((_, cIdx) => (
                    <div
                      key={`${pIdx}-${cIdx}`}
                      style={{
                        height: `${Math.max(38, (p.diameterPercent / 100) * 90)}px`,
                        backgroundColor: p.color,
                        width: '18px',
                      }}
                      className="rounded-sm border border-black/40 shadow-lg flex flex-col items-center justify-center font-mono font-bold text-[9px] text-white select-none transition-transform hover:scale-105"
                      title={`${p.plateWeight} кг`}
                    >
                      <span className="rotate-90">{p.plateWeight}</span>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Outer Collar Lock */}
            {platesPerSide.length > 0 && (
              <div className="relative z-10 w-3 h-8 bg-amber-500 rounded-sm ml-1 border border-amber-600 shadow" title="Замок" />
            )}
          </div>
        </div>

        {/* Plate Count List */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Надеть на каждую сторону:
          </div>

          {platesPerSide.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-sm text-slate-400 text-center">
              Блины не требуются, только гриф {barWeight} кг.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {platesPerSide.map((plate) => (
                <div
                  key={plate.plateWeight}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: plate.color }}
                    />
                    <span className="font-mono font-bold text-sm text-slate-200">
                      {plate.plateWeight} кг
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-extrabold text-xs">
                    × {plate.countPerSide} шт
                  </span>
                </div>
              ))}
            </div>
          )}

          {remainderKg > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mt-3">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                Остаток {remainderKg} кг не делится на стандартный шаг блинов (1.25 кг). Набрано: {achievedWeightKg} кг.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
