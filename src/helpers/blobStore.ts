import { ensureDir } from "../deps.ts";
import { computeIPFSHash, hashToPath, hashToThumbnailPath } from "./ipfsHash.ts";

/**
 * Store a blob using content-based IPFS hash as identifier.
 * Returns the hash-based ID.
 */
export async function storeBlob(content: Uint8Array): Promise<string> {
  // Compute content hash
  const hash = await computeIPFSHash(content);
  
  // Get storage path in ipfs subdirectory
  const { dir, fullPath } = hashToPath(hash);
  
  // Check if blob already exists (deduplication)
  try {
    await Deno.stat(fullPath);
    console.log(`Blob ${hash} already exists, skipping storage`);
    return hash;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  
  // Create directory and store blob
  await ensureDir(dir);
  await Deno.writeFile(fullPath, content);
  
  console.log(`Stored new blob: ${hash}`);
  return hash;
}

/**
 * Check if a blob exists by hash
 */
export async function blobExists(hash: string): Promise<boolean> {
  const { fullPath } = hashToPath(hash);
  try {
    await Deno.stat(fullPath);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

/**
 * Get the file path for a blob hash
 */
export function getBlobPath(hash: string): string {
  return hashToPath(hash).fullPath;
}

/**
 * Get the directory path for a blob hash
 */
export function getBlobDir(hash: string): string {
  return hashToPath(hash).dir;
}

/**
 * Store thumbnail for a blob
 */
export async function storeThumbnail(hash: string, thumbnailContent: Uint8Array): Promise<void> {
  const { dir, fullPath } = hashToThumbnailPath(hash);
  
  await ensureDir(dir);
  await Deno.writeFile(fullPath, thumbnailContent);
  
  console.log(`Stored thumbnail for blob: ${hash}`);
}

/**
 * Get thumbnail path for a blob hash
 */
export function getThumbnailPath(hash: string): string {
  return hashToThumbnailPath(hash).fullPath;
}
