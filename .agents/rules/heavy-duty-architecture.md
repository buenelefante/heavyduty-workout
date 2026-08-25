# HeavyDuty Workout App Architecture & UX Rules

## 1. Project Philosophy
- **Name**: HeavyDuty (Inspired by Mike Mentzer High Intensity Training & Progressive Overload).
- **Core Goal**: Lightning-fast, friction-free strength workout logging, real-time rest timer with audio/haptic feedback, 1RM analytics, and progressive overload tracking.
- **Gym-Grade Reliability**: The app MUST work 100% offline (underground gym basements with 0 cell reception) using IndexedDB / PWA storage.

## 2. Frontend & Design Standards
- **Theme**: Premium Dark Aesthetic ("Iron / Carbon / Cyberpunk Slate" - `#0a0b0e`, `#12151c`, `#1e2330` with vibrant Neon Lime / Gold / Electric Cyan accents `#10b981`, `#f59e0b`, `#06b6d4`, `#6366f1`).
- **Typography**: Clean, bold athletic typography (Inter / Outfit / SF Pro Display) with high legibility.
- **Mobile First Touch UX**:
  - Oversized tap targets (minimum 44x44px, preferably 48-56px for gym fingers).
  - One-tap set completion with automatic rest timer trigger.
  - Previous workout benchmark comparison (`Last: 100kg x 8` shown directly next to current inputs).
  - Quick weight increment chips: `+1.25`, `+2.5`, `+5`, `+10`, `+20`.
- **Sensory Feedback**:
  - Rest timer audio chimes generated via Web Audio API (no broken audio links or network dependencies).
  - Vibration API integration (`navigator.vibrate`) when timer hits 0:00.
  - PR (Personal Record!) celebration animation / confetti on surpassing previous 1RM or weight/reps.

## 3. Tech Stack
- **Framework**: React 18 / 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS + Custom CSS Design System with dark athletic tokens & smooth CSS transitions.
- **Icons**: Lucide React.
- **Database / Offline Storage**: Dexie.js (IndexedDB wrapper) with automatic schema migrations + JSON export/import backup.
- **Analytics & Graphs**: Recharts or Chart.js for volume progression, 1RM history, and muscle frequency breakdown.
- **Audio & Haptics**: Native Web Audio API AudioContext + Web Vibration API.
- **PWA**: `vite-plugin-pwa` with web manifest, offline service worker, and app icon.

## 4. MCP & Testing Tools
- Use **Chrome DevTools MCP** (`list_pages`, `navigate_page`, `click`, `take_screenshot`, `evaluate_script`) to test mobile viewport rendering (390x844 iPhone, 412x915 Android), touch interactions, and IndexedDB operations.
