import { fusekiUpdate } from "./fusekiFetch.ts";

export function deleteFile(id: string) {
  return fusekiUpdate(`
WITH <http://3doc/meta>
DELETE { <http://3doc/data/${id}> ?p ?o }
WHERE { <http://3doc/data/${id}> ?p ?o }`);
}
