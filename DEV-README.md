# tridoc

## Table Of Contents
  * [Easy Setup with Docker-Compose](#easy-setup-with-docker-compose)
      * [Dev Build](#dev-build)
      * [Production Build](#production-build)
  * [Setup with Persistent Fuseki](#setup-with-persistent-fuseki)
      * [Docker](#docker)
      * [Manual](#manual)

## Developer Guide

This assumes a Unix/Linux/wsl system with bash

### Easy Setup with Docker-Compose

This will setup tridoc on port 8000 and fuseki avaliable on port 8001.

Replace `YOUR PASSWORD HERE` in the first command with your choice of password.

#### Dev Build:

```
export TRIDOC_PWD="YOUR PASSWORD HERE"
docker-compose -f dev-docker-compose.yml build
docker-compose -f dev-docker-compose.yml up
```

#### Production Build:

```
export TRIDOC_PWD="YOUR PASSWORD HERE"
docker-compose build
docker-compose up
```

### Setup with Persistent Fuseki

The following method expect an instance of Fuseki running on http://fuseki:3030/ with user `admin` and password `pw123`. This fuseki instance must have lucene indexing enabled and configured as in [config-tdb.ttl](config-tdb.ttl).

#### Docker:

```
docker build -t tridoc .
docker run -p 8000:8000 -e TRIDOC_PWD="YOUR PASSWORD HERE" tridoc
```

#### Manual:

Install the following dependencies:

```
node:12.18 yarn pdfsandwich tesseract-ocr-deu tesseract-ocr-fra
```

And run the following commands

```
rm /etc/ImageMagick-6/policy.xml
yarn install
bash docker-cmd.sh
```

