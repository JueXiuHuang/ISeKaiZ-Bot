const States = {
  InBattle: "in_battle",
  Doing: "doing",
  Defeat: "defeat",
  Idle: "idle",
  NeedVerify_Image: "need_verify_image",  // Verify: enter the image code
  Verifying_Image: "verifying_image",  
  // NeedVerify_Emoji: "need_verify_emoji"  // Verify: choose the correct emoji
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
  verifyEmojiMsg = null;
  sell = 0;
}

module.exports = { Player, States };