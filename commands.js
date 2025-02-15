const { WebEmbed } = require('discord.js-selfbot-v13');
const { Task, TaskType, getDefaultRank } = require('./controller');
const { trustUsr = ['405340108846530571'] } = require('./config.json');
const { messageExtractor } = require('./helper');
const { logger } = require('./log');

function parseCommands(ctrl, message, usrID) {
  [author, mentions, , , , content] = messageExtractor(message)
  if (mentions.everyone || !mentions.users.get(usrID)) {
    return
  }
  if (!trustUsr.includes(author)) {
    return
  }

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
  msg = '$bal'
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
  msg = `$guild donate ${amount}`
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

function handleForceBan(ctrl, message) {
  const embed = new WebEmbed()
    .setImage('https://cdn.frankerfacez.com/emoticon/366484/4')
  msg = `QAQ ${WebEmbed.hiddenEmbed}${embed}`
  if (ctrl) {
    const taskFunc = () => new Promise(resolve => {
      message.reply({content:msg})
      resolve({});
    })
    const expireAt = Date.now() + 180000;
    const tag = TaskType.Cmd;
    let rank = getDefaultRank(tag);
    const task = new Task(taskFunc, expireAt, 'Force Ban', tag, rank);
    ctrl.addTask(task);
  } else {
    logger('No controller, directly reply message');
    message.reply({content:msg})
  }
}

module.exports = { parseCommands };