import { respond } from "../helpers/cors.ts";

export function options(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  return new Promise((resolve) =>
    resolve(
      respond(undefined, { status: 204 }),
    )
  );
}
