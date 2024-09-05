const { States } = require('./player');

function isVerify(...args) {
  for (var i = 0; i < args.length; i++) {
    if (args[i] === States.NeedVerify) {
      return true;
    }

    if (args[i] === States.Verifying) {
      return true;
    }
  }
  return false;
}

function messageExtractor(message) {
  let embedTitle = 'empty_embed_title';
  let embedDesc = 'empty_description';
  let mention = 'empty_mention';
  let content = message.content;

  if (message.embeds.length > 0) {
    if (message.embeds[0].title != null) embedTitle = message.embeds[0].title;
    if (message.embeds[0].description != null) embedDesc = message.embeds[0].description;
    if (message.embeds[0].author != null) mention = message.embeds[0].author.name;
  }

  return [embedTitle, embedDesc, mention, content]
}

module.exports = { isVerify, messageExtractor };