const { retryCount } = require('./config.json');
const { States } = require('./player');
const { Task, TaskRank } = require('./controller');
const { errorLogWrapper, logger } = require('./log');

// @param {Player} player
function mappingRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;

  if (ctrl.player['battleMsg'] === null) {
    const taskFunc = () => {
      ctrl.player['channel']?.send('$map');
      return {};
    };
    const expireAt = Date.now() + 180000;
    const task = new Task(taskFunc, expireAt, '$map', 'NewBattleWindow');
    ctrl.addTask(task);
    return;
  }

  if (ctrl.player['bs'] === States.Idle && ctrl.player['bc'] > retryCount) {
    const taskFunc = () => {
      ctrl.player['channel']?.send('$map');
      return { 'battleMsg': null, 'bc': 0 };
    };
    const expireAt = Date.now() + 180000;
    const task = new Task(taskFunc, expireAt, '$map', 'NewBattleWindow');
    ctrl.addTask(task);
    return;
  }

  if (ctrl.player['bs'] === States.Idle) {
    const taskFunc = async () => {
      const modified = {};
      try {
        await ctrl.player['battleMsg'].clickButton({ X: 0, Y: 0 })
          .catch(err => {
            logFunc = () => {
              console.log('start new battle fail');
              console.log('Error message: ' + err.message);
              console.log(err);
            };
            errorLogWrapper(logFunc);
            logger('Inner Error');
            logger(`Add battle counter, expected value: ${ctrl.player['bc'] + 1}`)
            modified['bc'] = ctrl.player['bc'] + 1;
          });
      } catch (err) {
        console.log(err);
        logger('Outer error');
        logger(`Add battle counter, expected value: ${ctrl.player['bc'] + 1}`)
        modified['bc'] = ctrl.player['bc'] + 1;
      }

      return modified;
    };
    const expireAt = Date.now() + 30000;
    const task = new Task(taskFunc, expireAt, 'start new battle', 'NewBattle');
    ctrl.addTask(task);

    return;
  }

  if (ctrl.player['bs'] === States.InBattle) {
    ctrl.player['bc'] += 1;
    if (ctrl.player['bc'] > retryCount) {
      logger('Battle might stuck, force finish...');
      ctrl.player['bs'] = States.Idle;
    }
    return;
  }
}

module.exports = { mappingRoutine };