const decoder = new TextDecoder("utf-8");

export async function getText(path: string) {
  const p = Deno.run({ cmd: ["pdftotext", path, "-"], stdout: "piped" });
  const { success, code } = await p.status();
  if (!success) throw new Error("pdfsandwich failed with code " + code);
  return decoder.decode(await p.output());
}
