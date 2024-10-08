const { isVerify, delayer, errorLogWrapper } = require('./helper');
const { Task } = require('./controller');

function retainerRoutine(ctrl) {
  if (ctrl.player['channel'] === null) return;
  if (isVerify(ctrl.player['bs'], ctrl.player['ps'])) return;

  const taskFunc = () => {
    ctrl.player['channel']?.send('$hired');
    return {};
  };
  const expireAt = Date.now() + 10000;
  const task = new Task(taskFunc, expireAt, '$hired');
  ctrl.addTask(task);
}

async function retainerHandler(ctrl, message, desc, oldDesc) {
  regex = /Time elapsed: (\d) hours\sMaterials produced:/

  if (!regex.test(desc)) return;

  // retainer should stop at last page automatically
  // this is just prevent infinite loop
  await delayer(5000, 10000, '(collect retainer)');
  const elapsed = desc.match(regex)?.[1] ?? '0';
  if (elapsed === '0') {
    const taskFunc = () => {
      try {
        message.clickButton({ X: 1, Y: 0 })
          .then(() => {
            console.log('Turn to next page success');
          })
          .catch(err => {
            logFunc = () => {
              console.log('Turn to next page success');
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
    const task = new Task(taskFunc, expireAt, 'retainer trun to next page');
    ctrl.addTask(task);

    return;
  }

  console.log('Try to collect material')
  const taskFunc = () => {
    try {
      message.clickButton({ X: 2, Y: 0 })
        .then(() => {
          console.log('Harvest material success');
        })
        .catch(err => {
          logFunc = () => {
            console.log('Collect retainer material fail');
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
  const task = new Task(taskFunc, expireAt, 'retainer harvest');
  ctrl.addTask(task);
}

module.exports = { retainerRoutine, retainerHandler };