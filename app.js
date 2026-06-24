const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const state = {
  data: null,
  level: 'all',
  lang: 'all',
  budgetOnly: false,
  search: '',
};

// Иконки уровней — имена иконок Lucide (без эмодзи).
const LEVEL_ICONS = { 'Бакалавриат': 'graduation-cap', 'Магистратура': 'book-open', 'Аспирантура': 'microscope' };
const LEVEL_ICON_FALLBACK = 'bookmark';

// ---- Умный поиск: куски слов + терпимость к разным окончаниям ----
const RU_ENDINGS = ['ого','его','ому','ему','ыми','ими','ия','ие','ии','ей','ая','яя','ое','ее','ой','ый','ий','ым','им','ам','ям','ах','ях','ом','ем','ов','ев','ью','а','я','о','е','у','ю','ы','и','й','ь']
  .sort((a, b) => b.length - a.length);

function tokens(t) {
  return (t || '').toLowerCase().replace(/ё/g, 'е').match(/[а-яa-z0-9]+/g) || [];
}
function stem(w) {
  for (const e of RU_ENDINGS) {
    if (w.endsWith(e) && w.length - e.length >= 3) return w.slice(0, -e.length);
  }
  return w;
}
function matchesSearch(qTokens, hay) {
  const words = tokens(hay);
  const stems = words.map(stem);
  return qTokens.every(qt => {
    const qs = stem(qt);
    return words.some((w, i) =>
      w.includes(qt) || (qs.length >= 3 && (stems[i].startsWith(qs) || qs.startsWith(stems[i]))));
  });
}

// Перерисовать SVG-иконки Lucide после вставки разметки.
function refreshIcons() { window.lucide?.createIcons(); }

async function loadData() {
  try {
    // Cache-busting: timestamp в URL + no-store, чтобы CDN/Telegram не отдали закэшированную версию.
    const res = await fetch(`bot_data.json?v=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    state.data = await res.json();
  } catch (e) {
    document.getElementById('dirs-list').innerHTML =
      `<div class="empty"><i data-lucide="alert-triangle"></i><br>Не удалось загрузить данные.<br>${e}</div>`;
    refreshIcons();
    return;
  }
  render();
}

function render() {
  const info = state.data.department_info || {};
  document.getElementById('dept-name').textContent = info.name || 'Кафедра';
  document.getElementById('dept-sub').textContent =
    [info.institute, info.university].filter(Boolean).join(' · ');

  renderLevelChips();
  renderDirections();
  renderFaq();
  renderContacts();
  refreshIcons();
}

function renderLevelChips() {
  const wrap = document.getElementById('level-chips');
  const levels = ['all', ...Object.keys(state.data.directions || {})];
  wrap.innerHTML = levels.map(l => {
    const icon = l === 'all' ? 'layers' : (LEVEL_ICONS[l] || LEVEL_ICON_FALLBACK);
    const label = l === 'all' ? 'Все уровни' : l;
    return `<button class="chip ${state.level === l ? 'active' : ''}" data-level="${l}">`
      + `<i data-lucide="${icon}"></i>${escape(label)}</button>`;
  }).join('');
  refreshIcons();
  wrap.querySelectorAll('.chip').forEach(btn => {
    btn.onclick = () => { state.level = btn.dataset.level; renderLevelChips(); renderDirections(); };
  });
}

function renderDirections() {
  const list = document.getElementById('dirs-list');
  const dirs = state.data.directions || {};
  const qTokens = tokens(state.search);
  const items = [];

  for (const [level, arr] of Object.entries(dirs)) {
    if (state.level !== 'all' && state.level !== level) continue;
    for (const d of arr) {
      if (state.lang === 'ru' && !(d.language || '').includes('Русский')) continue;
      if (state.lang === 'en' && !(d.language || '').includes('Английский')) continue;
      if (state.budgetOnly && !d.budget) continue;
      if (qTokens.length) {
        const hay = [d.name, d.code, d.profile, d.language].join(' ');
        if (!matchesSearch(qTokens, hay)) continue;
      }
      items.push({ level, ...d });
    }
  }

  if (!items.length) {
    list.innerHTML = '<div class="empty">Ничего не найдено.<br>Попробуйте изменить запрос или фильтры.</div>';
    return;
  }

  list.innerHTML = items.map(d => `
    <div class="card">
      <div class="card-head">
        <span class="level-tag"><i data-lucide="${LEVEL_ICONS[d.level] || LEVEL_ICON_FALLBACK}"></i>${escape(d.level)}</span>
        ${d.budget
          ? '<span class="tag tag-budget"><i data-lucide="badge-check"></i> Есть бюджет</span>'
          : '<span class="tag tag-plain">Контракт</span>'}
      </div>
      <h3>${escape(d.name)}</h3>
      ${d.profile ? `<p class="profile">${escape(d.profile)}</p>` : ''}
      ${d.code ? `<div class="card-code"><i data-lucide="hash"></i>${escape(d.code)}</div>` : ''}
      <div class="meta">
        ${d.language ? `<span class="meta-item"><i data-lucide="languages"></i>${escape(d.language)}</span>` : ''}
        ${d.duration ? `<span class="meta-item"><i data-lucide="clock"></i>${escape(d.duration)}</span>` : ''}
        ${d.cost ? `<span class="meta-item"><i data-lucide="wallet"></i>${escape(d.cost)}</span>` : ''}
      </div>
      ${d.cost_foreign ? `<div class="meta-foreign"><i data-lucide="globe"></i>Для иностранцев: ${escape(d.cost_foreign)}</div>` : ''}
      ${d.url ? `<a class="more" href="${escape(d.url)}" target="_blank" rel="noopener">Подробнее на сайте <i data-lucide="arrow-right"></i></a>` : ''}
    </div>
  `).join('');
  refreshIcons();
}

function renderFaq() {
  const list = document.getElementById('faq-list');
  const sections = state.data.faq_sections || {};
  list.innerHTML = Object.entries(sections).map(([name, qa]) => `
    <div class="faq-section">
      <h2>${escape(name)}</h2>
      ${Object.entries(qa).map(([q, a]) => `
        <details class="faq-item">
          <summary>${escape(q)}</summary>
          <div>${a}</div>
        </details>
      `).join('')}
    </div>
  `).join('');
}

function renderContacts() {
  const c = (state.data.department_info || {}).contact || {};
  const block = document.getElementById('contacts-block');
  const rows = [
    ['phone', 'Телефон', c.phone, c.phone ? `tel:${c.phone.replace(/\s/g, '')}` : null],
    ['mail', 'Email', c.email, c.email ? `mailto:${c.email}` : null],
    ['map-pin', 'Адрес', c.address, c.address ? `https://maps.google.com/?q=${encodeURIComponent(c.address)}` : null],
    ['globe', 'Сайт', c.website, c.website],
    ['message-circle', 'WhatsApp', c.whatsapp, c.whatsapp],
    ['camera', 'Instagram', c.instagram, c.instagram],
  ];
  block.innerHTML = rows.filter(r => r[2]).map(([icon, label, val, link]) => `
    <div class="contact-row">
      <span class="icon"><i data-lucide="${icon}"></i></span>
      <div>
        <div class="muted" style="font-size:12px">${label}</div>
        ${link ? `<a href="${escape(link)}" target="_blank" rel="noopener">${escape(val)}</a>` : escape(val)}
      </div>
    </div>
  `).join('');
  refreshIcons();
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Tabs
document.querySelectorAll('.tab').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === btn));
    document.querySelectorAll('.tab-content').forEach(c =>
      c.classList.toggle('active', c.id === `tab-${btn.dataset.tab}`));
  };
});

// Filters
document.getElementById('search').oninput = (e) => { state.search = e.target.value; renderDirections(); };
document.querySelectorAll('#lang-chips .chip').forEach(btn => {
  btn.onclick = () => {
    state.lang = btn.dataset.lang;
    document.querySelectorAll('#lang-chips .chip').forEach(c => c.classList.toggle('active', c === btn));
    renderDirections();
  };
});
document.querySelector('#lang-chips .chip[data-lang="all"]').classList.add('active');
document.getElementById('budget-only').onchange = (e) => { state.budgetOnly = e.target.checked; renderDirections(); };

loadData();
