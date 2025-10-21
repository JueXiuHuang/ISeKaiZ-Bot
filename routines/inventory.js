import { sellEquip } from '../config.js';
import { Task, TaskType, getDefaultRank } from '../task manager.js';
import { isVerify } from '../helper.js';

export async function inventoryRoutine(ctrl) {
  if (ctrl.player.channel === null) return;
  if (isVerify(ctrl.player.state)) return;

  ctrl.player.sell = 0;
  const taskFunc = () => new Promise(resolve => {
    ctrl.player.channel?.send(`$sell equipment all ${sellEquip[ctrl.player.sell]}`);
    resolve({});
  });

  const expireAt = Date.now() + 120000;
  const tag = TaskType.Inv;
  const rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, 'Sell equipment', tag, rank);
  ctrl.addTask(task);
}
