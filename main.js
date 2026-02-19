// ============================================================
//  LÌ XÌ TẾT – main.js
//  Mệnh giá hiển thị: 1–20k  |  Mệnh giá thực: có thể 50/100k
//  Ô 50k và 100k => mở admin dashboard tại /admin
// ============================================================

'use strict';

/* ---------- CONFIG ---------- */
const CONFIG = {
  totalEnvelopes: 20,
  // Mệnh giá hiển thị ngẫu nhiên 1-20k (đơn vị ngàn đồng)
  displayValues: [1, 2, 2, 3, 3, 5, 5, 5, 10, 10, 10, 10, 15, 15, 20, 20, 20, 20, 20, 20],
  // Mệnh giá "ẩn" dành cho admin  (chỉ 2 ô trong 20 ô)
  specialValues: [50, 100],
  // Chỉ số ô nào là đặc biệt (0-based), được xáo trộn lúc khởi tạo
  specialSlots: [],
  revealDelay: 300,   // ms trước khi mở modal
  confettiCount: 80,
};

/* ---------- STATE ---------- */
const state = {
  envelopes: [],   // { id, displayValue, realValue, isSpecial, opened }
  totalOpened: 0,
  totalAmount: 0,  // tổng mệnh giá hiển thị
};

/* ---------- DOM REFS ---------- */
const grid        = document.getElementById('envelope-grid');
const statOpened  = document.getElementById('stat-opened');
const statTotal   = document.getElementById('stat-total');
const statAmount  = document.getElementById('stat-amount');
const revealOverlay = document.getElementById('reveal-overlay');
const revealEmoji   = document.getElementById('reveal-emoji');
const revealAmt     = document.getElementById('reveal-amount');
const revealUnit    = document.getElementById('reveal-unit');
const revealMsg     = document.getElementById('reveal-message');
const revealBtn     = document.getElementById('reveal-close-btn');
const resetBtn      = document.getElementById('reset-btn');

/* ---------- UTILS ---------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const MESSAGES = {
  low:     ['Năm mới vạn sự như ý! 🌸', 'Chúc an khang thịnh vượng! 🌺', 'Tấn tài tấn lộc! 🏮'],
  mid:     ['Phú quý vinh hoa! 🎋', 'Xuân về hạnh phúc tràn đầy! 🌸', 'Cung chúc tân xuân! 🧧'],
  high:    ['Đại cát đại lợi! 💰', 'Phú quý cát tường! 🎊', 'Lộc đến đầy nhà! 🏮'],
};

function getMessage(val) {
  if (val <= 5)  return randomFrom(MESSAGES.low);
  if (val <= 15) return randomFrom(MESSAGES.mid);
  return randomFrom(MESSAGES.high);
}

function getEmoji(val) {
  if (val >= 100) return '🎊';
  if (val >= 50)  return '💰';
  if (val >= 15)  return '🏮';
  if (val >= 10)  return '🧧';
  return '🌸';
}

/* ---------- INIT ---------- */
function initGame() {
  // Chọn 2 slot ngẫu nhiên là đặc biệt
  const allSlots = Array.from({ length: CONFIG.totalEnvelopes }, (_, i) => i);
  const shuffledSlots = shuffle(allSlots);
  CONFIG.specialSlots = shuffledSlots.slice(0, CONFIG.specialValues.length);

  // Xáo trộn mệnh giá hiển thị
  const displayShuffled = shuffle(CONFIG.displayValues);
  // Xáo trộn mệnh giá đặc biệt
  const specialShuffled = shuffle(CONFIG.specialValues);

  state.envelopes = Array.from({ length: CONFIG.totalEnvelopes }, (_, i) => {
    const isSpecial = CONFIG.specialSlots.includes(i);
    const specialIdx = CONFIG.specialSlots.indexOf(i);
    return {
      id: i + 1,
      displayValue: displayShuffled[i], // giá hiển thị 1-20k
      realValue: isSpecial ? specialShuffled[specialIdx] : displayShuffled[i],
      isSpecial,
      opened: false,
    };
  });

  state.totalOpened = 0;
  state.totalAmount = 0;

  updateStats();
  renderGrid();
  spawnPetals();
}

/* ---------- RENDER ---------- */
function renderGrid() {
  grid.innerHTML = '';
  state.envelopes.forEach((env, idx) => {
    const card = document.createElement('div');
    card.className = 'envelope-card';
    card.dataset.id = env.id;
    card.style.animationDelay = `${idx * 0.04}s`;

    card.innerHTML = `
      <div class="envelope-face">
        <span class="envelope-icon">🧧</span>
        <div class="amount-reveal">
          <span class="amount-emoji">${getEmoji(env.displayValue)}</span>
          <span class="amount-number">${env.displayValue}k</span>
          <span class="amount-unit">nghìn đồng</span>
        </div>
        <span class="envelope-num">#${String(env.id).padStart(2, '0')}</span>
      </div>
    `;

    if (!env.opened) {
      card.addEventListener('click', () => openEnvelope(card, env));
    } else {
      card.classList.add('opened');
    }

    grid.appendChild(card);
  });
}

/* ---------- OPEN ENVELOPE ---------- */
function openEnvelope(card, env) {
  if (env.opened) return;
  env.opened = true;
  state.totalOpened++;
  state.totalAmount += env.displayValue;

  card.classList.add('opened');
  card.removeEventListener('click', () => openEnvelope(card, env));

  updateStats();

  setTimeout(() => showReveal(env), CONFIG.revealDelay);
}

/* ---------- REVEAL MODAL ---------- */
function showReveal(env) {
  revealEmoji.textContent   = getEmoji(env.displayValue);
  revealAmt.textContent     = env.displayValue;
  revealUnit.textContent    = 'nghìn đồng';
  revealMsg.textContent     = getMessage(env.displayValue);
  revealOverlay.classList.add('show');

  spawnConfetti();

  // Nếu là ô đặc biệt: chuẩn bị redirect khi đóng modal
  revealBtn.onclick = () => {
    revealOverlay.classList.remove('show');
    if (env.isSpecial) {
      // Hiển thị thông báo admin trước khi redirect
      showAdminHint(env.realValue);
    }
  };
}

/* ---------- ADMIN HINT ---------- */
function showAdminHint(realValue) {
  const hint = document.createElement('div');
  hint.id = 'admin-hint';
  hint.innerHTML = `
    <div class="admin-hint-card">
      <div class="hint-icon">🔐</div>
      <p class="hint-title">Bạn nhận được lì xì đặc biệt!</p>
      <p class="hint-sub">Mệnh giá thực: <strong>${realValue}k</strong></p>
      <p class="hint-desc">Truy cập trang quản trị để xem chi tiết.</p>
      <button class="btn btn-primary" id="go-admin-btn">Vào Admin Dashboard →</button>
      <button class="btn btn-outline" id="cancel-hint-btn" style="margin-left:10px;">Để sau</button>
    </div>
  `;
  document.body.appendChild(hint);

  document.getElementById('go-admin-btn').onclick = () => {
    window.location.href = '/admin';
  };
  document.getElementById('cancel-hint-btn').onclick = () => {
    hint.remove();
  };
}

/* ---------- STATS ---------- */
function updateStats() {
  statOpened.textContent = state.totalOpened;
  statTotal.textContent  = CONFIG.totalEnvelopes;
  statAmount.textContent = state.totalAmount;
}

/* ---------- CONFETTI ---------- */
const CONFETTI_COLORS = ['#ffd700','#ff6b6b','#ff4500','#ffcd3c','#c0392b','#f1c40f','#e8d5b7'];

function spawnConfetti() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < CONFIG.confettiCount; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    const drift = (Math.random() - 0.5) * 400;
    el.style.cssText = `
      left: ${20 + Math.random() * 60}%;
      top: ${20 + Math.random() * 30}%;
      background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${10 + Math.random() * 12}px;
      --drift: ${drift}px;
      animation-delay: ${Math.random() * 0.5}s;
      animation-duration: ${2.5 + Math.random() * 2}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    frag.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }
  document.body.appendChild(frag);
}

/* ---------- PETALS ---------- */
const PETALS = ['🌸','🌺','🍀','⭐','✨','💫'];

function spawnPetals() {
  // Remove old
  document.querySelectorAll('.petal').forEach(p => p.remove());

  for (let i = 0; i < 18; i++) {
    const el = document.createElement('div');
    el.className = 'petal';
    el.textContent = randomFrom(PETALS);
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${8 + Math.random() * 12}s;
      animation-delay: ${Math.random() * 10}s;
      font-size: ${0.7 + Math.random() * 0.9}rem;
      opacity: 0;
    `;
    document.body.appendChild(el);
  }
}

/* ---------- RESET ---------- */
resetBtn.addEventListener('click', () => {
  if (state.totalOpened === 0 || confirm('Bạn có chắc muốn chơi lại không?')) {
    initGame();
  }
});

/* ---------- KEYBOARD SHORTCUT (debug) ---------- */
// Nhấn Ctrl+Shift+A để vào admin
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    window.location.href = '/admin';
  }
});

/* ---------- BOOT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initGame();
});
