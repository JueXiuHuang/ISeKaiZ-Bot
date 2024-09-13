const { Client } = require('discord.js-selfbot-v13');
const { token, channelId } = require('./config.json');

const client = new Client();

client.on('ready', async () => {
  console.log('Debugger is ready');

  let cacheChannel = client.channels.cache.get(channelId);
  cacheChannel.messages.fetch('1249903639854579743')
    .then(message => console.log(message))
    .catch(console.error);
})

function testLogger(msg, eventType) {
  let date = new Date();
  console.log('--------------------------')
  console.log(eventType)
  console.log(date.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  console.log('Context: ' + msg.content)
  console.log('Embeds: ' + JSON.stringify(msg.embeds))
  console.log('--------------------------')
}

client.on('messageCreate', async (message) => {
  if (message.channelId != channelId) return;
  if (message.author.username != 'Isekaid') return;
  testLogger(message, 'messageCreate');

  if (message.components.length > 0) {

    // 印出 components 的內容
    console.log(message.components[0]?.components[0]);
    console.log('-------------------------------------------------')

    const customId = message.components[0].components[0].customId

    try {
      await message.selectMenu(customId, ['Electric Maelstrom'])
        .then((response) => {
          console.log('選擇成功', response);
        })
        .catch((error) => {
            console.error('選擇失敗', error);
        });
    } catch (error){
      console.log('try_error: ' + error);
    }

  } else {
      console.log('此訊息沒有 components');

  }
})

client.on('messageUpdate', async (message) => {
  if (message.channelId != channelId) return;
  testLogger(message, 'messageUpdate');
})

client.login(token).catch(reason => { console.log(reason); process.exit(0); });