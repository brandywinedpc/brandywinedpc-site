#!/usr/bin/env bash
#
# go-live.sh - flip Brandywine DPC from pre-launch preview to public.
#
# The site ships deliberately hidden from search engines. Two switches
# enforce that, and forgetting either is a silent failure: the site looks
# perfect and simply never appears in Google.
#
# This flips both at once, then verifies. Run it from the site folder:
#
#     ./go-live.sh
#
# Idempotent - running it twice is harmless. Nothing is deployed by this
# script; commit and push afterwards, and Cloudflare Pages rebuilds.

set -euo pipefail
cd "$(dirname "$0")"

BOLD=$'\033[1m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; OFF=$'\033[0m'

echo "${BOLD}Brandywine DPC - go live${OFF}"
echo

changed=0

# ── 1. robots.txt ───────────────────────────────────────────────────────────
if grep -q '^Disallow: /$' robots.txt 2>/dev/null; then
  cat > robots.txt <<'EOF'
User-agent: *
Allow: /

# Confirmation pages have no search value
Disallow: /thanks.html

Sitemap: https://brandywinedpc.com/sitemap.xml
EOF
  echo "${GREEN}✓${OFF} robots.txt - now allows crawling"
  changed=1
else
  echo "${YELLOW}·${OFF} robots.txt - already live, no change"
fi

# ── 2. _headers (Cloudflare Pages) ──────────────────────────────────────────
if [ -f _headers ] && grep -q 'X-Robots-Tag' _headers; then
  python3 - <<'PY'
import re
src = open('_headers').read()
src = re.sub(r'\n[ \t]*# PRE-LAUNCH[^\n]*\n[ \t]*X-Robots-Tag[^\n]*', '', src)
src = re.sub(r'\n[ \t]*X-Robots-Tag[^\n]*', '', src)   # belt and braces
open('_headers', 'w').write(src)
PY
  echo "${GREEN}✓${OFF} _headers   - noindex removed"
  changed=1
elif [ -f _headers ]; then
  echo "${YELLOW}·${OFF} _headers   - already live, no change"
else
  echo "${RED}✗${OFF} _headers   - MISSING. Cloudflare Pages has no headers without it."
fi

# ── 3. Verify ───────────────────────────────────────────────────────────────
echo
fail=0
[ -f _headers ] && grep -q 'X-Robots-Tag' _headers && { echo "${RED}✗ X-Robots-Tag still present in _headers${OFF}"; fail=1; }
grep -q '^Disallow: /$' robots.txt && { echo "${RED}✗ robots.txt still disallows everything${OFF}"; fail=1; }

if [ "$fail" -eq 1 ]; then
  echo "${RED}Something did not flip. Fix by hand before pushing.${OFF}"
  exit 1
fi

echo "${GREEN}${BOLD}Ready to launch.${OFF}"
echo
if [ "$changed" -eq 0 ]; then
  echo "(Nothing to do - the site was already configured to go live.)"
  echo
fi

cat <<'EOF'
Remaining steps, in order:

  1. Commit and push. Cloudflare Pages rebuilds automatically.

  2. Attach the domain: Cloudflare dashboard -> Workers & Pages -> your
     project -> Custom domains -> add brandywinedpc.com and www.
     Cloudflare wires the DNS and issues the certificate itself.

  3. Add a Redirect Rule so www goes to the bare domain (Rules -> Redirect
     Rules). Serving both splits your search signal.

  4. Confirm the site is genuinely public:
       curl -sI https://brandywinedpc.com | grep -i x-robots-tag
     Expect NO OUTPUT. Any output means the site is still hidden.

  5. Submit https://brandywinedpc.com/sitemap.xml in Google Search Console,
     then request indexing on /about.html specifically.

Still outstanding regardless of this script - see LAUNCH-BLOCKERS.md:
  · The founding-member section still has [XX] placeholders and a DRAFT ribbon
  · Confirm the Web3Forms access key delivers to an inbox you actually read
  · Mailchimp needs ZIP and HOUSEHOLD merge fields created
EOF
