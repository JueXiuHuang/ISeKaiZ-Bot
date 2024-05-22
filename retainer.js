function successCallback() {}

function retainerRoutine(player) {
  if (player.channel === null) return;

  player.channel.send('$hired');
}

function retainerHandler(message, desc) {
  regex = /Time elapsed: \d hours\sMaterials produced:/g
  if (desc.match(regex)) {
    console.log('Try to collect material')
    try {
      message.clickButton({ X: 0, Y: 0 })
        .then(successCallback)
        .catch(err => {
          console.log('--------------------------------');
          console.log('Collect retainer material fail');
          console.log(err);
        })
    } catch (err) {
      console.log('Retainer: Error message: ' + err.message);
      console.log(err);
    }
  }
}

module.exports = { retainerRoutine, retainerHandler };