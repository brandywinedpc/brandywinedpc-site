# Deploying the pre-launch preview

The site is configured to deploy **hidden from search engines**. You can put it
on the internet today and it will not show up in Google, and brandywinedpc.com
stays dark until you deliberately point it.

---

## What's already done

| Guard | Where | Effect |
|---|---|---|
| `Disallow: /` | `robots.txt` | Tells crawlers not to crawl anything |
| `X-Robots-Tag: noindex, nofollow, noarchive` | `netlify.toml` | The one that actually guarantees de-indexing |
| Mailchimp disabled off-domain | `assets/js/site.js` | Test submissions **cannot** reach your real audience |
| Domain untouched | Cloudflare | No A/CNAME record exists, so nothing resolves |

Both search guards flip together with `./go-live.sh`. Don't flip them by hand.

### Why two guards

`robots.txt` blocks *crawling*, not *indexing*. A URL that gets linked from
anywhere can still appear in Google as a bare result with no description, even
while disallowed. The `X-Robots-Tag` header is what actually keeps it out — but
Google only sees that header if it's allowed to fetch the page. Belt and
braces is the standard staging setup, and with no inbound links the edge case
can't trigger.

### About the Mailchimp guard

This one is worth knowing about, because it would have bitten you. The waitlist
form pushes to your live Mailchimp audience. Left alone, every test submission
Morgan made while poking at the site would have created a real subscriber.

It's now gated on hostname:

```js
enabled: /(^|\.)brandywinedpc\.com$/i.test(window.location.hostname)
```

Off on `*.netlify.app` and localhost, on at the real domain. Nothing to
remember at launch, nothing to clean up after. **Netlify Forms still captures
every submission in every environment**, so you can still confirm the form
works end to end while testing — just check the Netlify dashboard, not
Mailchimp.

---

## Deploy it (about 5 minutes)

You already have a Netlify account — the previous site has Netlify functions in
its archive folder. Deploy this as a **new site**, not over the old one, so the
old one stays untouched as a fallback.

### Option A — drag and drop (fastest)

1. Go to **https://app.netlify.com/drop**
2. Drag the **`brandywine-dpc` folder itself** onto the page
   — the whole folder, not its contents, and not a zip
3. Wait for the deploy, then **"Claim your site"** to attach it to your account
4. Netlify assigns something like `celebrated-marzipan-7f3a2c.netlify.app`

Optionally rename it under **Site configuration → Change site name** — pick
something unguessable, since obscurity is the only access control here.
`brandywine-preview-k4m9x` is better than `brandywine-dpc`.

> Updates mean dragging the folder again. Fine for a preview; if edits get
> frequent, switch to Option B.

### Option B — connect the Git repo (better for ongoing edits)

I've already initialised a Git repo with everything committed. To use it you'd
push to GitHub, then **Add new site → Import an existing project** in Netlify.
Every push then deploys automatically.

Build settings, if asked:
- **Build command:** *(leave empty)*
- **Publish directory:** `.`

---

## Confirm it's actually hidden

Run this once it's live, with your real URL:

```bash
curl -sI https://YOUR-SITE.netlify.app | grep -i x-robots-tag
```

**Expect:** `x-robots-tag: noindex, nofollow, noarchive`

No output means the header didn't apply and the site is crawlable — stop and
check that `netlify.toml` deployed at the folder root.

```bash
curl -s https://YOUR-SITE.netlify.app/robots.txt | head -3
```

**Expect** the pre-launch banner comment and `Disallow: /`.

Send me the URL and I'll run the full check myself — headers, every page, the
form, mobile layout, and console errors.

---

## Turning on the waitlist form

Netlify picks the form up automatically from the HTML. After the first deploy:

1. **Site configuration → Forms** — a form named `waitlist` should be listed
2. **Forms → Form notifications → Add notification → Email notification**
   Send to the address you actually read, or a submission sits unseen
3. Submit a real test entry from the live URL and confirm it lands

Nothing will appear in Mailchimp, by design (see above). Confirm Netlify has
the submission and that's the form working.

---

## What to have Morgan test

Worth sending her a short list rather than "take a look":

- **On her phone**, not just a laptop — most of your audience arrives that way
- The waitlist form, including getting it wrong: submit it empty, use a bad
  email, use a 3-digit ZIP. Errors should be clear and the right field focused
- Read [about.html](about.html) closely — it's written in her first-person
  voice and she should agree with every sentence. Especially the "honest note
  on what this is" section, which admits the practice isn't for everyone
- The FAQ's Medicare and "what if I can't afford it" answers — she's the one
  who'll have to stand behind those in person
- Check the "DRAFT" ribbon on the founding-member section is understood as
  deliberate, not a bug

---

## Launch day

Do these in order. Steps 1–2 can happen well before you're ready to announce.

### 1. Clear the remaining blockers

See [LAUNCH-BLOCKERS.md](LAUNCH-BLOCKERS.md). The founding-member `[XX]`
placeholders and the Mailchimp merge fields are the two that matter.

### 2. Flip the search guards

```bash
./go-live.sh
```

Then redeploy. The script flips `robots.txt` and removes the noindex header
together, then verifies both.

### 3. Point the domain in Cloudflare

DNS → **Records** → add:

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `@` | `YOUR-SITE.netlify.app` | **DNS only** (grey) |
| CNAME | `www` | `YOUR-SITE.netlify.app` | **DNS only** (grey) |

Cloudflare flattens the CNAME at the apex, so a root CNAME is fine here.

**Keep the cloud grey.** Proxying (orange) through Cloudflare in front of
Netlify breaks Netlify's automatic certificate issuance and buys you almost
nothing — Netlify is already a CDN with its own edge. Grey cloud, and let
Netlify handle TLS.

Your existing `google-site-verification` TXT record is unrelated. Leave it.

### 4. Add the domain in Netlify

**Domain management → Add a domain →** `brandywinedpc.com`. Netlify verifies
DNS and issues a Let's Encrypt certificate, usually within a few minutes. Set
`brandywinedpc.com` (no `www`) as the primary domain — `netlify.toml` already
redirects `www` to the bare domain, and splitting between the two would split
your search signal.

### 5. Verify the site is genuinely public

```bash
curl -sI https://brandywinedpc.com | grep -i x-robots-tag
```

**Expect no output.** Any output means the site is still invisible to Google.
This is the single easiest thing to get wrong, and it has no visible symptom.

```bash
curl -s https://brandywinedpc.com/robots.txt
```

Should show `Allow: /` and the sitemap line.

### 6. Tell Google it exists

1. **Google Search Console** → add `brandywinedpc.com` (the TXT verification
   record is already in Cloudflare)
2. Submit `https://brandywinedpc.com/sitemap.xml`
3. Use **URL Inspection → Request indexing** on `/about.html` specifically —
   that's the page that needs to rank for Morgan's name, and it's the whole
   reason to publish before the office is even secured

---

## Rolling back

Netlify keeps every deploy. **Deploys → pick an earlier one → Publish deploy**
restores it immediately. To take the site off the internet entirely, remove the
Cloudflare DNS records — that's faster than anything on the Netlify side.
