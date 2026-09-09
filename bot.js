require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const UserDatabase = require('./database');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const db = new UserDatabase();

// Emoji для красоты
const EMOJI = {
  coin: '🪙',
  click: '👆',
  energy: '⚡',
  star: '⭐',
  fire: '🔥',
  trophy: '🏆',
  upgrade: '⬆️',
  stats: '📊'
};

function getMainKeyboard() {
  const miniAppUrl = process.env.MINI_APP_URL || 'http://localhost:3000';
  
  return {
    keyboard: [
      [{ text: '🎮 Играть', web_app: { url: miniAppUrl } }]
    ],
    resize_keyboard: true
  };
}

function getUpgradeKeyboard() {
  return {
    keyboard: [
      [{ text: `${EMOJI.coin} Улучшить доход` }],
      [{ text: `${EMOJI.energy} Улучшить энергию` }],
      [{ text: '◀️ Назад' }]
    ],
    resize_keyboard: true
  };
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;

  let user = db.getUser(userId);
  if (!user) {
    db.createUser(userId, username);
    user = db.getUser(userId);
  }

  const welcomeMessage = `
${EMOJI.fire} Добро пожаловать в игру!

${EMOJI.coin} Кликай на монету и зарабатывай!
${EMOJI.energy} Следи за энергией - она восстанавливается со временем
${EMOJI.upgrade} Улучшай свои способности
${EMOJI.trophy} Соревнуйся с другими игроками!

Нажми кнопку ниже, чтобы начать играть! 🎮
  `;

  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: getMainKeyboard()
  });
});

// Обработка сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Игнорируем команду /start (она обрабатывается выше)
  if (text && text.startsWith('/')) return;

  // Для всех остальных сообщений показываем кнопку игры
  bot.sendMessage(chatId, 'Нажми кнопку ниже, чтобы начать играть! 🎮', {
    reply_markup: getMainKeyboard()
  });
});

console.log('🤖 Бот запущен!');
