FROM php:8.2-fpm-alpine

# Install system dependencies & PostgreSQL dev libraries
RUN apk add --no-cache \
    bash \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    postgresql-dev

# Install PHP extensions (wajib pdo_pgsql dan pgsql sesuai bot)
RUN docker-php-ext-install pdo pdo_pgsql pgsql zip gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy project files
COPY . .

# Set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]