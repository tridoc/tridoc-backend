import { notImplemented } from "../handlers/notImplemented.ts";

export const routes: {
  [method: string]: {
    pattern: URLPattern;
    handler: (request: Request, match: URLPatternResult) => Response;
  }[];
} = {
  "GET": [{
    pattern: new URLPattern({ pathname: "/count" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/comment" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/tag" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/thumb" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/title" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/meta" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/raw/rdf" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/raw/zip" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/raw/tgz" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/tag" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/tag/:tagLabel" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/version" }),
    handler: notImplemented,
  }],
  "POST": [{
    pattern: new URLPattern({ pathname: "/doc" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/comment" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/tag" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/tag" }),
    handler: notImplemented,
  }],
  "PUT": [{
    pattern: new URLPattern({ pathname: "/doc/:id/title" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/raw/zip" }),
    handler: notImplemented,
  }],
  "DELETE": [{
    pattern: new URLPattern({ pathname: "/doc/:id" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/tag/:tagLabel" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/title" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/tag/:tagLabel" }),
    handler: notImplemented,
  }],
};
