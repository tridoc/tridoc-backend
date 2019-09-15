# tridoc

Server-side infrastructure for tridoc: easy document management for individuals and small teams.

## Setup

You need to set the environment variable TRIDOC_PWD to set the password of
the tridoc user (the username is currently fixed to 'tridoc'.

On Unix / Linux:
```
export TRIDOC_PWD="YOUR PASSWORD HERE"
```

On Windows:
```
$env:TRIDOC_PWD = "YOUR PASSWORD HERE"
```

### Setup with Docker-compose 

```
docker-compose build
docker-compose up
``` 

### Alternative Methods for Setup

The following methods expect an instance of Fuseki running on http://fuseki:3030/ with user `admin`  and password `pw123`. 

#### Docker 

```
docker build -t tridoc .
docker run -p 8000:8000 -e TRIDOC_PWD="YOUR PASSWORD HERE" tridoc
```

#### Yarn
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

> The label must not contain any of the following: whitespace, `/`, `\`, `#`, `"`, `'`, `,`, `;`, `:`, `?`;\
> The label must not equal `.` (single dot) or `..` (double dot).

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

| Address                    | Method | Description                          | Request / Payload  | Response | Implemented in Version |
| -                          | -      | -                                    | - | - | - |
| `/count`                   | GET    | Count (matching) documents           | <sup>[1](#f1)</sup> <sup>[3](#f3)</sup> | Number | 1.1.0 |
| `/doc`                     | POST   | Add / Store Document                 | PDF | - | 1.1.0 |
| `/doc`                     | GET    | Get List of all (matching) documents | <sup>[1](#f1)</sup> <sup>[2](#f2)</sup> <sup>[3](#f3)</sup> | Array of objects with document identifiers and titles (where available) | 1.1.0 |
| `/doc/{id}`                | GET    | Get this document                    | - | PDF | 1.1.0 |
| `/doc/{id}`                | DELETE | Deletes all metadata associated with the document. Document will not be deleted and is stays accessible over /doc/{id}. | - | - | 1.1.0 |
| `/doc/{id}/comment`        | POST   | Add comment to document              | - | - | - |
| `/doc/{id}/comment`        | GET    | Get comments                         | - | - | - |
| `/doc/{id}/tag`            | POST   | Add a tag to document                | Tag object / See above | - | 1.1.0 |
| `/doc/{id}/tag`            | GET    | Get tags of document                 | - | Array of tag objects | 1.1.0 |
| `/doc/{id}/tag/{tagLabel}` | DELETE | Remove tag from document             | - | - | 1.1.0 |
| `/doc/{id}/title`          | PUT    | Set document title                   | `{"title": "the_Title"}` | - | 1.1.0 |
| `/doc/{id}/title`          | GET    | Get document title                   | - | `{"title": "the_Title"}` | 1.1.0 |
| `/doc/{id}/title`          | DELETE | Reset document title                 | - | - | 1.1.0 |
| `/doc/{id}/meta`           | GET    | Get title and tags                   | - | `{"title": "the_Title", "tags":[ ... ]}` | 1.1.0 |
| `/raw/rdf`                 | GET    | Get all metadata as RDF. Useful for Backups | <sup>[4](#f4)</sup> | RDF, Content-Type defined over request Headers or ?accept. Fallback to text/turtle. | 1.1.0 |
| `/raw/tgz`                 | GET    | Get all data. Useful for Backups     | - | Contains blobs/ directory with all pdfs as stored within tridoc and a rdf.ttl file with all metadata. | 1.1.0 |
| `/tag`                     | POST   | Create new tag                       | See above | - | 1.1.0 |
| `/tag`                     | GET    | Get (list of) all tags               | - | - | 1.1.0 |
| `/tag/{tagLabel}`          | GET    | Get Documents with this tag. Same as `/doc?tag={tagLabel}` | <sup>[1](#f1)</sup> <sup>[2](#f2)</sup> | Array of objects with document identifiers and titles (where available) |  1.1.0 |
| `/tag/{tagLabel}`          | DELETE | Delete this tag                      | - | - | 1.1.0 |
| `/version`                 | GET    | Get tridoc version                   | - | semver version number | 1.1.0 |

#### URL-Paramters supported:

<sup id="f1">[1](#f1)</sup> : ?text \
<sup id="f2">[2](#f2)</sup> : ?limit and ?offset \
<sup id="f3">[3](#f3)</sup> : ?tag \
<sup id="f4">[4](#f4)</sup> : ?accept

> Deleting / editing comments might be supportet in the future
