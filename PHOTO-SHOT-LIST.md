# Photography shot list

For the planned shoot. The site is designed to work *without* photography - so
nothing here is urgent - but each of these slots into a place that's currently
carrying itself on typography alone.

## The one rule

**Warm, natural, in-between moments.** The competitor lane in this corridor is
cold luxury: marble, white space, spa minimalism, arms-crossed authority poses.
Everything below is deliberately the opposite. If a shot would look at home in a
hospital system's annual report, it's wrong.

Specifically avoid:
- White coat over folded arms against a grey seamless
- Stethoscope-draped hero poses
- Anyone pointing at a clipboard
- Blue-and-white anything

---

## Priority 1 - the hero portrait

**Where:** `index.html` and `about.html`, currently the 200×250 headshot
**Size:** 1200×1500 minimum (2400×3000 preferred), portrait 4:5

Morgan mid-conversation - talking, listening, laughing - not posed looking at
the lens. Natural window light, warm tones. No white coat; whatever she'd
actually wear in clinic. Slightly off-center so the design can crop either way.

*The single highest-value image on the site.* Her face and voice are the brand;
this is the shot that carries it.

---

## Priority 2 - Morgan with her daughter

**Where:** a new section on `about.html`, or replacing the hero on a later pass
**Size:** 1600×1200, landscape

Genuinely candid, at home or outdoors. This does more for the young-family
audience than any amount of copy about understanding parents - but only if it
looks real. A posed studio family portrait would actively hurt.

Worth discussing whether they're comfortable with their daughter's face online
at all. A shot from behind, or hands only, works nearly as well and sidesteps
the question entirely.

---

## Priority 3 - the office, once it exists

**Where:** `contact.html`, `how-it-works.html`
**Size:** 1600×1200, landscape

The waiting area with nobody rushing through it. An exam room that looks like a
room. Warm light, plants, real texture. The point is "unhurried," not
"expensive."

Shoot it empty and shoot it in use.

---

## Priority 4 - hands and details

**Where:** `services.html` section breaks
**Size:** 1200×900

Close, warm, human: a blood-pressure cuff mid-check, a hand on a shoulder, notes
being written. No faces needed, which makes these easy to shoot and free of
consent complications.

---

## Priority 5 - Brandywine Valley landscape

**Where:** section dividers, the deep-green quote sections
**Size:** 2400×1000, wide

Creek, treeline, stone wall, morning fog. Ties the practice to the place its
name comes from, and gives the dark sections something to breathe against.

These can be shot on a phone on a good morning. They don't need the
photographer.

---

## Technical notes

- **Format:** WebP for the site, keep the originals as JPEG/RAW
- **Weight:** under 200KB each after export; hero under 300KB
- **Add `loading="lazy"`** to everything below the fold. The hero portrait must
  NOT be lazy - it's the largest-contentful-paint element.
- **Alt text:** describe what's happening, not "photo of doctor." Screen-reader
  users and search engines both benefit.
- **Remove the warming filter:** `assets/css/site.css` applies
  `filter: sepia(.14) saturate(.94) contrast(1.02)` to `.portrait` and
  `.portrait--round` to warm the current headshot's cold studio grey. Delete
  those two lines once real warm-toned photography is in - otherwise good
  photos get needlessly tinted.

## Where the slots are marked

Search the HTML for `PHOTO SLOT` - each one carries the dimensions and art
direction inline, so whoever swaps images in doesn't need this file.
