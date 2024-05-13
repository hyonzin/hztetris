#!/bin/bash

docker stop hztetris-client-dev-app 2> /dev/null
sleep 1

docker run --rm -d \
	-p 8000:8000 \
	-v $(pwd)/src:/app/src \
	--name hztetris-client-dev-app \
	hztetris-client:dev

