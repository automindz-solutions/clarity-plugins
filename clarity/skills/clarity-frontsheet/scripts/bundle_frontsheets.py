#!/usr/bin/env python3
"""
bundle_frontsheets.py — merge per-candidate frontsheet PDFs into one branded multi-page file.

CoWork build: uses pypdf (already present in this runtime for the pdf skill) rather than PyMuPDF,
so there is nothing extra to install. Link annotations (tel:/mailto:) are preserved.

Usage:
    python3 bundle_frontsheets.py --out chicago-2026 --variant anonymized --slugs a b c
    python3 bundle_frontsheets.py --out chicago-2026 --pdfs /abs/one.pdf /abs/two.pdf
"""

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "output"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="bundle name (no extension)")
    ap.add_argument("--variant", default="anonymized", choices=["named", "anonymized"])
    ap.add_argument("--slugs", nargs="*", default=[], help="candidate slugs, in the order you want")
    ap.add_argument("--pdfs", nargs="*", default=[], help="explicit PDF paths instead of slugs")
    ap.add_argument("--outdir", default=str(OUTPUT / "_bundles"))
    args = ap.parse_args()

    try:
        from pypdf import PdfWriter
    except ImportError:
        raise SystemExit("pypdf not available. Install with: pip install pypdf --break-system-packages")

    if args.pdfs:
        paths = [Path(p) for p in args.pdfs]
    else:
        paths = [OUTPUT / s / f"{args.variant}.pdf" for s in args.slugs]
    if not paths:
        raise SystemExit("Nothing to merge — pass --slugs or --pdfs.")

    missing = [p for p in paths if not p.exists()]
    if missing:
        raise SystemExit("Missing PDF(s):\n  " + "\n  ".join(str(m) for m in missing))

    out_dir = Path(args.outdir)
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / f"{args.out}.pdf"

    writer = PdfWriter()
    for p in paths:
        writer.append(str(p))
    with open(target, "wb") as fh:
        writer.write(fh)

    print(f"OK {len(paths)} page(s) -> {target}")


if __name__ == "__main__":
    main()
