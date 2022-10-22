import { VERSION } from "../deps.ts";

export function version(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  return new Promise((resolve) => resolve(new Response(VERSION)));
}
