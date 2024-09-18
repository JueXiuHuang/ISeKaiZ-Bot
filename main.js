const { Client } = require('discord.js-selfbot-v13');
const { token, channelId, delayMs, retryCount, captchaModel } = require('./config.json');
const CaptchaAI = require('./captcha').CaptchaAI;
const { Player, States } = require('./player');
const { professionRoutine } = require('./profession');
const { mappingRoutine } = require('./mapping');
const { checkTreasure } = require('./treasure');
const { retainerRoutine, retainerHandler } = require('./retainer');
const { foodRoutine } = require('./food');
const { inventoryRoutine, inventoryHandler } = require('./inventory')
const { messageExtractor, emojiVerifier, delayer, errorLogWrapper } = require('./helper');
const args = process.argv.slice(2);


function successCallback() { }

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

const player = new Player();

async function ImmediatelyRoutineScript() {
  await delayer(2000, 5000);

  if (player.bs === States.NeedVerify_Image || player.ps === States.NeedVerify_Image) {
    console.log('Try to solve verify image');
    player.channel.send('$verify');
    return;
  }

  if (player.bs === States.Verifying_Image || player.ps === States.Verifying_Image) {
    result = await captchaAI.predict(player.verifyImg.url);
    console.log('Verify Image Result: ' + result);
    player.channel.send(result);
    return;
  }
}

async function shortRoutineScript() {
  console.log(`B: ${player.bs} | P: ${player.ps}`);

  if ([States.NeedVerify_Image, States.Verifying_Image].includes(player.bs)) {
    console.log('[Battle] Encounter verify states');
  } else {
    mappingRoutine(player);
  }

  if ([States.NeedVerify_Image, States.Verifying_Image].includes(player.ps)) {
    console.log('[Profession] Encounter verify states or already auto started');
  } else {
    professionRoutine(player);
  }
}

async function oneHrRoutineScript() {
  console.log('Do scheduling task');
  retainerRoutine(player);
  inventoryRoutine(player);
}

async function threeHrFoodScript() {
  console.log('Try to eat exp food');
  foodRoutine(player.channel);
}

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
    player.channel = cacheChannel;
    retainerRoutine(player);
    foodRoutine(cacheChannel);
  }
})

client.on('messageCreate', async (message) => {
  checkTreasure(message);
  if (message.channelId != channelId) return;
  if (message.author.username != 'Isekaid' && message.author.username != client.user.username) return;

  if (message.author.username == 'Isekaid') {
    msgLogger(message);
  }

  let [embedTitle, embedDesc, mention, content] = messageExtractor(message);

  if (content === '!start') {
    player.channel = message.channel;
    player.bs = States.Idle;
    player.ps = States.Idle;
    console.log('>>>BOT start<<<')
    return;
  }

  if (content === '!stop') {
    player.channel = null;
    player.battleMsg = null;
    player.profMsg = null;
    player.bs = States.Idle;
    player.ps = States.Idle;
    console.log('>>>BOT stop<<<');
    return;
  }

  if (embedDesc === 'You don\'t have enough energy to battle!') {
    console.log('>>>BOT stop due to no energy<<<');
    player.channel = null;
    player.battleMsg = null;
    player.profMsg = null;
    player.bs = States.Idle;
    player.ps = States.Idle;
    return;
  }

  if (embedTitle === 'Suspended') {
    console.log('>>>YOU GOT BANNED<<<')
    player.channel = null;
    player.battleMsg = null;
    player.profMsg = null;
    player.bs = States.Idle;
    player.ps = States.Idle;
    return;
  }

  if (verifyHandler(message, embedDesc, mention, client.user.username)) {
    ImmediatelyRoutineScript();
    return;
  }
  retainerHandler(message, embedDesc);
  mapHandler(embedTitle, content, message);
  professionHandler('create', message, embedDesc, embedTitle, content);
  inventoryHandler(player, embedTitle, embedDesc);
})

function verifyHandler(message, description, mention, user) {
  if (description.includes('Please complete the captcha')) {
    if (mention != user) return;
    console.log('>>>BOT stop due to verify<<<');
    player.bs = States.NeedVerify_Image;
    player.ps = States.NeedVerify_Image;
    player.battleMsg = null;
    player.profMsg = null;
    return true;
  }

  if (description.includes('Please Try doing $verify again.')) {
    console.log('You need to solve captcha again...');
    player.bs = States.NeedVerify_Image;
    player.ps = States.NeedVerify_Image;
    player.battleMsg = null;
    player.profMsg = null;
    return true;
  }

  if (description.includes('Please enter the captcha code from the image to verify.')) {
    console.log('>>>BOT stop due to verify image code<<<');
    player.bs = States.Verifying_Image;
    player.ps = States.Verifying_Image;
    player.verifyImg = message.embeds[0].image;
    return true;
  }

  if (description.includes('Successfully Verified.')) {
    console.log('>>>BOT start due to verify finished<<<');
    player.bs = States.Idle;
    player.ps = States.Idle;
    player.channel = message.channel;
    return false;
  }
}

async function mapHandler(title, content, message) {
  if (title.includes('Current Location:')) {
    console.log('Open new battle window');
    player.bs = States.Idle;
    player.bc = 0;
    player.battleMsg = message;

    return;
  }

  if (title.includes('You Defeated A')) {
    console.log('Battle finish');
    player.bs = States.Idle;
    player.bc = 0;
    return;
  }

  if (title.includes('BATTLE STARTED')) {
    console.log('Battle start');
    player.bs = States.InBattle;
    player.bc = 0;
    return;
  }

  if (title.includes('Better Luck Next Time!')) {
    player.bs = States.Defeat;
    player.bc = 0;
    return;
  }

  if (content.includes('You are already in a battle')) {
    console.log('------------IN BATTLE------------');
    console.log('Battle Counter: ' + player.bc);
    console.log('Battle State: ' + player.bs);
    console.log('------------IN BATTLE------------');
    if (player.bc > retryCount || player.bs == States.Idle) {
      console.log('try to leave battle...');
      await delayer(3000, 5000);
      try {
        message.clickButton({ X: 0, Y: 0 })
          .then(successCallback)
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

    }

    return;
  }

  regex = /You are already mining|foraging|fishing/
  if (regex.test(content)) {
    console.log('------------IN PROFESSION------------');
    console.log('Profession Counter: ' + player.pc);
    console.log('Profession State: ' + player.ps);
    console.log('------------IN PROFESSION------------');
    if (player.pc > retryCount || player.ps == States.Idle) {
      console.log('try to leave profession...');
      await delayer(3000, 5000);
      try {
        message.clickButton({ X: 0, Y: 0 })
          .then(successCallback)
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
    }

    return;
  }
}

function professionHandler(event, message, description, title, content) {
  if (['Mining', 'Fishing', 'Foraging'].includes(title) && event === 'create') {
    console.log('Open new profession window');
    player.ps = States.Idle;
    player.pc = 0;
    player.profMsg = message;
    return;
  }

  if (content.includes('Time ran out!')) {
    player.ps = States.Idle;
    return;
  }

  if (description.includes('Choose the correct option...')) {
    emojiVerifier(message);
    return;
  }

  if (title.includes('You caught a')) {
    console.log('Profession finish (Fish)');
    // player.ps = States.Idle;
    player.pc = 0;
    return;
  }

  if (title.includes('Mining Complete!')) {
    console.log('Profession finish (Mine)');
    // player.ps = States.Idle;
    player.pc = 0;
    return;
  }

  if (title.includes('You found a')) {
    console.log('Profession finish (Forage)');
    // player.ps = States.Idle;
    player.pc = 0;
    return;
  }

  if (title === 'You started mining!') {
    console.log('Profession start (Mine)');
    player.ps = States.Doing;
    player.pc = 0;
    return;
  }
  if (title === 'You cast your rod!') {
    console.log('Profession start (Fish)');
    player.ps = States.Doing;
    player.pc = 0;
    return;
  }
  if (title === 'You start foraging!') {
    console.log('Profession start (Forage)');
    player.ps = States.Doing;
    player.pc = 0;
    return;
  }
}

client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (newMsg.channelId != channelId) return;
  if (newMsg.author.username != 'Isekaid') return;

  let [embedTitle, embedDesc, , content] = messageExtractor(newMsg);
  let [, oldEmbedDesc, ,] = messageExtractor(oldMsg);

  professionHandler('update', newMsg, embedDesc, embedTitle, content);

  retainerHandler(newMsg, embedDesc, oldEmbedDesc);
})

initCaptchaAI();
client.login(token).catch(reason => { console.log(reason); process.exit(0); });