import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

export const config = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  activeMessageId: null,
  activeChatId: null,
  queueActive: false,
  settings: JSON.parse(fs.readFileSync('config.json', 'utf8'))
};
