import { getTagTypes } from "../meta/finder.ts";

function extractQuery(request: Request) {
  const url = new URL(request.url);
  const query: Record<string, string[]> = {};
  for (const param of url.searchParams) {
    if (query[param[0]]) {
      query[param[0]].push(param[1]);
    } else query[param[0]] = new Array(param[1]);
  }
  return query;
}

type ParamTag = {
  label: string; // [0]
  min?: string; // [1]
  max?: string; // [2]
  type?: string; // [3]
  maxIsExclusive?: boolean; //[5]
};

export type Params = {
  tags?: ParamTag[];
  nottags?: ParamTag[];
  text?: string;
  limit?: number;
  offset?: number;
};

export async function processParams(request: Request): Promise<Params> {
  const query = extractQuery(request);
  const result: Params = {};
  const tags = query.tag?.map((t) => t.split(";")) ?? [];
  const nottags = query.nottag?.map((t) => t.split(";")) ?? [];
  result.text = query.text?.[0];
  result.limit = parseInt(query.limit?.[0], 10) > 0
    ? parseInt(query.limit[0])
    : undefined;
  result.offset = parseInt(query.offset?.[0], 10) >= 0
    ? parseInt(query.offset[0])
    : undefined;
  return await getTagTypes(
    tags.map((e) => e[0]).concat(nottags.map((e) => e[0])),
  ).then((types) => {
    function tagMap(t: string[]): ParamTag {
      const label = t[0];
      const type = types.find((e) => e[0] === t[0])?.[1];
      let min = t[1];
      let max = t[2];
      let maxIsExclusive;
      if (type === "http://www.w3.org/2001/XMLSchema#date") {
        if (min) {
          switch (min.length) {
            case 4:
              min += "-01-01";
              break;
            case 7:
              min += "-01";
              break;
          }
        }
        if (max) {
          switch (max.length) {
            case 4:
              max += "-12-31";
              break;
            case 7: {
              const month = parseInt(max.substring(5), 10) + 1;
              if (month < 13) {
                max = max.substring(0, 5) + "-" +
                  month.toString().padStart(2, "0") + "-01";
                maxIsExclusive = true;
              } else {
                max += "-31";
              }
              break;
            }
          }
        }
      }
      return { label, min, max, type, maxIsExclusive };
    }
    result.tags = tags.map(tagMap);
    result.nottags = nottags.map(tagMap);
    console.log("eh??", result);
    return result;
  });
}
