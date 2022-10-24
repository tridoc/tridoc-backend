import { options } from "../handlers/cors.ts";
import { count } from "../handlers/count.ts";
import * as doc from "../handlers/doc.ts";
import { notImplemented } from "../handlers/notImplemented.ts";
import * as raw from "../handlers/raw.ts";
import * as tag from "../handlers/tag.ts";
import { version } from "../handlers/version.ts";

export const routes: {
  [method: string]: {
    pattern: URLPattern;
    handler: (request: Request, match: URLPatternResult) => Promise<Response>;
  }[];
} = {
  "OPTIONS": [{
    pattern: new URLPattern({ pathname: "*" }),
    handler: options,
  }],
  "GET": [{
    pattern: new URLPattern({ pathname: "/count" }),
    handler: count,
  }, {
    pattern: new URLPattern({ pathname: "/doc" }),
    handler: doc.list,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id" }),
    handler: doc.getPDF,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/comment" }),
    handler: doc.getComments,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/tag" }),
    handler: doc.getTags,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/thumb" }),
    handler: doc.getThumb,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/title" }),
    handler: doc.getTitle,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/meta" }),
    handler: doc.getMeta,
  }, {
    pattern: new URLPattern({ pathname: "/raw/rdf" }),
    handler: raw.getRDF,
  }, {
    pattern: new URLPattern({ pathname: "/raw/zip" }),
    handler: raw.getZIP,
  }, {
    pattern: new URLPattern({ pathname: "/raw/tgz" }),
    handler: raw.getTGZ,
  }, {
    pattern: new URLPattern({ pathname: "/tag" }),
    handler: tag.getTagList,
  }, {
    pattern: new URLPattern({ pathname: "/tag/:tagLabel" }),
    handler: tag.getDocs,
  }, {
    pattern: new URLPattern({ pathname: "/version" }),
    handler: version,
  }],
  "POST": [{
    pattern: new URLPattern({ pathname: "/doc" }),
    handler: doc.postPDF,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/comment" }),
    handler: doc.postComment,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/tag" }),
    handler: doc.postTag,
  }, {
    pattern: new URLPattern({ pathname: "/tag" }),
    handler: tag.createTag,
  }],
  "PUT": [{
    pattern: new URLPattern({ pathname: "/doc/:id/title" }),
    handler: doc.putTitle,
  }, {
    pattern: new URLPattern({ pathname: "/raw/zip" }),
    handler: raw.putZIP,
  }],
  "DELETE": [{
    pattern: new URLPattern({ pathname: "/doc/:id" }),
    handler: doc.deleteDoc,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/tag/:tagLabel" }),
    handler: doc.deleteTag,
  }, {
    pattern: new URLPattern({ pathname: "/doc/:id/title" }),
    handler: notImplemented,
  }, {
    pattern: new URLPattern({ pathname: "/tag/:tagLabel" }),
    handler: tag.deleteTag,
  }, {
    pattern: new URLPattern({ pathname: "/raw/rdf" }),
    handler: raw.deleteRDFFile,
  }],
};
