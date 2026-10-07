#!/usr/bin/env python3
"""
render_frontsheet.py — fill template.html from a content JSON and render PDF(s) with Playwright.

CoWork build: replaces the Node + local-Chrome renderer used by the Claude Code version.
Output is byte-for-byte the same house style — same template, same embedded fonts, same logo.

Usage:
    python3 render_frontsheet.py <content.json> [--variant named|anonymized|both] [--outdir DIR]

One-time setup in the CoWork sandbox:
    pip install playwright --break-system-packages
    playwright install chromium --with-deps

content.json schema:
{
  "slug": "senior-billing-director",
  "name": "Jane Doe",                                  // optional; used by the NAMED variant only
  "recruiter": {"name": "...", "email": "...", "phone": "..."},
  "tagline": "we place recruitment leadership",        // optional
  "achievements_heading": "KEY ACHIEVEMENTS",          // optional
  "variants": {
    "named":      {"title": "...", "subtitle": "...", "highlights": [...], "achievements": [...]},
    "anonymized": {"title": "...", "subtitle": "...", "highlights": [...], "achievements": [...]}
  }
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

DEFAULT_TAGLINE = "we place recruitment leadership"
DEFAULT_HEADING = "KEY ACHIEVEMENTS"


def esc(s) -> str:
    """Match the JS renderer's escaping exactly: & < > only."""
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


def li_list(items) -> str:
    return "\n      ".join(f"<li>{esc(t)}</li>" for t in (items or []))


def fill_template(tpl: str, data: dict, recruiter: dict, variant: str, fonts: str, logo: str) -> str:
    v = data["variants"].get(variant)
    if not v:
        raise SystemExit(f'Variant "{variant}" missing in content JSON')

    phone_raw = re.sub(r"[^\d+]", "", str(recruiter.get("phone") or ""))

    # Named/client version leads with the candidate's name; the role drops to a line beneath.
    # Anonymized keeps the role as the gold title and never renders a name.
    named = variant == "named" and data.get("name")
    title_text = data["name"] if named else v.get("title")
    role_block = f'<p class="role">{esc(v.get("title"))}</p>' if named else ""
    subtitle_block = f'<p class="subtitle">{esc(v["subtitle"])}</p>' if v.get("subtitle") else ""

    mapping = {
        "{{FONT_FACES}}": fonts,
        "{{LOGO_SRC}}": logo,
        "{{TITLE}}": esc(title_text),
        "{{ROLE_BLOCK}}": role_block,
        "{{SUBTITLE_BLOCK}}": subtitle_block,
        "{{HIGHLIGHT_ITEMS}}": li_list(v.get("highlights")),
        "{{ACHIEVEMENTS_HEADING}}": esc(data.get("achievements_heading") or DEFAULT_HEADING),
        "{{ACHIEVEMENT_ITEMS}}": li_list(v.get("achievements")),
        "{{RECRUITER_EMAIL}}": esc(recruiter.get("email")),
        "{{RECRUITER_PHONE}}": esc(recruiter.get("phone")),
        "{{RECRUITER_PHONE_RAW}}": esc(phone_raw),
        "{{TAGLINE}}": esc(data.get("tagline") or DEFAULT_TAGLINE),
    }
    out = tpl
    for k, val in mapping.items():
        out = out.replace(k, val)

    leftover = set(re.findall(r"\{\{[A-Z_]+\}\}", out))
    if leftover:
        raise SystemExit(f"Unfilled tokens: {', '.join(sorted(leftover))}")
    return out


def html_to_pdf(html_path: Path, pdf_path: Path) -> None:
    """Render with Playwright's bundled Chromium. The template sets @page{size:A4;margin:0}."""
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
            # Fonts are embedded as data URIs, but give the auto-fit script a beat to settle.
            page.wait_for_timeout(300)
            page.pdf(
                path=str(pdf_path),
                format="A4",
                print_background=True,
                prefer_css_page_size=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            )
        finally:
            browser.close()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("content")
    ap.add_argument("--variant", default="both", choices=["named", "anonymized", "both"])
    ap.add_argument("--outdir", default=str(ROOT / "output"))
    args = ap.parse_args()

    data = json.loads(Path(args.content).read_text(encoding="utf-8"))
    recruiter = data.get("recruiter") or {}
    if not recruiter.get("email") or not recruiter.get("phone"):
        raise SystemExit("content.recruiter must include email and phone (required per-run input).")

    tpl = (WEB / "template.html").read_text(encoding="utf-8")
    fonts, logo = font_faces(), logo_data_uri()

    wanted = list(data["variants"].keys()) if args.variant == "both" else [args.variant]
    out_dir = Path(args.outdir) / data["slug"]
    out_dir.mkdir(parents=True, exist_ok=True)

    made = []
    for variant in wanted:
        if variant not in data["variants"]:
            print(f'Skipping "{variant}" — not present in content JSON.')
            continue
        html = fill_template(tpl, data, recruiter, variant, fonts, logo)
        html_path = out_dir / f"{variant}.html"
        pdf_path = out_dir / f"{variant}.pdf"
        html_path.write_text(html, encoding="utf-8")
        html_to_pdf(html_path, pdf_path)
        made.append(pdf_path)
        print(f"OK {variant} -> {pdf_path}")

    print(f"\nDone: {len(made)} PDF(s) in {out_dir}")


if __name__ == "__main__":
    main()
