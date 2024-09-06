const { isVerify } = require('./helper');

function successCallback() { }

const delay = (delayInMs) => {
  return new Promise(resolve => setTimeout(resolve, delayInMs));
};

function retainerRoutine(player) {
  if (player.channel === undefined) return;
  if (isVerify(player.bs) || isVerify(player.ps)) return;

  player.channel.send('$hired');
}

async function retainerHandler(message, desc, oldDesc) {
  regex = /Time elapsed: \d hours\sMaterials produced:/g
  
  if (desc.match(regex)) {
    // retainer should stop at last page automatically
    // this is just prevent infinite loop
    if (desc === oldDesc) {
      console.log('Last page');
      return;
    }
    await delay(10000);
    console.log('Try to collect material')
    message.clickButton({ X: 2, Y: 0 })
      .then(() => {
        console.log('Harvest material success');
        return message.clickButton({ X: 1, Y: 0 });
      })
      .then(() => {
        console.log('Turn to next page success');
      })
      .catch(err => {
        console.log('--------------------------------');
        console.log('Collect retainer material fail');
        console.log(err);
      })
  }
}

module.exports = { retainerRoutine, retainerHandler };