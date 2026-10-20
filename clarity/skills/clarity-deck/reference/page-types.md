# Page types and content.json

A deck is one `content.json`. Copy the shape of `reference/example/content.json`.

```json
{
  "client": {
    "name": "Apera",
    "logo": "assets/client-logo.png",
    "anonymisedName": "Founder-Led Aerospace Staffing Firm"
  },
  "slides": [ { "type": "cover", "...": "...", "sources": ["..."] } ]
}
```

- Paths are relative to `content.json`. `skill:` points into this skill folder
  (`skill:assets/recruiters/billy.jpg`).
- `client.logo` must already be white on transparent (`prep_assets.js logo ... --white`).
  The aspect ratio is read from the file.
- **Every slide needs `sources`**: one line per source, "System: what, date". They go to a
  `(sources).md` file next to the deck, never into speaker notes. The build stops without them.
- Copy rules the build enforces: no em dashes, no placeholder text, and in an anonymised build
  the client's name may not appear anywhere in the slides.

Format is A4 landscape, Poppins, gold `#FFC500` on `#111111`. The layouts are fixed. **Do not
restyle**; if something does not fit, cut words or split the slide.

---

## cover
`role`, `location`. Location prints in letter-spaced capitals. Both logos sit above.

## divider
`title`. Optional section break for decks over 12 slides.

## profileIntro
`title`, `paragraphs` (3 to 4, under 45 words each), `person` `{name, title, photo}`.
Founder or CEO introduction.

## teamGrid
`title`, `intro` (optional, one line), `people` `[{name, title, photo, tag?}]`.
Up to 5 in one row, 6 to 10 in two rows. `tag` is a short italic line under the person, used for
"Reports to this role".

## stats
`title`, `stats` `[{value, label}]` (2 to 4), `bullets` (2 to 4).
Values stay short: `57`, `£15m`, `$3m`, `20%`.

## statementsAndPills
`title`, `statements` `[{label, text}]` (vision, mission), `pillsTitle`, `pills` (up to 8 values,
headline case).

## iconCards
`title`, `intro` (optional), `cards` `[{icon, title, text}]`, `perRow` (3 by default, 2 for longer text).
Sectors, benefits, pitch points, locations. Six cards at three per row is the sweet spot.
Icons are Lucide names from react-icons:

| Use | Icon |
|---|---|
| Aerospace, aviation | `LuPlane` |
| Defense, security | `LuShield` |
| Space | `LuRocket`, `LuSatellite` |
| AI, robotics | `LuBot`, `LuCpu` |
| Automotive | `LuCar` |
| Energy | `LuZap`, `LuSun` |
| Healthcare, life sciences | `LuHeartPulse`, `LuFlaskConical` |
| Finance | `LuLandmark`, `LuBanknote` |
| Technology, software | `LuCode`, `LuCloud` |
| Location | `LuMapPin`, `LuBuilding2`, `LuGlobe` |
| People, culture | `LuUsers`, `LuHeart` |
| Growth, performance | `LuTrendingUp`, `LuTarget` |
| Money, equity | `LuCoins`, `LuPiggyBank` |
| Time off, benefits | `LuCalendar`, `LuGift`, `LuPlane` |

An unknown name falls back to a dot; check the render.

## bullets
`title`, `intro` (optional gold lead-in), `items` (3 to 7), `iconName` (`LuCheck` for selling
points, `LuChevronRight` for facts). Row spacing is measured from the real font.

## labelList
`title`, `subtitle` (optional), `items` `[{label, text}]`, `columns` (1 or 2), `fontSize`
(13 to 17; larger when there are fewer items). Requirements, must-haves, nice-to-haves.

## contact
`recruiter` `{name, phone, email, photo}`. Always the last slide. Take it from `recruiters.json`.

---

## The standard order for a retained search deck

1. cover
2. profileIntro (founder)
3. teamGrid (leadership, tag the hire's future direct reports)
4. stats (company overview)
5. statementsAndPills (mission and values), only if the client publishes them
6. iconCards (markets)
7. stats (business model or performance)
8. bullets (Why [Client]?)
9. bullets (The Role)
10. labelList (The Profile: Non-Negotiable Requirements, two columns)
11. labelList (The Profile: Desirable Attributes)
12. iconCards (Location and Relocation, two per row)
13. contact

Optional, when the client supplies the material: commission structure (`labelList` or `stats`),
benefits (`iconCards`), workplace details (`iconCards`), a client's GTM pitch (`iconCards`).
