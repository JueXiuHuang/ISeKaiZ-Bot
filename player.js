const fs = require('fs');
const { logger } = require('./log');

const States = {
  Doing: "doing",
  Defeat: "defeat",
  Normal: "noraml",
  NeedVerify_Image: "need_verify_image",  // Verify: enter the image code
  Verifying_Image: "verifying_image",
  Ban: "banned"
}

class Player {
  // battle state
  bs = States.Normal;
  // profession state
  ps = States.Normal;
  // battle counter
  bc = 0;
  // profession counter
  pc = 0;
  channel = null;
  battleMsg = null;
  profMsg = null;
  verifyImg = null;
  verifyEmojiMsg = null;
  sell = 0;
}

function newPlayer() {
  userData = loadUserData();
  return {
    'bs': States.Normal,
    'ps': States.Normal,
    'channel': null,
    'battleMsg': null,
    'profMsg': null,
    'verifyImg': null,
    'sell': 0,
    'userData': userData,
    'bhash': '',
    'phash': '',
    'prevBhash': '',
    'prevPhash': '',
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