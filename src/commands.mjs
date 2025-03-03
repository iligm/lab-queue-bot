import { swapUserFromQueue, clearQueue, getQueueList, isUserInQueue, setQueueName, getQueueName, getUserIdByUsername } from './queue.mjs';
import { config } from './config.mjs';
import { sendQueueMessage, updateQueueMessage } from './actions.mjs';

export const setupCommands = (bot) => {
  bot.telegram.setMyCommands([
    { command: 'help', description: 'Выводит подробную информацию о командах' },
    { command: 'queue', description: 'Создаёт новую очередь (пока только одну за раз)' },
    { command: 'view', description: 'Выводит текущее состояние очереди' },
    { command: 'stop', description: 'Останавливает работу очереди' },
    { command: 'swap', description: 'Предлагает другому пользователю поменяться местами' },
  ]);

  bot.command('help', async (ctx) => {
    const githubLink = 'https://github.com/iligm/lab-queue-bot';
    const message = await ctx.replyWithMarkdown(`**Доступные команды:**
- \`/help\` — показать это сообщение.
- \`/queue\` \`[name]\` — начать новую очередь.
- \`/view\` — посмотреть текущую очередь.
- \`/stop\` — остановить текущую очередь.
- \`/swap @username\` — предложить другому пользователю поменяться местами.

🔗 Подробнее на GitHub:  
${githubLink}`);

    if (config.settings.deleteOldMessages) {
      setTimeout(() => deleteMessage(ctx, ctx.message.message_id), 5000);
    }
  });

  bot.command('queue', async (ctx) => {
    const queueName = ctx.message.text.split(' ').slice(1).join(' ') || 'Без названия';

    if (!config.queueActive) {
      config.queueActive = true;
      clearQueue();
      setQueueName(queueName);

      const chatId = ctx.message.chat.id;
      try {
        await sendQueueMessage(bot, chatId, `Записаться в очередь "${queueName}"`, {
          inline_keyboard: [
            [{ text: 'Записаться в очередь', callback_data: 'join_queue' }],
            [{ text: 'Покинуть очередь', callback_data: 'leave_queue' }],
          ],
        });

        if (config.settings.pinMessage && config.activeMessageId) {
          await bot.telegram.pinChatMessage(chatId, config.activeMessageId, true);
        }
      } catch (error) {
        console.error('Ошибка при создании очереди:', error);
      }
    } else {
      const message = await ctx.reply('Очередь уже активна.');
      if (config.settings.deleteOldMessages) {
        setTimeout(() => deleteMessage(ctx, ctx.message.message_id), 5000);
        setTimeout(() => deleteMessage(ctx, message.message_id), 5000);
      }
    }
  });

  bot.command('view', async (ctx) => {
    const queueList = getQueueList();
    const message = await ctx.reply(queueList);
    if (config.settings.deleteOldMessages) {
      setTimeout(() => deleteMessage(ctx, ctx.message.message_id), 5000);
    }
  });

  bot.command('stop', async (ctx) => {
    if (config.queueActive) {
      config.queueActive = false;

      if (config.activeChatId && config.activeMessageId) {
        try {
          await bot.telegram.editMessageReplyMarkup(config.activeChatId, config.activeMessageId, null, { inline_keyboard: [] });
          if (config.settings.pinMessage) {
            await ctx.unpinChatMessage(config.activeChatId, config.activeMessageId);
          }
        } catch (error) {
          console.error('Ошибка при остановке очереди:', error);
        }
      }

      config.activeMessageId = null;
      config.activeChatId = null;
      const message = await ctx.reply('Запись в очередь остановлена.');
      if (config.settings.deleteOldMessages) {
        setTimeout(() => deleteMessage(ctx, ctx.message.message_id), 5000);
      }
    } else {
      const message = await ctx.reply('Очередь неактивна.');
      if (config.settings.deleteOldMessages) {
        setTimeout(() => deleteMessage(ctx, ctx.message.message_id), 5000);
      }
    }
  });

  bot.command('swap', async (ctx) => {
    const messageText = ctx.message.text.trim();
    const mentionedUser = messageText.split(' ')[1];

    if (config.settings.deleteOldMessages) {
      setTimeout(() => deleteMessage(ctx, ctx.message.message_id), 5000);
    }

    if (!mentionedUser || !mentionedUser.startsWith('@')) {
      const message = await ctx.reply('Используйте: /swap @username');
      if (config.settings.deleteOldMessages) {
        setTimeout(() => deleteMessage(ctx, message.message_id), 5000);
      }
      return;
    }

    const sender = ctx.message.from;
    const mentionedUserId = getUserIdByUsername(mentionedUser.slice(1));

    if (!isUserInQueue(sender.id)) {
      const message = await ctx.reply('Вы не в очереди.');
      if (config.settings.deleteOldMessages) {
        setTimeout(() => deleteMessage(ctx, message.message_id), 5000);
      }
      return;
    }

    if (!mentionedUserId || !isUserInQueue(mentionedUserId)) {
      const message = await ctx.reply('Пользователь не найден в очереди.');
      if (config.settings.deleteOldMessages) {
        setTimeout(() => deleteMessage(ctx, message.message_id), 5000);
      }
      return;
    }

    const chatId = ctx.chat.id;
    const swapMessage = await ctx.reply(
      `${mentionedUser}, ${sender.first_name} предлагает поменяться местами. Принять обмен?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Да', callback_data: `accept_swap_${sender.id}_${mentionedUserId}` }],
            [{ text: 'Нет', callback_data: `reject_swap_${sender.id}_${mentionedUserId}` }],
          ],
        },
      }
    );

    bot.action(/^accept_swap_(\d+)_(\d+)$/, async (ctx) => {
      const [, userId1, userId2] = ctx.match.map(Number);
      const clickerId = Number(ctx.from.id);

      if (clickerId !== userId2) {
        await ctx.answerCbQuery('Доступно только участнику, с которым хотят поменяться', { show_alert: true });
        return;
      }

      swapUserFromQueue(userId1, userId2);

      const updatedQueue = getQueueList();
      await ctx.editMessageText(`Обмен подтвержден!\n\nТекущая очередь:\n${updatedQueue}`);
      await updateQueueMessage(bot, `Записаться в очередь "${getQueueName()}"`, {
        inline_keyboard: [
          [{ text: 'Записаться в очередь', callback_data: 'join_queue' }],
          [{ text: 'Покинуть очередь', callback_data: 'leave_queue' }],
        ],
      });

      if (config.settings.deleteOldMessages) {
        setTimeout(() => deleteMessage(ctx, ctx.callbackQuery.message.message_id), 5000);
      }
    });

    bot.action(/^reject_swap_(\d+)_(\d+)$/, async (ctx) => {
      const [, userId1, userId2] = ctx.match.map(Number);
      const clickerId = Number(ctx.from.id);

      if (clickerId !== userId1 && clickerId !== userId2) {
        await ctx.answerCbQuery('Доступно только участникам обмена', { show_alert: true });
        return;
      }

      await ctx.editMessageText('Обмен отклонен.');
      if (config.settings.deleteOldMessages) {
        setTimeout(() => deleteMessage(ctx, ctx.callbackQuery.message.message_id), 5000);
      }
    });

    if (config.settings.deleteOldMessages) {
      setTimeout(() => deleteMessage(ctx, swapMessage.message_id), 5000);
    }
  });
};

// Функция безопасного удаления сообщений
const deleteMessage = async (ctx, messageId) => {
  try {
    await ctx.deleteMessage(messageId);
  } catch (error) {
    console.log(`Ошибка удаления сообщения (ID: ${messageId}):`, error);
  }
};
