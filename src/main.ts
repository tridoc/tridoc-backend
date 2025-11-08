import { serve } from "./server/server.ts";

console.log("Starting tridoc backend server");

// TODO Check external dependencies

if (!Deno.env.get("TRIDOC_PWD")) {
  throw new Error("No password set");
}

serve();
console.log("Tridoc backend server is listening on port 8000");
