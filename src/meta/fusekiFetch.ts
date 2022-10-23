type SparqlJson = {
  head: {
    vars: string[];
  };
  results: {
    bindings: { [key: string]: { type: string; value: string } }[];
  };
};

export function dump(accept = "text/turtle") {
  const query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }";
  console.log((new Date()).toISOString(), "→ FUSEKI QUERY", query, "\n");
  return fetch("http://fuseki:3030/3DOC/query", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa("admin:pw123"),
      "Content-Type": "application/sparql-query",
      "Accept": accept,
    },
    body: query,
  });
}

export async function fusekiFetch(query: string): Promise<SparqlJson> {
  console.log((new Date()).toISOString(), "→ FUSEKI QUERY", query, "\n");
  return await fetch("http://fuseki:3030/3DOC/query", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa("admin:pw123"),
      "Content-Type": "application/sparql-query",
    },
    body: query,
  }).then(async (response) => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error("Fuseki Error: " + await response.text());
    }
  });
}

export async function fusekiUpdate(query: string): Promise<void> {
  console.log((new Date()).toISOString(), "→ FUSEKI UPDATE", query, "\n");
  return await fetch("http://fuseki:3030/3DOC/update", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa("admin:pw123"),
      "Content-Type": "application/sparql-update",
    },
    body: query,
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error("Fuseki Error: " + await response.text());
    }
  });
}
