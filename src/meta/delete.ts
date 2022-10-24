import { fusekiUpdate } from "./fusekiFetch.ts";

export async function deleteTag(label: string, id?: string) {
  await fusekiUpdate(`
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX s: <http://schema.org/>
PREFIX tridoc: <http://vocab.tridoc.me/>
WITH <http://3doc/meta>
DELETE {
  ${
    id ? `<http://3doc/data/${id}> tridoc:tag ?ptag + ` : `?ptag ?p ?o .
  ?s ?p1 ?ptag`
  }
}
WHERE {
  ?ptag tridoc:parameterizableTag ?tag.
  ?tag tridoc:label "${label}" .
  OPTIONAL { ?ptag ?p ?o }
  OPTIONAL {
    ${id ? `<http://3doc/data/${id}> tridoc:tag ?ptag` : "?s ?p1 ?ptag"}
  }
}`);
  await fusekiUpdate(`
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX s: <http://schema.org/>
PREFIX tridoc: <http://vocab.tridoc.me/>
WITH <http://3doc/meta>
DELETE {
  ${
    id ? `<http://3doc/data/${id}> tridoc:tag ?tag` : `?tag ?p ?o .
  ?s ?p1 ?tag`
  }
}
WHERE {
  ?tag tridoc:label "${label}" .
  OPTIONAL { ?tag ?p ?o }
  OPTIONAL {
    ${id ? `<http://3doc/data/${id}> ?p1 ?tag` : "?s ?p1 ?tag"}
  }
}`);
}

export function deleteFile(id: string) {
  return fusekiUpdate(`
WITH <http://3doc/meta>
DELETE { <http://3doc/data/${id}> ?p ?o }
WHERE { <http://3doc/data/${id}> ?p ?o }`);
}
