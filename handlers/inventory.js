import { sellEquip } from '../config.js';
import { Task, TaskType, getDefaultRank } from '../task manager.js';
import { gainItemHandler } from '../log.js';

export function handleInventory(ctrl, _, data, _2) {
  if (!data.title.includes('Equipment Sold')) {
    return false;
  }

  gainItemHandler(data);
  const goldGained = data.desc.replace(',', '').match(/You gained (\d+)/)?.[1] ?? '0';

  if (parseInt(goldGained.replace(/,/g, '')) < 10000) {
    ctrl.player.sell += 1;
  }

  if (ctrl.player.sell >= sellEquip.length) {
    return true; // Stop selling
  }

  const taskFunc = () => new Promise(resolve => {
    ctrl.player.channel?.send(`$sell equipment all ${sellEquip[ctrl.player.sell]}`);
    resolve({});
  });

  const task = new Task(taskFunc, Date.now() + 120000, 'Sell equipment (next tier)', TaskType.Inv, getDefaultRank(TaskType.Inv));
  ctrl.addTask(task);

  return true;
}
