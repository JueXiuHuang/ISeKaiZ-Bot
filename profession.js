const { profession, retryCount } = require('./config.json');
const { logger } = require('./log');
const { Task, TaskType, getDefaultRank } = require('./task manager');
const { States } = require('./player')
const { makeHash } = require('./helper')

// @param {Player} player
function professionRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;
  if (profession === 'none') return;

  if (ctrl.player['profMsg'] === null || ctrl.player['bs'] === States.Sus) {
    const taskFunc = () => new Promise(resolve => {
      ctrl.player['channel']?.send('$' + profession);
      resolve({})
    })
    const expireAt = Date.now() + 180000;
    const tag = TaskType.NPW;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, '$profession since null msg', tag, rank);
    ctrl.addTask(task);
    ctrl.player['bhash'] = makeHash();
    return;
  }

  if (ctrl.player['phash'] === ctrl.player['prevPhash']) {
    if (ctrl.player['ps'] === States.Ban) return;

    logger(`Profession hash duplicate: ${ctrl.player['phash']}`);
    const taskFunc = () => new Promise(resolve => {
      ctrl.player['channel']?.send('$' + profession);
      resolve({ 'profMsg': null, 'ps': States.Normal })
    })
    const expireAt = Date.now() + 180000;
    const tag = TaskType.NPW;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, '$profession', tag, rank);
    ctrl.addTask(task);
    return;
  }

  ctrl.player['prevPhash'] = ctrl.player['phash'];
}

module.exports = { professionRoutine };