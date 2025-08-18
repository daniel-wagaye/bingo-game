const TelegramBot = require('node-telegram-bot-api');
const { getClient } = require('./db');
const token = process.env.TELEGRAM_BOT_TOKEN;

// Check if token is missing or is a placeholder
if(!token || token === 'your_valid_token_here' || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE'){
  console.log('No valid TELEGRAM_BOT_TOKEN in env - Telegram bot functionality disabled');
  module.exports = null;
  return;
}

// Initialize bot with webhook mode (more reliable in Docker environments)
let bot;
try {
  // Create bot without polling to avoid connection issues
  bot = new TelegramBot(token, { polling: false });
  console.log('Telegram bot initialized in webhook mode');
} catch (error) {
  console.error('Failed to initialize Telegram bot:', error.message);
  module.exports = null;
  return;
}
bot.onText(/\/start/, async (msg)=>{
  const chatId = msg.chat.id;
  const name = msg.from.username || msg.from.first_name || 'Player';
  await bot.sendMessage(chatId, `Welcome ${name}! Use /play to open the game.`);
  try{
    const client = getClient();
    const q = await client.query('SELECT * FROM users WHERE telegram_id=$1',[chatId]);
    if(q.rows.length===0){
      await client.query('INSERT INTO users(telegram_id, username) VALUES($1,$2)',[chatId, name]);
    }
  }catch(e){ console.error('bot db err', e); }
});
bot.onText(/\/play/, async (msg)=>{
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, 'Visit http://localhost:5173 in your browser to play the bingo game!');
});
module.exports = bot;
