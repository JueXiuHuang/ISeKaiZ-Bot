import { expFood } from '../config.js';
import { Task, TaskType, getDefaultRank } from '../task manager.js';
import { saveUserData } from '../player.js';
import { logger, formatTimeString } from '../log.js';

export function foodRoutine(ctrl) {
  const lastEatAt = ctrl.player.userData.last_eat_at ?? 0;
  const dateString = formatTimeString(lastEatAt);
  const now = new Date();

  if (now.getTime() - lastEatAt < 1000 * 60 * 60 * 3) {
    logger(`Last eat at ${dateString}, skip...`);
    return;
  }

  const taskFunc = () => new Promise(resolve => {
    ctrl.player.channel?.send('$eat ' + expFood);
    ctrl.player.userData.last_eat_at = now.getTime();
    const nowDateString = formatTimeString(now.getTime());
    logger(`Eat at ${nowDateString}`);
    saveUserData(ctrl.player.userData);
    resolve({ 'userData': ctrl.player.userData });
  });

  const expireAt = Date.now() + 180000;
  const tag = TaskType.Food;
  const rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, 'Eat food', tag, rank);
  ctrl.addTask(task);
}