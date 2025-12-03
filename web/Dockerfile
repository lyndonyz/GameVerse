## Stage 1: Build the Frontend Assets
FROM node:20-alpine AS build
WORKDIR /app

# Copy only necessary files for dependency installation
COPY package.json package-lock.json ./

# Install dependencies and cache layer
RUN npm install

# Copy the rest of the source code
COPY . .

# Run the build script
# This creates the final static assets, e.g., in the 'dist' or 'build' folder
RUN npm run build 

## Stage 2: Serve the Static Assets using a Lean Web Server
FROM nginx:alpine

# Remove the default Nginx index.html (optional)
RUN rm -rf /usr/share/nginx/html/*

# **THE FIX:** Change '/app/build' to '/app/dist' 
# (assuming your 'npm run build' generates files into a 'dist' folder)
# If your framework uses 'build' (e.g., CRA), keep '/app/build'.
# You MUST confirm the output directory of 'npm run build'.
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the standard Nginx port
EXPOSE 80

# Command to start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]