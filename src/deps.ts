export const VERSION = "1.6.0-alpha.deno.2";

export { encode } from "https://deno.land/std@0.160.0/encoding/base64.ts";
export { emptyDir, ensureDir } from "https://deno.land/std@0.160.0/fs/mod.ts";
export { serve } from "https://deno.land/std@0.160.0/http/mod.ts";
export { writableStreamFromWriter } from "https://deno.land/std@0.160.0/streams/mod.ts";

export { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";

// IPFS-compatible hashing utilities
export { crypto } from "https://deno.land/std@0.160.0/crypto/mod.ts";
export { encode as encodeBase58 } from "https://deno.land/std@0.160.0/encoding/base58.ts";
