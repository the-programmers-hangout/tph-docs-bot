FROM node:14.15.3-alpine3.12
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run tsc
COPY .env ./dist/
WORKDIR ./dist
CMD node bot.js