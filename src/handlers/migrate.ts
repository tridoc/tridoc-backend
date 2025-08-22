import { respond } from "../helpers/cors.ts";
import { computeFileIPFSHash, hashToPath, hashToThumbnailPath } from "../helpers/ipfsHash.ts";
import { fusekiFetch, fusekiUpdate } from "../meta/fusekiFetch.ts";
import { ensureDir } from "../deps.ts";

interface MigrationStatus {
  processed: number;
  migrated: number;
  skipped: number;
  errors: string[];
  duplicatesFound: number;
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
    duplicatesFound: 0
  };

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
        const { dir: thumbDir, fullPath: thumbPath } = hashToThumbnailPath(blobHash);
        
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
        
        status.migrated++;
        console.log(`Migrated document ${identifier} -> blob ${blobHash}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        status.errors.push(`Failed to migrate ${identifier}: ${errorMessage}`);
        console.error(`Migration error for ${identifier}:`, error);
      }
    }

    console.log(`Migration completed: ${status.migrated}/${status.processed} files migrated`);
    console.log(`Found ${status.duplicatesFound} duplicate files (content deduplication)`);
    
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
async function getLegacyBlobFiles(): Promise<Array<{ identifier: string; legacyPath: string }>> {
  const results: Array<{ identifier: string; legacyPath: string }> = [];
  
  async function walkLegacyBlobs(dir: string, depth = 0) {
    try {
      for await (const entry of Deno.readDir(dir)) {
        const path = `${dir}/${entry.name}`;
        
        // Skip the new ipfs and thumbs directories
        if (depth === 0 && (entry.name === "ipfs" || entry.name === "thumbs")) {
          continue;
        }
        
        if (entry.isDirectory && depth < 3) {
          // Continue walking directory structure (blobs/xx/xxxx/xxxxxxxx/)
          await walkLegacyBlobs(path, depth + 1);
        } else if (entry.isFile && depth === 3 && !entry.name.endsWith('.png')) {
          // This is a legacy blob file (not a thumbnail)
          const identifier = entry.name;
          results.push({ identifier, legacyPath: path });
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
    console.log(`Document ${docId} not found in metadata, skipping blob reference update`);
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
