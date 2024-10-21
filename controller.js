const { delayer } = require('./helper');
const { retryCount, taskGap = 2000, taskBias = 3000 } = require('./config.json');
const { logger } = require('./log');

class TaskSetting {
  constructor(rank, limit) {
    this.rank = rank;
    this.limit = limit;
  }
}

const TaskType = {
  Verfiy: 'Verify',
  EVB: 'EmojiVerifyBattle',
  EVP: 'EmojiVerifyProfession',
  Treasure: 'Treasure',
  Inv: 'Inventory',
  Food: 'Food',
  Retainer: 'Retainer',
  NB: 'NewBattle',
  NBW: 'NewBattleWindow',
  NP: 'NewProfession',
  NPW: 'NewProfessionWindow',
};

const TaskSettingList = {
  'Verify': new TaskSetting(rank = -999, limit = 999),
  'EmojiVerifyBattle': new TaskSetting(rank = 2, limit = 1),
  'EmojiVerifyProfession': new TaskSetting(rank = 2, limit = 1),
  'Treasure': new TaskSetting(rank = 1, limit = 999),
  'Inventory': new TaskSetting(rank = 1, limit = 2),
  'Food': new TaskSetting(rank = 1, limit = 1),
  'Retainer': new TaskSetting(rank = 1, limit = 2),
  'NewBattle': new TaskSetting(rank = 3, limit = 1),
  'NewProfession': new TaskSetting(rank = 3, limit = 1),
  'NewBattleWindow': new TaskSetting(rank = 4, limit = 1),
  'NewProfessionWindow': new TaskSetting(rank = 4, limit = 1),
};

function getDefaultRank(tag) {
  return TaskSettingList[tag]?.rank ?? 5;
}

function getTaskLimit(tag) {
  return TaskSettingList[tag]?.limit ?? 1;
}

class Task {
  constructor(func, expireAt, info, tag, rank) {
    this.func = func;
    this.expireAt = expireAt;
    this.info = info ?? '';
    this.retry = 0;
    this.tag = tag;
    this.rank = rank;
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
    this.gap = taskGap;
    this.bias = taskBias;
    this.player = player;
    this.lock = false;
    Controller.instance = this;
  }

  addTask(task) {
    logger(`Try add task: <${task.info}>`);

    const count = this.taskTypeCounter[task.tag] ?? 0;
    if (count >= getTaskLimit(task.tag)) {
      logger(`Add fail since task limit`);
      return;
    }
    this.queue.push(task);
    this.taskTypeCounter[task.tag] = count + 1;
    logger('Add task success');
  }

  priorityAging() {
    this.queue.forEach((task) => {
      task.rank -= 1;
    });
  }

  async checkQueueAndExecute() {
    if (this.lock) return;
    this.lock = true;
    while (this.queue.length > 0) {
      this.queue = this.queue.sort((a, b) => a.rank - b.rank);
      const logFunc = () => {
        console.log('Task queue info:');
        this.queue.forEach(task => {
          console.log(`> ${String(task.rank).padStart(2, ' ')} - ${task.info}`);
        });
      }
      logger(logFunc, true);

      this.priorityAging();

      const task = this.queue.shift();
      this.taskTypeCounter[task.tag] -= 1;
      logger(`Checking task <${task.info}>`);
      const now = new Date;
      const timeNow = now.getTime();
      if (task.isExpire(timeNow)) {
        logger('Task fail due to expired');
        continue;
      }
      const expectExecuteTime = this.lastExecuteAt + this.gap + this.bias / 2
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
      let success;
      if (task.func.constructor.name === 'AsyncFunction') {
        [modified, success] = await task.func();
      } else {
        [modified, success] = task.func();
      }

      if (!success && task.retry < retryCount) {
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

module.exports = { Task, Controller, TaskType, getDefaultRank };