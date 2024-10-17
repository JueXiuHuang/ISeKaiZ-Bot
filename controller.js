const { delayer } = require('./helper');
const { retryCount } = require('./config.json');
const { logger } = require('./log');

class TaskType {
  constructor(rank, limit) {
    this.rank = rank;
    this.limit = limit;
  }
}

const TaskTypes = {
  'Verify': new TaskType(rank=0, limit=999),
  'EmojiVerify': new TaskType(rank=2, limit=999),
  'Treasure': new TaskType(rank=1, limit=999),
  'Inventory': new TaskType(rank=1, limit=2),
  'Food': new TaskType(rank=1, limit=1),
  'Retainer': new TaskType(rank=1, limit=2),
  'NewBattle': new TaskType(rank=3, limit=1),
  'NewProf': new TaskType(rank=3, limit=1),
  'NewBattleWindow': new TaskType(rank=4, limit=1),
  'NewProfWindow': new TaskType(rank=4, limit=1),
};

class Task {
  constructor(func, expireAt, info, tag) {
    this.func = func;
    this.expireAt = expireAt;
    this.info = info ?? '';
    this.retry = 0;
    this.tag = tag;
  }

  isExpire(timeNow) { return this.expireAt < timeNow; }
}

class Controller {
  constructor(player) {
    if (Controller.instance) {
      return Controller.instance;
    }

    this.queue = [];
    this.taskTypeCounter = {};
    this.lastExecuteAt = 0;
    this.gap = 2000; // can change in future, the unit is milliseconds
    this.bias = 3000;
    this.player = player;
    this.lock = false;
    Controller.instance = this;
  }

  addTask(task) {
    logger(`Try add task: ${task.info}`);

    const count = this.taskTypeCounter[task.tag] ?? 0;
    if (count >= TaskTypes[task.tag].limit) {
      logger(`Add fail since task limit`);
      return;
    }
    this.queue.push(task);
    this.taskTypeCounter[task.tag] = count + 1;
    logger('Add task success');
  }

  async checkQueueAndExecute() {
    if (this.lock) return;
    this.lock = true;
    while (this.queue.length > 0) {
      this.queue = this.queue.sort((a, b) => TaskTypes[a.tag].rank - TaskTypes[b.tag].rank);
      const logFunc = () => {
        console.log('Task queue info:');
        this.queue.forEach(task => {
          console.log(`> ${task.info}`);
        });
      }
      logger(logFunc, true);

      const task = this.queue.shift();
      this.taskTypeCounter[task.tag] -= 1;
      logger(`Checking task <${task.info}>`);
      const now = new Date;
      const timeNow = now.getTime();
      if (task.isExpire(timeNow)) {
        logger('Task fail due to expired');
        continue;
      }
      const expectExecuteTime = this.lastExecuteAt + this.gap + this.bias/2
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


      if (Object.keys(modified).length > 0 && task.retry < retryCount && task.tag !== 'Food') {
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

module.exports = { Task, Controller, TaskTypes };