FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN rm -rf dist
# Accept build arguments
ARG VITE_RAWG_API_KEY
# Set as environment variable for Vite
ENV VITE_RAWG_API_KEY=$VITE_RAWG_API_KEY
RUN npm run build 
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]