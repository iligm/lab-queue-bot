import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import fs from 'fs';

dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TELEGRAM_TOKEN, {
  telegram: {
    agent: null, // пустое значение по умолчанию
    webhookReply: true,
    apiRoot: 'https://api.telegram.org',
    maxRetries: 3, // количество повторных попыток
    timeout: 10000, // время ожидания в миллисекундах
  },
});

let activeMessageId = null;
let activeChatId = null;
let queueActive = false;

// Функция для отправки сообщения с очередью
const sendQueueMessage = async (chatId, text, keyboard) => {
  const queueList = getQueueList();
  const messageText = `${text}\n\nУчастники:\n${queueList}`;
  const message = await bot.telegram.sendMessage(chatId, messageText, {
    reply_markup: keyboard,
  });
  activeMessageId = message.message_id;
  activeChatId = chatId;
  queueActive = true;
};

// Функция для обновления сообщения
const updateQueueMessage = async (text, keyboard) => {
  if (queueActive && activeChatId && activeMessageId) {
    const queueList = getQueueList();
    const newMessageText = `${text}\n\nУчастники:\n${queueList}`;
    await bot.telegram.editMessageText(activeChatId, activeMessageId, null, newMessageText, {
      reply_markup: keyboard,
    });
  } else {
    console.log('Активное сообщение не найдено или очередь неактивна.');
  }
};

// Функция для проверки наличия пользователя в очереди
const isUserInQueue = (userId) => {
  const queue = JSON.parse(fs.readFileSync('queue.json'));
  return queue.some(user => user.id === userId);
};

// Функция для добавления пользователя в очередь
const addUserToQueue = (user) => {
  const queue = JSON.parse(fs.readFileSync('queue.json'));
  queue.push(user);
  fs.writeFileSync('queue.json', JSON.stringify(queue));
};

// Функция для получения списка участников из очереди
const getQueueList = () => {
  const queue = JSON.parse(fs.readFileSync('queue.json'));
  return queue.map(user => `@${user.username || user.first_name}`).join('\n');
};

// Функция для очистки очереди
const clearQueue = () => {
  fs.writeFileSync('queue.json', JSON.stringify([]));
};

// Команда для отправки сообщения с очередью
bot.command('queue', async (ctx) => {
  if (!queueActive) {
    const chatId = ctx.message.chat.id;
    clearQueue(); // Очистка файла с очередью
    try {
      await sendQueueMessage(chatId, 'Записаться в очередь', {
        inline_keyboard: [[{ text: 'Записаться в очередь', callback_data: 'join_queue' }]],
      });
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  } else {
    ctx.reply('Очередь уже активна.');
  }
});

// Команда для просмотра текущей очереди
bot.command('view', async (ctx) => {
  const chatId = ctx.message.chat.id;
  const queueList = getQueueList();
  const messageText = `Текущая очередь:\n${queueList}`;
  ctx.reply(messageText);
});

// Команда для остановки записи
bot.command('stop', async (ctx) => {
  if (queueActive) {
    queueActive = false;
    activeMessageId = null;
    activeChatId = null;
    ctx.reply('Запись в очередь остановлена.');
  } else {
    ctx.reply('Очередь неактивна.');
  }
});

// Обработка нажатия на кнопку
bot.action('join_queue', async (ctx) => {
  const user = ctx.update.callback_query.from;

  if (!isUserInQueue(user.id)) {
    addUserToQueue(user);
    await updateQueueMessage('Записаться в очередь', {
      inline_keyboard: [[{ text: 'Записаться в очередь', callback_data: 'join_queue' }]],
    });
  } else {
    await ctx.answerCbQuery('Вы уже записаны в очередь.');
  }
});

bot.launch().catch((error) => console.error('Ошибка запуска бота:', error));

