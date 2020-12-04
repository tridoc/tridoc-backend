'use strict';

const Hapi = require('hapi');
const util = require("util")
const { spawnSync } = require( 'child_process' );
const pdfProcessor = require('./pdfprocessor.js');
const metaStorer = require('./metastorer.js');
const dataStore = require('./datastore.js');
const metaFinder = require('./metafinder.js');
const metaDeleter = require('./metadeleter.js');
var nanoid = require('nanoid');

const log_info = (request) => console.log(request.method.toUpperCase() + " " + request.path);

// HELPER FUNCTIONS

function makeArray(maybeArray) {
    if (Array.isArray(maybeArray)) {
        return maybeArray;
    } else {
        let array = new Array(maybeArray);
        return array;
    }
}

/** => { tags: [string, string, string][], nottags: [string, string, string][], text: string, limit: number, offset: number } */
function processParams (query) {
    let result = {}
    result.tags = makeArray(query.tag ? makeArray(query.tag) : []).map(t => t.split(';'))
    result.nottags = makeArray(query.nottag ? makeArray(query.nottag) : []).map(t => t.split(';'))
    result.text = query.text
    result.limit = (parseInt(query.limit, 10) > 0 ? parseInt(query.limit) : undefined)
    result.offset = (parseInt(query.offset, 10) >= 0 ? parseInt(query.offset) : undefined)
    return metaFinder.getTagTypes(result.tags.map(e => e[0]).concat(result.nottags.map(e => e[0]))).then(types => {
        result.tags.map(t => {
            const typ = types.find(e => e[0] === t[0])
            t[3] = typ ? typ[1] : undefined
            return t
        })
        result.nottags.map(t => {
            const typ = types.find(e => e[0] === t[0])
            t[3] = typ ? typ[1] : undefined
            return t
        })
        console.log('eh??', util.inspect(result))
        return result
    })
}

// SERVER

const VERSION = process.env.npm_package_version || require('../package.json').version;

// Create a server with a host and port
const server = Hapi.server({
    debug: { request: ['error'] },
    port: 8000,
    routes: {
        cors: {
            additionalHeaders: ['Access-Control-Allow-Origin'],
            origin: ['*']
        },
        auth: 'simple'
    }
});

const validate = async (request, username, password) => {

    console.log('Authenticating ' + username + " " + password);

    if (username !== "tridoc") {
        return { credentials: null, isValid: false };
    }

    const isValid = password === process.env.TRIDOC_PWD;
    const credentials = { id: "0001", name: username };

    return { isValid, credentials };
};





// Start the server
async function start() {


    try {
        await server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }


    await server.register(require('hapi-auth-basic'));

    server.auth.strategy('simple', 'basic', { validate });

    server.route({
        method: 'GET',
        path: '/count',
        handler: function (request, h) {
            log_info(request);
            return processParams(request.query).then(p => metaFinder.getDocumentNumber(p))
        }
    });

    server.route({
        method: 'POST',
        path: '/doc',
        config: {
            handler: (request, h) => {
                log_info(request);
                var id = nanoid();
                return pdfProcessor.getText(request.payload.path).then(text => {
                  const lang = process.env.OCR_LANG ? process.env.OCR_LANG : 'fra+deu+eng'
                  if (text.length < 4) {
                    const sandwich = spawnSync( 'pdfsandwich', [ '-rgb', '-lang', lang, request.payload.path ] );
                    if(sandwich.error) {
                      console.log( `error attempting to execute pdfsandwich: ${sandwich.error}` );
                      return [text, request.payload.path];
                    } else {
                      console.log( `pdfsandwich stderr: ${sandwich.stderr.toString()}` );
                      console.log( `pdfsandwich stdout: ${sandwich.stdout.toString()}` );
                      const ocrPath = request.payload.path+'_ocr'
                      return pdfProcessor.getText(ocrPath).then(text => [text, ocrPath]);
                    }
                  } else {
                    return [text, request.payload.path];
                  }
                }).then(([text,path]) => {
                    console.log("Document created with id " + id);
                    const datecheck = /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-6]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-6]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-6]\d([+-][0-2]\d:[0-5]\d|Z))$/;
                    return metaStorer.storeDocument(id, text, (request.query.date && request.query.date.match(datecheck)) ? request.query.date : undefined).then(() => {
                        return dataStore.storeDocument(id, path)
                            .then(() =>
                                h.response()
                                    .code(201)
                                    .header("Location", "/doc/" + id)
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
            log_info(request);
            return processParams(request.query).then(p => metaFinder.getDocumentList(p))
        }
    });

    server.route({
        method: 'GET',
        path: '/doc/{id}',
        handler: function (request, h) {
            log_info(request);
            var id = request.params.id;
            return dataStore.getDocument(id).then(data => {
                return metaFinder.getMeta(id).then(titleObject => titleObject.title || titleObject.created).catch(e => "document").then(fileName => {
                    return h.response(data)
                        .header("content-disposition", "inline; filename=\"" + encodeURI(fileName) + ".pdf\"")
                        .header("content-type", "application/pdf");
                });
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/doc/{id}',
        handler: function (request, h) {
            log_info(request);
            var id = request.params.id;
            return metaDeleter.deleteFile(id);
        }
    });

    server.route({
        method: 'POST',
        path: '/doc/{id}/comment',
        config: {
            handler: (request, h) => {
                log_info(request)
                return metaStorer.addComment(request.params.id, request.payload.text).catch(e =>
                    h.response({ "statusCode": 404, "error": e + " | (Document) Not Found", "message": "Not Found" })
                        .code(404)
                );
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
        path: '/doc/{id}/comment',
        config: {
            handler: (request, h) => {
                log_info(request);
                return metaFinder.getComments(request.params.id).catch(e =>
                    h.response({ "statusCode": 404, "error": e + "(Document) Not Found", "message": "Not Found" })
                        .code(404)
                );
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/doc/{id}/tag',
        config: {
            handler: (request, h) => {
                log_info(request);
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
                log_info(request);
                return metaFinder.getTags(request.params.id).catch(e =>
                    h.response({ "statusCode": 404, "error": "(Document) Not Found", "message": "Not Found" })
                        .code(404)
                );
            }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/doc/{id}/tag/{label}',
        config: {
            handler: (request, h) => {
                log_info(request);
                var label = decodeURIComponent(request.params.label);
                var id = decodeURIComponent(request.params.id);
                return metaDeleter.deleteTag(label, id);
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/doc/{id}/title',
        config: {
            handler: (request, h) => {
                log_info(request);
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
                log_info(request);
                var id = request.params.id;
                return metaFinder.getMeta(id)
                    .then(r => ({"title": r.title}))
                    .catch(e =>
                        h.response({ "statusCode": 500, "error": e, "message": "Not Found" })
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
                console.log("DELETE /doc/" + id + "/title");
                return metaDeleter.deleteTitle(id);
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/doc/{id}/meta',
        config: {
            handler: (request, h) => {
                log_info(request);
                var id = request.params.id;
                return metaFinder.getMeta(id)
                    .then(response => {
                        return metaFinder.getTags(id)
                            .then(tags => {
                                response.tags = tags;
                                return metaFinder.getComments(id)
                                    .then(comments => {
                                        response.comments = comments
                                        return response
                                    })
                            })
                    }).catch(e => {
                        console.log("\x1b[31m ERROR:" + util.inspect(e));
                        return h.response({ "statusCode": 404, "error": "(Document) Not Found", "message": "Not Found" })
                            .code(404)
                    });
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/raw/rdf',
        handler: function (request, h) {
            log_info(request);
            let type = request.headers["content-type"];
            type = type || 'text/turtle';
            return metaStorer.uploadBackupMetaData(request.payload,type).then((response) => {
                type = response.headers.get('Content-Type');
                console.log(type);
                return response.text();
            }).then(data => {
                console.log(type);
                const response = h.response(data);
                response.type(type);
                return response;
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/raw/rdf',
        handler: function (request, h) {
            log_info(request);
            let accept = request.query.accept ? decodeURIComponent(request.query.accept) : request.headers.accept;
            let type = 'text/turtle';
            return metaFinder.dump(accept).then((response) => {
                type = response.headers.get('Content-Type');
                console.log(type);
                return response.text();
            }).then(data => {
                console.log(type);
                const response = h.response(data);
                response.type(type);
                return response;
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/raw/tgz',
        handler: function (request, h) {
            log_info(request);
            return dataStore.createArchive()
                .then(archive => h.response(archive)
                    .type('application/gzip')
                    .header("content-disposition", `attachment; filename="tridoc_backup_${Date.now()}.tar.gz"`));
        }
    });


    server.route({
        method: 'GET',
        path: '/raw/zip',
        handler: function (request, h) {
            log_info(request);
            return dataStore.createZipArchive()
                .then(archive => h.response(archive.toBuffer())
                    .type('application/zip')
                    .header("content-disposition", `attachment; filename="tridoc_backup_${Date.now()}.zip"`));
        }
    });

    server.route({
      method: 'PUT',
      path: '/raw/zip',
      config: {
          handler: (request, h) => {
              log_info(request);
              var id = request.params.id;
              console.log(request.payload);
              dataStore.putData(request.payload)
              return 'data replaced'
          },
          payload: {
              allow: ['application/zip'],
              maxBytes: 10*1024*1024*1024,
              output: 'data',
              parse: false
          }
      }
  });

    server.route({
        method: 'POST',
        path: '/tag',
        config: {
            handler: (request, h) => {
                console.log("POST /tag");
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
                        let regex = /\s|^[.]{1,2}$|\/|\\|#|"|'|,|;|:|\?/;
                        if (!regex.test(request.payload.label)) {
                            if (request.payload.parameter) {
                                return metaStorer.createTag(request.payload.label, request.payload.parameter.type).catch(e => {
                                    console.log(e);
                                    return h.response({
                                        "statusCode": 500,
                                        "error": "Could not add Tag",
                                        "message": e
                                    }).code(500)
                                });
                            } else {
                                return metaStorer.createTag(request.payload.label).catch(e => {
                                    console.log(e);
                                    return h.response({
                                        "statusCode": 400,
                                        "error": "Could not add Tag",
                                        "message": e,
                                    }).code(500)
                                });
                            }
                        } else {
                            return h.response({
                                "statusCode": 400,
                                "error": "Label contains forbidden characters",
                                "message": regex + " matches the Label"
                            })
                                .code(400)
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
                log_info(request);
                return metaFinder.getTagList().catch(e =>
                    h.response({ "statusCode": 404, "error": "(Title) Not Found", "message": "Not Found" })
                        .code(404)
                );
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/tag/{label}',
        config: {
            handler: (request, h) => {
                console.log(request);
                let arg = {}
                arg.text = request.query.text
                arg.limit = (parseInt(request.query.limit, 10) > 0 ? parseInt(request.query.limit) : undefined)
                arg.offset = (parseInt(request.query.offset, 10) >= 0 ? parseInt(request.query.offset) : undefined)
                arg.nottags = []
                arg.tags = [ decodeURIComponent(request.params.label) ]
                return metaFinder.getDocumentList(arg).catch(e =>
                    h.response({
                        "statusCode": 404,
                        "error": "(Title) Not Found",
                        "message": util.inspect(e)
                    })
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
                console.log(request);
                var label = decodeURIComponent(request.params.label);
                return metaDeleter.deleteTag(label);
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/version',
        config: {
            handler: (request, h) => {
                log_info(request);
                return VERSION;
            }
        }
    });

    console.log('Server running at:', server.info.uri);
};

start();