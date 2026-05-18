# EternoMind frontend — Dev image
# Vite dev server with hot-reload, exposed on port 5173.
# For production, swap to a multi-stage build: builder → nginx serving static dist/

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy the rest of the source
COPY . .

EXPOSE 5173

# --host 0.0.0.0 so the dev server is reachable from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
