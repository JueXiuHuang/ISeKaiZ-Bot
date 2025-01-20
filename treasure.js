const { treasureHunter = false, treasureGuild = '' } = require('./config.json');
const { Task, TaskType, getDefaultRank } = require('./controller');
const { messageExtractor } = require('./helper');
const { handleError } = require('./error');

function checkTreasure(ctrl, message) {
  if (treasureGuild === '' || !treasureHunter) return;
  if (message.guildId != treasureGuild) return;
  let [title, , ,] = messageExtractor(message);

  if (title.includes('Chest Spawned!')) {
    console.log('Try to get treasure')
    const taskFunc = () => new Promise((resolve, reject) => {
      message.clickButton({ X: 0, Y: 0 })
        .then(() => { resolve({}); })
        .catch(err => {
          if (handleError(err, 'Claim chest fail')) {
            resolve({});
          } else {
            reject(err);
          }
        })
    })
    const expireAt = Date.now() + 10000;
    const tag = TaskType.Treasure;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'collect treasure', tag, rank);
    ctrl.addTask(task);
  }
}

module.exports = { checkTreasure };