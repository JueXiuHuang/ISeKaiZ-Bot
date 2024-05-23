const { profession, retryCount } = require('./config.json');
const { ProfState } = require('./player')

function successCallback() { }

// @param {Player} player
function professionRoutine(player) {
  if (player.channel === null) return;
  if (profession === 'none') return;

  if (player.profMsg === null) {
    player.channel.send('$' + profession);
    return;
  }

  if (player.ps === ProfState.Idle && player.pc > retryCount) {
    player.profMsg = null;
    player.channel.send('$' + profession);
    return;
  }

  if (player.ps === ProfState.Idle) {
    try {
      player.profMsg.clickButton({ X: 0, Y: 0 })
        .then(successCallback)
        .catch(err => {
          console.log('--------------------------------');
          console.log('click profession button fail');
          console.log('Error message: ' + err.message);
          console.log(err);
          console.log('Add profession counter');
          player.pc += 1;
        });
    } catch (err) {
      console.log('PPP: Caught error:', err.message);
    }
    return;
  }

  if (player.ps === ProfState.Doing) {
    player.pc += 1;
    if (player.pc > retryCount) {
      console.log('Profession might stuck, force finish...');
      player.ps = ProfState.Idle;
    }
    return;
  }
}

module.exports = { professionRoutine };