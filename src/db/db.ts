import Dexie, { Table } from 'dexie';
import { 
  WorkoutSession, 
  ExerciseDefinition, 
  ProgramTemplate, 
  PersonalRecord, 
  UserSettings 
} from '../types/workout';
import { INITIAL_EXERCISES, STRONGLIFTS_PLUS_PROGRAMS } from '../data/exercises';

export class HeavyDutyDatabase extends Dexie {
  workouts!: Table<WorkoutSession, string>;
  exercises!: Table<ExerciseDefinition, string>;
  programs!: Table<ProgramTemplate, string>;
  personalRecords!: Table<PersonalRecord, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('HeavyDutyWorkoutDB');
    this.version(1).stores({
      workouts: 'id, name, workoutType, startTime, completed, totalTonnageKg',
      exercises: 'id, name, category, targetMuscleGroup',
      programs: 'id, code, name',
      personalRecords: 'id, exerciseId, maxWeightKg, estimated1RMKg, date',
      settings: 'id',
    });
  }

  async initializeDefaultData() {
    const exerciseCount = await this.exercises.count();
    if (exerciseCount === 0) {
      await this.exercises.bulkAdd(INITIAL_EXERCISES);
    }

    const programCount = await this.programs.count();
    if (programCount === 0) {
      await this.programs.bulkAdd(STRONGLIFTS_PLUS_PROGRAMS);
    }

    const settingsCount = await this.settings.count();
    if (settingsCount === 0) {
      await this.settings.add({
        id: 'global-settings',
        weightUnit: 'kg',
        barWeightKg: 20,
        soundEnabled: true,
        vibrationEnabled: true,
        autoStartRestTimer: true,
        defaultCompoundRestSeconds: 120,
        defaultIsolationRestSeconds: 75,
        defaultCoreRestSeconds: 60,
        platesKg: [20, 15, 10, 5, 2.5, 1.25],
      });
    } else {
      // Ensure 25kg is stripped from existing settings if present
      const existing = await this.settings.get('global-settings');
      if (existing && existing.platesKg.includes(25)) {
        existing.platesKg = existing.platesKg.filter((p) => p !== 25);
        await this.settings.put(existing);
      }
    }
  }
}

export const db = new HeavyDutyDatabase();

// Run initial seed
db.initializeDefaultData().catch(console.error);
