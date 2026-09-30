import { ensureDir } from "https://deno.land/std@0.160.0/fs/ensure_dir.ts";
import { emptyDir, writableStreamFromWriter } from "../deps.ts";
import { respond } from "../helpers/cors.ts";
import { dump } from "../meta/fusekiFetch.ts";
import { setGraph } from "../meta/store.ts";

const decoder = new TextDecoder("utf-8");

async function removeIfExists(path: string) {
  try {
    await Deno.remove(path);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}

/**
 * Opens a generated archive for streaming and removes it from the file system
 * right away. The open file handle keeps the data readable until the response
 * stream is closed, at which point the disk space is released, so the archives
 * don't pile up in the blobs directory.
 */
async function openAndUnlink(
  path: string,
): Promise<ReadableStream<Uint8Array>> {
  const file = await Deno.open(path);
  try {
    await Deno.remove(path);
  } catch (error) {
    file.close();
    throw error;
  }
  // Stream the file so it doesn't have to be fully loaded into memory
  return file.readable;
}

export async function deleteRDFFile(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  await Deno.remove("rdf.ttl");
  return respond(undefined, { status: 204 });
}

export async function getRDF(
  request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const url = new URL(request.url);
  const accept = url.searchParams.has("accept")
    ? decodeURIComponent(url.searchParams.get("accept")!)
    : request.headers.get("Accept") || "text/turtle";
  return await dump(accept);
}

export async function getTGZ(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const timestamp = "" + Date.now();
  const tarPath = "blobs/tgz-" + timestamp;
  const rdfName = "rdf-" + timestamp;
  const rdfPath = "blobs/rdf/" + rdfName;
  await ensureDir("blobs/rdf");
  const rdf = await Deno.open(rdfPath, {
    create: true,
    write: true,
    truncate: true,
  });
  try {
    const writableStream = writableStreamFromWriter(rdf);
    await (await dump()).body?.pipeTo(writableStream);
    const cmd = new Deno.Command("bash", {
      args: [
        "-c",
        `tar --transform="s|${rdfPath}|rdf.ttl|" --exclude-tag="${rdfName}" -czvf ${tarPath} blobs/*/`,
      ],
    });
    const p = cmd.spawn();
    const status = await p.status;
    if (!status.success) {
      throw new Error("tar -czf failed with code " + status.code);
    }
  } catch (error) {
    await removeIfExists(tarPath);
    throw error;
  } finally {
    await removeIfExists(rdfPath);
  }
  return respond(await openAndUnlink(tarPath), {
    headers: {
      "content-disposition":
        `inline; filename="tridoc_backup_${timestamp}.tar.gz"`,
      "content-type": "application/gzip",
    },
  });
}

export async function getZIP(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const timestamp = "" + Date.now();
  const zipPath = `blobs/zip-${timestamp}.zip`;
  const rdfPath = "blobs/rdf-" + timestamp;
  const rdf = await Deno.open(rdfPath, {
    create: true,
    write: true,
    truncate: true,
  });
  try {
    const writableStream = writableStreamFromWriter(rdf);
    await (await dump()).body?.pipeTo(writableStream);
    // Create zip
    const cmd1 = new Deno.Command("bash", {
      args: ["-c", `zip -r ${zipPath} blobs/*/ ${rdfPath} -x "blobs/rdf/*"`],
    });
    const p_1 = cmd1.spawn();
    const r_1 = await p_1.status;
    if (!r_1.success) throw new Error("zip failed with code " + r_1.code);
    // move rdf-??? to rdf.zip
    const cmd2 = new Deno.Command("bash", {
      args: [
        "-c",
        `printf "@ ${rdfPath}\n@=rdf.ttl\n" | zipnote -w ${zipPath}`,
      ],
    });
    const p_2 = cmd2.spawn();
    const r_2 = await p_2.status;
    if (!r_2.success) throw new Error("zipnote failed with code " + r_2.code);
  } catch (error) {
    await removeIfExists(zipPath);
    throw error;
  } finally {
    await removeIfExists(rdfPath);
  }
  return respond(await openAndUnlink(zipPath), {
    headers: {
      "content-disposition":
        `inline; filename="tridoc_backup_${timestamp}.zip"`,
      "content-type": "application/zip",
    },
  });
}

export async function putZIP(
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
  const cmd = new Deno.Command("unzip", { args: [zipPath] });
  const p = cmd.spawn();
  const status = await p.status;
  if (!status.success) throw new Error("unzip failed with code " + status.code);
  await Deno.remove(zipPath);
  const turtleData = decoder.decode(await Deno.readFile("rdf.ttl"));
  await Deno.remove("rdf.ttl");
  await setGraph(turtleData, "text/turtle");
  return respond(undefined, { status: 204 });
}

export async function putRDF(
  request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  // Replace the entire metadata graph with the provided RDF payload.
  const contentType = request.headers.get("content-type")?.toLowerCase();
  const body = await request.text();
  if (!body || body.trim() === "") {
    return respond("Empty request body", { status: 400 });
  }

  await setGraph(body, contentType);
  return respond(undefined, { status: 204 });
}
