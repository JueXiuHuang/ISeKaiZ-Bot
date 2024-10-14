const { format } = require('date-fns');
const { zhTW } = require('date-fns/locale/zh-TW');

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

function getTimeString() {
  const formattedTime = format(new Date(), 'yyyy/dd/MM HH:mm:ss', { locale: zhTW });
  return formattedTime
}

function formatTimeString(date) {
  const formattedTime = format(date, 'yyyy/dd/MM HH:mm:ss', { locale: zhTW });
  return formattedTime
}

module.exports = { errorLogWrapper, logger, getTimeString, formatTimeString };