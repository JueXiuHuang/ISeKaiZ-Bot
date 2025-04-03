const fs = require('fs');
const { logger } = require('./log');

const States = {
  Init: "init",
  Running: "running",
  Defeated: "defeated",
  Blocked: "blocked",
  Ban: "banned",
  Stopped: "stopped"
}

class Player {
  state = States.Init;
  channel = null;
  battleMsg = null;
  profMsg = null;
  verifyImg = null;
  verifyEmojiMsg = null;
  sell = 0;
}

function newPlayer() {
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

function saveUserData(data) {
  fs.writeFileSync('./user_data.json', JSON.stringify(data, null, 2));
}

function loadUserData() {
  try {
    return JSON.parse(fs.readFileSync('./user_data.json', 'utf8'));
  } catch (err) {
    logger('User data not found, use default data');
    return {
      'last_eat_at': 0,
    };
  }
}

module.exports = { Player, States, newPlayer, loadUserData, saveUserData };