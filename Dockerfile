# syntax=docker/dockerfile:1

# Base image for all PHP containers (Laravel Components)
FROM php:8.4-fpm AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
      libpng-dev libjpeg62-turbo-dev libfreetype6-dev libonig-dev libzip-dev \
      libpq-dev libldap2-dev libmagickwand-dev unzip git \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j"$(nproc)" zip exif pcntl pdo_pgsql pgsql gd ldap \
 && pecl install imagick redis \
 && docker-php-ext-enable imagick redis \
 && rm -rf /var/lib/apt/lists/* /tmp/pear

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN groupadd -g 1000 www && useradd -u 1000 -ms /bin/bash -g www www
WORKDIR /var/www

# PHP Dependencies (cached until the lockfile changes)
COPY composer.json composer.lock ./
RUN --mount=type=cache,target=/root/.composer/cache \
    composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy application code
COPY --chown=www:www . .
RUN mkdir -p bootstrap/cache storage/framework/cache storage/framework/sessions storage/framework/views storage/logs \
 && chown -R www:www bootstrap/cache storage \
 && composer dump-autoload --optimize --no-dev --no-scripts

# Entrypoint will run modules discovery (.env must be mounted or reverb will fail due to a missing app key)
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]

# ---- Frontend build (static assets) ----
FROM node:22-slim AS frontend
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn run build


# ---- Tools for core and horizon images----
FROM base AS tools
RUN apt-get update
RUN apt-get install -y --no-install-recommends \
      tabix samtools ncbi-blast+ libjson-perl \
      jpegoptim optipng pngquant gifsicle
# Install the Node + JBrowse CLI
RUN apt-get install -y --no-install-recommends curl ca-certificates gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs
RUN npm install -g @jbrowse/cli

# Cleanup
RUN rm -rf /var/lib/apt/lists/*

# ----  Horizon Worker Container ----
FROM tools AS horizon
USER www
WORKDIR /var/www
CMD ["php", "artisan", "horizon"]
HEALTHCHECK --interval=30s --start-period=30s CMD php artisan horizon:status || exit 1

# ---- Reverb message handler ----
FROM base AS reverb
USER www
EXPOSE 8080
CMD ["php", "artisan", "reverb:start"]
HEALTHCHECK --interval=30s --start-period=15s CMD php artisan about >/dev/null || exit 1

# ---- G-nom core (Laravel) ----
FROM tools AS core
LABEL org.opencontainers.image.source="https://github.com/G-nom-Project/g-nom"
COPY --from=frontend --chown=www:www /app/public/build ./public/build
USER www
EXPOSE 9000
CMD ["php-fpm"]
HEALTHCHECK --interval=30s --start-period=15s CMD php artisan about >/dev/null || exit 1

# ---- Proxy / static files ----
# Customization dir must be mounted to take effect
FROM nginx:alpine AS webserver
WORKDIR /var/www
COPY --from=base /var/www/public ./public
COPY --from=frontend /app/public/build ./public/build
EXPOSE 80

# ---- Qlever server ----
FROM docker.io/adfreiburg/qlever:latest AS qlever
USER root
RUN mkdir -p /index
WORKDIR /index
USER qlever
EXPOSE 8888
# Pull all settings from the Qleverfile (mount required) except for the access token, which we will store in .env
ENTRYPOINT ["qlever", "-q", "Qleverfile", "start", "--run-in-foreground", "--access-token", "\"$QLEVER_ACCESS_TOKEN\""]
