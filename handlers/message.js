import { handleCommand } from './command.js';
import { handleSystemMessage } from './system.js';
import { handleVerification } from './verification.js';
import { handleBattleMessage } from './battle.js';
import { handleProfessionMessage } from './profession.js';
import { handleInventory } from './inventory.js';
import { handleRetainerUpdate } from './retainer.js';
import { handleTreasure } from './treasure.js';
import { handleAutoLevel } from './autolevel.js';
import { parseCommands } from '../commands.js';
import { messageExtractor } from '../helper.js';

// The order of handlers in this array determines their priority.
const messageCreateHandlers = [
  handleCommand,
  handleSystemMessage,
  handleVerification, // Verification should be high priority
  handleAutoLevel,
  handleBattleMessage,
  handleProfessionMessage,
  handleInventory,
];

export async function processMessageCreation(client, ctrl, message, captchaAI) {
  const data = messageExtractor(message);

  // Treasure and custom commands can come from other guilds/channels
  if (handleTreasure(ctrl, message, data)) return;
  parseCommands(ctrl, message, client.user.id);

  // Core bot logic only for the designated channel and author
  if (message.channelId !== ctrl.player.channelId || (message.author.username !== 'Isekaid' && message.author.username !== client.user.username)) {
    return;
  }

  for (const handler of messageCreateHandlers) {
    if (handler(ctrl, message, data, captchaAI)) {
      break; // Stop processing if a handler has dealt with the message
    }
  }
}

export async function processMessageUpdate(ctrl, newMsg) {
  const newData = messageExtractor(newMsg);

  if (ctrl.player.isStopped()) return;

  // List of handlers for message updates
  if (handleProfessionMessage(ctrl, newMsg, newData, 'update')) return;
  if (handleRetainerUpdate(ctrl, newMsg, newData)) return;
}
