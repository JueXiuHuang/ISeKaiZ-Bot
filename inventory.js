const { sellEquip = ['F', 'E', 'D'] } = require('./config.json');
const { Task, TaskType, getDefaultRank } = require('./controller');
const { isVerify } = require('./helper');

async function inventoryRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;
  if (isVerify(ctrl.player['bs'], ctrl.player['ps'])) return;

  ctrl.player['sell'] = 0;
  const taskFunc = () => new Promise(resolve => {
    ctrl.player['channel']?.send(`$sell equipment all ${sellEquip[ctrl.player['sell']]}`);
    resolve({})
  })
  const expireAt = Date.now() + 120000;
  const tag = TaskType.Inv;
  let rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, 'Sell equipment', tag, rank);
  ctrl.addTask(task);
}

function inventoryHandler(ctrl, title, desc) {
  if (!title.includes('Equipment Sold')) {
    return;
  }

  const re = /You gained (\d+) gold!/;
  desc = desc.replace(',', '');
  const gold = desc.match(re)[1];
  if (gold.length < 5) {
    ctrl.player['sell'] += 1;
  }

  if (ctrl.player['sell'] >= sellEquip.length) return;
  const taskFunc = () => new Promise(resolve => {
    ctrl.player['channel']?.send(`$sell equipment all ${sellEquip[ctrl.player['sell']]}`);
    resolve({})
  })
  const expireAt = Date.now() + 120000;
  const tag = TaskType.Inv;
  let rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, 'Sell equipment', tag, rank);
  ctrl.addTask(task);
}

module.exports = { inventoryRoutine, inventoryHandler };