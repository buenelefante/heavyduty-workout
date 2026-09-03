import {
  setPageBrightTime,
  resetPageBrightTime,
  pauseDropWristScreenOff,
  resetDropWristScreenOff,
  pausePalmScreenOff,
  resetPalmScreenOff,
  setWakeUpRelaunch,
} from '@zos/display';

/**
 * Keeps display permanently on during active workout and rest timer:
 * - Extends bright time to max
 * - Prevents wrist-drop screen off
 * - Prevents palm-cover screen off
 * - Auto-relaunches page on wake up
 */
export function keepScreenOn() {
  try {
    if (typeof setPageBrightTime === 'function') {
      setPageBrightTime({ brightTime: 2147483000 });
    }
    if (typeof pauseDropWristScreenOff === 'function') {
      pauseDropWristScreenOff({ duration: 0 });
    }
    if (typeof pausePalmScreenOff === 'function') {
      pausePalmScreenOff({ duration: 0 });
    }
    if (typeof setWakeUpRelaunch === 'function') {
      setWakeUpRelaunch({ relaunch: true });
    }
  } catch (err) {
    console.log('keepScreenOn error:', err);
  }
}

/**
 * Restores default system screen sleep behavior when workout completes or is cancelled
 */
export function releaseScreen() {
  try {
    if (typeof resetPageBrightTime === 'function') {
      resetPageBrightTime();
    }
    if (typeof resetDropWristScreenOff === 'function') {
      resetDropWristScreenOff();
    }
    if (typeof resetPalmScreenOff === 'function') {
      resetPalmScreenOff();
    }
    if (typeof setWakeUpRelaunch === 'function') {
      setWakeUpRelaunch({ relaunch: false });
    }
  } catch (err) {
    console.log('releaseScreen error:', err);
  }
}
