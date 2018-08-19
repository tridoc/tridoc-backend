const fetch = require("node-fetch");

function deleteTitle(id) {
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
            'WHERE { <http://3doc/data/' + id + '> s:name ?o }'
    })
}

function deleteTag(label) {
    return fetch("http://fuseki:3030/3DOC/update", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-update"
        },
        body: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
            'PREFIX s: <http://schema.org/>\n' +
            'PREFIX tridoc:  <http://vocab.tridoc.me/>\n' +
            'WITH <http://3doc/meta>\n' +
            'DELETE {\n' +
            '  ?ptag ?p ?o .\n' +
            '  ?s1 ?p1 ?ptag\n' +
            '}\n' +
            'WHERE {\n' +
            '  ?ptag tridoc:parameterizableTag ?tag.\n' +
            '  ?tag tridoc:label "' + label + '" .\n' +
            '  OPTIONAL { ?ptag ?p ?o } \n' +
            '  OPTIONAL { ?s1 ?p1 ?ptag } \n' +
            '}'
    }).catch(e => console.log(e)).then(() => {
        return fetch("http://fuseki:3030/3DOC/update", {
            method: "POST",
            headers: {
                "Authorization": "Basic " + btoa("admin:pw123"),
                "Content-Type": "application/sparql-update"
            },
            body: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
                'PREFIX s: <http://schema.org/>\n' +
                'PREFIX tridoc:  <http://vocab.tridoc.me/>\n' +
                'WITH <http://3doc/meta>\n' +
                'DELETE {\n' +
                '  ?tag ?p ?o .\n' +
                '  ?s1 ?p1 ?tag\n' +
                '}\n' +
                'WHERE {\n' +
                '  ?tag tridoc:label "' + label + '" .\n' +
                '  OPTIONAL { ?tag ?p ?o } \n' +
                '  OPTIONAL { ?s1 ?p1 ?tag } \n' +
                '}'
        })
    })
}

function deleteFile(id) {
    return fetch("http://fuseki:3030/3DOC/update", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-update"
        },
        body: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
            'PREFIX s: <http://schema.org/>\n' +
            'WITH <http://3doc/meta>\n' +
            'DELETE { <http://3doc/data/' + id + '> ?p ?o }\n' +
            'WHERE { <http://3doc/data/' + id + '> ?p ?o }'
    })
}

exports.deleteTitle = deleteTitle;
exports.deleteFile = deleteFile;
exports.deleteTag = deleteTag;
