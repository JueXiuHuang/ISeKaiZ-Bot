import { Client } from 'discord.js-selfbot-v13';
import { token, craftChannelId, craftMaterial, sellEquip } from './config.js';
import { logger } from './log.js';
import { messageExtractor } from './helper.js';

const craftQuantity = 30;
const craftInterval = 6000;
const sellInterval = 4000;

const StateStop = "Stop";
const StateRunning = "Running";
let BotState = StateStop;
let channel = null;
let SellCounter = 0;
const client = new Client();

function craftRoutine() {
  if (BotState === StateStop) return;

  channel?.send(`$craft ${craftMaterial} ${craftQuantity}`);
}

function sellRoutine() {
  if (BotState === StateStop) return;

  SellCounter = SellCounter % sellEquip.length;
  channel?.send(`$sell equipment all ${sellEquip[SellCounter]}`);
}

setInterval(craftRoutine, craftInterval);
setInterval(sellRoutine, sellInterval);

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
})

client.on('messageCreate', async (message) => {
  if (message.channelId !== craftChannelId) return;
  if (message.author.username !== 'Isekaid' && message.author.username !== client.user.username) return;

  let data = messageExtractor(message);

  if (data['content'] === '!start') {
    channel = message.channel;
    BotState = StateRunning;
    logger('>>>Start Craft!!<<<');
    return;
  }

  if (data['content'] === '!stop') {
    channel = null;
    BotState = StateStop;
    logger('>>>Stop Craft!!<<<');
    return;
  }

  if (verifyHandler(data, client.user.username)) {
    BotState = StateStop;
    logger('>>>Stop Craft (Verify)!!<<<');
    return;
  }

  const re = /You need \d+ pieces of [a-z]+ to craft \d+ items!/;
  if (re.test(data['desc'])) {
    BotState = StateStop;
    logger('>>>Stop Craft (Not Enough)!!<<<');
  }

  sellHandler(data);
})

function verifyHandler(data, user) {
  if (data['desc'].includes('Please complete the captcha')) {
    if (data['embRef'] !== user) return false;
    return true;
  }

  if (data['desc'].includes('Please Try doing $verify again.')) {
    return true;
  }

  if (data['desc'].includes('Please enter the captcha code from the image to verify.')) {
    return true;
  }

  if (data['desc'].includes('Successfully Verified.')) {
    return false;
  }
}

function sellHandler(data) {
  if (!data['title'].includes('Equipment Sold')) {
    return;
  }

  const re = /You gained (\d+) gold!/;
  let desc = data['desc'].replaceAll(',', '');
  const gold = desc.match(re)?.[1] ?? '0';
  if (parseInt(gold) < 100000) {
    SellCounter += 1;
  }
}

client.login(token).catch(reason => { console.log(reason); process.exit(0); });
