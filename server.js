'use strict';

const Hapi=require('hapi');
const pdfProcessor = require('./src/pdfprocessor.js');

// Create a server with a host and port
const server=Hapi.server({
    port:8000
});

// Add the route
server.route({
    method:'GET',
    path:'/hello',
    handler:function(request,h) {

        return'hello world';
    }
});

server.route({
    method:'POST',
    path:'/add',
    config: {
        handler: (request, h) => {    
          console.log(request.payload);
          pdfProcessor.getText(request.payload.path).then(text => console.log(text));
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
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();