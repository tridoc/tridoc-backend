const fetch = require("node-fetch");

function deleteTitle(id, title) {
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

exports.deleteTitle = deleteTitle;
