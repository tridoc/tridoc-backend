import { respond } from "../helpers/cors.ts";
import * as metafinder from "../meta/finder.ts";

function basename(path: string) {
  // Return the filename without any directory prefix and without extension.
  // RDF stores the bare hash (no path, no extension), so strip extensions
  // from filesystem names before comparing.
  return path.replace(/^.*\//, "").replace(/\.[^/.]+$/, "");
}

function stripExtension(name: string) {
  return name.replace(/\.[^/.]+$/, "");
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
      } else if (entry.isFile && !entry.name.endsWith('.png')) {
        // Only include non-thumbnail files
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

async function getOrphanedFiles(): Promise<string[]> {
  const allFiles = await listAllBlobFiles();
  const referenced = await metafinder.getReferencedBlobs();
  // Also include legacy document IDs that might still be referenced
  const docs = await metafinder.getDocumentList({});
  docs.forEach((d: Record<string, string>) => referenced.add(d.identifier));

  // RDF stores the bare hash (no path, no extension). Strip extensions from
  // filesystem names and compare directly against the referenced set.
  const orphaned = allFiles.filter((p) => {
    const nameNoExt = stripExtension(basename(p));
    return !referenced.has(nameNoExt);
  });
  
  return orphaned;
}

async function createArchive(
  orphaned: string[],
  format: "zip" | "tgz"
): Promise<{ path: string; tmpDir: string; fileList: string }> {
  const ts = Date.now();
  const fileList = await writeFileList(orphaned);
  const tmpDir = await Deno.makeTempDir({ prefix: "orphaned-" });
  const archivePath = `${tmpDir}/orphaned-${format}-${ts}.${format === "zip" ? "zip" : "tar.gz"}`;
  
  let cmd: Deno.Command;
  
  if (format === "zip") {
    // Use zip with file list - need to use xargs to read from file properly
    cmd = new Deno.Command("bash", {
      args: ["-c", `cd blobs && cat ${fileList} | xargs zip ${archivePath}`],
    });
  } else {
    // Use tar with file list
    cmd = new Deno.Command("bash", {
      args: ["-c", `tar -C blobs -czf ${archivePath} -T ${fileList}`],
    });
  }
  
  const p = cmd.spawn();
  const status = await p.status;
  
  if (!status.success) {
    // Clean up on failure
    try {
      await Deno.remove(fileList);
      await Deno.remove(tmpDir, { recursive: true });
    } catch (_e) {
      // ignore cleanup errors
    }
    throw new Error(`${format} creation failed with code ${status.code}`);
  }
  
  return { path: archivePath, tmpDir, fileList };
}

async function createArchiveResponse(
  format: "zip" | "tgz"
): Promise<Response> {
  const orphaned = await getOrphanedFiles();
  if (orphaned.length === 0) return respond(undefined, { status: 204 });

  const { path: archivePath, tmpDir, fileList } = await createArchive(orphaned, format);
  
  // Remove the temporary file list
  await Deno.remove(fileList);
  
  const f = await Deno.open(archivePath, { read: true });
  
  // unlink the archive so it doesn't linger on disk; fd remains readable on POSIX systems
  try {
    await Deno.remove(archivePath);
    // remove the temporary directory now that the file is unlinked
    await Deno.remove(tmpDir, { recursive: true });
  } catch (_e) {
    // ignore cleanup errors
  }
  
  const readableStream = f.readable;
  const ts = Date.now();
  const extension = format === "zip" ? "zip" : "tar.gz";
  const contentType = format === "zip" ? "application/zip" : "application/gzip";
  
  return respond(readableStream, {
    headers: {
      "content-disposition": `inline; filename="tridoc_orphaned_${ts}.${extension}"`,
      "content-type": contentType,
    },
  });
}

export async function getOrphanedTGZ(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  return await createArchiveResponse("tgz");
}

export async function getOrphanedZIP(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  return await createArchiveResponse("zip");
}
