FROM node:21.7.3-alpine3.18

WORKDIR /app/

#RUN apt update && \
#    apt install -y curl && \
#    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install && \
    npm cache clean --force

COPY . ./
RUN npm run lint
RUN npm run build

CMD ["npm", "run", "start"]
