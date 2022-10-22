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
