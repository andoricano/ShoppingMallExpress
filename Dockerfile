# 1. Node.js 22 버전 사용 (WebSocket 내장 지원)
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["node", "dist/index.js"]