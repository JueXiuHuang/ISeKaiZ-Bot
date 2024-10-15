const { delayer } = require('./helper');
const { retryCount } = require('./config.json');
const { getTimeString, logger } = require('./log');

class Task {
  constructor(func, expireAt, info) {
    this.func = func;
    this.expireAt = expireAt;
    this.info = info ?? '';
    this.retry = 0;
  }

  isExpire(timeNow) { return this.expireAt < timeNow; }
}

class Controller {
  constructor(player) {
    if (Controller.instance) {
      return Controller.instance;
    }

    this.queue = [];
    this.lastExecuteAt = 0;
    this.gap = 5000; // can change in future, the unit is milliseconds
    this.bias = 5000;
    this.player = player;
    this.lock = false;
    Controller.instance = this;
  }

  addTask(task) {
    logger('Add Task');
    this.queue.push(task);
  }

  async checkQueueAndExecute() {
    if (this.lock) return;
    this.lock = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      logger(`Checking task <${task.info}>`);
      const now = new Date;
      const timeNow = now.getTime();
      if (task.isExpire(timeNow)) {
        logger('Task fail due to expired');
        continue;
      }
      const expectExecuteTime = this.lastExecuteAt + this.gap
      if (task.isExpire(expectExecuteTime)) {
        logger('Task fail due to expect execute time expire');
        continue;
      }
      if (timeNow - this.lastExecuteAt < this.gap) {
        const delta = this.lastExecuteAt + this.gap - timeNow;
        logger(`Task execute too fast, wait for at least ${delta} ms`);
        await delayer(delta, delta + this.bias, '(Controller)');
        logger('Controller delay ends');
      }
      let modified;
      if (task.func.constructor.name === 'AsyncFunction') {
        modified = await task.func();
      } else {
        modified = task.func();
      }


      if (Object.keys(modified).length > 0 && task.retry < retryCount) {
        logger('Task failed, add to queue for retry');
        task.retry += 1;
        this.addTask(task);
      }
      for (const [key, value] of Object.entries(modified)) {
        logger(`${key} change to ${value}`);
        this.player[key] = value;
      }
      const unlockTime = new Date()
      this.lastExecuteAt = unlockTime.getTime();
      logger('Task finish, unlock');
      break;
    }
    this.lock = false;
  }
}

module.exports = { Task, Controller };