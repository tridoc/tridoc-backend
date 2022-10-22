import { respond } from "../helpers/cors.ts";
import { processParams } from "../helpers/processParams.ts";
import { getDocumentList } from "../meta/finder.ts";

function getPath(id: string) {
  return "./blobs/" + id.slice(0, 2) + "/" + id.slice(2, 6) + "/" +
    id.slice(6, 14) + "/" + id;
}

export async function getPDF(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id;
  const path = getPath(id);
  try {
    const file = await Deno.open(path, { read: true });
    // Build a readable stream so the file doesn't have to be fully loaded into memory while we send it
    const readableStream = file.readable;
    return respond(readableStream);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      return respond("404 Not Found", { status: 404 });
    }
    throw error;
  }
}

export async function list(
  request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const params = await processParams(request);
  const response = await getDocumentList(params);
  return respond(JSON.stringify(response));
}
