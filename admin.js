// ============================================================
//  ADMIN DASHBOARD – admin.js
//  Route: /admin  (bảo vệ bằng mật khẩu)
//  Hiển thị: mệnh giá thực (50k, 100k) của các ô đặc biệt
// ============================================================

'use strict';

/* -------- ADMIN CONFIG -------- */
const ADMIN = {
  username: 'admin',
  password: 'lixì2025',     // Đổi mật khẩu tại đây
  sessionKey: 'lixì_admin_auth',
};

/* -------- SHARED DATA (localStorage) -------- */
const DATA_KEY = 'lixì_game_data';

/* -------- DOM -------- */
const loginScreen  = document.getElementById('login-screen');
const adminApp     = document.getElementById('admin-app');
const loginError   = document.getElementById('login-error');
const loginForm    = document.getElementById('login-form');

/* -------- SESSION CHECK -------- */
function checkSession() {
  return sessionStorage.getItem(ADMIN.sessionKey) === 'true';
}

function saveSession() {
  sessionStorage.setItem(ADMIN.sessionKey, 'true');
}

function clearSession() {
  sessionStorage.removeItem(ADMIN.sessionKey);
}

/* -------- LOAD GAME DATA -------- */
function loadGameData() {
  const raw = localStorage.getItem(DATA_KEY);
  if (!raw) return generateDemoData();
  try { return JSON.parse(raw); } catch { return generateDemoData(); }
}

/* Demo data nếu chưa có game thực */
function generateDemoData() {
  const displayVals = [1,2,2,3,3,5,5,5,10,10,10,10,15,15,20,20,20,20,20,20];
  const shuffled    = [...displayVals].sort(() => Math.random() - 0.5);
  const specialSlots = [];
  // Chọn 2 slot ngẫu nhiên
  while (specialSlots.length < 2) {
    const r = Math.floor(Math.random() * 20);
    if (!specialSlots.includes(r)) specialSlots.push(r);
  }
  const specialVals  = [50, 100].sort(() => Math.random() - 0.5);

  return Array.from({ length: 20 }, (_, i) => {
    const isSpecial = specialSlots.includes(i);
    const spIdx     = specialSlots.indexOf(i);
    return {
      id: i + 1,
      displayValue: shuffled[i],
      realValue: isSpecial ? specialVals[spIdx] : shuffled[i],
      isSpecial,
      opened: Math.random() > 0.55,
      openedAt: Math.random() > 0.55 ? new Date(Date.now() - Math.random() * 3600000).toISOString() : null,
    };
  });
}

/* -------- SAVE DEMO DATA -------- */
function saveDemoData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

/* -------- BOOT -------- */
document.addEventListener('DOMContentLoaded', () => {
  if (checkSession()) {
    showDashboard();
  } else {
    showLogin();
  }
});

/* -------- LOGIN -------- */
function showLogin() {
  loginScreen.classList.remove('hidden');
  adminApp.classList.remove('visible');
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;

  if (user === ADMIN.username && pass === ADMIN.password) {
    loginError.textContent = '';
    loginScreen.classList.add('hidden');
    saveSession();
    showDashboard();
  } else {
    loginError.textContent = '⚠ Sai tên đăng nhập hoặc mật khẩu!';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
    // Trigger shake animation
    loginError.style.animation = 'none';
    void loginError.offsetWidth;
    loginError.style.animation = '';
  }
});

/* -------- DASHBOARD -------- */
let gameData = [];

function showDashboard() {
  adminApp.classList.add('visible');
  gameData = loadGameData();
  // Save demo data for future loads
  saveDemoData(gameData);

  renderMetrics();
  renderEnvelopeTable();
  renderSpecialHighlight();
  renderCharts();
  renderSettingsPanel();
  setupNavigation();
  setupControls();
}

/* -------- METRICS -------- */
function renderMetrics() {
  const total    = gameData.length;
  const opened   = gameData.filter(e => e.opened).length;
  const specials = gameData.filter(e => e.isSpecial);
  const specOpened = specials.filter(e => e.opened).length;
  const totalDisplay = gameData.filter(e => e.opened).reduce((s, e) => s + e.displayValue, 0);
  const totalReal    = gameData.filter(e => e.opened && e.isSpecial).reduce((s, e) => s + e.realValue, 0)
                     + gameData.filter(e => e.opened && !e.isSpecial).reduce((s, e) => s + e.displayValue, 0);

  document.getElementById('m-total').textContent    = total;
  document.getElementById('m-opened').textContent   = opened;
  document.getElementById('m-pending').textContent  = total - opened;
  document.getElementById('m-special-opened').textContent = `${specOpened}/${specials.length}`;
  document.getElementById('m-display-total').textContent  = totalDisplay + 'k';
  document.getElementById('m-real-total').textContent     = totalReal + 'k';
  document.getElementById('m-progress-pct').textContent   = Math.round(opened / total * 100) + '%';
}

/* -------- ENVELOPE TABLE -------- */
function renderEnvelopeTable(filterVal = 'all', searchVal = '') {
  const tbody = document.getElementById('env-tbody');
  tbody.innerHTML = '';

  let data = [...gameData];

  // Filter
  if (filterVal === 'opened')  data = data.filter(e => e.opened);
  if (filterVal === 'pending') data = data.filter(e => !e.opened);
  if (filterVal === 'special') data = data.filter(e => e.isSpecial);

  // Search
  if (searchVal) {
    const s = searchVal.toLowerCase();
    data = data.filter(e =>
      String(e.id).includes(s) ||
      String(e.displayValue).includes(s) ||
      String(e.realValue).includes(s)
    );
  }

  data.forEach(env => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:'JetBrains Mono',monospace;color:var(--text-primary)">#${String(env.id).padStart(2,'0')}</td>
      <td>
        <span class="badge ${env.isSpecial ? 'badge-special' : 'badge-normal'}">
          ${env.isSpecial ? '🔥 Đặc biệt' : '📦 Thường'}
        </span>
      </td>
      <td style="font-family:'JetBrains Mono',monospace">${env.displayValue}k</td>
      <td>
        <span style="font-family:'JetBrains Mono',monospace;font-size:1.05rem;color:${env.isSpecial ? 'var(--gold-shine)' : 'var(--text-secondary)'}">
          ${env.realValue}k ${env.isSpecial ? '⭐' : ''}
        </span>
      </td>
      <td>
        <span class="badge ${env.opened ? 'badge-opened' : 'badge-pending'}">
          ${env.opened ? '✓ Đã mở' : '○ Chờ'}
        </span>
      </td>
      <td style="font-size:0.8rem;color:var(--text-muted)">
        ${env.openedAt ? new Date(env.openedAt).toLocaleTimeString('vi-VN') : '—'}
      </td>
      <td>
        <button class="icon-btn" onclick="toggleEnv(${env.id - 1})" title="${env.opened ? 'Đặt lại' : 'Đánh dấu đã mở'}">
          ${env.opened ? '↺' : '✓'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px">Không có dữ liệu</td></tr>';
  }
}

/* -------- SPECIAL ENVELOPES -------- */
function renderSpecialHighlight() {
  const container = document.getElementById('special-cards');
  container.innerHTML = '';

  const specials = gameData.filter(e => e.isSpecial);
  specials.forEach(env => {
    const card = document.createElement('div');
    card.className = 'special-env-card';
    card.innerHTML = `
      <div class="senv-num">Ô số #${String(env.id).padStart(2,'0')}</div>
      <div class="senv-display">Hiển thị: ${env.displayValue}k</div>
      <div class="senv-real">${env.realValue}k 🏆</div>
      <div class="senv-status">
        <span class="badge ${env.opened ? 'badge-opened' : 'badge-pending'}">
          ${env.opened ? '✓ Đã được bốc' : '○ Chưa mở'}
        </span>
      </div>
    `;
    container.appendChild(card);
  });
}

/* -------- CHARTS -------- */
function renderCharts() {
  // Distribution chart
  const dist = { 1: 0, 2: 0, 3: 0, 5: 0, 10: 0, 15: 0, 20: 0, 50: 0, 100: 0 };
  gameData.forEach(e => {
    const k = e.realValue;
    if (dist[k] !== undefined) dist[k]++;
    else dist[k] = 1;
  });

  const distContainer = document.getElementById('chart-distribution');
  distContainer.innerHTML = '';
  const maxCount = Math.max(...Object.values(dist));
  const colors = {
    1:'#8888a0', 2:'#8888a0', 3:'#8888a0',
    5:'#3498db', 10:'#3498db', 15:'#9b59b6',
    20:'#e67e22', 50:'#e74c3c', 100:'#ffd700'
  };

  Object.entries(dist).forEach(([val, count]) => {
    if (count === 0) return;
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <div class="bar-label-row">
        <span class="bar-label-text">${val}k</span>
        <span class="bar-label-val">${count} ô</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:0%;background:${colors[val] || '#8888a0'}" data-width="${count / maxCount * 100}"></div>
      </div>
    `;
    distContainer.appendChild(row);
  });

  // Open rate chart
  const opened  = gameData.filter(e => e.opened).length;
  const pending = gameData.length - opened;
  const openContainer = document.getElementById('chart-open-rate');
  openContainer.innerHTML = `
    <div class="bar-row">
      <div class="bar-label-row">
        <span class="bar-label-text">Đã mở</span>
        <span class="bar-label-val">${opened}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:0%;background:linear-gradient(90deg,#27ae60,#2ecc71)" data-width="${opened/20*100}"></div>
      </div>
    </div>
    <div class="bar-row">
      <div class="bar-label-row">
        <span class="bar-label-text">Chưa mở</span>
        <span class="bar-label-val">${pending}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:0%;background:linear-gradient(90deg,#d4a017,#f1c40f)" data-width="${pending/20*100}"></div>
      </div>
    </div>
  `;

  // Animate bars
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(el => {
      el.style.width = el.dataset.width + '%';
    });
  }, 200);
}

/* -------- SETTINGS -------- */
function renderSettingsPanel() {
  const specials = gameData.filter(e => e.isSpecial);
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('cfg-total',   gameData.length);
  el('cfg-special', specials.length);
  el('cfg-min',     '1k');
  el('cfg-max',     '20k');
  el('cfg-hidden',  specials.map(e => e.realValue + 'k').join(', '));
}

/* -------- NAVIGATION -------- */
function setupNavigation() {
  document.querySelectorAll('[data-tab]').forEach(link => {
    link.addEventListener('click', () => {
      // Active link
      document.querySelectorAll('[data-tab]').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Active tab
      const tab = link.dataset.tab;
      document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
      const target = document.getElementById('tab-' + tab);
      if (target) target.classList.add('active');

      document.getElementById('top-bar-title').textContent = link.querySelector('.nav-label')?.textContent || 'Dashboard';
    });
  });
}

/* -------- CONTROLS -------- */
function setupControls() {
  // Search
  const search = document.getElementById('env-search');
  const filter = document.getElementById('env-filter');
  if (search) search.addEventListener('input', () => renderEnvelopeTable(filter?.value, search.value));
  if (filter) filter.addEventListener('change', () => renderEnvelopeTable(filter.value, search?.value));

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearSession();
    window.location.reload();
  });

  // Reset game
  document.getElementById('reset-game-btn')?.addEventListener('click', () => {
    if (confirm('Đặt lại toàn bộ game? Tất cả ô sẽ chưa mở lại.')) {
      gameData.forEach(e => { e.opened = false; e.openedAt = null; });
      saveDemoData(gameData);
      renderMetrics();
      renderEnvelopeTable();
      renderSpecialHighlight();
      renderCharts();
      showToast('✓ Đã đặt lại game', 'success');
    }
  });

  // Refresh
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    gameData = loadGameData();
    renderMetrics();
    renderEnvelopeTable();
    renderSpecialHighlight();
    renderCharts();
    showToast('↺ Đã làm mới dữ liệu', 'info');
  });

  // Export CSV
  document.getElementById('export-btn')?.addEventListener('click', exportCSV);

  // Back to main
  document.getElementById('goto-main-btn')?.addEventListener('click', () => {
    window.location.href = '/';
  });
}

/* -------- TOGGLE ENVELOPE -------- */
window.toggleEnv = function(idx) {
  if (idx < 0 || idx >= gameData.length) return;
  gameData[idx].opened = !gameData[idx].opened;
  gameData[idx].openedAt = gameData[idx].opened ? new Date().toISOString() : null;
  saveDemoData(gameData);
  renderMetrics();
  renderEnvelopeTable(
    document.getElementById('env-filter')?.value,
    document.getElementById('env-search')?.value
  );
  renderSpecialHighlight();
  renderCharts();
  showToast(`${gameData[idx].opened ? '✓ Đánh dấu đã mở' : '↺ Đặt lại'} ô #${String(gameData[idx].id).padStart(2,'0')}`, 'success');
};

/* -------- EXPORT CSV -------- */
function exportCSV() {
  const header = ['ID','Loại','Mệnh giá hiển thị','Mệnh giá thực','Trạng thái','Thời gian mở'];
  const rows = gameData.map(e => [
    '#' + String(e.id).padStart(2,'0'),
    e.isSpecial ? 'Đặc biệt' : 'Thường',
    e.displayValue + 'k',
    e.realValue + 'k',
    e.opened ? 'Đã mở' : 'Chưa mở',
    e.openedAt ? new Date(e.openedAt).toLocaleString('vi-VN') : '—',
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `lixì-data-${new Date().toLocaleDateString('vi-VN').replaceAll('/','-')}.csv`;
  a.click();
  showToast('📥 Đã xuất CSV', 'success');
}

/* -------- TOAST -------- */
const toastEl = document.getElementById('toast');
let toastTimer;

function showToast(msg, type = 'info') {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}
