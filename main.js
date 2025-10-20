import { Client } from 'discord.js-selfbot-v13';
import { token, channelId, captchaModel } from './config.js';
import { CaptchaAI } from './services/captchaService.js';
import { newPlayer } from './player.js';
import { Controller } from './controller.js';
import { logger } from './log.js';
import { startRoutines } from './routines/schedule.js';
import { processMessageCreation, processMessageUpdate } from './handlers/messageHandler.js';

const args = process.argv.slice(2);
const client = new Client({ checkUpdate: false });

let captchaAI;

async function main() {
  try {
    captchaAI = await new CaptchaAI(captchaModel);
    logger('Captcha AI model loaded successfully.');
  } catch (error) {
    logger(`Fatal Error: Could not load Captcha AI model. ${error.message}`);
    process.exit(1);
  }

  const player = newPlayer();
  player.username = client.user?.username ?? "Bot"; // Store username for checks
  player.channelId = channelId;

  const ctrl = new Controller(player);

  client.on('ready', () => {
    let welcomeMsg = `
 _       __     __                        
 | |     / /__  / /________  ____ ___  ___ 
 | | /| / / _ \\/ / ___/ __ \\/ __ \`__ \\/ _ \\
 | |/ |/ /  __/ / /__/ /_/ / / / / / /  __/
 |__/|__/\\___/_/\\___/\\____/_/ /_/ /_/\\___/ 
        `;
    console.log(welcomeMsg);
    logger(`Logged in as ${client.user.username}`);

    startRoutines(ctrl);

    if (args.includes('--auto-start')) {
      logger('Auto-start activated.');
      const cacheChannel = client.channels.cache.get(channelId);
      if (cacheChannel) {
        ctrl.player.channel = cacheChannel;
        cacheChannel.send('!start');
      } else {
        logger(`Error: Could not find channel with ID: ${channelId}`);
      }
    }
  });

  client.on('messageCreate', (message) => {
    processMessageCreation(client, ctrl, message, captchaAI);
  });

  client.on('messageUpdate', (_, newMsg) => {
    if (newMsg.channelId !== channelId || newMsg.author.username !== 'Isekaid') return;
    processMessageUpdate(ctrl, newMsg);
  });

  client.login(token).catch(reason => {
    logger(`Failed to login: ${reason}`);
    ctrl.destroy();
    process.exit(1);
  });
}

main();
