FROM node:17-alpine3.14
RUN apk add --update git
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run tsc
WORKDIR /usr/app/dist
CMD npm run register-global-commands ; node bot.js
