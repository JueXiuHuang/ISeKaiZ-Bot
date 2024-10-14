const { errorLogWrapper } = require('./log');
const { Task } = require('./controller');


async function emojiVerifier(ctrl, message) {
  const X_emoji_id = '1284730320133951592';
  let answer = 0;

  let buttons = message.components?.[0]?.components ?? [];
  for (let i = 0; i < buttons.length; ++i) {
    if (buttons[i]?.emoji?.id != X_emoji_id) {
      answer = i;
      break;
    }
  }

  const taskFunc = () => {
    try {
      message.clickButton({ X: answer, Y: 0 })
        .catch((err) => {
          logFunc = () => {
            console.log('Verify emoji got error');
            console.log(err);
          };
          errorLogWrapper(logFunc);
        })
    } catch (err) {
      console.log(err);
    }
    return {};
  };
  const expireAt = Date.now() + 5000;
  const task = new Task(taskFunc, expireAt, 'emoji verify');
  ctrl.addTask(task)
}

module.exports = { emojiVerifier };