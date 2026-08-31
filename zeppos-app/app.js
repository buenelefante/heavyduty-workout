import { BaseApp } from '@zeppos/zml/base-app';

App(
  BaseApp({
    globalData: {
      activeSession: null,
      syncKey: 'HD-7838-6732',
      lastCompletedWorkout: null,
    },
    onCreate() {
      console.log('HeavyDuty Watch App Created on Zepp OS 4.0');
    },
    onDestroy() {
      console.log('HeavyDuty Watch App Destroyed');
    },
  })
);
