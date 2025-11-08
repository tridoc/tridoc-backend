const decoder = new TextDecoder("utf-8");

export async function getText(path: string) {
  const cmd = new Deno.Command("pdftotext", {
    args: [path, "-"],
    stdout: "piped" as const,
  });
  const p = cmd.spawn();
  const result = await p.output();
  const output = decoder.decode(result.stdout);
  const status = await p.status;
  if (!status.success) {
    throw new Error("pdftotext failed with code " + status.code);
  }
  return output;
}
