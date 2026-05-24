import "dotenv/config";

async function run(name: string, modulePath: string): Promise<void> {
  console.log(`\n=== ${name} ===`);
  try {
    await import(modulePath);
  } catch (err) {
    console.error(`[${name}] failed:`, err);
    process.exitCode = 1;
  }
}

await run("calendar-sync", "./calendar-sync.js");
await run("github-sync", "./github-sync.js");
