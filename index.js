const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const token = process.env.TELEGRAM_TOKEN; // From Render
const geminiApiKey = process.env.GEMINI_API_KEY; // Your Gemini API key
const botName = 'DenisAIBot';

// Initialize bot and Gemini
const bot = new TelegramBot(token);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Free tier model

// Middleware for webhook
app.use(express.json());

// Handle all messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text === '/start') {
    bot.sendMessage(chatId, `Hello! I’m ${botName}, your helpful coding assistant powered by Gemini. Ask me anything about programming—code examples, debugging, or explanations!`);
    return;
  }

  try {
    // Updated prompt to specialize as a coding assistant
    const result = await model.generateContent(`You are ${botName}, a helpful coding assistant created by Denis. Your role is to assist with programming questions, provide code examples, explain concepts, and help debug code. Respond to: "${text}"`);
    const reply = result.response.text().trim();
    bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error('Gemini API error:', error.message);
    bot.sendMessage(chatId, 'Oops! Something went wrong while processing your coding question. Try again!');
  }
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  const renderUrl = process.env.RENDER_EXTERNAL_URL || `https://denis-ai-bot.onrender.com`;
  await bot.setWebHook(`${renderUrl}/webhook`);
});