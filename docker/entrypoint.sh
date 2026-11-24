#!/bin/sh
set -e
# Rebuild caches from the container's actual environment
php artisan optimize:clear
php artisan package:discover --ansi
php artisan config:cache
php artisan route:cache
exec "$@"
