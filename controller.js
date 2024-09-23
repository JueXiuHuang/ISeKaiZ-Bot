const { delayer } = require('./helper');

class Task {
  constructor(func, expireAt, info) {
    this.func = func;
    this.expireAt = expireAt;
    this.info = info ?? '';
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
    this.gap = 0; // can change in future
    this.player = player;
    this.lock = false;
    Controller.instance = this;
  }

  addTask(task) {
    console.log('Add Task');
    this.queue.push(task);
  }

  async checkQueueAndExecute() {
    if (this.lock) return;
    this.lock = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      console.log('--------------------------------')
      console.log(`Checking task <${task.info}>`);
      const timeNow = Math.floor(Date.now() / 1000);
      if (task.isExpire(timeNow)) {
        console.log('Task fail due to expired');
        console.log('--------------------------------')
        continue;
      }
      const expectExecuteTime = this.lastExecuteAt + this.gap
      if (task.isExpire(expectExecuteTime)) {
        console.log('Task fail due to expect execute time expire');
        console.log('--------------------------------')
        continue;
      }
      if (timeNow - this.lastExecuteAt < this.gap) {
        const delta = this.lastExecuteAt + this.gap - timeNow;
        console.log(`Task execute too fast, wait for at least ${delta} second`);
        // await delayer(delta * 1000, delta * 1000 + 2000);
      }
      let modified;
      if (task.func.constructor.name === 'AsyncFunction') {
        modified = await task.func();
      } else {
        modified = task.func();
      }
      for (const [key, value] of Object.entries(modified)) {
        this.player[key] = value;
      }
      this.lastExecuteAt = Math.floor(Date.now() / 1000);
      console.log('Task finish, unlock');
      console.log('--------------------------------')
      break;
    }
    this.lock = false;
  }
}

module.exports = { Task, Controller };