const { expFood = 'sushi-roll' } = require('./config.json');
const { Task } = require('./controller');
const { saveUserData } = require('./player');
const { logger, formatTimeString } = require('./log');


function foodRoutine(ctrl) {
  const lastEatAt = ctrl.player['userData']['last_eat_at'] ?? 0;
  const now = new Date()
  if (now.getTime() - lastEatAt < 1000 * 60 * 60 * 3) {
    dateString = formatTimeString(now);
    logger(`Last eat at ${dateString}, skip...`);
    return;
  }
  const taskFunc = () => {
    ctrl.player['channel']?.send('$eat ' + expFood);
    ctrl.player['userData']['last_eat_at'] = now;
    saveUserData(ctrl.player['userData']);
    return {'userData': ctrl.player['userData']};
  };
  const expireAt = Date.now() + 10000;
  const task = new Task(taskFunc, expireAt, 'Eat food');
  ctrl.addTask(task);
}

module.exports = { foodRoutine };