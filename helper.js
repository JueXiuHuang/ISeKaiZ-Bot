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

module.exports = { isVerify };