import { db } from '../db/db';
import { WorkoutSession, PersonalRecord } from '../types/workout';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedWorkoutsCount: number;
  lastSyncedAt?: string;
  error?: string;
}

export interface SyncCloudData {
  syncKey: string;
  workouts: WorkoutSession[];
  personalRecords: PersonalRecord[];
  updatedAt: string;
}

const SYNC_KEY_STORAGE_KEY = 'heavyduty_sync_key';
const LAST_SYNCED_STORAGE_KEY = 'heavyduty_last_synced';

// Primary & fallback endpoints
const NETLIFY_API_ROUTES = ['/api/sync', '/.netlify/functions/sync'];

/**
 * Generates a clean, human-readable 8-char sync key: e.g. "HD-8391-7249"
 */
export function generateSyncKey(): string {
  const part1 = Math.floor(1000 + Math.random() * 9000);
  const part2 = Math.floor(1000 + Math.random() * 9000);
  return `HD-${part1}-${part2}`;
}

/**
 * Gets the current active sync key from storage
 */
export function getSavedSyncKey(): string | null {
  return localStorage.getItem(SYNC_KEY_STORAGE_KEY) || null;
}

/**
 * Saves or clears the sync key in storage
 */
export function saveSyncKey(key: string | null) {
  if (key) {
    const normalized = key.toUpperCase().trim();
    localStorage.setItem(SYNC_KEY_STORAGE_KEY, normalized);
  } else {
    localStorage.removeItem(SYNC_KEY_STORAGE_KEY);
    localStorage.removeItem(LAST_SYNCED_STORAGE_KEY);
  }
}

/**
 * Gets the last synced timestamp string
 */
export function getLastSyncedAt(): string | null {
  return localStorage.getItem(LAST_SYNCED_STORAGE_KEY) || null;
}

/**
 * Fetches remote data from Cloud
 */
async function fetchRemoteData(syncKey: string): Promise<SyncCloudData | null> {
  const normalizedKey = syncKey.toUpperCase().trim();

  for (const endpoint of NETLIFY_API_ROUTES) {
    try {
      const res = await fetch(`${endpoint}?key=${encodeURIComponent(normalizedKey)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.found && json.data) {
          return json.data;
        } else if (json.found === false) {
          // Explicitly empty key in cloud
          return {
            syncKey: normalizedKey,
            workouts: [],
            personalRecords: [],
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      // Continue trying next endpoint
    }
  }

  return null;
}

/**
 * Uploads merged data to Cloud
 */
async function uploadRemoteData(payload: SyncCloudData): Promise<boolean> {
  const normalizedKey = payload.syncKey.toUpperCase().trim();
  const body = JSON.stringify({ ...payload, syncKey: normalizedKey });

  for (const endpoint of NETLIFY_API_ROUTES) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body,
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success) {
          return true;
        }
      }
    } catch (err) {
      // Continue trying next endpoint
    }
  }

  return false;
}

/**
 * Smart 2-way Merge between local Dexie IndexedDB and Remote Cloud
 */
export async function performSync(overrideKey?: string): Promise<SyncResult> {
  const syncKey = overrideKey || getSavedSyncKey();

  if (!syncKey) {
    return {
      success: false,
      message: 'Ключ синхронизации не задан',
      syncedWorkoutsCount: 0,
    };
  }

  if (!navigator.onLine) {
    return {
      success: false,
      message: 'Устройство офлайн. Данные сохранены локально и синхронизируются при появлении сети.',
      syncedWorkoutsCount: 0,
    };
  }

  try {
    // 1. Load all local data from Dexie
    const localWorkouts = await db.workouts.toArray();
    const localPRs = await db.personalRecords.toArray();

    // 2. Fetch remote data from cloud
    const remoteData = await fetchRemoteData(syncKey);

    // 3. Smart Merge Workouts (ID-based with conflict resolution)
    const workoutMap = new Map<string, WorkoutSession>();

    // Add local workouts first
    localWorkouts.forEach((w) => workoutMap.set(w.id, w));

    let newWorkoutsFromRemote = 0;

    // Merge remote workouts
    if (remoteData?.workouts && Array.isArray(remoteData.workouts)) {
      for (const remoteWorkout of remoteData.workouts) {
        const local = workoutMap.get(remoteWorkout.id);
        if (!local) {
          // New workout from other device (e.g. iPad)
          workoutMap.set(remoteWorkout.id, remoteWorkout);
          await db.workouts.put(remoteWorkout);
          newWorkoutsFromRemote++;
        } else {
          // Compare timestamps / update if remote is newer
          const remoteTime = new Date(remoteWorkout.endTime || remoteWorkout.startTime).getTime();
          const localTime = new Date(local.endTime || local.startTime).getTime();
          if (remoteTime > localTime) {
            workoutMap.set(remoteWorkout.id, remoteWorkout);
            await db.workouts.put(remoteWorkout);
          }
        }
      }
    }

    // 4. Merge Personal Records
    const prMap = new Map<string, PersonalRecord>();
    localPRs.forEach((pr) => prMap.set(pr.id, pr));

    if (remoteData?.personalRecords && Array.isArray(remoteData.personalRecords)) {
      for (const remotePR of remoteData.personalRecords) {
        const local = prMap.get(remotePR.id);
        if (!local) {
          prMap.set(remotePR.id, remotePR);
          await db.personalRecords.put(remotePR);
        } else if (remotePR.maxWeightKg > local.maxWeightKg || remotePR.estimated1RMKg > local.estimated1RMKg) {
          prMap.set(remotePR.id, remotePR);
          await db.personalRecords.put(remotePR);
        }
      }
    }

    const mergedWorkouts = Array.from(workoutMap.values());
    const mergedPRs = Array.from(prMap.values());

    // 5. Upload merged state back to cloud
    const cloudPayload: SyncCloudData = {
      syncKey,
      workouts: mergedWorkouts,
      personalRecords: mergedPRs,
      updatedAt: new Date().toISOString(),
    };

    const uploadSuccess = await uploadRemoteData(cloudPayload);
    if (!uploadSuccess && remoteData === null && localWorkouts.length > 0) {
      return {
        success: false,
        message: 'Не удалось передать данные в облако. Проверьте подключение к интернету.',
        syncedWorkoutsCount: localWorkouts.length,
      };
    }

    // 6. Record last sync time
    const nowIso = new Date().toISOString();
    localStorage.setItem(LAST_SYNCED_STORAGE_KEY, nowIso);
    saveSyncKey(syncKey);

    return {
      success: true,
      message: `Синхронизировано! Всего тренировок: ${mergedWorkouts.length}${newWorkoutsFromRemote > 0 ? ` (+${newWorkoutsFromRemote} новых с другого устройства)` : ''}`,
      syncedWorkoutsCount: mergedWorkouts.length,
      lastSyncedAt: nowIso,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Ошибка синхронизации: ' + (error?.message || 'Не удалось связаться с сервером'),
      syncedWorkoutsCount: 0,
      error: error?.message,
    };
  }
}
