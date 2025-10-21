import { Task, TaskType, getDefaultRank } from '../task manager.js';
import { handleError } from '../error.js';
import { logger } from '../log.js';
import { saveUserData, States } from '../player.js';
import { battleZones } from '../config.js';

export function handleAutoLevel(ctrl, _, data, _2) {
  if (!ctrl.player.autoLevel) {
    return false;
  }

  if (data.title.includes('You Defeated A')) {
    const taskFunc = () => new Promise((resolve, reject) => {
      ctrl.player.battleMsg.clickButton({ X: 3, Y: 0 })
        .then(() => resolve({}))
        .catch(err => {
          if (handleError(err, 'next monster fail')) {
            resolve({});
          } else {
            reject(err);
          }
        });
    });

    const task = new Task(taskFunc, Date.now() + 30000, 'next monster', TaskType.Cmd, getDefaultRank(TaskType.Cmd));
    ctrl.addTask(task, 'map');
    return true;
  }

  if (data.content.includes('You are already at the final location of this area.')) {
    logger('Final location reached, changing area...');
    ctrl.player.userData.zone_index++;
    if (ctrl.player.userData.zone_index >= battleZones.length) {
      logger('All zones cleared, stopping bot.');
      ctrl.updateState(States.Stopped);
      return true;
    }
    saveUserData(ctrl.player.userData);

    const nextZone = battleZones[ctrl.player.userData.zone_index];
    const taskFunc = () => new Promise((resolve, reject) => {
      ctrl.player.battleMsg.selectMenu(2, [nextZone])
        .then(() => {
          logger(`Changed area to: ${nextZone} # ${ctrl.player.userData.zone_index}`);
        })
        .then(() => resolve({}))
        .catch(err => {
          if (handleError(err, `change zone to ${nextZone} fail`)) {
            resolve({});
          } else {
            reject(err);
          }
        });
    });

    const task = new Task(taskFunc, Date.now() + 30000, 'change battle zone', TaskType.Cmd, getDefaultRank(TaskType.Cmd));
    ctrl.addTask(task, 'map');
    return true;
  }

  return false;
}
