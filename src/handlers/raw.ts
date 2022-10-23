import { emptyDir, writableStreamFromWriter } from "../deps.ts";
import { respond } from "../helpers/cors.ts";
import { restore } from "../meta/store.ts";

const decoder = new TextDecoder("utf-8");

export async function deleteRdfFile(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  await Deno.remove("rdf.ttl");
  return respond("200: OK");
}

export async function putZip(
  request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  try {
    await Deno.stat("rdf.ttl");
    throw new Error(
      "Can't unzip concurrently: rdf.ttl already exists. If you know what you are doing, clear this message with HTTP DELETE /raw/rdf",
    );
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  await emptyDir("blobs");
  const zipPath = "blobs/zip-" + Date.now();
  const zip = await Deno.open(zipPath, { write: true, create: true });
  const writableStream = writableStreamFromWriter(zip);
  await request.body?.pipeTo(writableStream);
  const p = Deno.run({ cmd: ["unzip", zipPath] });
  const { success, code } = await p.status();
  if (!success) throw new Error("unzip failed with code " + code);
  await Deno.remove(zipPath);
  const turtleData = decoder.decode(await Deno.readFile("rdf.ttl"));
  await Deno.remove("rdf.ttl");
  await restore(turtleData);
  return respond("200: OK");
}
