---
name: "clarity-logo"
description: "The Clarity R2R logo and the rule that every Clarity R2R-branded output starts with it. Use together with clarity-house-style whenever making ANY Clarity R2R-branded page, sheet, PDF, deck, one-pager, graphic or document."
---

# Clarity R2R logo - always at the top

Use this alongside `clarity-house-style` on EVERY Clarity R2R-branded output (prep sheets, one-pagers, HTML pages/artifacts, PDFs, frontsheets, options docs, decks, LinkedIn graphics, documents).

## The rule

- **Every branded output starts with the real Clarity R2R logo**, centred at the top.
- **Never** replace the logo with typed text such as "CLARITY R2R" or a made-up wordmark. If the logo can't be placed for any reason, stop and tell James rather than faking it.
- Size: about 300-340px wide on a page (roughly 30-40% of the page width), never stretched to the edges, with clear space either side and a small gap below.
- The logo is **white on a transparent background**, so it must sit on the dark Clarity background (#111111 or #1C1C1C). On a white/light background it will be invisible - use a dark band behind it.
- Keep the original proportions (850 x 115 px).

## Where to get it - always copy the real file, never retype base64

The correct logo file ships inside the Clarity plugin:

- `clarity-frontsheet/web/assets/clarity-r2r.png` (850 x 115, the one to use)
- backup: `clarity-options/web/assets/clarity-r2r.png` (333 x 101, tighter crop)

**Never type or paste the logo's base64 text by hand.** A single wrong character breaks the image (this is what caused the broken logo before). Always build it from the file with code.

Find and check the file in the shell:

```bash
LOGO=$(find / -path '*clarity-frontsheet/web/assets/clarity-r2r.png' 2>/dev/null | head -1)
[ -z "$LOGO" ] && LOGO=$(find / -path '*clarity-options/web/assets/clarity-r2r.png' 2>/dev/null | head -1)
python3 -c "from PIL import Image;im=Image.open('$LOGO');im.load();print('logo OK',im.size)"
```

1. **HTML pages / artifacts / HTML-to-PDF:** write the page with the placeholder `LOGO_SRC` as the image source:
   `<img src="LOGO_SRC" alt="Clarity R2R" width="850" height="115" style="display:block;width:min(320px,70%);height:auto;margin:0 auto 8px">`
   then swap the placeholder for the real data URI with code:
   ```bash
   python3 -c "
   import base64,sys
   b=base64.b64encode(open('$LOGO','rb').read()).decode()
   p=sys.argv[1];t=open(p).read();open(p,'w').write(t.replace('LOGO_SRC','data:image/png;base64,'+b))" page.html
   ```
2. **Need a PNG file** (python-pptx, ReportLab, Pillow, docx, Canva upload, etc.): just copy `$LOGO` to `clarity-r2r.png`.
3. If neither file can be found, stop and tell James the logo file is missing. Do not fake it.

## Check before you hand it over

After placing the logo, confirm it decodes (the Pillow check above). If you can screenshot or preview the page, look to confirm the white "clarity r2r" wordmark shows on the dark band.

