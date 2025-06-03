FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy composer files first
COPY composer.json composer.lock* ./

# Install dependencies
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy ALL files (including vendor from build)
COPY . .

# Make sure vendor directory exists and is complete
RUN composer install --no-dev --optimize-autoloader

# Create required directories
RUN mkdir -p bootstrap/cache \
    storage/app/audio \
    storage/app/exports \
    storage/app/temp \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

# Set proper permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage \
    && chmod -R 755 /var/www/bootstrap/cache

# Verify vendor directory
RUN ls -la /var/www/vendor/ || echo "Vendor directory missing!"

# Create .env if needed
RUN if [ ! -f .env ]; then cp .env.example .env; fi

# Expose port
EXPOSE 8000

# Start with PHP built-in server
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]