'use strict';

const Hapi = require('hapi');
const pdfProcessor = require('./src/pdfprocessor.js');
const metaStorer = require('./src/metastorer.js');
const dataStore = require('./src/datastore.js');
const metaFinder = require('./src/metafinder.js');
const metaDeleter = require('./src/metadeleter.js');
var nanoid = require('nanoid');

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
                        .header("location","/doc/" + id )
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
        return metaFinder.getDocumentList(request.query.text);
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
            allow: ['application/json','text/*'],
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