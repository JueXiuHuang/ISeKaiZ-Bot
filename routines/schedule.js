import { logger } from '../log.js';
import { retainerRoutine } from './retainer.js';
import { inventoryRoutine } from './inventory.js';
import { foodRoutine } from './food.js';

function oneHrRoutineScript(ctrl) {
  logger('Do 1-hour scheduling task');
  retainerRoutine(ctrl);
  inventoryRoutine(ctrl);
}

function threeHrFoodScript(ctrl) {
  logger('Do 3-hour scheduling task (Food)');
  foodRoutine(ctrl);
}

export function startRoutines(ctrl) {
  // Initial run
  oneHrRoutineScript(ctrl);
  threeHrFoodScript(ctrl);

  // Set intervals
  setInterval(() => oneHrRoutineScript(ctrl), 60 * 60 * 1000 + 20 * 1000);
  setInterval(() => threeHrFoodScript(ctrl), 3 * 60 * 60 * 1000 + 20 * 1000);
  logger('All routines started.');
}
