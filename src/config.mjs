// config.mjs

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  activeMessageId: null,
  activeChatId: null,
  queueActive: false,
};
