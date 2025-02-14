const { States } = require('./player');
const { logger } = require('./log');

function isVerify(...args) {
  for (var i = 0; i < args.length; i++) {
    if (args[i] === States.NeedVerify) {
      return true;
    }

    if (args[i] === States.Verifying) {
      return true;
    }
  }
  return false;
}

function messageExtractor(message) {
  let author = message.author.id
  let mentions = message.mentions
  let title = message.embeds[0]?.title ?? 'empty_embed_title';
  let desc = message.embeds[0]?.description ?? 'empty_description';
  let embedMention = message.embeds[0]?.author?.name ?? 'empty_embed_mention_usr_name';
  let content = message.content;

  return [author, mentions, title, desc, embedMention, content]
}

async function delayer(minDelayMs, maxDelayMs, detail) {
  const waitMs = ms => new Promise(resolve => setTimeout(resolve, ms));

  detail = detail ?? ''
  const randomDelayMs = Math.floor(Math.random() * (maxDelayMs - minDelayMs)) + minDelayMs;
  logger(`Delay: ${randomDelayMs} ms ${detail}`);
  await waitMs(randomDelayMs);
}

function makeHash() {
  let length = 5;
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

module.exports = { isVerify, messageExtractor, delayer, makeHash };