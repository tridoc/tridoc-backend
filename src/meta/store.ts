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
