#!/bin/sh
set -eu

cd /var/www

mkdir -p /runtime

if [ ! -f .env ]; then
    cp .env.example .env
fi

# Gunakan APP_KEY yang tersedia atau buat key lokal yang persisten.
if [ -z "${APP_KEY:-}" ]; then
    if [ ! -s /runtime/app_key ]; then
        php artisan key:generate --show > /runtime/app_key
    fi

    APP_KEY="$(cat /runtime/app_key)"
    export APP_KEY
fi

php artisan config:clear

# Tunggu database siap melalui depends_on healthcheck,
# kemudian terapkan migrasi sebelum Apache dimulai.
php artisan migrate --force

chown -R www-data:www-data storage bootstrap/cache

exec apache2-foreground
