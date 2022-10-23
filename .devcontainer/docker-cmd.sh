#!/bin/bash
echo 'Attempting to create Dataset "3DOC"'
curl 'http://fuseki:3030/$/datasets' -H "Authorization: Basic $(echo -n admin:pw123 | base64)" \
    -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' --data 'dbName=3DOC&dbType=tdb'
set -m
deno run --watch --allow-net --allow-read=blobs,rdf.ttl --allow-write=blobs,rdf.ttl --allow-run=convert,pdfsandwich,pdftotext,zip,unzip --allow-env=TRIDOC_PWD,OCR_LANG src/main.ts &
sleep 5
echo 'Attempting to create Dataset "3DOC"'
curl 'http://fuseki:3030/$/datasets' -H "Authorization: Basic $(echo -n admin:pw123 | base64)" \
    -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' --data 'dbName=3DOC&dbType=tdb'
fg 1
