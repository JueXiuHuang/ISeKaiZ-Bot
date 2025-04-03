const EventEmitter = require('events');
const { States } = require('./player');

class BotEventManager {
  constructor(addTask, onInit, onDefeated, onBlocked, onBan, onRunning) {
    this.emitter = new EventEmitter();
    this.callback = addTask;

    this.emitter.on(States.Init, onInit)
    this.emitter.on(States.Defeated, onDefeated)
    this.emitter.on(States.Blocked, onBlocked)
    this.emitter.on(States.Ban, onBan)
    this.emitter.on(States.Running, onRunning)
  }

  emit(eventName) {
    this.emitter.emit(eventName);
  }
}

module.exports = { BotEventManager };