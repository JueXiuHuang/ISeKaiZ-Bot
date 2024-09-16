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


// function selectMenu(msg){

// }

client.on('messageCreate', async (message) => {
  if (message.channelId != channelId) return;
  if (message.author.username != 'Isekaid') return;
  testLogger(message, 'messageCreate');

  if (message.components.length > 0) {

    // 印出 components 的內容
    // console.log(message.components[0]);
    if (message.embeds[0].title == "Fishing") {
      try {
        message.clickButton({ X: 0, Y: 0})
      } catch (err) {
        console.log(err);
      }
    } 

    if (message.embeds[0].description == "Choose the correct option...") {
      const X      = '1284730320133951592'
      const Fish   = '1284729698701541458'
      const Mine   = '1285099666912055359'
      const Forage = '1285094197271199774'
      // message.components[0].components.forEach(Button => console.log(Button.emoji.id))

      message.components[0].components.forEach((Button, index) => {
        if (Button.emoji.id != X) {
          try {
            message.clickButton({ X: index, Y: 0})
          } catch (err) {
            console.log(err);
          }
        }
      })
    }

    console.log('-------------------------------------------------')

    // try {
    //   await message.selectMenu(0, ['Shadowcave Depths'])
    //     .then((response) => {
    //       console.log('選擇成功', response);
    //     })
    //     .catch((error) => {
    //         console.error('選擇失敗', error);
    //     });
    // } catch (error){
    //   console.log('try_error: ' + error);
    // }

  } else {
      console.log('此訊息沒有 components');

  }
})

client.on('messageUpdate', async (message) => {
  if (message.channelId != channelId) return;
  testLogger(message, 'messageUpdate');
})

client.login(token).catch(reason => { console.log(reason); process.exit(0); });