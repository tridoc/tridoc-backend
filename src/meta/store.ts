import { fusekiUpdate } from "./fusekiFetch.ts";

function escapeLiteral(string: string) {
  return string.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(
    /\r/g,
    "\\r",
  ).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

export async function addComment(id: string, text: string) {
  const now = new Date();
  const query = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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
  return await fusekiUpdate(query);
}

export async function addTag(
  id: string,
  label: string,
  value: string,
  type: string,
) {
  const tag = value
    ? encodeURIComponent(label) + "/" + value
    : encodeURIComponent(label);
  const query = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX tridoc: <http://vocab.tridoc.me/>
PREFIX s: <http://schema.org/>
INSERT DATA {
  GRAPH <http://3doc/meta> {
    <http://3doc/data/${id}> tridoc:tag <http://3doc/tag/${tag}> .${
    value
      ? `
    <http://3doc/tag/${tag}> a tridoc:ParameterizedTag ;
      tridoc:parameterizableTag <http://3doc/tag/${encodeURIComponent(label)}>;
      tridoc:value "${value}"^^<${type}> .`
      : ""
  }
  }
}`;
  return await fusekiUpdate(query);
}

export async function addTitle(id: string, title: string) {
  const query = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX s: <http://schema.org/>
WITH <http://3doc/meta>
DELETE { <http://3doc/data/${id}> s:name ?o }
INSERT { <http://3doc/data/${id}> s:name "${escapeLiteral(title)}" }
WHERE { OPTIONAL { <http://3doc/data/${id}> s:name ?o } }`;
  return await fusekiUpdate(query);
}

export async function createTag(
  label: string,
  type?:
    | "http://www.w3.org/2001/XMLSchema#decimal"
    | "http://www.w3.org/2001/XMLSchema#date",
) {
  const tagType = type ? "ParameterizableTag" : "Tag";
  const valueType = type ? "tridoc:valueType <" + type + ">;\n" : "";
  const query = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX tridoc:  <http://vocab.tridoc.me/>
PREFIX s: <http://schema.org/>
INSERT DATA {
  GRAPH <http://3doc/meta> {
    <http://3doc/tag/${encodeURIComponent(label)}> rdf:type tridoc:${tagType} ;
    ${valueType} tridoc:label "${escapeLiteral(label)}" .
  }
}`;
  return await fusekiUpdate(query);
}

export function restore(turtleData: string) {
  return fusekiUpdate(`
CLEAR GRAPH <http://3doc/meta>;
INSERT DATA {
   GRAPH <http://3doc/meta> { ${turtleData} }
}`);
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
  return await fusekiUpdate(query);
}
