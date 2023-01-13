import { encode, serve as stdServe } from "../deps.ts";
import { respond } from "../helpers/cors.ts";
import { routes } from "./routes.ts";

const isAuthenticated = (request: Request) => {
  return (request.method === "OPTIONS") ||
    request.headers.get("Authorization") ===
      "Basic " + encode("tridoc:" + Deno.env.get("TRIDOC_PWD"));
};

const handler = async (request: Request): Promise<Response> => {
  const path = request.url.slice(request.url.indexOf("/", "https://".length));
  console.log((new Date()).toISOString(), request.method, path);
  try {
    if (!isAuthenticated(request)) {
      console.log(
        (new Date()).toISOString(),
        request.method,
        path,
        "→ 401: Not Authenticated",
      );
      return respond("401 Not Authenticated", {
        status: 401,
        headers: { "WWW-Authenticate": "Basic" },
      });
    }

    const route = routes[request.method]?.find(({ pattern }) =>
      pattern.test(request.url)
    );
    if (route) {
      return await route.handler(request, route.pattern.exec(request.url)!);
    }

    console.log(
      (new Date()).toISOString(),
      request.method,
      path,
      "→ 404: Path not found",
    );
    return respond("404 Path not found", { status: 404 });
  } catch (error) {
    let message;
    if (error instanceof Deno.errors.PermissionDenied) {
      message = "Got “Permission Denied” trying to access the file on disk.\n\n    Please run ```docker exec -u 0 [name of backend-container] chmod -R a+r ./blobs/ rdf.ttl``` on the host server to fix this and similar issues for the future."
    }
    console.log(
      (new Date()).toISOString(),
      request.method,
      path,
      "→ 500: ",
      error,
    );
    return respond("500 " + (message || error), { status: 500 });
  }
};

export const serve = () => stdServe(handler, { onListen: undefined });
