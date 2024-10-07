const { Client } = require('discord.js-selfbot-v13');
const { token, channelId, delayMs, retryCount, captchaModel } = require('./config.json');
const CaptchaAI = require('./captcha').CaptchaAI;
const { Player, States, newPlayer } = require('./player');
const { professionRoutine } = require('./profession');
const { mappingRoutine } = require('./mapping');
const { checkTreasure } = require('./treasure');
const { retainerRoutine, retainerHandler } = require('./retainer');
const { foodRoutine } = require('./food');
const { inventoryRoutine, inventoryHandler } = require('./inventory')
const { Task, Controller } = require('./controller')
const { messageExtractor, errorLogWrapper } = require('./helper');
const { emojiVerifier } = require('./verifier');
const args = process.argv.slice(2);

function msgLogger(msg) {
  let date = new Date();
  console.log('--------------------------')
  console.log(date.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  console.log('Context: ' + msg.content)
  console.log('Embeds: ' + JSON.stringify(msg.embeds))
  console.log('--------------------------')
}

const client = new Client();

let captchaAI;
const initCaptchaAI = async function () {
  captchaAI = await new CaptchaAI(captchaModel);
};

const player = newPlayer()
const ctrl = new Controller(player)

async function ImmediatelyRoutineScript() {
  if (ctrl.player['bs'] === States.NeedVerify_Image || ctrl.player['ps'] === States.NeedVerify_Image) {
    console.log('Try to solve verify image');
    const taskFunc = () => {
      ctrl.player['channel']?.send('$verify');
      return {};
    };
    const expireAt = Date.now() + 10000;
    const task = new Task(taskFunc, expireAt, 'type $verify');
    ctrl.addTask(task);
    return;
  }

  if (ctrl.player['bs'] === States.Verifying_Image || ctrl.player['ps'] === States.Verifying_Image) {
    const taskFunc = async () => {
      const result = await captchaAI.predict(ctrl.player['verifyImg'].url);
      console.log('Verify Image Result: ' + result);
      ctrl.player['channel']?.send(result);
      return {};
    };
    const expireAt = Date.now() + 10000;
    const task = new Task(taskFunc, expireAt, 'send verify result');
    ctrl.addTask(task);
    return;
  }
}

async function shortRoutineScript() {
  console.log(`BS: ${ctrl.player['bs']} | PS: ${ctrl.player['ps']}`);
  console.log(`BC: ${ctrl.player['bc']} | PC: ${ctrl.player['pc']}`);

  if ([States.NeedVerify_Image, States.Verifying_Image].includes(ctrl.player['bs'])) {
    console.log('[Battle] Encounter verify states');
  } else {
    mappingRoutine(ctrl);
  }

  if ([States.NeedVerify_Image, States.Verifying_Image].includes(ctrl.player['ps'])) {
    console.log('[Profession] Encounter verify states or already auto started');
  } else {
    professionRoutine(ctrl);
  }
}

async function oneHrRoutineScript() {
  console.log('Do scheduling task');
  retainerRoutine(ctrl);
  inventoryRoutine(ctrl);
}

async function threeHrFoodScript() {
  console.log('Try to eat exp food');
  foodRoutine(ctrl);
}

setInterval(ctrl.checkQueueAndExecute.bind(ctrl), 1000);
setInterval(shortRoutineScript, delayMs);
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
  console.log(`Login as ${client.user.username}`);
  if (args.includes('--auto-start')) {
    console.log('bot auto-start activate')
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
    console.log('>>>BOT start<<<')
    return;
  }

  if (content === '!stop') {
    ctrl.player['channel'] = null;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    ctrl.player['bs'] = States.Idle;
    ctrl.player['ps'] = States.Idle;
    console.log('>>>BOT stop<<<');
    return;
  }

  if (desc === 'You don\'t have enough energy to battle!') {
    console.log('>>>BOT stop due to no energy<<<');
    ctrl.player['channel'] = null;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    ctrl.player['bs'] = States.Idle;
    ctrl.player['ps'] = States.Idle;
    return;
  }

  if (title === 'Suspended') {
    console.log('>>>YOU GOT BANNED<<<')
    ctrl.player['channel'] = null;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    ctrl.player['bs'] = States.Idle;
    ctrl.player['ps'] = States.Idle;
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
    console.log('>>>BOT stop due to verify<<<');
    ctrl.player['bs'] = States.NeedVerify_Image;
    ctrl.player['ps'] = States.NeedVerify_Image;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    return true;
  }

  if (description.includes('Please Try doing $verify again.')) {
    console.log('You need to solve captcha again...');
    ctrl.player['bs'] = States.NeedVerify_Image;
    ctrl.player['ps'] = States.NeedVerify_Image;
    ctrl.player['battleMsg'] = null;
    ctrl.player['profMsg'] = null;
    return true;
  }

  if (description.includes('Please enter the captcha code from the image to verify.')) {
    console.log('>>>BOT stop due to verify image code<<<');
    ctrl.player['bs'] = States.Verifying_Image;
    ctrl.player['ps'] = States.Verifying_Image;
    ctrl.player['verifyImg'] = message.embeds[0].image;
    return true;
  }

  if (description.includes('Successfully Verified.')) {
    console.log('>>>BOT start due to verify finished<<<');
    ctrl.player['bs'] = States.Idle;
    ctrl.player['ps'] = States.Idle;
    ctrl.player['channel'] = message.channel;
    return false;
  }
}

function mapHandler(ctrl, message, title, content) {
  if (title.includes('Current Location:')) {
    console.log('Open new battle window');
    console.log('Reset battle counter');
    ctrl.player['bs'] = States.Idle;
    ctrl.player['bc'] = 0;
    ctrl.player['battleMsg'] = message;
    return;
  }

  if (title.includes('You Defeated A')) {
    console.log('Battle finish');
    console.log('Reset battle counter');
    ctrl.player['bs'] = States.Idle;
    ctrl.player['bc'] = 0;
    return;
  }

  if (title.includes('BATTLE STARTED')) {
    console.log('Battle start');
    console.log('Reset battle counter');
    ctrl.player['bs'] = States.InBattle;
    ctrl.player['bc'] = 0;
    return;
  }

  if (title.includes('Better Luck Next Time!')) {
    console.log('Reset battle counter');
    ctrl.player['bs'] = States.Defeat;
    ctrl.player['bc'] = 0;
    return;
  }

  if (content.includes('You are already in a battle')) {
    console.log('------------IN BATTLE------------');
    console.log('Battle Counter: ' + ctrl.player['bc']);
    console.log('Battle State: ' + ctrl.player['bs']);
    console.log('------------IN BATTLE------------');
    if (ctrl.player['bc'] > retryCount || ctrl.player['bs'] == States.Idle) {
      console.log('try to leave battle...');
      const taskFunc = async () => {
        try {
          message.clickButton({ X: 0, Y: 0 })
            .catch(err => {
              logFunc = () => {
                console.log('Leave battle got error');
                console.log(err);
              };
              errorLogWrapper(logFunc);
            })
        } catch (err) {
          console.log(err);
        }
        return {};
      };
      const expireAt = Date.now() + 10000;
      const task = new Task(taskFunc, expireAt, 'leave battle');
      ctrl.addTask(task);
    }

    return;
  }

  if (content.includes('You are already')) {
    console.log('------------IN PROFESSION------------');
    console.log('Profession Counter: ' + ctrl.player['pc']);
    console.log('Profession State: ' + ctrl.player['ps']);
    console.log('------------IN PROFESSION------------');
    if (ctrl.player['pc'] > retryCount || ctrl.player['ps'] == States.Idle) {
      console.log('try to leave profession...');
      const taskFunc = async () => {
        try {
          message.clickButton({ X: 0, Y: 0 })
            .catch(err => {
              logFunc = () => {
                console.log('Leave profession got error');
                console.log(err);
              };
              errorLogWrapper(logFunc);
            })
        } catch (err) {
          console.log(err);
        }
        return {};
      };
      const expireAt = Date.now() + 10000;
      const task = new Task(taskFunc, expireAt, 'leave profession');
      ctrl.addTask(task);
    }

    return;
  }
}

function professionHandler(ctrl, event, message, title, description, content) {
  if (['Mining', 'Fishing', 'Foraging'].includes(title) && event === 'create') {
    console.log('Open new profession window');
    console.log('Reset profession counter');
    ctrl.player['ps'] = States.Idle;
    ctrl.player['pc'] = 0;
    ctrl.player['profMsg'] = message;
    return;
  }

  if (title.includes('You caught a')) {
    console.log('Profession finish (Fish)');
    console.log('Reset profession counter');
    // ctrl.player['ps'] = States.Idle;
    ctrl.player['pc'] = 0;
    return;
  }

  if (title.includes('Mining Complete!')) {
    console.log('Profession finish (Mine)');
    console.log('Reset profession counter');
    // ctrl.player['ps'] = States.Idle;
    ctrl.player['pc'] = 0;
    return;
  }

  if (title.includes('You found a')) {
    console.log('Profession finish (Forage)');
    console.log('Reset profession counter');
    // ctrl.player['ps'] = States.Idle;
    ctrl.player['pc'] = 0;
    return;
  }

  if (title === 'You started mining!') {
    console.log('Profession start (Mine)');
    console.log('Reset profession counter');
    ctrl.player['ps'] = States.Doing;
    ctrl.player['pc'] = 0;
    return;
  }
  if (title === 'You cast your rod!') {
    console.log('Profession start (Fish)');
    console.log('Reset profession counter');
    ctrl.player['ps'] = States.Doing;
    ctrl.player['pc'] = 0;
    return;
  }
  if (title === 'You start foraging!') {
    console.log('Profession start (Forage)');
    console.log('Reset profession counter');
    ctrl.player['ps'] = States.Doing;
    ctrl.player['pc'] = 0;
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