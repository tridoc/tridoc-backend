import { ensureDir } from "https://deno.land/std@0.160.0/fs/ensure_dir.ts";
import { nanoid, writableStreamFromWriter } from "../deps.ts";
import { respond } from "../helpers/cors.ts";
import { getText } from "../helpers/pdfprocessor.ts";
import { processParams } from "../helpers/processParams.ts";
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

function getDir(id: string) {
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
  const id = match.pathname.groups.id;
  await metadelete.deleteFile(id);
  return respond(undefined, { status: 204 });
}

export async function deleteTag(
  _request: Request,
  match: URLPatternResult,
) {
  await metadelete.deleteTag(
    decodeURIComponent(match.pathname.groups.tagLabel),
    match.pathname.groups.id,
  );
  return respond(undefined, { status: 204 });
}
export async function deleteTitle(
  request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id;
  await metadelete.deleteTitle(id);
  return respond(undefined, { status: 201 });
}

export async function getComments(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id;
  const response = await metafinder.getComments(id);
  return respond(JSON.stringify(response));
}

export async function getPDF(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id;
  const path = getPath(id);
  try {
    const fileName = await metafinder.getBasicMeta(id).then((
      { title, created },
    ) => title || created || "document");
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
  const id = match.pathname.groups.id;
  return respond(
    JSON.stringify({
      ...(await metafinder.getBasicMeta(id)),
      comments: await metafinder.getComments(id),
      tags: await metafinder.getTags(id),
    }),
  );
}

export async function getTags(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id;
  return respond(JSON.stringify(await metafinder.getTags(id)));
}

export async function getThumb(
  _request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id;
  const path = getPath(id);
  const fileName = await metafinder.getBasicMeta(id).then((
    { title, created },
  ) => title || created || "thumbnail");
  let thumb: Deno.FsFile;
  try {
    thumb = await Deno.open(path + ".png", { read: true });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      try {
        await Deno.stat(path); // Check if PDF exists → 404 otherwise
        const p = Deno.run({
          cmd: [
            "convert",
            "-thumbnail",
            "300x",
            "-alpha",
            "remove",
            `${path}[0]`,
            `${path}.png`,
          ],
        });
        const { success, code } = await p.status();
        if (!success) throw new Error("convert failed with code " + code);
        thumb = await Deno.open(path + ".png", { read: true });
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
  const id = match.pathname.groups.id;
  return respond(
    JSON.stringify({ title: (await metafinder.getBasicMeta(id)).title }),
  );
}

export async function list(
  request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const params = await processParams(request);
  const response = await metafinder.getDocumentList(params);
  return respond(JSON.stringify(response));
}

export async function postComment(
  request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id;
  await metastore.addComment(id, (await request.json()).text);
  return respond(undefined, { status: 201 });
}

export async function postPDF(
  request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const id = nanoid();
  const path = getPath(id);
  await ensureDir(getDir(id));
  const pdf = await Deno.open(path, { write: true, create: true });
  const writableStream = writableStreamFromWriter(pdf);
  await request.body?.pipeTo(writableStream);
  console.log((new Date()).toISOString(), "Document created with id", id);
  let text = await getText(path);
  if (text.length < 4) {
    // run OCR
    const lang = Deno.env.get("OCR_LANG") || "fra+deu+eng";
    const p = Deno.run({ cmd: ["pdfsandwich", "-rgb", "-lang", lang, path] });
    const { success, code } = await p.status();
    if (!success) throw new Error("pdfsandwich failed with code " + code);
    // pdfsandwich generates a file with the same name + _ocr
    await Deno.rename(path + "_ocr", path);
    text = await getText(path);
    console.log((new Date()).toISOString(), id, ": OCR finished");
  }
  // no await as we don’t care for the result - if it fails, the thumbnail will be created upon request.
  Deno.run({
    cmd: [
      "convert",
      "-thumbnail",
      "300x",
      "-alpha",
      "remove",
      `${path}[0]`,
      `${path}.png`,
    ],
  });
  const date = datecheck(request);
  await metastore.storeDocument({ id, text, date });
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
  const id = match.pathname.groups.id;
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
  await metastore.addTag(id, tagObject.label, tagObject.parameter?.value, type);
  return respond(undefined, { status: 201 });
}

export async function putTitle(
  request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const id = match.pathname.groups.id;
  const title: string = (await request.json())?.title;
  await metastore.addTitle(id, title);
  return respond(undefined, { status: 201 });
}
