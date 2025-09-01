// Discord Translation Bot using discord.js v14
// Translates messages when users react with flag emojis

// Import required modules
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { translate } = require('@vitalets/google-translate-api');
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
const translationCache = new Set();

// Functions for cache management
function createCacheKey(messageId, emoji) {
    return `${messageId}_${emoji}`;
}
function addToCache(messageId, emoji) {
    const cacheKey = createCacheKey(messageId, emoji);
    translationCache.add(cacheKey);
    setTimeout(() => {
        translationCache.delete(cacheKey);
    }, 60000);
}
function isInCache(messageId, emoji) {
    return translationCache.has(createCacheKey(messageId, emoji));
}

// Mapping of flags to languages
const flagToLanguage = {
    '🇮🇹': 'it','🇫🇷': 'fr','🇪🇸': 'es','🇩🇪': 'de','🇳🇱': 'nl','🇵🇹': 'pt',
    '🇷🇺': 'ru','🇵🇱': 'pl','🇸🇪': 'sv','🇳🇴': 'no','🇩🇰': 'da','🇫🇮': 'fi',
    '🇬🇷': 'el','🇭🇺': 'hu','🇨🇿': 'cs','🇸🇰': 'sk','🇷🇴': 'ro','🇧🇬': 'bg',
    '🇭🇷': 'hr','🇸🇮': 'sl','🇱🇹': 'lt','🇱🇻': 'lv','🇪🇪': 'et','🇯🇵': 'ja',
    '🇰🇷': 'ko','🇨🇳': 'zh-cn','🇹🇼': 'zh-tw','🇹🇭': 'th','🇻🇳': 'vi','🇮🇳': 'hi',
    '🇮🇩': 'id','🇲🇾': 'ms','🇵🇭': 'tl','🇸🇦': 'ar','🇮🇷': 'fa','🇹🇷': 'tr',
    '🇮🇱': 'he','🇺🇸': 'en','🇬🇧': 'en','🇨🇦': 'en','🇦🇺': 'en','🇳🇿': 'en',
    '🇿🇦': 'af','🇪🇹': 'am','🇲🇽': 'es','🇧🇷': 'pt','🇦🇷': 'es','🇺🇦': 'uk',
    '🇧🇾': 'be','🇷🇸': 'sr','🇲🇰': 'mk','🇦🇱': 'sq','🇮🇸': 'is','🇮🇪': 'ga',
    '🇲🇹': 'mt','🇱🇺': 'lb','🇨🇭': 'de','🇦🇹': 'de','🇧🇪': 'nl','🇲🇨': 'fr'
};

// ✅ Updated translation with retry system
async function translateText(text, targetLang) {
    try {
        console.log(`Attempting to translate: "${text}" → ${targetLang}`);

        const cleanText = text.trim();
        if (!cleanText) throw new Error('Empty text provided');

        // First attempt
        const result = await translate(cleanText, { to: targetLang });
        if (!result || !result.text) throw new Error('Empty result from API');

        console.log(`Translation successful: "${result.text}"`);
        return result.text;

    } catch (error) {
        console.error('First translation attempt failed:', error.message);

        // Retry once
        try {
            const retry = await translate(text.trim(), { to: targetLang });
            if (!retry || !retry.text) throw new Error('Empty result on retry');
            console.log(`Retry successful: "${retry.text}"`);
            return retry.text;
        } catch (retryError) {
            console.error('Retry failed:', retryError.message);
            throw new Error(`Translation failed (${targetLang}): ${retryError.message}`);
        }
    }
}

// Handle reactions
async function handleReaction(reaction, user) {
    try {
        if (user.bot) return;
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        const emoji = reaction.emoji.name;
        const message = reaction.message;

        if (!flagToLanguage[emoji]) return;
        if (isInCache(message.id, emoji)) return;
        if (!message.content.trim()) return;

        const targetLanguage = flagToLanguage[emoji];
        const translatedText = await translateText(message.content, targetLanguage);

        const replyMessage = `🌐 **Translation to ${getLanguageName(targetLanguage)}** ${emoji}\n\`\`\`\n${translatedText}\n\`\`\``;
        await message.reply(replyMessage);

        addToCache(message.id, emoji);

    } catch (error) {
        console.error('Error in handleReaction:', error);
        try {
            await reaction.message.reply(`❌ Translation failed: ${error.message}`);
        } catch {}
    }
}

// Language names
function getLanguageName(langCode) {
    const names = { 'it':'Italian','fr':'French','es':'Spanish','de':'German','nl':'Dutch','pt':'Portuguese',
        'ru':'Russian','pl':'Polish','sv':'Swedish','no':'Norwegian','da':'Danish','fi':'Finnish',
        'el':'Greek','hu':'Hungarian','cs':'Czech','sk':'Slovak','ro':'Romanian','bg':'Bulgarian',
        'hr':'Croatian','sl':'Slovenian','lt':'Lithuanian','lv':'Latvian','et':'Estonian','ja':'Japanese',
        'ko':'Korean','zh-cn':'Chinese (Simplified)','zh-tw':'Chinese (Traditional)','th':'Thai',
        'vi':'Vietnamese','hi':'Hindi','id':'Indonesian','ms':'Malay','tl':'Filipino','ar':'Arabic',
        'fa':'Persian','tr':'Turkish','he':'Hebrew','en':'English','af':'Afrikaans','am':'Amharic',
        'uk':'Ukrainian','be':'Belarusian','sr':'Serbian','mk':'Macedonian','sq':'Albanian','is':'Icelandic',
        'ga':'Irish','mt':'Maltese','lb':'Luxembourgish' };
    return names[langCode] || langCode.toUpperCase();
}

// Express server for uptime
const app = express();
const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.json({ status: 'OK', uptime: process.uptime() }));
app.get('/health', (req, res) => res.json({ status: client.isReady() ? 'healthy' : 'not ready' }));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// Discord events
client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    client.user.setActivity('flag reactions for translations', { type: 'WATCHING' });
});
client.on('messageReactionAdd', handleReaction);
client.on('error', e => console.error('Discord error:', e));
client.on('warn', w => console.warn('Discord warning:', w));

// Login
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
    console.error('❌ No Discord bot token found in environment variables!');
    process.exit(1);
}
client.login(token);
