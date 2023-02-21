FROM node:16-alpine

WORKDIR /usr/app

COPY dist/cli/* ./

EXPOSE 3030
CMD [ "node", "index.js" ]