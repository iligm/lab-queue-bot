// commands.mjs

import { clearQueue, getQueueList } from './queue.mjs';
import { config } from './config.mjs';
import { sendQueueMessage } from './actions.mjs';

export const setupCommands = (bot) => {
  bot.command('queue', async (ctx) => {
    if (!config.queueActive) {
      const chatId = ctx.message.chat.id;
      clearQueue();
      try {
        await sendQueueMessage(bot, chatId, 'Записаться в очередь', {
          inline_keyboard: [
            [{ text: 'Записаться в очередь', callback_data: 'join_queue' }],
            [{ text: 'Покинуть очередь', callback_data: 'leave_queue' }],
          ],
        });
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
      }
    } else {
      ctx.reply('Очередь уже активна.');
    }
  });

  bot.command('view', async (ctx) => {
    const queueList = getQueueList();
    const messageText = `Текущая очередь:\n${queueList}`;
    ctx.reply(messageText);
  });

  bot.command('stop', async (ctx) => {
    if (config.queueActive) {
      config.queueActive = false;
      if (config.activeChatId && config.activeMessageId) {
        try {
          await bot.telegram.editMessageReplyMarkup(
            config.activeChatId,
            config.activeMessageId,
            null,
            { inline_keyboard: [] }
          );
        } catch (error) {
          console.error('Ошибка при удалении кнопок:', error);
        }
      }
      config.activeMessageId = null;
      config.activeChatId = null;
      ctx.reply('Запись в очередь остановлена.');
    } else {
      ctx.reply('Очередь неактивна.');
    }
  });
};
