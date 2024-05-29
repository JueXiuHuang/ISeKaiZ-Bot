const { expFood = 'sushi-roll' } = require('./config.json');

function foodRoutine(channel) {
  if (channel === null) return;

  channel.send('$eat ' + expFood);
}

module.exports = { foodRoutine };