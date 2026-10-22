(() => {
  'use strict';

  // Clinic WhatsApp number in international format, without "+" or leading zero.
  // 0595163550 -> 966595163550 (assumes Saudi Arabia; change if needed).
  const WHATSAPP = '966595163550';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduceMotion ? 'auto' : 'smooth';
  const waLink = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

  // Footer year
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // WhatsApp links get their prefilled message from data-wa
  $$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });

  /* ---------- Booking form ---------- */
  const form = $('#book-form');
  const status = $('#form-status');
  const select = form.elements.service;

  // Single source of truth: the service list is built from the Services section.
  $$('.service').forEach((btn) => {
    select.add(new Option(btn.dataset.service, btn.dataset.service));
  });

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

  ['name', 'phone', 'service'].forEach((key) => {
    const el = form.elements[key];
    el.addEventListener('blur', () => { if (el.value) check(el); });
    el.addEventListener('input', () => { if (el.hasAttribute('aria-invalid')) check(el); });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.textContent = '';

    const fields = ['name', 'phone', 'service'].map((k) => form.elements[k]);
    const results = fields.map(check);
    const firstInvalid = fields[results.indexOf(false)];
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const name = form.elements.name.value.trim();
    const phone = toLatinDigits(form.elements.phone.value).replace(/\s+/g, '');
    const service = form.elements.service.value;
    const message = `السلام عليكم، أنا ${name}.\nرقم جوالي: ${phone}\nأرغب في حجز استشارة بخصوص: ${service}`;

    const win = window.open(waLink(message), '_blank', 'noopener');
    if (!win) window.location.href = waLink(message);
    status.textContent = 'تم فتح واتساب. أرسل الرسالة لإتمام طلبك.';
  });

  // Picking a service pre-fills the form and takes the visitor to it
  $$('.service').forEach((btn) => {
    btn.addEventListener('click', () => {
      select.value = btn.dataset.service;
      setError(select, '');
      $('#book').scrollIntoView({ behavior, block: 'center' });
      const target = form.elements.name.value ? form.elements.phone : form.elements.name;
      setTimeout(() => target.focus({ preventScroll: true }), reduceMotion ? 0 : 450);
    });
  });

  /* ---------- Reviews carousel ---------- */
  const track = $('.track');
  const step = () => {
    const card = $('.card', track);
    return (card ? card.getBoundingClientRect().width : 300) + 20;
  };
  const dir = getComputedStyle(track).direction === 'rtl' ? -1 : 1;
  $('[data-next]').addEventListener('click', () => track.scrollBy({ left: dir * step(), behavior }));
  $('[data-prev]').addEventListener('click', () => track.scrollBy({ left: -dir * step(), behavior }));

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

  /* ---------- Videos: load the Drive player only when asked ---------- */
  $$('.play').forEach((btn) => {
    btn.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.src = `https://drive.google.com/file/d/${btn.dataset.drive}/preview`;
      frame.title = btn.dataset.title;
      frame.allow = 'autoplay; fullscreen';
      frame.allowFullscreen = true;
      btn.replaceWith(frame);
    });
  });
})();
