export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'legs' 
  | 'quads' 
  | 'hamstrings' 
  | 'glutes'
  | 'shoulders' 
  | 'biceps' 
  | 'triceps' 
  | 'forearms'
  | 'calves' 
  | 'core' 
  | 'full_body';

export type SetType = 'warm_up' | 'normal' | 'failure' | 'drop_set' | 'rest_pause';

export interface ExerciseSet {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg: number;
  reps: number;
  targetReps?: number;
  targetSeconds?: number; // for planks / timed exercises
  actualSeconds?: number;
  isTimeBased?: boolean;
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
  exerciseNameRu?: string;
  targetMuscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  isBodyweight?: boolean;
  isTimeBased?: boolean;
  isBarbell?: boolean;
  defaultRestSeconds: number;
  sets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  workoutType: 'A' | 'B' | 'C' | 'custom';
  startTime: string; // ISO string
  endTime?: string;  // ISO string
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalTonnageKg: number;
  totalSets: number;
  totalReps: number;
  completed: boolean;
  rpeAverage?: number;
  bodyWeightKg?: number;
  notes?: string;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  nameRu: string;
  category: 'barbell' | 'dumbbell' | 'bodyweight' | 'machine' | 'cable';
  targetMuscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  isBarbell: boolean;
  isBodyweight: boolean;
  isTimeBased: boolean;
  defaultSets: number;
  defaultReps: number;
  defaultSeconds?: number;
  defaultRestSeconds: number;
  instructionsRu?: string;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  code: 'A' | 'B' | 'C' | 'custom';
  description: string;
  exercises: {
    exerciseId: string;
    targetSets: number;
    targetReps?: number;
    targetSeconds?: number;
    isTimeBased?: boolean;
    defaultWeightKg?: number;
  }[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  maxWeightKg: number;
  maxReps: number;
  estimated1RMKg: number;
  date: string;
  workoutSessionId: string;
}

export interface UserSettings {
  id: string;
  weightUnit: 'kg' | 'lbs';
  barWeightKg: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoStartRestTimer: boolean;
  defaultCompoundRestSeconds: number;
  defaultIsolationRestSeconds: number;
  defaultCoreRestSeconds: number;
  platesKg: number[];
}
