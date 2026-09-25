FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

#clean install
RUN npm ci 

COPY index.js .

EXPOSE 3000

CMD ["node", "index.js"]