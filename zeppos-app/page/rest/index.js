import { BasePage } from '@zeppos/zml/base-page';
import * as hmUI from '@zos/ui';
import * as router from '@zos/router';
import { THEME } from '../../utils/constants';

Page(
  BasePage({
    state: {
      remainingSeconds: 90,
      totalSeconds: 90,
      timerId: null,
      isFinished: false,
      exerciseName: '',
      ui: {},
    },

    onInit(params) {
      if (params) {
        try {
          const parsed = JSON.parse(params);
          this.state.remainingSeconds = parsed.restSeconds || 90;
          this.state.totalSeconds = this.state.remainingSeconds;
          this.state.isFinished = Boolean(parsed.isFinished);
          this.state.exerciseName = parsed.exerciseName || '';
        } catch (e) {}
      }
    },

    build() {
      // Background
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: 480,
        h: 480,
        color: THEME.bg,
      });

      // Header
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 45,
        w: 480,
        h: 26,
        color: THEME.textMuted,
        text_size: 17,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: this.state.exerciseName ? `Отдых • ${this.state.exerciseName}` : 'ОТДЫХ МЕЖДУ СЕТАМИ',
      });

      // Big Timer Digital Display
      this.state.ui.timerText = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 110,
        w: 480,
        h: 110,
        color: THEME.primary,
        text_size: 68,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: this.formatTime(this.state.remainingSeconds),
      });

      // +30s Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 90,
        y: 250,
        w: 140,
        h: 65,
        radius: 20,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: '+30 сек',
        color: THEME.textWhite,
        text_size: 20,
        click_func: () => {
          this.state.remainingSeconds += 30;
          this.updateDisplay();
        },
      });

      // -15s Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 250,
        y: 250,
        w: 140,
        h: 65,
        radius: 20,
        normal_color: THEME.cardBg,
        press_color: THEME.cardBorder,
        text: '-15 сек',
        color: THEME.textWhite,
        text_size: 20,
        click_func: () => {
          this.state.remainingSeconds = Math.max(0, this.state.remainingSeconds - 15);
          this.updateDisplay();
        },
      });

      // Skip Button
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 70,
        y: 350,
        w: 340,
        h: 75,
        radius: 24,
        normal_color: THEME.primary,
        press_color: THEME.primaryActive,
        text: 'ГОТОВ К СЛЕД. СЕТУ ❯',
        color: 0x052e16,
        text_size: 22,
        click_func: () => {
          this.finishRest();
        },
      });

      this.startCountdown();
    },

    startCountdown() {
      this.state.timerId = setInterval(() => {
        if (this.state.remainingSeconds > 0) {
          this.state.remainingSeconds -= 1;
          this.updateDisplay();

          if (this.state.remainingSeconds === 0) {
            this.triggerAlarm();
          }
        }
      }, 1000);
    },

    updateDisplay() {
      if (this.state.ui.timerText) {
        this.state.ui.timerText.setProperty(
          hmUI.prop.TEXT,
          this.formatTime(this.state.remainingSeconds)
        );
      }
    },

    formatTime(totalSecs) {
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    },

    triggerAlarm() {
      setTimeout(() => {
        this.finishRest();
      }, 1500);
    },

    finishRest() {
      if (this.state.timerId) {
        clearInterval(this.state.timerId);
      }

      if (this.state.isFinished) {
        router.push({
          url: 'page/summary/index',
        });
      } else {
        router.back();
      }
    },

    onDestroy() {
      if (this.state.timerId) {
        clearInterval(this.state.timerId);
      }
    },
  })
);
