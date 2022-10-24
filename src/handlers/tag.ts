import { respond } from "../helpers/cors.ts";
import { processParams } from "../helpers/processParams.ts";
import * as metafinder from "../meta/finder.ts";
import * as metastore from "../meta/store.ts";

type TagCreate = {
  label: string;
  parameter?: {
    type:
      | "http://www.w3.org/2001/XMLSchema#decimal"
      | "http://www.w3.org/2001/XMLSchema#date";
  }; // only for parameterizable tags
};

export async function createTag(
  request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const tagObject: TagCreate = await request.json();
  if (!tagObject?.label) return respond("No label provided", { status: 400 });
  if (
    tagObject?.parameter &&
    tagObject.parameter.type !== "http://www.w3.org/2001/XMLSchema#decimal" &&
    tagObject.parameter.type !== "http://www.w3.org/2001/XMLSchema#date"
  ) return respond("Invalid type", { status: 400 });
  const tagList = await metafinder.getTagList();
  if (tagList.some((e) => e.label === tagObject.label)) {
    return respond("Tag already exists", { status: 400 });
  }
  const regex = /\s|^[.]{1,2}$|\/|\\|#|"|'|,|;|:|\?/;
  if (regex.test(tagObject.label)) {
    return respond("Label contains forbidden characters", { status: 400 });
  }
  await metastore.createTag(tagObject.label, tagObject.parameter?.type);
  return respond(undefined, { status: 204 });
}

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
