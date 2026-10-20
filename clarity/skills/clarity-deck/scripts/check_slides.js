// Check a Slides deck's files before they are published. No dependencies.
// Usage: node scripts/check_slides.js <root> [--facts <fact-sheet.md>] [--anon "<client name>"]
//   <root> is the folder holding project/deck.json and project/slides/.
// Exit 2 on any error. Warnings print but do not block.
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const root = args[0];
const opt = (k) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : null; };
const factsPath = opt("--facts");
const anonName = opt("--anon");
if (!root) { console.error("Usage: check_slides.js <root> [--facts fact-sheet.md] [--anon \"Client\"]"); process.exit(1); }

const errors = [], warnings = [];
const deck = JSON.parse(fs.readFileSync(path.join(root, "project/deck.json"), "utf8"));
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const text = (html) => html.replace(/<aside[\s\S]*?<\/aside>/g, " ").replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&#160;|&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const norm = (s) => s.toLowerCase().replace(/[\s,]/g, "");
const facts = factsPath ? norm(fs.readFileSync(factsPath, "utf8")) : null;
// Money, percentages and k/m amounts, plus bare counts of two to four digits that are not years.
const FIGURE = /[£$€]\s?\d[\d,.]*\s?(?:k|m|bn)?\+?|\b\d[\d,.]*\s?%|\b\d[\d,.]*\s?(?:k|m|bn)\b|\b\d{2,4}\b/gi;

for (const id of deck.order || []) {
  if (!ID.test(id)) { errors.push(`Slide id "${id}" is not a valid id`); continue; }
  const file = path.join(root, "project/slides", `${id}.html`);
  if (!fs.existsSync(file)) { errors.push(`${id}: in order but project/slides/${id}.html is missing`); continue; }
  const html = fs.readFileSync(file, "utf8");
  const where = `${id}.html`;
  const t = text(html);

  if (!new RegExp(`^\\s*<section id="${id}"`).test(html)) errors.push(`${where}: must start with <section id="${id}"`);
  if (/<aside/i.test(html)) errors.push(`${where}: has speaker notes. Anyone who opens the deck can read them; keep sources on the fact sheet.`);
  if (/—/.test(html)) errors.push(`${where}: em dash. Use a comma, full stop or semicolon.`);
  for (const m of html.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) if (+m[1] < 24) errors.push(`${where}: font-size ${m[1]}px is under the 24px floor`);
  for (const m of html.matchAll(/<img[^>]*src="([^"]*)"/g)) if (!/^\/_blob\/[0-9a-f]+$|^project\/ds\//.test(m[1])) errors.push(`${where}: image src "${m[1].slice(0, 60)}" must be an uploaded /_blob/<id>`);
  const ph = t.match(/\{\{[^}]*\}\}|\bTODO\b|\bTBC\b|\bXXX\b|lorem|ipsum|\[[^\]]*__[^\]]*\]|\[insert[^\]]*\]/i);
  if (ph) errors.push(`${where}: placeholder left in: "${ph[0]}"`);
  const age = t.match(/\b(?:in (?:their|his|her) (?:20|30|40|50|60)s|aged? (?:under |over )?\d{2}|young(?:er)? (?:candidate|person|hire)|digital native)\b/i);
  if (age) errors.push(`${where}: "${age[0]}" reads as an age requirement. Remove it.`);
  if (anonName && t.toLowerCase().includes(anonName.toLowerCase())) errors.push(`${where}: anonymised deck still names "${anonName}"`);

  if (facts) {
    // Phone numbers and emails are contact details, not facts.
    const scan = t.replace(/\+?\d[\d ()-]{7,}\d/g, " ").replace(/\S+@\S+/g, " ");
    for (const m of scan.matchAll(FIGURE)) {
      const fig = m[0].trim();
      if (/^\d{4}$/.test(fig) && +fig >= 1900 && +fig <= 2100) continue; // a year
      if (!facts.includes(norm(fig).replace(/\+$/, ""))) errors.push(`${where}: "${fig}" is not on the fact sheet. Add it with its source, or take it off the slide.`);
    }
  }
}
for (const f of fs.readdirSync(path.join(root, "project/slides")).filter((f) => f.endsWith(".html")))
  if (!(deck.order || []).includes(f.replace(/\.html$/, ""))) warnings.push(`${f} exists but is not in deck.json order; it would show last`);

if (warnings.length) console.log("WARNINGS\n- " + [...new Set(warnings)].join("\n- "));
if (errors.length) { console.error("CHECK FAILED\n- " + errors.join("\n- ")); process.exit(2); }
console.log(`OK: ${deck.order.length} slides checked${facts ? " against the fact sheet" : ""}.`);
