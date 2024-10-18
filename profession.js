const { profession, retryCount } = require('./config.json');
const { errorLogWrapper, logger } = require('./log');
const { Task, TaskType, getDefaultRank } = require('./controller');
const { States } = require('./player')

// @param {Player} player
function professionRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;
  if (profession === 'none') return;

  if (ctrl.player['profMsg'] === null) {
    const taskFunc = () => {
      ctrl.player['channel']?.send('$' + profession);
      return [{}, true];
    };
    const expireAt = Date.now() + 180000;
    const tag = TaskType.NPW;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, '$profession', tag, rank);
    ctrl.addTask(task);
    return;
  }

  if (ctrl.player['phash'] === ctrl.player['prevPhash']) {
    if (ctrl.player['ps'] === States.Ban) return;

    logger(`Profession hash duplicate: ${ctrl.player['phash']}`);
    const taskFunc = () => {
      ctrl.player['channel'].send('$' + profession);
      return [{ 'profMsg': null, 'ps': States.Idle }, true];
    };
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