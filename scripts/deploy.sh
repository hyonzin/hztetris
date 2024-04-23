#!/bin/bash

# docker stop hztetris-client-app 2> /dev/null
# sleep 1
# docker run --rm -d -p 8000:8000 --name hztetris-client-app hztetris-client:latest

ENV_FILE=.env.local
touch $ENV_FILE

docker compose --env-file $ENV_FILE up -d

