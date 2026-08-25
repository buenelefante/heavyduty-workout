# HeavyDuty Project Rules

## Overview
HeavyDuty is an offline-first, high-intensity strength training tracker web application.

## Key Guidelines
1. **Always Offline-First**: All data must be saved to IndexedDB (Dexie.js) instantly. Never block user interaction on network calls.
2. **Speed & Ergonomics**: During active workout mode, logging a set must take ≤ 2 taps. Keep buttons large, tap-friendly, and input numeric keyboards (`inputMode="decimal"`).
3. **Rest Timer**: Automatically start countdown on set checkmark. Play synth chime via Web Audio API when time expires.
4. **Calculations**: Use standard Brzycki & Epley formulas from the `strength-training-engine` skill for 1RM estimations.
5. **Modern Web Standards**: Follow `modern-web-guidance` for UI/CSS, dialogs, and animations.
