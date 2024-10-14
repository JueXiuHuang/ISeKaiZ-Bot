const { States } = require('./player');
const { format } = require('date-fns');
const { zhTW } = require('date-fns/locale/zh-TW');

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

function errorLogWrapper(logFunc) {
  console.log('WWWWWWWW Error Block WWWWWWWW');
  const formattedDate = format(new Date(), 'yyyy/dd/MM HH:mm:ss', { locale: zhTW });
  console.log(formattedDate)
  logFunc();
  console.log('MMMMMMMM Error Block MMMMMMMM');
}

function logger(log, seperator=false, customSepStart=null, customSepEnd=null) {
  const sepStart = customSepStart ?? '---------------'
  const sepEdn = customSepEnd ?? '---------------'
  const formattedDate = format(new Date(), 'yyyy/dd/MM HH:mm:ss', { locale: zhTW });
  
  if (seperator) { console.log(sepStart) }
  
  if (typeof log === 'string') {
    console.log(`[${formattedDate}] ${log}`);
  } else if (typeof log === 'function') {
    console.log(`[${formattedDate}]`)
    log()
  }

  if (seperator) { console.log(sepEdn) }
}

function logWithTime(logFunc) {
  console.log('---------------')
  const formattedDate = format(new Date(), 'yyyy/dd/MM HH:mm:ss', { locale: zhTW });
  console.log(formattedDate)
  logFunc();
  console.log('---------------')
}

function getTimeString() {
  const formattedTime = format(new Date(), 'yyyy/dd/MM HH:mm:ss', { locale: zhTW });
  return formattedTime
}

module.exports = { isVerify, messageExtractor, delayer, errorLogWrapper, getTimeString, logger};