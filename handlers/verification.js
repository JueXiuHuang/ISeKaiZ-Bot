import { logger } from '../log.js';
import { States } from '../player.js';
import { Task, TaskType, getDefaultRank } from '../task manager.js';
import { handleError } from '../error.js';

// This combines the original emojiVerifier and parts of the main.js verifyHandler
export function handleVerification(ctrl, message, data, captchaAI) {
  // Emoji Verification
  if (data.desc.includes('Choose the correct option...')) {
    const X_emoji_id = '1284730320133951592';
    const emojiMap = {
      '1285099666912055359': 'Mine', '1284729698701541458': 'Fish',
      '1285094197271199774': 'Forage', '1285436059227783238': 'Battle'
    };

    let answerIndex = 0;
    let emojiType = 'Unknown';
    const buttons = message.components?.[0]?.components ?? [];

    for (const [index, button] of buttons.entries()) {
      if (button?.emoji?.id !== X_emoji_id) {
        answerIndex = index;
        emojiType = emojiMap[button?.emoji?.id] || 'Unknown';
        break;
      }
    }

    const tag = (emojiType === 'Battle') ? TaskType.EVB : TaskType.EVP;
    const timerKey = (emojiType === 'Battle') ? 'map' : 'prof';

    const taskFunc = () => new Promise((resolve, reject) => {
      message.clickButton({ X: answerIndex, Y: 0 })
        .then(() => resolve({}))
        .catch(err => {
          if (handleError(err, 'Verify emoji got error')) resolve({});
          else reject(err);
        });
    });

    const task = new Task(taskFunc, Date.now() + 30000, `emoji verify: ${emojiType}`, tag, getDefaultRank(tag));
    ctrl.addTask(task, timerKey);
    return true;
  }

  // Image Captcha and other verification steps
  if (data.embRef !== ctrl.player.username) return false;

  ctrl.player.battleMsg = null;
  ctrl.player.profMsg = null;

  if (data.desc.includes('Please complete the captcha')) {
    logger('>>>BOT BLOCKED - Manual Verification Required<<<');
    ctrl.updateState(States.Blocked);
    return true;
  }

  if (data.desc.includes('Please Try doing $verify again.')) {
    logger('Verification failed, trying again...');
    ctrl.verifyRecursion();
    return true;
  }

  if (data.desc.includes('Please enter the captcha code from the image to verify.')) {
    logger('>>>BOT BLOCKED - Image Captcha<<<');
    ctrl.player.verifyImg = message.embeds[0].image;
    ctrl.updateState(States.Blocked);

    const taskFunc = () => new Promise(resolve => {
      captchaAI.predict(ctrl.player.verifyImg.url)
        .then((result) => {
          logger(`Captcha AI Result: ${result}`);
          ctrl.player.channel?.send(result);
          resolve({});
        });
    });
    const task = new Task(taskFunc, Date.now() + 60000, 'send verify result', TaskType.Verify, getDefaultRank(TaskType.Verify));
    ctrl.addTask(task, 'verify');
    return true;
  }

  if (data.desc.includes('Successfully Verified.')) {
    logger('>>>VERIFICATION SUCCESSFUL - Resuming Bot<<<');
    ctrl.player.channel = message.channel;
    ctrl.updateState(States.Init);
    return true;
  }

  return false;
}
