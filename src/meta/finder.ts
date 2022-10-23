import { Params } from "../helpers/processParams.ts";
import { fusekiFetch } from "./fusekiFetch.ts";

export async function getComments(id: string) {
  const query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX tridoc:  <http://vocab.tridoc.me/>
PREFIX s: <http://schema.org/>
SELECT DISTINCT ?d ?t WHERE {
  GRAPH <http://3doc/meta> {
      <http://3doc/data/${id}> s:comment [
          a s:Comment ;
          s:dateCreated ?d ;
          s:text ?t
      ] .
  }
}`;
  return await fusekiFetch(query).then((json) =>
    json.results.bindings.map((binding) => {
      return { text: binding.t.value, created: binding.d.value };
    })
  );
}

export async function getDocumentList(
  { tags = [], nottags = [], text, limit, offset }: Params,
) {
  let tagQuery = "";
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].type) {
      tagQuery += `{  ?s tridoc:tag ?ptag${i} .
  ?ptag${i} tridoc:parameterizableTag ?atag${i} .
  ?ptag${i} tridoc:value ?v${i} .
  ?atag${i} tridoc:label "${tags[i].label}" .
  ${
        tags[i].min
          ? `FILTER (?v${i} >= "${tags[i].min}"^^<${tags[i].type}> )`
          : ""
      }
  ${
        tags[i].max
          ? `FILTER (?v${i} ${tags[i].maxIsExclusive ? "<" : "<="} "${
            tags[i].max
          }"^^<${tags[i].type}> )`
          : ""
      } }`;
    } else {
      tagQuery += `{  ?s tridoc:tag ?tag${i} .
  ?tag${i} tridoc:label "${tags[i].label}" . }`;
    }
  }
  for (let i = 0; i < nottags.length; i++) {
    if (nottags[i].type) {
      tagQuery += `FILTER NOT EXISTS { ?s tridoc:tag ?ptag${i} .
  ?ptag${i} tridoc:parameterizableTag ?atag${i} .
  ?ptag${i} tridoc:value ?v${i} .
  ?atag${i} tridoc:label "${nottags[i].label}" .
  ${
        nottags[i].min
          ? `FILTER (?v${i} >= "${nottags[i].min}"^^<${nottags[i].type}> )`
          : ""
      }
  ${
        nottags[i].max
          ? `FILTER (?v${i} ${nottags[i].maxIsExclusive ? "<" : "<="} "${
            nottags[i].max
          }"^^<${nottags[i].type}> )`
          : ""
      } }`;
    } else {
      tagQuery += `FILTER NOT EXISTS { ?s tridoc:tag ?tag${i} .
  ?tag${i} tridoc:label "${nottags[i].label}" . }`;
    }
  }
  const body = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
    "PREFIX s: <http://schema.org/>\n" +
    "PREFIX tridoc:  <http://vocab.tridoc.me/>\n" +
    "PREFIX text: <http://jena.apache.org/text#>\n" +
    "SELECT DISTINCT ?s ?identifier ?title ?date\n" +
    "WHERE {\n" +
    "  ?s s:identifier ?identifier .\n" +
    "  ?s s:dateCreated ?date .\n" +
    tagQuery +
    "  OPTIONAL { ?s s:name ?title . }\n" +
    (text
      ? '{ { ?s text:query (s:name "' + text +
        '") } UNION { ?s text:query (s:text "' + text + '")} } .\n'
      : "") +
    "}\n" +
    "ORDER BY desc(?date)\n" +
    (limit ? "LIMIT " + limit + "\n" : "") +
    (offset ? "OFFSET " + offset : "");
  return await fusekiFetch(body).then((json) =>
    json.results.bindings.map((binding) => {
      const result: Record<string, string> = {};
      result.identifier = binding.identifier.value;
      if (binding.title) {
        result.title = binding.title.value;
      }
      if (binding.date) {
        result.created = binding.date.value;
      }
      return result;
    })
  );
}

export async function getDocumentNumber(
  { tags = [], nottags = [], text }: Params,
) {
  let tagQuery = "";
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].type) {
      tagQuery += `{  ?s tridoc:tag ?ptag${i} .
  ?ptag${i} tridoc:parameterizableTag ?atag${i} .
  ?ptag${i} tridoc:value ?v${i} .
  ?atag${i} tridoc:label "${tags[i].label}" .
  ${
        tags[i].min
          ? `FILTER (?v${i} >= "${tags[i].min}"^^<${tags[i].type}> )`
          : ""
      }
  ${
        tags[i].max
          ? `FILTER (?v${i} ${tags[i].maxIsExclusive ? "<" : "<="} "${
            tags[i].max
          }"^^<${tags[i].type}> )`
          : ""
      } }`;
    } else {
      tagQuery += `{  ?s tridoc:tag ?tag${i} .
  ?tag${i} tridoc:label "${tags[i].label}" . }`;
    }
  }
  for (let i = 0; i < nottags.length; i++) {
    if (nottags[i].type) {
      tagQuery += `FILTER NOT EXISTS { ?s tridoc:tag ?ptag${i} .
  ?ptag${i} tridoc:parameterizableTag ?atag${i} .
  ?ptag${i} tridoc:value ?v${i} .
  ?atag${i} tridoc:label "${nottags[i].label}" .
  ${
        nottags[i].min
          ? `FILTER (?v${i} >= "${nottags[i].min}"^^<${nottags[i].type}> )`
          : ""
      }
  ${
        nottags[i].max
          ? `FILTER (?v${i} ${nottags[i].maxIsExclusive ? "<" : "<="} "${
            nottags[i].max
          }"^^<${nottags[i].type}> )`
          : ""
      } }`;
    } else {
      tagQuery += `FILTER NOT EXISTS { ?s tridoc:tag ?tag${i} .
  ?tag${i} tridoc:label "${nottags[i].label}" . }`;
    }
  }
  return await fusekiFetch(`
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX s: <http://schema.org/>
PREFIX tridoc:  <http://vocab.tridoc.me/>
PREFIX text: <http://jena.apache.org/text#>
SELECT (COUNT(DISTINCT ?s) as ?count)
WHERE {
  ?s s:identifier ?identifier .
  ${tagQuery}
  ${
    text
      ? `{ { ?s text:query (s:name "${text}") } UNION { ?s text:query (s:text "${text}")} } .\n`
      : ""
  }}`).then((json) => parseInt(json.results.bindings[0].count.value, 10));
}

export async function getBasicMeta(id: string) {
  return await fusekiFetch(`
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX s: <http://schema.org/>
SELECT ?title ?date
WHERE {
  ?s s:identifier "${id}" .
  ?s s:dateCreated ?date .
  OPTIONAL { ?s s:name ?title . }
}`).then((json) => {
    return {
      title: json.results.bindings[0]?.title?.value,
      created: json.results.bindings[0]?.date?.value,
    };
  });
}

export async function getTagTypes(labels: string[]) {
  const json = await fusekiFetch(`
PREFIX tridoc: <http://vocab.tridoc.me/>
SELECT DISTINCT ?l ?t WHERE { VALUES ?l { "${
    labels.join('" "')
  }" } ?s tridoc:label ?l . OPTIONAL { ?s tridoc:valueType ?t . } }`);
  return json.results.bindings.map(
    (binding) => {
      const result_1 = [];
      result_1[0] = binding.l.value;
      if (binding.t) {
        result_1[1] = binding.t.value;
      }
      return result_1;
    },
  );
}
