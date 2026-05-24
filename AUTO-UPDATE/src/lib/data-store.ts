import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function dataDir(): string {
  return (
    process.env.DATA_DIR ??
    resolve(__dirname, "../../../self-introduction/app/data")
  );
}

export async function readJson<T>(filename: string, fallback?: T): Promise<T> {
  const path = resolve(dataDir(), filename);
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as T;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT" && fallback !== undefined) {
      console.warn(`[data-store] ${filename} not found, using fallback.`);
      return fallback;
    }
    throw err;
  }
}

export async function writeJson(filename: string, data: unknown): Promise<void> {
  const path = resolve(dataDir(), filename);
  const json = JSON.stringify(data, null, 2) + "\n";
  await writeFile(path, json, "utf8");
}
