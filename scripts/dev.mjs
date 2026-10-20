// Local preview with auto-rebuild and auto-reload.
//   npm run dev   →  http://localhost:3000  (and your Wi-Fi address, for testing on iPhone/iPad)
// Edit anything in src/ or content/ and the page rebuilds and reloads itself.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, watch } from "node:fs";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { networkInterfaces } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".aac": "audio/aac" };
const RELOAD_SNIPPET = `<script>new EventSource("/__reload").onmessage = () => location.reload();</script>`;
const clients = new Set();

function build() {
  try { execFileSync("node", ["scripts/build.mjs"], { cwd: ROOT, stdio: "inherit" }); return true; }
  catch (e) { console.log("  ❌ Build failed. Fix the error above and save again."); return false; }
}

function send(res, file, req) {
  const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
  const headers = { "Content-Type": type, "Cache-Control": "no-store" };   // never serve a stale copy
  if (type.startsWith("text/html")) {
    return res.writeHead(200, headers).end(readFileSync(file, "utf8").replace("</body>", RELOAD_SNIPPET + "</body>"));
  }
  const size = statSync(file).size, range = req.headers.range;            // Safari needs ranges for audio
  if (range) {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = Number(s), end = e ? Number(e) : size - 1;
    const buf = readFileSync(file).subarray(start, end + 1);
    return res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": buf.length }).end(buf);
  }
  res.writeHead(200, { ...headers, "Accept-Ranges": "bytes", "Content-Length": size }).end(readFileSync(file));
}

build();

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/__reload") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" }).write("\n");
    clients.add(res); req.on("close", () => clients.delete(res)); return;
  }
  let file = normalize(join(OUT, path));
  if (!file.startsWith(OUT)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) return res.writeHead(404).end("Not found");
  send(res, file, req);
}).listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Local:   http://localhost:${PORT}`);
  Object.values(networkInterfaces()).flat().filter((n) => n && n.family === "IPv4" && !n.internal)
    .forEach((n) => console.log(`  Network: http://${n.address}:${PORT}   ← open this on your iPhone/iPad (same Wi-Fi)`));
  console.log("\n  Watching src/ and content/ — save a file and the page reloads.\n");
});

let timer = null;
for (const dir of ["src", "content"]) {
  watch(join(ROOT, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => { console.log("\n  Change detected, rebuilding…"); if (build()) clients.forEach((c) => c.write("data: reload\n\n")); }, 200);
  });
}
