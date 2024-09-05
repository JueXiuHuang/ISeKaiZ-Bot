const { sellEquip = ['F', 'E', 'D'] } = require('./config.json');
const { isVerify } = require('./helper');

async function inventoryRoutine(player) {
  if (player.channel === null) return;
  if (isVerify(player.bs) || isVerify(player.ps)) return;
  
  player.sell = player.sell % sellEquip.length;
  while (player.sell < sellEquip.length) {
    player.channel.send(`$sell equipment all ${sellEquip[player.sell]}`);
    await new Promise(r => setTimeout(r, 10000));
  }
}

function inventoryHandler(player, title, desc) {
  if (!title.includes('Equipment Sold')) {
    return;
  }

  const re = /You gained (\d+) gold!/;
  desc = desc.replace(',', '');
  const gold = desc.match(re)[1];
  if (gold.length < 5) {
    player.sell += 1;
  }
}

module.exports = { inventoryRoutine, inventoryHandler };