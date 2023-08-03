import { VERSION } from "../deps.ts";
import { respond } from "../helpers/cors.ts";

export function version(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  return new Promise((resolve) => resolve(respond(VERSION)));
}
