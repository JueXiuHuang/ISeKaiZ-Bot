const { States } = require('./player');

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
  let embedTitle = message.embeds[0]?.title ?? 'empty_embed_title';
  let embedDesc = message.embeds[0]?.description ?? 'empty_description';
  let mention = message.embeds[0]?.author?.name ?? 'empty_mention';
  let content = message.content;

  return [embedTitle, embedDesc, mention, content]
}

async function delayer(minDelayMs, maxDelayMs) {
  const waitMs = ms => new Promise(resolve => setTimeout(resolve, ms));

  const randomDelayMs = Math.floor(Math.random() * (maxDelayMs - minDelayMs)) + minDelayMs;
  console.log(`Delay: ${randomDelayMs} ms`);
  await waitMs(randomDelayMs);
}

function errorLogWrapper(logFunc) {
  console.log('WWWWWWWW Error Block WWWWWWWW');
  logFunc();
  console.log('MMMMMMMM Error Block MMMMMMMM');
}

module.exports = { isVerify, messageExtractor, delayer, errorLogWrapper };