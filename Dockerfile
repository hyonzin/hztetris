FROM node:20-slim

WORKDIR /app/

RUN apt update
RUN apt install -y curl

COPY package.json package-lock.json ./
RUN npm install

COPY . ./
RUN npm run build

CMD ["npm", "run", "start"]
