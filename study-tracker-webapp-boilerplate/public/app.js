// ===== THEME (fast cache to prevent flash) =====
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme-cache', theme);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  if (state) { state.theme = next; postEvent({ op: 'set', k: 'theme', v: next }); }
}
applyTheme(localStorage.getItem('theme-cache') || 'dark');

// ===== DIM / FOCUS MODE =====
let dimMode = localStorage.getItem('dim-mode') === 'true';

// ── Zen Audio — looping lo-fi study music ──
const zenAudio = (() => {
  const audio = new Audio('zen-music.mp3');
  audio.loop = true;
  audio.volume = 0;
  let running = false;
  let fadeTimer = null;

  function fade(target, duration) {
    if (fadeTimer) cancelAnimationFrame(fadeTimer);
    const start = audio.volume;
    const diff = target - start;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      audio.volume = start + diff * t;
      if (t < 1) fadeTimer = requestAnimationFrame(step);
    }
    fadeTimer = requestAnimationFrame(step);
  }

  function start() {
    if (running) return;
    running = true;
    audio.play().then(() => fade(0.45, 1500)).catch(() => {});
  }

  function stop() {
    if (!running) return;
    running = false;
    fade(0, 1500);
    setTimeout(() => { if (!running) audio.pause(); }, 1600);
  }

  return { start, stop, get running() { return running; } };
})();
// ── Zen Focus Reminder (browser notifications) ──
let zenReminderInterval = null;
const ZEN_NUDGES = [
  '🌿 Your study session is waiting…',
  '📖 Come back and focus!',
  '🧘 Zen mode is still on — time to study.',
  '🎯 Stay on track, get back to your tasks!',
  '💡 5 minutes gone — are you still studying?',
];

function startZenReminder() {
  stopZenReminder();
  if (Notification.permission === 'default') Notification.requestPermission();
  zenReminderInterval = setInterval(() => {
    if (!dimMode || !document.hidden) return;
    if (Notification.permission !== 'granted') return;
    const msg = ZEN_NUDGES[Math.floor(Math.random() * ZEN_NUDGES.length)];
    new Notification('Study Tracker — Zen Mode', { body: msg, icon: '🌿', silent: false });
  }, 5 * 60 * 1000);
}

function stopZenReminder() {
  if (zenReminderInterval) { clearInterval(zenReminderInterval); zenReminderInterval = null; }
}

function toggleDimMode() {
  dimMode = !dimMode;
  localStorage.setItem('dim-mode', dimMode);
  document.documentElement.classList.toggle('dim-mode', dimMode);
  const btn = document.getElementById('dimToggle');
  if (btn) btn.classList.toggle('active', dimMode);
  // Toggle zen audio + reminders
  if (dimMode) { zenAudio.start(); startZenReminder(); }
  else { zenAudio.stop(); stopZenReminder(); }
}
function setFocusedBlock(blockCard) {
  if (!dimMode) return;
  document.querySelectorAll('.block-card.focused').forEach(el => el.classList.remove('focused'));
  if (blockCard) blockCard.classList.add('focused');
}
if (dimMode) document.documentElement.classList.add('dim-mode');

// ===== STATE =====
let state = null;
let activeComposeTaskId = null;

// ===== API =====
async function loadState() {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      state = await res.json();
      if (state.theme) applyTheme(state.theme);
    }
  } catch (err) {
    console.warn('Server not available', err);
    state = { meta: { title: 'Study Tracker', subtitle: '' }, days: [], checked: {},
      journal: {}, timeLog: {}, customResources: {}, comments: {},
      activeDay: '', journalDay: '', startDate: null, theme: 'dark' };
  }
}

function postEvent(event) {
  return fetch('/api/event', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(err => console.error('Event failed', err));
}

// ===== HELPERS =====
function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function findDay(id) { return state.days.find(d => d.id === id); }
function findDayIndex(id) { return state.days.findIndex(d => d.id === id); }
function getActiveDay() { return findDay(state.activeDay); }

// ===== INLINE EDITING =====
function makeEditable(el, currentValue, onSave, opts = {}) {
  if (el.querySelector('input, textarea')) return;
  const isMultiline = opts.multiline || false;
  const input = document.createElement(isMultiline ? 'textarea' : 'input');
  input.type = 'text';
  input.className = 'inline-edit-input' + (isMultiline ? ' multiline' : '');
  input.value = currentValue;
  if (opts.placeholder) input.placeholder = opts.placeholder;
  const originalHTML = el.innerHTML;
  el.innerHTML = '';
  el.appendChild(input);
  el.classList.add('editing');
  input.focus();
  input.select();
  let saved = false;
  const save = () => {
    if (saved) return; saved = true;
    const v = input.value.trim();
    el.classList.remove('editing');
    if (v && v !== currentValue) { onSave(v); }
    else { el.innerHTML = originalHTML; }
  };
  const cancel = () => { saved = true; el.innerHTML = originalHTML; el.classList.remove('editing'); };
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter' && !isMultiline) { e.preventDefault(); input.blur(); }
    if (e.key === 'Enter' && isMultiline && (e.ctrlKey || e.metaKey)) { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
}

function editMeta(field, el) {
  const val = (state.meta && state.meta[field]) || '';
  makeEditable(el, val, newVal => {
    state.meta[field] = newVal;
    postEvent({ op: 'meta_edit', [field]: newVal });
    if (field === 'title') document.title = newVal;
    renderApp();
  });
}

function editDayField(dayId, field, el) {
  const day = findDay(dayId);
  if (!day) return;
  makeEditable(el, day[field] || '', newVal => {
    day[field] = newVal;
    postEvent({ op: 'day_edit', id: dayId, [field]: newVal });
    if (field === 'label' || field === 'title') renderDayNav();
    renderActivePanel();
    renderJournal();
  });
}

function editBlockTitle(blockId, el) {
  for (const day of state.days) {
    for (const block of day.blocks) {
      if (block.id === blockId) {
        makeEditable(el, block.title, newVal => {
          block.title = newVal;
          postEvent({ op: 'block_edit', id: blockId, title: newVal });
          renderActivePanel();
        });
        return;
      }
    }
  }
}

function editTaskInline(taskId, el) {
  for (const day of state.days) {
    for (const block of day.blocks) {
      for (const task of block.tasks) {
        if (task.id === taskId) {
          makeEditable(el, task.text, newVal => {
            task.text = newVal;
            postEvent({ op: 'task_edit', id: taskId, text: newVal });
            renderActivePanel();
          }, { multiline: true });
          return;
        }
      }
    }
  }
}

// ===== RENDER: APP SHELL =====
function renderApp() {
  const app = document.getElementById('app');
  const meta = state.meta || {};
  app.innerHTML = `
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div><h1 class="editable" onclick="editMeta('title', this)" title="Click to edit title">${escapeHtml(meta.title || 'Study Tracker')}</h1>
            <p class="subtitle editable" onclick="editMeta('subtitle', this)" title="Click to edit subtitle">${escapeHtml(meta.subtitle || 'Click to set subtitle')}</p></div>
          </div>
        </div>
        <div class="header-right">
          <div class="header-stat"><span class="stat-label">Overall</span><span class="stat-value" id="overallPercent">0%</span></div>
          <div class="header-stat"><span class="stat-label">Streak</span><span class="stat-value" id="streakCount">0 🔥</span></div>
          <div class="header-stat"><span class="stat-label">Hours</span><span class="stat-value" id="totalHours">0h</span></div>
          <button class="btn-theme" id="dimToggle" title="Zen mode" ${dimMode ? 'class="btn-theme active"' : ''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 22c-4-4-8-7.5-8-12a8 8 0 0 1 16 0c0 4.5-4 8-8 12z"/><path d="M12 10v6"/><path d="M9 13l3-3 3 3"/></svg>
          </button>
          <button class="btn-theme" id="themeToggle" title="Toggle theme">
            <svg class="theme-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <svg class="theme-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </button>
          <button class="btn-data" id="dataToggle" title="Export / Import">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="btn-reset" id="resetBtn" title="Reset all progress">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      </div>
      <div class="overall-progress"><div class="overall-progress-bar" id="overallBar" style="width:0%"></div></div>
    </header>

    <div class="data-panel" id="dataPanel" style="display:none">
      <div class="data-panel-content">
        <div class="data-section">
          <h3 class="data-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
            Export
          </h3>
          <div class="data-buttons">
            <button class="data-btn" onclick="exportState()" title="Full state with progress, journal, comments">
              <span class="data-btn-icon">📦</span>
              <span class="data-btn-text">State<small>.json</small></span>
            </button>
            <button class="data-btn" onclick="exportSyllabus()" title="Structure only (days, blocks, tasks) — no progress">
              <span class="data-btn-icon">📄</span>
              <span class="data-btn-text">Syllabus<small>.toml</small></span>
            </button>
            <button class="data-btn" onclick="exportEvents()" title="Raw event log">
              <span class="data-btn-icon">📋</span>
              <span class="data-btn-text">Events<small>.ndjson</small></span>
            </button>
          </div>
        </div>
        <div class="data-divider"></div>
        <div class="data-section">
          <h3 class="data-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="6" x2="12" y2="18"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
            Import
          </h3>
          <div class="data-buttons">
            <button class="data-btn import-btn" onclick="importStateFile()" title="Restore full state from a previously exported JSON">
              <span class="data-btn-icon">📦</span>
              <span class="data-btn-text">Load State<small>.json</small></span>
            </button>
            <button class="data-btn import-btn" onclick="importSyllabusFile()" title="Load a new syllabus — resets progress">
              <span class="data-btn-icon">📄</span>
              <span class="data-btn-text">Load Syllabus<small>.toml</small></span>
            </button>
          </div>
          <p class="data-hint">⚠️ Import replaces current data. Export first to back up.</p>
        </div>
      </div>
    </div>

    <div class="stats-grid" id="statsGrid">
      <div class="stat-card"><div class="stat-card-icon tasks-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div><div class="stat-card-info"><span class="stat-card-value" id="completedTasks">0 / 0</span><span class="stat-card-label">Tasks Completed</span></div></div>
      <div class="stat-card"><div class="stat-card-icon time-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><div class="stat-card-info"><span class="stat-card-value" id="todayHours">0h 0m</span><span class="stat-card-label">Total Study Time</span></div></div>
      <div class="stat-card"><div class="stat-card-icon bonus-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><div class="stat-card-info"><span class="stat-card-value" id="bonusDone">0 / 0</span><span class="stat-card-label">Bonus Tasks Done</span></div></div>
      <div class="stat-card"><div class="stat-card-icon days-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div class="stat-card-info"><span class="stat-card-value" id="daysComplete">0 / 0</span><span class="stat-card-label">Days Completed</span></div></div>
    </div>

    <div class="timer-bar">
      <div class="timer-display"><div class="timer-icon" id="timerPulse"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div><span class="timer-time" id="timerDisplay">00:00:00</span><span class="timer-label">Session Timer</span></div>
      <div class="timer-day-select"><label for="timerDay">Logging to:</label><select id="timerDay"></select></div>
      <div class="timer-controls">
        <button class="timer-btn start" id="timerStart"><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start</button>
        <button class="timer-btn pause" id="timerPause" disabled><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause</button>
        <button class="timer-btn stop" id="timerStop" disabled><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="6" width="12" height="12" rx="1"/></svg> Save & Stop</button>
      </div>
    </div>

    <nav class="day-nav" id="dayNav"></nav>
    <div id="addDayFormArea"></div>
    <main class="day-panels" id="dayPanels"></main>
    <section class="journal-section" id="journalSection"></section>
    <footer class="footer"><p>${escapeHtml(meta.title || 'Study Tracker')} · Data saved locally · <span class="editable footer-edit" onclick="editMeta('title', this.closest('.footer').querySelector('p'))" title="Click to edit">✏️</span></p></footer>
  `;

  // Bind static events
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('dimToggle').addEventListener('click', toggleDimMode);
  const dimBtn = document.getElementById('dimToggle');
  if (dimMode) dimBtn.classList.add('active');
  document.getElementById('resetBtn').addEventListener('click', resetAll);
  document.getElementById('dataToggle').addEventListener('click', toggleDataPanel);
  document.getElementById('timerStart').addEventListener('click', startTimer);
  document.getElementById('timerPause').addEventListener('click', pauseTimer);
  document.getElementById('timerStop').addEventListener('click', stopTimer);

  renderDayNav();
  renderTimerDaySelect();
  renderActivePanel();
  renderJournal();
  updateStats();
}

// ===== RENDER: DAY NAVIGATION =====
function renderDayNav() {
  const nav = document.getElementById('dayNav');
  let html = '';
  state.days.forEach((day, i) => {
    const isActive = day.id === state.activeDay;
    const isComplete = isDayComplete(day.id);
    const cls = ['day-pill'];
    if (isActive) cls.push('active');
    if (isComplete) cls.push('completed');
    html += `<button class="${cls.join(' ')}" data-day="${day.id}" onclick="switchDay('${day.id}')">
      <span class="day-pill-number">${i + 1}</span>
      <span class="day-pill-label">${escapeHtml(day.label || day.title)}</span>
      <div class="day-pill-progress"><div class="day-pill-bar" id="dayBar-${day.id}"></div></div>
    </button>`;
  });
  // Add day button
  html += `<button class="day-pill add-day-pill" onclick="showAddDayForm()" title="Add a new day">
    <span class="day-pill-number">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </span>
    <span class="day-pill-label">ADD DAY</span>
  </button>`;
  nav.innerHTML = html;
}

// ===== RENDER: TIMER DAY SELECT =====
function renderTimerDaySelect() {
  const sel = document.getElementById('timerDay');
  sel.innerHTML = state.days.map((d, i) =>
    `<option value="${d.id}"${d.id === state.activeDay ? ' selected' : ''}>Day ${i + 1}</option>`
  ).join('');
}

// ===== RENDER: ACTIVE DAY PANEL =====
function renderActivePanel() {
  const container = document.getElementById('dayPanels');
  const day = getActiveDay();
  if (!day) { container.innerHTML = '<p class="empty-state">No days yet. Click <strong>+ ADD DAY</strong> to get started.</p>'; return; }

  let totalTasks = 0, doneTasks = 0;
  day.blocks.forEach(b => b.tasks.forEach(t => { totalTasks++; if (state.checked[t.id]) doneTasks++; }));
  const timeLogged = state.timeLog[day.id] || 0;
  const hrs = Math.floor(timeLogged / 3600), mins = Math.floor((timeLogged % 3600) / 60);

  let html = `<div class="day-panel active">
    <div class="day-header">
      <h2 class="day-title editable" onclick="editDayField('${day.id}', 'title', this)" title="Click to edit title">${escapeHtml(day.title)}</h2>
      <p class="day-subtitle editable" onclick="editDayField('${day.id}', 'subtitle', this)" title="Click to edit subtitle">${escapeHtml(day.subtitle || 'Click to add subtitle…')}</p>
      <div class="day-meta">
        <span class="day-time-logged">⏱ ${hrs}h ${mins}m logged</span>
        <span class="day-progress-text">${doneTasks}/${totalTasks} tasks</span>
        <span class="day-label-tag editable" onclick="editDayField('${day.id}', 'label', this)" title="Click to edit pill label">🏷️ ${escapeHtml(day.label)}</span>
        ${state.days.length > 1 ? `<button class="meta-action-btn danger" onclick="removeDay('${day.id}')" title="Delete day">🗑️</button>` : ''}
      </div>
    </div>`;

  day.blocks.forEach(block => {
    let blockDone = 0;
    block.tasks.forEach(t => { if (state.checked[t.id]) blockDone++; });
    html += `<div class="block-card expanded" data-block="${block.id}">
      <div class="block-header" onclick="toggleBlock(this)">
        <div class="block-header-left">
          <span class="block-icon">${block.icon || '📌'}</span>
          <span class="block-title editable" onclick="event.stopPropagation(); editBlockTitle('${block.id}', this)" title="Click to edit">${escapeHtml(block.title)}</span>
          <span class="block-badge badge-${block.badge || 'morning'}">${block.badge === 'bonus' ? '★ BONUS' : (block.badge || 'morning').toUpperCase()}</span>
        </div>
        <div class="block-header-right">
          <span class="block-count">${blockDone}/${block.tasks.length}</span>
          <button class="block-action-btn danger" onclick="event.stopPropagation(); removeBlock('${block.id}')" title="Remove block">×</button>
          <span class="block-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 9l6 6 6-6"/></svg></span>
        </div>
      </div>
      <div class="block-content"><div class="block-tasks">`;

    block.tasks.forEach(task => {
      html += renderTask(task, day.id);
    });

    // Add task button
    html += `<div class="add-task-row">
        <button class="add-item-btn" onclick="showAddTaskForm('${block.id}')" id="add-task-trigger-${block.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add task
        </button>
        <div class="add-task-form" id="add-task-form-${block.id}" style="display:none">
          <textarea placeholder="Task description..." class="add-item-input" id="add-task-input-${block.id}" rows="2" onkeydown="handleAddTaskKey(event, '${block.id}')"></textarea>
          <div class="add-item-actions">
            <button class="resource-form-btn save" onclick="submitAddTask('${block.id}')">Add</button>
            <button class="resource-form-btn cancel" onclick="cancelAddTask('${block.id}')">Cancel</button>
          </div>
        </div>
      </div>`;

    html += '</div></div></div>';
  });

  // Add block button
  html += `<div class="add-block-area">
    <button class="add-item-btn add-block-btn" onclick="showAddBlockForm('${day.id}')" id="add-block-trigger-${day.id}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add block
    </button>
    <div class="add-block-form" id="add-block-form-${day.id}" style="display:none">
      <input type="text" placeholder="Block title (e.g. Morning — Theory)" class="add-item-input" id="add-block-title-${day.id}" onkeydown="handleAddBlockKey(event, '${day.id}')">
      <div class="add-block-options">
        <select class="add-block-select" id="add-block-badge-${day.id}">
          <option value="morning">☀️ Morning</option><option value="afternoon">🔧 Afternoon</option>
          <option value="evening">🌙 Evening</option><option value="bonus">⭐ Bonus</option>
        </select>
      </div>
      <div class="add-item-actions">
        <button class="resource-form-btn save" onclick="submitAddBlock('${day.id}')">Add</button>
        <button class="resource-form-btn cancel" onclick="cancelAddBlock('${day.id}')">Cancel</button>
      </div>
    </div>
  </div>`;

  html += '</div>';
  container.innerHTML = html;
}

// ===== RENDER: SINGLE TASK =====
function renderTask(task, dayId) {
  const checked = state.checked[task.id] ? 'checked' : '';
  const doneClass = state.checked[task.id] ? 'done' : '';
  const builtInRes = task.resources || [];
  const customRes = (state.customResources && state.customResources[task.id]) || [];
  const comments = (state.comments && state.comments[task.id]) || [];
  const commentCount = comments.length;
  const hasComments = commentCount > 0 ? 'has-comments' : '';
  const isComposing = activeComposeTaskId === task.id;

  let resourceHtml = '';
  if (builtInRes.length || customRes.length) {
    resourceHtml = '<div class="task-resources">';
    builtInRes.forEach(r => {
      resourceHtml += `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="resource-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        ${escapeHtml(r.label)}</a>`;
    });
    customRes.forEach((r, idx) => {
      resourceHtml += `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="resource-link custom-resource" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        ${escapeHtml(r.label)}
        <span class="resource-remove" onclick="event.preventDefault();event.stopPropagation();removeCustomResource('${task.id}', ${idx})" title="Remove">×</span></a>`;
    });
    resourceHtml += '</div>';
  }

  // Resource add button
  resourceHtml += `<div class="add-resource-wrapper" onclick="event.stopPropagation()">
    <button class="add-resource-btn" onclick="showAddResourceForm('${task.id}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Resource
    </button>
    <div class="add-resource-form" id="resource-form-${task.id}" style="display:none">
      <input type="text" placeholder="Label (e.g. My Notes)" class="resource-input" id="resource-label-${task.id}" onkeydown="handleResourceKeydown(event, '${task.id}')">
      <input type="text" placeholder="https://example.com" class="resource-input" id="resource-url-${task.id}" onkeydown="handleResourceKeydown(event, '${task.id}')">
      <div class="resource-form-actions">
        <button class="resource-form-btn save" onclick="addCustomResource('${task.id}')">Save</button>
        <button class="resource-form-btn cancel" onclick="hideAddResourceForm('${task.id}')">Cancel</button>
      </div>
    </div>
  </div>`;

  // Inline comments
  let commentHtml = '';
  if (isComposing || commentCount > 0) {
    commentHtml = `<div class="inline-comments" id="comments-${task.id}" onclick="event.stopPropagation()">`;
    comments.forEach((c, i) => {
      commentHtml += `<div class="comment-item">
        <p class="comment-text">${escapeHtml(c.text)}</p>
        <div class="comment-meta">
          <span class="comment-time">${formatCommentTime(c.t)}</span>
          <button class="comment-delete" onclick="removeComment('${task.id}', ${i})">Delete</button>
        </div>
      </div>`;
    });
    if (isComposing) {
      commentHtml += `<div class="comment-compose">
        <textarea class="comment-input" id="commentInput" placeholder="Add a comment…" rows="2"
          onclick="event.stopPropagation()" onkeydown="handleCommentKeydown(event, '${task.id}')"></textarea>
        <div class="comment-compose-actions">
          <button class="comment-submit" onclick="event.stopPropagation(); submitComment('${task.id}')">Comment</button>
          ${commentCount > 0 ? `<button class="comment-resolve" onclick="event.stopPropagation(); resolveComments('${task.id}')">Resolve</button>` : ''}
          <button class="resource-form-btn cancel" onclick="event.stopPropagation(); closeCompose()">Cancel</button>
        </div>
      </div>`;
    }
    commentHtml += '</div>';
  }

  return `<div class="task-item ${doneClass} ${isComposing ? 'commenting' : ''}" data-task="${task.id}" id="task-${task.id}">
    <input type="checkbox" class="task-checkbox" ${checked} onchange="toggleTask('${task.id}', this)" onclick="event.stopPropagation()">
    <div class="task-info">
      <span class="task-text editable" onclick="event.stopPropagation(); editTaskInline('${task.id}', this)" title="Click to edit">${escapeHtml(task.text)}</span>
      ${resourceHtml}
    </div>
    <div class="task-actions">
      <button class="comment-trigger ${hasComments}" onclick="event.preventDefault(); event.stopPropagation(); toggleCommentCard('${task.id}')" title="Comment">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="comment-count">${commentCount || ''}</span>
      </button>
      <button class="task-action-btn copy-btn" onclick="event.stopPropagation(); copyTaskText('${task.id}', this)" title="Copy text">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
      <button class="task-action-btn danger" onclick="event.stopPropagation(); removeTask('${task.id}')" title="Delete task">🗑️</button>
    </div>
    ${commentHtml}
  </div>`;
}

// ===== RENDER: JOURNAL =====
function renderJournal() {
  const section = document.getElementById('journalSection');
  if (!state.days.length) { section.innerHTML = ''; return; }

  let tabsHtml = state.days.map((d, i) => {
    const isActive = d.id === state.journalDay;
    const hasContent = state.journal[d.id] && state.journal[d.id].trim();
    return `<button class="journal-tab ${isActive ? 'active' : ''} ${hasContent ? 'has-content' : ''}"
      data-jday="${d.id}" onclick="switchJournalDay('${d.id}')">Day ${i + 1}</button>`;
  }).join('');

  const currentText = state.journal[state.journalDay] || '';

  section.innerHTML = `
    <h2 class="section-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Daily Journal</h2>
    <div class="journal-tabs">${tabsHtml}</div>
    <div class="journal-area">
      <textarea id="journalText" placeholder="What did you learn today? Key takeaways, aha moments...">${escapeHtml(currentText)}</textarea>
      <button class="journal-save" id="journalSave">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Note
      </button>
    </div>`;

  document.getElementById('journalSave').addEventListener('click', function () {
    saveJournalEntry();
    this.classList.add('saved'); this.textContent = '✓ Saved';
    setTimeout(() => {
      this.classList.remove('saved');
      this.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Note`;
    }, 1500);
  });
}

// ===== UPDATE STATS =====
function updateStats() {
  let totalTasks = 0, completedTasks = 0, totalBonus = 0, completedBonus = 0, daysComplete = 0;

  state.days.forEach(day => {
    let dayDone = 0, dayTotal = 0, dayAllDone = 0, dayAllTotal = 0;
    day.blocks.forEach(block => {
      block.tasks.forEach(task => {
        dayAllTotal++;
        if (state.checked[task.id]) dayAllDone++;
        if (block.isBonus) {
          totalBonus++;
          if (state.checked[task.id]) completedBonus++;
        } else {
          totalTasks++; dayTotal++;
          if (state.checked[task.id]) { completedTasks++; dayDone++; }
        }
      });
    });
    // Update day pill bar
    const bar = document.getElementById('dayBar-' + day.id);
    if (bar) bar.style.width = (dayAllTotal > 0 ? (dayAllDone / dayAllTotal) * 100 : 0) + '%';
    // Day complete check
    const pill = document.querySelector(`.day-pill[data-day="${day.id}"]`);
    if (pill) {
      if (dayTotal > 0 && dayDone === dayTotal) { pill.classList.add('completed'); daysComplete++; }
      else pill.classList.remove('completed');
    }
  });

  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const el = id => document.getElementById(id);
  el('overallPercent').textContent = pct + '%';
  el('overallBar').style.width = pct + '%';
  el('completedTasks').textContent = `${completedTasks} / ${totalTasks}`;
  el('bonusDone').textContent = `${completedBonus} / ${totalBonus}`;
  el('daysComplete').textContent = `${daysComplete} / ${state.days.length}`;

  let totalSec = 0;
  for (const d in state.timeLog) totalSec += state.timeLog[d];
  el('totalHours').textContent = Math.floor(totalSec / 3600) + 'h';
  el('todayHours').textContent = `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m`;
  el('streakCount').textContent = calculateStreak() + ' 🔥';
}

function isDayComplete(dayId) {
  const day = findDay(dayId);
  if (!day) return false;
  for (const block of day.blocks) {
    if (block.isBonus) continue;
    for (const task of block.tasks) { if (!state.checked[task.id]) return false; }
  }
  return day.blocks.some(b => !b.isBonus && b.tasks.length > 0);
}

function calculateStreak() {
  let streak = 0;
  for (const day of state.days) {
    if (isDayComplete(day.id)) streak++;
    else break;
  }
  return streak;
}

// ===== DAY MANAGEMENT =====
function switchDay(dayId) {
  state.activeDay = dayId;
  postEvent({ op: 'set', k: 'activeDay', v: dayId });
  document.querySelectorAll('.day-pill').forEach(p => p.classList.toggle('active', p.dataset.day === dayId));
  renderActivePanel();
  renderTimerDaySelect();
  const timerSel = document.getElementById('timerDay');
  if (timerSel) timerSel.value = dayId;
}

function showAddDayForm() {
  const area = document.getElementById('addDayFormArea');
  area.innerHTML = `<div class="add-day-form-panel">
    <h3>Add New Day</h3>
    <input type="text" placeholder="Title (e.g. Day 3: Advanced Topics)" class="add-item-input" id="addDayTitle" autofocus>
    <input type="text" placeholder="Subtitle (e.g. Deep dive into advanced material)" class="add-item-input" id="addDaySubtitle">
    <input type="text" placeholder="Short label (e.g. Advanced)" class="add-item-input" id="addDayLabel">
    <div class="add-item-actions">
      <button class="resource-form-btn save" onclick="submitAddDay()">Add Day</button>
      <button class="resource-form-btn cancel" onclick="cancelAddDay()">Cancel</button>
    </div>
  </div>`;
  document.getElementById('addDayTitle').focus();
  document.getElementById('addDayTitle').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitAddDay();
    if (e.key === 'Escape') cancelAddDay();
  });
}

function cancelAddDay() { document.getElementById('addDayFormArea').innerHTML = ''; }

function submitAddDay() {
  const title = document.getElementById('addDayTitle').value.trim();
  if (!title) { showToast('⚠️ Title is required'); return; }
  const subtitle = document.getElementById('addDaySubtitle').value.trim();
  const label = document.getElementById('addDayLabel').value.trim() || title.split(':').pop().trim();
  const dayId = uid('day');
  const day = { id: dayId, title, subtitle, label, blocks: [] };
  state.days.push(day);
  postEvent({ op: 'day_add', day });
  cancelAddDay();
  renderDayNav();
  renderTimerDaySelect();
  renderJournal();
  switchDay(dayId);
  updateStats();
  showToast('📅 Day added');
}

// editDayField, editBlockTitle, editTaskInline — defined in INLINE EDITING section above

function removeDay(dayId) {
  if (!confirm('Delete this day and all its tasks? This cannot be undone.')) return;
  state.days = state.days.filter(d => d.id !== dayId);
  postEvent({ op: 'day_rm', id: dayId });
  if (state.activeDay === dayId) state.activeDay = state.days.length ? state.days[0].id : '';
  if (state.journalDay === dayId) state.journalDay = state.days.length ? state.days[0].id : '';
  renderDayNav();
  renderTimerDaySelect();
  renderActivePanel();
  renderJournal();
  updateStats();
  showToast('🗑️ Day removed');
}

// ===== BLOCK MANAGEMENT =====
function showAddBlockForm(dayId) {
  document.getElementById('add-block-trigger-' + dayId).style.display = 'none';
  document.getElementById('add-block-form-' + dayId).style.display = 'flex';
  document.getElementById('add-block-title-' + dayId).focus();
}
function cancelAddBlock(dayId) {
  document.getElementById('add-block-trigger-' + dayId).style.display = '';
  document.getElementById('add-block-form-' + dayId).style.display = 'none';
}
function handleAddBlockKey(e, dayId) {
  if (e.key === 'Enter') { e.preventDefault(); submitAddBlock(dayId); }
  if (e.key === 'Escape') cancelAddBlock(dayId);
}
function submitAddBlock(dayId) {
  const title = document.getElementById('add-block-title-' + dayId).value.trim();
  if (!title) { showToast('⚠️ Block title required'); return; }
  const badge = document.getElementById('add-block-badge-' + dayId).value;
  const icons = { morning: '☀️', afternoon: '🔧', evening: '🌙', bonus: '⭐' };
  const blockId = uid('blk');
  const block = { id: blockId, title, badge, icon: icons[badge] || '📌', isBonus: badge === 'bonus', tasks: [] };
  const day = findDay(dayId);
  if (day) { day.blocks.push(block); postEvent({ op: 'block_add', dayId, block }); }
  renderActivePanel();
  updateStats();
  showToast('📦 Block added');
}
function removeBlock(blockId) {
  if (!confirm('Remove this block and all its tasks?')) return;
  state.days.forEach(day => { day.blocks = day.blocks.filter(b => b.id !== blockId); });
  postEvent({ op: 'block_rm', id: blockId });
  renderActivePanel();
  updateStats();
  showToast('🗑️ Block removed');
}

// ===== TASK MANAGEMENT =====
function toggleBlock(header) {
  const card = header.closest('.block-card');
  card.classList.toggle('expanded');
  if (card.classList.contains('expanded')) setFocusedBlock(card);
}

function toggleTask(taskId, checkbox) {
  state.checked[taskId] = checkbox.checked;
  postEvent({ op: 'task', id: taskId, v: checkbox.checked });
  if (!state.startDate && checkbox.checked) {
    state.startDate = new Date().toISOString();
    postEvent({ op: 'set', k: 'startDate', v: state.startDate });
  }
  const item = checkbox.closest('.task-item');
  setFocusedBlock(item.closest('.block-card'));
  item.classList.toggle('done', checkbox.checked);
  updateStats();
  if (checkbox.checked) {
    fireBurst(checkbox);
    // Drop task text into trophy pile
    const taskText = item.querySelector('.task-text');
    if (taskText) dropTrophy(taskText.textContent.trim());
    const dayId = findDayForTask(taskId);
    if (dayId && isDayComplete(dayId)) { fireDayComplete(); showToast('🎉 Day complete!'); }
  } else {
    // Remove from trophy pile when unchecked
    const taskText = item.querySelector('.task-text');
    if (taskText) removeTrophy(taskText.textContent.trim());
  }
}

function findDayForTask(taskId) {
  for (const day of state.days)
    for (const block of day.blocks)
      for (const task of block.tasks)
        if (task.id === taskId) return day.id;
  return null;
}

function showAddTaskForm(blockId) {
  document.getElementById('add-task-trigger-' + blockId).style.display = 'none';
  document.getElementById('add-task-form-' + blockId).style.display = 'flex';
  document.getElementById('add-task-input-' + blockId).focus();
}
function cancelAddTask(blockId) {
  document.getElementById('add-task-trigger-' + blockId).style.display = '';
  document.getElementById('add-task-form-' + blockId).style.display = 'none';
  document.getElementById('add-task-input-' + blockId).value = '';
}
function handleAddTaskKey(e, blockId) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitAddTask(blockId); }
  if (e.key === 'Escape') cancelAddTask(blockId);
}
function submitAddTask(blockId) {
  const input = document.getElementById('add-task-input-' + blockId);
  const text = input.value.trim();
  if (!text) { showToast('⚠️ Task description required'); return; }
  const taskId = uid('task');
  const task = { id: taskId, text, resources: [] };
  // Find block and add task
  for (const day of state.days) {
    for (const block of day.blocks) {
      if (block.id === blockId) { block.tasks.push(task); break; }
    }
  }
  postEvent({ op: 'task_add', blockId, task });
  input.value = '';
  renderActivePanel();
  updateStats();
  showToast('✅ Task added');
}

// editTaskInline — defined in INLINE EDITING section above

function removeTask(taskId) {
  if (!confirm('Remove this task?')) return;
  state.days.forEach(day => {
    day.blocks.forEach(block => { block.tasks = block.tasks.filter(t => t.id !== taskId); });
  });
  delete state.checked[taskId];
  if (state.customResources) delete state.customResources[taskId];
  if (state.comments) delete state.comments[taskId];
  postEvent({ op: 'task_rm', id: taskId });
  renderActivePanel();
  updateStats();
  showToast('🗑️ Task removed');
}

function copyTaskText(taskId, btn) {
  let text = '';
  state.days.forEach(day => {
    day.blocks.forEach(block => {
      block.tasks.forEach(t => { if (t.id === taskId) text = t.text; });
    });
  });
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.title = 'Copied!';
    showToast('📋 Copied to clipboard');
    setTimeout(() => { btn.classList.remove('copied'); btn.title = 'Copy text'; }, 1500);
  }).catch(() => {
    // Fallback for non-HTTPS
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    btn.classList.add('copied');
    showToast('📋 Copied to clipboard');
    setTimeout(() => btn.classList.remove('copied'), 1500);
  });
}

// ===== CUSTOM RESOURCES =====
function showAddResourceForm(taskId) {
  document.querySelectorAll('.add-resource-form').forEach(f => f.style.display = 'none');
  const form = document.getElementById('resource-form-' + taskId);
  if (form) { form.style.display = 'flex'; setTimeout(() => document.getElementById('resource-label-' + taskId).focus(), 50); }
}
function hideAddResourceForm(taskId) {
  const form = document.getElementById('resource-form-' + taskId);
  if (form) { form.style.display = 'none'; }
}
function addCustomResource(taskId) {
  const label = document.getElementById('resource-label-' + taskId).value.trim();
  const url = document.getElementById('resource-url-' + taskId).value.trim();
  if (!label || !url) { showToast('⚠️ Both label and URL required'); return; }
  if (!state.customResources) state.customResources = {};
  if (!state.customResources[taskId]) state.customResources[taskId] = [];
  state.customResources[taskId].push({ label, url });
  postEvent({ op: 'res_add', id: taskId, label, url });
  renderActivePanel(); showToast('🔗 Resource added');
}
function removeCustomResource(taskId, idx) {
  if (!state.customResources || !state.customResources[taskId]) return;
  postEvent({ op: 'res_rm', id: taskId, idx });
  state.customResources[taskId].splice(idx, 1);
  if (!state.customResources[taskId].length) delete state.customResources[taskId];
  renderActivePanel(); showToast('🗑️ Resource removed');
}
function handleResourceKeydown(e, taskId) {
  e.stopPropagation();
  if (e.key === 'Enter') { e.preventDefault(); addCustomResource(taskId); }
  if (e.key === 'Escape') hideAddResourceForm(taskId);
}

// ===== COMMENTS (inline) =====
function toggleCommentCard(taskId) {
  if (activeComposeTaskId === taskId) closeCompose();
  else openCompose(taskId);
}
function openCompose(taskId) {
  activeComposeTaskId = taskId;
  renderActivePanel();
  setTimeout(() => { const inp = document.getElementById('commentInput'); if (inp) inp.focus(); }, 50);
}
function closeCompose() {
  activeComposeTaskId = null;
  renderActivePanel();
}
function formatCommentTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr), diff = Date.now() - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch { return ''; }
}
function handleCommentKeydown(e, taskId) {
  e.stopPropagation();
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitComment(taskId); }
  if (e.key === 'Escape') closeCompose();
}
function submitComment(taskId) {
  const input = document.getElementById('commentInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  if (!state.comments) state.comments = {};
  if (!state.comments[taskId]) state.comments[taskId] = [];
  state.comments[taskId].push({ text, t: new Date().toISOString() });
  postEvent({ op: 'comment_add', id: taskId, v: text });
  renderActivePanel(); showToast('💬 Comment added');
  // Re-open compose on same task
  setTimeout(() => { activeComposeTaskId = taskId; renderActivePanel();
    setTimeout(() => { const inp = document.getElementById('commentInput'); if (inp) inp.focus(); }, 50);
  }, 0);
}
function removeComment(taskId, idx) {
  if (!state.comments || !state.comments[taskId]) return;
  postEvent({ op: 'comment_rm', id: taskId, idx });
  state.comments[taskId].splice(idx, 1);
  if (!state.comments[taskId].length) delete state.comments[taskId];
  renderActivePanel();
}
function resolveComments(taskId) {
  if (!state.comments || !state.comments[taskId]) return;
  const count = state.comments[taskId].length;
  for (let i = count - 1; i >= 0; i--) postEvent({ op: 'comment_rm', id: taskId, idx: i });
  delete state.comments[taskId];
  closeCompose();
  showToast('✅ Resolved');
}

// ===== TIMER =====
let timerInterval = null, timerSeconds = 0, timerRunning = false;

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  document.getElementById('timerStart').disabled = true;
  document.getElementById('timerPause').disabled = false;
  document.getElementById('timerStop').disabled = false;
  document.getElementById('timerPulse').classList.add('active');
  timerInterval = setInterval(() => { timerSeconds++; updateTimerDisplay(); }, 1000);
}
function pauseTimer() {
  if (!timerRunning) return;
  timerRunning = false;
  clearInterval(timerInterval);
  document.getElementById('timerStart').disabled = false;
  document.getElementById('timerPause').disabled = true;
  document.getElementById('timerPulse').classList.remove('active');
}
function stopTimer() {
  pauseTimer();
  const dayId = document.getElementById('timerDay').value;
  if (!state.timeLog[dayId]) state.timeLog[dayId] = 0;
  state.timeLog[dayId] += timerSeconds;
  postEvent({ op: 'time', dayId, v: timerSeconds });
  const h = Math.floor(timerSeconds / 3600), m = Math.floor((timerSeconds % 3600) / 60);
  showToast(`⏱ Logged ${h > 0 ? h + 'h ' : ''}${m}m to selected day`);
  timerSeconds = 0; updateTimerDisplay();
  document.getElementById('timerStop').disabled = true;
  renderActivePanel(); updateStats();
}
function updateTimerDisplay() {
  const h = Math.floor(timerSeconds / 3600), m = Math.floor((timerSeconds % 3600) / 60), s = timerSeconds % 60;
  document.getElementById('timerDisplay').textContent =
    String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// ===== JOURNAL =====
function switchJournalDay(dayId) {
  saveJournalEntry();
  state.journalDay = dayId;
  postEvent({ op: 'set', k: 'journalDay', v: dayId });
  renderJournal();
}
function saveJournalEntry() {
  const textarea = document.getElementById('journalText');
  if (!textarea) return;
  const text = textarea.value.trim();
  const dayId = state.journalDay;
  if (text) state.journal[dayId] = text;
  else delete state.journal[dayId];
  postEvent({ op: 'journal', dayId, v: text });
}

// ===== CELEBRATIONS (Khan Academy-style particle bursts) =====
const BURST_COLORS = [
  '#F5C518', '#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#96E6A1', '#DDA0DD', '#FF85A2', '#FFDAB9',
];

const SHAPES = ['circle', 'star', 'diamond', 'sparkle'];

function createBurstCanvas() {
  let canvas = document.getElementById('burstCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'burstCanvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;';
    document.body.appendChild(canvas);
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  return canvas;
}

let _particles = [];
let _animFrame = null;

function spawnParticles(x, y, count, opts = {}) {
  const spread = opts.spread || 1;
  const sizeMin = opts.sizeMin || 3;
  const sizeMax = opts.sizeMax || 8;
  const speedMin = opts.speedMin || 2;
  const speedMax = opts.speedMax || 8;
  const gravity = opts.gravity !== undefined ? opts.gravity : 0.12;
  const colors = opts.colors || BURST_COLORS;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * spread;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    _particles.push({
      x, y,
      vx: Math.cos(angle) * speed * (0.5 + Math.random()),
      vy: Math.sin(angle) * speed * (0.5 + Math.random()) - 2,
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      gravity,
      drag: 0.97 + Math.random() * 0.02,
      life: 1,
      decay: 0.008 + Math.random() * 0.010,
      shimmer: Math.random() > 0.5,
    });
  }

  if (!_animFrame) tickBurst();
}

function drawStar(ctx, cx, cy, r, points, rotation) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = (i % 2 === 0) ? r : r * 0.4;
    const a = rotation + (Math.PI * i / points);
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawSparkle(ctx, cx, cy, r, rotation) {
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = rotation + (Math.PI * i / 2);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
}

function drawDiamond(ctx, cx, cy, r, rotation) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.6, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.6, 0);
  ctx.closePath();
  ctx.restore();
}

function tickBurst() {
  const canvas = createBurstCanvas();
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  _particles = _particles.filter(p => p.life > 0);

  if (_particles.length === 0) {
    _animFrame = null;
    canvas.remove();
    return;
  }

  for (const p of _particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.rotation += p.rotSpeed;
    p.life -= p.decay;

    const alpha = Math.max(0, p.life);
    const shimmerAlpha = p.shimmer ? alpha * (0.6 + 0.4 * Math.sin(Date.now() * 0.02 + p.rotation * 10)) : alpha;
    ctx.globalAlpha = shimmerAlpha;

    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    } else if (p.shape === 'star') {
      drawStar(ctx, p.x, p.y, p.size, 5, p.rotation);
      ctx.fillStyle = p.color;
      ctx.fill();
    } else if (p.shape === 'sparkle') {
      drawSparkle(ctx, p.x, p.y, p.size * 1.5, p.rotation);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (p.shape === 'diamond') {
      drawDiamond(ctx, p.x, p.y, p.size, p.rotation);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
  _animFrame = requestAnimationFrame(tickBurst);
}

// Small burst from a checkbox (every task tick)
function fireBurst(checkbox) {
  const rect = checkbox.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Main burst — high speed so particles fly across the whole page
  spawnParticles(x, y, 28, {
    spread: 2.0,
    sizeMin: 3, sizeMax: 9,
    speedMin: 8, speedMax: 18,
    gravity: 0.06,
  });

  // Secondary scattered bursts at random positions across the page
  for (let i = 0; i < 3; i++) {
    const rx = Math.random() * w;
    const ry = Math.random() * h * 0.6;
    setTimeout(() => {
      spawnParticles(rx, ry, 10, {
        spread: 1.8,
        sizeMin: 2, sizeMax: 7,
        speedMin: 3, speedMax: 9,
        gravity: 0.07,
        colors: ['#FFD700', '#F5C518', '#fff', '#FFA500', '#4ECDC4', '#FF6B6B'],
      });
    }, 50 + i * 80);
  }

  // Glitter trail floating upward from checkbox
  spawnParticles(x, y, 8, {
    spread: 0.6,
    sizeMin: 1.5, sizeMax: 5,
    speedMin: 2, speedMax: 6,
    gravity: -0.05,
    colors: ['#FFD700', '#F5C518', '#fff', '#FFA500'],
  });
}

// Big celebration (full day complete)
function fireDayComplete() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Multiple bursts across the screen
  const burstPoints = [
    [w * 0.2, h * 0.3], [w * 0.5, h * 0.2], [w * 0.8, h * 0.3],
    [w * 0.3, h * 0.5], [w * 0.7, h * 0.5],
  ];

  burstPoints.forEach(([bx, by], i) => {
    setTimeout(() => {
      spawnParticles(bx, by, 30, {
        spread: 1.5,
        sizeMin: 3, sizeMax: 10,
        speedMin: 4, speedMax: 12,
        gravity: 0.15,
      });
    }, i * 120);
  });

  // Shower from top
  setTimeout(() => {
    for (let i = 0; i < 40; i++) {
      setTimeout(() => {
        spawnParticles(Math.random() * w, -10, 3, {
          spread: 0.5,
          sizeMin: 3, sizeMax: 7,
          speedMin: 0.5, speedMax: 2,
          gravity: 0.2,
          colors: ['#F5C518', '#FFD700', '#e6b800', '#FFA500'],
        });
      }, i * 30);
    }
  }, 400);
}

// ===== TOAST =====
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

// ===== RESET =====
async function resetAll() {
  if (!confirm('🗑️ Reset ALL progress? Checkboxes, time, journal, and comments will be cleared. Structure (days/tasks) is kept.')) return;
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (res.ok) state = await res.json();
  } catch { /* ignore */ }
  activeComposeTaskId = null;
  renderApp();
  showToast('♻️ All progress reset');
}

// ===== DATA PANEL (Export / Import) =====
function toggleDataPanel() {
  const panel = document.getElementById('dataPanel');
  const btn = document.getElementById('dataToggle');
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    btn.classList.add('active');
  } else {
    panel.style.display = 'none';
    btn.classList.remove('active');
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}

async function exportState() {
  try {
    const res = await fetch('/api/export/state');
    const blob = await res.blob();
    downloadBlob(blob, 'tracker-state.json');
    showToast('📦 State exported');
  } catch (err) {
    showToast('⚠️ Export failed: ' + err.message);
  }
}

async function exportSyllabus() {
  try {
    const res = await fetch('/api/export/syllabus');
    const blob = await res.blob();
    downloadBlob(blob, 'syllabus.toml');
    showToast('📄 Syllabus exported');
  } catch (err) {
    showToast('⚠️ Export failed: ' + err.message);
  }
}

async function exportEvents() {
  try {
    const res = await fetch('/api/export/events');
    const blob = await res.blob();
    downloadBlob(blob, 'db.ndjson');
    showToast('📋 Events exported');
  } catch (err) {
    showToast('⚠️ Export failed: ' + err.message);
  }
}

function importStateFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm(`Import "${file.name}"? This will REPLACE all current data (progress, journal, comments, structure).`)) return;
    try {
      const text = await file.text();
      const res = await fetch('/api/import/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      });
      const result = await res.json();
      if (result.ok) {
        // Reload state from server
        await loadState();
        activeComposeTaskId = null;
        renderApp();
        if (state.meta && state.meta.title) document.title = state.meta.title;
        showToast(`📦 State imported — ${result.days} days loaded`);
      } else {
        showToast('⚠️ Import failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      showToast('⚠️ Import failed: ' + err.message);
    }
  };
  input.click();
}

function importSyllabusFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.toml';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm(`Load syllabus from "${file.name}"? This will REPLACE the current structure and RESET all progress.`)) return;
    try {
      const text = await file.text();
      const res = await fetch('/api/import/syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: text,
      });
      const result = await res.json();
      if (result.ok) {
        await loadState();
        activeComposeTaskId = null;
        renderApp();
        if (state.meta && state.meta.title) document.title = state.meta.title;
        showToast(`📄 Syllabus loaded — ${result.days} days`);
      } else {
        showToast('⚠️ Import failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      showToast('⚠️ Import failed: ' + err.message);
    }
  };
  input.click();
}

// ===== TROPHY PILE (completed tasks gravity wall) =====
const TROPHY_KEY = 'study-tracker-trophies';

function getTrophies() {
  try { return JSON.parse(localStorage.getItem(TROPHY_KEY) || '[]'); }
  catch { return []; }
}

function saveTrophies(trophies) {
  localStorage.setItem(TROPHY_KEY, JSON.stringify(trophies));
}

function ensureTrophyContainer() {
  let container = document.getElementById('trophyPile');
  if (!container) {
    container = document.createElement('div');
    container.id = 'trophyPile';
    container.className = 'trophy-pile';
    container.innerHTML = `
      <div class="trophy-header">
        <span class="trophy-counter"><span id="trophyCount">0</span> done</span>
        <button class="trophy-clear" onclick="clearTrophies()" title="Clear trophy pile">✕</button>
      </div>
      <div class="trophy-chips" id="trophyChips"></div>
    `;
    document.body.appendChild(container);
  }
  return container;
}

function renderTrophyChips(animate) {
  const container = ensureTrophyContainer();
  const chipsEl = document.getElementById('trophyChips');
  const trophies = getTrophies();
  document.getElementById('trophyCount').textContent = trophies.length;

  if (trophies.length === 0) {
    container.classList.remove('visible');
    return;
  }
  container.classList.add('visible');

  // Only render what's there — don't re-render everything for perf
  chipsEl.innerHTML = '';
  trophies.forEach((t, i) => {
    const chip = document.createElement('div');
    chip.className = 'trophy-chip';
    if (animate && i === trophies.length - 1) chip.classList.add('trophy-drop');
    // Random slight rotation for gravity-pile feel
    const rot = (Math.random() - 0.5) * 8;
    chip.style.transform = `rotate(${rot}deg)`;
    // Truncate long texts
    chip.textContent = t.text.length > 50 ? t.text.slice(0, 47) + '…' : t.text;
    chip.title = t.text;
    chipsEl.appendChild(chip);
  });
}

function dropTrophy(text) {
  const trophies = getTrophies();
  // Avoid duplicates
  if (trophies.some(t => t.text === text)) return;
  trophies.push({ text, ts: Date.now() });
  saveTrophies(trophies);
  renderTrophyChips(true);
}

function removeTrophy(text) {
  let trophies = getTrophies();
  trophies = trophies.filter(t => t.text !== text);
  saveTrophies(trophies);
  renderTrophyChips(false);
}

function clearTrophies() {
  if (!confirm('Clear all completed task trophies?')) return;
  localStorage.removeItem(TROPHY_KEY);
  renderTrophyChips(false);
  showToast('🧹 Trophy pile cleared');
}

function loadTrophyPile() {
  ensureTrophyContainer();
  renderTrophyChips(false);
}

// ===== INIT =====
async function init() {
  await loadState();
  // Ensure sensible defaults
  if (!state.activeDay && state.days.length) state.activeDay = state.days[0].id;
  if (!state.journalDay && state.days.length) state.journalDay = state.days[0].id;
  renderApp();
  // Update page title from meta
  if (state.meta && state.meta.title) document.title = state.meta.title;
  // Load trophy pile from localStorage
  loadTrophyPile();
}

document.addEventListener('DOMContentLoaded', init);
