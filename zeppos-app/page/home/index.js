import { BasePage } from '@zeppos/zml/base-page';
import * as hmUI from '@zos/ui';
import * as router from '@zos/router';
import { WORKOUT_TEMPLATES, THEME } from '../../utils/constants';

Page(
  BasePage({
    build() {
      // App Title
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 35,
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
        y: 68,
        w: 480,
        h: 22,
        color: THEME.textMuted,
        text_size: 16,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Выберите тренировку:',
      });

      // Workout A Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 48,
        y: 105,
        w: 384,
        h: 100,
        radius: 22,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: 'WORKOUT A\nПрисед • Жим • Тяга • Пресс',
        color: THEME.textWhite,
        text_size: 19,
        click_func: () => {
          this.startWorkout(WORKOUT_TEMPLATES[0]);
        },
      });

      // Workout B Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 48,
        y: 218,
        w: 384,
        h: 100,
        radius: 22,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: 'WORKOUT B\nСтановая • Жим стоя • Планка',
        color: THEME.textWhite,
        text_size: 19,
        click_func: () => {
          this.startWorkout(WORKOUT_TEMPLATES[1]);
        },
      });

      // Workout C Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 48,
        y: 330,
        w: 384,
        h: 100,
        radius: 22,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: 'WORKOUT C\nНаклонный жим • Руки • Икры',
        color: THEME.accentPurple,
        text_size: 19,
        click_func: () => {
          this.startWorkout(WORKOUT_TEMPLATES[2]);
        },
      });

      // Sync Key info at bottom
      const app = getApp();
      const syncKey = app.globalData.syncKey || 'HD-7838-6732';
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 445,
        w: 480,
        h: 28,
        color: THEME.accentCyan,
        text_size: 14,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: `Облако: ${syncKey}`,
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
