---
name: strength-training-engine
description: >-
  Domain knowledge, biomechanics calculations, progressive overload algorithms, 
  and workout tracking standards for strength training, bodybuilding, and Heavy Duty HIT applications.
---

# Strength Training & Heavy Duty HIT Engine

This skill provides domain expertise, biomechanical calculations, and architectural guidelines for building world-class strength training, powerlifting, bodybuilding, and High Intensity Training (Mike Mentzer / Heavy Duty) applications.

---

## 1. Core Biomechanical & Strength Calculations

### One-Rep Max (1RM) Formulas
For estimated 1RM calculations (best accuracy for reps $\le 10$):

1. **Brzycki Formula** (Recommended standard):
   $$\text{1RM} = \frac{\text{Weight}}{1.0278 - (0.0278 \times \text{Reps})} = \text{Weight} \times \frac{36}{37 - \text{Reps}}$$

2. **Epley Formula**:
   $$\text{1RM} = \text{Weight} \times \left(1 + \frac{\text{Reps}}{30}\right)$$

3. **Lombardi Formula**:
   $$\text{1RM} = \text{Weight} \times \text{Reps}^{0.10}$$

### Training Volume & Intensity Metrics
- **Volume Load (Tonnage)**: $\sum (\text{Weight} \times \text{Reps})$ for all completed working sets.
- **Effective Reps**: Reps completed close to muscular failure (typically the last 3-5 reps of a set taken to RIR 0-2).
- **RPE (Rate of Perceived Exertion)** & **RIR (Reps in Reserve)**:
  - RPE 10 / RIR 0: Absolute failure, no more reps possible.
  - RPE 9.5 / RIR 0-1: Could maybe do 1 more rep with breakdown in form.
  - RPE 9 / RIR 1: Exactly 1 rep left in the tank.
  - RPE 8 / RIR 2: 2 reps left in the tank.
  - RPE 7 / RIR 3: 3 reps left in the tank (speed/explosiveness).

---

## 2. Heavy Duty & HIT (High Intensity Training) Methodologies

When tracking High-Intensity Training (Mike Mentzer / Arthur Jones):
- **Set Types**:
  - `WARM_UP`: Acclimatization sets (do not count towards working volume/fatigue).
  - `WORKING`: Standard working set.
  - `FAILURE`: Set taken to absolute concentric muscular failure (RPE 10).
  - `REST_PAUSE`: Reaching failure, resting 10-15s, performing 1-2 more reps.
  - `DROP_SET`: Reaching failure, immediately stripping 20-30% weight, continuing to failure.
  - `STATIC_HOLD`: Isometric contraction at maximum point of contraction at the end of a set.
  - `NEGATIVE`: Eccentric-only repetitions (3-5s lowering phase).
- **Time Under Tension (TUT)**:
  - Cadence format: `Eccentric - Pause - Concentric - Peak Contraction` (e.g. `4-1-2-1`).
- **Recovery Tracking**:
  - Full muscle recovery for high-intensity training requires 48 to 96 hours depending on muscle group size and CNS load.

---

## 3. Data Schema Standards for Workout Trackers

```typescript
export type SetType = 'warm_up' | 'normal' | 'failure' | 'drop_set' | 'rest_pause';

export interface ExerciseSet {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg: number;
  reps: number;
  rpe?: number; // 6 to 10
  rir?: number; // 0 to 4
  completed: boolean;
  restTimeSeconds?: number;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetMuscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  sets: ExerciseSet[];
  notes?: string;
  supersettedWithExerciseId?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  startTime: string; // ISO
  endTime?: string;  // ISO
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalTonnageKg: number;
  totalSets: number;
  totalReps: number;
  rpeAverage?: number;
  mood?: 'great' | 'good' | 'average' | 'exhausted';
  notes?: string;
}

export type MuscleGroup = 
  | 'chest' | 'back' | 'shoulders' | 'biceps' 
  | 'triceps' | 'forearms' | 'quads' | 'hamstrings' 
  | 'glutes' | 'calves' | 'core' | 'full_body';
```

---

## 4. UI/UX & Sensory Feedback Rules for Gym Workouts

1. **One-Handed Quick Logging**:
   - Number pickers, +/- buttons for weight (2.5kg / 5kg / 1.25kg steps) and reps (+1 / -1).
   - "Copy previous set" button.
   - History preview: Show previous workout's performance for the current exercise right on the set row.
2. **Rest Timer with Audio/Vibration**:
   - Automatic timer trigger on set completion.
   - Web Audio API synthesizer bleeps (3 countdown pings + 1 high finish tone) so sound works without external audio files.
   - `navigator.vibrate([100, 50, 200])` for pocket haptic notification.
3. **Offline First**:
   - Store all workouts in IndexedDB via Dexie.js.
   - Cloud sync / JSON export-import as backup.
