const { Task, TaskManager, TaskType, getDefaultRank } = require('./task manager');
const { BotEventManager } = require('./event manager');
const { States } = require('./player')
const { profession } = require('./config.json');

class Controller {
  constructor(player) {
    this.player = player;
    this.taskManager = new TaskManager(this.taskCompleteCallback.bind(this));
    this.botEventManager = new BotEventManager(
      this.addTask.bind(this),
      this.onInit.bind(this),
      this.onDefeat.bind(this),
      this.onBlocked.bind(this),
      this.onBan.bind(this),
      this.onRunning.bind(this),
    );
    this.currentState = '';
    this.timerIds = new Map();
  }

  destroy() {
    this.timerIds.forEach(timer => clearTimeout(timer));
    this.timerIds.clear();
  }

  taskCompleteCallback(modified) {
    const newState = modified.state;
    if (newState && newState !== this.currentState) {
      this.currentState = newState;
      this.botEventManager.emit(newState);
    }
  }

  start() {
    setInterval(() => this.taskManager.checkQueueAndExecute(), 1000);
  }

  addTask(task, timerkey) {
    this.taskManager.addTask(task);

    this.addTimerFromKey(timerkey)
  }

  addTimerFromKey(key) {
    this.cancelTimerId(key);
    if (key === 'map') {
      this.timerIds.set(key, setTimeout(() => this.mapRecursion(), 60000));
    }

    if (key === 'prof') {
      this.timerIds.set(key, setTimeout(() => this.profRecursion(), 60000));
    }

    if (key === 'verify') {
      this.timerIds.set(key, setTimeout(() => this.verifyRecursion(), 60000));
    }
  }

  updateState(newState) {
    if (this.currentState !== newState) {
      this.player.state = newState;
      this.currentState = newState;
      this.botEventManager.emit(newState);
    }
  }

  _createRepeatingTask(command, taskType) {
    const taskFunc = () => new Promise(resolve => {
      this.player['channel']?.send(command);
      resolve({});
    })

    return new Task(
      taskFunc,
      Date.now() + 180000,
      command,
      taskType,
      getDefaultRank(taskType)
    );
  }

  cancelTimerId(key) {
    if (!this.timerIds.has(key)) return

    clearTimeout(this.timerIds.get(key));
    this.timerIds.delete(key)
  }

  refreshTimerId(key) {
    if (this.timerIds.has(key)) {
      clearTimeout(this.timerIds.get(key));
      this.timerIds.delete(key);
    }

    this.addTimerFromKey(key);
  }

  mapRecursion() {
    this.cancelTimerId('map');
    this.addTask(this._createRepeatingTask('$map', TaskType.NBW));
    this.timerIds.set('map', setTimeout(() => this.mapRecursion(), 60000));
  }

  profRecursion() {
    this.cancelTimerId('prof');
    this.addTask(this._createRepeatingTask('$' + profession, TaskType.NPW));
    this.timerIds.set('prof', setTimeout(() => this.profRecursion(), 60000));
  }

  verifyRecursion() {
    this.cancelTimerId('verify')
    this.addTask(this._createRepeatingTask('$verify', TaskType.Verify));
    this.timerIds.set('verify', setTimeout(() => this.verifyRecursion(), 60000));
  }

  onInit() {
    this.updateState(States.Running);

    this.mapRecursion();
    if (profession === 'none') return;
    this.profRecursion();
  }

  onDefeat() {
    this.player['channel'] = null;
    this.player['battleMsg'] = null;
    this.player['profMsg'] = null;
  }

  onBlocked() {
    this.verifyRecursion();
  }

  onRunning() { }

  onBan() {
    this.player['channel'] = null;
    this.player['battleMsg'] = null;
    this.player['profMsg'] = null;
  }
}

module.exports = { Controller };