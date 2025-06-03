# ConversationHub

Intelligente gespreksondersteuning platform met live transcriptie en privacy-first design.

## Quick Start

1. Clone repository
2. Copy `.env.example` to `.env` en configureer
3. Start containers: `docker-compose up -d`
4. Backend setup: `docker-compose exec backend php artisan migrate`
5. Frontend toegankelijk op: http://localhost:3000
6. Backend API op: http://localhost:8000

## Tech Stack

- **Backend**: Laravel 10 + PostgreSQL + Redis
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Infrastructure**: Docker + Nginx
- **Audio**: Azure Whisper API
- **Privacy**: Built-in GDPR filtering

## Development

### Backend Development
```bash
# Artisan commands
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan queue:work

# Tests
docker-compose exec backend php artisan test