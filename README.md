# Discord Translation Bot

A Discord bot that automatically translates messages when users react with flag emojis using the free Google Translate API.

## Features

- 🌐 Automatic message translation using flag emoji reactions
- 🚀 Built with discord.js v14
- 🆓 Uses free Google Translate API (@vitalets/google-translate-api)
- 🏴 Supports 50+ languages with comprehensive flag emoji mapping
- 🔧 Easy setup and deployment on Replit
- 🛡️ Robust error handling and logging
- 📝 Handles message and reaction partials
- 🌍 Built-in Express web server for uptime monitoring
- ⏰ Duplicate translation prevention with smart caching

## Supported Languages

The bot supports translations for major world languages including:

### European Languages
- 🇮🇹 Italian, 🇫🇷 French, 🇪🇸 Spanish, 🇩🇪 German, 🇳🇱 Dutch, 🇵🇹 Portuguese
- 🇷🇺 Russian, 🇵🇱 Polish, 🇸🇪 Swedish, 🇳🇴 Norwegian, 🇩🇰 Danish, 🇫🇮 Finnish
- 🇬🇷 Greek, 🇭🇺 Hungarian, 🇨🇿 Czech, 🇸🇰 Slovak, 🇷🇴 Romanian, 🇧🇬 Bulgarian
- And many more...

### Asian Languages
- 🇯🇵 Japanese, 🇰🇷 Korean, 🇨🇳 Chinese (Simplified), 🇹🇼 Chinese (Traditional)
- 🇹🇭 Thai, 🇻🇳 Vietnamese, 🇮🇳 Hindi, 🇮🇩 Indonesian, 🇲🇾 Malay, 🇵🇭 Filipino

### Other Languages
- 🇸🇦 Arabic, 🇮🇷 Persian, 🇹🇷 Turkish, 🇮🇱 Hebrew
- 🇺🇸🇬🇧🇨🇦🇦🇺🇳🇿 English (multiple countries)

## Installation and Setup

### Prerequisites
- Node.js 16.9.0 or higher
- A Discord bot token

### Getting a Discord Bot Token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section in the left sidebar
4. Click "Reset Token" to generate a new token
5. Copy the token (you'll need this for the .env file)
6. Under "Privileged Gateway Intents", enable:
   - Message Content Intent

### Bot Permissions

When inviting your bot to a server, make sure it has these permissions:
- Read Messages
- Send Messages
- Read Message History
- Add Reactions
- Use External Emojis

**Permission Integer:** `68608`

### Setup on Replit

1. Create a new Replit project (Node.js)
2. Copy all the files from this project into your Replit
3. Install dependencies by running in the shell:
   ```bash
   npm install discord.js@^14.0.0 @vitalets/google-translate-api dotenv express
   ```
4. Create a `.env` file and add your Discord bot token:
   ```env
   DISCORD_BOT_TOKEN=your_actual_bot_token_here
   ```
5. Run the project:
   ```bash
   node index.js
   ```

### Keep Bot Running 24/7 on Replit

The bot includes a built-in web server for uptime monitoring:

1. **Get your Replit URL**: After running the bot, copy your Replit's public URL
2. **Set up UptimeRobot**: 
   - Go to [UptimeRobot.com](https://uptimerobot.com)
   - Create a new monitor with your Replit URL
   - Set check interval to 5 minutes
3. **Monitor endpoints**:
   - `/` - Basic status with uptime and server count
   - `/health` - Detailed bot connection status

The bot will now stay running even when you close your browser!

### Local Setup

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install discord.js@^14.0.0 @vitalets/google-translate-api dotenv
   ```
3. Copy `.env.example` to `.env` and add your bot token:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and replace `your_discord_bot_token_here` with your actual bot token
5. Run the bot:
   ```bash
   node index.js
   ```

## How to Use

1. Invite the bot to your Discord server with the required permissions
2. Send any message in a channel where the bot has access
3. React to the message with a flag emoji (e.g., 🇫🇷 for French, 🇯🇵 for Japanese)
4. The bot will automatically translate the message and reply with the translation

### Example Usage

**Original Message:** "Hello, how are you today?"
**User reacts with:** 🇫🇷 (French flag)
**Bot replies:** 
```
🌐 **Translation to French** 🇫🇷
```
Bonjour, comment allez-vous aujourd'hui ?
```
```

## Error Handling and Features

- **Robust Translation**: Automatically detects source language without specifying it
- **Smart Content Filtering**: Ignores messages with only emojis, links, or mentions
- **Duplicate Prevention**: In-memory cache prevents duplicate translations for 60 seconds
- **Partial Support**: Handles Discord message and reaction partials properly
- **Bot Reaction Filtering**: Ignores reactions from other bots
- **Comprehensive Error Handling**: Graceful error messages for users and detailed logging for debugging
- **Connection Recovery**: Handles translation service timeouts and network issues

## Common Issues and Solutions

### "translate is not a function" Error
This has been fixed by using the correct import: `const { translate } = require('@vitalets/google-translate-api')`

### "Invalid source language" Error
Fixed by not specifying the source language, allowing automatic detection

### Translation Service Unavailable
The bot will show user-friendly error messages while logging detailed information for debugging

### Duplicate Translation Prevention
The bot now includes an intelligent caching system that prevents duplicate translations:
- Tracks message ID + emoji combinations for 60 seconds
- Prevents multiple users from triggering the same translation repeatedly
- Cache automatically clears after 60 seconds to allow future translations
- Logs cache activity for debugging and monitoring

## Project Structure

```
├── index.js           # Main bot file with all functionality
├── .env.example       # Environment variables template
├── .env              # Your actual environment variables (not committed)
├── README.md         # This documentation
└── package.json      # Node.js dependencies (auto-generated)
```

## Contributing

Feel free to add more language mappings or improve error handling. The bot currently supports 50+ languages with comprehensive flag emoji coverage.

## License

This project is open source and available under the MIT License.
