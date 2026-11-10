(() => {
  'use strict';

  // Clinic WhatsApp number, international format without "+" or leading zero.
  // 0598957544 -> 966598957544. This is the number on taj-elite.com.
  const WHATSAPP = '966598957544';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduceMotion ? 'auto' : 'smooth';
  const waLink = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

  // Events for Google Tag Manager. No personal data (name, phone) is ever pushed.
  const pushEvent = (event, params = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
  };

  // WhatsApp and phone-call clicks anywhere on the page
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href.startsWith('tel:')) pushEvent('click_call');
    else if (href.includes('wa.me/')) pushEvent('click_whatsapp');
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // WhatsApp links get their prefilled message from data-wa
  $$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });

  /* ---------- Booking forms (the main one and one per service) ---------- */
  const toLatinDigits = (s) => s
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

  const rules = {
    name: (v) => (v.trim().length >= 2 ? '' : 'اكتب اسمك.'),
    phone: (v) => {
      const digits = toLatinDigits(v).replace(/[\s\-().]/g, '').replace(/^\+/, '');
      return /^\d{8,15}$/.test(digits) ? '' : 'اكتب رقم جوال صحيح، مثل 05xxxxxxxx.';
    },
    service: (v) => (v ? '' : 'اختر الخدمة المطلوبة.'),
  };

  const setError = (el, message) => {
    const field = el.closest('.field');
    $('.err', field).textContent = message;
    if (message) {
      field.setAttribute('data-invalid', '');
      el.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('data-invalid');
      el.removeAttribute('aria-invalid');
    }
  };

  const check = (el) => {
    const message = rules[el.name](el.value);
    setError(el, message);
    return !message;
  };

  // getService() returns the service name for this form (a fixed one, or the dropdown value)
  const setupForm = (form, statusEl, getService) => {
    const fields = ['name', 'phone', 'service'].map((k) => form.elements[k]).filter(Boolean);

    fields.forEach((el) => {
      el.addEventListener('blur', () => { if (el.value) check(el); });
      el.addEventListener('input', () => { if (el.hasAttribute('aria-invalid')) check(el); });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      statusEl.textContent = '';

      const results = fields.map(check);
      const firstInvalid = fields[results.indexOf(false)];
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const name = form.elements.name.value.trim();
      const phone = toLatinDigits(form.elements.phone.value).replace(/\s+/g, '');
      const service = getService();
      const message = `السلام عليكم، أنا ${name}.\nرقم جوالي: ${phone}\nأرغب في حجز موعد بخصوص: ${service}`;

      pushEvent('generate_lead', { service });
      const win = window.open(waLink(message), '_blank', 'noopener');
      if (!win) window.location.href = waLink(message);
      statusEl.textContent = 'تم فتح واتساب. أرسل الطلب لإتمام الحجز.';
    });
  };

  // Main form (service chosen from the dropdown)
  const mainForm = $('#book-form');
  setupForm(mainForm, $('#form-status'), () => mainForm.elements.service.value);

  // One booking form at the end of each service, with that service already set
  const tpl = $('#svc-book-tpl');
  $$('.svc').forEach((section) => {
    const service = $('.section-title', section).textContent.trim();
    const box = tpl.content.firstElementChild.cloneNode(true);
    $('[data-svc-name]', box).textContent = service;

    // Unique ids so every label points at its own input and error message
    $$('.field', box).forEach((field) => {
      const input = $('input', field);
      const err = $('.err', field);
      input.id = `${input.name}-${section.id}`;
      err.id = `e-${input.name}-${section.id}`;
      $('label', field).htmlFor = input.id;
      input.setAttribute('aria-describedby', err.id);
    });

    $('.wrap', section).append(box);
    setupForm($('form', box), $('.form-status', box), () => service);
  });

  // "احجز موعدًا" next to a service jumps to that service's booking form
  $$('[data-book]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = $(`#${btn.dataset.book} .svc-book`);
      box.scrollIntoView({ behavior, block: 'center' });
      setTimeout(() => $('input', box).focus({ preventScroll: true }), reduceMotion ? 0 : 450);
    });
  });

  /* ---------- Lightbox ---------- */
  const dialog = $('#lightbox');
  const dialogImg = $('img', dialog);
  if (typeof dialog.showModal === 'function') {
    $$('[data-zoom]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const img = $('img', btn);
        dialogImg.src = img.currentSrc || img.src;
        dialogImg.alt = img.alt;
        dialog.showModal();
      });
    });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  }
})();
