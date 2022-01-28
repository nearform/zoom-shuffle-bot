FROM node:16-alpine

COPY . /app

WORKDIR /app

RUN npm i --omit=dev

CMD npm start
