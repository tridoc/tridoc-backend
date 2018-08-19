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
            'SELECT DISTINCT ?s ?identifier ?title\n' +
            'WHERE {\n' +
            '  ?s s:identifier ?identifier .\n' +
            '  OPTIONAL { ?s s:name ?title . }\n' +
            (textQuery ? '{ { ?s text:query  (s:name \"'+textQuery+'\") } UNION { ?s text:query  (s:text \"'+textQuery+'\")} } .\n':'')+
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

function getTagList() {
    var now = new Date();
    return fetch("http://fuseki:3030/3DOC/query", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-query"
        },
        body: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
            'PREFIX s: <http://schema.org/>\n' +
            'PREFIX tridoc:  <http://vocab.tridoc.me/>\n' +
            'SELECT DISTINCT ?s ?label ?type\n' +
            'WHERE {\n' +
            '  ?s tridoc:label ?label .\n' +
            '  OPTIONAL { ?s tridoc:valueType ?type . }\n' +
            '}'
    }).then((response) => response.json()).then((json) => 
        json.results.bindings.map((binding) => {
            let result = {};
            result.label = binding.label.value;
            if (binding.type) {
                result.parameter = {type :binding.type.value};
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

function getTags(id) {
    let query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
    'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n' +
    'PREFIX tridoc:  <http://vocab.tridoc.me/>\n' +
    'PREFIX s: <http://schema.org/>\n' +
    'SELECT DISTINCT ?label ?type ?v \n' +
    ' WHERE { \n' +
    '  GRAPH <http://3doc/meta> { \n' +
    '    <http://3doc/data/' + id + '> tridoc:tag ?tag . \n' +
    '    {\n' +
    '      ?tag tridoc:label ?label . \n' +
    '    } \n' +
    '    UNION \n' +
    '    { \n' +
    '      ?tag tridoc:value ?v ; \n' +
    '        tridoc:parameterizableTag ?ptag . \n' +
    '      ?ptag tridoc:label ?label ; \n' +
    '        tridoc:valueType ?type . \n' +
    '    } \n' +
    '  }\n' +
    '}';
    return fetch("http://fuseki:3030/3DOC/query", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-query"
        },
        body: query
    }).then((response) => response.json()).then((json) => 
        json.results.bindings.map((binding) => {
            let result = {};
            result.label = binding.label.value;
            if (binding.type) {
                result.parameter = {
                    "type": binding.type.value,
                    "value": binding.v.value
                };
            }
            return result;
        })
    );
}


exports.getDocumentList = getDocumentList;
exports.getTagList = getTagList;
exports.getTags = getTags;
exports.getTitle = getTitle;