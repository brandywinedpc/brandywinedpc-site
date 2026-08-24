# Launch blockers

Things that must be resolved before this site goes live. Ordered by how much
damage they do if missed.

---

## 0. The site is hidden from Google right now - BY DESIGN

The pre-launch build ships with two search guards active:

- `robots.txt` → `Disallow: /`
- `_headers` → `X-Robots-Tag: noindex, nofollow, noarchive`

This is intentional so the preview can live on a public URL without being
found. **Both must be flipped before launch**, and there is no visible symptom
if you forget - the site looks perfect and simply never appears in search.

```bash
./go-live.sh
```

Flips both together and verifies. Then redeploy and confirm on the live domain:

```bash
curl -sI https://brandywinedpc.com | grep -i x-robots-tag
```

Expect **no output**. See [DEPLOY.md](DEPLOY.md) for the full launch sequence.

> Related, and already handled: the Mailchimp push is gated to
> `brandywinedpc.com`, so test submissions from the preview URL can't reach
> your live audience. It switches itself on at launch - nothing to do.

---

## 1. One section still carries unverified numbers - HARD BLOCKER

It wears a red **DRAFT** ribbon and logs a console warning until fixed. The
guard is generic: any element with `data-draft="true"` and a `data-draft-label`
gets the ribbon. Remove both attributes to clear it.

### 1a. Lab and medication pricing - RESOLVED, but confirm two decisions

`pricing.html` now publishes **real numbers from your own Atlas.MD account**,
so the DRAFT guard is off. Two judgment calls are baked in that you should
confirm rather than inherit:

**Labs are Quest, not LabCorp.** You sent both price files. The page uses the
**Quest Diagnostics client-bill** column throughout, since that is the account
you named. LabCorp is cheaper on several high-volume tests (lipid panel $2.75
vs $4.37, CMP $2.86 vs $4.87) and dearer on others (TSH $2.75 vs $2.23). If you
end up drawing to LabCorp, the whole table has to be reissued - the two are not
interchangeable line by line.

**Everything is passed through at cost, with no markup - draw location is an
open question, not a settled one.** The page previously said draws happen in
the office; that's not accurate, at least not initially, and the sentence has
been removed (24 Aug 2026) rather than replaced with a guess. If members are
sent to a Quest Patient Service Center for the actual draw, Quest bills its
own **$5.48 PSC draw fee** on top of the test prices published here - and the
page currently says nothing about it either way. Decide where draws will
actually happen, whether that $5.48 gets passed to the member or absorbed,
and put a true sentence back once you know.

Medication prices come from the Atlas inventory **Price** column (cost + 10%),
multiplied out to a stated quantity so the figure on the page is what a member
actually hands over. Every one of the 164 computed rows reconciles to unit price
× quantity.

⚠️ Published prices on a medical practice's site function as a commitment to
the person reading them. Re-check these against your live Atlas account before
launch and again whenever supplier rates move.

> On dispensing: Delaware permits in-office physician dispensing with **no
> separate pharmacy permit**. Controlled substances need a state Controlled
> Substances Registration plus your DEA registration.

### 1b. Founding-member terms - RESOLVED, confirm before launch

**Where:** `index.html`, the `#founding` section, plus every place the site
states the standard $100 enrollment fee (`pricing.html`, `faq.html` - both the
human-readable answer and the JSON-LD).

Real numbers are in: **150 founding memberships**, no enrollment fee for them
(**$100** for everyone after), monthly price fixed for **at least 5 years**,
against a panel Morgan expects to run at **about 500 patients total**. The
`data-draft` guard is off - this is no longer a placeholder.

⚠️ **Founding and standard members pay the identical monthly rate.** The only
differences are the enrollment fee (waived vs. $100) and the 5-year price-lock
guarantee (founding only). Don't let copy drift back toward implying a
different "founding rate" vs. "standard rate" - an earlier draft did exactly
that and had to be corrected (24 Aug 2026).

⚠️ **Before launch, have a lawyer read the fee-waiver and price-lock
language.** "No enrollment fee for founding members" and "price fixed for at
least 5 years" are commitments to a consumer. Delaware has no DPC-specific
statute, which makes the general consumer-protection framing more relevant,
not less.

If any of these four numbers change (150 / $100 / 5 years / ~500), they need
to change everywhere at once - see the file list above. A stale $100 or a
stale 150 anywhere reads as a bait-and-switch to a member who visits two pages
of the site.

---

## 2. Waitlist form - verify end to end before announcing

**✅ VERIFIED 29 Jul 2026 - test submission sent and email received.**

The form emails each signup via **Web3Forms** (key
`cdcdabb7-57a1-40a3-9680-48c15336f0be`, inherited from the old site) and
additionally pushes to **Mailchimp** on a best-effort basis that never blocks
the user. Confirmed working end to end from the live Cloudflare deploy.

Two things to keep an eye on:

- The Web3Forms free tier is **250 submissions/month**. Cloudflare Pages
  returns 405 for POST, so there is no server-side capture as a backstop - if
  the email fails, the lead is gone.
- Re-test after any change to the form markup or the access key.

**Mailchimp - needs one setup step:**
The config lives at the top of `assets/js/site.js`. It reuses the audience
already embedded in the old site (`u=28d9c6d094be6496bf7ce6613`,
`id=72bcd7bf17`).

For segmentation to work, the audience must have merge fields tagged exactly
`ZIP` and `HOUSEHOLD`. In Mailchimp: **Audience → Settings → Audience fields and
\*|MERGE|\* tags**.

> If those tags don't exist, Mailchimp silently drops the values. You'd still
> get the full submission by email from Web3Forms - so this costs you
> segmentation data, not leads. Worth five minutes to get right, since
> pre-segmenting outreach by household type is the whole reason the field
> exists.

To disable the Mailchimp half entirely, set `MAILCHIMP.enabled = false`.

---

## 3. Confirm the practice details

| Item | Current state | What to do |
|---|---|---|
| **Opening date** | No date stated anywhere | The site deliberately says "when the doors open" rather than naming a year. Add a date once it's real - vague timing is fine, a *wrong* date is not. |
| **Office address** | Not stated; FAQ explains it's being chosen around waitlist ZIPs | Once secured: add to `contact.html`, add `streetAddress` to the JSON-LD in `index.html`, and create a Google Business Profile. |
| **Phone number** | Omitted; `contact.html` has a TODO comment | Add to `contact.html` and add `"telephone"` to the `MedicalBusiness` JSON-LD. |
| **Email** | `hello@brandywinedpc.com` used site-wide | Must exist and route to the BAA-covered Google Workspace inbox before launch. It appears in the footer of every page and in structured data. |
| **Legal entity** | Footer says "Brandywine Direct Primary Care, LLC" | Confirm the exact registered name. |

---

## 4. Pricing - a deliberate decision worth re-confirming

The site uses **$150/month individual**, matching the previous live site.

The design brief specified **$125/month**. You chose $150. Flagging it once
here so it's a recorded decision rather than a discrepancy someone finds later.

Prices appear in: `index.html`, `pricing.html`, `faq.html`, and the `Product`
JSON-LD in `pricing.html`. Change all four together - mismatched structured
data can surface a wrong price directly in Google results.

---

## 5. Domain and SEO - the clock starts at launch

Everything is hardcoded to `https://brandywinedpc.com` (bare, no `www`).
The `www` → bare redirect is a Cloudflare Redirect Rule set in the dashboard
(see DEPLOY.md) - `_redirects` has no hostname matching. If you want the
opposite, invert that rule and find-and-replace the canonical URLs.

**The single highest-value SEO task:** `about.html` is built to rank for
"Dr. Morgan Katz." When Morgan leaves ChristianaCare, patients will search her
name and land on whatever Google has indexed. That page only starts earning
authority once the domain is live and crawled - so publishing early, even
before the office is secured, is worth real money.

After launch:
1. Submit `sitemap.xml` in Google Search Console
2. Create a Google Business Profile once the address exists
3. Make sure her name is spelled identically everywhere - site, Business
   Profile, any directories. Inconsistency splits the signal.

---

## 6. Photography

The only image is a 200×250px ChristianaCare headshot, used at small sizes where
that resolution is honest. It carries a `sepia(.14)` CSS filter to warm its cold
grey studio background toward the palette - **remove that filter once real
photography lands** (`assets/css/site.css`, `.portrait` and `.portrait--round`).

See `PHOTO-SHOT-LIST.md` for what to actually shoot.

---

## Pre-flight checklist

- [ ] `./go-live.sh` run, redeployed, and `x-robots-tag` confirmed **absent**
      from the live domain
- [x] Founding-member numbers are real: 150 memberships, no enrollment fee
      ($100 after), price fixed 5+ years, ~500 patient panel target
- [x] Lab and medication prices are real Atlas.MD / Quest figures (5 Aug 2026)
- [ ] Confirm Quest is the lab you will actually draw to, not LabCorp
- [ ] Confirm pass-through at cost with no markup, handling fee, or draw fee
- [ ] Decide where draws actually happen and whether Quest's $5.48 PSC draw
      fee is passed to members, then put a true sentence back on pricing.html
- [ ] Fee-waiver and price-lock language reviewed by a lawyer
- [x] Web3Forms test submission received in a real inbox (29 Jul 2026)
- [ ] Mailchimp `ZIP` and `HOUSEHOLD` merge fields created
- [ ] Test submission completed end to end
- [ ] `hello@brandywinedpc.com` live on Google Workspace
- [ ] Pricing confirmed in all four places
- [ ] Domain pointed, HTTPS on, www redirect verified
- [ ] `sitemap.xml` submitted to Google Search Console
- [ ] Every page opened on a real phone
