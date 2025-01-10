const { Client } = require('discord.js-selfbot-v13');
const { token, channelId, checkDelay = 60000, captchaModel } = require('./config.json');
const CaptchaAI = require('./captcha').CaptchaAI;
const { Player, States, newPlayer } = require('./player');
const { professionRoutine } = require('./profession');
const { mappingRoutine } = require('./mapping');
const { checkTreasure } = require('./treasure');
const { retainerRoutine, retainerHandler } = require('./retainer');
const { foodRoutine } = require('./food');
const { inventoryRoutine, inventoryHandler } = require('./inventory')
const { Task, Controller, TaskType, getDefaultRank } = require('./controller')
const { messageExtractor } = require('./helper');
const { logger } = require('./log');
const { handleError } = require('./error');
const { emojiVerifier } = require('./verifier');
const args = process.argv.slice(2);

const client = new Client();

let captchaAI;
const initCaptchaAI = async function () {
  captchaAI = await new CaptchaAI(captchaModel);
};

const player = newPlayer()
const ctrl = new Controller(player)

async function ImmediatelyRoutineScript() {
  if (ctrl.player['bs'] === States.NeedVerify_Image || ctrl.player['ps'] === States.NeedVerify_Image) {
    logger('Try to solve verify image');
    const taskFunc = () => {
      ctrl.player['channel']?.send('$verify');
      return [{}, true];
    };
    const expireAt = Date.now() + 60000;
    const tag = TaskType.Verfiy;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'type $verify', tag, rank);
    ctrl.addTask(task);
    return;
  }

  if (ctrl.player['bs'] === States.Verifying_Image || ctrl.player['ps'] === States.Verifying_Image) {
    const taskFunc = async () => {
      const result = await captchaAI.predict(ctrl.player['verifyImg'].url);
      logger(`Verify Image Result: ${result}`)
      ctrl.player['channel']?.send(result);
      return [{}, true];
    };
    const expireAt = Date.now() + 60000;
    const tag = TaskType.Verfiy;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'send verify result', tag, rank);
    ctrl.addTask(task);
    return;
  }
}

async function checkRoutineScript() {
  logger(`BS: ${ctrl.player['bs']} | PS: ${ctrl.player['ps']}`);

  if ([States.NeedVerify_Image, States.Verifying_Image].includes(ctrl.player['bs'])) {
    logger('[Battle] Encounter verify states')
  } else {
    mappingRoutine(ctrl);
  }

  if ([States.NeedVerify_Image, States.Verifying_Image].includes(ctrl.player['ps'])) {
    logger('[Profession] Encounter verify states or already auto started');
  } else {
    professionRoutine(ctrl);
  }
}

async function oneHrRoutineScript() {
  logger('Do scheduling task');
  retainerRoutine(ctrl);
  inventoryRoutine(ctrl);
}

async function threeHrFoodScript() {
  logger('Try to eat exp food');
  foodRoutine(ctrl);
}

setInterval(ctrl.checkQueueAndExecute.bind(ctrl), 200);
setInterval(checkRoutineScript, checkDelay);
setInterval(oneHrRoutineScript, 1 * 60 * 60 * 1000 + 30 * 1000);
setInterval(threeHrFoodScript, 3 * 60 * 60 * 1000);

client.on('ready', async () => {
  let welcomeMsg = `

 _       __     __                        
 | |     / /__  / /________  ____ ___  ___ 
 | | /| / / _ \\/ / ___/ __ \\/ __ \`__ \\/ _ \\
 | |/ |/ /  __/ / /__/ /_/ / / / / / /  __/
 |__/|__/\\___/_/\\___/\\____/_/ /_/ /_/\\___/ 

 `
  console.log(welcomeMsg);
  logger(`Login as ${client.user.username}`);
  if (args.includes('--auto-start')) {
    logger('bot auto-start activate');
    let cacheChannel = client.channels.cache.get(channelId);
    cacheChannel.send('!!BOT auto-start activate!!');
    cacheChannel.send('!start');
    ctrl.player['channel'] = cacheChannel;
    retainerRoutine(ctrl);
    foodRoutine(ctrl);
  }
})

client.on('messageCreate', async (message) => {
  checkTreasure(ctrl, message);
  if (message.channelId != channelId) return;
  if (message.author.username != 'Isekaid' && message.author.username != client.user.username) return;

  let [title, desc, mention, content] = messageExtractor(message);

  if (content === '!start') {
    ctrl.player['channel'] = message.channel;
    ctrl.player['bs'] = States.Idle;
    ctrl.player['ps'] = States.Idle;
    logger('>>>BOT start<<<');
    return;
  }

  if (content === '!stop') {
    ctrl.player['channel'] = null;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    ctrl.player['bs'] = States.Idle;
    ctrl.player['ps'] = States.Idle;
    logger('>>>BOT stop<<<');
    return;
  }

  if (desc === 'You don\'t have enough energy to battle!') {
    logger('>>>BOT stop due to no energy<<<');
    ctrl.player['channel'] = null;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    ctrl.player['bs'] = States.Idle;
    ctrl.player['ps'] = States.Idle;
    return;
  }

  if (title === 'Suspended') {
    logger('>>>YOU GOT BANNED<<<');
    ctrl.player['channel'] = null;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    ctrl.player['bs'] = States.Ban;
    ctrl.player['ps'] = States.Ban;
    return;
  }

  if (desc.includes('Choose the correct option...')) {
    emojiVerifier(ctrl, message);
    return;
  }

  if (content.includes('Time ran out!')) {
    ctrl.player['ps'] = States.Idle;
    ctrl.player['bs'] = States.Idle;
    return;
  }

  if (verifyHandler(message, desc, mention, client.user.username)) {
    ImmediatelyRoutineScript();
    return;
  }
  retainerHandler(ctrl, message, desc);
  mapHandler(ctrl, message, title, content);
  professionHandler(ctrl, 'create', message, title, desc, content);
  inventoryHandler(ctrl, title, desc);
})

function verifyHandler(message, description, mention, user) {
  if (description.includes('Please complete the captcha')) {
    if (mention != user) return;
    logger('>>>BOT stop due to verify<<<');
    ctrl.player['bs'] = States.NeedVerify_Image;
    ctrl.player['ps'] = States.NeedVerify_Image;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    return true;
  }

  if (description.includes('Please Try doing $verify again.')) {
    logger('You need to solve captcha again...');
    ctrl.player['bs'] = States.NeedVerify_Image;
    ctrl.player['ps'] = States.NeedVerify_Image;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    return true;
  }

  if (description.includes('Please enter the captcha code from the image to verify.')) {
    logger('>>>BOT stop due to verify image code<<<');
    ctrl.player['bs'] = States.Verifying_Image;
    ctrl.player['ps'] = States.Verifying_Image;
    ctrl.player['verifyImg'] = message.embeds[0].image;
    return true;
  }

  if (description.includes('Successfully Verified.')) {
    logger('>>>BOT start due to verify finished<<<');
    ctrl.player['bs'] = States.Idle;
    ctrl.player['ps'] = States.Idle;
    ctrl.player['channel'] = message.channel;
    return false;
  }
}

function mapHandler(ctrl, message, title, content) {
  if (title.includes('Current Location:')) {
    logFn = () => {
      console.log('Open new battle window');
      console.log('Reset battle counter');
    }
    logger(logFn, seperator = true);
    ctrl.player['bs'] = States.Idle;
    ctrl.player['battleMsg'] = message;

    const taskFunc = async () => {
      const modified = {};
      let success = true;
      try {
        await ctrl.player['battleMsg'].clickButton({ X: 0, Y: 0 })
          .catch(err => {
            success = handleError(err, 'start new battle fail');
          });
      } catch (err) {
        console.log(err);
        logger('Outer error');
        success = false;
      }

      return [modified, success];
    };
    const expireAt = Date.now() + 30000;
    const tag = TaskType.NB;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'start new battle', tag, rank);
    ctrl.addTask(task);
    return;
  }

  if (title.includes('You Defeated A')) {
    logFn = () => {
      console.log('Battle finish');
      console.log('Reset battle counter');
    }
    logger(logFn, seperator = true);
    return;
  }

  if (title.includes('BATTLE STARTED')) {
    logFn = () => {
      console.log('Battle start');
      console.log('Reset battle counter');
    }
    logger(logFn, seperator = true);
    ctrl.player['bs'] = States.InBattle;
    return;
  }

  if (title.includes('Better Luck Next Time!')) {
    logger('Reset battle counter');
    ctrl.player['bs'] = States.Defeat;
    return;
  }

  if (content.includes('You are already in a battle')) {
    const customSep = '------------IN BATTLE------------'
    logFn = () => {
      console.log('Battle State: ' + ctrl.player['bs']);
      console.log('Battle Hash: ' + ctrl.player['bhash']);
    }
    logger(logFn, seperator = true, customSepStart = customSep, customSepEnd = customSep);

    logger('try to leave battle...');
    const taskFunc = async () => {
      try {
        message.clickButton({ X: 0, Y: 0 })
          .catch(err => {
            handleError(err, 'Leave profession got error');
          })
      } catch (err) {
        console.log(err);
      }
      return [{}, true];
    };
    const expireAt = Date.now() + 30000;
    const tag = TaskType.NP;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'leave profession', tag, rank);
    ctrl.addTask(task);
    return;
  }
}

function professionHandler(ctrl, event, message, title, desc, content) {
  if (['Mining', 'Fishing', 'Foraging'].includes(title) && event === 'create') {
    logger('Open new profession window');
    logger('Reset profession counter')
    ctrl.player['ps'] = States.Idle;
    ctrl.player['profMsg'] = message;

    const taskFunc = async () => {
      const modified = {};
      let success = true;
      try {
        await ctrl.player['profMsg'].clickButton({ X: 0, Y: 0 })
          .catch(err => {
            success = handleError(err, 'click profession button fail');
          });
      } catch (err) {
        console.log(err);
        logger('Outer error');
        success = false;
      }
      return [modified, success];
    };
    const expireAt = Date.now() + 30000;
    const tag = TaskType.NP;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'start profession', tag, rank);
    ctrl.addTask(task);
    return;
  }

  if (title.includes('You caught a')) {
    logger('Profession finish (Fish)');
    return;
  }

  if (title.includes('Mining Complete!')) {
    logger('Profession finish (Mine)');
    return;
  }

  if (title.includes('You found a')) {
    logger('Profession finish (Forage)');
    return;
  }

  if (title === 'You started mining!') {
    logger('Profession start (Mine)');
    ctrl.player['ps'] = States.Doing;
    return;
  }
  if (title === 'You cast your rod!') {
    logger('Profession start (Fish)');
    ctrl.player['ps'] = States.Doing;
    return;
  }
  if (title === 'You start foraging!') {
    logger('Profession start (Forage)');
    ctrl.player['ps'] = States.Doing;
    return;
  }

  let regex = /You are already mining|foraging|fishing/
  if (regex.test(content)) {
    const customSep = '------------IN PROFESSION------------';
    logFn = () => {
      console.log('Profession State: ' + ctrl.player['ps']);
      console.log('Profession Hash: ' + ctrl.player['phash']);
    }
    logger(logFn, seperator = true, customSepStart = customSep, customSepEnd = customSep);
    logger('try to leave profession...');

    const taskFunc = async () => {
      try {
        message.clickButton({ X: 0, Y: 0 })
          .catch(err => {
            handleError(err, 'Leave profession got error')
          })
      } catch (err) {
        console.log(err);
      }
      return [{}, true];
    };
    const expireAt = Date.now() + 30000;
    const tag = TaskType.NP;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'leave profession', tag, rank);
    ctrl.addTask(task);
    return;
  }
}

client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (newMsg.channelId != channelId) return;
  if (newMsg.author.username != 'Isekaid') return;

  let [title, desc, , content] = messageExtractor(newMsg);
  let [, oldDesc, ,] = messageExtractor(oldMsg);

  professionHandler(ctrl, 'update', newMsg, title, desc, content);

  retainerHandler(ctrl, newMsg, desc, oldDesc);
})

initCaptchaAI();
client.login(token).catch(reason => { console.log(reason); process.exit(0); });