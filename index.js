/**
 * Discord Translation Bot v2.0
 * 
 * A comprehensive Discord bot that automatically translates messages when users
 * react with flag emojis. Built with discord.js v14.22.1 and includes:
 * - Real-time message translation with 100+ languages
 * - Intelligent caching to prevent duplicate translations
 * - Robust error handling and logging
 * - Express web server for uptime monitoring
 * - Production-ready architecture for Replit/Render deployment
 * 
 * Author: AI Assistant
 * Version: 2.0.0
 * License: MIT
 */

// Import required modules
const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    ActivityType,
    Events 
} = require('discord.js');
const { translate } = require('@vitalets/google-translate-api');
const express = require('express');
require('dotenv').config();

// Configuration constants
const CONFIG = {
    PORT: process.env.PORT || 5000,
    CACHE_DURATION: 60000, // 60 seconds
    TRANSLATION_TIMEOUT: 15000, // 15 seconds
    MIN_TEXT_LENGTH: 2,
    MAX_RETRIES: 2
};

// Create Discord client with optimized intents and partials
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
        Partials.Reaction,
        Partials.User
    ],
    // Performance optimizations
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: false
    }
});

// In-memory cache for translation tracking and performance
const translationCache = new Map();
const performanceMetrics = {
    translationsProcessed: 0,
    duplicatesPrevented: 0,
    errorsHandled: 0,
    startTime: Date.now()
};

/**
 * Comprehensive flag emoji to ISO 639-1 language code mapping
 * Supports 100+ languages with regional variants
 */
const flagToLanguage = {
    // Major European Languages
    '🇬🇧': 'en',    // English (UK)
    '🇺🇸': 'en',    // English (US)
    '🇨🇦': 'en',    // English (Canada)
    '🇦🇺': 'en',    // English (Australia)
    '🇳🇿': 'en',    // English (New Zealand)
    '🇮🇪': 'en',    // English (Ireland)
    '🇿🇦': 'en',    // English (South Africa)
    
    '🇫🇷': 'fr',    // French (France)
    '🇧🇪': 'fr',    // French (Belgium)
    '🇨🇭': 'fr',    // French (Switzerland)
    '🇲🇨': 'fr',    // French (Monaco)
    '🇱🇺': 'fr',    // French (Luxembourg)
    
    '🇪🇸': 'es',    // Spanish (Spain)
    '🇲🇽': 'es',    // Spanish (Mexico)
    '🇦🇷': 'es',    // Spanish (Argentina)
    '🇨🇴': 'es',    // Spanish (Colombia)
    '🇵🇪': 'es',    // Spanish (Peru)
    '🇻🇪': 'es',    // Spanish (Venezuela)
    '🇨🇱': 'es',    // Spanish (Chile)
    '🇪🇨': 'es',    // Spanish (Ecuador)
    '🇬🇹': 'es',    // Spanish (Guatemala)
    '🇨🇺': 'es',    // Spanish (Cuba)
    '🇩🇴': 'es',    // Spanish (Dominican Republic)
    '🇭🇳': 'es',    // Spanish (Honduras)
    '🇵🇾': 'es',    // Spanish (Paraguay)
    '🇳🇮': 'es',    // Spanish (Nicaragua)
    '🇨🇷': 'es',    // Spanish (Costa Rica)
    '🇵🇦': 'es',    // Spanish (Panama)
    '🇺🇾': 'es',    // Spanish (Uruguay)
    '🇧🇴': 'es',    // Spanish (Bolivia)
    '🇸🇻': 'es',    // Spanish (El Salvador)
    
    '🇩🇪': 'de',    // German (Germany)
    '🇦🇹': 'de',    // German (Austria)
    
    '🇮🇹': 'it',    // Italian
    '🇵🇹': 'pt',    // Portuguese (Portugal)
    '🇧🇷': 'pt',    // Portuguese (Brazil)
    '🇳🇱': 'nl',    // Dutch
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
    '🇺🇦': 'uk',    // Ukrainian
    '🇧🇾': 'be',    // Belarusian
    '🇷🇸': 'sr',    // Serbian
    '🇲🇰': 'mk',    // Macedonian
    '🇦🇱': 'sq',    // Albanian
    '🇮🇸': 'is',    // Icelandic
    '🇲🇹': 'mt',    // Maltese
    
    // Asian Languages
    '🇯🇵': 'ja',    // Japanese
    '🇰🇷': 'ko',    // Korean
    '🇨🇳': 'zh',    // Chinese (Simplified)
    '🇹🇼': 'zh-tw', // Chinese (Traditional)
    '🇭🇰': 'zh-tw', // Chinese (Hong Kong)
    '🇸🇬': 'zh',    // Chinese (Singapore)
    '🇹🇭': 'th',    // Thai
    '🇻🇳': 'vi',    // Vietnamese
    '🇮🇳': 'hi',    // Hindi
    '🇮🇩': 'id',    // Indonesian
    '🇲🇾': 'ms',    // Malay
    '🇵🇭': 'tl',    // Filipino
    '🇱🇰': 'si',    // Sinhala
    '🇧🇩': 'bn',    // Bengali
    '🇵🇰': 'ur',    // Urdu
    '🇳🇵': 'ne',    // Nepali
    '🇲🇲': 'my',    // Myanmar
    '🇰🇭': 'km',    // Khmer
    '🇱🇦': 'lo',    // Lao
    '🇲🇳': 'mn',    // Mongolian
    '🇰🇿': 'kk',    // Kazakh
    '🇺🇿': 'uz',    // Uzbek
    '🇹🇯': 'tg',    // Tajik
    '🇰🇬': 'ky',    // Kyrgyz
    '🇹🇲': 'tk',    // Turkmen
    '🇦🇫': 'ps',    // Pashto
    
    // Middle Eastern Languages
    '🇸🇦': 'ar',    // Arabic
    '🇦🇪': 'ar',    // Arabic (UAE)
    '🇪🇬': 'ar',    // Arabic (Egypt)
    '🇯🇴': 'ar',    // Arabic (Jordan)
    '🇱🇧': 'ar',    // Arabic (Lebanon)
    '🇸🇾': 'ar',    // Arabic (Syria)
    '🇮🇶': 'ar',    // Arabic (Iraq)
    '🇰🇼': 'ar',    // Arabic (Kuwait)
    '🇶🇦': 'ar',    // Arabic (Qatar)
    '🇧🇭': 'ar',    // Arabic (Bahrain)
    '🇴🇲': 'ar',    // Arabic (Oman)
    '🇾🇪': 'ar',    // Arabic (Yemen)
    '🇲🇦': 'ar',    // Arabic (Morocco)
    '🇩🇿': 'ar',    // Arabic (Algeria)
    '🇹🇳': 'ar',    // Arabic (Tunisia)
    '🇱🇾': 'ar',    // Arabic (Libya)
    '🇸🇩': 'ar',    // Arabic (Sudan)
    
    '🇮🇷': 'fa',    // Persian
    '🇹🇷': 'tr',    // Turkish
    '🇮🇱': 'he',    // Hebrew
    '🇦🇲': 'hy',    // Armenian
    '🇬🇪': 'ka',    // Georgian
    '🇦🇿': 'az',    // Azerbaijani
    
    // African Languages
    '🇳🇬': 'yo',    // Yoruba
    '🇰🇪': 'sw',    // Swahili
    '🇹🇿': 'sw',    // Swahili
    '🇺🇬': 'sw',    // Swahili
    '🇪🇹': 'am',    // Amharic
    '🇿🇼': 'sn',    // Shona
    '🇿🇲': 'ny',    // Chichewa
    '🇲🇼': 'ny',    // Chichewa
    '🇬🇭': 'tw',    // Twi
    '🇨🇮': 'fr',    // French (Ivory Coast)
    '🇸🇳': 'wo',    // Wolof
    '🇲🇱': 'bm',    // Bambara
    '🇧🇫': 'fr',    // French (Burkina Faso)
    '🇳🇪': 'ha',    // Hausa
    '🇹🇩': 'fr',    // French (Chad)
    '🇨🇲': 'fr',    // French (Cameroon)
    '🇨🇫': 'fr',    // French (Central African Republic)
    '🇨🇬': 'fr',    // French (Congo)
    '🇨🇩': 'fr',    // French (Democratic Republic of Congo)
    '🇬🇦': 'fr',    // French (Gabon)
    '🇬🇳': 'fr',    // French (Guinea)
    '🇲🇬': 'mg',    // Malagasy
    '🇲🇺': 'fr',    // French (Mauritius)
    '🇷🇼': 'rw',    // Kinyarwanda
    '🇧🇮': 'rn',    // Kirundi
    
    // Additional European Languages
    '🇺🇾': 'es',    // Spanish (Uruguay)
    '🇵🇦': 'es',    // Spanish (Panama)
    '🇧🇿': 'en',    // English (Belize)
    '🇬🇾': 'en',    // English (Guyana)
    '🇸🇷': 'nl',    // Dutch (Suriname)
    '🇬🇫': 'fr',    // French (French Guiana)
    '🇦🇩': 'ca',    // Catalan
    '🇻🇦': 'la',    // Latin
    '🇸🇲': 'it',    // Italian (San Marino)
    '🇱🇮': 'de',    // German (Liechtenstein)
    
    // Pacific and Oceania
    '🇫🇯': 'fj',    // Fijian
    '🇹🇴': 'to',    // Tongan
    '🇼🇸': 'sm',    // Samoan
    '🇵🇬': 'en',    // English (Papua New Guinea)
    '🇻🇺': 'bi',    // Bislama
    '🇸🇧': 'en',    // English (Solomon Islands)
    '🇳🇨': 'fr',    // French (New Caledonia)
    '🇵🇫': 'fr',    // French (French Polynesia)
    
    // Additional Asian Languages
    '🇧🇳': 'ms',    // Malay (Brunei)
    '🇹🇱': 'pt',    // Portuguese (East Timor)
    '🇲🇻': 'dv',    // Dhivehi
    '🇧🇹': 'dz',    // Dzongkha
    '🇱🇰': 'ta',    // Tamil (Sri Lanka)
};

/**
 * Human-readable language names for display
 */
const languageNames = {
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'nl': 'Dutch',
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
    'uk': 'Ukrainian',
    'be': 'Belarusian',
    'sr': 'Serbian',
    'mk': 'Macedonian',
    'sq': 'Albanian',
    'is': 'Icelandic',
    'mt': 'Maltese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
    'zh-tw': 'Chinese (Traditional)',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'hi': 'Hindi',
    'id': 'Indonesian',
    'ms': 'Malay',
    'tl': 'Filipino',
    'si': 'Sinhala',
    'bn': 'Bengali',
    'ur': 'Urdu',
    'ne': 'Nepali',
    'my': 'Myanmar',
    'km': 'Khmer',
    'lo': 'Lao',
    'mn': 'Mongolian',
    'kk': 'Kazakh',
    'uz': 'Uzbek',
    'tg': 'Tajik',
    'ky': 'Kyrgyz',
    'tk': 'Turkmen',
    'ps': 'Pashto',
    'ar': 'Arabic',
    'fa': 'Persian',
    'tr': 'Turkish',
    'he': 'Hebrew',
    'hy': 'Armenian',
    'ka': 'Georgian',
    'az': 'Azerbaijani',
    'yo': 'Yoruba',
    'sw': 'Swahili',
    'am': 'Amharic',
    'sn': 'Shona',
    'ny': 'Chichewa',
    'tw': 'Twi',
    'wo': 'Wolof',
    'bm': 'Bambara',
    'ha': 'Hausa',
    'mg': 'Malagasy',
    'rw': 'Kinyarwanda',
    'rn': 'Kirundi',
    'ca': 'Catalan',
    'la': 'Latin',
    'fj': 'Fijian',
    'to': 'Tongan',
    'sm': 'Samoan',
    'bi': 'Bislama',
    'dv': 'Dhivehi',
    'dz': 'Dzongkha',
    'ta': 'Tamil'
};

/**
 * Creates a unique cache key for translation tracking
 */
function createCacheKey(messageId, emoji) {
    return `${messageId}_${emoji}`;
}

/**
 * Adds translation to cache with automatic cleanup
 */
function addToCache(messageId, emoji) {
    const cacheKey = createCacheKey(messageId, emoji);
    const expirationTime = Date.now() + CONFIG.CACHE_DURATION;
    
    translationCache.set(cacheKey, {
        timestamp: Date.now(),
        expires: expirationTime
    });
    
    // Schedule cleanup
    setTimeout(() => {
        translationCache.delete(cacheKey);
        console.log(`🗑️ Cache entry expired: ${cacheKey}`);
    }, CONFIG.CACHE_DURATION);
    
    console.log(`💾 Translation cached: ${cacheKey} (expires in ${CONFIG.CACHE_DURATION/1000}s)`);
}

/**
 * Checks if translation was recently sent
 */
function isInCache(messageId, emoji) {
    const cacheKey = createCacheKey(messageId, emoji);
    const entry = translationCache.get(cacheKey);
    
    if (!entry) return false;
    
    // Check if entry has expired
    if (Date.now() > entry.expires) {
        translationCache.delete(cacheKey);
        return false;
    }
    
    return true;
}

/**
 * Validates and cleans message content for translation
 */
function validateMessageContent(content) {
    if (!content || typeof content !== 'string') {
        return { valid: false, reason: 'No content provided' };
    }
    
    const trimmed = content.trim();
    if (trimmed.length === 0) {
        return { valid: false, reason: 'Empty content' };
    }
    
    if (trimmed.length < CONFIG.MIN_TEXT_LENGTH) {
        return { valid: false, reason: 'Content too short' };
    }
    
    // Remove various non-translatable elements
    const urlRegex = /https?:\/\/[^\s]+/gi;
    const mentionRegex = /<[@#&!]\d+>|<@[&!]?\d+>/gi;
    const channelRegex = /<#\d+>/gi;
    const customEmojiRegex = /<a?:\w+:\d+>/gi;
    const unicodeEmojiRegex = /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const codeBlockRegex = /```[\s\S]*?```|`[^`]+`/gi;
    const spoilerRegex = /\|\|[\s\S]*?\|\|/gi;
    
    const cleaned = trimmed
        .replace(urlRegex, '')
        .replace(mentionRegex, '')
        .replace(channelRegex, '')
        .replace(customEmojiRegex, '')
        .replace(unicodeEmojiRegex, '')
        .replace(codeBlockRegex, '')
        .replace(spoilerRegex, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    if (cleaned.length < CONFIG.MIN_TEXT_LENGTH) {
        return { valid: false, reason: 'No translatable content after filtering' };
    }
    
    // Check if content contains actual words (not just numbers/symbols)
    const wordRegex = /[a-zA-ZÀ-ÿ\u0100-\u017F\u0400-\u04FF\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u0590-\u05FF\u0600-\u06FF]/;
    if (!wordRegex.test(cleaned)) {
        return { valid: false, reason: 'No recognizable words found' };
    }
    
    return { valid: true, content: cleaned };
}

/**
 * Advanced translation function with retry logic and error handling
 */
async function translateText(text, targetLang, retryCount = 0) {
    try {
        console.log(`🔄 Translation attempt ${retryCount + 1}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" → ${targetLang}`);
        
        const validation = validateMessageContent(text);
        if (!validation.valid) {
            throw new Error(`Invalid content: ${validation.reason}`);
        }
        
        // Translation options with timeout
        const options = {
            to: targetLang,
            // Don't specify 'from' to allow auto-detection
            requestOptions: {
                timeout: CONFIG.TRANSLATION_TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }
        };
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Translation timeout')), CONFIG.TRANSLATION_TIMEOUT);
        });
        
        // Race between translation and timeout
        const result = await Promise.race([
            translate(validation.content, options),
            timeoutPromise
        ]);
        
        // Validate result
        if (!result || !result.text || result.text.trim() === '') {
            throw new Error('Empty translation result');
        }
        
        const translatedText = result.text.trim();
        
        // Check if translation is identical to original (might indicate no translation needed)
        if (translatedText.toLowerCase() === validation.content.toLowerCase()) {
            console.log(`ℹ️ Translation identical to original (already in target language)`);
        }
        
        console.log(`✅ Translation successful: "${translatedText.substring(0, 50)}${translatedText.length > 50 ? '...' : ''}"`);
        performanceMetrics.translationsProcessed++;
        
        return translatedText;
        
    } catch (error) {
        console.error(`❌ Translation error (attempt ${retryCount + 1}):`, {
            message: error.message,
            code: error.code,
            targetLang,
            retryCount
        });
        
        // Retry logic for transient errors
        if (retryCount < CONFIG.MAX_RETRIES && isRetryableError(error)) {
            console.log(`🔄 Retrying translation in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return translateText(text, targetLang, retryCount + 1);
        }
        
        performanceMetrics.errorsHandled++;
        throw new Error(getHumanReadableError(error));
    }
}

/**
 * Determines if an error is worth retrying
 */
function isRetryableError(error) {
    const retryableErrors = [
        'timeout',
        'ETIMEDOUT',
        'ECONNRESET',
        'ENOTFOUND',
        'network',
        'fetch'
    ];
    
    return retryableErrors.some(keyword => 
        error.message.toLowerCase().includes(keyword)
    );
}

/**
 * Converts technical errors to user-friendly messages
 */
function getHumanReadableError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('etimedout')) {
        return 'Translation service is temporarily slow - please try again';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('enotfound')) {
        return 'Network connection issue - please try again later';
    }
    if (message.includes('rate limit') || message.includes('429')) {
        return 'Too many translation requests - please wait a moment';
    }
    if (message.includes('invalid') && message.includes('language')) {
        return 'Language not supported for this text';
    }
    if (message.includes('empty') || message.includes('no translatable')) {
        return 'Message contains no translatable text';
    }
    if (message.includes('too short')) {
        return 'Message is too short to translate';
    }
    
    return 'Translation temporarily unavailable - please try again';
}

/**
 * Gets human-readable language name
 */
function getLanguageName(langCode) {
    return languageNames[langCode] || langCode.toUpperCase();
}

/**
 * Main reaction handler with comprehensive error handling
 */
async function handleReaction(reaction, user) {
    try {
        // Ignore bot reactions
        if (user.bot) {
            console.log(`🤖 Ignoring bot reaction from ${user.username}`);
            return;
        }
        
        // Handle partial reactions
        if (reaction.partial) {
            try {
                await reaction.fetch();
                console.log(`📥 Fetched partial reaction`);
            } catch (fetchError) {
                console.error(`❌ Failed to fetch partial reaction:`, fetchError.message);
                return;
            }
        }
        
        // Handle partial messages
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
                console.log(`📥 Fetched partial message`);
            } catch (fetchError) {
                console.error(`❌ Failed to fetch partial message:`, fetchError.message);
                return;
            }
        }
        
        const emoji = reaction.emoji.name;
        const message = reaction.message;
        
        console.log(`👆 Reaction detected: ${emoji} by ${user.username} on message: "${message.content?.substring(0, 50) || 'No content'}${(message.content?.length || 0) > 50 ? '...' : ''}"`);
        
        // Check if emoji is supported
        if (!flagToLanguage[emoji]) {
            console.log(`❓ Unsupported flag emoji: ${emoji}`);
            return;
        }
        
        // Check for duplicate translation
        if (isInCache(message.id, emoji)) {
            console.log(`🔄 Duplicate translation prevented for ${message.id} with ${emoji}`);
            performanceMetrics.duplicatesPrevented++;
            return;
        }
        
        // Validate message content
        const validation = validateMessageContent(message.content);
        if (!validation.valid) {
            console.log(`❌ Message validation failed: ${validation.reason}`);
            return;
        }
        
        const targetLanguage = flagToLanguage[emoji];
        const languageName = getLanguageName(targetLanguage);
        
        console.log(`🌐 Starting translation to ${languageName} (${targetLanguage})`);
        
        // Perform translation
        const translatedText = await translateText(validation.content, targetLanguage);
        
        // Create formatted reply
        const replyContent = `🌐 **Translation to ${languageName}** ${emoji}\n\`\`\`\n${translatedText}\n\`\`\``;
        
        // Send reply with error handling
        try {
            await message.reply({
                content: replyContent,
                allowedMentions: { repliedUser: false }
            });
            
            // Cache successful translation
            addToCache(message.id, emoji);
            
            console.log(`✅ Translation sent and cached successfully`);
            
        } catch (replyError) {
            console.error(`❌ Failed to send translation reply:`, replyError.message);
            
            // Try fallback: send in same channel without reply
            try {
                await message.channel.send(replyContent);
                addToCache(message.id, emoji);
                console.log(`✅ Translation sent as regular message (fallback)`);
            } catch (fallbackError) {
                console.error(`❌ Fallback message also failed:`, fallbackError.message);
                throw new Error('Failed to send translation message');
            }
        }
        
    } catch (error) {
        console.error(`💥 Error in handleReaction:`, {
            error: error.message,
            user: user?.username,
            emoji: reaction?.emoji?.name,
            messageId: reaction?.message?.id
        });
        
        performanceMetrics.errorsHandled++;
        
        // Try to send error message to user
        try {
            const errorMessage = `❌ ${getHumanReadableError(error)}`;
            await reaction.message.reply({
                content: errorMessage,
                allowedMentions: { repliedUser: false }
            });
        } catch (errorReplyFailed) {
            console.error(`❌ Failed to send error message:`, errorReplyFailed.message);
        }
    }
}

/**
 * Performance monitoring and cleanup
 */
function performanceCleanup() {
    // Clean expired cache entries
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of translationCache.entries()) {
        if (now > entry.expires) {
            translationCache.delete(key);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
    }
    
    // Log performance metrics
    const uptime = Math.floor((Date.now() - performanceMetrics.startTime) / 1000);
    console.log(`📊 Performance Stats - Uptime: ${uptime}s, Translations: ${performanceMetrics.translationsProcessed}, Duplicates Prevented: ${performanceMetrics.duplicatesPrevented}, Errors: ${performanceMetrics.errorsHandled}, Cache Size: ${translationCache.size}`);
}

// Set up Express web server for uptime monitoring
const app = express();

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('X-Powered-By', 'Discord Translation Bot v2.0');
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`🌐 ${timestamp} - ${req.method} ${req.path} from ${req.ip || req.connection.remoteAddress}`);
    next();
});

// Root endpoint - comprehensive status
app.get('/', (req, res) => {
    try {
        const uptime = Math.floor((Date.now() - performanceMetrics.startTime) / 1000);
        const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`;
        
        const status = {
            status: 'OK',
            message: 'Discord Translation Bot is running',
            version: '2.0.0',
            uptime: uptimeFormatted,
            uptimeSeconds: uptime,
            bot: {
                connected: client.isReady(),
                username: client.user?.username || 'Not connected',
                id: client.user?.id || null,
                servers: client.guilds?.cache.size || 0,
                supportedLanguages: Object.keys(flagToLanguage).length
            },
            performance: {
                translationsProcessed: performanceMetrics.translationsProcessed,
                duplicatesPrevented: performanceMetrics.duplicatesPrevented,
                errorsHandled: performanceMetrics.errorsHandled,
                cacheSize: translationCache.size
            },
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                memoryUsage: process.memoryUsage(),
                pid: process.pid
            },
            timestamp: new Date().toISOString()
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(status);
        
    } catch (error) {
        console.error('❌ Error in root endpoint:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    try {
        const isHealthy = client.isReady();
        const health = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            bot: {
                connected: isHealthy,
                latency: client.ws.ping || null,
                uptime: client.uptime || null
            },
            server: {
                port: CONFIG.PORT,
                timestamp: new Date().toISOString()
            }
        };
        
        res.status(isHealthy ? 200 : 503).json(health);
        
    } catch (error) {
        console.error('❌ Error in health endpoint:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

// Simple ping endpoint
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// Languages endpoint - show supported languages
app.get('/languages', (req, res) => {
    try {
        const languages = Object.entries(flagToLanguage).map(([emoji, code]) => ({
            emoji,
            code,
            name: getLanguageName(code)
        }));
        
        res.json({
            total: languages.length,
            languages: languages.sort((a, b) => a.name.localeCompare(b.name))
        });
    } catch (error) {
        console.error('❌ Error in languages endpoint:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get languages' });
    }
});

// Stats endpoint
app.get('/stats', (req, res) => {
    try {
        res.json({
            performance: performanceMetrics,
            cache: {
                size: translationCache.size,
                entries: Array.from(translationCache.keys())
            },
            uptime: Math.floor((Date.now() - performanceMetrics.startTime) / 1000)
        });
    } catch (error) {
        console.error('❌ Error in stats endpoint:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get stats' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Endpoint not found',
        availableEndpoints: ['/', '/health', '/ping', '/languages', '/stats'],
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('🚨 Express error:', error);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Start web server with enhanced error handling
const server = app.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`🌐 Express server running on port ${CONFIG.PORT}`);
    console.log(`📡 Health check: http://localhost:${CONFIG.PORT}/`);
    console.log(`🔍 Status endpoint: http://localhost:${CONFIG.PORT}/health`);
    console.log(`🌍 Languages: http://localhost:${CONFIG.PORT}/languages`);
});

// Server error handling
server.on('error', (error) => {
    console.error('🚨 Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.log(`❌ Port ${CONFIG.PORT} is busy. Please check if another instance is running.`);
        process.exit(1);
    }
});

server.on('listening', () => {
    const address = server.address();
    console.log(`✅ Server successfully listening on ${address.address}:${address.port}`);
});

// Discord bot event handlers
client.once(Events.ClientReady, () => {
    console.log(`🤖 Bot ready! Logged in as ${client.user.tag}`);
    console.log(`📝 Active in ${client.guilds.cache.size} servers`);
    console.log(`🏴 Supporting ${Object.keys(flagToLanguage).length} flag emojis`);
    
    // Set bot status
    client.user.setActivity('flag reactions for translations', { 
        type: ActivityType.Watching 
    });
    
    console.log(`🎯 Bot status set to: Watching flag reactions for translations`);
});

// Message reaction handler
client.on(Events.MessageReactionAdd, handleReaction);

// Enhanced error handling
client.on(Events.Error, error => {
    console.error('🚨 Discord client error:', error);
    performanceMetrics.errorsHandled++;
});

client.on(Events.Warn, warning => {
    console.warn('⚠️ Discord client warning:', warning);
});

client.on(Events.Debug, info => {
    // Only log important debug info to avoid spam
    if (info.includes('heartbeat') || info.includes('session')) {
        console.log(`🔧 Debug:`, info);
    }
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    // Close server
    server.close(() => {
        console.log('🌐 Express server closed');
    });
    
    // Destroy Discord client
    client.destroy();
    console.log('🤖 Discord client destroyed');
    
    // Final stats
    console.log('📊 Final performance stats:', performanceMetrics);
    
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

// Unhandled error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    performanceMetrics.errorsHandled++;
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    performanceMetrics.errorsHandled++;
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Performance monitoring interval
setInterval(performanceCleanup, 300000); // Every 5 minutes

// Validate environment and start bot
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error('❌ DISCORD_BOT_TOKEN not found in environment variables!');
    console.error('💡 Please create a .env file with:');
    console.error('   DISCORD_BOT_TOKEN=your_bot_token_here');
    console.error('');
    console.error('📖 To get a bot token:');
    console.error('   1. Go to https://discord.com/developers/applications');
    console.error('   2. Create or select your application');
    console.error('   3. Go to Bot section and reset token');
    console.error('   4. Enable Message Content Intent');
    console.error('   5. Copy token to .env file');
    process.exit(1);
}

// Start the bot
console.log('🚀 Starting Discord Translation Bot v2.0...');
console.log('🔧 Environment check passed');
console.log(`⚙️ Configuration: Port=${CONFIG.PORT}, Cache=${CONFIG.CACHE_DURATION}ms, Timeout=${CONFIG.TRANSLATION_TIMEOUT}ms`);

client.login(token).catch(error => {
    console.error('❌ Failed to login to Discord:', error.message);
    console.error('💡 Please check your bot token and ensure:');
    console.error('   - Token is valid and not expired');
    console.error('   - Bot has proper permissions');
    console.error('   - Message Content Intent is enabled');
    process.exit(1);
});

console.log('✨ Bot initialization complete! Waiting for Discord connection...');