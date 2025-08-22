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
  const tmpDir = await Deno.makeTempDir({ prefix: "orphaned-" });
  const tarPath = `${tmpDir}/orphaned-tgz-${ts}.tar.gz`;
  // Use tar -T to read file list and preserve file metadata. Create archive in tmp dir
  const cmd = new Deno.Command("bash", {
    args: ["-c", `tar -C blobs -czf ${tarPath} -T ${fileList}`],
  });
  const p = cmd.spawn();
  const status = await p.status;
  // Remove the temporary file list regardless of tar success
  await Deno.remove(fileList);
  if (!status.success) {
    // cleanup tmp dir if tar failed
    try {
      await Deno.remove(tmpDir, { recursive: true });
    } catch (_e) {
      // ignore
    }
    throw new Error("tar failed with code " + status.code);
  }
  const f = await Deno.open(tarPath, { read: true });
  // unlink the archive so it doesn't linger on disk; fd remains readable on POSIX systems
  try {
    await Deno.remove(tarPath);
    // remove the temporary directory now that the file is unlinked
    await Deno.remove(tmpDir, { recursive: true });
  } catch (_e) {
    // ignore cleanup errors
  }
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
  const tmpDir = await Deno.makeTempDir({ prefix: "orphaned-" });
  const zipPath = `${tmpDir}/orphaned-zip-${ts}.zip`;
  // Use zip reading file list from stdin to avoid copying and preserve metadata where possible
  const cmd = new Deno.Command("bash", {
    args: ["-c", `cd blobs && xargs -a ${fileList} zip -@ ${zipPath}`],
  });
  const p = cmd.spawn();
  const status = await p.status;
  // Remove the temporary file list regardless of zip success
  await Deno.remove(fileList);
  if (!status.success) {
    try {
      await Deno.remove(tmpDir, { recursive: true });
    } catch (_e) {
      // ignore
    }
    throw new Error("zip failed with code " + status.code);
  }
  const f = await Deno.open(zipPath, { read: true });
  // unlink the archive so it doesn't linger on disk; fd remains readable on POSIX systems
  try {
    await Deno.remove(zipPath);
    await Deno.remove(tmpDir, { recursive: true });
  } catch (_e) {
    // ignore cleanup errors
  }
  const readableStream = f.readable;
  return respond(readableStream, {
    headers: {
      "content-disposition": `inline; filename="tridoc_orphaned_${ts}.zip"`,
      "content-type": "application/zip",
    },
  });
}
