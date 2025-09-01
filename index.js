// Discord Translation Bot using discord.js v14
// Translates messages when users react with flag emojis

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const translate = require('@vitalets/google-translate-api'); // ✅ Funzione corretta
const express = require('express');
require('dotenv').config();

// --- Discord Client ---
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

// --- Translation Cache ---
const translationCache = new Set();
function createCacheKey(messageId, emoji) { return `${messageId}_${emoji}`; }
function addToCache(messageId, emoji) {
    const key = createCacheKey(messageId, emoji);
    translationCache.add(key);
    setTimeout(() => translationCache.delete(key), 60000); // 60 sec
}
function isInCache(messageId, emoji) { return translationCache.has(createCacheKey(messageId, emoji)); }

// --- Flag to Language Mapping ---
const flagToLanguage = {
    '🇮🇹':'it','🇫🇷':'fr','🇪🇸':'es','🇩🇪':'de','🇳🇱':'nl','🇵🇹':'pt','🇷🇺':'ru','🇵🇱':'pl',
    '🇸🇪':'sv','🇳🇴':'no','🇩🇰':'da','🇫🇮':'fi','🇬🇷':'el','🇭🇺':'hu','🇨🇿':'cs','🇸🇰':'sk',
    '🇷🇴':'ro','🇧🇬':'bg','🇭🇷':'hr','🇸🇮':'sl','🇱🇹':'lt','🇱🇻':'lv','🇪🇪':'et',
    '🇯🇵':'ja','🇰🇷':'ko','🇨🇳':'zh-cn','🇹🇼':'zh-tw','🇹🇭':'th','🇻🇳':'vi','🇮🇳':'hi','🇮🇩':'id',
    '🇲🇾':'ms','🇵🇭':'tl','🇸🇦':'ar','🇮🇷':'fa','🇹🇷':'tr','🇮🇱':'he','🇺🇸':'en','🇬🇧':'en',
    '🇨🇦':'en','🇦🇺':'en','🇳🇿':'en','🇿🇦':'af','🇪🇹':'am','🇲🇽':'es','🇧🇷':'pt','🇦🇷':'es',
    '🇺🇦':'uk','🇧🇾':'be','🇷🇸':'sr','🇲🇰':'mk','🇦🇱':'sq','🇮🇸':'is','🇮🇪':'ga','🇲🇹':'mt',
    '🇱🇺':'lb','🇨🇭':'de','🇦🇹':'de','🇧🇪':'nl','🇲🇨':'fr'
};

// --- Improved translateText Function with rate limiting ---
let lastTranslationTime = 0;
async function translateText(text, targetLang) {
    try {
        const now = Date.now();
        const timeSinceLast = now - lastTranslationTime;
        if (timeSinceLast < 2000) await new Promise(r => setTimeout(r, 2000 - timeSinceLast));
        lastTranslationTime = Date.now();

        const cleanText = text.trim();
        if (!cleanText) throw new Error('Empty text provided for translation');

        const result = await translate(cleanText, { to: targetLang });
        if (!result || !result.text) throw new Error('Empty result from translation API');

        console.log(`✅ Translation successful: "${result.text}"`);
        return result.text;
    } catch (error) {
        console.error('❌ Translation error:', error.message);
        throw new Error(`Translation failed (${targetLang}): ${error.message}`);
    }
}

// --- Helper: Language Name ---
function getLanguageName(code) {
    const names = {
        it:'Italian',fr:'French',es:'Spanish',de:'German',nl:'Dutch',pt:'Portuguese',ru:'Russian',
        pl:'Polish',sv:'Swedish',no:'Norwegian',da:'Danish',fi:'Finnish',el:'Greek',hu:'Hungarian',
        cs:'Czech',sk:'Slovak',ro:'Romanian',bg:'Bulgarian',hr:'Croatian',sl:'Slovenian',lt:'Lithuanian',
        lv:'Latvian',et:'Estonian',ja:'Japanese',ko:'Korean','zh-cn':'Chinese (Simplified)','zh-tw':'Chinese (Traditional)',
        th:'Thai',vi:'Vietnamese',hi:'Hindi',id:'Indonesian',ms:'Malay',tl:'Filipino',ar:'Arabic',fa:'Persian',
        tr:'Turkish',he:'Hebrew',en:'English',af:'Afrikaans',am:'Amharic',uk:'Ukrainian',be:'Belarusian',
        sr:'Serbian',mk:'Macedonian',sq:'Albanian',is:'Icelandic',ga:'Irish',mt:'Maltese',lb:'Luxembourgish'
    };
    return names[code] || code.toUpperCase();
}

// --- Handle Reactions ---
async function handleReaction(reaction, user) {
    try {
        if (user.bot) return;
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        const emoji = reaction.emoji.name;
        const message = reaction.message;
        if (!flagToLanguage[emoji]) return;
        if (isInCache(message.id, emoji)) return;
        if (!message.content || message.content.trim().length < 2) return;

        const targetLang = flagToLanguage[emoji];
        const translated = await translateText(message.content, targetLang);
        await message.reply(`🌐 **Translation to ${getLanguageName(targetLang)}** ${emoji}\n\`\`\`\n${translated}\n\`\`\``);
        addToCache(message.id, emoji);

    } catch (error) {
        console.error('Error in handleReaction:', error);
        try { await reaction.message.reply('❌ Error translating this message.'); } catch {}
    }
}

// --- Express Server for UptimeRobot ---
const app = express();
const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('Discord Translation Bot is running ✅'));
app.get('/health', (req, res) => res.status(client.isReady() ? 200 : 503).json({ status: client.isReady() ? 'healthy' : 'not ready' }));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Web server running on port ${PORT}`));

// --- Discord Events ---
client.once('ready', () => {
    console.log(`🤖 Bot ready as ${client.user.tag} in ${client.guilds.cache.size} servers`);
    client.user.setActivity('flag reactions for translations', { type: 'WATCHING' });
});
client.on('messageReactionAdd', handleReaction);
client.on('error', console.error);
client.on('warn', console.warn);

// --- Login ---
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) { console.error('❌ Bot token missing!'); process.exit(1); }
client.login(token).catch(e => { console.error('❌ Failed login:', e); process.exit(1); });

// --- Graceful Shutdown ---
process.on('SIGINT', () => { client.destroy(); process.exit(0); });
process.on('SIGTERM', () => { client.destroy(); process.exit(0); });
