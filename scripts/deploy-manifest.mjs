import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import { join, relative, resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifestPath = join(root, "context/deployment/source-manifest.sha256");
const mode = process.argv[2] ?? "check";
if (!["write", "check"].includes(mode)) {
  throw new Error("Usage: node scripts/deploy-manifest.mjs [write|check]");
}

async function collect(directory) {
  const paths = [];
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not supported: ${path}`);
    if (/^\.(env|dev\.vars)(\.|$)/.test(entry.name)) {
      throw new Error(`Secret configuration must not appear in deployment sources: ${path}`);
    }
    if (entry.isDirectory()) paths.push(...(await collect(path)));
    else if (entry.isFile()) paths.push(path);
  }
  return paths;
}

const files = [
  ".gitignore",
  ".nvmrc",
  ".prettierrc.json",
  "README.md",
  "astro.config.mjs",
  "components.json",
  "eslint.config.js",
  "package.json",
  "package-lock.json",
  "supabase/config.toml",
  "tsconfig.json",
  "wrangler.jsonc",
  ...(await collect("src")),
  ...(await collect("public")),
  ...(await collect("scripts")),
  ...(await collect(".github")),
].sort();

let manifest = "";
for (const file of files) {
  const hash = createHash("sha256")
    .update(await readFile(resolve(root, file)))
    .digest("hex");
  manifest += `${hash}  ${relative(root, resolve(root, file))}\n`;
}

if (mode === "write") {
  await writeFile(manifestPath, manifest);
  console.log(`Recorded deployment source manifest (${files.length} files).`);
} else {
  if ((await readFile(manifestPath, "utf8")) !== manifest) {
    throw new Error("Deployment sources changed. Rebuild and validate staging before recording a new manifest.");
  }
  console.log(`Deployment source manifest matches (${files.length} files).`);
}
