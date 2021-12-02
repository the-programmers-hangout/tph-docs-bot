FROM node:17-alpine3.12
RUN apk add --update git
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run tsc
WORKDIR /usr/app/dist
RUN npm run registerGlobalCommands
CMD node bot.js
