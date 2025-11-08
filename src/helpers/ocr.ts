// Helper for running pdfsandwich OCR on a PDF lacking embedded text.
// Returns the path to the generated OCR PDF ("<original>_ocr.pdf") if successful, otherwise null.
// Keeps implementation minimal so handlers own flow decisions.

export async function runPdfsandwich(
  pdfPath: string,
  lang: string,
): Promise<string | null> {
  // Determine working directory and expected output file name
  const dir = pdfPath.substring(0, Math.max(0, pdfPath.lastIndexOf("/"))) ||
    ".";
  const base = pdfPath.substring(pdfPath.lastIndexOf("/") + 1).replace(
    /\.pdf$/i,
    "",
  );
  const ocrCandidate = `${dir}/${base}_ocr.pdf`;

  try {
    const cmd = new Deno.Command("pdfsandwich", {
      args: ["-rgb", "-lang", lang, pdfPath],
      cwd: dir,
      stdout: "inherit",
      stderr: "inherit",
    });
    const child = cmd.spawn();
    const status = await child.status;
    if (!status.success) {
      console.error("pdfsandwich failed with code", status.code);
      return null;
    }
    // Expect pdfsandwich to write <base>_ocr.pdf next to input
    try {
      await Deno.stat(ocrCandidate);
      return ocrCandidate;
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        console.error(
          "OCR output not found at expected location:",
          ocrCandidate,
        );
        return null;
      }
      throw err;
    }
  } catch (err) {
    console.error("pdfsandwich execution failed:", String(err));
    return null;
  }
}
