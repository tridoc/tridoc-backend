import { ensureDir } from "https://deno.land/std@0.160.0/fs/ensure_dir.ts";
import { emptyDir, writableStreamFromWriter } from "../deps.ts";
import { respond } from "../helpers/cors.ts";
import { dump } from "../meta/fusekiFetch.ts";
import { restore } from "../meta/store.ts";

const decoder = new TextDecoder("utf-8");

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
  const writableStream = writableStreamFromWriter(rdf);
  await (await dump()).body?.pipeTo(writableStream);
  /* const p = Deno.run({
    cmd: [
      "tar",
      `--transform=s|${rdfPath}|rdf.ttl|`,
      `--exclude-tag=${rdfName}`,
      "-czvf",
      tarPath,
      "blobs/* /", // no space!
    ],
  }); */
  const p = Deno.run({
    cmd: [
      "bash",
      "-c",
      `tar --transform="s|${rdfPath}|rdf.ttl|" --exclude-tag="${rdfName}" -czvf ${tarPath} blobs/*/`,
    ],
  });
  const { success, code } = await p.status();
  if (!success) throw new Error("tar -czf failed with code " + code);
  await Deno.remove(rdfPath);
  const tar = await Deno.open(tarPath);
  // Build a readable stream so the file doesn't have to be fully loaded into memory while we send it
  const readableStream = tar.readable;
  return respond(readableStream, {
    headers: {
      "content-disposition":
        `inline; filename="tridoc_backup_${timestamp}.tar.gz"`,
      "content-type": "application/gzip",
    },
  });
  // TODO: Figure out how to delete these files
}

export async function getZIP(
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
  const writableStream = writableStreamFromWriter(rdf);
  await (await dump()).body?.pipeTo(writableStream);
  /* const p = Deno.run({
    cmd: [
      "tar",
      `--transform=s|${rdfPath}|rdf.ttl|`,
      `--exclude-tag=${rdfName}`,
      "-czvf",
      tarPath,
      "blobs/* /", // no space!
    ],
  }); */
  const p = Deno.run({
    cmd: [
      "bash",
      "-c",
      `tar --transform="s|${rdfPath}|rdf.ttl|" --exclude-tag="${rdfName}" -czvf ${tarPath} blobs/*/`,
    ],
  });
  const { success, code } = await p.status();
  if (!success) throw new Error("tar -czf failed with code " + code);
  await Deno.remove(rdfPath);
  const tar = await Deno.open(tarPath);
  // Build a readable stream so the file doesn't have to be fully loaded into memory while we send it
  const readableStream = tar.readable;
  return respond(readableStream, {
    headers: {
      "content-disposition":
        `inline; filename="tridoc_backup_${timestamp}.tar.gz"`,
      "content-type": "application/gzip",
    },
  });
  // TODO: Figure out how to delete these files
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
  const p = Deno.run({ cmd: ["unzip", zipPath] });
  const { success, code } = await p.status();
  if (!success) throw new Error("unzip failed with code " + code);
  await Deno.remove(zipPath);
  const turtleData = decoder.decode(await Deno.readFile("rdf.ttl"));
  await Deno.remove("rdf.ttl");
  await restore(turtleData);
  return respond(undefined, { status: 204 });
}
