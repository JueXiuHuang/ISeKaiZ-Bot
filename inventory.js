import { sellEquip } from './config.js';
import { Task, TaskType, getDefaultRank } from './task manager.js';
import { isVerify } from './helper.js';
import { gainItemHandler } from './log.js';

export async function inventoryRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;
  if (isVerify(ctrl.player['state'])) return;

  ctrl.player['sell'] = 0;
  const taskFunc = () => new Promise(resolve => {
    ctrl.player['channel']?.send(`$sell equipment all ${sellEquip[ctrl.player['sell']]}`);
    resolve({})
  })
  const expireAt = Date.now() + 120000;
  const tag = TaskType.Inv;
  let rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, 'Sell equipment', tag, rank);
  ctrl.addTask(task);
}

export function inventoryHandler(ctrl, data) {
  if (!data['title'].includes('Equipment Sold')) {
    return;
  }

  gainItemHandler(data);
  const re = /You gained (\d+) gold!/;
  let desc = data['desc'].replaceAll(',', '');
  const gold = desc.match(re)?.[1] ?? '0';
  if (gold.length < 5) {
    ctrl.player['sell'] += 1;
  }

  if (ctrl.player['sell'] >= sellEquip.length) return;
  const taskFunc = () => new Promise(resolve => {
    ctrl.player['channel']?.send(`$sell equipment all ${sellEquip[ctrl.player['sell']]}`);
    resolve({})
  })
  const expireAt = Date.now() + 120000;
  const tag = TaskType.Inv;
  let rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, 'Sell equipment', tag, rank);
  ctrl.addTask(task);
}
