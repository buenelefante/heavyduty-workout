import { BasePage } from '@zeppos/zml/base-page';
import * as hmUI from '@zos/ui';
import * as router from '@zos/router';
import { THEME } from '../../utils/constants';
import { releaseScreen } from '../../utils/screen';

Page(
  BasePage({
    state: {
      session: null,
      totalTonnageKg: 0,
      totalSets: 0,
      totalReps: 0,
      durationMinutes: 0,
      syncStatusText: 'Синхронизация...',
      ui: {},
    },

    build() {
      const app = getApp();
      this.state.session = app.globalData.activeSession;

      if (!this.state.session) {
        router.push({ url: 'page/home/index' });
        return;
      }

      releaseScreen();
      this.calculateSummary();
      this.renderUI();
      this.syncWorkoutToPhoneAndCloud();
    },

    calculateSummary() {
      const { session } = this.state;
      let tonnage = 0;
      let setsCount = 0;
      let repsCount = 0;

      session.exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          if (s.completed) {
            setsCount += 1;
            repsCount += s.reps || 0;
            tonnage += (s.weightKg || 0) * (s.reps || 0);
          }
        });
      });

      const startMs = new Date(session.startTime).getTime();
      const nowMs = Date.now();
      const durationSeconds = Math.max(60, Math.floor((nowMs - startMs) / 1000));

      session.durationSeconds = durationSeconds;
      session.totalTonnageKg = tonnage;
      session.totalSets = setsCount;
      session.totalReps = repsCount;
      session.completed = true;
      session.endTime = new Date().toISOString();

      this.state.totalTonnageKg = tonnage;
      this.state.totalSets = setsCount;
      this.state.totalReps = repsCount;
      this.state.durationMinutes = Math.floor(durationSeconds / 60);
    },

    renderUI() {
      // Background
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: 480,
        h: 480,
        color: THEME.bg,
      });

      // Title
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 35,
        w: 480,
        h: 30,
        color: THEME.primary,
        text_size: 24,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'ОТЛИЧНАЯ РАБОТА! 🔥',
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
        text: this.state.session.name,
      });

      // Metrics Cards
      // Tonnage
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 50,
        y: 105,
        w: 180,
        h: 90,
        radius: 20,
        color: THEME.cardBg,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 50,
        y: 112,
        w: 180,
        h: 22,
        color: THEME.textDark,
        text_size: 14,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'ТОННАЖ',
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 50,
        y: 138,
        w: 180,
        h: 40,
        color: THEME.accentAmber,
        text_size: 28,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: `${this.state.totalTonnageKg} кг`,
      });

      // Sets
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 250,
        y: 105,
        w: 180,
        h: 90,
        radius: 20,
        color: THEME.cardBg,
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 250,
        y: 112,
        w: 180,
        h: 22,
        color: THEME.textDark,
        text_size: 14,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'ПОДХОДЫ',
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 250,
        y: 138,
        w: 180,
        h: 40,
        color: THEME.accentCyan,
        text_size: 28,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: `${this.state.totalSets}`,
      });

      // Duration & Reps
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 215,
        w: 480,
        h: 26,
        color: THEME.textWhite,
        text_size: 18,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: `Время: ${this.state.durationMinutes} мин • Всего ${this.state.totalReps} повт`,
      });

      // Cloud Sync Status Label
      this.state.ui.syncStatus = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 260,
        w: 480,
        h: 28,
        color: THEME.accentCyan,
        text_size: 16,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: this.state.syncStatusText,
      });

      // Done & Exit Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 70,
        y: 320,
        w: 340,
        h: 80,
        radius: 24,
        normal_color: THEME.primary,
        press_color: THEME.primaryActive,
        text: 'СОХРАНИТЬ И ВЫЙТИ',
        color: 0x052e16,
        text_size: 22,
        click_func: () => {
          const app = getApp();
          app.globalData.activeSession = null;
          router.push({ url: 'page/home/index' });
        },
      });
    },

    syncWorkoutToPhoneAndCloud() {
      const app = getApp();
      const syncKey = app.globalData.syncKey || 'HD-7163-9242';

      this.request({
        action: 'SYNC_WORKOUT',
        payload: {
          syncKey,
          workout: this.state.session,
        },
      })
        .then((response) => {
          if (response && response.success) {
            this.state.syncStatusText = '✓ Сохранено в HeavyDuty Cloud';
          } else {
            this.state.syncStatusText = 'Сохранено локально на часах';
          }
          if (this.state.ui.syncStatus) {
            this.state.ui.syncStatus.setProperty(hmUI.prop.TEXT, this.state.syncStatusText);
          }
        })
        .catch((err) => {
          console.error('Sync request failed:', err);
          this.state.syncStatusText = 'Сохранено локально на часах';
          if (this.state.ui.syncStatus) {
            this.state.ui.syncStatus.setProperty(hmUI.prop.TEXT, this.state.syncStatusText);
          }
        });
    },

    onDestroy() {
      releaseScreen();
    },
  })
);
