# Stage 1: Build the Frontend Assets
# Use a specific, stable version of Node for building
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
# This is a cache-layer optimization: if package.json doesn't change, dependencies are reused
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Run the build script - this generates the 'dist' folder for Vite projects
RUN npm run build 

# --- End of Build Stage ---
# --------------------------------------------------------------------------------

# Stage 2: Serve the Static Assets using Nginx
FROM nginx:alpine

# Copy the custom Nginx configuration file
# This file is essential for handling React's client-side routing (SPAs)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove the default Nginx index.html 
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the 'build' stage's 'dist' folder
# This is the crucial step to fix your original error!
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the standard Nginx port
EXPOSE 80

# Command to start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]