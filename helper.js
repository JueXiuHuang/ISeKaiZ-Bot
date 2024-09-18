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

async function delayer(minDelayMs, maxDelayMs, detail) {
  const waitMs = ms => new Promise(resolve => setTimeout(resolve, ms));

  detail = detail ?? ''
  const randomDelayMs = Math.floor(Math.random() * (maxDelayMs - minDelayMs)) + minDelayMs;
  console.log(`Delay: ${randomDelayMs} ms ${detail}`);
  await waitMs(randomDelayMs);
}

async function emojiVerifier(message) {
  await delayer(2000, 4000, '(emoji verify)');
  const X_emoji_id = '1284730320133951592';
  let answer = 0;

  let buttons = message.components?.[0]?.components ?? [];
  for (let i = 0; i < buttons.length; ++i) {
    if (buttons[i]?.emoji?.id != X_emoji_id) {
      answer = i;
      break;
    }
  }

  try {
    message.clickButton({ X: answer, Y: 0 })
      .catch((err) => {
        logFunc = () => {
          console.log('Verify emoji got error');
          console.log(err);
        };
        errorLogWrapper(logFunc);
      })
  } catch (err) {
    console.log(err);
  }
}

function errorLogWrapper(logFunc) {
  console.log('WWWWWWWW Error Block WWWWWWWW');
  logFunc();
  console.log('MMMMMMMM Error Block MMMMMMMM');
}

module.exports = { isVerify, messageExtractor, delayer, emojiVerifier, errorLogWrapper };