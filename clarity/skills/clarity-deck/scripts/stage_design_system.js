// Stage the Clarity R2R design system for publishing as a Design System artifact.
// Usage: node scripts/stage_design_system.js <out-dir> --assets
//        node scripts/stage_design_system.js <out-dir> <ids.json> [--by "<name>"] [--created <iso of an existing system>]
//   ids.json maps each uploaded asset to the id the upload returned:
//   {"Logos/clarity-r2r-wordmark.png": "f40b...", "Icons/plane.png": "b9c5...", ...}
// Writes <out-dir>/project/... ready for one Artifact publish with root = <out-dir>.
const fs = require("fs");
const path = require("path");

const SKILL = path.join(__dirname, "..");
const DS = path.join(SKILL, "design-system");
const [outDir, idsPath] = process.argv.slice(2);
const byIdx = process.argv.indexOf("--by");
const by = byIdx > 0 ? process.argv[byIdx + 1] : "Claude";
// Updating an existing system: keep its original createdOnFiles.at (read it from its index first).
const createdIdx = process.argv.indexOf("--created");
if (!outDir || !idsPath) throw new Error("Usage: stage_design_system.js <out-dir> <ids.json> [--by name]");

// Step 1 (--assets): copy the logo and icons to <out-dir>/upload/ and list them. Uploads must come
// from the session's own folder, not from the plugin folder.
if (idsPath === "--assets") {
  const list = [];
  for (const group of ["Logos", "Icons"]) {
    const dir = path.join(outDir, "upload", group);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(path.join(DS, "assets", group)).filter((x) => x.endsWith(".png")).sort()) {
      fs.copyFileSync(path.join(DS, "assets", group, f), path.join(dir, f));
      list.push(path.resolve(dir, f));
    }
  }
  console.log(JSON.stringify(list, null, 2));
  process.exit(0);
}

// Step 2: stage the system with the ids the uploads returned.
const ids = JSON.parse(fs.readFileSync(idsPath, "utf8"));
const P = (...p) => path.join(outDir, "project", ...p);
const write = (rel, text) => { fs.mkdirSync(path.dirname(P(rel)), { recursive: true }); fs.writeFileSync(P(rel), text); };
const copy = (from, rel) => { fs.mkdirSync(path.dirname(P(rel)), { recursive: true }); fs.copyFileSync(from, P(rel)); };

// Every asset on disk must have an uploaded id, or decks cannot copy it.
const groups = {};
for (const group of ["Logos", "Icons"]) {
  for (const file of fs.readdirSync(path.join(DS, "assets", group)).filter((f) => f.endsWith(".png")).sort()) {
    const key = `${group}/${file}`;
    if (!ids[key]) throw new Error(`No uploaded id for ${key} in ${idsPath}`);
    const size = fs.statSync(path.join(DS, "assets", group, file)).size;
    (groups[group] = groups[group] || []).push({ file, id: ids[key], size });
  }
}

// tokens, cover, fonts
copy(path.join(DS, "project/tokens.json"), "tokens.json");
copy(path.join(DS, "project/components/Cover/preview.html"), "components/Cover/preview.html");
for (const w of ["400", "600", "700"]) copy(path.join(SKILL, "assets", `poppins-${w}.ttf`), `fonts/poppins-${w}.ttf`);

// README: the brand book plus the section decks need, with every asset id.
const logo = groups.Logos.find((a) => a.file === "clarity-r2r-wordmark.png");
const table = (list) => list.map((a) => `| \`${a.file.replace(/\.png$/, "")}\` | \`${a.id}\` |`).join("\n");
const readme = fs.readFileSync(path.join(DS, "project/README.base.md"), "utf8").trimEnd() + `

## Using this system in a Slides deck

**Font.** Load Poppins from Google Fonts in the deck's \`faces\`:
\`https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap\`.
Font stack on every section: \`'Poppins', Arial, sans-serif\`.

**Copy the assets you need** into the deck in one server-side copy per ten assets
(\`publish\`, \`asset: true\`, \`from_url\` = this system, \`asset_ids\` = the ids below). Use the
\`/_blob/<id>\` each copy returns, never these ids, in the slides.

| Logo | Asset id |
|---|---|
| \`clarity-r2r-wordmark\` (white, 3.3 : 1) | \`${logo.id}\` |

Gold line icons, 256px, transparent. Show them at 36 to 48px.

| Icon | Asset id |
|---|---|
${table(groups.Icons)}

**The header on every content slide** (1920 x 1080): client logo pinned at left 128, top 48,
height 104; Clarity wordmark pinned at left 1472, top 56, 320 x 97. Section padding
\`200px 128px 112px\` so the title clears both.
`;
write("README.md", readme);

write("assets/Logos/README.md", "# Logos\n\n`clarity-r2r-wordmark.png`: the Clarity R2R wordmark with the r2r roundel, white on transparent.\nSingle ink: white. Use only on `ground` or `surface`. Minimum width 240px on a 1920 slide.\n");
write("assets/Icons/README.md", "# Icons\n\nLucide line icons rendered in `gold` (#FFC500) at 256px on transparent. Single ink: gold.\nFor sectors, locations, bullets and card headers on Clarity slides, at 36 to 48px.\n");

const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
const assetGroups = {};
for (const [g, list] of Object.entries(groups)) {
  assetGroups[g] = {
    name: g, tile: g === "Logos" ? "l" : "s", order: list.map((a) => a.file),
    files: Object.fromEntries(list.map((a) => [a.file, { name: a.file, blob: a.id, size: a.size, type: "image/png" }])),
  };
}
const index = {
  v: 3, layout: "files", createdOnFiles: { v: 1, at: createdIdx > 0 ? process.argv[createdIdx + 1] : now }, title: "Clarity R2R", namespace: "ClarityR2R",
  libraries: [], sections: {}, groups: ["Logos", "Icons"], assetGroups, blobs: {}, docs: { sections: [] },
  lastChange: { by, at: now, via: "clarity-deck skill", note: "Clarity R2R design system, from the clarity-deck skill." },
};
write("design-system.json", JSON.stringify(index, null, 2) + "\n");

const files = ["tokens.json", "README.md", "assets/Logos/README.md", "assets/Icons/README.md", "components/Cover/preview.html", "fonts/poppins-400.ttf", "fonts/poppins-600.ttf", "fonts/poppins-700.ttf"];
console.log(JSON.stringify({ root: path.resolve(outDir), file_path: path.resolve(P("design-system.json")), files: Object.fromEntries(files.map((f) => [`project/${f}`, `project/${f}`])) }, null, 2));
