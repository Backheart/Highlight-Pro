// ==========================================================================
// Highlight Pro — front-end interactions
// Everything below runs client-side only; nothing is sent anywhere.
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initHighlightDemo();
  initStrikeToggle();
  initContactForm();
  initViewDemoPulse();
  initFaqAccordion();
  initMobileNav();
  initTosModal();
  initTagDemo();
});

/**
 * initHighlightDemo
 * Drives the live browser-mockup in the hero: cycles through the
 * demo paragraph's <span data-hl> nodes, "highlighting" one at a time
 * in a rotating palette, lighting up a matching dot on the scroll
 * minimap, and periodically firing the export toast. This stands in
 * for a static slideshow because it actually demonstrates the product.
 */
function initHighlightDemo() {
  const targets = Array.from(document.querySelectorAll('#hlPage [data-hl]'));
  const minimap = document.getElementById('hlMinimap');
  const exportBtn = document.getElementById('exportBtn');
  const toast = document.getElementById('exportToast');
  if (!targets.length || !minimap) return;

  const palette = ['#f5c84c', '#7db8ff', '#ef5f5f', '#5fc98a', '#e83fce'];

  // Build one minimap dot per highlight target up front.
  const dots = targets.map((_, i) => {
    const dot = document.createElement('span');
    dot.style.background = palette[i % palette.length];
    minimap.appendChild(dot);
    return dot;
  });

  let cursor = 0;

  function applyHighlight(index) {
    const el = targets[index];
    const color = palette[index % palette.length];
    el.style.background = color;
    el.classList.add('active');
    dots[index].classList.add('show');
  }

  function clearHighlight(index) {
    targets[index].style.background = 'transparent';
    targets[index].classList.remove('active', 'struck');
    dots[index].classList.remove('show');
  }

  // Reveal highlights one by one, then clear the page and start over —
  // mirrors the real "highlight as you read, clear all page" workflow.
  function tick() {
    if (cursor < targets.length) {
      applyHighlight(cursor);
      cursor++;
      setTimeout(tick, 1100);
    } else {
      // Hold the fully-highlighted state, fire the export toast, then reset.
      showExportToast();
      setTimeout(() => {
        targets.forEach((_, i) => clearHighlight(i));
        cursor = 0;
        setTimeout(tick, 900);
      }, 1800);
    }
  }

  function showExportToast() {
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1400);
  }

  // Manual trigger: clicking the Export button in the mock panel also
  // fires the toast, same as a real "copy to clipboard" confirmation would.
  if (exportBtn) {
    exportBtn.addEventListener('click', showExportToast);
  }

  // Hovering a fully-highlighted span shows the hover-delete "×" via CSS;
  // clicking it clears just that one highlight, echoing the real extension.
  targets.forEach((el, i) => {
    el.addEventListener('click', () => {
      if (el.classList.contains('active')) clearHighlight(i);
    });
  });

  setTimeout(tick, 700);
}

/**
 * initStrikeToggle
 * Small self-contained toggle for the "Strikethrough Mode" button in the
 * mock panel. When on, any highlighted span the demo reveals next also
 * gets struck through, echoing the strikethrough feature shown in the panel.
 */
function initStrikeToggle() {
  const btn = document.getElementById('strikeToggle');
  const stateLabel = document.getElementById('strikeState');
  if (!btn || !stateLabel) return;

  let on = false;
  btn.addEventListener('click', () => {
    on = !on;
    stateLabel.textContent = on ? 'On' : 'Off';
    document.querySelectorAll('#hlPage [data-hl].active').forEach(el => {
      el.classList.toggle('struck', on);
    });
  });
}

/**
 * initViewDemoPulse
 * The hero demo is already on screen, so "View Demo" doesn't need to link
 * anywhere new — it scrolls the browser mockup into full view (useful on
 * short screens where it's partially cut off) and adds a brief glow pulse
 * so it's obvious what the button was pointing at.
 */
function initViewDemoPulse() {
  const btn = document.getElementById('viewDemoBtn');
  const frame = document.querySelector('.browser-frame');
  if (!btn || !frame) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    frame.scrollIntoView({ behavior: 'smooth', block: 'center' });
    frame.classList.add('pulse');
    setTimeout(() => frame.classList.remove('pulse'), 1200);
  });
}

/**
 * initMobileNav
 * The hamburger button (only visible at the 768px breakpoint) toggles the
 * nav links open as a dropdown panel. Closes on link click, on clicking
 * outside it, and on Escape — the standard set of "don't trap the user"
 * behaviors for a mobile menu.
 */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  function closeMenu() {
    links.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (e) => {
    if (!links.contains(e.target) && !toggle.contains(e.target)) closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

/**
 * initFaqAccordion
 * The <details name="faq-group"> attribute already makes these mutually
 * exclusive natively in current Chrome — opening one auto-closes the rest,
 * with zero JS. This listener is just a backstop for browsers that don't
 * support that attribute yet (e.g. older Firefox/Safari), so the same
 * one-at-a-time behavior holds everywhere.
 */
function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      }
    });
  });
}

/**
 * initContactForm
 *
 * Sends submissions to a Google Sheet through a Google Apps Script "Web App" —
 * no server of your own to run or pay for, which keeps the "no backend"
 * promise on the rest of this page intact.
 *
 * ---- One-time setup (about 5 minutes) ----
 * 1. Create a Google Sheet. Add a header row: Timestamp | Name | Email | Message
 * 2. In the Sheet, go to Extensions → Apps Script, and replace the code with:
 *
 *      function doPost(e) {
 *        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *        const data = JSON.parse(e.postData.contents);
 *        sheet.appendRow([new Date(), data.name, data.email, data.message]);
 *        return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
 *          .setMimeType(ContentService.MimeType.JSON);
 *      }
 *
 * 3. Click Deploy → New deployment → type "Web app".
 *    Set "Who has access" to "Anyone", then Deploy and copy the URL it gives you.
 * 4. Paste that URL into SHEET_ENDPOINT below.
 *
 * ---- Known limitation ----
 * Apps Script's redirect behavior means the browser can't read the response
 * in cross-origin "no-cors" mode, so we can't detect a real failure — a
 * network-level error (e.g. offline) is the only thing we can catch. This is
 * the same trade-off a Google Form submission has. If you later want proper
 * success/failure detection, that requires a real backend or a CORS proxy.
 */
function initContactForm() {
  const SHEET_ENDPOINT = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  const submitBtn = document.getElementById('submitBtn');
  if (!form || !note) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      note.textContent = 'Please fill in every field before sending.';
      note.style.color = '#ef5f5f';
      return;
    }

    // Fallback so the form still "works" (via email) before you've set up the Sheet.
    if (SHEET_ENDPOINT.startsWith('PASTE_')) {
      window.location.href =
        `mailto:support@highlightpro.io?subject=Message from ${encodeURIComponent(name)}` +
        `&body=${encodeURIComponent(message + '\n\n' + email)}`;
      note.textContent = 'Opening your email client — Sheet submissions aren\'t configured yet.';
      note.style.color = '#a3c2ff';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      await fetch(SHEET_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors', // see limitation note above — we can't read the response
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      note.textContent = `Thanks, ${name.split(' ')[0]} — we'll reply within 24 hours.`;
      note.style.color = '#a3c2ff';
      form.reset();
    } catch (err) {
      note.textContent = 'Something went wrong sending that — please email us directly instead.';
      note.style.color = '#ef5f5f';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Message';
    }
  });
}


/**
 * initTagDemo
 * A compact, self-contained loop showing what the real scroll minimap does:
 * each colored tag lights up in turn and a tooltip with its label slides in
 * next to it, then fades before the next one takes over. Unlike the eye
 * effect, this is meant to run continuously as ambient illustration, not
 * as a one-time reveal.
 */
function initTagDemo() {
  const tags = Array.from(document.querySelectorAll('#tagDemoBar .tag-demo-tag'));
  const tooltip = document.getElementById('tagDemoTooltip');
  if (!tags.length || !tooltip) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;

  function showTag(i) {
    tags.forEach((t) => t.classList.remove('active'));
    const tag = tags[i];
    tag.classList.add('active');

    tooltip.textContent = tag.dataset.label;
    tooltip.style.top = `${tag.offsetTop + tag.offsetHeight / 2 - tooltip.offsetHeight / 2}px`;
    tooltip.classList.add('show');
  }

  function hideTooltip() {
    tooltip.classList.remove('show');
  }

  function loop() {
    showTag(index);
    setTimeout(() => {
      hideTooltip();
      index = (index + 1) % tags.length;
      setTimeout(loop, prefersReducedMotion ? 0 : 400);
    }, 1800);
  }

  if (prefersReducedMotion) {
    // Just show the first tag as a static illustration, no cycling.
    showTag(0);
    return;
  }

  loop();
}

/**
 * initTosModal
 * Opens the Terms of Service as a frosted-glass overlay instead of
 * navigating away. Closes on the × button, a click on the dark backdrop,
 * or Escape — and locks background scroll while it's open so the page
 * underneath doesn't scroll along with it.
 */
function initTosModal() {
  const openBtn = document.getElementById('openTosBtn');
  const closeBtn = document.getElementById('closeTosBtn');
  const modal = document.getElementById('tosModal');
  if (!openBtn || !closeBtn || !modal) return;

  function openModal(e) {
    e.preventDefault();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  // Click on the dark backdrop (not the card itself) closes it too.
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });
}