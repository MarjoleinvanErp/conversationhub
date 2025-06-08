FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    zip \
    git \
    curl \
    && docker-php-ext-install pdo pdo_pgsql \
    && pecl install redis && docker-php-ext-enable redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy files
COPY . .

# Clean up and install
RUN rm -rf vendor .git public/storage && \
    composer install --no-dev --no-interaction --optimize-autoloader

# Create directories and permissions
RUN mkdir -p storage/{logs,framework/{cache,sessions,views},app/{audio,exports,temp}} bootstrap/cache && \
    chmod -R 777 storage bootstrap/cache

# Create .env
RUN echo "APP_NAME=ConversationHub" > .env && \
    echo "APP_ENV=local" >> .env && \
    echo "APP_DEBUG=true" >> .env && \
    echo "APP_URL=http://localhost" >> .env && \
    echo "DB_CONNECTION=pgsql" >> .env && \
    echo "DB_HOST=database" >> .env && \
    echo "DB_PORT=5432" >> .env && \
    echo "DB_DATABASE=conversationhub" >> .env && \
    echo "DB_USERNAME=postgres" >> .env && \
    echo "DB_PASSWORD=secret" >> .env && \
    echo "REDIS_HOST=redis" >> .env && \
    echo "REDIS_PORT=6379" >> .env && \
    echo "CACHE_DRIVER=redis" >> .env && \
    echo "SESSION_DRIVER=redis" >> .env && \
    echo "QUEUE_CONNECTION=redis" >> .env

# Expose port
EXPOSE 8000

# Start PHP built-in server on all interfaces
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]