# --------------------------------------------------------------------------
# STAGE 1: Builder Stage
# This stage installs all dependencies, leveraging Docker's build cache.
# --------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy the package manifests (package.json and package-lock.json)
COPY package*.json ./

# Install dependencies. We use --omit=dev to skip development dependencies, 
# resulting in a smaller node_modules folder for production.
RUN npm install --omit=dev

# --------------------------------------------------------------------------
# STAGE 2: Production Stage
# This stage uses a clean, light base image for the final deployment.
# --------------------------------------------------------------------------
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy the pre-installed dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the rest of the application source code (your index.js, db/, routes/, etc.)
COPY . .

# Set the application port environment variable
ENV PORT 3000

# Expose the port where the Node.js application is listening
EXPOSE 3000

# Define the command to run the application
CMD ["node", "index.js"]