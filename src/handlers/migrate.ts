import { respond } from "../helpers/cors.ts";
import {
  computeFileIPFSHash,
  hashToPath,
  hashToThumbnailPath,
} from "../helpers/ipfsHash.ts";
import { fusekiFetch, fusekiUpdate } from "../meta/fusekiFetch.ts";
import { ensureDir } from "../deps.ts";

interface MigrationStatus {
  processed: number;
  migrated: number;
  skipped: number;
  errors: string[];
  duplicatesFound: number;
  filesRemoved: number;
  directoriesRemoved: number;
}

/**
 * Migrate existing blob storage from nanoid-based to hash-based IDs
 * Uses filesystem-driven approach: everything not in blobs/ipfs/ needs migration
 */
export async function migrateBlobs(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const status: MigrationStatus = {
    processed: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
    duplicatesFound: 0,
    filesRemoved: 0,
    directoriesRemoved: 0,
  };

  const successfullyMigrated: Array<
    { identifier: string; legacyPath: string }
  > = [];

  try {
    // Get all legacy blob files (filesystem-driven approach)
    const legacyBlobs = await getLegacyBlobFiles();
    console.log(`Found ${legacyBlobs.length} legacy blob files to migrate`);

    for (const { identifier, legacyPath } of legacyBlobs) {
      status.processed++;
      try {
        // Compute hash for the existing blob
        const blobHash = await computeFileIPFSHash(legacyPath);

        // Check if hash-based blob already exists
        const { dir: newDir, fullPath: newPath } = hashToPath(blobHash);
        const { dir: thumbDir, fullPath: thumbPath } = hashToThumbnailPath(
          blobHash,
        );

        let blobExists = false;
        try {
          await Deno.stat(newPath);
          blobExists = true;
          status.duplicatesFound++;
        } catch (error) {
          if (!(error instanceof Deno.errors.NotFound)) {
            throw error;
          }
        }

        // Copy to hash-based location if it doesn't exist
        if (!blobExists) {
          await ensureDir(newDir);
          await Deno.copyFile(legacyPath, newPath);
          console.log(`Copied blob: ${legacyPath} -> ${newPath}`);
        }

        // Handle thumbnail migration
        const legacyThumbPath = legacyPath + ".png";
        try {
          await Deno.stat(legacyThumbPath);

          // Copy thumbnail to new thumbs directory
          let thumbExists = false;
          try {
            await Deno.stat(thumbPath);
            thumbExists = true;
          } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) {
              throw error;
            }
          }

          if (!thumbExists) {
            await ensureDir(thumbDir);
            await Deno.copyFile(legacyThumbPath, thumbPath);
            console.log(`Copied thumbnail: ${legacyThumbPath} -> ${thumbPath}`);
          }
        } catch (error) {
          if (!(error instanceof Deno.errors.NotFound)) {
            throw error;
          }
          // Thumbnail doesn't exist, that's fine
        }

        // Update metadata to include blob reference (if document exists in metadata)
        await addBlobReferenceToDocument(identifier, blobHash);

        // Track successful migration for cleanup
        successfullyMigrated.push({ identifier, legacyPath });

        status.migrated++;
        console.log(`Migrated document ${identifier} -> blob ${blobHash}`);
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        status.errors.push(`Failed to migrate ${identifier}: ${errorMessage}`);
        console.error(`Migration error for ${identifier}:`, error);
      }
    }

    // Clean up obsolete files after successful migration
    await cleanupObsoleteFiles(successfullyMigrated, status);

    // Clean up any remaining empty legacy directories
    await cleanupAllEmptyLegacyDirectories(status);

    console.log(
      `Migration completed: ${status.migrated}/${status.processed} files migrated`,
    );
    console.log(
      `Found ${status.duplicatesFound} duplicate files (content deduplication)`,
    );
    console.log(
      `Removed ${status.filesRemoved} obsolete files and ${status.directoriesRemoved} empty directories`,
    );

    return respond(JSON.stringify(status), {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    status.errors.push(`Migration failed: ${errorMessage}`);
    return respond(JSON.stringify(status), {
      status: 500,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });
  }
}

/**
 * Get all legacy blob files (filesystem-driven approach)
 * Returns everything in blobs/ that's not in blobs/ipfs/ or blobs/thumbs/
 */
async function getLegacyBlobFiles(): Promise<
  Array<{ identifier: string; legacyPath: string }>
> {
  const results: Array<{ identifier: string; legacyPath: string }> = [];

  async function walkLegacyBlobs(dir: string, depth = 0) {
    try {
      for await (const entry of Deno.readDir(dir)) {
        const path = `${dir}/${entry.name}`;

        // Skip the new ipfs and thumbs directories at the top level
        if (depth === 0 && (entry.name === "ipfs" || entry.name === "thumbs")) {
          continue;
        }

        if (entry.isDirectory) {
          // Recurse into any subdirectory (no fixed depth limit)
          await walkLegacyBlobs(path, depth + 1);
        } else if (entry.isFile) {
          // Treat any file (except thumbnails) as a legacy blob leaf
          if (!entry.name.endsWith(".png")) {
            const identifier = entry.name;
            results.push({ identifier, legacyPath: path });
          }
        }
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  }

  await walkLegacyBlobs("./blobs");
  return results;
}

async function addBlobReferenceToDocument(docId: string, blobHash: string) {
  // First check if document exists in metadata
  const json = await fusekiFetch(`
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX s: <http://schema.org/>
SELECT ?s WHERE {
  GRAPH <http://3doc/meta> {
    ?s s:identifier "${docId}" .
  }
} LIMIT 1`);

  if (json.results.bindings.length === 0) {
    console.log(
      `Document ${docId} not found in metadata, skipping blob reference update`,
    );
    return;
  }

  // Add blob reference to existing document
  const query = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX s: <http://schema.org/>
PREFIX tridoc: <http://vocab.tridoc.me/>
INSERT DATA {
  GRAPH <http://3doc/meta> {
    <http://3doc/data/${docId}> tridoc:blob "${blobHash}" .
  }
}`;
  return await fusekiUpdate(query);
}

/**
 * Clean up obsolete legacy blob files and thumbnails after successful migration
 */
async function cleanupObsoleteFiles(
  migratedFiles: Array<{ identifier: string; legacyPath: string }>,
  status: MigrationStatus,
) {
  const directoriesToCheck = new Set<string>();

  for (const { legacyPath } of migratedFiles) {
    try {
      // Remove the legacy blob file
      await Deno.remove(legacyPath);
      status.filesRemoved++;
      console.log(`Removed obsolete blob: ${legacyPath}`);

      // Remove the legacy thumbnail if it exists
      const legacyThumbPath = legacyPath + ".png";
      try {
        await Deno.stat(legacyThumbPath);
        await Deno.remove(legacyThumbPath);
        status.filesRemoved++;
        console.log(`Removed obsolete thumbnail: ${legacyThumbPath}`);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
        // Thumbnail doesn't exist, that's fine
      }

      // Track directory for potential cleanup
      let dir = legacyPath.substring(0, legacyPath.lastIndexOf("/"));
      directoriesToCheck.add(dir);

      // Add all parent directories to the check list as well
      while (dir !== "./blobs" && dir.includes("/")) {
        dir = dir.substring(0, dir.lastIndexOf("/"));
        if (dir) {
          directoriesToCheck.add(dir);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      console.error(
        `Failed to remove obsolete file ${legacyPath}: ${errorMessage}`,
      );
      // Don't add to status.errors since this is cleanup, not core migration
    }
  }

  // Clean up empty directories
  await cleanupEmptyDirectories(directoriesToCheck, status);
}

/**
 * Find and clean up all empty legacy directories in the blobs folder
 * excluding the ipfs and thumbs directories
 */
async function cleanupAllEmptyLegacyDirectories(status: MigrationStatus) {
  const legacyDirs = new Set<string>();

  // Function to collect all directories
  async function collectDirectories(dir: string) {
    try {
      // Skip special directories at the top level
      if (dir === "./blobs/ipfs" || dir === "./blobs/thumbs") {
        return;
      }

      for await (const entry of Deno.readDir(dir)) {
        if (entry.isDirectory) {
          const path = `${dir}/${entry.name}`;
          legacyDirs.add(path);
          await collectDirectories(path);
        }
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        console.error(`Error collecting directories in ${dir}:`, error);
      }
    }
  }

  // Start by collecting all directories under blobs/ except ipfs/ and thumbs/
  await collectDirectories("./blobs");

  // Clean up the collected directories
  if (legacyDirs.size > 0) {
    console.log(
      `Found ${legacyDirs.size} potential legacy directories to check`,
    );
    await cleanupEmptyDirectories(legacyDirs, status);
  }
}

/**
 * Remove empty directories from the legacy blob structure
 * Recursively checks and removes empty parent directories
 */
async function cleanupEmptyDirectories(
  directoriesToCheck: Set<string>,
  status: MigrationStatus,
) {
  // Sort directories by depth (deepest first) to ensure proper cleanup order
  const sortedDirs = Array.from(directoriesToCheck).sort((a, b) =>
    b.split("/").length - a.split("/").length
  );

  // Set to track all directories that need to be checked, including parent directories
  const allDirectoriesToCheck = new Set(sortedDirs);

  // Process directories until no more are added to the set
  while (allDirectoriesToCheck.size > 0) {
    // Get the deepest directories first
    const currentDirs = Array.from(allDirectoriesToCheck).sort((a, b) =>
      b.split("/").length - a.split("/").length
    );

    // Clear the set to start fresh
    allDirectoriesToCheck.clear();

    for (const dir of currentDirs) {
      try {
        // Skip if this is the root blobs directory
        if (dir === "./blobs") {
          continue;
        }

        // Check if directory is empty
        const entries = [];
        for await (const entry of Deno.readDir(dir)) {
          entries.push(entry);
          break; // We only need to know if there's at least one entry
        }

        if (entries.length === 0) {
          await Deno.remove(dir);
          status.directoriesRemoved++;
          console.log(`Removed empty directory: ${dir}`);

          // Add parent directory to check in the next iteration
          const parentDir = dir.substring(0, dir.lastIndexOf("/"));
          if (parentDir && parentDir !== "./blobs") {
            allDirectoriesToCheck.add(parentDir);
          }
        }
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          console.error(`Failed to check/remove directory ${dir}:`, error);
        }
      }
    }
  }
}
