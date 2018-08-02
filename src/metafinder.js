const fetch = require("node-fetch");

function getDocumentList(textQuery) {
    var now = new Date();
    return fetch("http://fuseki:3030/3DOC/query", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-query"
        },
        body: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
            'PREFIX s: <http://schema.org/>\n' +
            'PREFIX text: <http://jena.apache.org/text#>\n' +
            'SELECT ?s ?identifier ?title\n' +
            'WHERE {\n' +
            '  ?s s:identifier ?identifier .\n' +
            '  OPTIONAL { ?s s:name ?title . }\n' +
            (textQuery ? '?s text:query \"'+textQuery+'\" .\n':'')+
            '}'
    }).then((response) => response.json()).then((json) => 
        json.results.bindings.map((binding) => {
            let result = {};
            result.identifier = binding.identifier.value;
            if (binding.title) {
                result.title = binding.title.value;
            }
            return result;
        })
    );
}

function getTitle(id) {
    var now = new Date();
    return fetch("http://fuseki:3030/3DOC/query", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-query"
        },
        body: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
            'PREFIX s: <http://schema.org/>\n' +
            'SELECT ?title\n' +
            'WHERE {\n' +
            '  ?s s:identifier "' + id + '" .\n' +
            '  ?s s:name ?title .\n' +
            '}'
    }).then((response) => response.json()).then((json) => 
        ({title: json.results.bindings[0].title.value})
    );
}

exports.getDocumentList = getDocumentList;
exports.getTitle = getTitle;