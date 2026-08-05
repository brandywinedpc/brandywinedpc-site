/* ==========================================================================
   Brandywine Direct Primary Care - site behavior

   Principles:
   - The site works with JavaScript disabled. This file enhances; it never
     enables. The waitlist form has a real HTML action and will submit
     normally if this script fails to load.
   - No dependencies. No build step. Nothing to keep up to date.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     CONFIG - the only things you should need to change
     ------------------------------------------------------------------------ */

  var MAILCHIMP = {
    // Pulled from the existing site's embedded form. JSONP endpoint, so no
    // API key is exposed and no server is needed.

    // Only pushes to Mailchimp from the real domain. On preview deploys
    // (*.pages.dev) and localhost this stays off, so testing the form does
    // NOT put fake people into the live audience. It switches itself on the
    // moment the site is served from brandywinedpc.com - nothing to remember
    // at launch, and nothing to clean up afterwards.
    //
    // Web3Forms still emails every submission in all environments, so you can
    // confirm the form works end to end while testing.
    enabled: /(^|\.)brandywinedpc\.com$/i.test(window.location.hostname),

    u:  '28d9c6d094be6496bf7ce6613',
    id: '72bcd7bf17',
    host: 'https://gmail.us3.list-manage.com',

    // IMPORTANT: ZIP and HOUSEHOLD must exist as merge fields in the Mailchimp
    // audience, or Mailchimp silently drops them. Audience > Settings >
    // Audience fields and *|MERGE|* tags. Web3Forms emails the full submission
    // regardless, so a misconfiguration here loses segmentation data, not leads.
    fields: { email: 'EMAIL', first: 'FNAME', last: 'LNAME', zip: 'ZIP', household: 'HOUSEHOLD' }
  };

  /* ------------------------------------------------------------------------
     HEADER
     ------------------------------------------------------------------------ */

  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var burger = document.querySelector('.hamburger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    // Close on nav click (anchor links on the same page) and on Escape.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        burger.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        burger.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
        burger.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     REVEAL ON SCROLL
     ------------------------------------------------------------------------ */

  var reveals = document.querySelectorAll('[data-reveal]');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reveals.length) {
    /* nothing to do */
  } else if (reduced || !('IntersectionObserver' in window)) {
    // Show everything immediately rather than leaving content invisible.
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });

    // Failsafe. Observers do not fire while a document is hidden, so a page
    // opened in a background tab can sit with every section at opacity 0.
    // If anything is still unrevealed after 4s, just show it - a missed
    // animation is nothing, unreadable content is everything.
    setTimeout(function () {
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-reveal]:not(.is-visible)'),
        function (el) { el.classList.add('is-visible'); }
      );
    }, 4000);
  }

  /* ------------------------------------------------------------------------
     DRAFT GUARD
     Unverified numbers must not ship silently. The CSS shows a ribbon; this
     also shouts in the console for anyone testing a deploy.
     ------------------------------------------------------------------------ */

  var draft = document.querySelectorAll('[data-draft="true"]');
  if (draft.length) {
    console.warn(
      '%cBRANDYWINE - LAUNCH BLOCKER',
      'background:#8C3A2B;color:#fff;padding:2px 6px;border-radius:2px;font-weight:600',
      '\n' + draft.length + ' section(s) still contain unverified numbers:\n  ' +
      Array.prototype.map.call(draft, function (el) {
        return el.getAttribute('aria-label') || el.getAttribute('data-draft-label');
      }).join('\n  ') +
      '\n\nFill in the real figures, then delete the data-draft and' +
      '\ndata-draft-label attributes. See LAUNCH-BLOCKERS.md.'
    );
  }

  /* ------------------------------------------------------------------------
     WAITLIST FORM
     Web3Forms is the source of truth. Mailchimp is best-effort: if it fails,
     times out, or is misconfigured, the visitor never sees an error and the
     lead is still captured.
     ------------------------------------------------------------------------ */

  var forms = document.querySelectorAll('[data-waitlist-form]');

  Array.prototype.forEach.call(forms, function (form) {
    var statusEl = form.querySelector('.form-status');
    var submitBtn = form.querySelector('[type="submit"]');
    var successEl = document.getElementById(form.dataset.successTarget || '');

    // Web3Forms redirects here after a NO-JAVASCRIPT submit. The markup
    // hardcodes the production URL so it's correct on the real site even with
    // JS off; this rewrites it to whatever origin we're actually on, so
    // testing from a *.pages.dev preview doesn't bounce people to the live
    // domain. With JS enabled the redirect is never used at all.
    var redirectField = form.querySelector('[name="redirect"]');
    if (redirectField) redirectField.value = window.location.origin + '/thanks.html';

    /* --- inline validation ------------------------------------------------ */

    var setError = function (input, message) {
      var errEl = form.querySelector('#' + input.id + '-error');
      if (errEl) errEl.textContent = message || '';
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      return !message;
    };

    var validateField = function (input) {
      var v = (input.value || '').trim();

      if (input.hasAttribute('required') && !v) {
        return setError(input, 'This field is required.');
      }
      if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        return setError(input, 'Please enter a valid email address.');
      }
      if (input.name === 'zip' && v && !/^\d{5}$/.test(v)) {
        return setError(input, 'Please enter a 5-digit ZIP code.');
      }
      return setError(input, '');
    };

    var fields = form.querySelectorAll('input[required], select[required], input[name="zip"]');

    Array.prototype.forEach.call(fields, function (input) {
      // Validate on blur, but only clear errors on input - nagging while
      // someone is mid-word is hostile.
      input.addEventListener('blur', function () { validateField(input); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      });
    });

    /* --- helpers ---------------------------------------------------------- */

    var encode = function (data) {
      return Object.keys(data).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
      }).join('&');
    };

    // Mailchimp JSONP. Resolves either way - this must never block the user.
    var pushToMailchimp = function (data) {
      return new Promise(function (resolve) {
        if (!MAILCHIMP.enabled) return resolve(false);

        var cb = 'mcb_' + Date.now();
        var params = {};
        params.u = MAILCHIMP.u;
        params.id = MAILCHIMP.id;
        params[MAILCHIMP.fields.email] = data.email || '';
        params[MAILCHIMP.fields.first] = data.first_name || '';
        params[MAILCHIMP.fields.last] = data.last_name || '';
        params[MAILCHIMP.fields.zip] = data.zip || '';
        params[MAILCHIMP.fields.household] = data.household_type || '';
        params.c = cb;

        var script = document.createElement('script');
        var done = false;

        var cleanup = function (ok) {
          if (done) return;
          done = true;
          try { delete window[cb]; } catch (e) { window[cb] = undefined; }
          if (script.parentNode) script.parentNode.removeChild(script);
          clearTimeout(timer);
          resolve(ok);
        };

        window[cb] = function () { cleanup(true); };
        script.onerror = function () { cleanup(false); };
        var timer = setTimeout(function () { cleanup(false); }, 6000);

        script.src = MAILCHIMP.host + '/subscribe/post-json?' + encode(params);
        document.body.appendChild(script);
      });
    };

    /* --- submit ----------------------------------------------------------- */

    form.addEventListener('submit', function (e) {
      // Honeypot: a filled hidden field means a bot. Fail silently so it
      // doesn't learn anything.
      // Web3Forms honeypot: a checked "botcheck" box means a bot filled the
      // hidden field. Fail silently so it doesn't learn anything.
      var hp = form.querySelector('[name="botcheck"]');
      if (hp && hp.checked) { e.preventDefault(); return; }

      var allValid = true;
      Array.prototype.forEach.call(fields, function (input) {
        if (!validateField(input)) allValid = false;
      });

      if (!allValid) {
        e.preventDefault();
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        if (statusEl) {
          statusEl.textContent = 'Please check the highlighted fields.';
          statusEl.setAttribute('data-state', 'error');
        }
        return;
      }

      // Only take over the submit if we can do it properly. Otherwise let the
      // browser post the form the old-fashioned way.
      if (!window.fetch || !window.Promise || !window.FormData) return;

      e.preventDefault();

      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (value, key) { data[key] = value; });

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.label = submitBtn.textContent;
        submitBtn.textContent = 'Joining…';
      }
      if (statusEl) { statusEl.textContent = ''; statusEl.removeAttribute('data-state'); }

      // Web3Forms. Posts JSON and returns { success: true|false, message }.
      // A non-2xx OR success:false both count as failure - Web3Forms can
      // return 200 with success:false (bad access key, quota reached), and
      // treating that as a win would show a confirmation for a lost lead.
      delete data.botcheck;

      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().catch(function () {
            throw new Error('Unreadable response (' + res.status + ')');
          });
        })
        .then(function (json) {
          if (!json || json.success !== true) {
            throw new Error(json && json.message ? json.message : 'Submission rejected');
          }
          // Best-effort, never blocking the confirmation.
          pushToMailchimp(data);
          showSuccess(data);
        })
        .catch(function (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.label || 'Join the waitlist';
          }
          if (statusEl) {
            statusEl.setAttribute('data-state', 'error');
            statusEl.textContent =
              'Something went wrong on our end. Please email hello@brandywinedpc.com and we\'ll add you by hand.';
          }
          console.error('[waitlist]', err);
        });
    });

    function showSuccess(data) {
      if (successEl) {
        // The comma and space live here, not in the HTML, so the heading
        // reads correctly either way: "You're on the list, Morgan." when a
        // name was given, "You're on the list." when it wasn't.
        var nameEl = successEl.querySelector('[data-success-name]');
        if (nameEl && data.first_name) {
          nameEl.textContent = ', ' + String(data.first_name).trim();
        }
        form.hidden = true;
        successEl.hidden = false;
        successEl.setAttribute('tabindex', '-1');
        successEl.focus();
        if (successEl.getBoundingClientRect().top < 0) {
          successEl.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        }
      } else if (statusEl) {
        statusEl.setAttribute('data-state', 'success');
        statusEl.textContent = 'You\'re on the list. Morgan will be in touch.';
      }
    }
  });

  /* ------------------------------------------------------------------------
     FAQ - allow deep-linking to a question, e.g. /faq#medicare
     ------------------------------------------------------------------------ */

  if (window.location.hash) {
    var target = null;
    try { target = document.querySelector(window.location.hash); } catch (e) { /* invalid selector */ }

    if (target && target.tagName === 'DETAILS') {
      target.open = true;
      // The browser already performed its native anchor jump before the
      // reveal animations changed the layout, so it landed in the wrong
      // place. Re-scroll once the reveal has settled.
      var settle = function () {
        var wrapper = target.closest('[data-reveal]');
        if (wrapper) wrapper.classList.add('is-visible');
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      };
      if ('requestAnimationFrame' in window) {
        requestAnimationFrame(function () { setTimeout(settle, 60); });
      } else {
        setTimeout(settle, 60);
      }
    }
  }

  /* Current year in footers */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
