#!/usr/bin/env python3
"""
render_options.py — fill web/template.html from a content JSON and render the options PDF.

Usage:
    python3 render_options.py <content.json> [--outdir DIR]

One-time setup in the CoWork sandbox (only if Playwright is missing):
    pip install playwright --break-system-packages
    playwright install chromium --with-deps

content.json schema:
{
  "slug": "jane-doe-options",
  "candidate": {"name": "Jane Doe", "first_name": "Jane"},
  "recruiter": {"name": "...", "email": "...", "phone": "..."},
  "as_of": "6 October 2026",
  "intro": "Opening paragraph, written to the candidate.",
  "companies": [
    {
      "name": "LHi Group",
      "type": "Employee-Owned Multi-Brand Group",      // table: Type
      "size": "450 globally, 200 in the US",           // table: Size
      "core_markets": "Tech, life sciences, ...",      // table: Core Markets
      "standout": "Six-figure stake for every employee",
      "descriptor": "Employee-Owned Multi-Brand Group", // optional; card line, defaults to type
      "urls": ["wearelhi.com"],
      "locations": ["London", "New York", "Miami"],
      "pitch": "Two-sentence lead with the strongest numbers.",
      "bullets": [{"label": "Global Reach", "text": "450 staff, ..."}],
      "fit": "Why this firm suits this candidate, written to them."
    }
  ],
  "sources": "wearelhi.com; Hunt Scanlon Media, 27 March 2026; ...",
  "never_print": ["$180k", "H-1B"]                      // optional; confidential strings
}
"""

import argparse
import base64
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
ASSETS = WEB / "assets"

TAGLINE = "we place recruitment leadership"
FIT_LABEL = "WHY IT FITS YOU"
MIN_COMPANIES, MAX_COMPANIES = 2, 6
MIN_BULLETS, MAX_BULLETS = 3, 6
TABLE_FIELDS = ("name", "type", "size", "core_markets", "standout")
CARD_FIELDS = ("pitch", "bullets", "fit")


def esc(s) -> str:
    return str("" if s is None else s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def font_faces() -> str:
    def face(weight: int, filename: str) -> str:
        b64 = base64.b64encode((ASSETS / filename).read_bytes()).decode()
        return (
            f"@font-face{{font-family:'Poppins';font-style:normal;font-weight:{weight};"
            f"src:url(data:font/ttf;base64,{b64}) format('truetype');}}"
        )

    return "\n".join([
        face(400, "poppins-400.ttf"),
        face(600, "poppins-600.ttf"),
        face(700, "poppins-700.ttf"),
    ])


def logo_data_uri() -> str:
    b64 = base64.b64encode((ASSETS / "clarity-r2r.png").read_bytes()).decode()
    return f"data:image/png;base64,{b64}"


def validate(data: dict) -> None:
    errors = []
    recruiter = data.get("recruiter") or {}
    for key in ("name", "email"):
        if not recruiter.get(key):
            errors.append(f"recruiter.{key} is required")
    if not (data.get("candidate") or {}).get("first_name"):
        errors.append("candidate.first_name is required")
    for key in ("slug", "as_of", "intro", "sources"):
        if not data.get(key):
            errors.append(f"{key} is required")

    companies = data.get("companies") or []
    if not MIN_COMPANIES <= len(companies) <= MAX_COMPANIES:
        errors.append(f"companies: need {MIN_COMPANIES}-{MAX_COMPANIES}, got {len(companies)}")
    for i, c in enumerate(companies):
        tag = c.get("name") or f"companies[{i}]"
        for key in TABLE_FIELDS + CARD_FIELDS:
            if not c.get(key):
                errors.append(f"{tag}: {key} is required")
        bullets = c.get("bullets") or []
        if bullets and not MIN_BULLETS <= len(bullets) <= MAX_BULLETS:
            errors.append(f"{tag}: need {MIN_BULLETS}-{MAX_BULLETS} bullets, got {len(bullets)}")
        for b in bullets:
            if not b.get("label") or not b.get("text"):
                errors.append(f"{tag}: every bullet needs a label and text")
    if errors:
        raise SystemExit("content.json is not ready:\n  - " + "\n  - ".join(errors))


def table_block(companies) -> str:
    rows = "\n".join(
        "        <tr>"
        f'<td class="biz">{esc(c["name"])}</td><td>{esc(c["type"])}</td><td>{esc(c["size"])}</td>'
        f'<td>{esc(c["core_markets"])}</td><td>{esc(c["standout"])}</td>'
        "</tr>"
        for c in companies
    )
    return (
        '    <div class="block" data-name="comparison table">\n'
        '      <table class="compare">\n'
        "        <tr><th>Business</th><th>Type</th><th>Size</th><th>Core Markets</th><th>Standout</th></tr>\n"
        f"{rows}\n"
        "      </table>\n"
        "    </div>"
    )


def card_block(c: dict) -> str:
    descriptor = esc(c.get("descriptor") or c["type"])
    urls = " · ".join(f'<span class="url">{esc(u)}</span>' for u in (c.get("urls") or []))
    if urls:
        descriptor = f"{descriptor} · {urls}"
    locations = " · ".join(esc(str(loc).upper()) for loc in (c.get("locations") or []))
    locations_line = f'\n      <div class="locations">{locations}</div>' if locations else ""
    bullets = "\n".join(
        f'        <li><b>{esc(b["label"])}</b> {esc(b["text"])}</li>' for b in c["bullets"]
    )
    return (
        f'    <div class="block card" data-name="{esc(c["name"])}">\n'
        f'      <h2>{esc(c["name"])}</h2>\n'
        f'      <div class="descriptor">{descriptor}</div>{locations_line}\n'
        f'      <p class="pitch">{esc(c["pitch"])}</p>\n'
        f"      <ul>\n{bullets}\n      </ul>\n"
        f'      <div class="fit"><div class="label">{FIT_LABEL}</div><p>{esc(c["fit"])}</p></div>\n'
        "    </div>"
    )


def build_html(data: dict) -> str:
    recruiter = data["recruiter"]
    companies = data["companies"]
    blocks = [
        '    <div class="block intro" data-name="intro">'
        f'<span class="hello">{esc(data["candidate"]["first_name"])},</span> {esc(data["intro"])}</div>',
        table_block(companies),
        *[card_block(c) for c in companies],
        '    <div class="block sources" data-name="sources">'
        f'Sources: {esc(data["sources"])}. Other figures come from Clarity R2R\'s market conversations '
        f'with each business. Confirm them at interview stage. Correct as of {esc(data["as_of"])}.</div>',
    ]
    mapping = {
        "{{FONT_FACES}}": font_faces(),
        "{{LOGO_SRC}}": logo_data_uri(),
        "{{TITLE}}": esc(f'Options for {data["candidate"].get("name") or data["candidate"]["first_name"]}'),
        "{{BLOCKS}}": "\n".join(blocks),
        "{{FOOTER_CONTACT}}": " · ".join(esc(recruiter[k]) for k in ("name", "email", "phone") if recruiter.get(k)),
        "{{TAGLINE}}": TAGLINE,
    }
    # Single pass, so token-like text inside the authored content is never substituted.
    tpl = (WEB / "template.html").read_text(encoding="utf-8")
    pattern = re.compile(r"\{\{[A-Z_]+\}\}")
    unknown = set(pattern.findall(tpl)) - set(mapping)
    if unknown:
        raise SystemExit(f"Unknown template tokens: {', '.join(sorted(unknown))}")
    return pattern.sub(lambda m: mapping[m.group(0)], tpl)


def render(html_path: Path, pdf_path: Path, never_print) -> dict:
    """Render with Playwright's bundled Chromium, then read back what actually got laid out."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit(
            "Playwright is not installed. Run:\n"
            "  pip install playwright --break-system-packages\n"
            "  playwright install chromium --with-deps"
        )

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page()
            page.goto(html_path.resolve().as_uri(), wait_until="load")
            # The template packs its pages once the embedded fonts are ready.
            page.wait_for_selector("html[data-pages]", state="attached")
            root = page.locator("html")
            pages = int(root.get_attribute("data-pages") or 0)
            oversize = [n for n in (root.get_attribute("data-oversize") or "").split("|") if n]
            text = page.inner_text("body")
            clipped = page.evaluate(
                "() => [...document.querySelectorAll('.page .body')]"
                ".map((b, i) => b.scrollHeight > b.clientHeight ? i + 1 : 0).filter(Boolean)"
            )
            page.pdf(
                path=str(pdf_path),
                format="A4",
                print_background=True,
                prefer_css_page_size=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            )
        finally:
            browser.close()

    leaks = [s for s in (never_print or []) if s and s.lower() in text.lower()]
    non_usd = sorted(set(re.findall(r"[£€]\s?[\d.,]+\s?[kmbn]*", text)))
    return {"pages": pages, "oversize": oversize, "clipped": clipped, "leaks": leaks, "non_usd": non_usd}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("content")
    ap.add_argument("--outdir", default="output")
    args = ap.parse_args()

    data = json.loads(Path(args.content).read_text(encoding="utf-8"))
    validate(data)

    out_dir = Path(args.outdir) / data["slug"]
    out_dir.mkdir(parents=True, exist_ok=True)
    html_path = out_dir / "options.html"
    pdf_path = out_dir / "options.pdf"
    html_path.write_text(build_html(data), encoding="utf-8")

    result = render(html_path, pdf_path, data.get("never_print"))
    print(f"OK {pdf_path} ({result['pages']} pages, {len(data['companies'])} companies)")

    if result["non_usd"]:
        print(f"WARN non-USD figures, convert or confirm for a US reader: {', '.join(result['non_usd'])}")

    failed = False
    if result["oversize"]:
        failed = True
        print(f"FAIL too long for one page, shorten: {', '.join(result['oversize'])}")
    if result["clipped"] and not result["oversize"]:
        failed = True
        print(f"FAIL content clipped on page(s): {', '.join(map(str, result['clipped']))}")
    if result["leaks"]:
        failed = True
        print(f"FAIL confidential text in the document: {', '.join(result['leaks'])}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
