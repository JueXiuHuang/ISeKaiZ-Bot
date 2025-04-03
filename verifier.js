const { handleError } = require('./error');
const { Task, TaskType, getDefaultRank } = require('./task manager');


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

  let tag = 'Unknown';
  let timerKey = 'Unknown';
  if (emoji === 'Battle') {
    tag = TaskType.EVB;
    timerKey = 'map';
  } else {
    tag = TaskType.EVP;
    timerKey = 'prof';
  }

  const taskFunc = () => new Promise((resolve, reject) => {
    message.clickButton({ X: answer, Y: 0 })
      .then(() => {
        resolve({});
      })
      .catch((err) => {
        if (handleError(err, 'Verify emoji got error')) {
          resolve({});
        } else {
          reject(err);
        }
      })
  })
  const expireAt = Date.now() + 30000;
  let rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, `emoji verify: ${emoji}`, tag, rank);
  ctrl.addTask(task, timerKey);
}

module.exports = { emojiVerifier };