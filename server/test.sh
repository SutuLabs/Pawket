#!/bin/bash

curl -X POST http://localhost:3030/parse_block \
   -H 'Content-Type: application/json' \
   -d @case1.json

exit

curl -X POST http://localhost:3030/parse_block \
   -H 'Content-Type: application/json' \
   -d @case2.json