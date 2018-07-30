const fetch = require("node-fetch");

function storeDocument(id, text) {
    var now = new Date();
    return fetch("http://fuseki:3030/3DOC/update", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-update"
        },
        body: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
            'PREFIX s: <http://schema.org/>\n' +
            'INSERT DATA {\n' +
            '  GRAPH <http://3doc/meta> {\n' +
            '    <http://3doc/data/' + id + '> rdf:type s:DigitalDocument ;\n' +
            '    s:dateCreated "' + now.toISOString() + '" ;\n' +
            '    s:identifier "' + id + '" ;\n' +
            '    s:text "' + text + '" .\n' +
            '  }\n' +
            '}'
    })
}

function setTitle(id, title) {
    var now = new Date();
    return fetch("http://fuseki:3030/3DOC/update", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-update"
        },
        body: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
            'PREFIX s: <http://schema.org/>\n' +
            'WITH <http://3doc/meta>\n' +
            'DELETE { <http://3doc/data/' + id + '> s:name ?o }\n' +
            'INSERT { <http://3doc/data/' + id + '> s:name "' + title + '" }\n' +
            'WHERE { OPTIONAL { <http://3doc/data/' + id + '> s:name ?o } }'
    })
}

exports.storeDocument = storeDocument;
exports.setTitle = setTitle;


            //'    s:author < ???? > ;\n' + // To be decided whether to use s:author or s:creator
            //'    s:comment " ???? " ;\n' +
            //'    s:creator < ???? > ;\n' + // To be decided whether to use s:author or s:creator
            //'    s:keywords " ???? " ;\n' +
