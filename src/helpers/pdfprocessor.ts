const decoder = new TextDecoder("utf-8");

export async function getText(path: string) {
  const p = Deno.run({ cmd: ["pdftotext", path, "-"], stdout: "piped" });
  const output = decoder.decode(await p.output());
  const { success, code } = await p.status();
  if (!success) throw new Error("pdftotext failed with code " + code);
  return output;
}
