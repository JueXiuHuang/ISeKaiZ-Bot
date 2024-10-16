const { delayer } = require('./helper');
const { retryCount } = require('./config.json');
const { logger } = require('./log');

const TaskRank = {
  Verify: 0,
  EmojiVerify: 1,
  Inventory: 2,
  Food: 2,
  Retainer: 2,
  NewBattleWindow: 4,
  NewBattle: 3,
  NewProfWindow: 4,
  NewProf: 3,
}

class Task {
  constructor(func, expireAt, info, priority=0) {
    this.func = func;
    this.expireAt = expireAt;
    this.info = info ?? '';
    this.retry = 0;
    this.priority = priority;
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
    this.gap = 3000; // can change in future, the unit is milliseconds
    this.bias = 4000;
    this.player = player;
    this.lock = false;
    Controller.instance = this;
  }

  addTask(task) {
    logger(`Try add task: ${task.info}`);
    this.queue.push(task);
  }

  async checkQueueAndExecute() {
    if (this.lock) return;
    this.lock = true;
    while (this.queue.length > 0) {
      this.queue = this.queue.sort((a, b) => a.priority - b.priority);
      const logFunc = () => {
        console.log('Task queue info:');
        this.queue.forEach(task => {
          console.log(`> ${task.info}`);
        });
      }
      logger(logFunc, true);

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

module.exports = { Task, Controller, TaskRank };