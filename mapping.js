import { States } from './player.js';
import { Task, TaskType, getDefaultRank } from './task manager.js';
import { logger } from './log.js';
import { makeHash } from './helper.js';

// @param {Player} player
export function mappingRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;

  if (ctrl.player['battleMsg'] === null || ctrl.player['bs'] === States.Sus) {
    const taskFunc = () => new Promise(resolve => {
      ctrl.player['channel']?.send('$map');
      resolve({});
    })
    const expireAt = Date.now() + 180000;
    const tag = TaskType.NBW;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, '$map since null msg', tag, rank);
    ctrl.addTask(task);
    ctrl.player['bhash'] = makeHash();
    return;
  }

  if (ctrl.player['bhash'] === ctrl.player['prevBhash']) {
    if (ctrl.player['bs'] === States.Ban) return;
    if (ctrl.player['bs'] === States.Defeat) return;

    logger(`Battle hash duplicate: ${ctrl.player['bhash']}`)
    const taskFunc = () => new Promise(resolve => {
      ctrl.player['channel']?.send('$map');
      resolve({ 'battleMsg': null })
    })
    const expireAt = Date.now() + 180000;
    const tag = TaskType.NBW;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, '$map', tag, rank);
    ctrl.addTask(task);
    return;
  }

  ctrl.player['prevBhash'] = ctrl.player['bhash'];
}
