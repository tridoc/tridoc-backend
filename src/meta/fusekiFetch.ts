type SparqlJson = {
  head: {
    vars: string[];
  };
  results: {
    bindings: { [key: string]: { type: string; value: string } }[];
  };
};

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
