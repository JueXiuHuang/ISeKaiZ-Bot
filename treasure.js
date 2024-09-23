const { treasureHunter = false, treasureGuild = '' } = require('./config.json');
const { Task } = require('./controller');
const { messageExtractor, errorLogWrapper } = require('./helper');

function checkTreasure(ctrl, message) {
  if (treasureGuild === '' || !treasureHunter) return;
  if (message.guildId != treasureGuild) return;
  let [title, , ,] = messageExtractor(message);

  if (title.includes('Chest Spawned!')) {
    console.log('Try to get treasure')
    const taskFunc = () => {
      try {
        message.clickButton({ X: 0, Y: 0 })
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
      return {};
    };
    const expireAt = Date.now() + 10;
    const task = new Task(taskFunc, expireAt, 'collect treasure');
    ctrl.addTask(task);
  }
}

module.exports = { checkTreasure };