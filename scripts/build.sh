#!/bin/bash

TAG=${1:-latest}

docker build -t hztetris-client:$TAG .

docker image prune --force
