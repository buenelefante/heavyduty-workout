import { BasePage } from '@zeppos/zml/base-page';
import * as hmUI from '@zos/ui';
import * as router from '@zos/router';
import { THEME } from '../../utils/constants';
import { keepScreenOn, releaseScreen } from '../../utils/screen';

Page(
  BasePage({
    state: {
      session: null,
      exercise: null,
      currentSet: null,
      ui: {},
    },

    build() {
      const app = getApp();
      this.state.session = app.globalData.activeSession;

      if (!this.state.session) {
        router.back();
        return;
      }

      this.initCurrentState();
      this.initHeartRateSensor();
      this.renderUI();
      keepScreenOn();
    },

    initCurrentState() {
      const { session } = this.state;
      const ex = session.exercises[session.currentExerciseIdx];
      const currentSet = ex.sets[session.currentSetIdx];
      this.state.exercise = ex;
      this.state.currentSet = currentSet;
    },

    initHeartRateSensor() {
      // try {
      //   const hr = new HeartRate();
      //   hr.onCurrentChange(() => {
      //     this.state.currentHr = hr.getCurrent();
      //     if (this.state.ui.hrText) {
      //       this.state.ui.hrText.setProperty(hmUI.prop.TEXT, `❤️ ${this.state.currentHr || '--'}`);
      //     }
      //   });
      //   this.state.hrSensor = hr;
      // } catch (err) {
      //   console.error('HR sensor init error:', err);
      // }
    },

    renderUI() {
      const { exercise, currentSet, session } = this.state;

      // Background
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: 480,
        h: 480,
        color: THEME.bg,
      });

      // Top Exercise Indicator e.g. "1/4 • Жим штанги лежа"
      this.state.ui.exTitle = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 30,
        y: 28,
        w: 420,
        h: 30,
        color: THEME.textWhite,
        text_size: 20,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: `${session.currentExerciseIdx + 1}/${session.exercises.length} • ${exercise.name}`,
      });

      // Set Number & Heart Rate Bar
      this.state.ui.setNumberText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 62,
        w: 180,
        h: 26,
        color: THEME.accentCyan,
        text_size: 18,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: `СЕТ ${session.currentSetIdx + 1} / ${exercise.sets.length}`,
      });

      this.state.ui.hrText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 240,
        y: 62,
        w: 180,
        h: 26,
        color: THEME.danger,
        text_size: 18,
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
        text: `❤️ ${this.state.currentHr || '--'}`,
      });

      // --- WEIGHT ROW ---
      // [-2.5] Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 50,
        y: 100,
        w: 80,
        h: 60,
        radius: 16,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: '-2.5',
        color: THEME.textWhite,
        text_size: 20,
        click_func: () => this.adjustWeight(-2.5),
      });

      // Weight Display
      this.state.ui.weightText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 140,
        y: 100,
        w: 200,
        h: 60,
        color: THEME.accentAmber,
        text_size: 32,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: `${currentSet.weightKg} кг`,
      });

      // [+2.5] Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 350,
        y: 100,
        w: 80,
        h: 60,
        radius: 16,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: '+2.5',
        color: THEME.textWhite,
        text_size: 20,
        click_func: () => this.adjustWeight(+2.5),
      });

      // --- REPS ROW ---
      // [-1] Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 50,
        y: 175,
        w: 80,
        h: 60,
        radius: 16,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: '-1',
        color: THEME.textWhite,
        text_size: 20,
        click_func: () => this.adjustReps(-1),
      });

      // Reps Display
      this.state.ui.repsText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 140,
        y: 175,
        w: 200,
        h: 60,
        color: THEME.textWhite,
        text_size: 30,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: currentSet.isTimeBased ? `${currentSet.targetSeconds} сек` : `${currentSet.reps} повт`,
      });

      // [+1] Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 350,
        y: 175,
        w: 80,
        h: 60,
        radius: 16,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: '+1',
        color: THEME.textWhite,
        text_size: 20,
        click_func: () => this.adjustReps(+1),
      });

      // --- BIG "DONE" BUTTON ---
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 50,
        y: 255,
        w: 380,
        h: 95,
        radius: 28,
        normal_color: THEME.primary,
        press_color: THEME.primaryActive,
        text: '✓ ВЫПОЛНИЛ СЕТ',
        color: 0x052e16,
        text_size: 24,
        click_func: () => this.handleCompleteSet(),
      });

      // Bottom Row: Finish Workout & Next Ex
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 70,
        y: 370,
        w: 160,
        h: 55,
        radius: 16,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: 'След. упр. ❯',
        color: THEME.textMuted,
        text_size: 16,
        click_func: () => this.handleNextExercise(),
      });

      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 250,
        y: 370,
        w: 160,
        h: 55,
        radius: 16,
        normal_color: 0x3f1212,
        press_color: 0x5a1818,
        text: 'Завершить ⏹',
        color: 0xfca5a5,
        text_size: 16,
        click_func: () => this.handleFinishWorkout(),
      });
    },

    adjustWeight(delta) {
      const { currentSet } = this.state;
      currentSet.weightKg = Math.max(0, currentSet.weightKg + delta);
      if (this.state.ui.weightText) {
        this.state.ui.weightText.setProperty(hmUI.prop.TEXT, `${currentSet.weightKg} кг`);
      }
    },

    adjustReps(delta) {
      const { currentSet } = this.state;
      if (currentSet.isTimeBased) {
        currentSet.targetSeconds = Math.max(5, (currentSet.targetSeconds || 60) + delta * 5);
        this.state.ui.repsText.setProperty(hmUI.prop.TEXT, `${currentSet.targetSeconds} сек`);
      } else {
        currentSet.reps = Math.max(1, currentSet.reps + delta);
        this.state.ui.repsText.setProperty(hmUI.prop.TEXT, `${currentSet.reps} повт`);
      }
    },

    handleCompleteSet() {
      const { currentSet, exercise, session } = this.state;
      currentSet.completed = true;

      const restSeconds = exercise.defaultRestSeconds || 90;

      // Determine next set / exercise
      let isLastSetOfEx = session.currentSetIdx >= exercise.sets.length - 1;
      let isLastExercise = session.currentExerciseIdx >= session.exercises.length - 1;

      if (!isLastSetOfEx) {
        session.currentSetIdx += 1;
      } else if (!isLastExercise) {
        session.currentExerciseIdx += 1;
        session.currentSetIdx = 0;
      }

      // Open Rest Timer Page
      router.push({
        url: 'page/rest/index',
        params: JSON.stringify({
          restSeconds,
          exerciseName: exercise.name,
          isFinished: isLastSetOfEx && isLastExercise,
        }),
      });
    },

    handleNextExercise() {
      const { session } = this.state;
      if (session.currentExerciseIdx < session.exercises.length - 1) {
        session.currentExerciseIdx += 1;
        session.currentSetIdx = 0;
        this.initCurrentState(); // Must come before updateViewTexts to refresh state.exercise & state.currentSet
        this.updateViewTexts();
      }
    },

    handleFinishWorkout() {
      releaseScreen();
      router.push({
        url: 'page/summary/index',
      });
    },

    updateViewTexts() {
      const { exercise, currentSet, session } = this.state;
      this.state.ui.exTitle.setProperty(
        hmUI.prop.TEXT,
        `${session.currentExerciseIdx + 1}/${session.exercises.length} • ${exercise.name}`
      );
      this.state.ui.setNumberText.setProperty(
        hmUI.prop.TEXT,
        `СЕТ ${session.currentSetIdx + 1} / ${exercise.sets.length}`
      );
      this.state.ui.weightText.setProperty(hmUI.prop.TEXT, `${currentSet.weightKg} кг`);
      this.state.ui.repsText.setProperty(
        hmUI.prop.TEXT,
        currentSet.isTimeBased ? `${currentSet.targetSeconds} сек` : `${currentSet.reps} повт`
      );
    },

    onDestroy() {
      releaseScreen();
    },
  })
);
