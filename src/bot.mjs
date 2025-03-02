// bot.mjs

import { Telegraf } from 'telegraf';
import { config } from './config.mjs';
import { setupCommands } from './commands.mjs';
import { setupActions } from './actions.mjs';

const bot = new Telegraf(config.TELEGRAM_TOKEN, {
  telegram: {
    agent: null,
    webhookReply: true,
    apiRoot: 'https://api.telegram.org',
    maxRetries: 3,
    timeout: 10000,
  },
});

setupCommands(bot);
setupActions(bot);

bot.launch().catch((error) => console.error('Ошибка запуска бота:', error));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))