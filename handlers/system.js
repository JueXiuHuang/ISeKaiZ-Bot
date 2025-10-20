import { logger } from '../log.js';
import { States } from '../player.js';

export function handleSystemMessage(ctrl, data) {
  if (data.desc === 'You don\'t have enough energy to battle!') {
    logger('>>>NO ENERGY<<< Refreshing map and profession timers.');
    ctrl.refreshTimerId('map');
    ctrl.refreshTimerId('prof');
    return true;
  }

  if (data.title === 'Suspended') {
    logger('>>>ACCOUNT SUSPENDED<<< Bot stopping.');
    ctrl.updateState(States.Ban);
    return true;
  }

  return false;
}
