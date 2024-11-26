# Use the Bun official image
FROM oven/bun:latest AS build

# Create and change to the app directory.
WORKDIR /app

# Copy the files to the container image
COPY package*.json bun.lockb ./

# Install packages
RUN bun install

# Copy local code to the container image.
COPY . ./

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

ARG VITE_DYNAMIC_ENVIRONMENT_ID
ENV VITE_DYNAMIC_ENVIRONMENT_ID=$VITE_DYNAMIC_ENVIRONMENT_ID

# Build the app.
RUN bun run build

# Use the Caddy image
FROM caddy

# Create and change to the app directory.
WORKDIR /app

# Copy Caddyfile to the container image.
COPY Caddyfile ./

# Copy local code to the container image.
RUN caddy fmt Caddyfile --overwrite

# Copy files to the container image.
COPY --from=build /app/dist ./dist

# Use Caddy to run/serve the app
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]