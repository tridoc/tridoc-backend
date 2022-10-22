export function notImplemented (_request: Request, _match: URLPatternResult): Response {
  throw new Error("not implemented");
}
