const { profession, retryCount } = require('./config.json');
const { errorLogWrapper, logger } = require('./log');
const { Task } = require('./controller');
const { States } = require('./player')

// @param {Player} player
function professionRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;
  if (profession === 'none') return;

  if (ctrl.player['profMsg'] === null) {
    const taskFunc = () => {
      ctrl.player['channel']?.send('$' + profession);
      return {};
    };
    const expireAt = Date.now() + 10000;
    const task = new Task(taskFunc, expireAt, '$profession');
    ctrl.addTask(task);
    return;
  }

  if (ctrl.player['ps'] === States.Idle && ctrl.player['pc'] > retryCount) {
    const taskFunc = () => {
      ctrl.player['channel'].send('$' + profession);
      return { 'profMsg': null , 'pc': 0};
    };
    const expireAt = Date.now() + 10000;
    const task = new Task(taskFunc, expireAt, '$profession');
    ctrl.addTask(task);
    return;
  }

  if (ctrl.player['ps'] === States.Idle) {
    const taskFunc = () => {
      const modified = {};
      try {
        ctrl.player['profMsg'].clickButton({ X: 0, Y: 0 })
          .catch(err => {
            logFunc = () => {
              console.log('click profession button fail');
              console.log('Error message: ' + err.message);
              console.log(err);
            };
            errorLogWrapper(logFunc);
            logger(`Add profession counter, expected value: ${ctrl.player['pc'] + 1}`);
            modified['pc'] = ctrl.player['pc'] + 1;
          });
      } catch (err) {
        console.log(err);
        logger(`Add profession counter, expected value: ${ctrl.player['pc'] + 1}`);
        modified['pc'] = ctrl.player['pc'] + 1;
      }
      return modified;
    };
    const expireAt = Date.now() + 10000;
    const task = new Task(taskFunc, expireAt, 'start profession');
    ctrl.addTask(task);

    return;
  }

  if (ctrl.player['ps'] === States.Doing) {
    ctrl.player['pc'] += 1;
    if (ctrl.player['pc'] > retryCount) {
      logger('Profession might stuck, force finish...');
      ctrl.player['ps'] = States.Idle;
    }
    return;
  }
}

module.exports = { professionRoutine };