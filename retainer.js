const { isVerify, delayer, errorLogWrapper } = require('./helper');

function retainerRoutine(player) {
  if (player.channel === null) return;
  if (isVerify(player.bs) || isVerify(player.ps)) return;

  player.channel.send('$hired');
}

async function retainerHandler(message, desc, oldDesc) {
  let regex = /Time elapsed: (\d) hours\sMaterials produced:/

  if (!regex.test(desc)) return;

  // retainer should stop at last page automatically
  // this is just prevent infinite loop
  await delayer(5000, 10000, '(collect retainer)');
  const elapsed = desc.match(regex)?.[1] ?? '0';
  if (elapsed === '0') {
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
    return;
  }

  console.log('Try to collect material')
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

}

module.exports = { retainerRoutine, retainerHandler };