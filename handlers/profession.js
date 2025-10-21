import { Task, TaskType, getDefaultRank } from '../task manager.js';
import { handleError } from '../error.js';
import { logger, gainItemHandler } from '../log.js';

export function handleProfessionMessage(ctrl, message, data, eventType) {
  const isProfessionWindow = ['Mining', 'Fishing', 'Foraging'].includes(data.title);
  if (isProfessionWindow && eventType !== 'update') {
    logger('Open new profession window');
    ctrl.player.profMsg = message;

    const taskFunc = () => new Promise((resolve, reject) => {
      ctrl.player.profMsg.clickButton({ X: 0, Y: 0 })
        .then(() => resolve({}))
        .catch(err => {
          if (handleError(err, 'click profession button fail')) {
            resolve({});
          } else {
            reject(err);
          }
        });
    });
    const task = new Task(taskFunc, Date.now() + 30000, 'start profession', TaskType.NP, getDefaultRank(TaskType.NP));
    ctrl.addTask(task, 'prof');
    return true;
  }

  const professionDoneTitles = ['You caught a', 'Mining Complete!', 'You found a'];
  if (professionDoneTitles.some(title => data.title.includes(title))) {
    logger(`Profession finish (${data.title})`);
    ctrl.refreshTimerId('prof');
    gainItemHandler(data);
    return true;
  }

  const professionStartTitles = ['You started mining!', 'You cast your rod!', 'You start foraging!'];
  if (professionStartTitles.includes(data.title)) {
    logger(`Profession start (${data.title})`);
    ctrl.refreshTimerId('prof');
    return true;
  }

  const alreadyRegex = /You are already mining|foraging|fishing/;
  if (alreadyRegex.test(data.content)) {
    logger('Already in profession, attempting to leave...');
    const taskFunc = () => new Promise((resolve, reject) => {
      message.clickButton({ X: 0, Y: 0 })
        .then(() => resolve({}))
        .catch(err => {
          if (handleError(err, 'Leave profession got error')) {
            resolve({});
          } else {
            reject(err);
          }
        });
    });
    const task = new Task(taskFunc, Date.now() + 30000, 'leave profession', TaskType.NP, getDefaultRank(TaskType.NP));
    ctrl.addTask(task, 'prof');
    return true;
  }

  return false;
}
