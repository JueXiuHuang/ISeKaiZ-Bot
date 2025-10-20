import { delayer } from './helper.js';
import { retryCount, taskGap, taskBias } from './config.js';
import { logger } from './log.js';

export class TaskSetting {
  constructor(rank, limit) {
    this.rank;
    this.limit;
  }
}

export const TaskType = {
  Verify: 'Verify',
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
  Cmd: 'Command',
};

export const TaskSettingList = {
  'Verify': new TaskSetting(-999, 999),
  'Command': new TaskSetting(-998, 999),
  'EmojiVerifyBattle': new TaskSetting(2, 1),
  'EmojiVerifyProfession': new TaskSetting(2, 1),
  'Treasure': new TaskSetting(1, 999),
  'Inventory': new TaskSetting(1, 2),
  'Food': new TaskSetting(1, 1),
  'Retainer': new TaskSetting(1, 3),
  'NewBattle': new TaskSetting(3, 1),
  'NewProfession': new TaskSetting(3, 1),
  'NewBattleWindow': new TaskSetting(4, 1),
  'NewProfessionWindow': new TaskSetting(4, 1),
};

export function getDefaultRank(tag) {
  return TaskSettingList[tag]?.rank ?? 5;
}

export function getTaskLimit(tag) {
  return TaskSettingList[tag]?.limit ?? 1;
}

export class Task {
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

export class TaskManager {
  constructor(onTaskComplete) {
    this.queue = [];
    this.taskTypeCounter = {};
    this.lastExecuteAt = 0;
    this.gap = taskGap;
    this.bias = taskBias;
    this.callback = onTaskComplete;
    this.lock = false;
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
        logger(`Task execute too fast, wait for ${delta} ms`);
        await delayer(delta, delta, '(Task Gap)');
      }
      await delayer(0, this.bias, '(Task Bias)');

      task.func().then(modified => {
        this.callback(modified);
      })
        .catch((err) => {
          logger(`fail reason: ${err}`);
          if (task.retry < retryCount) {
            task.retry += 1;
            this.addTask(task);
          }
        })
      const unlockTime = new Date()
      this.lastExecuteAt = unlockTime.getTime();
      logger('Task finish, unlock');
      break;
    }
    this.lock = false;
  }
}
