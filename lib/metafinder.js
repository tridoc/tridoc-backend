const fetch = require("node-fetch");

/** takes: { tags: [string, string, string][], nottags: [string, string, string][], text: string, limit: number, offset: number } */
function getDocumentList({ tags, nottags, text, limit, offset }) {
    let tagQuery = "";
    for (let i = 0 ; i < tags.length ; i++) {
        if (tags[i][3]) {
            tagQuery +=
`{  ?s tridoc:tag ?ptag${i} .
    ?ptag${i} tridoc:parameterizableTag ?atag${i} .
    ?ptag${i} tridoc:value ?v${i} .
    ?atag${i} tridoc:label "${tags[i][0]}" .
    ${ tags[i][1] ? `FILTER (?v${i} >= "${tags[i][1]}"^^<${tags[i][3]}> )` : '' }
    ${ tags[i][2] ? `FILTER (?v${i} ${ tags[i][5] ? '<' :'<='} "${tags[i][2]}"^^<${tags[i][3]}> )` : '' } }`
        } else {
            tagQuery +=
`{  ?s tridoc:tag ?tag${i} .
    ?tag${i} tridoc:label "${tags[i][0]}" . }`
        }
    }
    let notTagQuery = "";
    for (let i = 0 ; i < nottags.length ; i++) {
        if (nottags[i][3]) {
            tagQuery +=
`FILTER NOT EXISTS { ?s tridoc:tag ?ptag${i} .
    ?ptag${i} tridoc:parameterizableTag ?atag${i} .
    ?ptag${i} tridoc:value ?v${i} .
    ?atag${i} tridoc:label "${nottags[i][0]}" .
    ${ nottags[i][1] ? `FILTER (?v${i} >= "${nottags[i][1]}"^^<${nottags[i][3]}> )` : '' }
    ${ nottags[i][2] ? `FILTER (?v${i} ${ nottags[i][5] ? '<' :'<='} "${nottags[i][2]}"^^<${nottags[i][3]}> )` : '' } }`
        } else {
            tagQuery +=
`FILTER NOT EXISTS { ?s tridoc:tag ?tag${i} .
    ?tag${i} tridoc:label "${nottags[i][0]}" . }`
        }
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
        (text ? '{ { ?s text:query (s:name \"' + text + '\") } UNION { ?s text:query (s:text \"' + text + '\")} } .\n' : '') +
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

function getDocumentNumber({ tags, nottags, text }) {
    let tagQuery = "";
    for (let i = 0 ; i < tags.length ; i++) {
        if (tags[i][3]) {
            tagQuery +=
`{  ?s tridoc:tag ?ptag${i} .
    ?ptag${i} tridoc:parameterizableTag ?atag${i} .
    ?ptag${i} tridoc:value ?v${i} .
    ?atag${i} tridoc:label "${tags[i][0]}" .
    ${ tags[i][1] ? `FILTER (?v${i} >= "${tags[i][1]}"^^<${tags[i][3]}> )` : '' }
    ${ tags[i][2] ? `FILTER (?v${i} ${ tags[i][5] ? '<' :'<='} "${tags[i][2]}"^^<${tags[i][3]}> )` : '' } }`
        } else {
            tagQuery +=
`{  ?s tridoc:tag ?tag${i} .
    ?tag${i} tridoc:label "${tags[i][0]}" . }`
        }
    }
    let notTagQuery = "";
    for (let i = 0 ; i < nottags.length ; i++) {
        if (nottags[i][3]) {
            tagQuery +=
`FILTER NOT EXISTS { ?s tridoc:tag ?ptag${i} .
    ?ptag${i} tridoc:parameterizableTag ?atag${i} .
    ?ptag${i} tridoc:value ?v${i} .
    ?atag${i} tridoc:label "${nottags[i][0]}" .
    ${ nottags[i][1] ? `FILTER (?v${i} >= "${nottags[i][1]}"^^<${nottags[i][3]}> )` : '' }
    ${ nottags[i][2] ? `FILTER (?v${i} ${ nottags[i][5] ? '<' :'<='} "${nottags[i][2]}"^^<${nottags[i][3]}> )` : '' } }`
        } else {
            tagQuery +=
`FILTER NOT EXISTS { ?s tridoc:tag ?tag${i} .
    ?tag${i} tridoc:label "${nottags[i][0]}" . }`
        }
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
            (text ? '{ { ?s text:query (s:name \"'+text+'\") } UNION { ?s text:query (s:text \"'+text+'\")} } .\n':'')+
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
                result.parameter = {type: binding.type.value};
            }
            return result;
        })
    );
}

function getTagTypes(labels) {
    return fetch("http://fuseki:3030/3DOC/query", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-query"
        },
        body: `PREFIX tridoc:  <http://vocab.tridoc.me/>
SELECT DISTINCT ?l ?t WHERE { VALUES ?l { "${labels.join('" "')}" } ?s tridoc:label ?l . OPTIONAL { ?s tridoc:valueType ?t . } }`
    }).then((response) => response.json()).then((json) =>
        json.results.bindings.map((binding) => {
            let result = [];
            result[0] = binding.l.value;
            if (binding.t) {
                result[1] = binding.t.value;
            }
            return result;
        })
    );
}

function getMeta(id) {
    return fetch("http://fuseki:3030/3DOC/query", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-query"
        },
        body: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
            'PREFIX s: <http://schema.org/>\n' +
            'SELECT ?title ?date\n' +
            'WHERE {\n' +
            '  ?s s:identifier "' + id + '" .\n' +
            '  ?s s:dateCreated ?date .\n' +
            '  OPTIONAL { ?s s:name ?title . }\n' +
            '}'
    }).then((response) => response.json()).then((json) => {
        const result = {}
        if (json.results.bindings[0].title) result.title = json.results.bindings[0].title.value
        if (json.results.bindings[0].date) result.created = json.results.bindings[0].date.value
        return result
    });
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
exports.getTagTypes = getTagTypes;
exports.getTags = getTags;
exports.getComments = getComments;
exports.getMeta = getMeta;
exports.dump = dump;