import fs from 'fs';
import { logger } from './log.js';

export const States = {
  Init: "init",
  Running: "running",
  Defeated: "defeated",
  Blocked: "blocked",
  Ban: "banned",
  Stopped: "stopped"
};

export function newPlayer() {
  const userData = loadUserData();
  return {
    state: States.Stopped,
    channel: null,
    channelId: '', // Added for consistency
    username: '', // Added for checks
    battleMsg: null,
    profMsg: null,
    verifyImg: null,
    sell: 0,
    autoLevel: false,
    userData: userData,
    isStopped: function () {
      return [States.Ban, States.Defeated, States.Stopped].includes(this.state);
    }
  };
}

export function saveUserData(data) {
  try {
    fs.writeFileSync('./user_data.json', JSON.stringify(data, null, 2));
  } catch (err) {
    logger(`Error saving user data: ${err.message}`);
  }
}

export function loadUserData() {
  try {
    if (fs.existsSync('./user_data.json')) {
      const data = fs.readFileSync('./user_data.json', 'utf8');
      return JSON.parse(data);
    }
    throw new Error('File not found');
  } catch (err) {
    logger(`User data not found or invalid, creating default data. Reason: ${err.message}`);
    return { 'last_eat_at': 0, 'zone_index': 0 };
  }
}
