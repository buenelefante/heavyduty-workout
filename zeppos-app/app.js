import { BaseApp } from '@zeppos/zml/base-app';

App(
  BaseApp({
    globalData: {
      activeSession: null,
      syncKey: 'HD-7163-9242',
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
