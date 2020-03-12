const fetch = require("node-fetch");

function getDocumentList(textQuery,tagArray,notTagArray,limit,offset) {
    let tagQuery = "";
    for (let i = 0 ; i < tagArray.length ; i++) {
        tagQuery = tagQuery + '{{ ?s tridoc:tag ?tag' + i + ' . ?tag' + i + ' tridoc:label \"' + tagArray[i] + '\" . } UNION { ?s tridoc:tag ?ptag' + i + ' . ?ptag' + i + ' tridoc:parameterizableTag ?atag' + i + ' . ?atag' + i + ' tridoc:label \"' + tagArray[i] + '\" . }} . \n'
    }
    let notTagQuery = "";
    for (let i = 0 ; i < notTagArray.length ; i++) {
        notTagQuery = notTagQuery + 'FILTER NOT EXISTS {{ ?s tridoc:tag ?ntag' + i + ' . ?ntag' + i + ' tridoc:label \"' + notTagArray[i] + '\" . } UNION { ?s tridoc:tag ?nptag' + i + ' . ?nptag' + i + ' tridoc:parameterizableTag ?natag' + i + ' . ?natag' + i + ' tridoc:label \"' + notTagArray[i] + '\" . }} . \n'
    }
    let body = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
        'PREFIX s: <http://schema.org/>\n' +
        'PREFIX tridoc:  <http://vocab.tridoc.me/>\n' +
        'PREFIX text: <http://jena.apache.org/text#>\n' +
        'SELECT DISTINCT ?s ?identifier ?title ?date\n' +
        'WHERE {\n' +
        '  ?s s:identifier ?identifier .\n' +
        '  ?s s:dateCreated ?date .\n' +
        tagQuery +
        notTagQuery +
        '  OPTIONAL { ?s s:name ?title . }\n' +
        (textQuery ? '{ { ?s text:query  (s:name \"' + textQuery + '\") } UNION { ?s text:query  (s:text \"' + textQuery + '\")} } .\n' : '') +
        '}\n' +
        'ORDER BY desc(?date)\n' +
        (limit ? 'LIMIT ' + limit + '\n' : '') +
        (offset ? 'OFFSET ' + offset : '');
    return fetch("http://fuseki:3030/3DOC/query", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-query"
        },
        body: body
    }).then((response) => response.json()).then((json) => 
        json.results.bindings.map((binding) => {
            let result = {};
            result.identifier = binding.identifier.value;
            if (binding.title) {
                result.title = binding.title.value;
            }
            if (binding.date) {
                result.created = binding.date.value;
            }
            return result;
        })
    );
}

function getDocumentNumber(textQuery , tagArray , notTagArray) {
    let tagQuery = "";
    for (let i = 0 ; i < tagArray.length ; i++) {
        tagQuery = tagQuery + '{{ ?s tridoc:tag ?tag' + i + ' . ?tag' + i + ' tridoc:label \"' + tagArray[i] + '\" . } UNION { ?s tridoc:tag ?ptag' + i + ' . ?ptag' + i + ' tridoc:parameterizableTag ?atag' + i + ' . ?atag' + i + ' tridoc:label \"' + tagArray[i] + '\" . }} . \n'
    }
    let notTagQuery = "";
    for (let i = 0 ; i < notTagArray.length ; i++) {
        notTagQuery = notTagQuery + 'FILTER NOT EXISTS {{ ?s tridoc:tag ?ntag' + i + ' . ?ntag' + i + ' tridoc:label \"' + notTagArray[i] + '\" . } UNION { ?s tridoc:tag ?nptag' + i + ' . ?nptag' + i + ' tridoc:parameterizableTag ?natag' + i + ' . ?natag' + i + ' tridoc:label \"' + notTagArray[i] + '\" . }} . \n'
    }
    return fetch("http://fuseki:3030/3DOC/query", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-query"
        },
        body: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
            'PREFIX s: <http://schema.org/>\n' +
            'PREFIX tridoc:  <http://vocab.tridoc.me/>\n' +
            'PREFIX text: <http://jena.apache.org/text#>\n' +
            'SELECT (COUNT(DISTINCT ?s) as ?count)\n' +
            'WHERE {\n' +
            '  ?s s:identifier ?identifier .\n' +
            tagQuery + notTagQuery +
            (textQuery ? '{ { ?s text:query  (s:name \"'+textQuery+'\") } UNION { ?s text:query  (s:text \"'+textQuery+'\")} } .\n':'')+
            '}'
    }).then((response) => response.json()).then((json) => json.results.bindings[0].count.value);
}

function getTagList() {
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

function getComments(id) {
    let query =
`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX tridoc:  <http://vocab.tridoc.me/>
PREFIX s: <http://schema.org/>
SELECT DISTINCT ?d ?t WHERE {
    GRAPH <http://3doc/meta> {
        <http://3doc/data/${id}> s:comment [
            a s:Comment ;
            s:dateCreated ?d ;
            s:text ?t
        ] .
    }
}`;
    return fetch("http://fuseki:3030/3DOC/query", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-query"
        },
        body: query
    }).then((response) => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response);
        }
    }).then((json) => 
        json.results.bindings.map((binding) => {
            let result = {};
            result.text = binding.t.value;
            result.created = binding.d.value;
            return result;
        })
    );
}

function dump(accept = "text/turtle") {
    let query = 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }';
    return fetch("http://fuseki:3030/3DOC/query", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-query",
            "Accept": accept
        },
        body: query
    })
}


exports.getDocumentList = getDocumentList;
exports.getDocumentNumber = getDocumentNumber;
exports.getTagList = getTagList;
exports.getTags = getTags;
exports.getComments = getComments;
exports.getTitle = getTitle;
exports.dump = dump;