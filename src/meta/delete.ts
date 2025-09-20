import { fusekiUpdate } from "./fusekiFetch.ts";

export function deleteFile(id: string) {
  return fusekiUpdate(`
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX s: <http://schema.org/>
PREFIX tridoc: <http://vocab.tridoc.me/>
DELETE {
  GRAPH <http://3doc/meta> { <http://3doc/data/${id}> ?p ?o }
}
WHERE {
  GRAPH <http://3doc/meta> { <http://3doc/data/${id}> ?p ?o }
}`);
}

export async function deleteTag(label: string, id?: string) {
  await Promise.allSettled([
    fusekiUpdate(`
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX s: <http://schema.org/>
PREFIX tridoc: <http://vocab.tridoc.me/>
DELETE {
  GRAPH <http://3doc/meta> {
    ${
      id ? `<http://3doc/data/${id}> tridoc:tag ?ptag` : `?ptag ?p ?o .
    ?s ?p1 ?ptag`
    }
  }
}
WHERE {
  GRAPH <http://3doc/meta> {
    ?ptag tridoc:parameterizableTag ?tag.
    ?tag tridoc:label "${label}" .
    OPTIONAL { ?ptag ?p ?o }
    OPTIONAL {
      ${id ? `<http://3doc/data/${id}> tridoc:tag ?ptag` : "?s ?p1 ?ptag"}
    }
  }
}`),
    fusekiUpdate(`
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX s: <http://schema.org/>
PREFIX tridoc: <http://vocab.tridoc.me/>
DELETE {
  GRAPH <http://3doc/meta> {
    ${
      id ? `<http://3doc/data/${id}> tridoc:tag ?tag` : `?tag ?p ?o .
    ?s ?p1 ?tag`
    }
  }
}
WHERE {
  GRAPH <http://3doc/meta> {
    ?tag tridoc:label "${label}" .
    OPTIONAL { ?tag ?p ?o }
    OPTIONAL {
      ${id ? `<http://3doc/data/${id}> ?p1 ?tag` : "?s ?p1 ?tag"}
    }
  }
}`),
  ]);
}

export function deleteTitle(id: string) {
  return fusekiUpdate(`
PREFIX s: <http://schema.org/>
DELETE {
  GRAPH <http://3doc/meta> { <http://3doc/data/${id}> s:name ?o }
}
WHERE {
  GRAPH <http://3doc/meta> { <http://3doc/data/${id}> s:name ?o }
}`);
}
