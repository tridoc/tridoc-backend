import { respond } from "../helpers/cors.ts";
import * as metafinder from "../meta/finder.ts";

function basename(path: string) {
  return path.replace(/^.*\//, "");
}

async function listAllBlobFiles(): Promise<string[]> {
  const result: string[] = [];
  async function walk(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const p = dir + "/" + entry.name;
      if (entry.isDirectory) {
        // skip the rdf metadata folder
        if (p.endsWith("/rdf")) continue;
        await walk(p);
      } else if (entry.isFile) {
        result.push(p);
      }
    }
  }
  try {
    await walk("blobs");
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return [];
    throw err;
  }
  return result;
}

async function writeFileList(paths: string[]) {
  const tmp = await Deno.makeTempFile({ prefix: "orphaned-filelist-" });
  const content = paths.map((p) => p.replace(/^blobs\//, "")).join("\n") + "\n";
  await Deno.writeTextFile(tmp, content);
  return tmp;
}

export async function getOrphanedTGZ(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const allFiles = await listAllBlobFiles();
  const docs = await metafinder.getDocumentList({});
  const referenced = new Set(docs.map((d: Record<string, string>) => d.identifier));
  const orphaned = allFiles.filter((p) => !referenced.has(basename(p)));
  if (orphaned.length === 0) return respond(undefined, { status: 204 });

  const ts = Date.now();
  const fileList = await writeFileList(orphaned);
  const tarPath = `blobs/orphaned-tgz-${ts}.tar.gz`;
  // Use tar -T to read file list and preserve file metadata
  const cmd = new Deno.Command("bash", {
    args: ["-c", `tar -C blobs -czf ${tarPath} -T ${fileList}`],
  });
  const p = cmd.spawn();
  const status = await p.status;
  await Deno.remove(fileList);
  if (!status.success) throw new Error("tar failed with code " + status.code);
  const f = await Deno.open(tarPath, { read: true });
  const readableStream = f.readable;
  return respond(readableStream, {
    headers: {
      "content-disposition": `inline; filename="tridoc_orphaned_${ts}.tar.gz"`,
      "content-type": "application/gzip",
    },
  });
}

export async function getOrphanedZIP(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const allFiles = await listAllBlobFiles();
  const docs = await metafinder.getDocumentList({});
  const referenced = new Set(docs.map((d: Record<string, string>) => d.identifier));
  const orphaned = allFiles.filter((p) => !referenced.has(basename(p)));
  if (orphaned.length === 0) return respond(undefined, { status: 204 });

  const ts = Date.now();
  const fileList = await writeFileList(orphaned);
  const zipPath = `blobs/orphaned-zip-${ts}.zip`;
  // Use zip reading file list from stdin to avoid copying and preserve metadata where possible
  const cmd = new Deno.Command("bash", {
    args: ["-c", `cd blobs && xargs -a ${fileList} zip -@ ${zipPath}`],
  });
  const p = cmd.spawn();
  const status = await p.status;
  await Deno.remove(fileList);
  if (!status.success) throw new Error("zip failed with code " + status.code);
  const f = await Deno.open(zipPath, { read: true });
  const readableStream = f.readable;
  return respond(readableStream, {
    headers: {
      "content-disposition": `inline; filename="tridoc_orphaned_${ts}.zip"`,
      "content-type": "application/zip",
    },
  });
}
