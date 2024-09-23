const { expFood = 'sushi-roll' } = require('./config.json');
const { Task } = require('./controller')

function foodRoutine(ctrl) {
  const taskFunc = () => {
    ctrl.player['channel']?.send('$eat ' + expFood);
    return {};
  };
  const expireAt = Date.now() + 10000;
  const task = new Task(taskFunc, expireAt, 'Eat food');
  ctrl.addTask(task);
}

module.exports = { foodRoutine };