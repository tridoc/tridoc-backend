#!/bin/sh
sleep 5
echo 'Attempting to create Dataset "3DOC"'
curl 'http://fuseki:3030/$/datasets' -H "Authorization: Basic $(echo -n admin:pw123 | base64)" \
    -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' --data 'dbName=3DOC&dbType=tdb'
set -m
yarn start &
sleep 5
echo 'Attempting to create Dataset "3DOC"'
curl 'http://fuseki:3030/$/datasets' -H "Authorization: Basic $(echo -n admin:pw123 | base64)" \
    -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' --data 'dbName=3DOC&dbType=tdb'
fg 1
