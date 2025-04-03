const { Client } = require('discord.js-selfbot-v13');
const { token, channelId, captchaModel } = require('./config.json');
const CaptchaAI = require('./captcha').CaptchaAI;
const { States, newPlayer } = require('./player');
const { checkTreasure } = require('./treasure');
const { retainerRoutine, retainerHandler } = require('./retainer');
const { foodRoutine } = require('./food');
const { inventoryRoutine, inventoryHandler } = require('./inventory')
const { Task, TaskType, getDefaultRank } = require('./task manager')
const { Controller } = require('./controller')
const { messageExtractor } = require('./helper');
const { logger, gainItemHandler } = require('./log');
const { handleError } = require('./error');
const { emojiVerifier } = require('./verifier');
const { parseCommands } = require('./commands');
const args = process.argv.slice(2);

const client = new Client();

let captchaAI;
const initCaptchaAI = async function () {
  captchaAI = await new CaptchaAI(captchaModel);
};

const player = newPlayer()
const ctrl = new Controller(player)

async function oneHrRoutineScript() {
  logger('Do scheduling task');
  retainerRoutine(ctrl);
  inventoryRoutine(ctrl);
}

async function threeHrFoodScript() {
  logger('Try to eat exp food');
  foodRoutine(ctrl);
}

ctrl.start();
setInterval(oneHrRoutineScript, 1 * 60 * 60 * 1000 + 20 * 1000);
setInterval(threeHrFoodScript, 3 * 60 * 60 * 1000 + 20 * 1000);

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
    ctrl.player['channel'] = cacheChannel;
    cacheChannel.send('!!BOT auto-start activate!!');
    cacheChannel.send('!start');
    // retainerRoutine(ctrl);
    // foodRoutine(ctrl);
  }
})

client.on('messageCreate', async (message) => {
  checkTreasure(ctrl, message);
  parseCommands(ctrl, message, client.user.id);
  if (message.channelId !== channelId) return;
  if (message.author.username !== 'Isekaid' && message.author.username !== client.user.username) return;

  let data = messageExtractor(message);

  if (data['content'] === '!start') {
    logger('>>>BOT START<<<');
    ctrl.player['channel'] = message.channel;
    ctrl.updateState(States.Init);
    return;
  }

  if (data['content'] === '!stop') {
    logger('>>>BOT STOP<<<');
    ctrl.updateState(States.Stopped);
    return;
  }

  if ([States.Ban, States.Defeated, States.Stopped].includes(ctrl.player.state)) return;

  if (data['desc'] === 'You don\'t have enough energy to battle!') {
    logger('>>>NO ENERGY<<<');
    ctrl.refreshTimerId('map');
    ctrl.refreshTimerId('prof');
    return;
  }

  if (data['title'] === 'Suspended') {
    logger('>>>YOU GOT BANNED<<<');
    ctrl.updateState(States.Ban);
    return;
  }

  if (data['desc'].includes('Choose the correct option...')) {
    emojiVerifier(ctrl, message);
    return;
  }

  verifyHandler(message, data, client.user.username)
  retainerHandler(ctrl, message, data);
  mapHandler(ctrl, message, data);
  professionHandler(ctrl, 'create', message, data);
  inventoryHandler(ctrl, data);
})

function verifyHandler(message, data, user) {
  if (data['embRef'] !== user) return;
  ctrl.player['battleMsg'] = null;
  ctrl.player['profMsg'] = null;

  if (data['desc'].includes('Please complete the captcha')) {
    logger('>>>BOT BLOCKED - VERIFY<<<');
    logger('Try to solve verify image');

    ctrl.updateState(States.Blocked);
    return
  }

  if (data['desc'].includes('Please Try doing $verify again.')) {
    logger('Need to solve captcha again...');

    ctrl.verifyRecursion();
    return
  }

  if (data['desc'].includes('Please enter the captcha code from the image to verify.')) {
    logger('>>>BOT BLOCKED - IMAGE CODE<<<');

    ctrl.player['verifyImg'] = message.embeds[0].image;
    ctrl.updateState(States.Blocked);

    const taskFunc = () => new Promise(resolve => {
      captchaAI.predict(ctrl.player['verifyImg'].url)
        .then((result) => {
          logger(`Verify Image Result: ${result}`)
          ctrl.player['channel']?.send(result);
          resolve({});
        });
    })
    const expireAt = Date.now() + 60000;
    const tag = TaskType.Verify;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'send verify result', tag, rank);
    ctrl.addTask(task, 'verify');
    return
  }

  if (data['desc'].includes('Successfully Verified.')) {
    logger('>>>BOT START - VERIFY FINISH<<<');
    ctrl.player['channel'] = message.channel;
    ctrl.updateState(States.Init)
    return;
  }
}

function mapHandler(ctrl, message, data) {
  if (data['title'].includes('Current Location:')) {
    logger('Open new battle window');
    ctrl.player['battleMsg'] = message;

    const taskFunc = () => new Promise((resolve, reject) => {
      ctrl.player['battleMsg'].clickButton({ X: 0, Y: 0 })
        .then(() => { resolve({}); })
        .catch(err => {
          const success = handleError(err, 'start new battle fail');
          if (success) {
            resolve({});
          } else {
            reject(err);
          }
        })
    })
    const expireAt = Date.now() + 30000;
    const tag = TaskType.NB;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'start new battle', tag, rank);
    ctrl.addTask(task, 'map');
    return;
  }

  if (data['title'].includes('You Defeated A')) {
    logger('Battle finish, refresh battle timer');
    ctrl.refreshTimerId('map');
    gainItemHandler(data);
    return;
  }

  if (data['title'].includes('BATTLE STARTED')) {
    logger('Battle start, refresh battle timer');
    ctrl.refreshTimerId('map');
    return;
  }

  if (data['title'].includes('Better Luck Next Time!')) {
    logger('You dead, stop the bot');
    ctrl.updateState(States.Defeated);
    return;
  }

  if (data['content'].includes('You are already in a battle')) {
    logger('try to leave battle...');
    const taskFunc = () => new Promise((resolve, reject) => {
      message.clickButton({ X: 0, Y: 0 })
        .then(() => { resolve({}); })
        .catch(err => {
          const success = handleError(err, 'Leave battle got error');
          if (success) {
            resolve({});
          } else {
            reject(err);
          }
        })
    })
    const expireAt = Date.now() + 30000;
    const tag = TaskType.NP;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'leave battle', tag, rank);
    ctrl.addTask(task, 'map');
    return;
  }
}

function professionHandler(ctrl, event, message, data) {
  if (['Mining', 'Fishing', 'Foraging'].includes(data['title']) && event === 'create') {
    logger('Open new profession window');
    ctrl.player['profMsg'] = message;

    const taskFunc = () => new Promise((resolve, reject) => {
      ctrl.player['profMsg'].clickButton({ X: 0, Y: 0 })
        .then(() => { resolve({}); })
        .catch(err => {
          const success = handleError(err, 'click profession button fail');
          if (success) {
            resolve({});
          } else {
            reject(err);
          }
        })
    })
    const expireAt = Date.now() + 30000;
    const tag = TaskType.NP;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'start profession', tag, rank);
    ctrl.addTask(task, 'prof');
    return;
  }

  if (data['title'].includes('You caught a')) {
    logger('Profession finish (Fish)');
    ctrl.refreshTimerId('prof')
    gainItemHandler(data);
    return;
  }

  if (data['title'].includes('Mining Complete!')) {
    logger('Profession finish (Mine)');
    ctrl.refreshTimerId('prof');
    gainItemHandler(data);
    return;
  }


  if (data['title'].includes('You found a')) {
    logger('Profession finish (Forage)');
    ctrl.refreshTimerId('prof');
    gainItemHandler(data);
    return;
  }

  if (data['title'] === 'You started mining!') {
    logger('Profession start (Mine)');
    ctrl.refreshTimerId('prof');
    return;
  }
  if (data['title'] === 'You cast your rod!') {
    logger('Profession start (Fish)');
    ctrl.refreshTimerId('prof');
    return;
  }
  if (data['title'] === 'You start foraging!') {
    logger('Profession start (Forage)');
    ctrl.refreshTimerId('prof');
    return;
  }

  let regex = /You are already mining|foraging|fishing/
  if (regex.test(data['content'])) {
    logger('try to leave profession...');

    const taskFunc = () => new Promise((resolve, reject) => {
      message.clickButton({ X: 0, Y: 0 })
        .then(() => { resolve({}); })
        .catch(err => {
          const success = handleError(err, 'Leave profession got error');
          if (success) {
            resolve({});
          } else {
            reject(err);
          }
        })
    })
    const expireAt = Date.now() + 30000;
    const tag = TaskType.NP;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'leave profession', tag, rank);
    ctrl.addTask(task, 'prof');
    return;
  }
}

client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (newMsg.channelId !== channelId) return;
  if (newMsg.author.username !== 'Isekaid') return;

  let newData = messageExtractor(newMsg);
  let oldData = messageExtractor(oldMsg);

  professionHandler(ctrl, 'update', newMsg, newData);

  retainerHandler(ctrl, newMsg, newData, oldData);
})

initCaptchaAI();
client.login(token).catch(reason => {
  console.log(reason);
  ctrl.destroy();
  process.exit(0);
});