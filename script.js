// ==========================================================================
// Highlight Pro — front-end interactions
// Everything below runs client-side only; nothing is sent anywhere.
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initHighlightDemo();
  initStrikeToggle();
  initContactForm();
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
 * initContactForm
 * Prevents the default page reload, does a minimal client-side check,
 * and shows an inline confirmation. No network request is made — this
 * is a static demo page, consistent with the "no backend" promise.
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (!form || !note) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      note.textContent = 'Please fill in every field before sending.';
      note.style.color = '#ef5f5f';
      return;
    }

    note.textContent = `Thanks, ${name.split(' ')[0]} — we'll reply within 24 hours.`;
    note.style.color = '#a3c2ff';
    form.reset();
  });
}
