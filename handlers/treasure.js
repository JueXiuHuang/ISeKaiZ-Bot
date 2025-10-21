import { treasureHunter, treasureGuild } from '../config.js';
import { Task, TaskType, getDefaultRank } from '../task manager.js';
import { handleError } from '../error.js';

export function handleTreasure(ctrl, message, data) {
  if (!treasureHunter || message.guildId !== treasureGuild) {
    return false;
  }

  if (data.title.includes('Chest Spawned!')) {
    console.log('Treasure chest spawned! Attempting to claim.');
    const taskFunc = () => new Promise((resolve, reject) => {
      message.clickButton({ X: 0, Y: 0 })
        .then(() => resolve({}))
        .catch(err => {
          if (handleError(err, 'Claim chest fail')) {
            resolve({});
          } else {
            reject(err);
          }
        });
    });
    const task = new Task(taskFunc, Date.now() + 10000, 'collect treasure', TaskType.Treasure, getDefaultRank(TaskType.Treasure));
    ctrl.addTask(task);
    return true;
  }

  return false;
}
