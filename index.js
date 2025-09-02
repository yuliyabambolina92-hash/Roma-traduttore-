// Discord Translation Bot using discord.js v14
// Translates messages when users react with flag emojis

// Import required modules
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const translate = require('@vitalets/google-translate-api');
const express = require('express');
require('dotenv').config();

// Create a new Discord client with necessary intents and partials
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

// Cache to track recent translations and prevent duplicates
// Stores combinations of messageId + emoji to prevent duplicate translations
const translationCache = new Set();

/**
 * Creates a cache key for tracking translations
 * @param {string} messageId - Discord message ID
 * @param {string} emoji - Flag emoji used for translation
 * @returns {string} - Unique cache key
 */
function createCacheKey(messageId, emoji) {
    return `${messageId}_${emoji}`;
}

/**
 * Adds a translation to the cache and removes it after 60 seconds
 * @param {string} messageId - Discord message ID
 * @param {string} emoji - Flag emoji used for translation
 */
function addToCache(messageId, emoji) {
    const cacheKey = createCacheKey(messageId, emoji);
    translationCache.add(cacheKey);
    
    // Remove from cache after 60 seconds to allow future translations
    setTimeout(() => {
        translationCache.delete(cacheKey);
        console.log(`Cache entry removed: ${cacheKey}`);
    }, 60000); // 60 seconds
}

/**
 * Checks if a translation was recently sent for this message and emoji
 * @param {string} messageId - Discord message ID
 * @param {string} emoji - Flag emoji used for translation
 * @returns {boolean} - True if translation was recently sent
 */
function isInCache(messageId, emoji) {
    const cacheKey = createCacheKey(messageId, emoji);
    return translationCache.has(cacheKey);
}

// Comprehensive mapping of flag emojis to ISO 639-1 language codes
const flagToLanguage = {
    // European Languages
    '🇮🇹': 'it',    // Italian
    '🇫🇷': 'fr',    // French
    '🇪🇸': 'es',    // Spanish
    '🇩🇪': 'de',    // German
    '🇳🇱': 'nl',    // Dutch
    '🇵🇹': 'pt',    // Portuguese
    '🇷🇺': 'ru',    // Russian
    '🇵🇱': 'pl',    // Polish
    '🇸🇪': 'sv',    // Swedish
    '🇳🇴': 'no',    // Norwegian
    '🇩🇰': 'da',    // Danish
    '🇫🇮': 'fi',    // Finnish
    '🇬🇷': 'el',    // Greek
    '🇭🇺': 'hu',    // Hungarian
    '🇨🇿': 'cs',    // Czech
    '🇸🇰': 'sk',    // Slovak
    '🇷🇴': 'ro',    // Romanian
    '🇧🇬': 'bg',    // Bulgarian
    '🇭🇷': 'hr',    // Croatian
    '🇸🇮': 'sl',    // Slovenian
    '🇱🇹': 'lt',    // Lithuanian
    '🇱🇻': 'lv',    // Latvian
    '🇪🇪': 'et',    // Estonian
    
    // Asian Languages
    '🇯🇵': 'ja',    // Japanese
    '🇰🇷': 'ko',    // Korean
    '🇨🇳': 'zh-cn', // Chinese (Simplified)
    '🇹🇼': 'zh-tw', // Chinese (Traditional)
    '🇹🇭': 'th',    // Thai
    '🇻🇳': 'vi',    // Vietnamese
    '🇮🇳': 'hi',    // Hindi
    '🇮🇩': 'id',    // Indonesian
    '🇲🇾': 'ms',    // Malay
    '🇵🇭': 'tl',    // Filipino
    
    // Middle Eastern Languages
    '🇸🇦': 'ar',    // Arabic
    '🇮🇷': 'fa',    // Persian
    '🇹🇷': 'tr',    // Turkish
    '🇮🇱': 'he',    // Hebrew
    
    // English-speaking countries
    '🇺🇸': 'en',    // English (US)
    '🇬🇧': 'en',    // English (UK)
    '🇨🇦': 'en',    // English (Canada)
    '🇦🇺': 'en',    // English (Australia)
    '🇳🇿': 'en',    // English (New Zealand)
    
    // African Languages
    '🇿🇦': 'af',    // Afrikaans
    '🇪🇹': 'am',    // Amharic
    
    // Other Languages
    '🇲🇽': 'es',    // Spanish (Mexico)
    '🇧🇷': 'pt',    // Portuguese (Brazil)
    '🇦🇷': 'es',    // Spanish (Argentina)
    '🇺🇦': 'uk',    // Ukrainian
    '🇧🇾': 'be',    // Belarusian
    '🇷🇸': 'sr',    // Serbian
    '🇲🇰': 'mk',    // Macedonian
    '🇦🇱': 'sq',    // Albanian
    '🇮🇸': 'is',    // Icelandic
    '🇮🇪': 'ga',    // Irish
    '🇲🇹': 'mt',    // Maltese
    '🇱🇺': 'lb',    // Luxembourgish
    '🇨🇭': 'de',    // German (Switzerland)
    '🇦🇹': 'de',    // German (Austria)
    '🇧🇪': 'nl',    // Dutch (Belgium)
    '🇲🇨': 'fr',    // French (Monaco)
};

/**
 * Translates text to the specified target language
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, targetLang) {
    try {
        console.log(`Attempting to translate: "${text}" to language: ${targetLang}`);
        
        // Clean the text to avoid translation issues
        const cleanText = text.trim();
        if (!cleanText) {
            throw new Error('Empty text provided for translation');
        }
        
        // Use the translation library with proper options
        // Don't specify 'from' to allow automatic source language detection
        const result = await translate(cleanText, { 
            to: targetLang,
            // Don't specify 'from' parameter to allow auto-detection
            // This prevents "AUTO is an invalid source language" errors
        });
        
        // Validate the result
        if (!result || !result.text) {
            throw new Error('Translation API returned empty result');
        }
        
        console.log(`Translation successful: "${result.text}"`);
        return result.text;
    } catch (error) {
        console.error('Translation error details:', {
            message: error.message,
            text: text,
            targetLang: targetLang,
            stack: error.stack
        });
        
        // Handle specific error types
        if (error.message.includes('invalid email')) {
            throw new Error('Translation service temporarily unavailable (authentication issue)');
        } else if (error.message.includes('invalid source language')) {
            throw new Error('Source language detection failed');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
            throw new Error('Translation service connection failed');
        } else {
            throw new Error(`Translation failed: ${error.message}`);
        }
    }
}

/**
 * Handles message reaction events
 * @param {MessageReaction} reaction - The reaction object
 * @param {User} user - The user who reacted
 */
async function handleReaction(reaction, user) {
    try {
        // Ignore bot reactions
        if (user.bot) {
            console.log('Ignoring bot reaction');
            return;
        }

        // Fetch the reaction if it's partial
        if (reaction.partial) {
            try {
                await reaction.fetch();
                console.log('Fetched partial reaction');
            } catch (error) {
                console.error('Error fetching partial reaction:', error);
                return;
            }
        }

        // Fetch the message if it's partial
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
                console.log('Fetched partial message');
            } catch (error) {
                console.error('Error fetching partial message:', error);
                return;
            }
        }

        const emoji = reaction.emoji.name;
        const message = reaction.message;

        console.log(`Reaction detected: ${emoji} by ${user.username} on message: "${message.content}"`);

        // Check if the emoji is a flag emoji we support
        if (!flagToLanguage[emoji]) {
            console.log(`Unsupported flag emoji: ${emoji}`);
            return;
        }

        // Check if we've already translated this message with this emoji recently
        if (isInCache(message.id, emoji)) {
            console.log(`Translation already sent recently for message ${message.id} with emoji ${emoji} - skipping duplicate`);
            return;
        }

        // Check if the message has content to translate
        if (!message.content || message.content.trim() === '') {
            console.log('Message has no content to translate');
            return; // Silently ignore messages without text content
        }
        
        // Ignore messages that are only emojis, links, or mentions
        const textContent = message.content.trim();
        const urlRegex = /https?:\/\/[^\s]+/g;
        const mentionRegex = /<[@#&!][^>]+>/g;
        const emojiRegex = /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        
        // Remove URLs, mentions, and emojis to check if there's actual text
        const cleanedContent = textContent
            .replace(urlRegex, '')
            .replace(mentionRegex, '')
            .replace(emojiRegex, '')
            .trim();
            
        if (!cleanedContent || cleanedContent.length < 2) {
            console.log('Message contains only URLs, mentions, or emojis - skipping translation');
            return;
        }

        const targetLanguage = flagToLanguage[emoji];
        console.log(`Translating to language: ${targetLanguage}`);

        // Translate the message content
        const translatedText = await translateText(message.content, targetLanguage);

        // Create the reply message
        const replyMessage = `🌐 **Translation to ${getLanguageName(targetLanguage)}** ${emoji}\n\`\`\`\n${translatedText}\n\`\`\``;

        // Send the translation as a reply
        await message.reply(replyMessage);
        
        // Add this translation to cache to prevent duplicates
        addToCache(message.id, emoji);
        console.log(`Translation sent successfully and cached: ${message.id}_${emoji}`);

    } catch (error) {
        console.error('Error in handleReaction:', error);
        
        try {
            // Attempt to send an error message to the channel
            await reaction.message.reply('❌ Sorry, I encountered an error while translating this message. Please try again later.');
        } catch (replyError) {
            console.error('Error sending error message:', replyError);
        }
    }
}

/**
 * Gets the human-readable language name from language code
 * @param {string} langCode - ISO 639-1 language code
 * @returns {string} - Human-readable language name
 */
function getLanguageName(langCode) {
    const languageNames = {
        'it': 'Italian',
        'fr': 'French',
        'es': 'Spanish',
        'de': 'German',
        'nl': 'Dutch',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'pl': 'Polish',
        'sv': 'Swedish',
        'no': 'Norwegian',
        'da': 'Danish',
        'fi': 'Finnish',
        'el': 'Greek',
        'hu': 'Hungarian',
        'cs': 'Czech',
        'sk': 'Slovak',
        'ro': 'Romanian',
        'bg': 'Bulgarian',
        'hr': 'Croatian',
        'sl': 'Slovenian',
        'lt': 'Lithuanian',
        'lv': 'Latvian',
        'et': 'Estonian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh-cn': 'Chinese (Simplified)',
        'zh-tw': 'Chinese (Traditional)',
        'th': 'Thai',
        'vi': 'Vietnamese',
        'hi': 'Hindi',
        'id': 'Indonesian',
        'ms': 'Malay',
        'tl': 'Filipino',
        'ar': 'Arabic',
        'fa': 'Persian',
        'tr': 'Turkish',
        'he': 'Hebrew',
        'en': 'English',
        'af': 'Afrikaans',
        'am': 'Amharic',
        'uk': 'Ukrainian',
        'be': 'Belarusian',
        'sr': 'Serbian',
        'mk': 'Macedonian',
        'sq': 'Albanian',
        'is': 'Icelandic',
        'ga': 'Irish',
        'mt': 'Maltese',
        'lb': 'Luxembourgish'
    };
    
    return languageNames[langCode] || langCode.toUpperCase();
}

// Set up Express web server for uptime monitoring
const app = express();
const PORT = process.env.PORT || 5000;

// Root endpoint for uptime monitoring services
app.get('/', (req, res) => {
    const uptime = process.uptime();
    const status = {
        status: 'OK',
        message: 'Discord Translation Bot is running',
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        servers: client.guilds ? client.guilds.cache.size : 0,
        timestamp: new Date().toISOString()
    };
    
    console.log(`Health check requested from ${req.ip}`);
    res.json(status);
});

// Health check endpoint
app.get('/health', (req, res) => {
    const isReady = client.isReady();
    res.status(isReady ? 200 : 503).json({
        status: isReady ? 'healthy' : 'not ready',
        botStatus: isReady ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Start the web server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/`);
    console.log(`🔍 Status endpoint: http://localhost:${PORT}/health`);
});

// Event listener for when the bot is ready
client.once('ready', () => {
    console.log(`🤖 Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`📝 Bot is active in ${client.guilds.cache.size} servers`);
    
    // Set bot status
    client.user.setActivity('flag reactions for translations', { type: 'WATCHING' });
});

// Event listener for message reactions
client.on('messageReactionAdd', handleReaction);

// Event listener for errors
client.on('error', error => {
    console.error('Discord client error:', error);
});

// Event listener for warnings
client.on('warn', warning => {
    console.warn('Discord client warning:', warning);
});

// Event listener for debug messages (optional, can be removed in production)
client.on('debug', info => {
    // Uncomment the line below if you want to see debug messages
    // console.log('Debug:', info);
});

// Login to Discord with the bot token
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error('❌ Discord bot token not found! Please check your .env file.');
    console.error('Make sure you have a .env file with DISCORD_BOT_TOKEN=your_bot_token_here');
    process.exit(1);
}

console.log('🚀 Starting Discord Translation Bot...');
client.login(token).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    client.destroy();
    process.exit(0);
});
