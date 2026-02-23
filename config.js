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

export const battleZones = [
  'Start Zone', // 1-10
  'Myrkwood', //20-95
  'The Wildlands', // 95-160
  'The Abyssal Depths', // 160-205
  'Scorching Earth', // 205-275
  'The Iron Mountains', // 275-370
  'The Underworld', // 370-500
  'Celestial Isle', // 500-650
  'Whispering Desolation', // 650-800
  'Sunstone Summit', // 800-1000
  'Ancient Planet', // 1000-1200
  'Unholy Battlefield', // 1200-1400
  'The Purgatory' // 1400-1700
];
