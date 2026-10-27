// Prepare images for a deck run.
//   node scripts/prep_assets.js check <image url>                       can this session download that image?
//                                                                       Test an image URL, not a page: many sites
//                                                                       block page fetches but serve images freely.
//   node scripts/prep_assets.js photo <url-or-file> <out.jpg>          square 600px headshot, face-aware crop
//   node scripts/prep_assets.js logo  <url-or-file> <out.png> [--white] trimmed PNG; --white turns every
//                                                                       visible pixel white, for a dark slide
// <url-or-file> can be an https URL, a data: URI, or a local file (.png, .jpg, .webp, .svg, or a
// .svg file holding inline <svg> markup copied out of a page).
//
// Exit codes: 0 ok, 2 network blocked (ask the recruiter for the file), 3 the URL is not an image,
// 4 the result is blank, 1 anything else.
const fs = require("fs");
const sharp = require("sharp");

class Fail extends Error {
  constructor(code, msg) { super(msg); this.code = code; }
}

// Browser-like headers. Many image CDNs refuse requests with no Referer or a bot user agent.
function headers(src) {
  let referer;
  try { referer = new URL(src).origin + "/"; } catch { referer = undefined; }
  return {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    Accept: "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
    ...(referer ? { Referer: referer } : {}),
  };
}

async function get(src) {
  let r;
  try {
    r = await fetch(src.replace(/^http:\/\//, "https://"), { headers: headers(src), redirect: "follow" });
    if (!r.ok && src.startsWith("http://")) r = await fetch(src, { headers: headers(src), redirect: "follow" });
  } catch (e) {
    const why = (e.cause && (e.cause.code || e.cause.message)) || e.message;
    throw new Fail(2, `NETWORK_BLOCKED (${why}): this session cannot reach ${new URL(src).host}. Ask the recruiter to drop the file in.`);
  }
  if (r.status === 403 || r.status === 401) throw new Fail(2, `NETWORK_BLOCKED (HTTP ${r.status}): ${src} refused the download (bot protection or a blocked network). Ask the recruiter to drop the file in.`);
  if (!r.ok) throw new Fail(1, `Download failed (HTTP ${r.status}): ${src}`);
  return { buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get("content-type") || "" };
}

async function load(src) {
  if (src.startsWith("data:")) {
    const m = src.match(/^data:([^;,]*)(;base64)?,(.*)$/s);
    if (!m) throw new Fail(3, "Unreadable data: URI");
    return m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]));
  }
  if (/^https?:\/\//.test(src)) {
    const { buf, type } = await get(src);
    const head = buf.slice(0, 300).toString().trimStart().toLowerCase();
    if (type.includes("text/html") || head.startsWith("<!doctype html") || head.startsWith("<html"))
      throw new Fail(3, `NOT_AN_IMAGE: ${src} returned a web page, not an image. Use the image's own URL (src, data-src or the largest srcset entry).`);
    return buf;
  }
  if (src.startsWith("//")) return load("https:" + src);
  if (src.startsWith("/")  && !fs.existsSync(src)) throw new Fail(3, `Relative URL ${src}: prefix it with the site's origin.`);
  return fs.readFileSync(src);
}

function isSvg(src, buf) {
  return /\.svg($|\?)/i.test(src) || buf.slice(0, 500).toString().includes("<svg");
}

// A blank result means the logo was white on transparent and got knocked out, or the crop missed.
async function assertVisible(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let seen = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 20) seen++;
  if (seen / (info.width * info.height) < 0.005) throw new Fail(4, `BLANK: ${file} came out empty. Try the other logo on the site (og:image, apple-touch-icon) or ask the recruiter for the file.`);
}

async function check(src) {
  await load(src);
  console.log(`OK: this session can download images from ${new URL(src).host}`);
}

(async () => {
  const [kind, src, out, flag] = process.argv.slice(2);
  if (kind === "check") { if (!src) throw new Fail(1, "Usage: prep_assets.js check <image url>"); return check(src); }
  if (!kind || !src || !out) throw new Fail(1, "Usage: prep_assets.js photo|logo <url-or-file> <out> [--white]");
  const buf = await load(src);

  if (kind === "photo") {
    await sharp(buf, isSvg(src, buf) ? { density: 300 } : {}).rotate()
      .resize(600, 600, { fit: "cover", position: sharp.strategy.attention }).jpeg({ quality: 88 }).toFile(out);
  } else if (kind === "logo") {
    const svg = isSvg(src, buf);
    let img = sharp(buf, svg ? { density: 600 } : {}).ensureAlpha();
    if (svg) img = img.resize({ height: 600 });
    if (flag === "--white") {
      // Keep the shape (alpha), paint it white. Only a logo on an opaque box needs its near-white
      // background knocked out; a logo that already has transparency keeps every visible pixel,
      // or a white or cream logo would vanish.
      const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
      let clear = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] < 20) clear++;
      const hasTransparency = clear / (info.width * info.height) > 0.05;
      for (let i = 0; i < data.length; i += 4) {
        const light = data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235;
        const a = !hasTransparency && light ? 0 : data[i + 3];
        data[i] = data[i + 1] = data[i + 2] = 255;
        data[i + 3] = a;
      }
      img = sharp(data, { raw: info });
    }
    await img.trim().png().toFile(out);
    await assertVisible(out);
  } else throw new Fail(1, "Kind must be check, photo or logo");
  const m = await sharp(out).metadata();
  console.log(`${out} ${m.width}x${m.height}`);
})().catch((e) => { console.error(e.message || e); process.exit(e.code || 1); });
