# Use nginx alpine image for lightweight deployment
FROM nginx:alpine

# Copy all frontend files
COPY . /usr/share/nginx/html/

# OPTIONAL: custom server config
# If needed, use this line:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
