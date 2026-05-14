const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const state = {
  data: null,
  level: 'all',
  lang: 'all',
  budgetOnly: false,
  search: '',
};

const LEVEL_ICONS = { 'Бакалавриат': '🎓', 'Магистратура': '📚', 'Аспирантура': '🔬' };

async function loadData() {
  try {
    const res = await fetch('bot_data.json', { cache: 'no-cache' });
    state.data = await res.json();
  } catch (e) {
    document.getElementById('dirs-list').innerHTML =
      `<div class="empty">⚠️ Не удалось загрузить данные.<br>${e}</div>`;
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
}

function renderLevelChips() {
  const wrap = document.getElementById('level-chips');
  const levels = ['all', ...Object.keys(state.data.directions || {})];
  wrap.innerHTML = levels.map(l => {
    const label = l === 'all' ? 'Все уровни' : `${LEVEL_ICONS[l] || '📌'} ${l}`;
    return `<button class="chip ${state.level === l ? 'active' : ''}" data-level="${l}">${label}</button>`;
  }).join('');
  wrap.querySelectorAll('.chip').forEach(btn => {
    btn.onclick = () => { state.level = btn.dataset.level; renderLevelChips(); renderDirections(); };
  });
}

function renderDirections() {
  const list = document.getElementById('dirs-list');
  const dirs = state.data.directions || {};
  const items = [];

  for (const [level, arr] of Object.entries(dirs)) {
    if (state.level !== 'all' && state.level !== level) continue;
    for (const d of arr) {
      if (state.lang === 'ru' && !(d.language || '').includes('Русский')) continue;
      if (state.lang === 'en' && !(d.language || '').includes('Английский')) continue;
      if (state.budgetOnly && !d.budget) continue;
      if (state.search) {
        const hay = [d.name, d.code, d.profile, d.language].join(' ').toLowerCase();
        if (!hay.includes(state.search.toLowerCase())) continue;
      }
      items.push({ level, ...d });
    }
  }

  if (!items.length) {
    list.innerHTML = '<div class="empty">😔 Ничего не найдено.<br>Попробуйте изменить фильтры.</div>';
    return;
  }

  list.innerHTML = items.map(d => `
    <div class="card">
      <h3>${escape(d.name)}</h3>
      <div class="row">
        <span class="badge">${LEVEL_ICONS[d.level] || '📌'} ${escape(d.level)}</span>
        <span class="badge">${escape(d.code || '—')}</span>
        <span class="badge">${escape(d.language || '—')}</span>
        <span class="badge ${d.budget ? 'green' : 'red'}">${d.budget ? '✅ Бюджет' : '❌ Без бюджета'}</span>
        <span class="badge">⏳ ${escape(d.duration || '—')}</span>
      </div>
      <div class="row" style="margin-top:8px"><i>${escape(d.profile || '')}</i></div>
      ${d.cost ? `<div class="row"><span class="badge" style="font-weight:600">💵 ${escape(d.cost)}</span></div>` : ''}
      ${d.cost_foreign ? `<div class="row" style="font-size:12px"><i>🌍 Для иностранцев: ${escape(d.cost_foreign)}</i></div>` : ''}
      ${d.url ? `<a class="more" href="${escape(d.url)}" target="_blank" rel="noopener">Подробнее на сайте →</a>` : ''}
    </div>
  `).join('');
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
    ['☎️', 'Телефон', c.phone, c.phone ? `tel:${c.phone.replace(/\s/g, '')}` : null],
    ['📧', 'Email', c.email, c.email ? `mailto:${c.email}` : null],
    ['📍', 'Адрес', c.address, c.address ? `https://maps.google.com/?q=${encodeURIComponent(c.address)}` : null],
    ['🌐', 'Сайт', c.website, c.website],
    ['💬', 'WhatsApp', c.whatsapp, c.whatsapp],
    ['📸', 'Instagram', c.instagram, c.instagram],
  ];
  block.innerHTML = rows.filter(r => r[2]).map(([icon, label, val, link]) => `
    <div class="contact-row">
      <span class="icon">${icon}</span>
      <div>
        <div class="muted" style="font-size:12px">${label}</div>
        ${link ? `<a href="${escape(link)}" target="_blank" rel="noopener">${escape(val)}</a>` : escape(val)}
      </div>
    </div>
  `).join('');
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
