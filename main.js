const { Client } = require('discord.js-selfbot-v13');
const { token, channelId, delayMs, retryCount, captchaModel } = require('./config.json');
const CaptchaAI = require('./captcha').CaptchaAI;
const { Player, BattleState, ProfState } = require('./player');
const { professionRoutine } = require('./profession');
const { mappingRoutine } = require('./mapping');
const { checkTreasure } = require('./treasure');
const { retainerRoutine, retainerHandler } = require('./retainer');
const { foodRoutine } = require('./food');
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

async function shortRoutineScript() {
  console.log(`B: ${player.bs} | P: ${player.ps}`);
  if (player.bs === BattleState.NeedVerify || player.ps === ProfState.NeedVerify) {
    console.log('Try to solve verify');
    player.channel.send('$verify');
    return;
  }

  if (player.bs === BattleState.Verifying || player.ps === ProfState.Verifying) {
    result = await captchaAI.predict(player.verifyImg.url);
    console.log('Verify Result: ' + result);
    player.channel.send(result);
    return;
  }

  mappingRoutine(player);
  professionRoutine(player);
}

async function twoHrRoutineScript() {
  console.log('Do scheduling task');
  retainerRoutine(player.channel);
}

async function threeHrRoutineScript() {
  console.log('Try to eat exp food');
  foodRoutine(player.channel);
}

setInterval(shortRoutineScript, delayMs);
setInterval(twoHrRoutineScript, 2 * 60 * 60 * 1000 + 30 * 1000);
setInterval(threeHrRoutineScript, 3 * 60 * 60 * 1000);

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
    retainerRoutine(cacheChannel);
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

  let embedTitle = 'empty_embed_title';
  let description = 'empty_description';
  let mention = 'empty_mention';
  let content = message.content;

  if (message.embeds.length > 0) {
    if (message.embeds[0].title != null) embedTitle = message.embeds[0].title;
    if (message.embeds[0].description != null) description = message.embeds[0].description;
    if (message.embeds[0].author != null) mention = message.embeds[0].author.name;
  }

  if (content === '!start') {
    player.channel = message.channel;
    player.bs = BattleState.Idle;
    player.ps = ProfState.Idle;
    console.log('>>>BOT start<<<')
    return;
  }

  if (content === '!stop') {
    player.channel = null;
    player.battleMsg = null;
    player.profMsg = null;
    player.bs = BattleState.Idle;
    player.ps = ProfState.Idle;
    console.log('>>>BOT stop<<<');
    return;
  }

  if (description === 'You don\'t have enough energy to battle!') {
    console.log('>>>BOT stop due to no energy<<<');
    player.channel = null;
    player.battleMsg = null;
    player.profMsg = null;
    player.bs = BattleState.Idle;
    player.ps = ProfState.Idle;
    return;
  }

  if (embedTitle === 'Suspended') {
    console.log('>>>YOU GOT BANNED<<<')
    player.channel = null;
    player.battleMsg = null;
    player.profMsg = null;
    player.bs = BattleState.Idle;
    player.ps = ProfState.Idle;
    return;
  }

  verifyHandler(message, description, mention, client.user.username);
  retainerHandler(message, description);
  mapHandler(embedTitle, content, message);
  professionHandler(embedTitle, message);
})

function verifyHandler(message, description, mention, user) {
  if (description.includes('Please complete the captcha')) {
    if (mention != user) return;
    console.log('>>>BOT stop due to verify<<<');
    player.bs = BattleState.NeedVerify;
    player.ps = ProfState.NeedVerify;
    player.battleMsg = null;
    player.profMsg = null;
    return;
  }

  if (description.includes('Please Try doing $verify again.')) {
    console.log('You need to solve captcha again...');
    player.bs = BattleState.NeedVerify;
    player.ps = ProfState.NeedVerify;
    player.battleMsg = null;
    player.profMsg = null;
    return;
  }

  if (description.includes('Please enter the captcha code from the image to verify.')) {
    player.bs = BattleState.Verifying;
    player.ps = ProfState.Verifying;
    player.verifyImg = message.embeds[0].image;
  }

  if (description.includes('Successfully Verified.')) {
    console.log('>>>BOT start due to verify finished<<<');
    player.bs = BattleState.Idle;
    player.ps = ProfState.Idle;
    player.channel = message.channel;
    return;
  }
}

function mapHandler(title, content, message) {
  if (title.includes('Current Location:')) {
    console.log('Open new battle window');
    player.bs = BattleState.Idle;
    player.bc = 0;
    player.battleMsg = message;

    return;
  }

  if (title.includes('You Defeated A')) {
    console.log('Battle finish');
    player.bs = BattleState.Idle;
    player.bc = 0;
    return;
  }

  if (title.includes('BATTLE STARTED')) {
    console.log('Battle start');
    player.bs = BattleState.InBattle;
    player.bc = 0;
    return;
  }

  if (title.includes('Better Luck Next Time!')) {
    player.bs = BattleState.Defeat;
    player.bc = 0;
    return;
  }

  if (content.includes('You are already in a battle')) {
    console.log('------------IN BATTL------------');
    console.log('Battle Counter: ' + player.bc);
    console.log('Battle State: ' + player.bs);
    console.log('------------IN BATTL------------');
    if (player.bc > retryCount || player.bs == BattleState.Idle) {
      console.log('try to leave battle...');
      try {
        message.clickButton({ X: 0, Y: 0 })
          .then(successCallback)
          .catch(err => {
            console.log('--------------------------------');
            console.log('Leave battle got error');
            console.log(err);
          })
      } catch (err) {
        console.log('AAA: Error message: ' + err.message);
        console.log(err);
      }
    }

    return;
  }

  if (content.includes('You are already')) {
    console.log('------------IN PROFESSION------------');
    console.log('Profession Counter: ' + player.pc);
    console.log('Profession State: ' + player.ps);
    console.log('------------IN PROFESSION------------');
    if (player.pc > retryCount || player.ps == ProfState.Idle) {
      console.log('try to leave profession...');
      try {
        message.clickButton({ X: 0, Y: 0 })
          .then(successCallback)
          .catch(err => {
            console.log('--------------------------------');
            console.log('Leave profession got error');
            console.log(err);
          })
      } catch (err) {
        console.log('BBB: Error message: ' + err.message);
        console.log(err);
      }
    }

    return;
  }
}

function professionHandler(title, message) {
  if (title === 'Mining' || title == 'Fishing' || title === 'Foraging') {
    console.log('Open new profession window');
    player.ps = ProfState.Idle;
    player.pc = 0;
    player.profMsg = message;
    return;
  }

  if (title === 'You started mining!') {
    console.log('Profession start (Mine)');
    player.ps = ProfState.Doing;
    player.pc = 0;
    return;
  }
  if (title === 'You cast your rod!') {
    console.log('Profession start (Fish)');
    player.ps = ProfState.Doing;
    player.pc = 0;
    return;
  }
  if (title === 'You start foraging!') {
    console.log('Profession start (Forage)');
    player.ps = ProfState.Doing;
    player.pc = 0;
    return;
  }
}

client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (newMsg.channelId != channelId) return;
  if (newMsg.author.username != 'Isekaid') return;

  let embedTitle = 'empty_embed_title';

  if (newMsg.embeds.length > 0) {
    if (newMsg.embeds[0].title != null) embedTitle = newMsg.embeds[0].title;
  }

  if (embedTitle.includes('You caught a')) {
    console.log('Profession finish (Fish)');
    player.ps = ProfState.Idle;
    player.pc = 0;
    return;
  }

  if (embedTitle.includes('Mining Complete!')) {
    console.log('Profession finish (Mine)');
    player.ps = ProfState.Idle;
    player.pc = 0;
    return;
  }

  if (embedTitle.includes('You found a')) {
    console.log('Profession finish (Forage)');
    player.ps = ProfState.Idle;
    player.pc = 0;
    return;
  }
})

initCaptchaAI();
client.login(token).catch(reason => { console.log(reason); process.exit(0); });