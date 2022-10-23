import { respond } from "../helpers/cors.ts";
import { processParams } from "../helpers/processParams.ts";
import * as metafinder from "../meta/finder.ts";

type TagCreate = {
  label: string;
  parameter?: {
    type:
      | "http://www.w3.org/2001/XMLSchema#decimal"
      | "http://www.w3.org/2001/XMLSchema#date";
  }; // only for parameterizable tags
};

export async function getDocs(
  request: Request,
  match: URLPatternResult,
): Promise<Response> {
  const params = await processParams(request, {
    tags: [[match.pathname.groups.tagLabel]],
  });
  const response = await metafinder.getDocumentList(params);
  return respond(JSON.stringify(response));
}

export async function getTagList(
  _request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  return respond(JSON.stringify(await metafinder.getTagList()));
}
