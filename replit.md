# Discord Translation Bot

## Overview

A Discord bot that provides real-time message translation through flag emoji reactions. Users can react to any message with country flag emojis (🇺🇸, 🇪🇸, 🇫🇷, etc.) to translate the content into their desired language. The bot supports 30+ languages and uses caching to optimize performance and reduce API calls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Bot Architecture
- **Event-driven Discord bot** built with Discord.js v14 using Gateway intents for message and reaction monitoring
- **Reaction-based interface** where users trigger translations by adding flag emoji reactions to messages
- **ES6 module structure** with modern JavaScript syntax and import/export statements

### Translation Engine
- **External translation API integration** using LibreTranslate or similar translation services via Axios HTTP client
- **Flag-to-language mapping system** with comprehensive coverage of 30+ languages mapped to country flag emojis
- **Intelligent language detection** for source text before translation processing

### Performance Optimization
- **In-memory caching layer** using NodeCache with 60-second TTL to prevent duplicate translation requests
- **Rate limiting consideration** through caching to reduce external API calls and improve response times
- **Efficient emoji parsing** with predefined flag-to-language code mapping for instant language identification

### Deployment & Monitoring
- **Express.js web server** for health checks and uptime monitoring endpoints
- **Environment-based configuration** using dotenv for secure credential management
- **Process management** designed for cloud deployment with configurable PORT settings

### Error Handling & Reliability
- **Graceful failure modes** for translation API unavailability or rate limiting
- **Input validation** for supported languages and message content
- **Discord API error handling** for permission issues and message access

## External Dependencies

### Core Services
- **Discord API** - Primary platform integration for bot functionality and message access
- **Translation API** - External translation service (LibreTranslate or Google Translate) for language processing

### Runtime Dependencies
- **Node.js 18+** - JavaScript runtime environment
- **Discord.js v14** - Discord API wrapper and bot framework
- **Express.js** - Web server for monitoring and health check endpoints
- **Axios** - HTTP client for translation API communication
- **NodeCache** - In-memory caching solution for performance optimization
- **dotenv** - Environment variable management for configuration

### Infrastructure Requirements
- **Discord Bot Token** - Authentication for Discord API access
- **Translation API Key** - Authentication for external translation service
- **Web hosting platform** - Deployment environment with persistent uptime (Replit, Heroku, etc.)