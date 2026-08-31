import { BasePage } from '@zeppos/zml/base-page';
import * as hmUI from '@zeppos/ui';
import * as router from '@zeppos/router';
import { WORKOUT_TEMPLATES, THEME } from '../../utils/constants';

Page(
  BasePage({
    build() {
      // Background
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: 480,
        h: 480,
        color: THEME.bg,
      });

      // App Title
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 40,
        w: 480,
        h: 30,
        color: THEME.primary,
        text_size: 24,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'HEAVYDUTY 5×5+',
      });

      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 72,
        w: 480,
        h: 22,
        color: THEME.textMuted,
        text_size: 16,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Выберите тренировку:',
      });

      // Button: Workout A
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 48,
        y: 115,
        w: 384,
        h: 110,
        radius: 24,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: 'WORKOUT A\nПрисед • Жим • Тяга',
        color: THEME.textWhite,
        text_size: 20,
        click_func: () => {
          this.startWorkout(WORKOUT_TEMPLATES[0]);
        },
      });

      // Button: Workout B
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 48,
        y: 240,
        w: 384,
        h: 110,
        radius: 24,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: 'WORKOUT B\nСтановая • Плечи • Планка',
        color: THEME.textWhite,
        text_size: 20,
        click_func: () => {
          this.startWorkout(WORKOUT_TEMPLATES[1]);
        },
      });

      // Sync Key info at bottom
      const app = getApp();
      const syncKey = app.globalData.syncKey || 'HD-7838-6732';
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 395,
        w: 480,
        h: 26,
        color: THEME.accentCyan,
        text_size: 15,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: `Синхр: ${syncKey}`,
      });
    },

    startWorkout(template) {
      const app = getApp();
      const session = {
        id: `watch-${Date.now()}`,
        name: `StrongLifts Plus - ${template.name}`,
        workoutType: template.type,
        startTime: new Date().toISOString(),
        durationSeconds: 0,
        currentExerciseIdx: 0,
        currentSetIdx: 0,
        exercises: template.exercises.map((ex) => ({
          ...ex,
          sets: Array.from({ length: ex.defaultSets }).map((_, idx) => ({
            id: `set-${idx + 1}`,
            setNumber: idx + 1,
            type: 'normal',
            weightKg: ex.defaultWeightKg,
            reps: ex.defaultReps,
            targetReps: ex.defaultReps,
            targetSeconds: ex.targetSeconds,
            isTimeBased: ex.isTimeBased,
            completed: false,
          })),
        })),
      };

      app.globalData.activeSession = session;
      router.push({
        url: 'page/workout/index',
      });
    },
  })
);
