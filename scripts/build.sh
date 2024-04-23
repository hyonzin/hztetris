#!/bin/bash

docker build -t hztetris-client:latest .

docker image prune --force
