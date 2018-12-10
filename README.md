# tridoc

With all the different startup methods you need to set the environment varaiable TRIDOC_PWD to set the password of
the tridoc user.

On Unix you can do this with

export TRIDOC_PWD = "YOUR PASSWORD HERE"

on windows

$env:TRIDOC_PWD = "YOUR PASSWORD HERE"

## Setup with Docker-compose 

```
docker-compose build
docker-compose up
``` 

## Alternative Methods for Setup

The following methods expect an instance of Fuseki running on http://fuseki:3030/ with user `admin`  and password `pw123`. 

### Docker 

```
docker build -t tridoc .
docker run -p 8000:8000 tridoc
```

### Yarn
This method also expects that there is a database called `3doc` on the fuseki instance.

If you haven't already, install yarn first. Then run the following:
```
yarn install
yarn start
```

# Tag System

There are two types of tags: simple tags and parameterizable tags. Parameterizable tags need a parameter to become a parameterized tag wich can be added to a document.

## Simple Tags

Simple tags can be created by `POST` to `/tag`. You need to send an JSON object like this:

```json
{"label": "Inbox"}
```

> Note: `label` must be unique.

Tags can be added to a document by `POST` to `/doc/{id}/tag`. You need to send an JSON object like the one above.

> Tags must be created before adding them to a document.

## Parameterizable & Parameterized Tags

Parameterizable tags can be created by `POST` to `/tag` too. You need to send an JSON object like this:

```json
{
    "label": "Amount",
    "parameter": {
        "type":"http://www.w3.org/2001/XMLSchema#decimal"
    }
}
``` 

> Again, `label` must be unique. \
> `parameter.type` can either be http://www.w3.org/2001/XMLSchema#decimal or http://www.w3.org/2001/XMLSchema#date .

Parameterizable tags can only be added to a document with a value assigned. By `POST`ing a JSON object like the following to `/doc/{id}/tag`, a parameterized tag is created and added to the document.

```json
{
    "label": "Amount",
    "parameter": {
        "type":"http://www.w3.org/2001/XMLSchema#decimal",
        "value":"12.50"
    }
}
``` 

> A parameterizable tag with this `label` and `parameter.type` has to be created before.

# API

| Address                    | Method | Description                 | Request / Payload  | Response| Status |
| -                          | -      | -                           | - | - | - |
| `/count`                   | GET    | Count (matching) documents  | <sup>[1](#f1)</sup> <sup>[3](#f3)</sup> | Number | Implemented |
| `/doc`                     | POST   | Add / Store Document        | PDF | - | Implemented |
| `/doc`                     | GET    | Get List of all (matching) documents | <sup>[1](#f1)</sup> <sup>[2](#f2)</sup> <sup>[3](#f3)</sup> | Array of objects with document identifiers and titles (where available) | Implemented |
| `/doc/{id}`                | GET    | Get this document           | - | PDF | Implemented |
| `/doc/{id}`                | DELETE | Deletes all metadata associated with the document. Document will not be deleted and is stays accessible over /doc/{id}. | - | - | Implemented |
| `/doc/{id}/comment`        | POST   | Add comment to document     | - | - | - |
| `/doc/{id}/comment`        | GET    | Get comments                | - | - | - |
| `/doc/{id}/tag`            | POST   | Add a tag to document       | Tag object / See above | - | Implemented |
| `/doc/{id}/tag`            | GET    | Get tags of document        | - | Array of tag objects | Implemented |
| `/doc/{id}/tag/{tagLabel}` | DELETE | Remove tag from document    | - | - | Implemented |
| `/doc/{id}/title`          | PUT    | Set document title          | `{"title": "the_Title"}` | - | Implemented |
| `/doc/{id}/title`          | GET    | Get document title          | - | `{"title": "the_Title"}` | Implemented |
| `/doc/{id}/title`          | DELETE | Reset document title        | - | - | Implemented |
| `/doc/{id}/meta`           | GET    | Get title and tags          | - | - | - |
| `/tag`                     | POST   | Create new tag              | See above | - | Implemented |
| `/tag`                     | GET    | Get (list of) all tags      | - | - | Implemented |
| `/tag/{tagLabel}`          | GET    | Get Documents with this tag | <sup>[1](#f1)</sup> <sup>[2](#f2)</sup> | Array of objects with document identifiers and titles (where available) |  Implemented, same as `/doc?tag={tagLabel}` |
| `/tag/{tagLabel}`          | DELETE | Delete this tag             | - | - | Implemented |

#### URL-Paramters supported:

<sup id="f1">[1](#f1)</sup> : ?text \
<sup id="f2">[2](#f2)</sup> : ?limit and ?offset \
<sup id="f3">[3](#f3)</sup> : ?tag

> Deleting / editing comments might be supportet in the future