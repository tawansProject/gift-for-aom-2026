// Builds the static site into public/ from src/ (app code) and content/ (your text, photos, song).
//   node scripts/build.mjs           build public/
//   node scripts/build.mjs --check   only validate content/, build nothing
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src"), CONTENT = join(ROOT, "content"), OUT = join(ROOT, "public");
const CHECK_ONLY = process.argv.includes("--check");
const PHOTO_W = 1200, PHOTO_H = 1600, PHOTO_MAX_BYTES = 1.5 * 1024 * 1024;
const warnings = [], errors = [];

const lines = (file) => existsSync(join(CONTENT, file))
  ? readFileSync(join(CONTENT, file), "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
  : [];
const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

// Image size from the file header (JPEG, PNG, WebP), no dependencies
function imageSize(buf) {
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const kind = buf.toString("ascii", 12, 16);
    if (kind === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      i += 2 + len;
    }
  }
  return null;
}

// --- text ---
const messages = lines("messages.txt");
const bridge = lines("bridge.txt")[0] || "";
const ending = lines("ending.txt");
if (!messages.length) errors.push("content/messages.txt has no lines. Add at least one message.");
if (!ending.length) warnings.push("content/ending.txt is empty, so the ending will show สุขสันต์วันเกิดนะ.");

// --- photos ---
const PHOTO_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const allPhotos = readdirSync(join(CONTENT, "photos")).filter((f) => PHOTO_EXT.includes(extname(f).toLowerCase())).sort(naturalSort);
let photoFiles = allPhotos.filter((f) => !f.startsWith("_"));
if (!photoFiles.length) {
  photoFiles = allPhotos.filter((f) => f.startsWith("_placeholder"));
  warnings.push("No photos in content/photos yet, so the sample placeholders are used. Add 01.jpg, 02.jpg, … (1200 × 1600 px).");
}
const photos = photoFiles.map((f) => {
  const full = join(CONTENT, "photos", f), buf = readFileSync(full), size = imageSize(buf), bytes = statSync(full).size;
  if (!size) warnings.push(`${f}: couldn't read its dimensions.`);
  else {
    const ratio = size.w / size.h;
    if (Math.abs(ratio - PHOTO_W / PHOTO_H) > 0.02) warnings.push(`${f}: ${size.w} × ${size.h} isn't portrait 3:4. It will show with black bars (recommended ${PHOTO_W} × ${PHOTO_H}).`);
    else if (size.w < PHOTO_W * 0.75) warnings.push(`${f}: ${size.w} × ${size.h} is small and may look soft (recommended ${PHOTO_W} × ${PHOTO_H}).`);
  }
  if (bytes > PHOTO_MAX_BYTES) warnings.push(`${f}: ${(bytes / 1048576).toFixed(1)} MB is heavy. Aim for under 1 MB so it loads fast on her phone.`);
  return { file: f, src: "photos/" + encodeURIComponent(f), w: size?.w || null, h: size?.h || null };
});

// --- song ---
const SONG_EXT = [".mp3", ".m4a", ".aac"];
const songs = readdirSync(join(CONTENT, "song")).filter((f) => !f.startsWith("_") && SONG_EXT.includes(extname(f).toLowerCase())).sort(naturalSort);
if (!songs.length) warnings.push("No song in content/song yet, so the site will play silently.");
if (songs.length > 1) warnings.push(`More than one song in content/song, so only ${songs[0]} is used.`);
const song = songs[0] || null;
if (song && statSync(join(CONTENT, "song", song)).size > 12 * 1048576) warnings.push(`${song} is over 12 MB. Try 128–192 kbps.`);

// --- report ---
console.log(`\nContent: ${messages.length} messages, ${bridge ? "1 bridge line" : "no bridge line"}, ${ending.length} ending lines, ${photos.length} photos, song: ${song || "none"}`);
warnings.forEach((w) => console.log("  ⚠️  " + w));
errors.forEach((e) => console.log("  ❌ " + e));
if (errors.length) process.exit(1);
if (CHECK_ONLY) { console.log("  ✅ Content looks good.\n"); process.exit(0); }

// --- build ---
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "photos"), { recursive: true });
cpSync(SRC, OUT, { recursive: true });
photos.forEach((p) => cpSync(join(CONTENT, "photos", p.file), join(OUT, "photos", p.file)));
let songSrc = null;
if (song) { mkdirSync(join(OUT, "song"), { recursive: true }); cpSync(join(CONTENT, "song", song), join(OUT, "song", song)); songSrc = "song/" + encodeURIComponent(song); }
writeFileSync(join(OUT, "content.json"), JSON.stringify({
  messages, bridge, ending, song: songSrc,
  photos: photos.map(({ src, w, h }) => ({ src, w, h })),
  builtAt: new Date().toISOString()
}, null, 2));
console.log(`  ✅ Built public/\n`);
