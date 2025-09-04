// index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import fetch from 'node-fetch';

// Mappa delle bandiere → lingue
const flagToLang = {
    "🇮🇹": "it", "🇬🇧": "en", "🇺🇸": "en", "🇪🇸": "es", "🇫🇷": "fr",
    "🇩🇪": "de", "🇷🇺": "ru", "🇵🇹": "pt", "🇧🇪": "nl", "🇳🇱": "nl",
    "🇸🇪": "sv", "🇳🇴": "no", "🇩🇰": "da", "🇫🇮": "fi", "🇵🇱": "pl",
    "🇨🇿": "cs", "🇭🇺": "hu", "🇬🇷": "el", "🇷🇴": "ro", "🇧🇬": "bg",
    "🇭🇷": "hr", "🇸🇮": "sl", "🇱🇹": "lt", "🇱🇻": "lv", "🇪🇪": "et",
    "🇯🇵": "ja", "🇰🇷": "ko", "🇨🇳": "zh", "🇹🇼": "zh-tw", "🇮🇳": "hi",
    "🇮🇩": "id", "🇲🇾": "ms", "🇵🇭": "tl", "🇻🇳": "vi", "🇹🇭": "th",
    "🇸🇦": "ar", "🇮🇷": "fa", "🇹🇷": "tr", "🇮🇱": "he"
};

async function translateText(text, targetLang) {
    const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            q: text.trim(),
            source: 'auto',
            target: targetLang,
            format: 'text'
        })
    });
    const data = await response.json();
    return data.translatedText;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (reaction.partial) await reaction.fetch();
        if (user.bot) return;

        const targetLang = flagToLang[reaction.emoji.name];
        if (!targetLang) return;

        const original = reaction.message.content;
        if (!original) return;

        const translated = await translateText(original, targetLang);
        await reaction.message.reply(`🌐 **Translation [${targetLang.toUpperCase()}]:** ${translated}`);
    } catch (err) {
        console.error('Error in reaction handler:', err);
    }
});

client.login(process.env.BOT_TOKEN);
