const { treasureHunter = false, treasureGuild = '' } = require('./config.json');

function successCallback() { }

function checkTreasure(message) {
  if (treasureGuild === '' || !treasureHunter) return;
  if (message.guildId != treasureGuild) return;
  let desc = 'empty_description';
  let title = 'empty_title';
  if (message.embeds.length > 0) {
    if (message.embeds[0].title != null) title = message.embeds[0].title;
    if (message.embeds[0].description != null) desc = message.embeds[0].description;
  }

  if (title.includes('Chest Spawned!')) {
    console.log('Try to get treasure')
    try {
      message.clickButton({ X: 0, Y: 0 })
        .then(successCallback)
        .catch(err => {
          console.log('--------------------------------');
          console.log('Claim chest fail');
          console.log(err);
        })
    } catch (err) {
      console.log(err);
    }

  }
}

module.exports = { checkTreasure };