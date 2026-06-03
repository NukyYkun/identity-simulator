// ====== 重生体验馆 · 玄学沉浸版 ======

// ====== 状态 ======
let characterPool = [];
let currentCharacter = null;
let currentEventIndex = 0;
let pendingChoice = null;
let nodeCounter = 0;
let visitedBranchTarget = -1;
let collectionTab = 'all';
let selectedCharacter = null;

// ====== 工具函数 ======
function smoothScrollToBottom(container) {
  if (!container) return;
  const target = container.scrollHeight - container.clientHeight;
  if (target <= 0) return;
  container.scrollTo({ top: target, behavior: 'smooth' });
}

// ====== 烟雾粒子系统 ======
let smokeCanvas, smokeCtx;
const particles = [];
const PARTICLE_COUNT = 35;

function initSmoke() {
  smokeCanvas = document.getElementById('smokeCanvas');
  if (!smokeCanvas) return;
  smokeCtx = smokeCanvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createSmoke(true));
  }
  renderSmoke();
}

function resizeCanvas() {
  smokeCanvas.width = window.innerWidth;
  smokeCanvas.height = window.innerHeight;
}

function createSmoke(init) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    x: Math.random() * w,
    y: init ? Math.random() * h : h + Math.random() * 50,
    size: Math.random() * 120 + 60,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -(Math.random() * 0.4 + 0.15),
    opacity: Math.random() * 0.06 + 0.015,
    life: init ? Math.random() * 300 : 0,
    maxLife: Math.random() * 500 + 300,
    hue: Math.random() > 0.7 ? 35 : 20,
  };
}

function renderSmoke() {
  smokeCtx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx + Math.sin(p.life * 0.008) * 0.2;
    p.y += p.vy;
    p.life++;

    const progress = p.life / p.maxLife;
    const alpha = p.opacity * Math.sin(progress * Math.PI);

    if (alpha > 0.001) {
      const g = smokeCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      g.addColorStop(0, `hsla(${p.hue}, 40%, 30%, ${alpha})`);
      g.addColorStop(0.5, `hsla(${p.hue}, 30%, 20%, ${alpha * 0.4})`);
      g.addColorStop(1, `hsla(${p.hue}, 20%, 10%, 0)`);
      smokeCtx.fillStyle = g;
      smokeCtx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    }

    if (p.life >= p.maxLife || p.y < -p.size) {
      particles[i] = createSmoke(false);
    }
  }

  requestAnimationFrame(renderSmoke);
}

// ====== 加载数据 ======
async function loadCharacters() {
  try {
    const res = await fetch('data/characters.json');
    if (res.ok) {
      characterPool = await res.json();
      return;
    }
  } catch (e) {}
  if (window.CHARACTER_DATA && Array.isArray(window.CHARACTER_DATA)) {
    characterPool = window.CHARACTER_DATA;
  }
}

// ====== 页面切换 ======
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + name);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }
  if (name === 'home' || name === 'collection') {
    target.removeAttribute('data-tone');
  }
}

// ====== 存储 ======
function getHistory() {
  try { return JSON.parse(localStorage.getItem('lifeHistory') || '[]'); }
  catch { return []; }
}

function addToHistory(charId) {
  const h = getHistory();
  if (!h.includes(charId)) {
    h.unshift(charId);
    localStorage.setItem('lifeHistory', JSON.stringify(h));
  }
}

function getCollections() {
  try { return JSON.parse(localStorage.getItem('collections') || '[]'); }
  catch { return []; }
}

// ====== Tone 配色映射 ======
const TONE_COLORS = {
  mute:  { primary: '#6b635a', light: '#a09890', dark: '#2a2622' },
  drift: { primary: '#5a8a8a', light: '#98b0ac', dark: '#1a2e2e' },
  blaze: { primary: '#b05a3a', light: '#c0a898', dark: '#2e1810' },
  ember: { primary: '#b89050', light: '#d4b878', dark: '#2e2210' },
  still: { primary: '#6878a0', light: '#a0a8b8', dark: '#1a1e2e' },
};

// ====== 入口：点击触碰命运 ======
function startDraw() {
  if (characterPool.length === 0) return;

  // 优先抽未体验过的角色，全部体验过则重新洗牌
  const history = getHistory();
  let pool = characterPool.filter(c => !history.includes(c.id));
  if (pool.length === 0) pool = characterPool;

  selectedCharacter = pool[Math.floor(Math.random() * pool.length)];

  // 直接启动过渡动画
  startTransition(selectedCharacter);
}

// ====== 过渡动画：色彩渐入 + 角色名浮现 + 进入人生 ======
function startTransition(char) {
  const tone = char.tone || 'ember';
  const colors = TONE_COLORS[tone] || TONE_COLORS.ember;

  const overlay = document.getElementById('transitionOverlay');
  const nameEl = document.getElementById('transName');
  const eraEl = document.getElementById('transEra');

  // 设置色彩
  overlay.style.setProperty('--t-primary', colors.primary);
  overlay.style.setProperty('--t-light', colors.light);
  overlay.style.setProperty('--t-dark', colors.dark);

  // 设置角色信息
  nameEl.textContent = char.name;
  eraEl.textContent = char.era + ' · ' + char.location;

  // 启动过渡
  overlay.classList.add('active');

  // 阶段 1：背景渐入 (0 ~ 800ms) — 由 CSS transition 驱动
  // 阶段 2：文字浮现 (800ms)
  setTimeout(() => {
    overlay.classList.add('show-text');
  }, 800);

  // 阶段 3：趁遮罩不透明时，提前在底下准备好人生页 (2400ms)
  setTimeout(() => {
    prepareLife(char);
  }, 2400);

  // 阶段 4：整体淡出 (3200ms)
  setTimeout(() => {
    overlay.classList.add('fade-out');
  }, 3200);

  // 完全结束 (4000ms)
  setTimeout(() => {
    overlay.classList.remove('active', 'show-text', 'fade-out');
  }, 4000);
}

// ====== 人生推进 ======
function prepareLife(char) {
  currentCharacter = char;
  currentEventIndex = 0;
  pendingChoice = null;
  nodeCounter = 0;
  visitedBranchTarget = -1;

  document.getElementById('lifeHeader').innerHTML = `
    <div class="life-char-name">${char.name}</div>
    <div class="life-char-era">${char.era} · ${char.location}</div>
  `;

  document.getElementById('timeline').innerHTML = '';
  document.getElementById('lifeActions').innerHTML = '';

  const tone = char.tone || 'ember';
  document.getElementById('screen-life').setAttribute('data-tone', tone);
  document.getElementById('screen-ending').setAttribute('data-tone', tone);

  // 切换到 life 页（此时被遮罩挡住，用户看不到）
  showScreen('life');
  // 延迟追加第一个事件（等遮罩开始淡出后再出现内容）
  setTimeout(() => appendEvent(0), 1200);
}

function cleanText(t) {
  return t.replace(/^\[.*?\]\s*/, '');
}

function appendEvent(index) {
  const char = currentCharacter;
  const event = char.events[index];
  const isLast = index >= char.events.length - 1 ||
    (index === visitedBranchTarget && event.branchEnd);
  const isFinal = isLast && (!event.choices || event.choices.length === 0);

  const timeline = document.getElementById('timeline');
  const node = document.createElement('div');
  node.className = 'timeline-node' + (isFinal ? ' final' : '');
  const nodeId = 'node-' + (nodeCounter++);
  node.id = nodeId;
  node.dataset.eventIndex = index;

  const ageLabel = event.age === 0 ? '出生' : event.age + '岁';

  node.innerHTML = `
    <div class="node-badge">${ageLabel}</div>
    <div class="node-card">
      <div class="node-text">${cleanText(event.text)}</div>
      ${event.choices && event.choices.length > 0 ? `
        <div class="node-choices">
          ${renderChoiceButtons(event.choices, nodeId)}
        </div>
      ` : ''}
      <div class="node-outcome" style="display:none"></div>
    </div>
  `;

  timeline.appendChild(node);
  updateBottomAction(event, isLast);

  setTimeout(() => {
    smoothScrollToBottom(timeline);
  }, 250);
}

function renderChoiceButtons(choices, nodeId) {
  const labels = ['一', '二', '三', '四', '五'];
  return choices.map((c, i) => `
    <button class="choice-btn" onclick="makeChoice(${i}, '${nodeId}')">
      <span class="choice-num">${labels[i]}</span>${c.text}
    </button>
  `).join('');
}

function updateBottomAction(event, isLast) {
  const actions = document.getElementById('lifeActions');
  if (event.choices && event.choices.length > 0) {
    actions.innerHTML = '';
  } else {
    actions.innerHTML = `
      <button class="btn btn-primary" onclick="proceedNoChoice()">
        ${isLast ? '查看结局' : '继续'}
      </button>
    `;
  }
}

function makeChoice(index, nodeId) {
  const node = document.getElementById(nodeId);
  if (!node) return;

  // 用节点记录的 eventIndex 定位，避免 currentEventIndex 不同步
  const eventIndex = parseInt(node.dataset.eventIndex);
  const event = currentCharacter.events[eventIndex];
  if (!event || !event.choices) return;
  const choice = event.choices[index];
  if (!choice) return;

  // 同步 currentEventIndex 到该节点
  currentEventIndex = eventIndex;
  pendingChoice = choice;

  const choicesEl = node.querySelector('.node-choices');
  if (choicesEl) choicesEl.style.display = 'none';

  const outcomeEl = node.querySelector('.node-outcome');
  outcomeEl.textContent = cleanText(choice.outcome);
  outcomeEl.style.display = 'block';

  const branchNum = parseInt(choice.branch);
  const isLast = currentEventIndex >= currentCharacter.events.length - 1;
  const willEnd = choice.branch === 'end' || (isLast && choice.branch === 'main');
  const willEndViaBranch = !isNaN(branchNum) && branchNum < currentCharacter.events.length &&
    isLastMeaningfulEvent(branchNum);

  document.getElementById('lifeActions').innerHTML = `
    <button class="btn btn-primary" onclick="proceedAfterChoice()">
      ${(willEnd || willEndViaBranch) ? '查看结局' : '继续'}
    </button>
  `;

  setTimeout(() => {
    const timeline = document.getElementById('timeline');
    smoothScrollToBottom(timeline);
  }, 200);
}

function isLastMeaningfulEvent(startIndex) {
  const events = currentCharacter.events;
  let idx = startIndex;
  while (idx < events.length - 1) {
    const next = idx + 1;
    const nextEvent = events[next];
    if (nextEvent.text && nextEvent.text.startsWith('[分支]')) {
      idx++;
      continue;
    }
    return false;
  }
  return true;
}

function proceedAfterChoice() {
  if (!pendingChoice) return;
  const choice = pendingChoice;
  pendingChoice = null;

  if (choice.branch === 'end') { showEnding(); return; }

  const branchNum = parseInt(choice.branch);
  if (!isNaN(branchNum) && branchNum < currentCharacter.events.length) {
    currentEventIndex = branchNum;
    visitedBranchTarget = branchNum;
    appendEvent(currentEventIndex);
    return;
  }

  advanceToNext();
}

function proceedNoChoice() {
  const event = currentCharacter.events[currentEventIndex];
  if (currentEventIndex === visitedBranchTarget && event && event.branchEnd) {
    showEnding();
    return;
  }
  advanceToNext();
}

function advanceToNext() {
  currentEventIndex++;
  while (currentEventIndex < currentCharacter.events.length) {
    const evt = currentCharacter.events[currentEventIndex];
    if (evt.text && evt.text.startsWith('[分支]') && currentEventIndex !== visitedBranchTarget) {
      currentEventIndex++;
      continue;
    }
    break;
  }
  if (currentEventIndex >= currentCharacter.events.length) {
    showEnding();
  } else {
    appendEvent(currentEventIndex);
  }
}

// ====== 结局 ======
function showEnding() {
  const char = currentCharacter;
  document.getElementById('endingName').textContent = char.name;
  document.getElementById('endingEra').textContent = char.era + ' · ' + char.location;

  let summary = char.summary;
  if (visitedBranchTarget >= 0 && char.events[visitedBranchTarget] && char.events[visitedBranchTarget].branchSummary) {
    summary = char.events[visitedBranchTarget].branchSummary;
  }
  document.getElementById('endingSummary').textContent = summary;
  document.getElementById('endingHistory').textContent = char.historyNote;

  const collected = getCollections().includes(char.id);
  const btn = document.getElementById('btnCollect');
  btn.textContent = collected ? '已收藏' : '收藏此生';
  btn.className = 'btn ' + (collected ? 'btn-link' : 'btn-secondary');

  addToHistory(char.id);
  showScreen('ending');
}

function toggleCollect() {
  const c = getCollections();
  const idx = c.indexOf(currentCharacter.id);
  if (idx > -1) { c.splice(idx, 1); }
  else { c.push(currentCharacter.id); }
  localStorage.setItem('collections', JSON.stringify(c));

  const collected = idx === -1;
  const btn = document.getElementById('btnCollect');
  btn.textContent = collected ? '已收藏' : '收藏此生';
  btn.className = 'btn ' + (collected ? 'btn-link' : 'btn-secondary');
}

// ====== 收藏页 ======
function switchCollectionTab(tab) {
  collectionTab = tab;
  document.getElementById('tabAll').classList.toggle('active', tab === 'all');
  document.getElementById('tabCollected').classList.toggle('active', tab === 'collected');
  renderCollection();
}

function renderCollection() {
  const history = getHistory();
  const collections = getCollections();
  const grid = document.getElementById('collectionGrid');
  const empty = document.getElementById('collectionEmpty');

  const ids = collectionTab === 'collected'
    ? history.filter(id => collections.includes(id))
    : history;

  if (ids.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = ids.map(id => {
    const char = characterPool.find(c => c.id === id);
    if (!char) return '';
    const starred = collections.includes(id);
    return `
      <div class="collection-card" onclick="viewCollection('${id}')">
        <span class="cc-name">${char.name}</span>
        <span class="cc-era">${char.era}</span>
        <span class="cc-tagline">${char.oneLiner}</span>
        <span class="cc-star ${starred ? 'collected' : ''}">${starred ? '★' : '☆'}</span>
      </div>
    `;
  }).join('');
}

function viewCollection(id) {
  const char = characterPool.find(c => c.id === id);
  if (!char) return;
  currentCharacter = char;
  const tone = char.tone || 'ember';
  document.getElementById('screen-ending').setAttribute('data-tone', tone);
  showEnding();
}

// ====== 初始化 ======
async function init() {
  await loadCharacters();
  initSmoke();
  showScreen('home');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
