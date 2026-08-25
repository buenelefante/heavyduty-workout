import { MuscleGroup, WorkoutExercise, WorkoutSession } from '../types/workout';

/**
 * Calculate 1RM using Brzycki formula: Weight * (36 / (37 - reps))
 */
export function calculate1RM(weightKg: number, reps: number, formula: 'brzycki' | 'epley' = 'brzycki'): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;

  if (formula === 'brzycki') {
    if (reps >= 37) return weightKg * 1.5; // safety bound
    return Math.round((weightKg * (36 / (37 - reps))) * 10) / 10;
  }

  // Epley formula: Weight * (1 + 0.0333 * reps)
  return Math.round((weightKg * (1 + 0.0333 * reps)) * 10) / 10;
}

/**
 * Generate a percentage-based intensity matrix based on 1RM
 */
export function calculate1RMTable(oneRM: number) {
  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 50];
  const repEstimates = [1, 2, 3, 5, 7, 9, 11, 14, 17, 25];

  return percentages.map((pct, idx) => ({
    percentage: pct,
    estimatedReps: repEstimates[idx],
    weightKg: Math.round((oneRM * (pct / 100)) * 2) / 2, // round to nearest 0.5kg
  }));
}

export interface PlateResult {
  plateWeight: number;
  countPerSide: number;
  color: string;
  diameterPercent: number; // for visual barbell display
}

/**
 * Olympic Plate Calculator (Per Side)
 */
export function calculateBarbellPlates(
  targetWeightKg: number,
  barWeightKg: number = 20,
  availablePlates: number[] = [20, 15, 10, 5, 2.5, 1.25]
): {
  platesPerSide: PlateResult[];
  achievedWeightKg: number;
  remainderKg: number;
} {
  const plateColors: Record<number, string> = {
    25: '#dc2626', // Red
    20: '#2563eb', // Blue
    15: '#eab308', // Yellow
    10: '#16a34a', // Green
    5: '#f8fafc',  // White
    2.5: '#0f172a', // Black
    1.25: '#64748b', // Grey
  };

  const plateSizes: Record<number, number> = {
    25: 100,
    20: 92,
    15: 82,
    10: 72,
    5: 58,
    2.5: 46,
    1.25: 38,
  };

  if (targetWeightKg <= barWeightKg) {
    return { platesPerSide: [], achievedWeightKg: barWeightKg, remainderKg: 0 };
  }

  let weightNeededPerSide = (targetWeightKg - barWeightKg) / 2;
  const sortedPlates = [...availablePlates].sort((a, b) => b - a);
  const platesPerSide: PlateResult[] = [];

  for (const plate of sortedPlates) {
    if (weightNeededPerSide >= plate) {
      const count = Math.floor(weightNeededPerSide / plate);
      if (count > 0) {
        platesPerSide.push({
          plateWeight: plate,
          countPerSide: count,
          color: plateColors[plate] || '#475569',
          diameterPercent: plateSizes[plate] || 60,
        });
        weightNeededPerSide -= count * plate;
      }
    }
  }

  const loadedWeight = barWeightKg + platesPerSide.reduce((acc, p) => acc + p.plateWeight * p.countPerSide * 2, 0);

  return {
    platesPerSide,
    achievedWeightKg: loadedWeight,
    remainderKg: Math.round((targetWeightKg - loadedWeight) * 10) / 10,
  };
}

/**
 * Calculate total volume/tonnage of completed sets
 */
export function calculateWorkoutTonnage(exercises: WorkoutExercise[]): {
  tonnageKg: number;
  totalSets: number;
  totalReps: number;
} {
  let tonnageKg = 0;
  let totalSets = 0;
  let totalReps = 0;

  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (s.completed) {
        totalSets += 1;
        totalReps += s.reps || 0;
        tonnageKg += (s.weightKg || 0) * (s.reps || 0);
      }
    }
  }

  return { tonnageKg, totalSets, totalReps };
}

export interface MuscleRecoveryInfo {
  muscle: MuscleGroup;
  muscleNameRu: string;
  recoveryPercentage: number; // 0 to 100%
  status: 'recovered' | 'recovering' | 'fatigued';
  hoursSinceLastWorkout: number | null;
  lastTrainedDate: string | null;
}

const MUSCLE_TRANSLATIONS: Record<MuscleGroup, string> = {
  chest: 'Грудь',
  back: 'Спина',
  quads: 'Квадрицепсы',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  legs: 'Ноги',
  shoulders: 'Плечи (Дельты)',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  forearms: 'Предплечья',
  calves: 'Икры',
  core: 'Пресс / Кор',
  full_body: 'Все тело',
};

/**
 * Calculate Muscle Recovery state from workout history (48-72h recovery curve)
 */
export function calculateMuscleRecovery(completedWorkouts: WorkoutSession[]): MuscleRecoveryInfo[] {
  const muscleGroups: MuscleGroup[] = [
    'chest', 'back', 'quads', 'hamstrings', 'shoulders', 'biceps', 'triceps', 'calves', 'core'
  ];

  const now = new Date().getTime();
  const lastTrainedMap: Record<MuscleGroup, number | null> = {} as any;

  // Initialize
  for (const m of muscleGroups) {
    lastTrainedMap[m] = null;
  }

  // Iterate backwards through completed workouts
  const sortedWorkouts = [...completedWorkouts]
    .filter(w => w.completed && w.endTime)
    .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime());

  for (const workout of sortedWorkouts) {
    const workoutTime = new Date(workout.endTime || workout.startTime).getTime();
    for (const ex of workout.exercises) {
      if (lastTrainedMap[ex.targetMuscleGroup] === null) {
        lastTrainedMap[ex.targetMuscleGroup] = workoutTime;
      }
      if (ex.secondaryMuscles) {
        for (const sec of ex.secondaryMuscles) {
          if (lastTrainedMap[sec] === null) {
            lastTrainedMap[sec] = workoutTime;
          }
        }
      }
    }
  }

  return muscleGroups.map(muscle => {
    const lastTimestamp = lastTrainedMap[muscle];
    if (!lastTimestamp) {
      return {
        muscle,
        muscleNameRu: MUSCLE_TRANSLATIONS[muscle],
        recoveryPercentage: 100,
        status: 'recovered',
        hoursSinceLastWorkout: null,
        lastTrainedDate: null,
      };
    }

    const elapsedHours = (now - lastTimestamp) / (1000 * 60 * 60);
    // Baseline full recovery is 60 hours
    const baselineRecoveryHours = 60;
    const rawPct = Math.min(100, Math.round((elapsedHours / baselineRecoveryHours) * 100));

    let status: 'recovered' | 'recovering' | 'fatigued' = 'recovered';
    if (rawPct < 40) {
      status = 'fatigued';
    } else if (rawPct < 90) {
      status = 'recovering';
    }

    return {
      muscle,
      muscleNameRu: MUSCLE_TRANSLATIONS[muscle],
      recoveryPercentage: rawPct,
      status,
      hoursSinceLastWorkout: Math.round(elapsedHours),
      lastTrainedDate: new Date(lastTimestamp).toLocaleDateString('ru-RU'),
    };
  });
}
