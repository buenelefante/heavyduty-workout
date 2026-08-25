import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  Copy, 
  Check, 
  QrCode, 
  Smartphone, 
  Tablet, 
  ShieldCheck, 
  X, 
  Key,
  AlertCircle,
  Sparkles,
  Link2
} from 'lucide-react';
import { 
  getSavedSyncKey, 
  saveSyncKey, 
  performSync, 
  generateSyncKey, 
  getLastSyncedAt,
  SyncResult 
} from '../utils/syncService';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [syncKey, setSyncKey] = useState<string>('');
  const [inputKey, setInputKey] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<string | null>(getLastSyncedAt());

  // Watch online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Init sync key
  useEffect(() => {
    if (isOpen) {
      let saved = getSavedSyncKey();
      if (!saved) {
        saved = generateSyncKey();
        saveSyncKey(saved);
      }
      setSyncKey(saved);
      setInputKey(saved);
      setLastSynced(getLastSyncedAt());
      setSyncResult(null);

      // Generate QR Code with link
      const syncUrl = `${window.location.origin}/?sync=${encodeURIComponent(saved)}`;
      QRCode.toDataURL(syncUrl, {
        width: 220,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    if (!syncKey) return;
    navigator.clipboard.writeText(syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNewKey = () => {
    const newKey = generateSyncKey();
    setSyncKey(newKey);
    setInputKey(newKey);
    saveSyncKey(newKey);

    const syncUrl = `${window.location.origin}/?sync=${encodeURIComponent(newKey)}`;
    QRCode.toDataURL(syncUrl, {
      width: 220,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    }).then(setQrDataUrl).catch(console.error);
  };

  const handleApplyInputKey = async () => {
    if (!inputKey.trim()) return;
    const cleanKey = inputKey.toUpperCase().trim();
    setSyncKey(cleanKey);
    saveSyncKey(cleanKey);

    const syncUrl = `${window.location.origin}/?sync=${encodeURIComponent(cleanKey)}`;
    QRCode.toDataURL(syncUrl, {
      width: 220,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    }).then(setQrDataUrl).catch(console.error);

    // Immediate sync
    await handleTriggerSync(cleanKey);
  };

  const handleTriggerSync = async (keyToUse?: string) => {
    setIsSyncing(true);
    setSyncResult(null);

    const res = await performSync(keyToUse || syncKey);
    setSyncResult(res);
    setIsSyncing(false);
    setLastSynced(getLastSyncedAt());

    if (res.success && onSyncComplete) {
      onSyncComplete();
    }
  };

  const formattedLastSync = lastSynced
    ? new Date(lastSynced).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121520] border border-[#262c3e] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Синхронизация устройств
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  Бесплатно
                </span>
              </h2>
              <p className="text-xs text-slate-400">Свяжите iPad и Android по ключу или QR-коду</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-5">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">
                {isOnline ? 'Сеть подключена' : 'Офлайн (в спортзале)'}
              </span>
            </div>
            <div className="text-slate-400 font-mono">
              {formattedLastSync ? `Синхр: ${formattedLastSync}` : 'Еще не синхронизировано'}
            </div>
          </div>

          {/* Sync Key Card */}
          <div className="p-4 rounded-3xl bg-slate-950/80 border border-emerald-500/30 shadow-inner text-center">
            <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              Ваш персональный ключ синхронизации:
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-emerald-400 my-2 select-all">
              {syncKey}
            </div>

            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                onClick={handleCopyKey}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition active:scale-95 shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Скопировано!' : 'Скопировать ключ'}
              </button>

              <button
                onClick={handleGenerateNewKey}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
              >
                Новый ключ
              </button>
            </div>
          </div>

          {/* QR Code Quick Pair */}
          {qrDataUrl && (
            <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="p-2 bg-white rounded-2xl shadow-lg flex-shrink-0">
                <img src={qrDataUrl} alt="QR Код синхронизации" className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg" />
              </div>
              <div className="text-xs space-y-2">
                <div className="font-bold text-sm text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  Мгновенная привязка через камеру
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Наведите камеру смартфона на этот QR-код на экране iPad. Устройства мгновенно свяжутся без ручного ввода ключа.
                </p>
                <div className="text-[11px] text-emerald-400/90 font-medium">
                  ✓ Тренировки автоматически объединяются
                </div>
              </div>
            </div>
          )}

          {/* Enter Existing Key */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-amber-400" />
              Подключить другое устройство по ключу:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                placeholder="Например: HD-8492-7193"
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 placeholder-slate-600 outline-none transition"
              />
              <button
                onClick={handleApplyInputKey}
                disabled={isSyncing || !inputKey.trim()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-slate-200 transition active:scale-95"
              >
                Подключить
              </button>
            </div>
          </div>

          {/* Sync Result Alert */}
          {syncResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
                syncResult.success
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              {syncResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{syncResult.message}</span>
            </div>
          )}

          {/* Sync Now Big Button */}
          <button
            onClick={() => handleTriggerSync()}
            disabled={isSyncing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 stroke-[3] ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Синхронизация данных...' : 'Синхронизировать сейчас'}
          </button>
        </div>
      </div>
    </div>
  );
};
