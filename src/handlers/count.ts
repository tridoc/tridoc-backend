import { respond } from "../helpers/cors.ts";
import { processParams } from "../helpers/processParams.ts";
import { getDocumentNumber } from "../meta/finder.ts";

export async function count(
  request: Request,
  _match: URLPatternResult,
): Promise<Response> {
  const params = await processParams(request);
  const count = await getDocumentNumber(params);
  return respond("" + count);
}
