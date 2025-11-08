import { crypto, encodeBase58 } from "../deps.ts";

/**
 * Compute IPFS-compatible hash for content using SHA-256.
 *
 * IPFS uses multihash format:
 * - 1 byte: hash function code (0x12 for SHA-256)
 * - 1 byte: digest length (0x20 for 32 bytes)
 * - N bytes: actual hash digest
 *
 * Then encoded with base58btc for content addressing.
 */
export async function computeIPFSHash(content: Uint8Array): Promise<string> {
  // Compute SHA-256 hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", content);
  const hashBytes = new Uint8Array(hashBuffer);

  // Create multihash: [fn_code, digest_size, ...digest]
  const multihash = new Uint8Array(34); // 1 + 1 + 32 bytes
  multihash[0] = 0x12; // SHA-256 function code
  multihash[1] = 0x20; // 32 bytes digest length
  multihash.set(hashBytes, 2);

  // Encode with base58btc (CIDv0 format already includes the "Qm" prefix)
  const base58Hash = encodeBase58(multihash.buffer);

  return base58Hash;
}

/**
 * Compute hash for a file at the given path
 */
export async function computeFileIPFSHash(filePath: string): Promise<string> {
  const content = await Deno.readFile(filePath);
  return computeIPFSHash(content);
}

/**
 * Convert hash to directory structure for IPFS blob storage
 * Uses first 4 chars (e.g., QmAb) as top level to ensure meaningful distribution
 */
export function hashToPath(hash: string): { dir: string; fullPath: string } {
  // Store in blobs/ipfs/ subdirectory using first 4 chars as top level
  const dir = `./blobs/ipfs/${hash.slice(0, 4)}/${hash.slice(4, 8)}/${
    hash.slice(8, 16)
  }`;
  const fullPath = `${dir}/${hash}.pdf`;

  return { dir, fullPath };
}

/**
 * Convert hash to thumbnail path
 */
export function hashToThumbnailPath(
  hash: string,
): { dir: string; fullPath: string } {
  // Store in blobs/thumbs/ subdirectory using same structure as blobs
  const dir = `./blobs/thumbs/${hash.slice(0, 4)}/${hash.slice(4, 8)}/${
    hash.slice(8, 16)
  }`;
  const fullPath = `${dir}/${hash}.png`;

  return { dir, fullPath };
}
