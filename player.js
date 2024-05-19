const BattleState = {
  InBattle: "in_battle",
  Defeat: "defeat",
  Idle: "idle",
  NeedVerify: "need_verify",
  Verifying: "verifying"
}

const ProfState = {
  Doing: "doing",
  Idle: "idle",
  NeedVerify: "need_verify",
  Verifying: "verifying"
}

class Player {
  // battle state
  bs = BattleState.Idle;
  // profession state
  ps = ProfState.Idle;
  // battle counter
  bc = 0;
  // profession counter
  pc = 0;
  channel = null;
  battleMsg = null;
  profMsg = null;
  verifyImg = null;
}

module.exports = {Player, BattleState, ProfState};