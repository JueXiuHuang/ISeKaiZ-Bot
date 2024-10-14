const fs = require('fs');

const States = {
  InBattle: "in_battle",
  Doing: "doing",
  Defeat: "defeat",
  Idle: "idle",
  NeedVerify_Image: "need_verify_image",  // Verify: enter the image code
  Verifying_Image: "verifying_image",
  Ban: "banned"
  // NeedVerify_Emoji: "need_verify_emoji"  // Verify: choose the correct emoji
}

class Player {
  // battle state
  bs = States.Idle;
  // profession state
  ps = States.Idle;
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
    'bs': States.Idle,
    'ps': States.Idle,
    'bc': 0,
    'pc': 0,
    'channel': null,
    'battleMsg': null,
    'profMsg': null,
    'verifyImg': null,
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
    console.error('Error reading user_data.json:', err);
    return {
      'last_eat_at': 0,
    };
  }
}

module.exports = { Player, States, newPlayer, loadUserData, saveUserData };