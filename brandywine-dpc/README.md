# Brandywine Direct Primary Care — website

Static HTML/CSS/JS. No build step, no npm, no framework. Open any `.html` file
in a browser and it works.

**Read `LAUNCH-BLOCKERS.md` before deploying.** There is a founding-member
section with placeholder numbers that is deliberately impossible to ship
silently.

---

## Files

```
brandywine-dpc/
├── index.html            Homepage
├── about.html            Dr. Morgan Katz bio — highest-priority SEO page
├── how-it-works.html     What direct primary care is, in plain language
├── services.html         Primary care, behavioral health, GLP-1, procedures
├── pricing.html          Four tiers + the per-visit math
├── faq.html              Objection-focused, with FAQPage structured data
├── waitlist.html         The main conversion page
├── contact.html          Email + location (deliberately no message form)
├── thanks.html           Post-submit confirmation for the no-JavaScript path
├── 404.html
├── netlify.toml          Redirects, clean URLs, security headers
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/site.css      Every style on the site. One file.
    ├── js/site.js        Nav, scroll reveals, form handling. No dependencies.
    └── img/
        ├── dr-morgan-katz.jpg    200×250 — placeholder, see PHOTO-SHOT-LIST.md
        ├── og-brandywine.png     1200×630 social share card
        └── favicon.svg
```

## Deploying

**See [DEPLOY.md](DEPLOY.md) for the full walkthrough.** Short version: drag the
`brandywine-dpc` folder onto **app.netlify.com/drop**.

> **The site currently deploys hidden from search engines.** `robots.txt`
> disallows everything and `netlify.toml` sends `X-Robots-Tag: noindex`, so the
> preview can sit on a public URL without being found. Run `./go-live.sh` to
> flip both at launch — it does them together, because forgetting one is a
> silent failure.

`netlify.toml` handles clean URLs (`/about` → `/about.html`), 301s from the old
site's paths, the `www` → bare redirect, and security headers.

## Making changes

**Styling** — everything is in `assets/css/site.css`, organized into numbered
sections, with the design reasoning in comments. Colors, spacing, and type are
CSS custom properties at the top; change a token there and it updates
everywhere.

**Copy** — edit the HTML directly.

**⚠️ After editing CSS or JS, bump the version number.** Every page links
`assets/css/site.css?v=2` and `assets/js/site.js?v=3`. `netlify.toml` caches
`/assets/*` for a year as `immutable` — which is great for speed and means a
returning visitor will **never** see your edit until that number changes:

```bash
sed -i '' 's|site.css?v=2|site.css?v=3|g' *.html
```

This bit me during the build, so it will bite you.

**Nav and footer** are repeated in each page's HTML. That is the one real cost
of having no build step: change the nav, change it in all ten files. They're
marked with comment banners. Ten files is manageable; if it ever stops being
manageable, that's the signal to move to Astro.

## Design system

Art direction: **"Brandywine Valley"** — quiet confidence, rooted in place.
Luxury expressed as space and time rather than gold and marble.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F6F3EC` | Page background — warm, never clinical white |
| `--evergreen-deep` | `#1C2A21` | Headlines, dark sections |
| `--evergreen` | `#2F4436` | Italic accents, links |
| `--sage` | `#8A9A7B` | Rules, borders, texture — **never body text** (fails contrast) |
| `--brass` | `#A9743C` | The single accent. Twice a page, maximum. |
| `--ink-muted` | `#57604F` | Body text — 5.6:1 on paper, passes AA |

Type: **Newsreader** for headlines (italic is the house voice — it's where
warmth enters), **Inter** for everything else.

Two details doing quiet work: a near-invisible SVG paper grain over the whole
page at 3.5% opacity, which is what keeps large flat fields from reading as
"corporate website background"; and the meandering "creek" hairline used as a
section divider — the Brandywine, and the only ornament the site permits itself.

## Decisions worth knowing about

**The hero doesn't animate in.** Everything below the fold fades up on scroll;
the hero deliberately doesn't. Above-the-fold content should never wait on
JavaScript to become visible — it hurts perceived load time and the
largest-contentful-paint metric.

**The contact page has no message form.** This is intentional. A free-text box
on a medical practice site invites people to type symptoms, which then sit in a
form database that isn't BAA-covered. Email goes straight to the Google
Workspace inbox instead. The page says so plainly. If you want a form there
anyway, add a hard "no health information" notice — but the safer architecture
is the one that's there.

**The waitlist form collects no health information at all** — name, email, ZIP,
household type. Nothing that could constitute PHI. That's what makes it safe to
route through Netlify and Mailchimp, neither of which will sign a BAA on
standard plans.

**Everything works without JavaScript.** The form has a real `action` and posts
normally if the script fails, and the FAQ uses native `<details>`. JS enhances,
it never enables.

**Scroll reveals fail open, deliberately.** Sections are visible by default;
they're only hidden once a one-line inline script in each `<head>` adds a `js`
class. There's also a 4-second failsafe that reveals anything still hidden.
Both guards exist for the same reason: `IntersectionObserver` does not fire
while a document is hidden, so a page opened in a background tab would
otherwise sit at `opacity: 0` until focused. A missed animation costs nothing;
invisible copy costs everything. If you add reveals, keep this pattern.

**No testimonials anywhere.** Per the brief — patient reviews need documented
HIPAA authorization from that specific patient. When you have them, the
`.quote` component is where they'd go.

## Accessibility

Skip link, semantic landmarks, visible focus rings, `prefers-reduced-motion`
honored throughout, form errors wired with `aria-invalid` and `role="alert"`,
all body text at AA contrast or better. The FAQ uses native `<details>`, which
screen readers already understand — no ARIA gymnastics.

## Compliance notes

Every page footer carries the membership disclaimer: not insurance, doesn't pay
for hospital/specialist/lab/imaging/prescriptions, keep separate coverage, call
911 in an emergency. This addresses the brief's concern about language that
could read as promising insurance-like coverage — which matters more given
Delaware has no DPC-specific statute.

The word "cover" is used only where insurance is the subject. Membership
"pays for" care; insurance "covers" risk. That distinction is maintained
deliberately throughout, and is worth preserving in future edits.

## Local preview

```bash
python3 -m http.server 4321 --directory brandywine-dpc
```
