const { expFood = 'sushi-roll' } = require('./config.json');

function foodRoutine(channel) {
  channel?.send('$eat ' + expFood);
}

module.exports = { foodRoutine };