/**
 * Registration of all CLI commands.
 * Command groups in subdirectories.
 * Import: import { registerCommands } from './commands/index.js';
 */

import type { CliProgram } from '../cli-types.js';

// Phase 1: Core Health
import { registerWeight } from './weight/index.js';
import { registerHrv } from './hrv/index.js';
import { registerMetrics } from './metrics/index.js';
import { registerBiometric } from './biometric/index.js';

// Phase 2: Training & Fitness
import { registerDevices } from './devices/index.js';
import { registerWorkouts } from './workouts/index.js';
import { registerFitness } from './fitness/index.js';

// Phase 3: Social & Goals
import { registerGoals } from './goals/index.js';
import { registerBadges } from './badges/index.js';
import { registerChallenges } from './challenges/index.js';
import { registerGear } from './gear/index.js';

// Phase 4: Health Logging
import { registerHydration } from './hydration/index.js';
import { registerBloodPressure } from './blood-pressure/index.js';
import { registerLifestyle } from './lifestyle/index.js';
import { registerMenstrual } from './menstrual/index.js';

// Phase 5: Optional Features
import { registerTrainingPlans } from './training-plans/index.js';
import { registerNutrition } from './nutrition/index.js';
import { registerExercises } from './exercises/index.js';

// Existing commands
import { registerAuth } from './auth/index.js';
import { registerProfile } from './profile/index.js';
import { registerSleep } from './sleep/index.js';
import { registerWellness } from './wellness/index.js';
import { registerActivities } from './activities/index.js';

/**
 * Registers all commands in the program.
 * Called from cli.ts after setting up global options.
 */
export function registerCommands(program: CliProgram): void {
  // Existing
  registerAuth(program);
  registerProfile(program);
  registerSleep(program);
  registerWellness(program);
  registerActivities(program);

  // Phase 1: Core Health
  registerWeight(program);
  registerHrv(program);
  registerMetrics(program);
  registerBiometric(program);

  // Phase 2: Training & Fitness
  registerDevices(program);
  registerWorkouts(program);
  registerFitness(program);

  // Phase 3: Social & Goals
  registerGoals(program);
  registerBadges(program);
  registerChallenges(program);
  registerGear(program);

  // Phase 4: Health Logging
  registerHydration(program);
  registerBloodPressure(program);
  registerLifestyle(program);
  registerMenstrual(program);

  // Phase 5: Optional Features
  registerTrainingPlans(program);
  registerNutrition(program);
  registerExercises(program);
}