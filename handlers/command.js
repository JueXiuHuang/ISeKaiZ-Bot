import { logger } from '../log.js';
import { States } from '../player.js';

export function handleCommand(ctrl, message, data) {
  if (data.content === '!start') {
    logger('>>>BOT START<<<');
    ctrl.player.channel = message.channel;
    ctrl.updateState(States.Init);
    return true;
  }

  if (data.content === '!stop') {
    logger('>>>BOT STOP<<<');
    ctrl.updateState(States.Stopped);
    return true;
  }

  if (data.content === '!autolevel') {
    ctrl.player.autoLevel = !ctrl.player.autoLevel;
    const status = ctrl.player.autoLevel ? 'ON' : 'OFF';
    logger(`Auto level is now ${status}`);
    message.reply(`Auto level is now ${status}`);
    return true;
  }

  return false;
}
