# Use the official PHP image with Apache
FROM php:8.1-apache

# Install PDO MySQL extension for database connection
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache mod_rewrite for routing/rewrites if needed
RUN a2enmod rewrite

# Set the ServerName to suppress Apache warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Copy the PHP backend files from the local api/ directory to the container's web root
COPY ./api /var/www/html/

# Ensure Apache has ownership over the uploads folder to write file uploads
RUN mkdir -p /var/www/html/uploads && \
    chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html/uploads

# Expose port 80 (Apache default)
EXPOSE 80
