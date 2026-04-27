FROM php:8.3-fpm

# Copy composer.lock and composer.json
COPY composer.lock composer.json /var/www/

# Set working directory
WORKDIR /var/www

# Install dependencies
RUN apt-get update
RUN apt-get install -y \
    build-essential \
    libpng-dev \
    libonig-dev \
    libzip-dev \
    zlib1g-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    locales \
    zip \
    jpegoptim optipng pngquant gifsicle \
    vim \
    unzip \
    git \
    curl \
    libpq-dev \
    libjson-perl \
    tabix \
    samtools \
    nodejs \
    npm \
    libmagickwand-dev \
    ncbi-blast+

# Install JBrose CLI
RUN npm install -g @jbrowse/cli
RUN npm install -g yarn

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install extensions
RUN docker-php-ext-install  mbstring zip exif pcntl pdo_pgsql pgsql gd
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
# RUN docker-php-ext-install gd

RUN pecl install imagick  && docker-php-ext-enable imagick
RUN pecl install redis && docker-php-ext-enable redis

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Add user for Laravel application
RUN groupadd -g 1000 www
RUN useradd -u 1000 -ms /bin/bash -g www www

# Copy application files and set ownership
COPY --chown=www:www . /var/www

# Build frontend
RUN yarn install
RUN yarn run build

# Set process user
USER www

# Expose port 9000 and start php-fpm server
EXPOSE 9000
CMD ["php-fpm"]

# This command will file if composer packages are missing of php extensions fail to load
HEALTHCHECK CMD php artisan about || exit 1
