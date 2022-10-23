function escapeLiteral(string: string) {
  return string.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(
    /\r/g,
    "\\r",
  ).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

export function restore(turtleData: string) {
  const statement = `CLEAR GRAPH <http://3doc/meta>;
              INSERT DATA {
                GRAPH <http://3doc/meta> { ${turtleData} }
              }`;
  return fetch("http://fuseki:3030/3DOC/update", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa("admin:pw123"),
      "Content-Type": "application/sparql-update",
    },
    body: statement,
  });
}

export async function storeDocument(
  { id, text, date }: { id: string; text: string; date?: string },
) {
  const created = (date ? new Date(date) : new Date()).toISOString();
  const query = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX s: <http://schema.org/>
INSERT DATA {
  GRAPH <http://3doc/meta> {
    <http://3doc/data/${id}> rdf:type s:DigitalDocument ;
    s:dateCreated "${created}"^^xsd:dateTime ;
    s:identifier "${id}" ;
    s:text "${escapeLiteral(text)}" .
  }
}`;
  return await fetch("http://fuseki:3030/3DOC/update", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa("admin:pw123"),
      "Content-Type": "application/sparql-update",
    },
    body: query,
  }).then((response) => {
    //console.log("Fuseki returned: "+response.status);
    if (response.ok) {
      return response;
    } else {
      throw new Error("Error from Fuseki: " + response.statusText);
    }
  });
}
