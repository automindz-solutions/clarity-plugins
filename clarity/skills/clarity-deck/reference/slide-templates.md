# Slide templates (Slides deck)

Every Clarity deck is built from these templates. Copy the markup, replace each `{{…}}`, and
keep the rest exactly as it is: sizes, colours, gaps and positions are the house style, tested on
the Apera deck (`reference/example/slides/`). **Do not restyle.** If text does not fit, cut words
or split the slide; never go under 24px.

Placeholders:

| Placeholder | What goes there |
|---|---|
| `{{CLARITY_LOGO}}` | `/_blob/<id>` of the Clarity wordmark, copied into this deck from the design system |
| `{{CLIENT_LOGO}}` | `/_blob/<id>` of the client logo, white on transparent (`prep_assets.js logo … --white`), uploaded to this deck |
| `{{ICON:name}}` | `/_blob/<id>` of a design-system icon copied into this deck: `check`, `chevron-right`, `map-pin`, `plane`… |
| `{{PHOTO:name}}` | `/_blob/<id>` of a headshot (`prep_assets.js photo`), uploaded to this deck |
| `{{ID}}` | the slide id: `[A-Za-z0-9_-]`, also its file name |

Rules that apply to every slide:

- Background `#111111` and font stack `'Poppins', Arial, sans-serif` on every `<section>`.
- Colours only from the system: gold `#FFC500`, text `#F0F0F0`, white `#FFFFFF`, muted
  `#8A8A8A`, surface `#1C1C1C`, line `#525252`, gold surface `#251C05`, gold line `#9E7B0D`.
- **No `<aside>`.** Speaker notes are readable by anyone with the link. Sources live on the fact sheet.
- Apostrophes are typographic (`’`). `&` is written `&amp;`. No em dashes.
- An anonymised deck drops the `{{CLIENT_LOGO}}` image from every header and from the cover.

---

## The content shell

Every content slide starts like this. The two pinned logos are the header; the `<h2>` is the
title. Put the slide's body after the `<h2>`.

```html
<section id="{{ID}}" data-transition="fade" style="background:#111111;color:#F0F0F0;font-family:'Poppins', Arial, sans-serif;padding:200px 128px 112px;display:flex;flex-direction:column;gap:40px">
<img src="{{CLIENT_LOGO}}" alt="{{Client}} logo" style="position:absolute;left:128px;top:48px;width:93px;height:104px;object-fit:contain">
<img src="{{CLARITY_LOGO}}" alt="Clarity R2R logo" style="position:absolute;left:1472px;top:56px;width:320px;height:97px;object-fit:contain">
<h2 style="font-size:64px;font-weight:700;color:#FFC500;line-height:1.1">{{Title in Headline Case}}</h2>
<!-- body -->
</section>
```

The client logo box is 93 x 104. A wide logo (a wordmark) gets `width:300px;height:80px` instead,
same `left` and `top`.

Space for the body: about 640px tall and 1664px wide below the title.

---

## cover

```html
<section id="cover" data-transition="fade" style="background:#111111;color:#F0F0F0;font-family:'Poppins', Arial, sans-serif;padding:128px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px">
<div style="display:flex;flex-direction:row;align-items:center;gap:64px">
<img src="{{CLARITY_LOGO}}" alt="Clarity R2R logo" style="width:500px;height:152px;object-fit:contain">
<p style="font-size:48px;color:#FFFFFF;line-height:1">x</p>
<img src="{{CLIENT_LOGO}}" alt="{{Client}} logo" style="width:153px;height:170px;object-fit:contain">
</div>
<div style="display:flex;flex-direction:column;align-items:center;gap:24px">
<h1 style="font-size:88px;font-weight:700;color:#FFC500;line-height:1.05;text-align:center">{{Role Title}}</h1>
<p style="font-size:36px;color:#FFFFFF;letter-spacing:8px;text-transform:uppercase;text-align:center">{{City, State}}</p>
</div>
</section>
```

Anonymised: delete the `x` and the client logo, keep the Clarity logo alone.
Role titles up to about 30 characters stay on one line.

---

## profileIntro: founder or CEO

Body after the `<h2>`: text left, circular photo right. 3 to 4 paragraphs, under 45 words each.

```html
<div style="display:flex;flex-direction:row;gap:96px;align-items:start">
<div style="flex:1;display:flex;flex-direction:column;gap:28px">
<p style="font-size:28px;line-height:1.45">{{Paragraph}}</p>
<!-- 3 to 4 paragraphs -->
</div>
<div style="width:440px;display:flex;flex-direction:column;align-items:center;gap:12px">
<img src="{{PHOTO:founder}}" alt="{{Name}}" style="width:400px;height:400px;object-fit:cover;border-radius:50%">
<p style="font-size:36px;font-weight:700;color:#FFC500;text-align:center;line-height:1.3">{{Name}}</p>
<p style="font-size:28px;color:#FFFFFF;text-align:center">{{Title}}</p>
</div>
</div>
```

---

## teamGrid: leadership team

Shell with `padding:200px 128px 96px;gap:28px`. One intro line, then a grid of 4 columns,
up to 8 people. For 5 or 6 people use `repeat(3, 1fr)`; for up to 4, one row of `repeat(4, 1fr)`.

```html
<p style="font-size:28px;line-height:1.4">{{One line: who this hire works with and who reports in}}</p>
<div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:28px 32px">
<div style="display:flex;flex-direction:column;align-items:center;gap:6px">
<img src="{{PHOTO:person}}" alt="{{Name}}" style="width:150px;height:150px;object-fit:cover;border-radius:50%">
<p style="font-size:26px;font-weight:700;color:#FFC500;text-align:center">{{Name}}</p>
<p style="font-size:24px;color:#FFFFFF;text-align:center">{{Title}}</p>
<!-- optional: <p style="font-size:24px;font-style:italic;color:#8A8A8A;text-align:center">Reports to this role</p> -->
</div>
<!-- one block per person -->
</div>
```

---

## stats: two to four stat tiles over supporting bullets

```html
<div style="display:flex;flex-direction:row;gap:32px">
<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;background:#1C1C1C;border:2px solid #525252;border-radius:16px;padding:36px 24px">
<p style="font-size:72px;font-weight:700;color:#FFC500;line-height:1.1">{{57 / £15m / 20%}}</p>
<p style="font-size:24px;color:#FFFFFF;text-align:center">{{Label, sentence case}}</p>
</div>
<!-- 2 to 4 tiles; values of 6 characters or fewer -->
</div>
<div style="display:flex;flex-direction:column;gap:24px">
<div style="display:flex;flex-direction:row;gap:24px;align-items:start">
<img src="{{ICON:chevron-right}}" alt="" style="width:36px;height:36px;object-fit:contain">
<p style="flex:1;font-size:28px;line-height:1.45">{{Supporting point}}</p>
</div>
<!-- 2 to 4 rows, two lines each at most -->
</div>
```

---

## statementsAndPills: vision, mission and values

```html
<div style="display:flex;flex-direction:column;gap:28px">
<p style="font-size:36px;line-height:1.4"><b><span style="color:#FFC500">Vision:</span></b> {{Word for word from the client’s site}}</p>
<p style="font-size:36px;line-height:1.4"><b><span style="color:#FFC500">Mission:</span></b> {{…}}</p>
</div>
<div style="flex:1"></div>
<h3 style="font-size:44px;font-weight:700;color:#FFC500;line-height:1.2">Values</h3>
<div style="display:flex;flex-direction:row;gap:32px;flex-wrap:wrap">
<p style="font-size:30px;color:#FFFFFF;border:2px solid #FFFFFF;border-radius:999px;padding:20px 48px">{{Value in Headline Case}}</p>
<!-- up to 8 pills -->
</div>
```

---

## iconCards: markets, benefits, pitch points, locations

Three across for short text (shell `gap:36px`), two across for longer text (`repeat(2, 1fr)`,
`padding:40px`, `h3` 36px, `p` 28px). Six cards at three across is the sweet spot.

```html
<p style="font-size:28px;line-height:1.45">{{Optional intro, two lines at most}}</p>
<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:32px">
<div style="display:flex;flex-direction:column;gap:16px;background:#1C1C1C;border:2px solid #525252;border-radius:16px;padding:36px">
<div style="display:flex;flex-direction:row;gap:20px;align-items:center">
<img src="{{ICON:plane}}" alt="" style="width:48px;height:48px;object-fit:contain">
<h3 style="font-size:34px;font-weight:700;color:#FFC500;line-height:1.2">{{Card Title}}</h3>
</div>
<p style="font-size:26px;line-height:1.45;color:#FFFFFF">{{One or two short lines}}</p>
</div>
<!-- one block per card -->
</div>
```

---

## bullets: Why [Client]? and other lists

Check marks for selling points, chevrons for facts. 3 to 7 rows.

```html
<div style="display:flex;flex-direction:column;gap:26px">
<div style="display:flex;flex-direction:row;gap:24px;align-items:start">
<img src="{{ICON:check}}" alt="" style="width:40px;height:40px;object-fit:contain">
<p style="flex:1;font-size:30px;line-height:1.4">{{Selling point with its proof}}</p>
</div>
<!-- one row per point -->
</div>
```

---

## role: the role, with the compensation panel

Shell with `padding:200px 128px 96px;gap:32px`. Gold lead-in, up to 5 chevron rows at 26px
(gap 18px, icons 34px), then the gold compensation panel. Compensation strings are sentence case.

```html
<p style="font-size:32px;line-height:1.4;color:#FFC500">{{Client}} is hiring a {{Role}} to {{one line on the mandate}}.</p>
<div style="display:flex;flex-direction:column;gap:18px">
<!-- chevron rows as in stats, at font-size 26px, icon 34px -->
</div>
<div style="display:flex;flex-direction:column;gap:8px;background:#251C05;border:2px solid #9E7B0D;border-radius:16px;padding:28px 36px">
<p style="font-size:26px;font-weight:700;color:#FFC500">Compensation</p>
<p style="font-size:26px;line-height:1.45">{{$300k+ base, bonus, equity: as briefed}}</p>
</div>
```

---

## labelList: requirements and attributes

Shell `gap:32px`. A white subtitle, then gold labels with descriptions. Two columns for 6 to 8
items at 26px; one column for up to 5 items at 30px (gap 28px).

```html
<p style="font-size:30px;color:#FFFFFF">{{Non-Negotiable Requirements}}</p>
<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:28px 64px">
<p style="font-size:26px;line-height:1.45"><b><span style="color:#FFC500">{{Label}}:</span></b> {{Description, sentence case}}</p>
<!-- items fill row by row: left, right, left, right -->
</div>
```

---

## contact: always the last slide

No header. Recruiter details from `recruiters.json`.

```html
<section id="contact" data-transition="fade" style="background:#111111;color:#F0F0F0;font-family:'Poppins', Arial, sans-serif;padding:128px;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:96px">
<img src="{{PHOTO:recruiter}}" alt="{{Recruiter Name}}" style="width:420px;height:420px;object-fit:cover;border-radius:50%;border:6px solid #FFC500">
<div style="display:flex;flex-direction:column;gap:28px">
<img src="{{CLARITY_LOGO}}" alt="Clarity R2R logo" style="width:460px;height:139px;object-fit:contain">
<p style="font-size:52px;font-weight:700;color:#FFC500;letter-spacing:4px;text-transform:uppercase">{{Recruiter Name}}</p>
<div style="display:flex;flex-direction:column;gap:12px">
<p style="font-size:34px;color:#FFFFFF">{{Phone}}</p>
<p style="font-size:34px;color:#FFFFFF">{{Email}}</p>
</div>
</div>
</section>
```

---

## The standard order

cover · profileIntro · teamGrid · stats (company overview) · statementsAndPills (only if the client
publishes values) · iconCards (markets) · stats (business model or performance) · bullets (Why
[Client]?) · role · labelList (non-negotiables, two columns) · labelList (desirable, one column) ·
iconCards (location, two across) · contact.

Optional when the client supplies the material: commission bands (a `<table>` on the shell,
first row `<th>`, 28px), benefits (iconCards), workplace details (iconCards, two across), the
client's GTM pitch (iconCards).
