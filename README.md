# 3DOC

## Setup with Docker-compose 

```
docker-compose build
docker-compose up
``` 

## Alternative methods for setup

The following methods expect an instance of Fuseki running on http://fuseki:3030/ with user `admin`  and password `pw123`. 

### Yarn
This method also expects that there is a database called `3doc` on the fuseki instance.

If you haven't already, install yarn first. Then run the following:
```
yarn install
yarn start
```

### Docker 

```
docker build -t 3doc .
docker run -p 8000:8000 3doc
```