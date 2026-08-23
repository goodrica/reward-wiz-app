import { createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const source = resolve(root, "extension");
const output = resolve(root, "public/pointpilot-extension.zip");
await mkdir(resolve(root, "public"), { recursive: true });
await rm(output, { force: true });

await new Promise((resolvePromise, reject) => {
  const out = createWriteStream(output);
  const archive = archiver("zip", { zlib: { level: 9 } });
  out.on("close", resolvePromise);
  archive.on("error", reject);
  archive.pipe(out);
  archive.directory(source, false);
  archive.finalize();
});

const result = await stat(output);
if (result.size === 0) throw new Error("Extension package is empty");
console.log(`Packaged ${output} (${result.size} bytes)`);
