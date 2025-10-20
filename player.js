import fs from 'fs';
import { logger } from './log.js';

export const States = {
  Init: "init",
  Running: "running",
  Defeated: "defeated",
  Blocked: "blocked",
  Ban: "banned",
  Stopped: "stopped"
}

export class Player {
  state = States.Init;
  channel = null;
  battleMsg = null;
  profMsg = null;
  verifyImg = null;
  verifyEmojiMsg = null;
  sell = 0;
}

export function newPlayer() {
  let userData = loadUserData();
  return {
    'state': States.Init,
    'channel': null,
    'battleMsg': null,
    'profMsg': null,
    'verifyImg': null,
    'verifyEmojiMsg': null,
    'sell': 0,
    'userData': userData,
  };
}

export function saveUserData(data) {
  fs.writeFileSync('./user_data.json', JSON.stringify(data, null, 2));
}

export function loadUserData() {
  try {
    return JSON.parse(fs.readFileSync('./user_data.json', 'utf8'));
  } catch (err) {
    logger('User data not found, use default data');
    return {
      'last_eat_at': 0,
    };
  }
}
