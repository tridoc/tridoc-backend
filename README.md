# tridoc

Server-side infrastructure for tridoc: easy document management for individuals and small teams.

## Table Of Contents
* [Setup](#setup)
* [Tag System](#tag-system)
    * [Simple Tags](#simple-tags)
    * [Parameterizable &amp; Parameterized Tags](#parameterizable--parameterized-tags)
* [Comments](#comments)
* [API](#api)

## Setup

This will setup tridoc on port 8000 and fuseki avaliable on port 8001.
Make sure you have `docker-compose` installed.

Replace `YOUR PASSWORD HERE` in the first command with your choice of password.

Unix/Linux/wsl:
```bash
export TRIDOC_PWD="YOUR PASSWORD HERE"
docker-compose build
docker-compose up
```

On windows, relpace the first line with:
```powershell
$env:TRIDOC_PWD = "YOUR PASSWORD HERE"
```

_For more Setup options see the <a href="./DEV-README.md">DEV-README.md</a>_

## Tag System

There are two types of tags: simple tags and parameterizable tags. Parameterizable tags need a parameter to become a parameterized tag wich can be added to a document.

### Simple Tags

Simple tags can be created by `POST` to `/tag`. You need to send an JSON object like this:

```json
{"label": "Inbox"}
```

> Note: `label` must be unique.

> The label must not contain any of the following: whitespace, `/`, `\`, `#`, `"`, `'`, `,`, `;`, `:`, `?`;\
> The label must not equal `.` (single dot) or `..` (double dot).

Tags can be added to a document by `POST` to `/doc/{id}/tag`. You need to send an JSON object like the one above.

> Tags must be created before adding them to a document.

### Parameterizable & Parameterized Tags

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

## Comments

Tags can be added to a document by `POST` to `/doc/{id}/comment`

You can either send an JSON document like the following

```json
{
    "text": "This is a comment"
}
```

When getting a comment, a JSON array with objects of the following structure is provided:

```json
{
    "text": "This is a comment",
    "created": "2020-03-12T10:07:20.493Z"
}
```

## API

| Address                    | Method | Description                          | Request / Payload  | Response | Implemented in Version | deno? |
| -                          | -      | -                                    | - | - | - | - |
| `/count`                   | GET    | Count (matching) documents           | <sup>[1](#f1)</sup> <sup>[3](#f3)</sup> | Number | 1.1.0 | ✅ |
| `/doc`                     | POST   | Add / Store Document                 | PDF<sup>[5](#f5)</sup> | - | 1.1.0 | ✅ |
| `/doc`                     | GET    | Get List of all (matching) documents | <sup>[1](#f1)</sup> <sup>[2](#f2)</sup> <sup>[3](#f3)</sup> | Array of objects with document identifiers and titles (where available) | 1.1.0 | ✅ |
| `/doc/{id}`                | GET    | Get this document                    | - | PDF | 1.1.0 | ✅ |
| `/doc/{id}`                | DELETE | Deletes all metadata associated with the document. Document will not be deleted and is stays accessible over /doc/{id}. | - | - | 1.1.0 | ✅ |
| `/doc/{id}/comment`        | POST   | Add comment to document              | Comment object / See above | - | 1.2.0 | ✅ |
| `/doc/{id}/comment`        | GET    | Get comments                         | - | Array of comment objects | 1.2.0 | ✅ |
| `/doc/{id}/tag`            | POST   | Add a tag to document                | Tag object / See above | - | 1.1.0 | ✅ |
| `/doc/{id}/tag`            | GET    | Get tags of document                 | - | Array of tag objects | 1.1.0 | ✅ |
| `/doc/{id}/tag/{tagLabel}` | DELETE | Remove tag from document             | - | - | 1.1.0 |
| `/doc/{id}/thumb`          | GET    | Get document thumbnail               | - | PNG (300px wide) | 1.5.0 | ✅ |
| `/doc/{id}/title`          | PUT    | Set document title                   | `{"title": "the_Title"}` | - | 1.1.0 | ✅ |
| `/doc/{id}/title`          | GET    | Get document title                   | - | `{"title": "the_Title"}` | 1.1.0 | ✅ |
| `/doc/{id}/title`          | DELETE | Reset document title                 | - | - | 1.1.0 |
| `/doc/{id}/meta`           | GET    | Get various metadata                 | - | `{"title": "the_Title", "tags":[...], "comments": [...] ... }` | 1.1.0 \| .comments & .created in 1.2.1 | ✅ |
| `/raw/rdf`                 | GET    | Get all metadata as RDF. Useful for Backups | <sup>[4](#f4)</sup> | RDF, Content-Type defined over request Headers or ?accept. Fallback to text/turtle. | 1.1.0 | ✅ |
| `/raw/rdf`                 | DELETE | "Cancel" failed zip upload—use only if certain it’s done & failed | | | (deno only) | ✅ |
| `/raw/zip` or `/raw/tgz`   | GET    | Get all data. Useful for backups     | - | ZIP / TGZ containing blobs/ directory with all pdfs as stored within tridoc and a rdf.ttl file with all metadata. | 1.3.0 | ✅ |
| `/raw/zip`                 | PUT    | Replace all data with backup zip     | ZIP | Replaces the metadata and adds the blobs from the zip | 1.3.0 | ✅ |
| `/tag`                     | POST   | Create new tag                       | See above | - | 1.1.0 |
| `/tag`                     | GET    | Get (list of) all tags               | - | - | 1.1.0 | ✅ |
| `/tag/{tagLabel}`          | GET    | Get Documents with this tag. Same as `/doc?tag={tagLabel}` | <sup>[1](#f1)</sup> <sup>[2](#f2)</sup> | Array of objects with document identifiers and titles (where available) |  1.1.0 | ✅ |
| `/tag/{tagLabel}`          | DELETE | Delete this tag                      | - | - | 1.1.0 |
| `/version`                 | GET    | Get tridoc version                   | - | semver version number | 1.1.0 | ✅ |

#### URL-Parameters supported:

<sup id="f1">[1](#f1)</sup> : ?text \
<sup id="f2">[2](#f2)</sup> : ?limit and ?offset

<sup id="f3">[3](#f3)</sup> : ?tag and ?nottag \
Since 1.4.4, filtering for Tag Ranges is possible with the following syntax: `…={label};{min};{max}`. `min` or `max` may be ommitted for unbounded search. Trailing semocolons may be omitted.
Example:
```
…?tag=foo;;30&tag=bar;2020-01-01;2020-12-31
```
gives all that have tag foo with a value <= 30, and bar values within 2020.
> Be aware that this may need replacing of the caracter `;` by `%3B`.

<sup id="f4">[4](#f4)</sup> : ?accept \
<sup id="f5">[5](#f5)</sup> : ?date followed by an ISO 8601 date string including time and timezone, seconds optional, sets creation date

> Deleting / editing comments might be supported in the future
