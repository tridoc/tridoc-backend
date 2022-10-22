import { VERSION } from "../deps.ts";

export function version(
  _request: Request,
  _match: URLPatternResult,
): Response {
  return new Response(VERSION);
}
