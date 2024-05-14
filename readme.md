# How to use this bot

## Config

Edit content of `sample_config.json` and rename it as `config.json`.

### Config detail

- token: please refer to this [video](https://youtu.be/_4s2DpUhLGQ?si=Y_SXTWQzs9s-n6D8&t=180) to get your discord token.
- channelId: the channel on which you want the bot to spam.
- profession: the profession you want to farm. Available options are: `none`, `mine`, `fish`, `forage`.
- delayMs: the delay that bot will try to fight or do profession again.
- retryCount: the counter that bot will send `$map` again or leave the battle.

## Commands

Please send the command at channel with channelId, or the bot will skip the message.

- !start: start the bot
- !stop: stop the bot