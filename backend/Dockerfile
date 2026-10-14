# Build aset Vite Laravel
FROM node:22-alpine AS assets

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# Laravel + Apache
FROM php:8.4-apache-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
        unzip \
        libpq-dev \
        libpng-dev \
        libzip-dev \
        zlib1g-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libonig-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        mbstring \
        exif \
        pdo_pgsql \
        pgsql \
        zip \
        gd \
    && a2enmod rewrite \
    && sed -ri 's!/var/www/html!/var/www/public!g' \
        /etc/apache2/sites-available/000-default.conf \
    && printf '%s\n' \
        '<Directory /var/www/public>' \
        '    AllowOverride All' \
        '    Require all granted' \
        '</Directory>' \
        > /etc/apache2/conf-available/laravel.conf \
    && a2enconf laravel \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction \
    --no-progress

COPY --chown=www-data:www-data . .

COPY --from=assets --chown=www-data:www-data \
    /app/public/build ./public/build

RUN composer dump-autoload --no-dev --optimize \
    && mkdir -p \
        storage/app/private \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/testing \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
        /runtime \
    && chown -R www-data:www-data storage bootstrap/cache /runtime \
    && chmod -R ug+rwX storage bootstrap/cache /runtime

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint

RUN chmod 755 /usr/local/bin/docker-entrypoint

EXPOSE 80

ENTRYPOINT ["docker-entrypoint"]
