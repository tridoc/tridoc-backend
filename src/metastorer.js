const fetch = require("node-fetch");

function addTag(label, type) {
    let tagType = "Tag";
    let valueType = "";
    if (type) {
        tagType = "ParameterizableTag";
        if ((type == "http://www.w3.org/2001/XMLSchema#decimal")||(type == "http://www.w3.org/2001/XMLSchema#date")) {
            valueType = "    tridoc:valueType <" + type + ">;\n";
        } else {
            return Promise.reject("Invalid type");
        }
    }
    let query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
        'PREFIX xsd: <https://www.w3.org/2001/XMLSchema#>\n' +
        'PREFIX tridoc:  <https://vocab.tridoc.me/>\n' +
        'PREFIX s: <http://schema.org/>\n' +
        'INSERT DATA {\n' +
        '  GRAPH <http://3doc/meta> {\n' +
        '    <http://3doc/tag/' + encodeURIComponent(label) + '> rdf:type tridoc:' + tagType + ' ;\n' +
             valueType +
        '    tridoc:label "' + label + '" .\n' +
        '  }\n' +
        '}';
    //console.log(query);
    return fetch("http://fuseki:3030/3DOC/update", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-update"
        },
        body: query
    })
}

function storeDocument(id, text) {
    var now = new Date();
    let query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
    'PREFIX xsd: <https://www.w3.org/2001/XMLSchema#>\n' +
    'PREFIX s: <http://schema.org/>\n' +
    'INSERT DATA {\n' +
    '  GRAPH <http://3doc/meta> {\n' +
    '    <http://3doc/data/' + id + '> rdf:type s:DigitalDocument ;\n' +
    '    s:dateCreated "' + now.toISOString() + '"^^xsd:dateTime ;\n' +
    '    s:identifier "' + id + '" ;\n' +
    '    s:text "' + text.replace(/'/g,"\\'").replace(/"/g,"\\\"") + '" .\n' +
    '  }\n' +
    '}';
    //console.log(query);
    return fetch("http://fuseki:3030/3DOC/update", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-update"
        },
        body: query
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
exports.addTag = addTag;

            //'    s:author < ???? > ;\n' + // To be decided whether to use s:author or s:creator
            //'    s:comment " ???? " ;\n' +
            //'    s:creator < ???? > ;\n' + // To be decided whether to use s:author or s:creator
