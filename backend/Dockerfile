FROM node:18-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --production && npm cache clean --force

COPY src/ ./src/

USER node

EXPOSE 3000

CMD ["node", "src/index.js"]
