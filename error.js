import { errorLogWrapper } from './log.js';

export function handleError(err, info) {
  const skipList = ["INTERACTION_FAILED"];
  if (skipList.includes(err.code)) {
    return true;
  }

  const logFunc = () => {
    console.log(info);
    console.log('Error message: ' + err.message);
    console.log(err);
  }

  errorLogWrapper(logFunc);
  return false;
}
