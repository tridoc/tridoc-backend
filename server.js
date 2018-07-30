'use strict';

const Hapi = require('hapi');
const pdfProcessor = require('./src/pdfprocessor.js');
const metaStorer = require('./src/metastorer.js');
const metaFinder = require('./src/metafinder.js');
var nanoid = require('nanoid');

// Create a server with a host and port
const server = Hapi.server({
    port: 8000
});

server.route({
    method: 'POST',
    path: '/doc',
    config: {
        handler: (request, h) => {
            var id = nanoid();
            console.log(request.payload);
            return pdfProcessor.getText(request.payload.path).then(text => {
                console.log(id);
                console.log(text);
                return metaStorer.storeDocument(id,text).then(() => {
                    return 'Recieved your data. Document-ID = ' + id;
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
        return metaFinder.getDocumentList();
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
            return metaFinder.getTitle(id);
        }
    }
});

server.route({
    method: 'DELETE',
    path: '/doc/{id}/title',
    config: {
        handler: (request, h) => {
            var id = request.params.id;
            return metaFinder.getTitle(id);
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