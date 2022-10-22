export function respond(body?: BodyInit, init?: ResponseInit) {
  return new Response(body, {
    ...init,
    headers: {
      ...init?.headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, PUT, DELETE, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization",
    },
  });
}
