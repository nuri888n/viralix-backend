#!/usr/bin/env bash
set -e

echo "Health:"
curl -s http://127.0.0.1:3000/health ; echo

echo "List:"
curl -s http://127.0.0.1:3000/api/users ; echo

echo "Create Charlie:"
curl -s -X POST http://127.0.0.1:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie"}' ; echo

echo "Delete ID 4:"
curl -i -X DELETE http://127.0.0.1:3000/api/users/4 ; echo

echo "List again:"
curl -s http://127.0.0.1:3000/api/users ; echo
