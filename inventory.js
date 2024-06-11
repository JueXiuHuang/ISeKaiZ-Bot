const { sellEquip } = require('./config.json');

async function inventoryRoutine(player) {
  if (player.channel === null) return;
  
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
  if (gold.length < 7) {
    player.sell += 1;
  }
}

module.exports = { inventoryRoutine, inventoryHandler };