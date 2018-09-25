'use strict';

const Hapi = require('hapi');
const pdfProcessor = require('./pdfprocessor.js');
const metaStorer = require('./metastorer.js');
const dataStore = require('./datastore.js');
const metaFinder = require('./metafinder.js');
const metaDeleter = require('./metadeleter.js');
var nanoid = require('nanoid');

function makeArray(maybeArray) {
    if (Array.isArray(maybeArray)) {
        return maybeArray;
    } else {
        let array = new Array(maybeArray);
        return array;
    }
}

// Create a server with a host and port
const server = Hapi.server({
    debug: { request: ['error'] },
    port: 8000,
    routes: {
        cors: {
            additionalHeaders: ['Access-Control-Allow-Origin'],
            origin: ['*']
        }
    }
});

server.route({
    method: 'POST',
    path: '/doc',
    config: {
        handler: (request, h) => {
            var id = nanoid();
            return pdfProcessor.getText(request.payload.path).then(text => {
                console.log("Document created with id " + id);
                return metaStorer.storeDocument(id,text).then(() => {
                    return dataStore.storeDocument(id,request.payload.path)
                    .then(() => 
                        h.response()
                        .code(201)
                        .header("Location","/doc/" + id )
                        .header("Access-Control-Expose-Headers", "Location")
                    );
                });
            });
        },
        payload: {
            allow: 'application/pdf',
            maxBytes: 209715200,
            output: 'file',
            parse: false
        }
    }
});

server.route({
    method: 'GET',
    path: '/doc',
    handler: function (request, h) {
        let tagArray = (request.query.tag ? makeArray(request.query.tag) : [] )
        return metaFinder.getDocumentList(request.query.text,tagArray,request.query.limit,request.query.offset);
    }
});

server.route({
    method: 'GET',
    path: '/count',
    handler: function (request, h) {
        let tagArray = (request.query.tag ? makeArray(request.query.tag) : [] )
        return metaFinder.getDocumentNumber(request.query.text,tagArray);
    }
});

server.route({
    method: 'GET',
    path: '/doc/{id}',
    handler: function (request, h) {
        var id = request.params.id;
        return dataStore.getDocument(id).then(data => {
            return metaFinder.getTitle(id).then(titleObject => titleObject.title).catch(e => "document").then(fileName => {
                return h.response(data)
                .header("content-disposition", "inline; filename=\"" + fileName + ".pdf\"")
                .header("content-type", "application/pdf");
            });
        });
    }
});

server.route({
    method: 'DELETE',
    path: '/doc/{id}',
    handler: function (request, h) {
        var id = request.params.id;
        return metaDeleter.deleteFile(id);
    }
});

server.route({
    method: 'POST',
    path: '/doc/{id}/tag',
    config: {
        handler: (request, h) => {
            let id = request.params.id;
            let label = request.payload.label;
            let value;
            let type;
            console.log(request.payload);
            return metaFinder.getTagList().then(r => {
                if (request.payload.parameter) {
                    value = request.payload.parameter.value;
                    type = request.payload.parameter.type;
                }
                let exists = r.find((element) => (element.label === label));
                if (exists) {
                    if (request.payload.parameter) {
                        if (exists.parameter.type === type) {
                            console.log("Adding tag \"" + label + "\" of type \"" + type + "\" to " + id)
                            return metaStorer.addTag(id, label, value, type)
                        } else {
                            return h.response({
                                "statusCode": 400,
                                "error": "Wrong type",
                                "message": "Type provided does not match"
                            }).code(400)
                        }
                    } else {
                        if (exists.parameter) {
                            return h.response({
                                "statusCode": 400,
                                "error": "Wrong type",
                                "message": "You need to specify a value"
                            }).code(400)
                        }
                        console.log("Adding tag \"" + label + "\" to " + id)
                        return metaStorer.addTag(id, label);
                    }
                } else {
                    return h.response({
                            "statusCode": 400,
                            "error": "Cannot find tag",
                            "message": "Tag must exist before adding to a document"
                        })
                        .code(400)
                }
            });
        },
        payload: {
            allow: ['application/json'],
            maxBytes: 209715200,
            output: 'data',
            parse: true
        }
    }
});

server.route({
    method: 'GET',
    path: '/doc/{id}/tag',
    config: {
        handler: (request, h) => {
            return metaFinder.getTags(request.params.id).catch(e => 
                h.response({"statusCode":404,"error":"(Document) Not Found","message":"Not Found"})
                .code(404)
            );
        }
    }
});

server.route({
    method: 'PUT',
    path: '/doc/{id}/title',
    config: {
        handler: (request, h) => {
            var id = request.params.id;
            console.log(request.payload);
            return metaStorer.setTitle(id, request.payload.title).then(() => {
                return 'Title updated. Document-ID = ' + id;
            });
        },
        payload: {
            allow: ['application/json'],
            maxBytes: 209715200,
            output: 'data',
            parse: true
        }
    }
});

server.route({
    method: 'GET',
    path: '/doc/{id}/title',
    config: {
        handler: (request, h) => {
            var id = request.params.id;
            return metaFinder.getTitle(id).catch(e => 
                h.response({"statusCode":404,"error":"(Title) Not Found","message":"Not Found"})
                .code(404)
            );
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/doc/{id}/title',
    config: {
        handler: (request, h) => {
            var id = request.params.id;
            return metaDeleter.deleteTitle(id);
        }
    }
});

server.route({
    method: 'POST',
    path: '/tag',
    config: {
        handler: (request, h) => {
            console.log(request.payload);
            return metaFinder.getTagList().then(r => {
                let exists = r.find(function (element) {
                    return element.label == request.payload.label;
                });
                if (exists) {
                    return h.response({
                            "statusCode": 400,
                            "error": "Tag exists already",
                            "message": "Cannot create existing tag"
                        })
                        .code(400)
                } else {
                    if (request.payload.parameter) {
                        return metaStorer.createTag(request.payload.label, request.payload.parameter.type).catch(e => {
                            console.log(e);
                            return e;
                        });
                    } else {
                        return metaStorer.createTag(request.payload.label).catch(e => {
                            console.log(e);
                            return e;
                        });
                    }
                }
            });

        },
        payload: {
            allow: ['application/json'],
            output: 'data',
            parse: true
        }
    }
});

/*
CREATE TAG JSON SYNTAX
--
{
    label : "tagname" ,
    parameter : {
        type : "http://www.w3.org/2001/XMLSchema#decimal" or "http://www.w3.org/2001/XMLSchema#date"
    } // only for parameterizable tags
}
ADD TAG JSON SYNTAX
--
{
    label : "tagname" ,
    parameter : {
        type : "http://www.w3.org/2001/XMLSchema#decimal" or "http://www.w3.org/2001/XMLSchema#date",
        value : "20.7" or "2018-08-12" // must be valid xsd:decimal or xsd:date, as specified in property type.
    } // only for parameterizable tags
}
*/

server.route({
    method: 'GET',
    path: '/tag',
    config: {
        handler: (request, h) => {
            return metaFinder.getTagList().catch(e => 
                h.response({"statusCode":404,"error":"(Title) Not Found","message":"Not Found"})
                .code(404)
            );
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/tag/{label}',
    config: {
        handler: (request, h) => {
            var label = decodeURIComponent(request.params.label);
            return metaDeleter.deleteTag(label);
        }
    }
});

// Start the server
async function start() {

    try {
        await server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();