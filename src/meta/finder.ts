export async function getTagTypes(labels: string[]): Promise<string[]> {
  const response = await fetch("http://fuseki:3030/3DOC/query", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa("admin:pw123"),
      "Content-Type": "application/sparql-query",
    },
    body: `PREFIX tridoc: <http://vocab.tridoc.me/>
SELECT DISTINCT ?l ?t WHERE { VALUES ?l { "${
      labels.join('" "')
    }" } ?s tridoc:label ?l . OPTIONAL { ?s tridoc:valueType ?t . } }`,
  });
  const json = await response.json();
  return json.results.bindings.map(
    (binding: Record<string, { value: string }>) => {
      const result_1 = [];
      result_1[0] = binding.l.value;
      if (binding.t) {
        result_1[1] = binding.t.value;
      }
      return result_1;
    },
  );
}
