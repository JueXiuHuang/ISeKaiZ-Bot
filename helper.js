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
  let author = message?.author?.id ?? ''
  let mentions = message?.mentions ?? {};
  let embed = message?.embeds[0] ?? {};
  let title = embed?.title ?? '';
  let desc = embed?.description ?? '';
  let embedMention = embed?.author?.name ?? '';
  let content = message?.content ?? '';
  let id = message?.id ?? ''
  // [{"value":"You gained an additional **Intelligence** point!","name":"Racial Bonus: Elf","inline":true}]
  let fields = embed?.fields ?? [];

  let data = {
    'id': id,
    'author': author,
    'ref': mentions,
    'title': title,
    'desc': desc,
    'embRef': embedMention,
    'content': content,
    'fields': fields,
  }

  return data
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