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
const { messageExtractor, gainItemLog } = require('./helper');
const { logger } = require('./log');
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

async function ImmediatelyRoutineScript() {
  if (ctrl.player['bs'] === States.NeedVerify_Image || ctrl.player['ps'] === States.NeedVerify_Image) {
    logger('Try to solve verify image');
    const taskFunc = () => new Promise(resolve => {
      ctrl.player['channel']?.send('$verify');
      resolve({});
    })
    const expireAt = Date.now() + 60000;
    const tag = TaskType.Verfiy;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'type $verify', tag, rank);
    ctrl.addTask(task);
    return;
  }

  if (ctrl.player['bs'] === States.Verifying_Image || ctrl.player['ps'] === States.Verifying_Image) {
    const taskFunc = () => new Promise(resolve => {
      captchaAI.predict(ctrl.player['verifyImg'].url)
        .then((result) => {
          logger(`Verify Image Result: ${result}`)
          ctrl.player['channel']?.send(result);
          resolve({});
        });
    })
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
  logger(`BHASH: ${ctrl.player['bhash']}`)
  logger(`prev BHASH: ${ctrl.player['prevBhash']}`)

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
    cacheChannel.send('!!BOT auto-start activate!!');
    cacheChannel.send('!start');
    ctrl.player['channel'] = cacheChannel;
    retainerRoutine(ctrl);
    foodRoutine(ctrl);
  }
})

client.on('messageCreate', async (message) => {
  checkTreasure(ctrl, message);
  parseCommands(ctrl, message, client.user.id);
  if (message.channelId != channelId) return;
  if (message.author.username != 'Isekaid' && message.author.username != client.user.username) return;

  let data = messageExtractor(message);

  if (data['content'] === '!start') {
    ctrl.player['channel'] = message.channel;
    ctrl.player['bs'] = States.Normal;
    ctrl.player['ps'] = States.Normal;
    logger('>>>BOT start<<<');
    return;
  }

  if (data['content'] === '!stop') {
    ctrl.player['channel'] = null;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    ctrl.player['bs'] = States.Normal;
    ctrl.player['ps'] = States.Normal;
    logger('>>>BOT stop<<<');
    return;
  }

  if (data['desc'] === 'You don\'t have enough energy to battle!') {
    logger('>>>BOT stop due to no energy<<<');
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    ctrl.player['bs'] = States.Normal;
    ctrl.player['ps'] = States.Normal;
    return;
  }

  if (data['title'] === 'Suspended') {
    logger('>>>YOU GOT BANNED<<<');
    ctrl.player['channel'] = null;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    ctrl.player['bs'] = States.Ban;
    ctrl.player['ps'] = States.Ban;
    return;
  }

  if (data['desc'].includes('Choose the correct option...')) {
    emojiVerifier(ctrl, message);
    return;
  }

  if (data['content'].includes('Time ran out!')) {
    ctrl.player['bs'] = States.Sus;
    ctrl.player['ps'] = States.Sus;
    return;
  }

  if (verifyHandler(message, data, client.user.username)) {
    ImmediatelyRoutineScript();
    return;
  }
  retainerHandler(ctrl, message, data);
  mapHandler(ctrl, message, data);
  professionHandler(ctrl, 'create', message, data);
  inventoryHandler(ctrl, data);
})

function verifyHandler(message, data, user) {
  if (data['desc'].includes('Please complete the captcha')) {
    if (data['embRef'] != user) return;
    logger('>>>BOT stop due to verify<<<');
    ctrl.player['bs'] = States.NeedVerify_Image;
    ctrl.player['ps'] = States.NeedVerify_Image;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    return true;
  }

  if (data['desc'].includes('Please Try doing $verify again.')) {
    logger('You need to solve captcha again...');
    ctrl.player['bs'] = States.NeedVerify_Image;
    ctrl.player['ps'] = States.NeedVerify_Image;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    return true;
  }

  if (data['desc'].includes('Please enter the captcha code from the image to verify.')) {
    logger('>>>BOT stop due to verify image code<<<');
    ctrl.player['bs'] = States.Verifying_Image;
    ctrl.player['ps'] = States.Verifying_Image;
    ctrl.player['verifyImg'] = message.embeds[0].image;
    return true;
  }

  if (data['desc'].includes('Successfully Verified.')) {
    logger('>>>BOT start due to verify finished<<<');
    ctrl.player['bs'] = States.Normal;
    ctrl.player['ps'] = States.Normal;
    ctrl.player['channel'] = message.channel;
    return false;
  }
}

function mapHandler(ctrl, message, data) {
  if (data['title'].includes('Current Location:')) {
    logger('Open new battle window, reset battle counter');
    ctrl.player['bs'] = States.Normal;
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
    ctrl.addTask(task);
    return;
  }

  if (data['title'].includes('You Defeated A')) {
    logger('Battle finish, update bhash');
    ctrl.player['bhash'] = data['id'];

    let desc = data['desc'].replaceAll(',', '');
    desc = desc.replaceAll('*', '')
    let re = /You gained (\d+) Gold!/;
    let gold = desc.match(re)?.[1] ?? '0';
    logger(gainItemLog(parseInt(gold), 'Gold'))
    logger(`You gained ${parseInt(gold)} Gold!`)
    return;
  }

  if (data['title'].includes('BATTLE STARTED')) {
    logger('Battle start, update bhash');
    ctrl.player['bhash'] = data['id'];
    return;
  }

  if (data['title'].includes('Better Luck Next Time!')) {
    logger('You dead, reset battle counter');
    ctrl.player['bs'] = States.Defeat;
    return;
  }

  if (data['content'].includes('You are already in a battle')) {
    const customSep = '------------IN BATTLE------------'
    logFn = () => {
      console.log('Battle State: ' + ctrl.player['bs']);
      console.log('Battle Hash: ' + ctrl.player['bhash']);
    }
    logger(logFn, seperator = true, customSepStart = customSep, customSepEnd = customSep);

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
    ctrl.addTask(task);
    return;
  }
}

function professionHandler(ctrl, event, message, data) {
  if (['Mining', 'Fishing', 'Foraging'].includes(data['title']) && event === 'create') {
    logger('Open new profession window');
    logger('Reset profession counter')
    ctrl.player['ps'] = States.Normal;
    ctrl.player['profMsg'] = message;

    const taskFunc = () => new Promise((resolve, reject) => {
      ctrl.player['profMsg'].clickButton({ X: 0, Y: 0 })
        .then(() => { resolve({}); })
        .catch(err => {
          success = handleError(err, 'click profession button fail');
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
    ctrl.addTask(task);
    return;
  }

  if (data['title'].includes('You caught a')) {
    logger('Profession finish (Fish)');
    ctrl.player['phash'] = data['id'];
    return;
  }

  if (data['title'].includes('Mining Complete!')) {
    logger('Profession finish (Mine)');
    ctrl.player['phash'] = data['id'];
    return;
  }

  if (data['title'].includes('You found a')) {
    logger('Profession finish (Forage)');
    ctrl.player['phash'] = data['id'];
    return;
  }

  if (data['title'] === 'You started mining!') {
    logger('Profession start (Mine)');
    ctrl.player['phash'] = data['id'];
    return;
  }
  if (data['title'] === 'You cast your rod!') {
    logger('Profession start (Fish)');
    ctrl.player['phash'] = data['id'];
    return;
  }
  if (data['title'] === 'You start foraging!') {
    logger('Profession start (Forage)');
    ctrl.player['phash'] = data['id'];
    return;
  }

  let regex = /You are already mining|foraging|fishing/
  if (regex.test(data['content'])) {
    const customSep = '------------IN PROFESSION------------';
    logFn = () => {
      console.log('Profession State: ' + ctrl.player['ps']);
      console.log('Profession Hash: ' + ctrl.player['phash']);
    }
    logger(logFn, seperator = true, customSepStart = customSep, customSepEnd = customSep);
    logger('try to leave profession...');

    const taskFunc = () => new Promise((resolve, reject) => {
      message.clickButton({ X: 0, Y: 0 })
        .then(() => { resolve({}); })
        .catch(err => {
          success = handleError(err, 'Leave profession got error');
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
    ctrl.addTask(task);
    return;
  }
}

client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (newMsg.channelId != channelId) return;
  if (newMsg.author.username != 'Isekaid') return;

  let newData = messageExtractor(newMsg);
  let oldData = messageExtractor(oldMsg);

  professionHandler(ctrl, 'update', newMsg, newData);

  retainerHandler(ctrl, newMsg, newData, oldData);
})

initCaptchaAI();
client.login(token).catch(reason => { console.log(reason); process.exit(0); });