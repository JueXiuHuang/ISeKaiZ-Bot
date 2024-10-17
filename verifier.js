const { errorLogWrapper } = require('./log');
const { Task } = require('./controller');


async function emojiVerifier(ctrl, message) {
  const X_emoji_id = '1284730320133951592';
  const emojiMap = {
    '1285099666912055359': 'Mine',
    '1284729698701541458': 'Fish',
    '1285094197271199774': 'Forage',
    '1285436059227783238': 'Battle'
  };

  let answer = 0;
  let emoji = 'Unknown';

  let buttons = message.components?.[0]?.components ?? [];
  for (const [index, button] of buttons.entries()) {
    const emojiID = button?.emoji?.id ?? 'unknown';
    if (emojiID !== X_emoji_id) {
      answer = index;
      emoji = emojiMap[emojiID] || 'Unknown';
      break;
    }
  }

  const taskFunc = async () => {
    try {
      await message.clickButton({ X: answer, Y: 0 })
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
  const expireAt = Date.now() + 30000;
  const task = new Task(taskFunc, expireAt, `emoji verify: ${emoji}`, 'EmojiVerify');
  ctrl.addTask(task)
}

module.exports = { emojiVerifier };