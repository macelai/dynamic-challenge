# Use the official Bun image
FROM oven/bun:latest

# Install SQLite dependencies
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev

# Set the working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy application code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Set the port
ENV PORT=8080

# Expose the same port
EXPOSE 8080

# Run the app using Bun
CMD ["bun", "run", "start"]