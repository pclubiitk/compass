FROM node:latest

WORKDIR /app
COPY package*.json ./
RUN npm install
# FIXME: i am copying the the npm packages too
COPY . .
EXPOSE 3000
RUN npm run build:worker
RUN npm run build
CMD ["npm", "start"]

# TODO: Learn more form https://medium.com/@itsuki.enjoy/dockerize-a-next-js-app-4b03021e084d and do the stage set up

# # === STAGE 1: Build ===
# # Use the full Node.js image to build the app
# FROM node:latest AS builder

# WORKDIR /app

# # Copy package files and install all dependencies (incl. dev)
# COPY package*.json ./
# RUN npm install

# # Copy the rest of the source code
# COPY . .

# # Run your build scripts
# RUN npm run build:worker
# RUN npm run build

# # === STAGE 2: Production ===
# # Use a small, production-ready Node.js runtime
# FROM node:lts-alpine

# WORKDIR /app

# # Copy package.json to install *only* production dependencies
# COPY --from=builder /app/package*.json ./
# RUN npm install --production --ignore-scripts

# # Copy the built application from the builder stage
# # Adjust these paths based on your project's build output
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/public ./public
# # worker builds to 'public/worker'

# EXPOSE 3000

# # Command to start the production app
# CMD ["npm", "start"]