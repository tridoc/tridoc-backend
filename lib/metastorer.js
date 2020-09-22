const fetch = require("node-fetch");

function createTag(label, type) {
    if (label.length < 1) {
        return Promise.reject("Name must be specified")
    }
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
        'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n' +
        'PREFIX tridoc:  <http://vocab.tridoc.me/>\n' +
        'PREFIX s: <http://schema.org/>\n' +
        'INSERT DATA {\n' +
        '  GRAPH <http://3doc/meta> {\n' +
        '    <http://3doc/tag/' + encodeURIComponent(label) + '> rdf:type tridoc:' + tagType + ' ;\n' +
             valueType +
        '    tridoc:label "' + escapeLiteral(label) + '" .\n' +
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

function addTag(id, label, value, type) {
    let tag = value ? encodeURIComponent(label) + "/" + value : encodeURIComponent(label) ;
    let query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
        'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n' +
        'PREFIX tridoc:  <http://vocab.tridoc.me/>\n' +
        'PREFIX s: <http://schema.org/>\n' +
        'INSERT DATA {\n' +
        '  GRAPH <http://3doc/meta> {\n' +
        '    <http://3doc/data/' + id + '> tridoc:tag <http://3doc/tag/' + tag + '> .   \n' +
        (value ? '    <http://3doc/tag/' + tag + '> a tridoc:ParameterizedTag ;\n' +
        '      tridoc:parameterizableTag <http://3doc/tag/' + encodeURIComponent(label) + '>;\n' +
        '      tridoc:value "' + value + '"^^<' + type + '> .\n' : '') +
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

function addComment(id, text) {
    const now = new Date()
    const query =
`PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX tridoc: <http://vocab.tridoc.me/>
PREFIX s: <http://schema.org/>
INSERT DATA {
    GRAPH <http://3doc/meta> {
        <http://3doc/data/${id}> s:comment [
            a s:Comment ;
            s:dateCreated "${now.toISOString()}"^^xsd:dateTime ;
            s:text "${escapeLiteral(text)}"
        ] .
    }
}`;
    return fetch("http://fuseki:3030/3DOC/update", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": "application/sparql-update"
        },
        body: query
    }).then(response => {
        if (response.ok) {
            return response;
        } else {
            throw new Error(response.statusText);
        }
    })
}

function storeDocument(id, text) {
    var now = new Date();
    let query = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
    'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n' +
    'PREFIX s: <http://schema.org/>\n' +
    'INSERT DATA {\n' +
    '  GRAPH <http://3doc/meta> {\n' +
    '    <http://3doc/data/' + id + '> rdf:type s:DigitalDocument ;\n' +
    '    s:dateCreated "' + now.toISOString() + '"^^xsd:dateTime ;\n' +
    '    s:identifier "' + id + '" ;\n' +
    '    s:text "' + 
    escapeLiteral(text) + '" .\n' +
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
    }).then(response => {
        //console.log("Fuseki returned: "+response.status);
        if (response.ok) {
            return response;
        } else {
            throw new Error("Error from Fuseki: " + response.statusText);
        }
    })
}

function escapeLiteral(string) {
    return string.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/'/g,"\\'").replace(/"/g,"\\\"");
}

function setTitle(id, title) {
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
            'INSERT { <http://3doc/data/' + id + '> s:name "' + escapeLiteral(title) + '" }\n' +
            'WHERE { OPTIONAL { <http://3doc/data/' + id + '> s:name ?o } }'
    }).then(response => {
        if (response.ok) {
            return response;
        } else {
            throw new Error("Error from Fuseki: " + response.statusText);
        }
    })
}

function uploadBackupMetaData(file, type = 'text/turtle') {
    return fetch("http://fuseki:3030/3DOC/data?graph=http://3doc/meta", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + btoa("admin:pw123"),
            "Content-Type": type,
            "Accept": "application/json, */*;q=0.01"
        },
        body: file
    }).then(response => {
        if (response.ok) {
            return response;
        } else {
            throw new Error(response.statusText);
        }
    })
}

function restore(turtleData) {
  let statement = `CLEAR GRAPH <http://3doc/meta>;
              INSERT DATA {
                GRAPH <http://3doc/meta> { ${turtleData} }
              }`;
  return fetch("http://fuseki:3030/3DOC/update", {
      method: "POST",
      headers: {
          "Authorization": "Basic " + btoa("admin:pw123"),
          "Content-Type": "application/sparql-update"
      },
      body: statement
  })
}

exports.storeDocument = storeDocument;
exports.setTitle = setTitle;
exports.addTag = addTag;
exports.addComment = addComment;
exports.createTag = createTag;
exports.uploadBackupMetaData = uploadBackupMetaData;
exports.restore = restore;

            //'    s:author < ???? > ;\n' + // To be decided whether to use s:author or s:creator
            //'    s:comment " ???? " ;\n' +
            //'    s:creator < ???? > ;\n' + // To be decided whether to use s:author or s:creator
