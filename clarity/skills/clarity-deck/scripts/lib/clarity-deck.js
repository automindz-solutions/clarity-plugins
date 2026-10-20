// Clarity R2R client deck generator.
// One master (theme + 4 layouts) and a library of page types. A run passes a content object;
// every slide carries its sources in the speaker notes so the recruiter can fact-check.
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Lu = require("react-icons/lu");

// Skill root: scripts/lib -> skill folder.
const ROOT = path.join(__dirname, "..", "..");

const { applyTheme } = require("./apply_theme.js");

// House style (clarity-house-style): gold on near-black, Poppins.
const HEX = {
  bg: "111111", text: "F0F0F0", muted: "8A8A8A", gold: "FFC500",
  box: "1C1C1C", boxLine: "525252", goldBox: "251C05", goldLine: "9E7B0D", white: "FFFFFF",
};
const THEME = {
  name: "Clarity R2R",
  headFontFace: "Poppins",
  bodyFontFace: "Poppins",
  colors: {
    dk1: HEX.bg, lt1: HEX.white, dk2: HEX.box, lt2: HEX.text,
    accent1: HEX.gold, accent2: HEX.muted, accent3: HEX.boxLine,
    accent4: HEX.goldBox, accent5: HEX.goldLine, accent6: HEX.white,
    hlink: HEX.gold, folHlink: HEX.goldLine,
  },
};

// A4 landscape, matching the decks the VA builds today.
const W = 11.69, H = 8.27, M = 0.6;
const CONTENT_Y = 2.4, CONTENT_BOTTOM = 7.7;
const CLARITY_LOGO = path.join(ROOT, "assets/clarity-logo.png");
const CLARITY_RATIO = 333 / 101;

// Measure wrapped line count with the real Poppins metrics, so row heights are exact.
// opentype.js is optional: without it, fall back to an average character width.
let FONT = null;
try {
  const opentype = require("opentype.js");
  const buf = require("fs").readFileSync(path.join(ROOT, "assets/poppins-400.ttf"));
  FONT = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
} catch (e) { FONT = null; }
function lineCount(text, widthIn, fs) {
  const maxPx = widthIn * 72 * 0.97;
  if (!FONT) return Math.ceil(text.length / (maxPx / (fs * 0.55)));
  let lines = 1, cur = "";
  for (const word of text.split(" ")) {
    const trial = cur ? cur + " " + word : word;
    if (FONT.getAdvanceWidth(trial, fs) > maxPx && cur) { lines++; cur = word; } else cur = trial;
  }
  return lines;
}

async function icon(name, color = "#" + HEX.gold) {
  const Comp = Lu[name] || Lu.LuCircleDot;
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

class ClarityDeck {
  constructor({ client, anonymised = false }) {
    this.pres = new pptxgen();
    this.pres.defineLayout({ name: "A4_LANDSCAPE", width: W, height: H });
    this.pres.layout = "A4_LANDSCAPE";
    this.pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
    this.pres.author = "Clarity R2R";
    this.pres.company = "Clarity R2R";
    this.C = this.pres.SchemeColor;
    this.client = client;
    this.anonymised = anonymised;
    this.defineLayouts();
  }

  clientLogo(x, y, h, align = "left") {
    if (this.anonymised || !this.client.logo) return null;
    const w = h * this.client.logoRatio;
    return { image: { path: this.client.logo, x: align === "left" ? x : x - w, y, w, h } };
  }

  header() {
    const objs = [];
    const cl = this.clientLogo(M, 0.42, 0.78);
    if (cl) objs.push(cl);
    const lw = 2.0, lh = lw / CLARITY_RATIO;
    objs.push({ image: { path: CLARITY_LOGO, x: W - M - lw, y: 0.5, w: lw, h: lh } });
    return objs;
  }

  defineLayouts() {
    const C = this.C;
    const bg = { color: HEX.bg };

    // Cover: both logos side by side, role in gold, location banner below.
    const coverObjs = [];
    const lh = 0.95, lw = lh * CLARITY_RATIO;
    if (this.anonymised || !this.client.logo) {
      coverObjs.push({ image: { path: CLARITY_LOGO, x: (W - lw) / 2, y: 2.55, w: lw, h: lh } });
    } else {
      const cw = 1.05 * this.client.logoRatio, gap = 0.55, xw = 0.3;
      const total = lw + gap + xw + gap + cw;
      const x0 = (W - total) / 2;
      coverObjs.push({ image: { path: CLARITY_LOGO, x: x0, y: 2.55, w: lw, h: lh } });
      coverObjs.push({ text: { text: "x", options: { x: x0 + lw + gap, y: 2.62, w: xw, h: 0.8, fontSize: 28, color: C.background1, align: "center", valign: "middle" } } });
      coverObjs.push({ image: { path: this.client.logo, x: x0 + lw + gap * 2 + xw, y: 2.5, w: cw, h: 1.05 } });
    }
    this.pres.defineSlideMaster({
      title: "CL_COVER", background: bg, objects: [
        ...coverObjs,
        { placeholder: { options: { name: "title", type: "title", x: M, y: 4.35, w: W - 2 * M, h: 0.85, fontSize: 34, bold: true, color: C.accent1, align: "center", valign: "middle", margin: 0 }, text: "Role Title" } },
        { placeholder: { options: { name: "body", type: "body", x: M, y: 5.2, w: W - 2 * M, h: 0.6, fontSize: 18, color: C.background1, align: "center", valign: "middle", charSpacing: 3, margin: 0 }, text: "LOCATION" } },
      ],
    });

    this.pres.defineSlideMaster({
      title: "CL_DIVIDER", background: bg, objects: [
        ...this.header(),
        { placeholder: { options: { name: "title", type: "title", x: M, y: 3.5, w: W - 2 * M, h: 1.2, fontSize: 40, bold: true, color: C.accent1, align: "center", valign: "middle", margin: 0 }, text: "Section" } },
      ],
    });

    this.pres.defineSlideMaster({
      title: "CL_CONTENT", background: bg, objects: [
        ...this.header(),
        { placeholder: { options: { name: "title", type: "title", x: M, y: 1.45, w: W - 2 * M, h: 0.75, fontSize: 30, bold: true, color: C.accent1, align: "left", valign: "middle", margin: 0 }, text: "Slide Title" } },
      ],
    });

    const clw = 3.2;
    this.pres.defineSlideMaster({
      title: "CL_CONTACT", background: bg, objects: [
        { image: { path: CLARITY_LOGO, x: 5.15, y: 2.3, w: clw, h: clw / CLARITY_RATIO } },
      ],
    });
  }

  slide(master, title, sources) {
    const s = this.pres.addSlide({ masterName: master });
    if (title) s.addText(title, { placeholder: "title" });
    if (sources && sources.length) s.addNotes("Sources:\n" + sources.map((x) => "- " + x).join("\n"));
    return s;
  }

  text(s, runs, opts) {
    s.addText(runs, { isTextBox: true, color: this.C.background2, fontSize: 14, margin: 0, valign: "top", paraSpaceAfter: 9, ...opts });
  }

  paras(list) {
    return list.map((p, i) => ({ text: p, options: { breakLine: i < list.length - 1 } }));
  }

  // ---------- page types ----------

  cover({ role, location, sources }) {
    const s = this.slide("CL_COVER", null, sources);
    s.addText(role, { placeholder: "title" });
    s.addText(location.toUpperCase(), { placeholder: "body" });
  }

  divider({ title, sources }) {
    this.slide("CL_DIVIDER", title, sources);
  }

  // Text column plus one featured person (founder intro).
  profileIntro({ title, paragraphs, person, sources }) {
    const s = this.slide("CL_CONTENT", title, sources);
    this.text(s, this.paras(paragraphs), { x: M, y: CONTENT_Y, w: 6.6, h: CONTENT_BOTTOM - CONTENT_Y, fontSize: 15.5, paraSpaceAfter: 14 });
    const d = 2.9, px = 7.95 + (3.14 - d) / 2;
    s.addImage({ path: person.photo, x: px, y: 2.55, w: d, h: d, rounding: true, objectName: "Person photo" });
    s.addText(person.name, { isTextBox: true, x: 7.75, y: 5.6, w: 3.4, h: 0.45, fontSize: 18, bold: true, color: this.C.accent1, align: "center", margin: 0 });
    s.addText(person.title, { isTextBox: true, x: 7.75, y: 6.05, w: 3.4, h: 0.4, fontSize: 14, color: this.C.background1, align: "center", margin: 0 });
  }

  // Grid of circular headshots. Optional tag line under a person (e.g. "Reports to this role").
  teamGrid({ title, intro, people, sources }) {
    const s = this.slide("CL_CONTENT", title, sources);
    let y = CONTENT_Y;
    if (intro) {
      this.text(s, intro, { x: M, y, w: W - 2 * M, h: 0.45 });
      y += 0.6;
    }
    const perRow = people.length > 5 ? Math.ceil(people.length / 2) : people.length;
    const rows = Math.ceil(people.length / perRow);
    const colW = (W - 2 * M) / perRow;
    const d = rows > 1 ? 1.35 : 1.75;
    const rowH = rows > 1 ? (CONTENT_BOTTOM - y) / 2 : CONTENT_BOTTOM - y;
    people.forEach((p, i) => {
      const r = Math.floor(i / perRow), c = i % perRow;
      const inRow = Math.min(perRow, people.length - r * perRow);
      const offset = ((perRow - inRow) * colW) / 2;
      const cx = M + offset + c * colW;
      const py = y + r * rowH;
      s.addImage({ path: p.photo, x: cx + (colW - d) / 2, y: py, w: d, h: d, rounding: true, objectName: p.name });
      s.addText(p.name, { isTextBox: true, x: cx + 0.05, y: py + d + 0.1, w: colW - 0.1, h: 0.32, fontSize: 13, bold: true, color: this.C.accent1, align: "center", margin: 0 });
      s.addText(p.title, { isTextBox: true, x: cx + 0.05, y: py + d + 0.42, w: colW - 0.1, h: 0.5, fontSize: 11, color: this.C.background1, align: "center", valign: "top", margin: 0 });
      if (p.tag) s.addText(p.tag, { isTextBox: true, x: cx + 0.05, y: py + d + 0.82, w: colW - 0.1, h: 0.28, fontSize: 10, italic: true, color: this.C.accent2, align: "center", margin: 0 });
    });
  }

  // Row of stat cards, then supporting bullets.
  async stats({ title, stats, bullets, sources }) {
    const s = this.slide("CL_CONTENT", title, sources);
    const n = stats.length, gap = 0.3;
    const cw = (W - 2 * M - gap * (n - 1)) / n, ch = 1.55;
    stats.forEach((st, i) => {
      const x = M + i * (cw + gap);
      s.addShape(this.pres.shapes.ROUNDED_RECTANGLE, { x, y: CONTENT_Y, w: cw, h: ch, rectRadius: 0.08, fill: { color: this.C.text2 }, line: { color: this.C.accent3, width: 0.75 }, objectName: "Stat card" });
      s.addText(st.value, { isTextBox: true, x: x + 0.15, y: CONTENT_Y + 0.18, w: cw - 0.3, h: 0.7, fontSize: 28, bold: true, color: this.C.accent1, align: "center", valign: "middle", margin: 0 });
      s.addText(st.label, { isTextBox: true, x: x + 0.15, y: CONTENT_Y + 0.9, w: cw - 0.3, h: 0.5, fontSize: 12, color: this.C.background1, align: "center", valign: "top", margin: 0 });
    });
    if (bullets && bullets.length) await this.iconRows(s, bullets, CONTENT_Y + ch + 0.45, "LuChevronRight");
  }

  // Icon + text rows with an even gap between items. Row height is estimated from line count
  // (measured with Poppins metrics), then the font steps down until the block fits.
  async iconRows(s, items, y0, iconName, fontSize = 15) {
    const ic = await icon(iconName);
    const textW = W - 2 * M - 0.45, gap = 0.26;
    const heights = (fs) => items.map((t) => lineCount(t, textW, fs) * (fs * 1.32) / 72);
    let fs = fontSize, hs = heights(fs);
    while (fs > 13 && hs.reduce((a, b) => a + b, 0) + gap * (items.length - 1) > CONTENT_BOTTOM - y0) { fs -= 0.5; hs = heights(fs); }
    let y = y0;
    items.forEach((t, i) => {
      const iconSize = fs / 72 * 1.25;
      s.addImage({ data: ic, x: M, y: y + 0.02, w: iconSize, h: iconSize });
      s.addText(t, { isTextBox: true, x: M + 0.45, y, w: textW, h: hs[i] + 0.05, fontSize: fs, color: this.C.background1, valign: "top", margin: 0 });
      y += hs[i] + gap;
    });
  }

  async bullets({ title, intro, items, iconName = "LuChevronRight", sources }) {
    const s = this.slide("CL_CONTENT", title, sources);
    let y = CONTENT_Y;
    if (intro) {
      this.text(s, intro, { x: M, y, w: W - 2 * M, h: 0.55, color: this.C.accent1, fontSize: 15 });
      y += 0.75;
    }
    await this.iconRows(s, items, y, iconName);
  }

  // Bold gold label + description. One or two columns.
  labelList({ title, subtitle, items, columns = 1, sources, fontSize = 13 }) {
    const s = this.slide("CL_CONTENT", title, sources);
    let y = CONTENT_Y;
    if (subtitle) {
      s.addText(subtitle, { isTextBox: true, x: M, y: y - 0.15, w: W - 2 * M, h: 0.4, fontSize: 15, color: this.C.background1, margin: 0 });
      y += 0.45;
    }
    const gap = 0.45;
    const colW = (W - 2 * M - gap * (columns - 1)) / columns;
    const perCol = Math.ceil(items.length / columns);
    for (let c = 0; c < columns; c++) {
      const chunk = items.slice(c * perCol, (c + 1) * perCol);
      const runs = [];
      chunk.forEach((it, i) => {
        runs.push({ text: it.label + ": ", options: { bold: true, color: this.C.accent1 } });
        runs.push({ text: it.text, options: { breakLine: i < chunk.length - 1 } });
      });
      this.text(s, runs, { x: M + c * (colW + gap), y, w: colW, h: CONTENT_BOTTOM - y, fontSize, paraSpaceAfter: Math.round(fontSize * 1.3), color: this.C.background1 });
    }
  }

  // Grid of icon cards (sectors, benefits, pitch points).
  async iconCards({ title, intro, cards, perRow = 3, sources }) {
    const s = this.slide("CL_CONTENT", title, sources);
    let y = CONTENT_Y;
    if (intro) {
      this.text(s, intro, { x: M, y, w: W - 2 * M, h: 0.9, color: this.C.background1 });
      y += 1.0;
    }
    const rows = Math.ceil(cards.length / perRow), gap = 0.3;
    const cw = (W - 2 * M - gap * (perRow - 1)) / perRow;
    const ch = (CONTENT_BOTTOM - y - gap * (rows - 1)) / rows;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const x = M + (i % perRow) * (cw + gap), cy = y + Math.floor(i / perRow) * (ch + gap);
      s.addShape(this.pres.shapes.ROUNDED_RECTANGLE, { x, y: cy, w: cw, h: ch, rectRadius: 0.08, fill: { color: this.C.text2 }, line: { color: this.C.accent3, width: 0.75 }, objectName: "Card " + card.title });
      s.addImage({ data: await icon(card.icon), x: x + 0.25, y: cy + 0.22, w: 0.42, h: 0.42 });
      s.addText(card.title, { isTextBox: true, x: x + 0.8, y: cy + 0.2, w: cw - 1.0, h: 0.46, fontSize: 14, bold: true, color: this.C.accent1, valign: "middle", margin: 0 });
      if (card.text) s.addText(card.text, { isTextBox: true, x: x + 0.25, y: cy + 0.78, w: cw - 0.5, h: ch - 0.9, fontSize: perRow <= 2 ? 15 : 13, color: this.C.background1, valign: "top", margin: 0 });
    }
  }

  // Vision / mission statements plus value pills.
  statementsAndPills({ title, statements, pillsTitle, pills, sources }) {
    const s = this.slide("CL_CONTENT", title, sources);
    const runs = [];
    statements.forEach((st, i) => {
      runs.push({ text: st.label + ": ", options: { bold: true, color: this.C.accent1 } });
      runs.push({ text: st.text, options: { breakLine: i < statements.length - 1 } });
    });
    this.text(s, runs, { x: M, y: CONTENT_Y, w: W - 2 * M, h: 2.2, fontSize: 18, paraSpaceAfter: 16, color: this.C.background1 });
    s.addText(pillsTitle, { isTextBox: true, x: M, y: 5.0, w: W - 2 * M, h: 0.55, fontSize: 22, bold: true, color: this.C.accent1, margin: 0 });
    const pw = 2.35, gap = 0.3, ph = 0.62;
    const perRow = Math.min(pills.length, 4);
    pills.forEach((p, i) => {
      const r = Math.floor(i / perRow), c = i % perRow;
      const inRow = Math.min(perRow, pills.length - r * perRow);
      const x0 = M;
      s.addShape(this.pres.shapes.ROUNDED_RECTANGLE, { x: x0 + c * (pw + gap), y: 5.8 + r * (ph + 0.3), w: pw, h: ph, rectRadius: 0.31, fill: { color: this.C.background1, transparency: 100 }, line: { color: this.C.background1, width: 1.5 }, objectName: "Value " + p });
      s.addText(p, { isTextBox: true, x: x0 + c * (pw + gap), y: 5.8 + r * (ph + 0.3), w: pw, h: ph, fontSize: 14, color: this.C.background1, align: "center", valign: "middle", margin: 0 });
      void inRow;
    });
  }

  contact({ recruiter, sources }) {
    const s = this.slide("CL_CONTACT", null, sources);
    const d = 2.6;
    s.addImage({ path: recruiter.photo, x: 1.75, y: 2.6, w: d, h: d, rounding: true, objectName: recruiter.name });
    s.addText(recruiter.name.toUpperCase(), { isTextBox: true, x: 5.15, y: 3.55, w: 5.5, h: 0.6, fontSize: 24, bold: true, color: this.C.accent1, charSpacing: 2, margin: 0 });
    const rows = [];
    if (recruiter.phone) rows.push(recruiter.phone);
    rows.push(recruiter.email);
    s.addText(rows.join("\n"), { isTextBox: true, x: 5.15, y: 4.3, w: 5.5, h: 1.0, fontSize: 16, color: this.C.background1, paraSpaceAfter: 8, margin: 0, valign: "top" });
  }

  async write(file) {
    await this.pres.writeFile({ fileName: file });
    await applyTheme(file, THEME);
    return file;
  }
}

module.exports = { ClarityDeck, HEX, THEME };
