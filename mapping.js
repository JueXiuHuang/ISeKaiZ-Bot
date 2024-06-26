const { retryCount } = require('./config.json');
const { BattleState } = require('./player')

function successCallback() { }

// @param {Player} player
function mappingRoutine(player) {
  if (player.channel === null) return;
  if (player.battleMsg === null) {
    player.channel.send('$map');
    return;
  }

  if (player.bs === BattleState.Idle && player.bc > retryCount) {
    player.battleMsg = null;
    player.channel.send('$map');
    return;
  }

  if (player.bs === BattleState.Idle) {
    try {
      player.battleMsg.clickButton({ X: 0, Y: 0 })
        .then(successCallback)
        .catch(err => {
          console.log('--------------------------------');
          console.log('click battle button fail');
          console.log('Error message: ' + err.message);
          console.log(err);
          console.log('Add battle counter');
          player.bc += 1;
        });
    } catch (err) {
      console.log('MMM: Caught error:', err.message);
    }
    return;
  }

  if (player.bs === BattleState.InBattle) {
    player.bc += 1;
    if (player.bc > retryCount) {
      console.log('Battle might stuck, force finish...');
      player.bs = BattleState.Idle;
    }
    return;
  }
}

module.exports = { mappingRoutine };