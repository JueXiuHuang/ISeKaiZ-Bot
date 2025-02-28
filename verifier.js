const { handleError } = require('./error');
const { Task, TaskType, getDefaultRank } = require('./controller');
const { makeHash } = require('./helper');
const { States } = require('./player')


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

  let hashKey = '';
  let state = ''
  let tag = 'Unknown';
  if (emoji === 'Battle') {
    hashKey = 'bhash';
    state = 'bs'
    tag = TaskType.EVB;
  } else {
    hashKey = 'phash';
    state = 'ps'
    tag = TaskType.EVP;
  }

  const taskFunc = () => new Promise((resolve, reject) => {
    let hash = message?.id ?? ''
    message.clickButton({ X: answer, Y: 0 })
      .then(() => {
        resolve({ [hashKey]: hash });
      })
      .catch((err) => {
        if (handleError(err, 'Verify emoji got error')) {
          resolve({ [hashKey]: hash, [state]: States.Normal });
        } else {
          reject(err);
        }
      })
  })
  const expireAt = Date.now() + 30000;
  let rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, `emoji verify: ${emoji}`, tag, rank);
  ctrl.addTask(task);
}

module.exports = { emojiVerifier };