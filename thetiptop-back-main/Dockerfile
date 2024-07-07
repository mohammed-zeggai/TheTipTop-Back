FROM node
WORKDIR /app

COPY package.json .
RUN npm install
COPY . ./

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
RUN [ "chmod", "+x", "./test.sh" ]
CMD [ "sh", "./start.sh" ]