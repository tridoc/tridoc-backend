import { encode, serve as stdServe } from "../deps.ts";
import { routes } from "./routes.ts";

const isAuthenticated = (request: Request) => {
  return request.headers.get("Authorization") ===
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
      return new Response("401: Not Authenticated", {
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
    return new Response("404: Path not found", { status: 404 });
  } catch (error) {
    console.log(
      (new Date()).toISOString(),
      request.method,
      path,
      "→ 500:",
      error,
    );
    return new Response("500: " + error, { status: 500 });
  }
};

export const serve = () => stdServe(handler, { onListen: undefined });
