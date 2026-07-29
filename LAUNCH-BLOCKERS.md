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

## 1. Founding-member placeholders - HARD BLOCKER

**Where:** `index.html`, the section marked `class="founding" data-founding="draft"`

That section contains `[XX]`, `[X] years`, and `$[XXX]`. It currently renders a
red dashed outline and a **"DRAFT - placeholder numbers. Not for launch."**
ribbon, and logs a warning to the browser console. This is deliberate: it makes
shipping placeholder text impossible to do quietly.

**To take it live:**
1. Replace each `<span class="tbd">…</span>` with the real figure
2. Change `data-founding="draft"` to `data-founding="live"`
3. The ribbon and outline disappear automatically

**To ship without it:** delete the whole `<section class="… founding">` block.
Nothing else references it.

⚠️ **Before publishing deposit language, have a lawyer read it.** "Deposit
applied to your first month" and "rate locked for X years" are commitments to a
consumer. Delaware has no DPC-specific statute, which makes the general
consumer-protection framing more relevant, not less.

---

## 2. Waitlist form - verify end to end before announcing

The form emails each signup via **Web3Forms** and additionally pushes to
**Mailchimp** (best-effort, never blocks the user).

**Confirm the Web3Forms access key delivers to an inbox you read.**

The form emails each signup via Web3Forms. The key in `index.html` and
`waitlist.html` is inherited from your old site:
`cdcdabb7-57a1-40a3-9680-48c15336f0be`

I deliberately did **not** send a test submission - if that key is stale or was
registered to an address nobody checks, a test would email a stranger. Submit
one yourself from the live site and confirm it arrives.

- If it arrives: done, nothing else to do
- If it doesn't: get a fresh key at web3forms.com (email in, key back, no
  account) and replace it in **both** files
- Free tier is 250 submissions/month - worth watching around launch

Cloudflare Pages returns 405 for POST, so there is no server-side capture as a
backstop. If the email fails, the lead is gone. That makes confirming this the
single most important pre-launch check.

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
- [ ] Founding section resolved (numbers in + `data-founding="live"`, or deleted)
- [ ] Deposit / rate-lock language reviewed by a lawyer
- [ ] Web3Forms test submission received in a real inbox
- [ ] Mailchimp `ZIP` and `HOUSEHOLD` merge fields created
- [ ] Test submission completed end to end
- [ ] `hello@brandywinedpc.com` live on Google Workspace
- [ ] Pricing confirmed in all four places
- [ ] Domain pointed, HTTPS on, www redirect verified
- [ ] `sitemap.xml` submitted to Google Search Console
- [ ] Every page opened on a real phone
