const { errorLogWrapper } = require('./log');

function handleError(err, info) {
  const skipList = ["INTERACTION_FAILED"];

  if (skipList.includes(err.message)) {
    return true;
  }

  logFunc = () => {
    console.log(info);
    console.log('Error message: ' + err.message);
    console.log(err);
  }

  errorLogWrapper(logFunc);
  return false;
}

module.exports = { handleError }