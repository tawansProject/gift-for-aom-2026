// Deploys with the Vercel CLI.
//   npm run deploy:staging      preview deployment, aliased to https://gift-for-aom-2026-staging.vercel.app
//   npm run deploy:production   production at https://gift-for-aom-2026.vercel.app (asks you to confirm)
// Needs: `npx vercel login` once (or a VERCEL_TOKEN env var).
import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT = "gift-for-aom-2026";
const STAGING_ALIAS = `${PROJECT}-staging.vercel.app`;
const target = process.argv[2];
if (!["staging", "production"].includes(target)) { console.error("Usage: node scripts/deploy.mjs staging|production"); process.exit(1); }

const tokenArgs = process.env.VERCEL_TOKEN ? ["--token", process.env.VERCEL_TOKEN] : [];
const scopeArgs = process.env.VERCEL_SCOPE ? ["--scope", process.env.VERCEL_SCOPE] : [];
const vercel = (args, opts = {}) => execFileSync("npx", ["--yes", "vercel@latest", ...args, ...tokenArgs, ...scopeArgs], { cwd: ROOT, encoding: "utf8", stdio: ["inherit", "pipe", "inherit"], ...opts });

// 1. Validate content locally first, so a broken build never ships
execFileSync("node", ["scripts/build.mjs", "--check"], { cwd: ROOT, stdio: "inherit" });

// 2. Link this folder to the Vercel project (first run only)
if (!existsSync(join(ROOT, ".vercel", "project.json"))) {
  console.log(`Linking to Vercel project ${PROJECT}…`);
  vercel(["link", "--yes", "--project", PROJECT], { stdio: "inherit" });
}

// 3. Production needs an explicit yes
if (target === "production" && !process.argv.includes("--yes")) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`Deploy to PRODUCTION (https://${PROJECT}.vercel.app)? Type "${PROJECT}" to confirm: `);
  rl.close();
  if (answer.trim() !== PROJECT) { console.log("Cancelled."); process.exit(1); }
}

// 4. Deploy (Vercel runs the build itself, using vercel.json)
const url = vercel(["deploy", "--yes", ...(target === "production" ? ["--prod"] : [])]).trim().split("\n").pop();
console.log(`\nDeployed: ${url}`);

// 5. Staging gets a stable address
if (target === "staging") {
  vercel(["alias", "set", url, STAGING_ALIAS], { stdio: "inherit" });
  console.log(`Staging: https://${STAGING_ALIAS}`);
} else {
  console.log(`Production: https://${PROJECT}.vercel.app`);
}
