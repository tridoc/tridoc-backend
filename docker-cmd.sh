#!/bin/bash
sleep 5
curl 'http://fuseki:3030/$/datasets' -H "Authorization: Basic $(echo -n admin:pw123 | base64)" \
    -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' --data 'dbName=3DOC&dbType=tdb'
npm start