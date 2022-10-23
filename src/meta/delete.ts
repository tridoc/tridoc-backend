import { fusekiFetch } from "./fusekiFetch.ts";

export function deleteFile(id: string) {
  return fusekiFetch(`
WITH <http://3doc/meta>
DELETE { <http://3doc/data/${id}> ?p ?o }
WHERE { <http://3doc/data/${id}> ?p ?o }`);
}
