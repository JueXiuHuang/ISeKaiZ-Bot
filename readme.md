# How to use this bot

## Config

Edit content of `sample_config.json` and rename it as `config.json`.

### Config detail

- token: please refer to this [video](https://youtu.be/_4s2DpUhLGQ?si=Y_SXTWQzs9s-n6D8&t=180) to get your discord token.
- channelId: the channel on which you want the bot to spam.
- profession: the profession you want to farm. Available options are: `none`, `mine`, `fish`, `forage`.
- checkDelay: the delay that bot will check current battle & profession state.
- taskGap: the gap between tasks.
- taskBias: bias to prevent botting dection.
- retryCount: the counter that bot will send `$map` again or leave the battle.
- treasureHunter: allows bot to collect chest rewards.
- treasureGuild: the guild that bot will focus on.
- expFood: the food that bot will eat.

## Commands

Please send the command at channel with channelId, or the bot will skip the message.

- !start: start the bot
- !stop: stop the bot