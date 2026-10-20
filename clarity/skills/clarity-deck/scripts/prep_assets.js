// Prepare images for a deck run.
//   node scripts/prep_assets.js photo <url-or-file> <out.jpg>          square 600px headshot, face-aware crop
//   node scripts/prep_assets.js logo  <url-or-file> <out.png> [--white] trimmed PNG; --white turns every
//                                                                       visible pixel white, for a dark slide
const fs = require("fs");
const sharp = require("sharp");

async function load(src) {
  if (/^https?:\/\//.test(src)) {
    const r = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) throw new Error(`Download failed (${r.status}): ${src}`);
    return Buffer.from(await r.arrayBuffer());
  }
  return fs.readFileSync(src);
}

(async () => {
  const [kind, src, out, flag] = process.argv.slice(2);
  if (!kind || !src || !out) throw new Error("Usage: prep_assets.js photo|logo <url-or-file> <out> [--white]");
  let buf = await load(src);

  if (kind === "photo") {
    await sharp(buf).rotate().resize(600, 600, { fit: "cover", position: sharp.strategy.attention }).jpeg({ quality: 88 }).toFile(out);
  } else if (kind === "logo") {
    const isSvg = src.toLowerCase().endsWith(".svg") || buf.slice(0, 200).toString().includes("<svg");
    let img = sharp(buf, isSvg ? { density: 600 } : {}).ensureAlpha();
    if (isSvg) img = img.resize({ height: 600 });
    if (flag === "--white") {
      // Keep the shape (alpha), paint it white. A logo on a white box needs its background made
      // transparent first: treat near-white pixels as background.
      const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
      for (let i = 0; i < data.length; i += 4) {
        const light = data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235;
        const a = light ? 0 : data[i + 3];
        data[i] = data[i + 1] = data[i + 2] = 255;
        data[i + 3] = a;
      }
      img = sharp(data, { raw: info });
    }
    await img.trim().png().toFile(out);
  } else throw new Error("Kind must be photo or logo");
  const m = await sharp(out).metadata();
  console.log(`${out} ${m.width}x${m.height}`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
