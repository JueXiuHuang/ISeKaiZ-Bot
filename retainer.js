const { isVerify } = require('./helper');
const { logger } = require('./log');
const { handleError } = require('./error');
const { Task, TaskType, getDefaultRank } = require('./controller');

function retainerRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;
  if (isVerify(ctrl.player['bs'], ctrl.player['ps'])) return;

  const taskFunc = () => {
    ctrl.player['channel']?.send('$hired');
    return [{}, true];
  };
  const expireAt = Date.now() + 20000;
  const tag = TaskType.Retainer;
  let rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, '$hired', tag, rank);
  ctrl.addTask(task);
}

async function retainerHandler(ctrl, message, desc, oldDesc) {
  regex = /Time elapsed: (\d) hours\sMaterials produced:/

  if (!regex.test(desc)) return;

  // retainer should stop at last page automatically
  // this is just prevent infinite loop
  // await delayer(5000, 10000, '(collect retainer)');
  const elapsed = desc.match(regex)?.[1] ?? '0';
  if (elapsed === '0') {
    const taskFunc = async () => {
      try {
        await message.clickButton({ X: 1, Y: 0 })
          .then(() => {
            logger('Turn to next page success');
          })
          .catch(err => {
            handleError(err, 'Turn to next page fail')
          })
      } catch (err) {
        console.log(err);
      }
      return [{}, true];
    };
    const expireAt = Date.now() + 20000;
    const tag = TaskType.Retainer;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, '$hired Next Page', tag, rank);
    ctrl.addTask(task);

    return;
  }

  logger('Try to collect material');
  const taskFunc = () => {
    try {
      message.clickButton({ X: 2, Y: 0 })
        .then(() => {
          logger('Harvest material success');
        })
        .catch(err => {
          handleError(err, 'Collect retainer material fail')
        })
    } catch (err) {
      console.log(err);
    }
    return [{}, true];
  };
  const expireAt = Date.now() + 20000;
  const tag = TaskType.Retainer;
  let rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, '$hired Collect', tag, rank);
  ctrl.addTask(task);
}

module.exports = { retainerRoutine, retainerHandler };