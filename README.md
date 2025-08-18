# Bingo Game Application

## Overview
This is a Bingo game application with a React frontend and Node.js backend. The application uses PostgreSQL for database storage and Redis for caching.

## Prerequisites
- Docker and Docker Compose installed on your system
- Telegram Bot Token (optional, for Telegram bot functionality)

## Setup Instructions

1. **Environment Configuration**
   - Backend: Copy `.env.example` to `.env` in the backend directory and update values as needed
   - Frontend: The `.env` file is already set up with the backend URL

2. **Running the Application**
   ```bash
   # Start all services
   docker-compose up
   ```

3. **Accessing the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Troubleshooting

If you encounter issues with the application not running properly in Docker:

1. **Volume Mounting Issues**
   - Ensure the volume mounts in docker-compose.yml are correct
   - The `/app/node_modules` volume prevents local node_modules from overriding container modules

2. **Environment Variables**
   - Check that all required environment variables are set in the .env files
   - For the backend, ensure DATABASE_URL and REDIS_URL are correctly pointing to the Docker services

3. **Telegram Bot Errors**
   - If you see `error: [polling_error] {"code":"ETELEGRAM","message":"ETELEGRAM: 401 Unauthorized"}`, this means your Telegram bot token is invalid
   - To fix this:
     - Obtain a valid token from BotFather on Telegram
     - Update the TELEGRAM_BOT_TOKEN value in backend/.env
     - Or set it to a placeholder to disable the bot functionality

4. **Network Issues**
   - If services can't communicate, check the Docker network configuration
   - Ensure service names in connection strings match those in docker-compose.yml

5. **Container Logs**
   ```bash
   # View logs for a specific service
   docker-compose logs backend
   docker-compose logs frontend
   ```

## Development

To make changes to the application:

1. Edit files locally - changes will be reflected in the containers due to volume mounting
2. The development servers (both frontend and backend) support hot reloading
