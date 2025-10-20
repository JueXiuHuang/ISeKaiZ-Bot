import { treasureHunter, treasureGuild } from './config.js';
import { Task, TaskType, getDefaultRank } from './task manager.js';
import { messageExtractor } from './helper.js';
import { handleError } from './error.js';

export function checkTreasure(ctrl, message) {
  if (treasureGuild === '' || !treasureHunter) return;
  if (message.guildId !== treasureGuild) return;
  let data = messageExtractor(message);

  if (data['title'].includes('Chest Spawned!')) {
    console.log('Try to get treasure')
    const taskFunc = () => new Promise((resolve, reject) => {
      message.clickButton({ X: 0, Y: 0 })
        .then(() => { resolve({}); })
        .catch(err => {
          if (handleError(err, 'Claim chest fail')) {
            resolve({});
          } else {
            reject(err);
          }
        })
    })
    const expireAt = Date.now() + 10000;
    const tag = TaskType.Treasure;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'collect treasure', tag, rank);
    ctrl.addTask(task);
  }
}
