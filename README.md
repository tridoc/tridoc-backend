# 3DOC

## Setup with Docker-compose 

```
docker-compose build
docker-compose up
``` 

## Alternative Methods for Setup

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
# Tag System

There are two types of tags: normal tags and parameterizable tags. Parameterizable tags need a parameter to become a parameterized tag wich can be added to a document.

Tags can be added to a document by POST to /doc/{id}/tag. You neeed to send an JSON object like this:
```
{
    "label": "Amount",
    "parameter": {
        "type":"http://www.w3.org/2001/XMLSchema#decimal"
        "value":"12.50"
    }
}
``` 


Tags can be created by POST to /tag. You neeed to send an JSON object like this:
```
{
    "label": "Amount",
    "parameter": {
        "type":"http://www.w3.org/2001/XMLSchema#decimal"
    }
}
``` 
| Property | Requiredness | Note |
| - | - | - |
| label | required | Must be unique |
| parameter | required for parameterizable tags, forbidden for normal tags | Object containg the type |
| parameter.type | required for parameterizable tags | can either be http://www.w3.org/2001/XMLSchema#decimal or http://www.w3.org/2001/XMLSchema#date |

# API

| Address | Method | Description | Status |
| - | - | - | - |
| /count| GET | Returns number of documents * | Implemented |
| /doc | POST | Add Document | Implemented |
| /doc | GET | Returns an array of objects with document identifiers and titles (if available) * **| Implemented |
| /doc/{id} | GET | Get this document | Implemented |
| /doc/{id} | DELETE | Deletes all metadata associated with the document. Document will not be deleted and is stays accessible over /doc/{id}. | Implemented |
| /doc/{id}/comment | POST | Add comment to document |
| /doc/{id}/comment	| GET | Get comments |
| /doc/{id}/tag | POST | Add a tag to document | Implemented |
| /doc/{id}/tag | GET | Get tags of document | Implemented |
| /doc/{id}/tag/{tagName} | DELETE | Remove tag from document |
| /doc/{id}/title | PUT | Set document title. The entity body must be a JSON object like `{"title": "the_Title"}` | Implemented |
| /doc/{id}/title | GET | Get document title. Returns a JSON object like `{"title": "the_Title"}` | Implemented |
| /doc/{id}/title | DELETE | Reset document title | Implemented |
| /doc/{id}/meta | GET | Get title and tags |
| /tag | POST | Create new tag | Implemented |
| /tag | GET | Get (list of) all tags | Implementet |
| /tag/{tagName} | GET | Get Documents with this tag |
| /tag/{tagName} | DELETE | Delete this tag | Implemented |

\* Supports ?text
** Supports ?limit and ?offset

Deleting / editing comments might be supportet in the future