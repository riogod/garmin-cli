/**
 * Exercises command group: exercise library (static data).
 * garmin exercises <subcommand> [options]
 *
 * Data from built-in database /prj/go-garmin/exercises/data.json
 */

import type { Command } from 'commander';
import { print } from '../../lib/output.js';
import type { CliProgram } from '../../cli-types.js';

/** Global options (--json). */
function getJsonMode(program: CliProgram): boolean {
  return (program.opts() as { json?: boolean }).json === true;
}

// ─── Static exercise database ─────────────────────────────────────────────────

interface Exercise {
  key: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
}

// Built-in exercise database (simplified version)
const EXERCISES: Exercise[] = [
  { key: 'BARBELL_BENCH_PRESS', category: 'BENCH_PRESS', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: ['BARBELL'] },
  { key: 'DUMBBELL_BENCH_PRESS', category: 'BENCH_PRESS', primaryMuscles: ['CHEST'], secondaryMuscles: ['TRICEPS', 'SHOULDERS'], equipment: ['DUMBBELL'] },
  { key: 'INCLINE_BENCH_PRESS', category: 'BENCH_PRESS', primaryMuscles: ['UPPER_CHEST'], secondaryMuscles: ['TRICEPS'], equipment: ['BARBELL'] },
  { key: 'SQUAT', category: 'SQUAT', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES', 'HAMSTRINGS'], equipment: ['BARBELL'] },
  { key: 'FRONT_SQUAT', category: 'SQUAT', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: ['BARBELL'] },
  { key: 'LEG_PRESS', category: 'SQUAT', primaryMuscles: ['QUADS'], secondaryMuscles: ['GLUTES'], equipment: ['MACHINE'] },
  { key: 'DEADLIFT', category: 'DEADLIFT', primaryMuscles: ['BACK'], secondaryMuscles: ['HAMSTRINGS', 'GLUTES'], equipment: ['BARBELL'] },
  { key: 'ROMANIAN_DEADLIFT', category: 'DEADLIFT', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: ['GLUTES'], equipment: ['BARBELL'] },
  { key: 'BARBELL_ROW', category: 'ROW', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS'], equipment: ['BARBELL'] },
  { key: 'DUMBBELL_ROW', category: 'ROW', primaryMuscles: ['BACK'], secondaryMuscles: ['BICEPS'], equipment: ['DUMBBELL'] },
  { key: 'LAT_PULLDOWN', category: 'ROW', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS'], equipment: ['CABLE'] },
  { key: 'PULL_UP', category: 'ROW', primaryMuscles: ['LATS'], secondaryMuscles: ['BICEPS'], equipment: [] },
  { key: 'BARBELL_CURL', category: 'CURL', primaryMuscles: ['BICEPS'], secondaryMuscles: [], equipment: ['BARBELL'] },
  { key: 'DUMBBELL_CURL', category: 'CURL', primaryMuscles: ['BICEPS'], secondaryMuscles: [], equipment: ['DUMBBELL'] },
  { key: 'HAMMER_CURL', category: 'CURL', primaryMuscles: ['BICEPS', 'BRACHIALIS'], secondaryMuscles: [], equipment: ['DUMBBELL'] },
  { key: 'TRICEP_PUSHDOWN', category: 'TRICEPS', primaryMuscles: ['TRICEPS'], secondaryMuscles: [], equipment: ['CABLE'] },
  { key: 'OVERHEAD_PRESS', category: 'SHOULDERS', primaryMuscles: ['SHOULDERS'], secondaryMuscles: ['TRICEPS'], equipment: ['BARBELL'] },
  { key: 'LATERAL_RAISE', category: 'SHOULDERS', primaryMuscles: ['SIDE_DELTS'], secondaryMuscles: [], equipment: ['DUMBBELL'] },
  { key: 'FACE_PULL', category: 'SHOULDERS', primaryMuscles: ['REAR_DELTS'], secondaryMuscles: [], equipment: ['CABLE'] },
  { key: 'LEG_CURL', category: 'HAMSTRINGS', primaryMuscles: ['HAMSTRINGS'], secondaryMuscles: [], equipment: ['MACHINE'] },
  { key: 'LEG_EXTENSION', category: 'QUADS', primaryMuscles: ['QUADS'], secondaryMuscles: [], equipment: ['MACHINE'] },
  { key: 'CALF_RAISE', category: 'CALVES', primaryMuscles: ['CALVES'], secondaryMuscles: [], equipment: ['MACHINE'] },
  { key: 'CRUNCH', category: 'ABS', primaryMuscles: ['ABS'], secondaryMuscles: [], equipment: [] },
  { key: 'PLANK', category: 'ABS', primaryMuscles: ['ABS', 'CORE'], secondaryMuscles: [], equipment: [] },
];

// Get unique categories
const CATEGORIES = [...new Set(EXERCISES.map(e => e.category))];

// Get unique muscles
const MUSCLES = [...new Set(EXERCISES.flatMap(e => [...e.primaryMuscles, ...e.secondaryMuscles]))];

// Get unique equipment
const EQUIPMENT = [...new Set(EXERCISES.flatMap(e => e.equipment).filter(Boolean))];

// ─── Actions ──────────────────────────────────────────────────────────────────

function categoriesAction(jsonMode: boolean): void {
  print({ categories: CATEGORIES } as Record<string, unknown>, jsonMode);
}

function musclesAction(jsonMode: boolean): void {
  print({ muscles: MUSCLES } as Record<string, unknown>, jsonMode);
}

function equipmentAction(jsonMode: boolean): void {
  print({ equipment: EQUIPMENT.length > 0 ? EQUIPMENT : ['NONE'] } as Record<string, unknown>, jsonMode);
}

function listAction(options: { category?: string; muscle?: string; equipment?: string; search?: string }, jsonMode: boolean): void {
  let filtered = EXERCISES;

  if (options.category) {
    filtered = filtered.filter(e => e.category.toUpperCase() === options.category!.toUpperCase());
  }

  if (options.muscle) {
    const muscleUpper = options.muscle.toUpperCase();
    filtered = filtered.filter(e =>
      e.primaryMuscles.some(m => m.toUpperCase() === muscleUpper) ||
      e.secondaryMuscles.some(m => m.toUpperCase() === muscleUpper)
    );
  }

  if (options.equipment) {
    const equipmentUpper = options.equipment.toUpperCase();
    filtered = filtered.filter(e =>
      e.equipment.some(eq => eq.toUpperCase() === equipmentUpper) ||
      (options.equipment === 'NONE' && e.equipment.length === 0)
    );
  }

  if (options.search) {
    const searchLower = options.search.toLowerCase();
    filtered = filtered.filter(e =>
      e.key.toLowerCase().includes(searchLower) ||
      e.category.toLowerCase().includes(searchLower)
    );
  }

  print({ exercises: filtered, count: filtered.length } as Record<string, unknown>, jsonMode);
}

function getAction(exerciseKey: string, jsonMode: boolean): void {
  const exercise = EXERCISES.find(e => e.key.toUpperCase() === exerciseKey.toUpperCase());
  if (!exercise) {
    throw new Error(`Exercise not found: ${exerciseKey}`);
  }
  print(exercise as unknown as Record<string, unknown>, jsonMode);
}

// ─── Registration ─────────────────────────────────────────────────────────────

/**
 * Registers the exercises command group and all subcommands.
 */
export function registerExercisesSubcommands(exercisesCmd: Command): void {
  exercisesCmd
    .command('categories')
    .description('list of exercise categories')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      categoriesAction(getJsonMode(program));
    });

  exercisesCmd
    .command('muscles')
    .description('list of muscle groups')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      musclesAction(getJsonMode(program));
    });

  exercisesCmd
    .command('equipment')
    .description('list of equipment types')
    .action(async (_opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      equipmentAction(getJsonMode(program));
    });

  exercisesCmd
    .command('list')
    .description('list of exercises with filtering')
    .option('--category <category>', 'filter by category')
    .option('--muscle <muscle>', 'filter by muscle group')
    .option('--equipment <equipment>', 'filter by equipment')
    .option('--search <term>', 'search by name')
    .action(async (options, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      listAction(options, getJsonMode(program));
    });

  exercisesCmd
    .command('get')
    .description('get exercise by key')
    .argument('<exercise-key>', 'exercise key (e.g., BARBELL_BENCH_PRESS)')
    .action(async (exerciseKey: string, _opts: unknown, cmd: Command) => {
      const program = cmd.parent?.parent as CliProgram;
      getAction(exerciseKey, getJsonMode(program));
    });
}