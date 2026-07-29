#!/usr/bin/env bash
#
# go-live.sh - flip Brandywine DPC from pre-launch preview to public.
#
# The site ships deliberately hidden from search engines. Two separate
# switches enforce that, and forgetting either one is a silent failure:
# the site looks perfect and simply never appears in Google.
#
# This script flips both at once, then verifies. Run it from the site folder:
#
#     ./go-live.sh
#
# It is idempotent - running it twice is harmless. Nothing is deployed by
# this script; commit/redeploy afterwards as usual.

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

# ── 2. X-Robots-Tag noindex header ──────────────────────────────────────────
if grep -q 'X-Robots-Tag' netlify.toml; then
  python3 - <<'PY'
import re
src = open('netlify.toml').read()
# Drop the banner comment block and the X-Robots-Tag line together.
src = re.sub(
    r'\n[ \t]*# ╔[^\n]*\n(?:[ \t]*#[^\n]*\n)*[ \t]*X-Robots-Tag[^\n]*\n',
    '\n',
    src,
)
# Belt and braces: remove a bare X-Robots-Tag line if the block form didn't match.
src = re.sub(r'\n[ \t]*X-Robots-Tag[^\n]*', '', src)
open('netlify.toml', 'w').write(src)
PY
  echo "${GREEN}✓${OFF} netlify.toml - noindex header removed"
  changed=1
else
  echo "${YELLOW}·${OFF} netlify.toml - already live, no change"
fi

# ── 3. Verify ───────────────────────────────────────────────────────────────
echo
fail=0
grep -q 'X-Robots-Tag' netlify.toml && { echo "${RED}✗ X-Robots-Tag still present in netlify.toml${OFF}"; fail=1; }
grep -q '^Disallow: /$' robots.txt   && { echo "${RED}✗ robots.txt still disallows everything${OFF}"; fail=1; }

if [ "$fail" -eq 1 ]; then
  echo "${RED}Something did not flip. Fix by hand before deploying.${OFF}"
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

  1. Redeploy to Netlify so the new headers take effect.

  2. Point the domain (Cloudflare DNS - see DEPLOY.md "Launch day"):
       CNAME  @    <your-site>.netlify.app   DNS only (grey cloud)
       CNAME  www  <your-site>.netlify.app   DNS only (grey cloud)

  3. Add the custom domain in Netlify and let it issue the certificate.

  4. Confirm the header is actually gone from the live site:
       curl -sI https://brandywinedpc.com | grep -i x-robots-tag
     Expect NO OUTPUT. Any output means the site is still hidden.

  5. Submit https://brandywinedpc.com/sitemap.xml in Google Search Console.

Still outstanding regardless of this script - see LAUNCH-BLOCKERS.md:
  · The founding-member section still has [XX] placeholders and a DRAFT ribbon
  · Mailchimp needs ZIP and HOUSEHOLD merge fields created
EOF
