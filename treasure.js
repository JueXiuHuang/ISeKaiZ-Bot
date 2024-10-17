const { treasureHunter = false, treasureGuild = '' } = require('./config.json');
const { Task, TaskType, getDefaultRank } = require('./controller');
const { messageExtractor } = require('./helper');
const { errorLogWrapper } = require('./log');

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
    const expireAt = Date.now() + 10000;
    const tag = TaskType.Treasure;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'collect treasure', tag, rank);
    ctrl.addTask(task);
  }
}

module.exports = { checkTreasure };