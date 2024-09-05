const { isVerify } = require('./helper');

function successCallback() { }

function retainerRoutine(player) {
  if (player.channel === null) return;
  if (isVerify(player.bs) || isVerify(player.ps)) return;

  player.channel.send('$hired');
}

function retainerHandler(message, desc) {
  regex = /Time elapsed: \d hours\sMaterials produced:/g
  if (desc.match(regex)) {
    console.log('Try to collect material')
    message.clickButton({ X: 2, Y: 0 })
      .then(successCallback)
      .catch(err => {
        console.log('--------------------------------');
        console.log('Collect retainer material fail');
        console.log(err);
      })
  }
}

module.exports = { retainerRoutine, retainerHandler };