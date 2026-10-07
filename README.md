# Clarity R2R plugin marketplace

One install that gives every Clarity recruiter the same nine skills in Claude (Cowork, Desktop or
Code). It replaces uploading `.skill` files one by one.

## Install (each person, once)

1. In Claude, open **Customize → Plugins → Add marketplace → Add from a repository**
2. Paste this repository's URL
3. Install the **Clarity R2R** plugin
4. Remove any old copies of the Clarity skills under **Customize → Skills → Yours**, so each skill
   exists only once

The skills then appear when you type `/`:

| Skill | Use it for |
|---|---|
| `clarity-brief` | Turn a role into a search-ready brief |
| `clarity-shortlist` | Scored candidate shortlist for a Loxo job |
| `clarity-spec` | Client contacts worth speccing a candidate to |
| `clarity-market-spec` | Open-market firms to spec a candidate into |
| `clarity-frontsheet` | Branded one-page candidate cover sheet |
| `clarity-options` | Options document for a candidate, with why each firm fits them |
| `clarity-bd` | Net-new BD contacts from market signals |
| `clarity-network` | Chase list from the LinkedIn inbox via Kondo |
| `clarity-house-style` | Brand colours, type and capitalisation rules |

## Connectors

The plugin ships skills only. Each person still connects their own accounts in Claude:
Loxo, Hyreflow, Microsoft 365, Lemlist, Notion and Kondo (Kondo needs a plan with MCP access).

## Layout

```
.claude-plugin/marketplace.json   # marketplace manifest, one plugin: clarity
clarity/
├── .claude-plugin/plugin.json    # plugin manifest and version
└── skills/<9 skills>/SKILL.md
```

## Updating a skill

1. Edit the skill under `clarity/skills/`
2. Raise `version` in `clarity/.claude-plugin/plugin.json`
3. Push

Each person picks the change up when their Claude refreshes the marketplace. If someone is still
on the old version, they update the plugin under **Customize → Plugins**.
