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
const btGoldRegex = /You gained (\d+) Gold!/
const btIntRegex = /You gained an additional \*\*Intelligence\*\* point!/
const pfFishForageRegex = /You now have \*\*\d+\*\* ([a-zA-Z]+)!/
const pfMineRegex = / (\d+)x ([a-zA-Z]+) /g

function gainItemHandler(data) {
  for (const field of data['fields']) {
    let value = field['value'] ?? ''
    let name = field['name'];
    switch (true) {
      case btMeatRegex.test(value):
        let amount = value.match(btMeatRegex)?.[1] ?? '0';
        logger(gainItemLog(amount, "Meat"))
        break;
      case btIntRegex.test(value):
        logger(gainItemLog(1, "Int"));
        break;
      case pfFishForageRegex.test(value):
        let objName = value.match(pfFishForageRegex)?.[1] ?? 'Unknown'
        logger(gainItemLog(1, objName))
        break;
      case pfMineRegex.test(value) && name === 'Ores found':
        let results = [...value.matchAll(pfMineRegex)]
        for (j = 0; j < results.length; j++) {
          let amount = results[j]?.[1] ?? '0'
          let objName = results[j]?.[2] ?? 'Unknown'
          logger(gainItemLog(amount, objName))
        }
        break;
    }
  }

  let desc = data['desc'].replaceAll(',', '');
  desc = desc.replaceAll('*', '')
  if (btGoldRegex.test(desc)) {
    let amount = desc.match(btGoldRegex)?.[1] ?? '0';
    logger(gainItemLog(amount, "Gold"))
  }
}

module.exports = { errorLogWrapper, logger, getTimeString, formatTimeString, gainItemHandler };