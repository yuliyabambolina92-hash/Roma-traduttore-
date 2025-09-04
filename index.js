require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fetch = require('node-fetch');

// Dizionario emoji → codice lingua ISO 639-1
const flagToLang = {
    // Europe
    "🇮🇹": "it", "🇬🇧": "en", "🇺🇸": "en", "🇪🇸": "es", "🇫🇷": "fr",
    "🇩🇪": "de", "🇷🇺": "ru", "🇵🇹": "pt", "🇧🇪": "nl", "🇳🇱": "nl",
    "🇸🇪": "sv", "🇳🇴": "no", "🇩🇰": "da", "🇫🇮": "fi", "🇵🇱": "pl",
    "🇨🇿": "cs", "🇭🇺": "hu", "🇬🇷": "el", "🇷🇴": "ro", "🇧🇬": "bg",
    "🇭🇷": "hr", "🇸🇮": "sl", "🇱🇹": "lt", "🇱🇻": "lv", "🇪🇪": "et",
    "🇮🇸": "is", "🇱🇺": "lb", "🇲🇹": "mt", "🇦🇹": "de", "🇨🇭": "de",
    "🇷🇸": "sr", "🇲🇰": "mk", "🇦🇱": "sq", "🇧🇾": "be", "🇺🇦": "uk",
    // Asia
    "🇯🇵": "ja", "🇰🇷": "ko", "🇨🇳": "zh", "🇹🇼": "zh-tw", "🇮🇳": "hi",
    "🇮🇩": "id", "🇲🇾": "ms", "🇵🇭": "tl", "🇻🇳": "vi", "🇹🇭": "th",
    "🇸🇦": "ar", "🇮🇷": "fa", "🇹🇷": "tr", "🇮🇱": "he",
    // Africa
    "🇿🇦": "af", "🇪🇹": "am", "🇳🇬": "yo", "🇰🇪": "sw", "🇲🇦": "ar",
    // Americas
    "🇨🇦": "en", "🇦🇷": "es", "🇧🇷": "pt", "🇲🇽": "es", "🇨🇱": "es",
    "🇵🇪": "es", "🇺🇸": "en",
    // Oceania
    "🇦🇺": "en", "🇳🇿": "en"
    // puoi aggiungere altre bandiere specifiche se servono
};

// Funzione per tradurre con LibreTranslate
async function translateText(text, targetLang) {
    try {
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

        if (!response.ok) throw new Error(`LibreTranslate API error: ${response.status}`);
        const data = await response.json();
        if (!data || !data.translatedText) throw new Error('Empty translation result');
        return data.translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

// Client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Quando il bot è pronto
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// Reazione con bandiera → traduce
client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (reaction.partial) await reaction.fetch();
        if (user.bot) return;

        const targetLang = flagToLang[reaction.emoji.name];
        if (!targetLang) return; // non supportato

        const original = reaction.message.content;
        if (!original) return;

        const translated = await translateText(original, targetLang);
        await reaction.message.reply(`🌐 **Translation [${targetLang.toUpperCase()}]:** ${translated}`);
    } catch (err) {
        console.error('Error in reaction handler:', err);
    }
});

// Login
client.login(process.env.BOT_TOKEN);
