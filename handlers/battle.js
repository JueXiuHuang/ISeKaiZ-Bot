import { Task, TaskType, getDefaultRank } from '../task manager.js';
import { handleError } from '../error.js';
import { logger, gainItemHandler } from '../log.js';
import { States } from '../player.js';

export function handleBattleMessage(ctrl, message, data) {
  if (data.title.includes('Current Floor:')) {
    logger('Open new battle window');
    ctrl.player.battleMsg = message;

    const taskFunc = () => new Promise((resolve, reject) => {
      ctrl.player.battleMsg.clickButton({ X: 0, Y: 0 })
        .then(() => resolve({}))
        .catch(err => {
          if (handleError(err, 'start new battle fail')) {
            resolve({});
          } else {
            reject(err);
          }
        });
    });

    const task = new Task(taskFunc, Date.now() + 30000, 'start new battle', TaskType.NB, getDefaultRank(TaskType.NB));
    ctrl.addTask(task, 'map');
    return true;
  }

  if (data.title.includes('You Defeated A')) {
    logger('Battle finish, refresh battle timer');
    ctrl.refreshTimerId('map');
    gainItemHandler(data);
    return true;
  }

  if (data.title.includes('BATTLE STARTED')) {
    logger('Battle start, refresh battle timer');
    ctrl.refreshTimerId('map');
    return true;
  }

  if (data.title.includes('Better Luck Next Time!')) {
    logger('You died, stopping the bot');
    ctrl.updateState(States.Defeated);
    return true;
  }

  if (data.content.includes('You are already in a battle')) {
    logger('Already in battle, attempting to leave...');
    const taskFunc = () => new Promise((resolve, reject) => {
      message.clickButton({ X: 0, Y: 0 })
        .then(() => resolve({}))
        .catch(err => {
          if (handleError(err, 'Leave battle got error')) {
            resolve({});
          } else {
            reject(err);
          }
        });
    });
    const task = new Task(taskFunc, Date.now() + 30000, 'leave battle', TaskType.NP, getDefaultRank(TaskType.NP));
    ctrl.addTask(task, 'map');
    return true;
  }

  return false;
}
