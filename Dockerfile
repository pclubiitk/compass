FROM node:latest

WORKDIR /app
COPY package*.json ./
RUN npm install
# FIXME: i am copying the the npm packages too
COPY . .
EXPOSE 3000
RUN npm run build
CMD ["npm", "start"]
