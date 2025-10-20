import config from './config.json' with { type: 'json' };

// Export all config values
export const {
  token,
  channelId,
  craftChannelId,
  captchaModel,
  profession = 'none',
  expFood = 'sushi-roll',
  sellEquip = ['F', 'E', 'D'],
  trustUsr = ['405340108846530571'],
  retryCount = 3,
  taskGap = 2000,
  taskBias = 3000,
  treasureHunter = false,
  treasureGuild = ''
} = config;
