// Build a Clarity client deck from a content.json.
// Usage: node scripts/build.js <run>/content.json [--anon] [--outdir <dir>]
// Paths in content.json are relative to the JSON file; "skill:" points into this skill folder.
const fs = require("fs");
const path = require("path");
const { ClarityDeck } = require("./lib/clarity-deck");

const SKILL = path.join(__dirname, "..");
const PAGE_TYPES = ["cover", "divider", "profileIntro", "teamGrid", "stats", "statementsAndPills", "iconCards", "bullets", "labelList", "contact"];

const args = process.argv.slice(2);
const jsonPath = path.resolve(args.find((a) => a.endsWith(".json")) || "");
const anonymised = args.includes("--anon");
const outIdx = args.indexOf("--outdir");
const outdir = path.resolve(outIdx >= 0 ? args[outIdx + 1] : path.dirname(jsonPath));
const base = path.dirname(jsonPath);

const resolve = (p) => (p.startsWith("skill:") ? path.join(SKILL, p.slice(6)) : path.resolve(base, p));

// Swap every *photo / logo path for an absolute one, collecting anything missing.
const missing = [];
function fixPaths(o) {
  if (Array.isArray(o)) return o.forEach(fixPaths);
  if (!o || typeof o !== "object") return;
  for (const [k, v] of Object.entries(o)) {
    if ((k === "photo" || k === "logo") && typeof v === "string") {
      o[k] = resolve(v);
      if (!fs.existsSync(o[k])) missing.push(`${k}: ${v}`);
    } else fixPaths(v);
  }
}

// Checks that stop a build: anything a recruiter would be embarrassed to send.
function check(content) {
  const errors = [];
  const text = JSON.stringify(content.slides);
  if (/—/.test(text)) errors.push("Em dash in copy. House rule: commas, full stops or semicolons instead.");
  const ph = text.match(/\b(TODO|TBC|XXX|lorem|ipsum|\[insert[^\]]*\])/i);
  if (ph) errors.push(`Placeholder text left in: "${ph[0]}"`);
  content.slides.forEach((s, i) => {
    if (!PAGE_TYPES.includes(s.type)) errors.push(`Slide ${i + 1}: unknown type "${s.type}". Use one of: ${PAGE_TYPES.join(", ")}`);
    if (!s.sources || !s.sources.length) errors.push(`Slide ${i + 1} (${s.type}): no sources. Every slide lists where its facts came from.`);
  });
  if (anonymised && content.client && text.toLowerCase().includes(String(content.client.name).toLowerCase()))
    errors.push(`Anonymised build still names the client ("${content.client.name}") in the slide copy.`);
  if (missing.length) errors.push("Missing files:\n  " + missing.join("\n  "));
  return errors;
}

(async () => {
  if (!fs.existsSync(jsonPath)) throw new Error("Pass the path to content.json");
  const content = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  fixPaths(content);
  const errors = check(content);
  if (errors.length) {
    console.error("BUILD STOPPED\n- " + errors.join("\n- "));
    process.exit(2);
  }
  // Logo aspect ratio comes from the file itself.
  if (content.client.logo && !content.client.logoRatio) {
    const m = await require("sharp")(content.client.logo).metadata();
    content.client.logoRatio = m.width / m.height;
  }
  const deck = new ClarityDeck({ client: content.client, anonymised });
  for (const { type, ...slideArgs } of content.slides) await deck[type](slideArgs);
  fs.mkdirSync(outdir, { recursive: true });
  const label = anonymised ? (content.client.anonymisedName || "Confidential Client") : content.client.name;
  const out = path.join(outdir, `Clarity R2R x ${label}.pptx`);
  await deck.write(out);
  console.log(out);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
