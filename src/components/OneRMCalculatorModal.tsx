import React, { useState } from 'react';
import { X, Calculator, Zap, Flame } from 'lucide-react';
import { calculate1RM, calculate1RMTable } from '../utils/strength';

interface OneRMCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeightKg?: number;
  initialReps?: number;
}

export const OneRMCalculatorModal: React.FC<OneRMCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialWeightKg = 80,
  initialReps = 5,
}) => {
  const [weight, setWeight] = useState<number>(initialWeightKg);
  const [reps, setReps] = useState<number>(initialReps);

  if (!isOpen) return null;

  const brzycki1RM = calculate1RM(weight, reps, 'brzycki');
  const epley1RM = calculate1RM(weight, reps, 'epley');
  const intensityTable = calculate1RMTable(brzycki1RM);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#12151f] border border-[#262c3e] w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Калькулятор 1RM</h2>
              <p className="text-xs text-slate-400">Расчет одноповторного максимума</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-4 my-5">
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-400 block mb-1">Вес (кг)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={weight === 0 ? '' : weight}
                placeholder="—"
                onChange={(e) => {
                  const val = e.target.value;
                  setWeight(val === '' ? 0 : Math.max(0, Number(val)));
                }}
                className="w-full bg-transparent font-mono font-extrabold text-2xl text-emerald-400 outline-none"
              />
            </div>
            <div className="flex gap-1 mt-2">
              {[-2.5, +2.5, +5, +10].map((inc) => (
                <button
                  key={inc}
                  onClick={() => setWeight((prev) => Math.max(0, prev + inc))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] font-bold text-slate-300 transition"
                >
                  {inc > 0 ? `+${inc}` : inc}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-400 block mb-1">Повторы (reps)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={reps === 0 ? '' : reps}
                placeholder="—"
                onChange={(e) => {
                  const val = e.target.value;
                  setReps(val === '' ? 0 : Math.max(0, Number(val)));
                }}
                className="w-full bg-transparent font-mono font-extrabold text-2xl text-cyan-400 outline-none"
              />
            </div>
            <div className="flex gap-1 mt-2">
              {[-1, +1, +2].map((inc) => (
                <button
                  key={inc}
                  onClick={() => setReps((prev) => Math.max(1, prev + inc))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-[10px] font-bold text-slate-300 transition"
                >
                  {inc > 0 ? `+${inc}` : inc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Banner */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-cyan-950/40 border border-emerald-500/30 rounded-2xl p-4 text-center mb-5">
          <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            Расчетный 1RM (Brzycki)
          </div>
          <div className="font-mono text-5xl font-black text-white tracking-tight">
            {brzycki1RM} <span className="text-2xl text-emerald-400 font-sans font-semibold">кг</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-3">
            <span>По формуле Эпли (Epley): <b className="text-slate-200">{epley1RM} кг</b></span>
          </div>
        </div>

        {/* Intensity Table */}
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Проценты интенсивности для тренировок
          </div>

          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80 max-h-56 overflow-y-auto">
            {intensityTable.map((row) => (
              <div
                key={row.percentage}
                className="flex items-center justify-between px-3.5 py-2 text-xs hover:bg-slate-800/50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-10 font-bold text-emerald-400">{row.percentage}%</span>
                  <span className="text-slate-400">~{row.estimatedReps} повт.</span>
                </div>
                <div className="font-mono font-extrabold text-sm text-slate-100">
                  {row.weightKg} кг
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
