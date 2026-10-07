---
name: "clarity-frontsheet"
description: "Generate a branded, one-page Clarity R2R candidate cover sheet (\"frontsheet\") as a PDF, pulled fresh from Loxo — named (client) and/or anonymized versions. Use when someone asks for a frontsheet / cover sheet for a candidate."
---

# clarity-frontsheet — Clarity R2R candidate cover sheet (CoWork build)

Generate a branded, one-page Clarity R2R cover sheet as a PDF, pulled fresh from Loxo. Supports a
**named (client) version** and an **anonymized version**. R2R house style: gold-on-black,
metric-first, English.

**Connectors + sandbox code.** Candidate data comes from the **Loxo MCP** — no API keys, no local
`.env`. The PDF is rendered by `scripts/render_frontsheet.py` using **Playwright + Chromium** inside
the CoWork sandbox, which replaces the local-Chrome renderer the Claude Code build uses.

**One-time sandbox setup** (only needed if the render step reports Playwright missing):

```bash
pip install playwright --break-system-packages
playwright install chromium --with-deps
```

| Path | Purpose |
|---|---|
| `web/template.html` | Tokenized single-page template (inline CSS, auto-fits to one A4 page). |
| `web/assets/clarity-r2r.png` | Logo (transparent, white on dark). |
| `web/assets/poppins-{400,600,700}.ttf` | Embedded font (offline-safe). |
| `scripts/render_frontsheet.py` | Fills the template from a content JSON → HTML + PDF per variant. |
| `scripts/bundle_frontsheets.py` | Merges several candidates into one multi-page PDF (pypdf). |
| `recruiters.json` | Per-run recruiter contacts (james, marcus, josh; add others as used). |
| `output/{slug}/` | `named.pdf` / `anonymized.pdf` per candidate (created on run). |

## Brand colours — locked

| Token | Value | Notes |
|---|---|---|
| Background | `#111111` | |
| **Brand gold/yellow** | **`#FFC500`** | The real Clarity R2R yellow, sampled from the brand wordmark. **Use this everywhere.** |
| Text | `#F0F0F0` | |
| Muted | `#8A8A8A` | |
| Typeface | Poppins | 400 / 600 / 700 only |

`web/template.html` ships with `#FFC500`. The skill directory is mounted read-only, so **every run
renders from a writable copy** — see Phase 4. Any other Clarity artwork built outside this skill (LinkedIn cards, one-pagers, decks) uses
`#FFC500` directly.

**Do not restyle** anything else — only fill content.

---

## Workflow — run phases in order, checkpoint with the user between them.

### PHASE 1: Input (ask, don't assume)

1. **Output mode** — **required:** `single` (one candidate → its own PDF) or `bundle` (several
   candidates merged into one branded multi-page PDF). For a bundle, collect the ordered list.
2. **Candidate(s)** — name(s) or Loxo person id(s).
3. **Which version?** — **required:** `anonymized` / `named` / `both`. Only author and render what's
   asked. A bundle uses one variant throughout — usually `anonymized`.
4. **Recruiter** — **required, no default.** Whose contact goes in the footer? Offer the keys in
   `recruiters.json`. For a new recruiter, collect `name/email/phone` and add them to the working
   copy of that file.

Show a one-line summary and confirm before pulling.

### PHASE 2: Pull from Loxo (MCP)

```
people_index(query: '"<full name>"', per_page: 10)     # find the id
people_show(id: <person_id>)                            # description, current role, location
person_job_profiles_index(person_id: <id>)              # career progression
person_events_index(person_id: <id>, per_page: 20)      # call notes
resumes_index / resumes_download                        # CV, when one exists
```

The richest R2R metrics live in the person's `description` and in the job-profile descriptions.

**Candidate-vs-client guard:** not every Loxo record is a placeable candidate. Some are *clients*
(e.g. a company's CEO logged from an intro call). If the record reads as a hiring contact rather than
someone Clarity would market, stop and confirm with the user before generating.

**Confidentiality guard:** call notes often hold sensitive intake detail — comp, visa status,
relocation constraints, career motivations, equity/LTIP. **NEVER** put those on a candidate-facing
sheet. Use notes ONLY for business-performance facts: team size, revenue/EBITDA, GP, billings, market
focus, structure.

### PHASE 3: Author content JSON (Clarity R2R voice)

Write `output/{slug}/content.json`:

```json
{
  "slug": "kebab-case-role-or-name",
  "name": "Full Name",
  "recruiter": { "name": "...", "email": "...", "phone": "..." },
  "tagline": "we place recruitment leadership",
  "achievements_heading": "KEY ACHIEVEMENTS",
  "variants": {
    "named":      { "title": "...", "subtitle": "Sector · Location · Yrs exp", "highlights": ["..."], "achievements": ["..."] },
    "anonymized": { "title": "...", "subtitle": "...", "highlights": ["..."], "achievements": ["..."] }
  }
}
```

**Voice rules (match the house style):**

- **Title** = role headline, not a name (e.g. "Senior Billing Director & Team Leader"). The named
  variant automatically leads with `name` and drops the title to a line beneath; the anonymized
  variant keeps the role as the gold title and never renders a name.
- **Subtitle** = `Sector · Location · Yrs exp`. Omit if unknown.
- **Highlights**: 6–8 bullets. **Achievements**: 6–10 bullets. One fact per line, metric-first. The
  template auto-fits to one A4 page but keep within these counts so it never shrinks hard.
- Lead with numbers: billings/GP, team size, revenue, % self-generated new business, tenure,
  perm/contract split, sectors, awards. No filler adjectives, no "results-driven / proven track
  record" recruiter-speak.
- **Anonymized**: remove the name AND replace the current employer with a descriptor ("a national F&A
  staffing business", "a mid-range consultancy (192 heads)"); keep every metric. Footer contact stays
  on in both.
- Everything in **English**.

**A thin record makes a thin sheet.** If the candidate has no billing numbers and no CV, say so
before rendering — a generic sheet is worse than none, and the fix is a better record, not better
adjectives.

Show the drafted bullets to the user and confirm before rendering.

### PHASE 4: Render (always from a writable copy)

The skill directory is read-only, so copy the runtime into the working directory first. `render_frontsheet.py` resolves
`web/` relative to its own parent, so keep `scripts/` and `web/` siblings in the copy.

```bash
SKILL_DIR="<this skill's directory>"      # the path this SKILL.md was read from
cp -r "$SKILL_DIR/scripts" "$SKILL_DIR/web" "$SKILL_DIR/recruiters.json" .

python3 scripts/render_frontsheet.py "output/{slug}/content.json" --variant both
```

Outputs `output/{slug}/{variant}.html` + `{variant}.pdf`. The script fails loudly on any unfilled
`{{TOKEN}}`. For a **bundle**, render every candidate first (Phases 2–4 each), then merge:

```bash
python3 scripts/bundle_frontsheets.py --out <bundle-name> --variant anonymized --slugs slug-a slug-b
```

→ `output/_bundles/<bundle-name>.pdf`, one page per candidate in the given order.

**If Chromium won't install** (`playwright install chromium` blocked by the sandbox network
allowlist), the PDF path is unavailable. Say so rather than shipping an unstyled fallback — the
HTML is still written to `output/{slug}/` and can be printed to PDF from a browser.

### PHASE 5: Review

- **Brand check:** confirm the rendered HTML contains `#FFC500` and no `#F8C000`.
- **One-page check:** every PDF must be exactly 1 page with the footer on it.
- **Anonymized leak check** — extract the rendered PDF's text and confirm the candidate's name, real
  employer and school do **not** appear, and that no confidential intake term (visa, comp figures,
  LTIP, relocation motive) appears in **either** version. Check the extracted PDF text, not the HTML
  — the embedded base64 font blob causes false positives in HTML.
- Confirm the footer email/phone are the chosen recruiter's.
- Report the output paths and offer the files to the user.

---

## Notes

- Self-contained: fonts and logo are base64-embedded into each output HTML, so PDFs render
  identically with no network access.
- **PDF only** — no web hosting.
- To add a recruiter, append `{ "name", "email", "phone" }` under a new key in the working copy of
  `recruiters.json` (the skill's own copy is read-only).
- Phone in the footer is auto-stripped to digits for the `tel:` link; keep the display format
  (e.g. `+1 786 673-4942`) in the JSON.
- Brand gold provenance: sampled from the Clarity R2R wordmark artwork (core pixels average
  rgb(251, 198, 12) → `#FFC500`). If the Canva brand kit ever states a different hex, that wins —
  update this file and the copy-and-patch step in Phase 4.

