FROM node:9-alpine

ARG VERSION=master
ENV VERSION=${VERSION}

LABEL maintainer="gleisson.assis@gmail.com"
LABEL source="https://github.com/gleissonassis/cryptonote-wwl.git"
LABEL version="${VERSION}"

COPY process.yml LICENSE package.json /app/
COPY src /app/src

RUN npm install -g pm2 \
 && pm2 install pm2-logrotate \
 && pm2 set pm2-logrotate:retain 10 \
 && cd /app \
 && npm install --production \
 && mkdir -p /app/log

WORKDIR /app

CMD ["pm2-docker", "start", "/app/process.yml"]
