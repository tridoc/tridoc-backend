import { nanoid } from "../deps.ts";
import { respond } from "../helpers/cors.ts";
import { getText } from "../helpers/pdfprocessor.ts";
import { processParams } from "../helpers/processParams.ts";
import { storeBlob, getBlobPath, getThumbnailPath } from "../helpers/blobStore.ts";
import * as metadelete from "../meta/delete.ts";
import * as metafinder from "../meta/finder.ts";
import * as metastore from "../meta/store.ts";

type TagAdd = {
  label: string;
  parameter?: {
    type:
      | "http://www.w3.org/2001/XMLSchema#decimal"
      | "http://www.w3.org/2001/XMLSchema#date";
    value: string; // must be valid xsd:decimal or xsd:date, as specified in property type.
  }; // only for parameterizable tags
};

function _getDir(id: string) {
  return "./blobs/" + id.slice(0, 2) + "/" + id.slice(2, 6) + "/" +
    id.slice(6, 14);
}

function getPath(id: string) {
  return "./blobs/" + id.slice(0, 2) + "/" + id.slice(2, 6) + "/" +
    id.slice(6, 14) + "/" + id;
}

function datecheck(request: Request) {
  const url = new URL(request.url);
  const regex =
    /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-6]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-6]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-6]\d([+-][0-2]\d:[0-5]\d|Z))$/;
  const date = url.searchParams.get("date");
  return date ? (regex.test(date) ? date : undefined) : undefined;
}

export async function deleteDoc(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  await metadelete.deleteFile(id);
  return respond(undefined, { status: 204 });
}

export async function deleteTag(
  _request: Request,
  match: URLPatternResult,
) {
  await metadelete.deleteTag(
    decodeURIComponent(match.pathname.groups.tagLabel!),
    match.pathname.groups.id!,
  );
  return respond(undefined, { status: 204 });
}
export async function deleteTitle(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  await metadelete.deleteTitle(id);
  return respond(undefined, { status: 201 });
}

export async function getComments(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  const response = await metafinder.getComments(id);
  return respond(JSON.stringify(response), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function getPDF(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  const meta = await metafinder.getBasicMeta(id);
  
  // Determine the file path based on whether we have a blob hash or legacy ID
  let path: string;
  if (meta.blob) {
    // New hash-based storage
    path = getBlobPath(meta.blob);
  } else {
    // Legacy nanoid-based storage
    path = getPath(id);
  }
  
  try {
    const fileName = meta.title || meta.created || "document";
    const file = await Deno.open(path, { read: true });
    // Build a readable stream so the file doesn't have to be fully loaded into memory while we send it
    const readableStream = file.readable;
    return respond(readableStream, {
      headers: {
        "content-disposition": `inline; filename="${encodeURI(fileName)}.pdf"`,
        "content-type": "application/pdf",
      },
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return respond("404 Not Found", { status: 404 });
    }
    throw error;
  }
}

export async function getMeta(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  return respond(
    JSON.stringify({
      ...(await metafinder.getBasicMeta(id)),
      comments: await metafinder.getComments(id),
      tags: await metafinder.getTags(id),
    }),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}

export async function getTags(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  return respond(JSON.stringify(await metafinder.getTags(id)), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function getThumb(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  const meta = await metafinder.getBasicMeta(id);
  
  // Determine the file path based on whether we have a blob hash or legacy ID
  let thumbPath: string;
  if (meta.blob) {
    // New hash-based storage
    thumbPath = getThumbnailPath(meta.blob);
  } else {
    // Legacy nanoid-based storage
    thumbPath = getPath(id) + ".png";
  }
  
  const fileName = meta.title || meta.created || "thumbnail";
  let thumb: Deno.FsFile;
  try {
    thumb = await Deno.open(thumbPath, { read: true });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
        try {
          // Get the blob path for thumbnail generation
          let blobPath: string;
          if (meta.blob) {
            blobPath = getBlobPath(meta.blob);
          } else {
            blobPath = getPath(id);
          }
          
          await Deno.stat(blobPath); // Check if PDF exists → 404 otherwise
          const cmd = new Deno.Command("convert", {
            args: ["-thumbnail", "300x", "-alpha", "remove", `${blobPath}[0]`, thumbPath],
          });
          const p = cmd.spawn();
          const status = await p.status;
          if (!status.success) throw new Error("convert failed with code " + status.code);
          thumb = await Deno.open(thumbPath, { read: true });
        } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return respond("404 Not Found", { status: 404 });
        }
        throw error;
      }
    } else {
      throw error;
    }
  }
  // Build a readable stream so the file doesn't have to be fully loaded into memory while we send it
  const readableStream = thumb.readable;
  return respond(readableStream, {
    headers: {
      "content-disposition": `inline; filename="${encodeURI(fileName)}.png"`,
      "content-type": "image/png",
    },
  });
}

export async function getTitle(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  const meta = await metafinder.getBasicMeta(id);
  return respond(JSON.stringify({ title: meta.title ?? null }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function list(
  request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const params = await processParams(request);
  const response = await metafinder.getDocumentList(params);
  return respond(JSON.stringify(response), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function postComment(
  request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  if (!id) return respond("Missing document id in path", { status: 400 });
  const body = await request.json();
  if (!body || typeof body.text !== "string" || body.text.trim() === "") {
    return respond("Missing or invalid 'text' in request body", { status: 400 });
  }
  const text: string = body.text;
  const created = await metastore.addComment(id, text);
  const respBody = JSON.stringify({ text, created });
  return respond(respBody, {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function postPDF(
  request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const id = nanoid(); // Document ID (separate from blob hash)
  
  // Read the content into memory to compute hash and store blob
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();
  if (!reader) {
    return respond("Missing request body", { status: 400 });
  }
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  
  // Combine chunks into a single Uint8Array
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const content = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    content.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Store blob using content hash
  const blobHash = await storeBlob(content);
  const blobPath = getBlobPath(blobHash);
  
  console.log((new Date()).toISOString(), "Document created with id", id, "blob hash", blobHash);
  let text = await getText(blobPath);
  if (text.length < 4) {
    // run OCR
    const lang = Deno.env.get("OCR_LANG") || "fra+deu+eng";
  const cmd = new Deno.Command("pdfsandwich", { args: ["-rgb", "-lang", lang, blobPath] });
  const p = cmd.spawn();
  const status = await p.status;
  if (!status.success) throw new Error("pdfsandwich failed with code " + status.code);
    // pdfsandwich generates a file with the same name + _ocr
    await Deno.rename(blobPath + "_ocr", blobPath);
    text = await getText(blobPath);
    console.log((new Date()).toISOString(), id, ": OCR finished");
  }
  // no await as we don’t care for the result - if it fails, the thumbnail will be created upon request.
  // Fire-and-forget thumbnail generation (non-blocking)
  try {
    const thumbPath = getThumbnailPath(blobHash);
    const cmd = new Deno.Command("convert", {
      args: ["-thumbnail", "300x", "-alpha", "remove", `${blobPath}[0]`, thumbPath],
    });
    cmd.spawn();
  } catch (_) {
    // ignore spawn errors for background thumbnail creation
  }
  const date = datecheck(request);
  await metastore.storeDocumentWithBlob({ id, text, date, blobHash });
  return respond(undefined, {
    headers: {
      "Location": "/doc/" + id,
      "Access-Control-Expose-Headers": "Location",
    },
  });
}

export async function postTag(
  request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  if (!id) return respond("Missing document id in path", { status: 400 });
  const tagObject: TagAdd = await request.json();
  const [label, type] =
    (await metafinder.getTagTypes([tagObject.label]))?.[0] ??
      [undefined, undefined];
  if (!label) {
    return respond("Tag must exist before adding to a document", {
      status: 400,
    });
  }
  if (tagObject.parameter?.type !== type) {
    return respond("Type provided does not match", { status: 400 });
  }
  if (tagObject.parameter?.type && !tagObject.parameter?.value) {
    return respond("No value provided", { status: 400 });
  }
  const created = await metastore.addTag(
    id,
    tagObject.label,
    tagObject.parameter?.value,
    type,
  );
  return respond(JSON.stringify(created), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function putTitle(
  request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id!;
  if (!id) return respond("Missing document id in path", { status: 400 });
  const body = await request.json();
  if (!body || typeof body.title !== "string" || body.title.trim() === "") {
    return respond("Missing or invalid 'title' in request body", { status: 400 });
  }
  const title: string = body.title;
  await metastore.addTitle(id, title);
  return respond(undefined, { status: 201 });
}
