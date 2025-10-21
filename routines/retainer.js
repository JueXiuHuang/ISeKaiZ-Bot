import { isVerify } from '../helper.js';
import { Task, TaskType, getDefaultRank } from '../task manager.js';

export function retainerRoutine(ctrl) {
  if (ctrl.player.channel === null) return;
  if (isVerify(ctrl.player.state)) return;

  const taskFunc = () => new Promise(resolve => {
    ctrl.player.channel?.send('$hired');
    resolve({});
  });

  const expireAt = Date.now() + 120000;
  const tag = TaskType.Retainer;
  const rank = getDefaultRank(tag);
  const task = new Task(taskFunc, expireAt, '$hired', tag, rank);
  ctrl.addTask(task);
}
