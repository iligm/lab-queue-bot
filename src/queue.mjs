// queue.mjs

import fs from 'fs';

const queueFile = 'queue.json';

export const getQueueList = () => {
  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8') || '[]');
  if (queue.length === 0) {
    return 'Очередь пуста';
  }
  return queue
    .map((user, index) => `${index + 1}. @${user.username || user.first_name}`)
    .join('\n');
};

export const isUserInQueue = (userId) => {
  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8') || '[]');
  return queue.some((user) => user.id === userId);
};

export const addUserToQueue = (user) => {
  const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8') || '[]');
  queue.push(user);
  fs.writeFileSync(queueFile, JSON.stringify(queue));
};

export const removeUserFromQueue = (userId) => {
  let queue = JSON.parse(fs.readFileSync(queueFile, 'utf8') || '[]');
  queue = queue.filter((user) => user.id !== userId);
  fs.writeFileSync(queueFile, JSON.stringify(queue));
};

export const clearQueue = () => {
  fs.writeFileSync(queueFile, JSON.stringify([]));
};
