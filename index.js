import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Manual cache implementation for 60 seconds
const translationCache = new Map();
const CACHE_TTL = 60000; // 60 seconds in milliseconds

// Cache cleanup function
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of translationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      translationCache.delete(key);
    }
  }
}

// Run cache cleanup every minute
setInterval(cleanupCache, 60000);

// Express app for uptime monitoring
const app = express();
const PORT = process.env.PORT || 5000;

// Language code mapping for flag emojis
const flagToLanguage = {
  '🇺🇸': 'en', // English (US)
  '🇬🇧': 'en', // English (GB)
  '🇪🇸': 'es', // Spanish
  '🇫🇷': 'fr', // French
  '🇩🇪': 'de', // German
  '🇮🇹': 'it', // Italian
  '🇵🇹': 'pt', // Portuguese
  '🇷🇺': 'ru', // Russian
  '🇨🇳': 'zh', // Chinese
  '🇯🇵': 'ja', // Japanese
  '🇰🇷': 'ko', // Korean
  '🇮🇳': 'hi', // Hindi
  '🇸🇦': 'ar', // Arabic
  '🇳🇱': 'nl', // Dutch
  '🇸🇪': 'sv', // Swedish
  '🇳🇴': 'no', // Norwegian
  '🇩🇰': 'da', // Danish
  '🇫🇮': 'fi', // Finnish
  '🇵🇱': 'pl', // Polish
  '🇨🇿': 'cs', // Czech
  '🇭🇺': 'hu', // Hungarian
  '🇷🇴': 'ro', // Romanian
  '🇬🇷': 'el', // Greek
  '🇹🇷': 'tr', // Turkish
  '🇮🇱': 'he', // Hebrew
  '🇹🇭': 'th', // Thai
  '🇻🇳': 'vi', // Vietnamese
  '🇮🇩': 'id', // Indonesian
  '🇲🇾': 'ms', // Malay
  '🇵🇭': 'tl', // Filipino
  '🇧🇷': 'pt', // Portuguese (Brazil)
  '🇲🇽': 'es', // Spanish (Mexico)
  '🇦🇷': 'es', // Spanish (Argentina)
  '🇨🇱': 'es', // Spanish (Chile)
  '🇨🇴': 'es', // Spanish (Colombia)
  '🇵🇪': 'es', // Spanish (Peru)
  '🇺🇦': 'uk', // Ukrainian
  '🇧🇬': 'bg', // Bulgarian
  '🇭🇷': 'hr', // Croatian
  '🇸🇮': 'sl', // Slovenian
  '🇸🇰': 'sk', // Slovak
  '🇱🇹': 'lt', // Lithuanian
  '🇱🇻': 'lv', // Latvian
  '🇪🇪': 'et', // Estonian
  '🇮🇷': 'fa', // Persian
  '🇵🇰': 'ur', // Urdu
  '🇧🇩': 'bn', // Bengali
  '🇱🇰': 'si', // Sinhala
  '🇲🇲': 'my', // Myanmar
  '🇰🇭': 'km', // Khmer
  '🇱🇦': 'lo', // Lao
  '🇲🇳': 'mn', // Mongolian
  '🇰🇿': 'kk', // Kazakh
  '🇺🇿': 'uz', // Uzbek
  '🇦🇿': 'az', // Azerbaijani
  '🇬🇪': 'ka', // Georgian
  '🇦🇲': 'hy', // Armenian
  '🇪🇹': 'am', // Amharic
  '🇰🇪': 'sw', // Swahili
  '🇿🇦': 'af', // Afrikaans
  '🇳🇬': 'yo', // Yoruba
  '🇬🇭': 'tw', // Twi
  '🇲🇦': 'ar', // Arabic (Morocco)
  '🇪🇬': 'ar', // Arabic (Egypt)
  '🇮🇶': 'ar', // Arabic (Iraq)
  '🇸🇾': 'ar', // Arabic (Syria)
  '🇯🇴': 'ar', // Arabic (Jordan)
  '🇱🇧': 'ar', // Arabic (Lebanon)
  '🇰🇼': 'ar', // Arabic (Kuwait)
  '🇶🇦': 'ar', // Arabic (Qatar)
  '🇦🇪': 'ar', // Arabic (UAE)
  '🇴🇲': 'ar', // Arabic (Oman)
  '🇾🇪': 'ar', // Arabic (Yemen)
};

// Language names for user-friendly display
const languageNames = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'hi': 'Hindi',
  'ar': 'Arabic',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'pl': 'Polish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'ro': 'Romanian',
  'el': 'Greek',
  'tr': 'Turkish',
  'he': 'Hebrew',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'tl': 'Filipino',
  'uk': 'Ukrainian',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sl': 'Slovenian',
  'sk': 'Slovak',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'et': 'Estonian',
  'fa': 'Persian',
  'ur': 'Urdu',
  'bn': 'Bengali',
  'si': 'Sinhala',
  'my': 'Myanmar',
  'km': 'Khmer',
  'lo': 'Lao',
  'mn': 'Mongolian',
  'kk': 'Kazakh',
  'uz': 'Uzbek',
  'az': 'Azerbaijani',
  'ka': 'Georgian',
  'hy': 'Armenian',
  'am': 'Amharic',
  'sw': 'Swahili',
  'af': 'Afrikaans',
  'yo': 'Yoruba',
  'tw': 'Twi',
};

// Lingva Translate API configuration
const LINGVA_BASE_URL = 'https://lingva.ml/api/v1';

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ]
});

// Utility functions
function isEmptyOrWhitespace(text) {
  return !text || text.trim().length === 0;
}

function isOnlyEmojis(text) {
  const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*$/u;
  return emojiRegex.test(text.trim());
}

function isOnlyLinks(text) {
  const linkRegex = /^(https?:\/\/[^\s]+\s*)+$/i;
  return linkRegex.test(text.trim());
}

function isOnlyMentions(text) {
  const mentionRegex = /^(<@!?\d+>|<@&\d+>|<#\d+>\s*)+$/;
  return mentionRegex.test(text.trim());
}

function shouldIgnoreMessage(content) {
  return isEmptyOrWhitespace(content) || 
         isOnlyEmojis(content) || 
         isOnlyLinks(content) || 
         isOnlyMentions(content);
}

// Translation function using Lingva Translate
async function translateText(text, targetLang, sourceLang = 'auto') {
  try {
    // Encode the text for URL
    const encodedText = encodeURIComponent(text);
    const url = `${LINGVA_BASE_URL}/${sourceLang}/${targetLang}/${encodedText}`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Discord-Translation-Bot'
      }
    });

    if (response.data && response.data.translation) {
      return response.data.translation;
    } else {
      throw new Error('Invalid response from translation service');
    }
  } catch (error) {
    console.error('Translation error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error('Translation service temporarily unavailable');
  }
}

// Discord event handlers
client.once('ready', () => {
  console.log(`🤖 ${client.user.tag} is online and ready!`);
  console.log(`📝 Serving ${Object.keys(flagToLanguage).length} languages`);
  client.user.setActivity('Flag reactions for translation', { type: 'WATCHING' });
});

client.on('messageReactionAdd', async (reaction, user) => {
  try {
    // Ignore bot reactions
    if (user.bot) return;

    // Partial reaction handling
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Error fetching partial reaction:', error);
        return;
      }
    }

    // Partial message handling
    if (reaction.message.partial) {
      try {
        await reaction.message.fetch();
      } catch (error) {
        console.error('Error fetching partial message:', error);
        return;
      }
    }

    const message = reaction.message;
    const emoji = reaction.emoji.name;

    // Check if emoji is a supported flag
    if (!flagToLanguage[emoji]) return;

    // Get message content
    const messageContent = message.content;

    // Apply message filtering
    if (shouldIgnoreMessage(messageContent)) {
      console.log(`Ignoring filtered message: "${messageContent}"`);
      return;
    }

    // Check cache to avoid duplicate translations
    const cacheKey = `${message.id}_${emoji}`;
    const cached = translationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`Translation already cached for message ${message.id} with emoji ${emoji}`);
      return;
    }

    // Mark as being processed
    translationCache.set(cacheKey, { status: 'processing', timestamp: Date.now() });

    const targetLang = flagToLanguage[emoji];
    const languageName = languageNames[targetLang] || targetLang;

    console.log(`🔄 Translating message to ${languageName} (${targetLang})`);

    try {
      const translatedText = await translateText(messageContent, targetLang);

      // Create embed for translation
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`🌐 Translation to ${languageName}`)
        .setDescription(translatedText)
        .addFields([
          { name: 'Original Message', value: messageContent.length > 1024 ? messageContent.substring(0, 1021) + '...' : messageContent },
          { name: 'Requested by', value: user.toString(), inline: true },
          { name: 'Language', value: `${emoji} ${languageName}`, inline: true }
        ])
        .setTimestamp()
        .setFooter({ text: 'Powered by Lingva Translate' });

      // Reply to the original message
      await message.reply({ embeds: [embed] });

      // Update cache with success
      translationCache.set(cacheKey, { status: 'completed', timestamp: Date.now() });
      
      console.log(`✅ Successfully translated message to ${languageName}`);

    } catch (error) {
      console.error(`❌ Translation failed for ${languageName}:`, error.message);

      // Send error message to user
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Translation Error')
        .setDescription(`Sorry, I couldn't translate to ${languageName}. The translation service might be temporarily unavailable.`)
        .addFields([
          { name: 'Requested by', value: user.toString(), inline: true },
          { name: 'Language', value: `${emoji} ${languageName}`, inline: true }
        ])
        .setTimestamp();

      try {
        await message.reply({ embeds: [errorEmbed] });
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }

      // Remove from cache to allow retry
      translationCache.delete(cacheKey);
    }

  } catch (error) {
    console.error('Error in messageReactionAdd event:', error);
  }
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

client.on('warn', (warning) => {
  console.warn('Discord client warning:', warning);
});

// Express routes for uptime monitoring
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    bot: client.user ? client.user.tag : 'Connecting...',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    supportedLanguages: Object.keys(flagToLanguage).length,
    cacheStats: {
      keys: translationCache.size,
      entries: translationCache.size
    }
  });
});

app.get('/health', (req, res) => {
  const isHealthy = client.readyAt !== null && client.ws.status === 0;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    discord: {
      ready: client.readyAt !== null,
      websocket: client.ws.status,
      ping: client.ws.ping
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Close Discord client
  if (client) {
    console.log('🔌 Disconnecting Discord bot...');
    client.destroy();
  }
  
  // Close Express server
  server.close(() => {
    console.log('🌐 Express server closed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.log('⏰ Force exit after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Global server reference for graceful shutdown
let server;

// Start the application
async function startBot() {
  try {
    // Check for Discord token
    if (!process.env.DISCORD_BOT_TOKEN) {
      console.error('❌ DISCORD_BOT_TOKEN environment variable is required!');
      console.log('📝 Please create a .env file with your Discord bot token:');
      console.log('   DISCORD_BOT_TOKEN=your_bot_token_here');
      process.exit(1);
    }

    // Start Express server
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌐 Web server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Start Discord bot
    console.log('🚀 Starting Discord bot...');
    await client.login(process.env.DISCORD_BOT_TOKEN);

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the bot
startBot();