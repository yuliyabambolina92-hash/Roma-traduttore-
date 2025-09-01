# Discord Translation Bot

## Overview

This is a comprehensive Discord Translation Bot v2.0 that provides real-time message translation functionality through emoji reactions. Users can react to messages with flag emojis to trigger automatic translations into their preferred languages. The bot leverages the free Google Translate API to support 100+ languages and is built using Discord.js v14.22.1 for modern Discord API compatibility. It includes production-ready features like Express web server for uptime monitoring, intelligent caching to prevent duplicates, comprehensive error handling, performance monitoring, and is optimized for deployment on Replit, Render, and other cloud platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Application Structure
The bot follows a simple, single-file architecture designed for ease of deployment and maintenance:

- **Entry Point**: `index.js` serves as the main application file containing all bot logic
- **Event-Driven Architecture**: Built on Discord.js event system for handling message reactions and bot lifecycle events
- **Stateless Design**: No persistent data storage required - all operations are real-time

### Core Components

#### Translation Engine
- **Translation Service**: Uses `@vitalets/google-translate-api` for free translation services
- **Language Detection**: Automatic source language detection by Google Translate
- **Flag-to-Language Mapping**: Comprehensive emoji-to-language code mapping system supporting 50+ languages
- **Error Handling**: Robust error handling for translation failures and API limitations

#### Discord Integration
- **Bot Framework**: Discord.js v14 with full TypeScript support
- **Event Handlers**: 
  - `messageReactionAdd` for processing translation requests
  - `ready` for bot initialization
- **Partial Handling**: Supports message and reaction partials for reliable operation
- **Permission Management**: Requires Message Content Intent for accessing message content

#### Message Processing
- **Reaction Monitoring**: Listens for flag emoji reactions on messages
- **Translation Workflow**: 
  1. Detect flag emoji reaction
  2. Map emoji to target language code
  3. Extract original message content
  4. Request translation from Google Translate API
  5. Send translated message as reply
- **Multi-Language Support**: Handles various character sets and languages including European, Asian, and Middle Eastern languages

### Design Patterns

#### Observer Pattern
The bot implements the observer pattern through Discord.js event listeners, allowing reactive responses to user interactions without polling.

#### Strategy Pattern
Language mapping uses a strategy pattern where different flag emojis map to specific language codes, making it easy to add or modify supported languages.

#### Error-First Callbacks
Following Node.js conventions with proper error handling and logging for debugging and monitoring.

## External Dependencies

### Core Dependencies
- **discord.js v14.22.1**: Latest stable Discord API wrapper with full v14 features, optimized event handling, and modern API compatibility
- **@vitalets/google-translate-api v9.2.1**: Free Google Translate API client with retry logic and enhanced error handling
- **express v4.21.2**: Production-ready web server framework with comprehensive monitoring endpoints
- **dotenv v16.4.5**: Environment variable management with enhanced security features

### Recent Updates (September 2025)
- **Complete Rewrite**: Rebuilt from ground up with production-ready architecture
- **Enhanced Language Support**: Expanded from 50+ to 155+ flag emoji mappings covering 100+ languages
- **Performance Optimization**: Added intelligent caching, retry logic, and performance monitoring
- **Production Features**: Comprehensive logging, health endpoints, graceful shutdown, and error recovery
- **Deployment Ready**: Optimized for Replit, Render, Heroku, and other cloud platforms

### Service Integrations
- **Discord API**: Real-time messaging, reaction monitoring, and bot presence management
- **Google Translate Service**: Translation engine supporting automatic language detection and 100+ language pairs
- **Express Web Server**: HTTP endpoints for uptime monitoring and health checks on port 5000
- **Node.js Runtime**: Requires Node.js 16.9.0+ for modern JavaScript features and Discord.js compatibility
- **Uptime Monitoring**: Compatible with UptimeRobot and similar services for 24/7 operation

### Authentication Requirements
- **Discord Bot Token**: Required for Discord API authentication and bot authorization
- **Discord Permissions**: Message Content Intent must be enabled for accessing message content
- **Bot Permissions**: Requires read message history, send messages, and add reactions permissions in Discord servers