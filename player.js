const States = {
  InBattle: "in_battle",
  Doing: "doing",
  Defeat: "defeat",
  Idle: "idle",
  NeedVerify: "need_verify",
  Verifying: "verifying"
}

class Player {
  // battle state
  bs = States.Idle;
  // profession state
  ps = States.Idle;
  // battle counter
  bc = 0;
  // profession counter
  pc = 0;
  channel = null;
  battleMsg = null;
  profMsg = null;
  verifyImg = null;
  sell = 0;
}

module.exports = { Player, States };