const { Client } = require('discord.js-selfbot-v13');
const { token, channelId, profession, delayMs, retryCount, captchaModel } = require('./config.json');
const CaptchaAI = require('./captcha').CaptchaAI

const client = new Client();

let captchaAI;
const initCaptchaAI = async function(){
  captchaAI = await new CaptchaAI(captchaModel);
};

const BattleState = {
  InBattle: "in_battle",
  Defeat: "defeat",
  Victory: "victory",
  NeedVerify: "need_verify",
  Verifying: "verifying"
}

const ProfState = {
  Doing: "doing",
  Finish: "finish",
  NeedVerify: "need_verify",
  Verifying: "verifying"
}

let globalBattelState = BattleState.Victory;
let globalProfState = ProfState.Finish;
let lastBattleMsg = null;
let lastProfMsg = null;
let battleCounter = 0;
let profCounter = 0;
let channel = null;
let verifyImg = null;

function successCallback(result) { }

function battleFailureCallback(error) {
  battleCounter += 1;
  if (battleCounter > retryCount) {
    console.log('(Battle) click button time out...');
  }
}

function professionFailureCallback(error) {
  profCounter += 1;
  if (profCounter > retryCount) {
    console.log('(Profession) click button time out...')
  }
}

setInterval(async () => {
  if (channel === null) return;
  console.log('Current battle state: ' + globalBattelState);
  console.log('Current profession state: ' + globalProfState);
  if (globalBattelState === BattleState.NeedVerify || globalProfState === ProfState.NeedVerify) {
    console.log('Try to solve verify');
    channel.send('$verify');
    return;
  };
  
  if (globalBattelState === BattleState.Verifying || globalProfState === ProfState.Verifying) {
    result = await captchaAI.predict(verifyImg.url);
    console.log('Verify Result: ' + result);
    channel.send(result);
    return;
  }

  if (lastBattleMsg != null) {
    if (globalBattelState === BattleState.Victory && battleCounter > retryCount) {
      lastBattleMsg = null;
      channel.send('$map');
    } else if (globalBattelState === BattleState.Victory) {
      try {
        lastBattleMsg.clickButton({ X: 0, Y: 0 }).then(successCallback, battleFailureCallback);
      } catch (e) {
        console.log('Error message: ' + e.message);
        console.log(e);
        console.log('Add battleCounter');
        battleCounter++;
      }
    } else if (globalBattelState === BattleState.InBattle) {
      battleCounter += 1;
      if (battleCounter > retryCount) {
        console.log('Battle might stuck...');
      }
    }
  } else {
    channel.send('$map');
  }

  if (lastProfMsg != null && profession != 'none') {
    if (globalProfState === ProfState.Finish && profCounter > retryCount) {
      lastProfMsg = null;
      channel.send('$' + profession);
    } else if (globalProfState === ProfState.Finish) {
      try {
        lastProfMsg.clickButton({ X: 0, Y: 0 }).then(successCallback, professionFailureCallback);
      } catch (e) {
        console.log('Error message: ' + e.message);
        console.log(e);
        console.log('Add profCounter');
        profCounter++;
      }
    } else if (globalProfState === ProfState.Doing) {
      profCounter += 1;
      if (profCounter > retryCount) {
        console.log('Profession might stuck...');
      }
    }
  } else if (profession != 'none') {
    channel.send('$' + profession);
  }
}, delayMs);

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
})

client.on('messageCreate', async (message) => {
  if (message.channelId != channelId) return;
  if (message.author.username != 'Isekaid' && message.author.username != client.user.username) return;

  let embedTitle = 'empty_embed_title';
  let description = 'empty_description';
  let content = message.content;

  if (message.embeds.length > 0) {
    if (message.embeds[0].title != null) embedTitle = message.embeds[0].title;
    if (message.embeds[0].description != null) description = message.embeds[0].description;
  }

  if (content === '!start') {
    channel = message.channel;
    globalBattelState = BattleState.Victory;
    globalProfState = ProfState.Finish;
    console.log('>>>BOT start<<<')
    return;
  }

  if (content === '!stop') {
    channel = null;
    lastBattleMsg = null;
    lastProfMsg = null;
    globalBattelState = BattleState.Victory;
    globalProfState = ProfState.Finish;
    console.log('>>>BOT stop<<<')
    return;
  }

  if (description === 'You don\'t have enough energy to battle!') {
    console.log('>>>BOT stop due to no energy<<<');
    channel = null;
    lastBattleMsg = null;
    lastProfMsg = null;
    globalBattelState = BattleState.Victory;
    globalProfState = ProfState.Finish;
    return;
  }
  
  verifyHandler(description, message)
  mapHandler(embedTitle, content, message);
  professionHandler(embedTitle, message);
})

function verifyHandler(description, message) {
  if (description.includes('Please complete the captcha')) {
    console.log('You need to solve captcha...');
    console.log('>>>BOT stop due to verify<<<');
    globalBattelState = BattleState.NeedVerify;
    globalProfState = ProfState.NeedVerify;
    lastBattleMsg = null;
    lastProfMsg = null;
    return;
  }

  if (description.includes('Please Try doing $verify again.')) {
    console.log('You need to solve captcha again...');
    globalBattelState = BattleState.NeedVerify;
    globalProfState = ProfState.NeedVerify;
    lastBattleMsg = null;
    lastProfMsg = null;
    return;
  }

  if (description.includes('Please enter the captcha code from the image to verify.')) {
    globalBattelState = BattleState.Verifying;
    globalProfState = ProfState.Verifying;
    verifyImg = message.embeds[0].image;
  }

  if (description.includes('Successfully Verified.')) {
    console.log('You finish the captcha, back to work...');
    console.log('>>>BOT start due to verify finished<<<')
    globalBattelState = BattleState.Victory;
    globalProfState = ProfState.Finish;
    channel = message.channel;
    return;
  }
}

function mapHandler(title, content, message) {
  if (title.includes('Current Location:')) {
    console.log('Open new battle window');
    // console.log('reset globalBattleCounter since create new battle msg');
    globalBattelState = BattleState.Victory;
    battleCounter = 0;
    if (lastBattleMsg === null) {
      lastBattleMsg = message;
    }

    return;
  }

  if (title.includes('You Defeated A')) {
    // console.log('reset globalBattleCounter since battle end normally');
    globalBattelState = BattleState.Victory;
    battleCounter = 0;
    return;
  }

  if (title.includes('BATTLE STARTED')) {
    // console.log('reset globalBattleCounter since battle start normally');
    globalBattelState = BattleState.InBattle;
    battleCounter = 0;
    return;
  }

  if (title.includes('Better Luck Next Time!')) {
    // console.log('reset globalBattleCounter since defeat');
    globalBattelState = BattleState.Defeat;
    battleCounter = 0;
    return;
  }

  if (content.includes('You are already in a battle')) {
    console.log('------------IN BATTL------------');
    console.log('Battle Counter: ' + battleCounter);
    console.log('Battle State: ' + globalBattelState);
    console.log('------------IN BATTL------------')
    if (battleCounter > retryCount || globalBattelState == BattleState.Victory) {
      console.log('try to leave battle...');
      try {
        message.clickButton({ X: 0, Y: 0 }).then(successCallback, battleFailureCallback);
      } catch (err) {
        console.log('Error message: ' + e.message);
        console.log(err);

      }
    }

    return;
  }

  if (content.includes('You are already')) {
    console.log('------------IN PROFESSION------------');
    console.log('Profession Counter: ' + profCounter);
    console.log('Profession State: ' + globalProfState);
    console.log('------------IN PROFESSION------------');
    if (profCounter > retryCount || globalProfState == ProfState.Finish) {
      console.log('try to leave profession...');
      try {
        message.clickButton({ X: 0, Y: 0 }).then(successCallback, professionFailureCallback);
      } catch (err) {
        console.log('Error message: ' + e.message);
        console.log(err);
      }
    }

    return;
  }
}

function professionHandler(title, message) {
  if (title === 'Mining' || title == 'Fishing' || title === 'Foraging') {
    console.log('Open new profession window');
    console.log('Reset profCounter since new window');
    globalProfState = ProfState.Finish;
    profCounter = 0;
    if (lastProfMsg === null) lastProfMsg = message;
    return;
  }

  if (title === 'You started mining!') {
    console.log('Profession start (Mine)');
    console.log('Reset profCounter since action start');
    globalProfState = ProfState.Doing;
    profCounter = 0;
    return;
  }
  if (title === 'You cast your rod!') {
    console.log('Profession start (Fish)');
    console.log('Reset profCounter since action start');
    globalProfState = ProfState.Doing;
    profCounter = 0;
    return;
  }
  if (title === 'You start foraging!') {
    console.log('Profession start (Forage)');
    console.log('Reset profCounter since action start');
    globalProfState = ProfState.Doing;
    profCounter = 0;
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
    console.log('Reset profCounter since prof finish');
    globalProfState = ProfState.Finish;
    profCounter = 0;
    return;
  }

  if (embedTitle.includes('Mining Complete!')) {
    console.log('Profession finish (Mine)');
    console.log('Reset profCounter since prof finish');
    globalProfState = ProfState.Finish;
    profCounter = 0;
    return;
  }

  if (embedTitle.includes('You found a')) {
    console.log('Profession finish (Forage)');
    console.log('Reset profCounter since prof finish');
    globalProfState = ProfState.Finish;
    profCounter = 0;
    return;
  }
})

initCaptchaAI();
client.login(token);