import fs from 'fs';

const queueFile = 'queue.json';

// Функция для чтения JSON из файла
const readQueueData = () => {
  try {
    if (!fs.existsSync(queueFile)) {
      fs.writeFileSync(queueFile, JSON.stringify({ queue: [], queueName: 'Без названия' }));
    }
    return JSON.parse(fs.readFileSync(queueFile, 'utf8') || '{}');
  } catch (error) {
    console.error('Ошибка чтения файла очереди:', error);
    return { queue: [], queueName: 'Без названия' };
  }
};

// Функция для записи JSON в файл
const writeQueueData = (data) => {
  try {
    fs.writeFileSync(queueFile, JSON.stringify(data));
  } catch (error) {
    console.error('Ошибка записи файла очереди:', error);
  }
};

// Получить список очереди
export const getQueueList = () => {
  const data = readQueueData();
  const queue = data.queue || [];
  const queueName = data.queueName || 'Без названия';

  if (queue.length === 0) {
    return `Очередь пуста`;
  }
  return `Очередь:\n` + queue
    .map((user, index) => `${index + 1}. @${user.username || user.first_name}`)
    .join('\n');
};

// Установить название очереди
export const setQueueName = (name) => {
  const data = readQueueData();
  data.queueName = name;
  writeQueueData(data);
};

// Получить текущее название очереди
export const getQueueName = () => {
  return readQueueData().queueName || 'Без названия';
};

// Очистить очередь
export const clearQueue = () => {
  writeQueueData({ queue: [], queueName: 'Без названия' });
};

// Проверить, находится ли пользователь в очереди по ID
export const isUserInQueue = (userId) => {
  const data = readQueueData();
  return data.queue.some((user) => user.id === userId);
};

// Проверить, находится ли пользователь в очереди по username
export const isUserInQueueByUsername = (userName) => {
  const data = readQueueData();
  return data.queue.some((user) => user.username === userName);
};

// Получить ID пользователя по username
export const getUserIdByUsername = (username) => {
  const data = readQueueData();
  const user = data.queue.find(user => user.username === username);
  return user ? user.id : null;
};

// Добавить пользователя в очередь
export const addUserToQueue = (user) => {
  const data = readQueueData();
  if (!data.queue.some(u => u.id === user.id)) {
    data.queue.push(user);
    writeQueueData(data);
  }
};

// Удалить пользователя из очереди
export const removeUserFromQueue = (userId) => {
  const data = readQueueData();
  data.queue = data.queue.filter((user) => user.id !== userId);
  writeQueueData(data);
};

// Поменять местами двух пользователей в очереди
export const swapUserFromQueue = (userId1, userId2) => {
  const data = readQueueData();
  const index1 = data.queue.findIndex(user => user.id === userId1);
  const index2 = data.queue.findIndex(user => user.id === userId2);

  if (index1 !== -1 && index2 !== -1) {
    [data.queue[index1], data.queue[index2]] = [data.queue[index2], data.queue[index1]];
    writeQueueData(data);
  }
};
