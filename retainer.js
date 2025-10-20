import { isVerify } from './helper.js';
import { logger } from './log.js';
import { handleError } from './error.js';
import { Task, TaskType, getDefaultRank } from './task manager.js';

export function retainerRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;
  if (isVerify(ctrl.player['state'])) return;

  const taskFunc = () => new Promise(resolve => {
    ctrl.player['channel']?.send('$hired');
    resolve({});
  })
  const expireAt = Date.now() + 120000;
  const tag = TaskType.Retainer;
  let rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, '$hired', tag, rank);
  ctrl.addTask(task);
}

export async function retainerHandler(ctrl, message, newData, oldData) {
  const regex = /Time elapsed: (\d) hours\sMaterials produced:/

  if (!regex.test(newData['desc'])) return;

  // retainer should stop at last page automatically
  // this is just prevent infinite loop
  const elapsed = newData['desc'].match(regex)?.[1] ?? '0';
  if (elapsed === '0') {
    const taskFunc = () => new Promise((resolve, reject) => {
      message.clickButton({ X: 1, Y: 0 })
        .then(() => {
          logger('Turn to next page success');
          resolve({});
        })
        .catch(err => {
          if (handleError(err, 'Turn to next page fail')) {
            resolve({});
          } else {
            reject(err);
          }
        })
    })
    const expireAt = Date.now() + 120000;
    const tag = TaskType.Retainer;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, '$hired Next Page', tag, rank);
    ctrl.addTask(task);

    return;
  }

  logger('Try to collect material');
  const taskFunc = () => new Promise((resolve, reject) => {
    message.clickButton({ X: 2, Y: 0 })
      .then(() => {
        logger('Harvest material success');
        resolve({});
      })
      .catch(err => {
        if (handleError(err, 'Collect retainer material fail')) {
          resolve({});
        } else {
          reject(err);
        }
      })
  })
  const expireAt = Date.now() + 120000;
  const tag = TaskType.Retainer;
  let rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, '$hired Collect', tag, rank);
  ctrl.addTask(task);
}
