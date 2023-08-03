export function notImplemented(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  throw new Error("not implemented");
}
