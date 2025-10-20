import EventEmitter from 'events';
import { States } from './player.js';

export class BotEventManager {
  constructor(addTask, onInit, onDefeated, onBlocked, onBan, onRunning, onStopped) {
    this.emitter = new EventEmitter();
    this.callback = addTask;

    this.emitter.on(States.Init, onInit);
    this.emitter.on(States.Defeated, onDefeated);
    this.emitter.on(States.Blocked, onBlocked);
    this.emitter.on(States.Ban, onBan);
    this.emitter.on(States.Running, onRunning);
    this.emitter.on(States.Stopped, onStopped);
  }

  emit(eventName) {
    this.emitter.emit(eventName);
  }
}
