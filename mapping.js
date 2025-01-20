const { retryCount } = require('./config.json');
const { States } = require('./player');
const { Task, TaskType, getDefaultRank } = require('./controller');
const { logger } = require('./log');

// @param {Player} player
function mappingRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;

  if (ctrl.player['battleMsg'] === null) {
    const taskFunc = () => new Promise(resolve => {
      ctrl.player['channel']?.send('$map');
      resolve({});
    })
    const expireAt = Date.now() + 180000;
    const tag = TaskType.NBW;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, '$map since null msg', tag, rank);
    ctrl.addTask(task);
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

module.exports = { mappingRoutine };