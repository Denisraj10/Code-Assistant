const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const token = process.env.TELEGRAM_TOKEN; 
const geminiApiKey = process.env.GEMINI_API_KEY; 
const botName = 'DenisAIBot';


const bot = new TelegramBot(token);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); 


app.use(express.json());


bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text === '/start') {
    bot.sendMessage(chatId, `Hello! I’m ${botName}, your coding assistant powered by Gemini. I’m here to help with programming questions, code examples, debugging, and explanations. What coding problem can I solve for you?`);
    return;
  }

  
  const codingKeywords = ['code', 'coding', 'program', 'programming', 'debug', 'error', 'script', 'function', 'variable', 'loop', 'array', 'python', 'javascript', 'java', 'c++', 'html', 'css', 'sql'];
  const isCodingRelated = codingKeywords.some(keyword => text.toLowerCase().includes(keyword)) || 
                          text.match(/["'`][\s\S]*["'`]/) || 
                          text.includes('=') || text.includes('{') || text.includes('}') || // Common code symbols
                          text.toLowerCase().includes('how to') || text.toLowerCase().includes('write'); // Coding intent

  if (!isCodingRelated) {
    bot.sendMessage(chatId, `I’m ${botName}, and I’m here to help with coding only. Please ask me a programming question—like code examples, debugging, or explanations!`);
    return;
  }

  try {
   
    const result = await model.generateContent(`You are ${botName}, a coding assistant created by Denis. Your sole purpose is to assist with programming-related tasks: provide code examples, explain coding concepts, debug code, or answer programming questions. Do not respond to non-coding topics. Respond to: "${text}"`);
    const reply = result.response.text().trim();
    bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error('Gemini API error:', error.message);
    bot.sendMessage(chatId, 'Oops! Something went wrong with your coding query. Please try again!');
  }
});


app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  const renderUrl = process.env.RENDER_EXTERNAL_URL || `https://denis-ai-bot.onrender.com`;
  await bot.setWebHook(`${renderUrl}/webhook`);
});