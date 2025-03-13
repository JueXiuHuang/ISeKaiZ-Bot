const { format } = require('date-fns');
const { zhTW } = require('date-fns/locale/zh-TW');

function errorLogWrapper(logFunc) {
  console.log('WWWWWWWW Error Block WWWWWWWW');
  const formattedDate = format(new Date(), 'yyyy/dd/MM HH:mm:ss', { locale: zhTW });
  console.log(formattedDate)
  logFunc();
  console.log('MMMMMMMM Error Block MMMMMMMM');
}

function logger(log, seperator = false, customSepStart = null, customSepEnd = null) {
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

function getTimeString() {
  const formattedTime = format(new Date(), 'yyyy/dd/MM HH:mm:ss', { locale: zhTW });
  return formattedTime
}

function formatTimeString(date) {
  const formattedTime = format(date, 'yyyy/dd/MM HH:mm:ss', { locale: zhTW });
  return formattedTime
}

function gainItemLog(amount, name) {
  return `You gained ${amount} {${name}}!!`
}

const btMeatRegex = /You got (\d+) meat :cut_of_meat:/
const goldRegex = /You gained (\d+) [Gg]old!/
const btIntRegex = /You gained an additional \*\*Intelligence\*\* point!/
const pfFishForageRegex = /You now have \*\*\d+\*\* ([a-zA-Z]+)!/
const pfMineRegex = / (\d+)x ([a-zA-Z]+) /g

function gainItemHandler(data) {
  for (const field of data['fields']) {
    let value = field['value'] ?? ''
    let name = field['name'] ?? '';
    let amount = '0'
    let objName = 'Unknown'
    switch (true) {
      case btMeatRegex.test(value):
        amount = value.match(btMeatRegex)?.[1] ?? '0';
        logger(gainItemLog(amount, "Meat"))
        break;
      case btIntRegex.test(value):
        logger(gainItemLog(1, "Int"));
        break;
      case pfFishForageRegex.test(value):
        objName = value.match(pfFishForageRegex)?.[1] ?? 'Unknown'
        logger(gainItemLog(1, objName))
        break;
      case pfMineRegex.test(value) && name === 'Ores found':
        let results = [...value.matchAll(pfMineRegex)]
        for (j = 0; j < results.length; j++) {
          amount = results[j]?.[1] ?? '0'
          objName = results[j]?.[2] ?? 'Unknown'
          logger(gainItemLog(amount, objName))
        }
        break;
    }
  }

  let desc = data['desc'].replaceAll(',', '');
  desc = desc.replaceAll('*', '')
  let amount = '0'
  switch (true) {
    case goldRegex.test(desc):
      amount = desc.match(goldRegex)?.[1] ?? '0';
      logger(gainItemLog(amount, "Gold"))
      break
  }
}

module.exports = { errorLogWrapper, logger, getTimeString, formatTimeString, gainItemHandler };