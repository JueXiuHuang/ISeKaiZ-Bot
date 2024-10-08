const { retryCount } = require('./config.json');
const { States } = require('./player');
const { Task } = require('./controller');
const { errorLogWrapper } = require('./helper');

// @param {Player} player
function mappingRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;

  if (ctrl.player['battleMsg'] === null) {
    const taskFunc = () => {
      ctrl.player['channel']?.send('$map');
      return {};
    };
    const expireAt = Date.now() + 10000;
    const task = new Task(taskFunc, expireAt, '$map');
    ctrl.addTask(task);
    return;
  }

  if (ctrl.player['bs'] === States.Idle && ctrl.player['bc'] > retryCount) {
    const taskFunc = () => {
      ctrl.player['channel']?.send('$map');
      return { 'battleMsg': null };
    };
    const expireAt = Date.now() + 10000;
    const task = new Task(taskFunc, expireAt, '$map');
    ctrl.addTask(task);
    return;
  }

  if (ctrl.player['bs'] === States.Idle) {
    const taskFunc = () => {
      const modified = {};
      try {
        ctrl.player['battleMsg'].clickButton({ X: 0, Y: 0 })
          .catch(err => {
            logFunc = () => {
              console.log('click battle button fail');
              console.log('Error message: ' + err.message);
              console.log(err);
            };
            errorLogWrapper(logFunc);
            console.log(`Add battle counter, expected value: ${ctrl.player['bc'] + 1}`);
            modified['bc'] = ctrl.player['bc'] + 1;
          });
      } catch (err) {
        console.log(err);
        console.log(`Add battle counter, expected value: ${ctrl.player['bc'] + 1}`);
        modified['bc'] = ctrl.player['bc'] + 1;
      }

      return modified;
    };
    const expireAt = Date.now() + 10000;
    const task = new Task(taskFunc, expireAt, 'start new battle');
    ctrl.addTask(task);

    return;
  }

  if (ctrl.player['bs'] === States.InBattle) {
    ctrl.player['bc'] += 1;
    if (ctrl.player['bc'] > retryCount) {
      console.log('Battle might stuck, force finish...');
      ctrl.player['bs'] = States.Idle;
    }
    return;
  }
}

module.exports = { mappingRoutine };