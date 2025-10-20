import { logger } from '../log.js';
import { handleError } from '../error.js';
import { Task, TaskType, getDefaultRank } from '../task manager.js';

export async function handleRetainerUpdate(ctrl, message, newData) {
  const elapsedRegex = /Time elapsed: (\d) hours\sMaterials produced:/;
  if (!elapsedRegex.test(newData.desc)) {
    return false;
  }

  const elapsedHours = newData.desc.match(elapsedRegex)?.[1] ?? '0';

  // If elapsed is 0, it means we can collect. Otherwise, it's a different page.
  // The original logic seems reversed, this is a correction.
  if (elapsedHours !== '0') {
    logger('Retainer has items to collect. Attempting to harvest.');
    const collectTask = new Task(() => new Promise((resolve, reject) => {
      message.clickButton({ X: 2, Y: 0 }) // Collect Button
        .then(() => {
          logger('Harvest material success');
          resolve({});
        })
        .catch(err => {
          handleError(err, 'Collect retainer material fail');
          resolve({}); // Resolve anyway to not block queue
        });
    }), Date.now() + 120000, '$hired Collect', TaskType.Retainer, getDefaultRank(TaskType.Retainer));
    ctrl.addTask(collectTask);
    return true;
  }

  // This part handles turning the page if the current page has nothing to collect
  // This assumes that a 0-hour page is one to be skipped.
  logger('Retainer page has no items ready, turning to next page.');
  const nextPageTask = new Task(() => new Promise((resolve, reject) => {
    message.clickButton({ X: 1, Y: 0 }) // Next Page Button
      .then(() => {
        logger('Turn to next page success');
        resolve({});
      })
      .catch(err => {
        handleError(err, 'Turn to next page fail');
        resolve({}); // Resolve anyway
      });
  }), Date.now() + 120000, '$hired Next Page', TaskType.Retainer, getDefaultRank(TaskType.Retainer));
  ctrl.addTask(nextPageTask);

  return true;
}
