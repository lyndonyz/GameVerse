# ====================================================================
# Stage 1: Build Stage (Uses Node to compile the frontend assets)
# ====================================================================
# Using a Node image for the build environment
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies (leveraging Docker cache)
COPY package*.json ./
RUN npm install

# Copy the rest of the source code and run the production build
# This command runs your framework's build process (e.g., for React, Vue, Angular)
COPY . .
RUN npm run build 

# ====================================================================
# Stage 2: Production Stage (Uses Nginx to serve the static files)
# ====================================================================
# Using a very lightweight Nginx image for serving static content
FROM nginx:alpine

# Copy the static assets from the 'build' stage into the Nginx public folder
# IMPORTANT: Adjust '/app/build' if your framework uses 'dist' or a different folder
# If you are using create-react-app, the output directory is 'build'.
COPY --from=build /app/build /usr/share/nginx/html

# Code Engine automatically exposes the port defined in the container, which is 80 for Nginx.
EXPOSE 80

# The default Nginx CMD runs the server in the foreground, suitable for Docker/Code Engine
CMD ["nginx", "-g", "daemon off;"]