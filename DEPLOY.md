# Deploying (GitHub → Cloudflare Pages)

The site is now Cloudflare-only. Netlify is gone: no `netlify.toml`, no Netlify
Forms, nothing to keep in sync across two hosts.

Push to GitHub → Cloudflare Pages rebuilds automatically. That's the whole loop.

---

## Getting these files into your repo

Copy everything from this folder over your repo's working copy, then commit.

**⚠️ One thing a copy won't do: delete `netlify.toml`.** It has to be removed
explicitly, or Cloudflare will happily ignore a stale config file that
contradicts `_headers`:

```bash
git rm netlify.toml
```

### What changed, and why each file matters

| File | Status | Why |
|---|---|---|
| `_headers` | **new - required** | The only place headers are set. Without it: no noindex, no clickjacking protection, no asset caching |
| `_redirects` | **new** | 301s from the old site's `/about-dr-katz` and `/contact-us` paths |
| `netlify.toml` | **delete** | Netlify-only, and now contradicted by `_headers` |
| `index.html`, `waitlist.html` | changed | Form rewired to Web3Forms |
| `assets/js/site.js` | changed | Web3Forms submit, honeypot, success-message fix |
| `assets/css/site.css` | changed | Dropdown chevron fix |
| all other `.html` | changed | Asset version bump (`css?v=4`, `js?v=6`) |
| `go-live.sh` | changed | No longer references `netlify.toml` |

The version bump matters: `_headers` caches `/assets/*` for a year as
`immutable`, so without a new `?v=` returning visitors keep the old CSS and
would still see the tiled-arrow bug.

---

## Cloudflare Pages project settings

If the project already exists, confirm these under **Settings → Builds**:

- **Framework preset:** None
- **Build command:** *(empty)*
- **Build output directory:** `/`

There is no build step. Pages serves the repo as-is.

---

## The form now runs on Web3Forms

Cloudflare Pages is static-only and returns **405 for POST**, so the form
submits to Web3Forms instead, which emails each signup.

The access key is the one from your old site:
`cdcdabb7-57a1-40a3-9680-48c15336f0be`

**Confirm it still delivers somewhere you read.** I deliberately did not send a
test submission - that would email a stranger's inbox if the key is stale or
was registered to an address you no longer check. Submit one yourself from the
live preview and confirm it arrives.

If it doesn't, get a fresh key at [web3forms.com](https://web3forms.com) (email
in, key back, no account) and replace it in **both** `index.html` and
`waitlist.html`.

### How it behaves

- **JS on** (virtually everyone): posts JSON, shows the inline confirmation
- **JS off:** normal form POST, Web3Forms redirects to `thanks.html`
- **Honeypot:** a hidden `botcheck` checkbox; bots that tick it are dropped
- **Failure:** a non-2xx *or* `success: false` both show the error and keep the
  form usable. Web3Forms can return HTTP 200 with `success: false` on a bad key
  or exhausted quota, and treating that as a win would show a confirmation for
  a lead that was never captured

Free tier is 250 submissions/month. Worth watching around launch.

Mailchimp is unchanged and still gated to `brandywinedpc.com`, so preview
testing can't pollute your live audience.

---

## Confirm the preview is still hidden

After the push completes:

```bash
curl -sI https://brandywinedpc-site.pages.dev/ | grep -i x-robots-tag
```

**Expect:** `x-robots-tag: noindex, nofollow, noarchive`

No output means `_headers` didn't deploy - check it's at the **repo root**, not
in a subfolder.

```bash
curl -sI https://brandywinedpc-site.pages.dev/assets/css/site.css?v=4 | grep -i cache-control
```

**Expect:** `public, max-age=31536000, immutable`

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://brandywinedpc-site.pages.dev/about-dr-katz
```

**Expect:** `301`

---

## Launch day

### 1. Clear the blockers

See [LAUNCH-BLOCKERS.md](LAUNCH-BLOCKERS.md) - the founding-member `[XX]`
placeholders, the Web3Forms key confirmation, and the Mailchimp merge fields.

### 2. Flip the search guards

```bash
./go-live.sh
```

Then commit and push. It flips `robots.txt` and strips the noindex from
`_headers` together, then verifies.

### 3. Attach the domain

Because the domain is registered *and* on DNS at Cloudflare, this is far
simpler than the Netlify path was - no manual CNAMEs, no certificate wrangling.

**Workers & Pages → your project → Custom domains → Set up a custom domain**

Add `brandywinedpc.com`, then `www.brandywinedpc.com`. Cloudflare creates the
DNS records and issues the certificate itself.

### 4. Redirect www to the bare domain

`_redirects` cannot do this - it has no hostname matching. Use the dashboard:

**Rules → Redirect Rules → Create rule**
- If: `Hostname equals www.brandywinedpc.com`
- Then: Dynamic redirect, **301**, to
  `concat("https://brandywinedpc.com", http.request.uri.path)`

Serving both hostnames splits your search signal, which works directly against
getting Morgan's name to rank.

### 5. Verify it's genuinely public

```bash
curl -sI https://brandywinedpc.com | grep -i x-robots-tag
```

**Expect no output.** Any output means the site is still invisible to Google.
This is the easiest thing to get wrong and it has no visible symptom.

```bash
curl -s https://brandywinedpc.com/robots.txt
```

Should show `Allow: /` and the sitemap line.

### 6. Tell Google it exists

1. **Search Console** → add `brandywinedpc.com` (your verification TXT record
   is already in Cloudflare)
2. Submit `https://brandywinedpc.com/sitemap.xml`
3. **URL Inspection → Request indexing** on `/about.html` specifically - that's
   the page that has to rank for Morgan's name

---

## Rolling back

**Workers & Pages → your project → Deployments →** pick an earlier one →
**Rollback**. Instant, and every past deploy is kept.

To pull the site off the internet entirely, remove the custom domain from the
Pages project.

---

## Shutting down Netlify

Once Cloudflare is serving correctly, delete the Netlify site. Two public
copies of the same site split search signal, and the Netlify one now has a
dead form - its markup no longer contains the Netlify form attributes, so
submissions there would fail silently.
