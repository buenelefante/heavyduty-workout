import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Volume2, 
  Smartphone, 
  Download, 
  Upload, 
  Disc, 
  Trash2, 
  Check, 
  Music,
  ShieldAlert,
  Cloud,
  QrCode
} from 'lucide-react';
import { sound, triggerHapticVibration } from '../utils/sound';
import { db } from '../db/db';
import { UserSettings } from '../types/workout';
import { SyncModal } from './SyncModal';
import { getSavedSyncKey } from '../utils/syncService';

export const SettingsModal: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const activeSyncKey = getSavedSyncKey();

  useEffect(() => {
    async function loadSettings() {
      const s = await db.settings.get('global-settings');
      if (s) setSettings(s);
    }
    loadSettings();
  }, []);

  const handleUpdate = async (changes: Partial<UserSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...changes };
    setSettings(updated);
    await db.settings.put(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  // Export full DB to JSON
  const handleExportData = async () => {
    const allWorkouts = await db.workouts.toArray();
    const allPRs = await db.personalRecords.toArray();
    const currentSettings = await db.settings.toArray();

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      workouts: allWorkouts,
      personalRecords: allPRs,
      settings: currentSettings,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heavyduty-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.workouts) await db.workouts.bulkPut(data.workouts);
        if (data.personalRecords) await db.personalRecords.bulkPut(data.personalRecords);
        if (data.settings) await db.settings.bulkPut(data.settings);
        alert('Данные успешно импортированы!');
        window.location.reload();
      } catch (err) {
        alert('Ошибка при импорте файла: неверный формат.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (window.confirm('ВНИМАНИЕ: Это удалит всю историю тренировок и рекорды. Продолжить?')) {
      await db.workouts.clear();
      await db.personalRecords.clear();
      alert('Все тренировки очищены.');
      window.location.reload();
    }
  };

  if (!settings) return null;

  return (
    <div className="min-h-screen pb-32 pt-4 px-3 sm:px-6 max-w-4xl mx-auto text-slate-100">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
          <Settings className="w-4 h-4" />
          Конфигурация
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Настройки приложения</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Управление звуками, вибрацией, весом грифа и резервным копированием базы.
        </p>
      </div>

      <div className="space-y-6">
        {/* Audio & Haptic Feedback */}
        <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            Звук и тактильный отклик (Web Audio / Haptics)
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <div className="font-bold text-sm text-slate-200">Звуковые сигналы таймера</div>
                <div className="text-xs text-slate-400">Гонг окончания отдыха и пики 3-2-1</div>
              </div>
              <button
                onClick={() => handleUpdate({ soundEnabled: !settings.soundEnabled })}
                className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                  settings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Test Sounds buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => sound.playCountdownPip()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
              >
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                Тест: Пик 3-2-1
              </button>

              <button
                onClick={() => sound.playTimerCompletionGong()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Тест: Гонг отдыха
              </button>

              <button
                onClick={() => sound.playPRCelebrationFanfare()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
              >
                <Music className="w-3.5 h-3.5 text-amber-400" />
                Тест: Фанфары рекорда (PR)
              </button>

              <button
                onClick={() => triggerHapticVibration([100, 50, 150])}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                Тест: Вибрация
              </button>
            </div>
          </div>
        </div>

        {/* Barbell & Plates Config */}
        <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Disc className="w-5 h-5 text-cyan-400" />
            Штанга и навеска блинов
          </h2>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <div className="font-bold text-sm text-slate-200">Вес грифа по умолчанию</div>
              <div className="text-xs text-slate-400">Стандартный олимпийский гриф 20 кг</div>
            </div>
            <div className="flex gap-1.5">
              {[20, 15, 10].map((w) => (
                <button
                  key={w}
                  onClick={() => handleUpdate({ barWeightKg: w })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    settings.barWeightKg === w
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w} кг
                </button>
              ))}
            </div>
          </div>

          {/* Available Plates Selector */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="font-bold text-sm text-slate-200 mb-1">Доступные блины в зале (кг)</div>
            <div className="text-xs text-slate-400 mb-3">
              Отметьте блины, которые есть в вашем спортзале (макс. 20 кг):
            </div>
            <div className="flex flex-wrap gap-2">
              {[20, 15, 10, 5, 2.5, 1.25].map((plate) => {
                const isSelected = settings.platesKg.includes(plate);
                return (
                  <button
                    key={plate}
                    onClick={() => {
                      const updatedPlates = isSelected
                        ? settings.platesKg.filter((p) => p !== plate)
                        : [...settings.platesKg, plate].sort((a, b) => b - a);
                      handleUpdate({ platesKg: updatedPlates });
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                        : 'bg-slate-800 border border-slate-700/80 text-slate-500 line-through'
                    }`}
                  >
                    <Disc className="w-3.5 h-3.5" />
                    {plate} кг {isSelected ? '✓' : '✗'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PWA Install on Phone / Tablet */}
        <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            Установка на телефон и планшет (PWA)
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Приложение работает как полноценное нативное приложение без App Store / Google Play и сохраняет все тренировки 100% офлайн в подвальных залах.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* iOS (iPhone / iPad) */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-200 mb-2">
                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs">🍏</span>
                На iPhone и iPad (Safari):
              </div>
              <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Откройте сайт в браузере <b>Safari</b></li>
                <li>Нажмите кнопку <b>«Поделиться»</b> (квадрат со стрелочкой вверх внизу экрана)</li>
                <li>Прокрутите вниз и выберите <b>«На экран „Домой“»</b></li>
                <li>Нажмите <b>«Добавить»</b></li>
              </ol>
            </div>

            {/* Android / Tablet (Chrome) */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-200 mb-2">
                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs">🤖</span>
                На Android и планшетах (Chrome):
              </div>
              <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Откройте сайт в <b>Google Chrome</b></li>
                <li>Нажмите на меню <b>три точки (⋮)</b> в правом верхнем углу</li>
                <li>Выберите <b>«Установить приложение»</b> или «Добавить на главный экран»</li>
                <li>Подтвердите установку</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Cloud Sync Section */}
        <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-cyan-400" />
                Облачная синхронизация (iPad & Android)
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  Бесплатно
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Свяжите ваши устройства по ключу или QR-коду для автоматического объединения тренировок.
              </p>
            </div>

            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 stroke-[2.5]" />
              Связать устройства / QR
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Активный ключ синхронизации:</span>
            <span className="font-mono font-bold text-cyan-400 tracking-wider">
              {activeSyncKey || 'Не создан (нажмите «Связать устройства»)'}
            </span>
          </div>
        </div>

        {/* Backup & Offline Storage */}
        <div className="bg-[#121520] border border-[#23293a] rounded-3xl p-5 sm:p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-amber-400" />
            Резервное копирование и экспорт (Offline-First)
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Все данные хранятся прямо в памяти вашего устройства (IndexedDB). Вы можете экспортировать полную резервную копию в файл JSON или восстановить её на любом устройстве.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportData}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              Экспорт базы в JSON
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition">
              <Upload className="w-4 h-4 text-cyan-400" />
              Импорт из JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-xs text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Опасная зона
            </div>
            <button
              onClick={handleClearAllData}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
            >
              Очистить все тренировки
            </button>
          </div>
        </div>

        {/* Sync Modal */}
        <SyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
        />
      </div>
    </div>
  );
};
