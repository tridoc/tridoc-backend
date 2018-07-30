'use strict';

const Hapi = require('hapi');
const pdfProcessor = require('./src/pdfprocessor.js');
const metaStorer = require('./src/metastorer.js');
var nanoid = require('nanoid');

// Create a server with a host and port
const server = Hapi.server({
    port: 8000
});

// Add the route
server.route({
    method: 'GET',
    path: '/doc',
    handler: function (request, h) {
        return 'hello world!';
    }
});

server.route({
    method: 'POST',
    path: '/doc',
    config: {
        handler: (request, h) => {
            var id = nanoid();
            console.log(request.payload);
            pdfProcessor.getText(request.payload.path).then(text => {
                console.log(id);
                console.log(text);
                metaStorer.storeDocument(id,text)
            });
            return 'Received your data';
        },
        payload: {
            maxBytes: 209715200,
            output: 'file',
            parse: false
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