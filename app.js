/* Self-contained, no analytics or network requests. The demo does NOT submit orders. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const services = ['Диван', 'Кресло', 'Матрас', 'Стул', 'Ковёр', 'Ковролин', 'Другое изделие'];
  const state = { items: [{ id: 1, service: 'Диван', qty: 1 }], nextId: 2, photos: [], toastTimer: null };
  const config = window.HIMCHISTKA75_CONFIG || {};
  const container = $('#items-container');
  const countEl = $('#summary-count');
  const summaryEl = $('#summary-text');
  const copyStatus = $('#copy-status');
  const photoInput = $('#photos');
  const photoPreviews = $('#photo-previews');
  const photoMessage = $('#photo-message');
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
  const plural = (number, forms) => {
    const n = Math.abs(number) % 100, d = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (d > 1 && d < 5) return forms[1];
    if (d === 1) return forms[0];
    return forms[2];
  };
  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => el.classList.remove('visible'), 3100);
  }
  function renderItems() {
    container.innerHTML = state.items.map((item, i) => `
      <div class="item-row" data-item="${item.id}">
        <label class="visually-hidden" for="service-${item.id}">Предмет ${i + 1}</label>
        <select id="service-${item.id}" class="item-select" data-select="${item.id}">
          ${services.map(name => `<option value="${escapeHTML(name)}" ${item.service === name ? 'selected' : ''}>${escapeHTML(name)}</option>`).join('')}
        </select>
        <div class="item-qty">
          <button type="button" class="qty-btn" data-qty="${item.id}" data-step="-1" aria-label="Уменьшить количество ${escapeHTML(item.service)}" ${item.qty === 1 ? 'disabled' : ''}><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#minus"></use></svg></button>
          <strong aria-label="Количество ${item.qty}">${item.qty}</strong>
          <button type="button" class="qty-btn" data-qty="${item.id}" data-step="1" aria-label="Увеличить количество ${escapeHTML(item.service)}" ${item.qty === 20 ? 'disabled' : ''}><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#plus"></use></svg></button>
        </div>
        <button type="button" class="item-remove" data-remove="${item.id}" aria-label="Удалить ${escapeHTML(item.service)}" ${state.items.length === 1 ? 'disabled' : ''}><svg class="icon" aria-hidden="true"><use href="assets/icons.svg#trash"></use></svg></button>
      </div>`).join('');
    updateSummary();
  }
  function addItem(service = 'Диван') {
    if (state.items.length >= 12) { toast('Можно добавить не больше 12 видов предметов.'); return; }
    state.items.push({ id: state.nextId++, service: services.includes(service) ? service : 'Диван', qty: 1 });
    renderItems();
  }
  function problemValue() {
    return ($('input[name="problem"]:checked') || {}).value || 'Обычная чистка';
  }
  function requestText() {
    const text = ['Здравствуйте! Хотелось бы узнать предварительную стоимость химчистки у «Химчистки 75».', '', 'Нужно почистить:'];
    state.items.forEach((item, i) => text.push(`${i + 1}. ${item.service} — ${item.qty} ${plural(item.qty, ['шт.', 'шт.', 'шт.'])}`));
    text.push('', `Задача: ${problemValue()}.`);
    text.push(`Материал: ${$('#material').value}.`);
    const dims = $('#dimensions').value.trim();
    const comment = $('#comment').value.trim();
    if (dims) text.push(`Размеры: ${dims}.`);
    if (comment) text.push(`Комментарий: ${comment}`);
    if (state.photos.length) text.push(`Фотографий подготовлено: ${state.photos.length} (приложу отдельно).`);
    text.push('', 'Подскажите, пожалуйста, ориентировочную стоимость, возможность и условия выполнения работ.');
    return text.join('\n');
  }
  function updateSummary() {
    if (!countEl || !summaryEl) return;
    const total = state.items.reduce((sum, item) => sum + item.qty, 0);
    countEl.textContent = `${total} ${plural(total, ['предмет', 'предмета', 'предметов'])} · ${state.items.length} ${plural(state.items.length, ['позиция', 'позиции', 'позиций'])}`;
    summaryEl.value = requestText();
    if (copyStatus) copyStatus.textContent = '';
  }
  container.addEventListener('click', (event) => {
    const qty = event.target.closest('[data-qty]');
    const rm = event.target.closest('[data-remove]');
    if (qty) {
      const item = state.items.find(x => x.id === Number(qty.dataset.qty));
      if (item) { item.qty = Math.max(1, Math.min(20, item.qty + Number(qty.dataset.step))); renderItems(); }
    } else if (rm && state.items.length > 1) {
      state.items = state.items.filter(x => x.id !== Number(rm.dataset.remove));
      renderItems();
    }
  });
  container.addEventListener('change', (event) => {
    const select = event.target.closest('[data-select]');
    if (select) {
      const item = state.items.find(x => x.id === Number(select.dataset.select));
      if (item && services.includes(select.value)) { item.service = select.value; renderItems(); }
    }
  });
  $('#add-item').addEventListener('click', () => addItem());
  $$('[data-add]').forEach(btn => btn.addEventListener('click', () => {
    addItem(btn.dataset.add);
    $('#estimate').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    toast(`${btn.dataset.add} добавлен в запрос.`);
  }));
  ['material', 'dimensions', 'comment'].forEach(id => {
    const el = $('#' + id);
    el.addEventListener(id === 'material' ? 'change' : 'input', updateSummary);
  });
  $$('input[name="problem"]').forEach(input => input.addEventListener('change', updateSummary));
  async function copyRequest() {
    const text = requestText();
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); copied = true; } catch (_) { /* Use fallback. */ }
    }
    if (!copied) {
      summaryEl.focus({ preventScroll: true });
      summaryEl.select();
      try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
      summaryEl.setSelectionRange(0, 0);
    }
    copyStatus.textContent = copied ? 'Текст скопирован. Фото нужно приложить отдельно.' : 'Не удалось скопировать автоматически — выделите текст в поле выше.';
    toast(copied ? 'Текст запроса скопирован!' : 'Скопируйте текст вручную из поля.');
  }
  $('#copy-request').addEventListener('click', copyRequest);
  // File images are held in memory as object URLs. Nothing leaves the browser.
  function releasePhotos() {
    state.photos.forEach(file => URL.revokeObjectURL(file.url));
    state.photos = [];
  }
  function renderPhotos() {
    photoPreviews.replaceChildren();
    state.photos.forEach((photo, index) => {
      const slot = document.createElement('div');
      slot.className = 'photo-item';
      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = `Выбранная фотография ${index + 1}: ${photo.name}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `Удалить фотографию ${photo.name}`);
      button.innerHTML = '<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#x"></use></svg>';
      button.addEventListener('click', () => {
        URL.revokeObjectURL(photo.url);
        state.photos.splice(index, 1);
        photoInput.value = '';
        photoMessage.textContent = '';
        renderPhotos();
      });
      slot.append(img, button);
      photoPreviews.appendChild(slot);
    });
    updateSummary();
  }
  photoInput.addEventListener('change', () => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    let error = '';
    for (const file of [...photoInput.files]) {
      if (state.photos.length >= 3) { error = 'Не больше 3 фотографий. Лишние файлы не добавлены.'; break; }
      if (!allowed.has(file.type)) { error = 'Можно выбрать только JPG, PNG или WebP.'; continue; }
      if (file.size > 6 * 1024 * 1024) { error = `Файл «${file.name}» больше 6 МБ и не добавлен.`; continue; }
      const signature = `${file.name}:${file.size}:${file.lastModified}`;
      if (state.photos.some(p => p.signature === signature)) continue;
      state.photos.push({ url: URL.createObjectURL(file), name: file.name, signature });
    }
    photoInput.value = '';
    photoMessage.textContent = error;
    renderPhotos();
  });
  window.addEventListener('pagehide', releasePhotos, { once: true });
  $('#reset-form').addEventListener('click', () => {
    state.items = [{ id: state.nextId++, service: 'Диван', qty: 1 }];
    $('input[name="problem"][value="Обычная чистка"]').checked = true;
    $('#material').selectedIndex = 0;
    $('#dimensions').value = '';
    $('#comment').value = '';
    releasePhotos();
    photoInput.value = '';
    photoMessage.textContent = '';
    photoPreviews.replaceChildren();
    renderItems();
    toast('Подбор очищен.');
  });
  // Comparison: range control and direct pointer movement on the artwork.
  const stage = $('#compare-stage'), slider = $('#compare-range'), percent = $('#compare-percent');
  function setSplit(value) {
    const n = Math.max(5, Math.min(95, Number(value)));
    stage.style.setProperty('--split', n + '%');
    slider.value = String(n);
    percent.textContent = n + '%';
  }
  slider.addEventListener('input', e => setSplit(e.target.value));
  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    stage.setPointerCapture?.(e.pointerId);
    movePointer(e);
  });
  stage.addEventListener('pointermove', e => {
    if (e.buttons || (e.pointerType === 'touch' && stage.hasPointerCapture?.(e.pointerId))) movePointer(e);
  });
  function movePointer(e) {
    const rect = stage.getBoundingClientRect();
    setSplit(Math.round(((e.clientX - rect.left) / rect.width) * 100));
  }
  // Mobile navigation closes on click, Escape, and viewport switch.
  const toggle = $('#menu-toggle'), nav = $('#mobile-nav');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    const use = $('use', toggle);
    if (use) use.setAttribute('href', `assets/icons.svg#${open ? 'x' : 'menu'}`);
  }
  toggle.addEventListener('click', () => setMenu(nav.hidden));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !nav.hidden) { setMenu(false); toggle.focus(); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 940 && !nav.hidden) setMenu(false); }, { passive: true });
  // Header and back-to-top.
  const header = $('.site-header'), backTop = $('#back-top');
  const updateScrollState = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 12);
    backTop.classList.toggle('visible', y > 650);
  };
  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  // Scroll entrances, with graceful fallback if IntersectionObserver is unavailable.
  const revealNodes = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('js-reveals');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.065, rootMargin: '0px 0px 70px 0px' });
    revealNodes.forEach(el => observer.observe(el));
  } else {
    revealNodes.forEach(el => el.classList.add('is-visible'));
  }
  if ($('#year')) $('#year').textContent = String(new Date().getFullYear());
  if (config.phone && $('[data-company-phone]')) $('[data-company-phone]').textContent = config.phone;
  if (config.phoneHref && $('[data-company-phone]')) $('[data-company-phone]').href = config.phoneHref;
  renderItems();
})();
