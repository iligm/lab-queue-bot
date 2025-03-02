// actions.mjs

import { getQueueList, addUserToQueue, removeUserFromQueue, isUserInQueue } from './queue.mjs';
import { config } from './config.mjs';

export const sendQueueMessage = async (bot, chatId, text, keyboard) => {
  const queueList = getQueueList();
  const messageText = `${text}\n\nУчастники:\n${queueList}`;
  const message = await bot.telegram.sendMessage(chatId, messageText, {
    reply_markup: keyboard,
  });
  config.activeMessageId = message.message_id;
  config.activeChatId = chatId;
  config.queueActive = true;
};

export const updateQueueMessage = async (bot, text, keyboard) => {
  if (config.queueActive && config.activeChatId && config.activeMessageId) {
    const queueList = getQueueList();
    const newMessageText = `${text}\n\nУчастники:\n${queueList}`;
    await bot.telegram.editMessageText(
      config.activeChatId,
      config.activeMessageId,
      null,
      newMessageText,
      { reply_markup: keyboard }
    );
  } else {
    console.log('Активное сообщение не найдено или очередь неактивна.');
  }
};

export const setupActions = (bot) => {
  bot.action('join_queue', async (ctx) => {
    const messageId = ctx.update.callback_query.message.message_id;
    const user = ctx.update.callback_query.from;

    if (messageId === config.activeMessageId && config.queueActive) {
      if (!isUserInQueue(user.id)) {
        addUserToQueue(user);
        await updateQueueMessage(bot, 'Записаться в очередь', {
          inline_keyboard: [
            [{ text: 'Записаться в очередь', callback_data: 'join_queue' }],
            [{ text: 'Покинуть очередь', callback_data: 'leave_queue' }],
          ],
        });
        await ctx.answerCbQuery('Вы записаны в очередь.');
      } else {
        await ctx.answerCbQuery('Вы уже записаны в очередь.');
      }
    } else {
      await ctx.answerCbQuery('Запись в очередь не активна или не соответствует текущему сообщению.');
    }
  });

  bot.action('leave_queue', async (ctx) => {
    const messageId = ctx.update.callback_query.message.message_id;
    const user = ctx.update.callback_query.from;

    if (messageId === config.activeMessageId && config.queueActive) {
      if (isUserInQueue(user.id)) {
        removeUserFromQueue(user.id);
        await updateQueueMessage(bot, 'Записаться в очередь', {
          inline_keyboard: [
            [{ text: 'Записаться в очередь', callback_data: 'join_queue' }],
            [{ text: 'Покинуть очередь', callback_data: 'leave_queue' }],
          ],
        });
        await ctx.answerCbQuery('Вы покинули очередь.');
      } else {
        await ctx.answerCbQuery('Вы не находитесь в очереди.');
      }
    } else {
      await ctx.answerCbQuery('Запись в очередь не активна или не соответствует текущему сообщению.');
    }
  });
};
