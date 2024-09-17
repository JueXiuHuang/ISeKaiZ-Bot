const { treasureHunter = false, treasureGuild = '' } = require('./config.json');
const { messageExtractor, errorLogWrapper } = require('./helper');

function successCallback() { }

function checkTreasure(message) {
  if (treasureGuild === '' || !treasureHunter) return;
  if (message.guildId != treasureGuild) return;
  let [title, , ,] = messageExtractor(message);

  if (title.includes('Chest Spawned!')) {
    console.log('Try to get treasure')
    try {
      message.clickButton({ X: 0, Y: 0 })
        .then(successCallback)
        .catch(err => {
          logFunc = () => {
            console.log('Claim chest fail');
            console.log(err);
          };
          errorLogWrapper(logFunc);
        })
    } catch (err) {
      console.log(err);
    }

  }
}

module.exports = { checkTreasure };