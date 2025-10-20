import { WebEmbed } from 'discord.js-selfbot-v13';
import { Task, TaskType, getDefaultRank } from './task manager.js';
import { trustUsr } from './config.js';
import { messageExtractor } from './helper.js';
import { logger } from './log.js';

export function parseCommands(ctrl, message, usrID) {
  let data = messageExtractor(message)
  if (data['ref'].everyone || !data['ref'].users.get(usrID)) {
    return
  }
  if (!trustUsr.includes(data['author'])) {
    return
  }

  let content = data['content'].toLowerCase();
  let regex;

  switch (true) {
    case content.includes('force bal'):
      handleForceBalance(ctrl, message);
      break;
    case content.includes('force donate'):
      regex = /force donate (\d+)/
      const amount = content.match(regex)?.[1] ?? '0';
      handleForceDonate(ctrl, message, amount);
      break;
    case content.includes('wban'):
      handleForceBan(ctrl, message);
    default:
      return;
  }
}

function handleForceBalance(ctrl, message) {
  const msg = '$bal'
  if (ctrl) {
    const taskFunc = () => new Promise(resolve => {
      message.reply(msg)
      resolve({});
    })
    const expireAt = Date.now() + 180000;
    const tag = TaskType.Cmd;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'Force Bal', tag, rank);
    ctrl.addTask(task);
  } else {
    logger('No controller, directly reply message');
    message.reply(msg)
  }
}

function handleForceDonate(ctrl, message, amount) {
  const msg = `$guild donate ${amount}`
  if (ctrl) {
    const taskFunc = () => new Promise(resolve => {
      message.reply(msg)
      resolve({});
    })
    const expireAt = Date.now() + 180000;
    const tag = TaskType.Cmd;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'Force Donate', tag, rank);
    ctrl.addTask(task);
  } else {
    logger('No controller, directly reply message');
    message.reply(msg)
  }
}

let banImgs = [
  'https://cdn.frankerfacez.com/emoticon/366484/4', // bear in jail
  'https://stickershop.line-scdn.net/stickershop/v1/sticker/424099554/android/sticker.png',
  'https://stickershop.line-scdn.net/stickershop/v1/sticker/494995927/android/sticker.png',
  'https://stickershop.line-scdn.net/stickershop/v1/sticker/494995929/android/sticker.png',
  'https://stickershop.line-scdn.net/stickershop/v1/sticker/494995935/android/sticker.png',
  'https://stickershop.line-scdn.net/stickershop/v1/sticker/494995936/android/sticker.png',
  'https://stickershop.line-scdn.net/stickershop/v1/sticker/494995938/android/sticker.png',
  'https://stickershop.line-scdn.net/stickershop/v1/sticker/725663646/android/sticker.png',
  'https://stickershop.line-scdn.net/stickershop/v1/sticker/730965869/android/sticker.png',
]

function handleForceBan(ctrl, message) {
  let index = Math.floor(Math.random() * banImgs.length)
  const embed = new WebEmbed()
    .setImage(banImgs[index])
  const msg = `QAQ ${WebEmbed.hiddenEmbed}${embed}`
  if (ctrl) {
    const taskFunc = () => new Promise(resolve => {
      message.reply({ content: msg })
      resolve({});
    })
    const expireAt = Date.now() + 180000;
    const tag = TaskType.Cmd;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'Force Ban', tag, rank);
    ctrl.addTask(task);
  } else {
    logger('No controller, directly reply message');
    message.reply({ content: msg })
  }
}