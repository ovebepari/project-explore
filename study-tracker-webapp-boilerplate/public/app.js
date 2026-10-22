// ===== THEME (fast cache to prevent flash — canonical source is SQLite) =====
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme-cache', theme);  // fast cache only
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  if (state) {
    state.theme = next;
    postEvent({ op: 'set', k: 'theme', v: next });
  }
}

// Apply cached theme immediately to prevent flash on load
applyTheme(localStorage.getItem('theme-cache') || 'dark');


// ===== SYLLABUS DATA =====
// ✏️ REPLACE THIS with your syllabus content.
// Keep the structure below. Each day (1–7) has a title, subtitle, and blocks.
// Each block has tasks. Each task needs a UNIQUE id.
//
// ID convention: d{day}{block_initial}{number}
//   d1m1 = Day 1, Morning, Task 1
//   d3a2 = Day 3, Afternoon, Task 2
//
// Task schema:
// {
//   id: string       — REQUIRED, globally unique (e.g. "d1m1")
//   text: string     — REQUIRED, task description
//   resources: [     — OPTIONAL, array of links
//     { label: string, url: string }
//   ]
// }
//
// Block schema:
// {
//   id: string       — REQUIRED, unique block id (e.g. "d1-morning")
//   title: string    — REQUIRED, shown as collapsible header
//   badge: string    — REQUIRED, one of: "morning", "afternoon", "evening", "bonus"
//   icon: string     — REQUIRED, emoji icon
//   isBonus: bool    — OPTIONAL, set true for bonus/optional blocks
//   tasks: Task[]    — REQUIRED, array of tasks
// }
const SYLLABUS = {
  1: {
    title: "Day 1: Introduction & Foundations",
    subtitle: "Getting started — core concepts and first steps",
    blocks: [
      {
        id: "d1-morning",
        title: "Morning — Core Concepts",
        badge: "morning",
        icon: "☀️",
        tasks: [
          {
            id: "d1m1",
            text: "Read Chapter 1: Introduction to the subject. Take notes on key definitions.",
            resources: [
              { label: "Textbook Ch.1", url: "https://example.com/chapter-1" }
            ]
          },
          {
            id: "d1m2",
            text: "Watch the introductory lecture (45 min). Focus on the 3 main frameworks.",
            resources: [
              { label: "Lecture Video", url: "https://example.com/lecture-1" }
            ]
          }
        ]
      },
      {
        id: "d1-afternoon",
        title: "Afternoon — Hands-On Practice",
        badge: "afternoon",
        icon: "🔧",
        tasks: [
          {
            id: "d1a1",
            text: "Complete Exercise Set 1 (problems 1–10). Show your work."
          },
          {
            id: "d1a2",
            text: "Build a small project applying the morning concepts."
          }
        ]
      },
      {
        id: "d1-evening",
        title: "Evening — Review & Reflection",
        badge: "evening",
        icon: "🌙",
        tasks: [
          {
            id: "d1e1",
            text: "Review your notes. Identify gaps. Write down 3 questions.",
          }
        ]
      },
      {
        id: "d1-bonus",
        title: "Bonus Deep-Dives",
        badge: "bonus",
        icon: "⭐",
        isBonus: true,
        tasks: [
          {
            id: "d1b1",
            text: "Optional: Read the original research paper behind today's topic.",
          }
        ]
      }
    ]
  },
  2: {
    title: "Day 2: Building On Foundations",
    subtitle: "Deepening understanding — connecting concepts",
    blocks: [
      {
        id: "d2-morning",
        title: "Morning — Theory",
        badge: "morning",
        icon: "☀️",
        tasks: [
          {
            id: "d2m1",
            text: "Read Chapter 2. Map connections to Day 1 material."
          }
        ]
      },
      {
        id: "d2-afternoon",
        title: "Afternoon — Application",
        badge: "afternoon",
        icon: "🔧",
        tasks: [
          {
            id: "d2a1",
            text: "Build a project combining Day 1 and Day 2 concepts."
          }
        ]
      }
    ]
  },
  // ✏️ ADD days 3–7 following the same pattern...
  3: { title: "Day 3: [Topic]", subtitle: "[Subtitle]", blocks: [] },
  4: { title: "Day 4: [Topic]", subtitle: "[Subtitle]", blocks: [] },
  5: { title: "Day 5: [Topic]", subtitle: "[Subtitle]", blocks: [] },
  6: { title: "Day 6: [Topic]", subtitle: "[Subtitle]", blocks: [] },
  7: { title: "Day 7: [Capstone]", subtitle: "[Subtitle]", blocks: [] },
};

// ===== STORAGE (SQLite via Python server API) =====
const DEFAULT_STATE = {
  tasks: {},
  journal: {},
  timeLog: {},
  customResources: {},
  comments: {},
  activeDay: 1,
  journalDay: 1,
  startDate: null,
  theme: 'dark'
};

let state = { ...DEFAULT_STATE };

function postEvent(event) {
  fetch('/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  }).catch(err => console.error('Failed to post event', err));
}

async function loadStateFromServer() {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      state = { ...DEFAULT_STATE, ...data };
      // Sync theme from DB
      if (state.theme) applyTheme(state.theme);
    }
  } catch (err) {
    console.warn('Server not available, using defaults', err);
  }
}

// ===== PARTICLES =====
function createParticles() {
  const container = document.getElementById('particles');
  const colors = ['#F5C518', '#d4a017', '#e6b800', '#666', '#888', '#aaa'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (Math.random() * 20 + 15) + 's';
    p.style.animationDelay = (Math.random() * 20) + 's';
    container.appendChild(p);
  }
}

// ===== RENDER DAY PANELS =====
function renderPanels() {
  const container = document.getElementById('dayPanels');
  container.innerHTML = '';

  for (let day = 1; day <= 7; day++) {
    const data = SYLLABUS[day];
    const panel = document.createElement('div');
    panel.className = 'day-panel' + (day === state.activeDay ? ' active' : '');
    panel.id = 'panel-' + day;

    // Count tasks
    let totalTasks = 0, doneTasks = 0;
    data.blocks.forEach(block => {
      block.tasks.forEach(task => {
        totalTasks++;
        if (state.tasks[task.id]) doneTasks++;
      });
    });

    const timeLogged = state.timeLog[day] || 0;
    const hrs = Math.floor(timeLogged / 3600);
    const mins = Math.floor((timeLogged % 3600) / 60);

    let html = `
      <div class="day-header">
        <h2 class="day-title">${data.title}</h2>
        <p class="day-subtitle">${data.subtitle}</p>
        <div class="day-meta">
          <span class="day-time-logged">⏱ ${hrs}h ${mins}m logged</span>
          <span class="day-progress-text">${doneTasks}/${totalTasks} tasks</span>
        </div>
      </div>
    `;

    data.blocks.forEach(block => {
      let blockDone = 0;
      block.tasks.forEach(t => { if (state.tasks[t.id]) blockDone++; });

      html += `
        <div class="block-card ${day === state.activeDay ? 'expanded' : ''}" data-block="${block.id}">
          <div class="block-header" onclick="toggleBlock(this)">
            <div class="block-header-left">
              <span class="block-icon">${block.icon}</span>
              <span class="block-title">${block.title}</span>
              <span class="block-badge badge-${block.badge}">${block.badge === 'bonus' ? '★ BONUS' : block.badge.toUpperCase()}</span>
            </div>
            <div class="block-header-right">
              <span class="block-count">${blockDone}/${block.tasks.length}</span>
              <span class="block-chevron">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 9l6 6 6-6"/></svg>
              </span>
            </div>
          </div>
          <div class="block-content">
            <div class="block-tasks">
      `;

      block.tasks.forEach(task => {
        const checked = state.tasks[task.id] ? 'checked' : '';
        const doneClass = state.tasks[task.id] ? 'done' : '';
        const builtInRes = task.resources || [];
        const customRes = (state.customResources && state.customResources[task.id]) || [];
        let resourceHtml = '';
        if (builtInRes.length || customRes.length) {
          resourceHtml = '<div class="task-resources">';
          builtInRes.forEach(r => {
            resourceHtml += `<a href="${r.url}" target="_blank" rel="noopener" class="resource-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              ${r.label}
            </a>`;
          });
          customRes.forEach((r, idx) => {
            resourceHtml += `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="resource-link custom-resource" onclick="event.stopPropagation()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              ${escapeHtml(r.label)}
              <span class="resource-remove" onclick="event.preventDefault();event.stopPropagation();removeCustomResource('${task.id}', ${idx})" title="Remove resource">×</span>
            </a>`;
          });
          resourceHtml += '</div>';
        }
        resourceHtml += `
          <div class="add-resource-wrapper" onclick="event.stopPropagation()">
            <button class="add-resource-btn" onclick="showAddResourceForm('${task.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Resource
            </button>
            <div class="add-resource-form" id="resource-form-${task.id}" style="display:none">
              <input type="text" placeholder="Label (e.g. My Notes)" class="resource-input" id="resource-label-${task.id}" onkeydown="handleResourceKeydown(event, '${task.id}')">
              <input type="text" placeholder="https://example.com" class="resource-input" id="resource-url-${task.id}" onkeydown="handleResourceKeydown(event, '${task.id}')">
              <div class="resource-form-actions">
                <button class="resource-form-btn save" onclick="addCustomResource('${task.id}')">Save</button>
                <button class="resource-form-btn cancel" onclick="hideAddResourceForm('${task.id}')">Cancel</button>
              </div>
            </div>
          </div>
        `;

        const commentCount = (state.comments && state.comments[task.id] && state.comments[task.id].length) || 0;
        const hasComments = commentCount > 0 ? 'has-comments' : '';

        html += `
          <label class="task-item ${doneClass}" data-task="${task.id}" id="task-${task.id}">
            <input type="checkbox" class="task-checkbox" ${checked} onchange="toggleTask('${task.id}', this)">
            <div class="task-info">
              <span class="task-text">${task.text}</span>
              ${resourceHtml}
            </div>
            <button class="comment-trigger ${hasComments}" data-task-id="${task.id}" onclick="event.preventDefault(); event.stopPropagation(); toggleCommentCard('${task.id}')" title="Comment">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span class="comment-count">${commentCount || ''}</span>
            </button>
          </label>
        `;
      });

      html += `
            </div>
          </div>
        </div>
      `;
    });

    panel.innerHTML = html;
    container.appendChild(panel);
  }
}

// ===== TOGGLE BLOCK =====
function toggleBlock(header) {
  const card = header.closest('.block-card');
  card.classList.toggle('expanded');
  setTimeout(updateCommentGutter, 400);
}

// ===== TOGGLE TASK =====
function toggleTask(taskId, checkbox) {
  state.tasks[taskId] = checkbox.checked;
  postEvent({ op: 'task', id: taskId, v: checkbox.checked });
  if (!state.startDate && checkbox.checked) {
    state.startDate = new Date().toISOString();
    postEvent({ op: 'set', k: 'startDate', v: state.startDate });
  }

  // Update label
  const label = checkbox.closest('.task-item');
  if (checkbox.checked) {
    label.classList.add('done');
  } else {
    label.classList.remove('done');
  }

  updateStats();

  // Check if day is complete
  if (checkbox.checked) {
    const dayNum = findDayForTask(taskId);
    if (dayNum && isDayComplete(dayNum)) {
      fireConfetti();
      showToast(`🎉 Day ${dayNum} complete!`);
    }
  }
}

function findDayForTask(taskId) {
  for (let day = 1; day <= 7; day++) {
    for (const block of SYLLABUS[day].blocks) {
      for (const task of block.tasks) {
        if (task.id === taskId) return day;
      }
    }
  }
  return null;
}

function isDayComplete(day) {
  const data = SYLLABUS[day];
  for (const block of data.blocks) {
    if (block.isBonus) continue; // Don't require bonus tasks
    for (const task of block.tasks) {
      if (!state.tasks[task.id]) return false;
    }
  }
  return true;
}

// ===== UPDATE STATS =====
function updateStats() {
  let totalTasks = 0, completedTasks = 0;
  let totalBonus = 0, completedBonus = 0;
  let daysComplete = 0;

  for (let day = 1; day <= 7; day++) {
    const data = SYLLABUS[day];
    let dayDone = 0, dayTotal = 0;
    let dayTotalAll = 0, dayDoneAll = 0;

    data.blocks.forEach(block => {
      block.tasks.forEach(task => {
        dayTotalAll++;
        if (state.tasks[task.id]) dayDoneAll++;

        if (block.isBonus) {
          totalBonus++;
          if (state.tasks[task.id]) completedBonus++;
        } else {
          totalTasks++;
          dayTotal++;
          if (state.tasks[task.id]) {
            completedTasks++;
            dayDone++;
          }
        }
      });
    });

    // Update day pill bar
    const bar = document.getElementById('dayBar' + day);
    if (bar) {
      const pct = dayTotalAll > 0 ? (dayDoneAll / dayTotalAll) * 100 : 0;
      bar.style.width = pct + '%';
    }

    // Check day complete (non-bonus)
    const pill = document.querySelector(`.day-pill[data-day="${day}"]`);
    if (pill) {
      if (dayTotal > 0 && dayDone === dayTotal) {
        pill.classList.add('completed');
        daysComplete++;
      } else {
        pill.classList.remove('completed');
      }
    }
  }

  // Overall
  const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  document.getElementById('overallPercent').textContent = overallPct + '%';
  document.getElementById('overallBar').style.width = overallPct + '%';
  document.getElementById('completedTasks').textContent = `${completedTasks} / ${totalTasks}`;
  document.getElementById('bonusDone').textContent = `${completedBonus} / ${totalBonus}`;
  document.getElementById('daysComplete').textContent = `${daysComplete} / 7`;

  // Total hours
  let totalSeconds = 0;
  for (const d in state.timeLog) totalSeconds += state.timeLog[d];
  const totalH = Math.floor(totalSeconds / 3600);
  const totalM = Math.floor((totalSeconds % 3600) / 60);
  document.getElementById('totalHours').textContent = totalH + 'h';
  document.getElementById('todayHours').textContent = `${totalH}h ${totalM}m`;

  // Streak
  const streak = calculateStreak();
  document.getElementById('streakCount').textContent = streak + ' 🔥';
}

function calculateStreak() {
  // Simple streak: count consecutive days completed
  let streak = 0;
  for (let day = 1; day <= 7; day++) {
    if (isDayComplete(day)) streak++;
    else break;
  }
  return streak;
}

// ===== CUSTOM RESOURCES =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showAddResourceForm(taskId) {
  // Hide any other open forms first
  document.querySelectorAll('.add-resource-form').forEach(f => f.style.display = 'none');
  const form = document.getElementById('resource-form-' + taskId);
  if (form) {
    form.style.display = 'flex';
    const labelInput = document.getElementById('resource-label-' + taskId);
    if (labelInput) setTimeout(() => labelInput.focus(), 50);
  }
}

function hideAddResourceForm(taskId) {
  const form = document.getElementById('resource-form-' + taskId);
  if (form) {
    form.style.display = 'none';
    document.getElementById('resource-label-' + taskId).value = '';
    document.getElementById('resource-url-' + taskId).value = '';
  }
}

function addCustomResource(taskId) {
  const label = document.getElementById('resource-label-' + taskId).value.trim();
  const url = document.getElementById('resource-url-' + taskId).value.trim();

  if (!label || !url) {
    showToast('⚠️ Please enter both a label and URL');
    return;
  }

  if (!state.customResources) state.customResources = {};
  if (!state.customResources[taskId]) state.customResources[taskId] = [];

  state.customResources[taskId].push({ label, url });
  postEvent({ op: 'res_add', id: taskId, label: label, url: url });

  renderPanels();
  switchDay(state.activeDay);
  showToast('🔗 Resource added');
}

function removeCustomResource(taskId, index) {
  if (!state.customResources || !state.customResources[taskId]) return;

  postEvent({ op: 'res_rm', id: taskId, idx: index });
  state.customResources[taskId].splice(index, 1);
  if (state.customResources[taskId].length === 0) {
    delete state.customResources[taskId];
  }

  renderPanels();
  switchDay(state.activeDay);
  showToast('🗑️ Resource removed');
}

function handleResourceKeydown(e, taskId) {
  e.stopPropagation();
  if (e.key === 'Enter') {
    e.preventDefault();
    addCustomResource(taskId);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    hideAddResourceForm(taskId);
  }
}

// ===== DAY NAVIGATION =====
function switchDay(day) {
  state.activeDay = day;
  postEvent({ op: 'set', k: 'activeDay', v: day });

  // Update pills
  document.querySelectorAll('.day-pill').forEach(pill => {
    pill.classList.toggle('active', parseInt(pill.dataset.day) === day);
  });

  // Update panels
  document.querySelectorAll('.day-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  const target = document.getElementById('panel-' + day);
  if (target) {
    target.classList.add('active');
    // Expand all blocks in active panel
    target.querySelectorAll('.block-card').forEach(card => card.classList.add('expanded'));
  }
  setTimeout(updateCommentGutter, 50);
}

// ===== TIMER =====
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  document.getElementById('timerStart').disabled = true;
  document.getElementById('timerPause').disabled = false;
  document.getElementById('timerStop').disabled = false;
  document.getElementById('timerPulse').classList.add('active');

  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
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
  const day = parseInt(document.getElementById('timerDay').value);
  if (!state.timeLog[day]) state.timeLog[day] = 0;
  state.timeLog[day] += timerSeconds;
  postEvent({ op: 'time', day: day, v: timerSeconds });

  showToast(`⏱ Logged ${formatTime(timerSeconds)} to Day ${day}`);

  timerSeconds = 0;
  updateTimerDisplay();
  document.getElementById('timerStop').disabled = true;

  // Re-render to update time logged
  renderPanels();
  updateStats();
}

function updateTimerDisplay() {
  const h = Math.floor(timerSeconds / 3600);
  const m = Math.floor((timerSeconds % 3600) / 60);
  const s = timerSeconds % 60;
  document.getElementById('timerDisplay').textContent =
    String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function formatTime(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ===== JOURNAL =====
let currentJournalDay = state.journalDay || 1;

function switchJournalDay(day) {
  // Save current before switching
  saveJournalEntry();

  currentJournalDay = day;
  state.journalDay = day;
  postEvent({ op: 'set', k: 'journalDay', v: day });

  document.querySelectorAll('.journal-tab').forEach(tab => {
    tab.classList.toggle('active', parseInt(tab.dataset.jday) === day);
  });

  document.getElementById('journalText').value = state.journal[day] || '';
  updateJournalTabDots();
}

function saveJournalEntry() {
  const text = document.getElementById('journalText').value.trim();
  if (text) {
    state.journal[currentJournalDay] = text;
  } else {
    delete state.journal[currentJournalDay];
  }
  postEvent({ op: 'journal', day: currentJournalDay, v: text });
  updateJournalTabDots();
}

function updateJournalTabDots() {
  document.querySelectorAll('.journal-tab').forEach(tab => {
    const d = parseInt(tab.dataset.jday);
    if (state.journal[d] && state.journal[d].trim()) {
      tab.classList.add('has-content');
    } else {
      tab.classList.remove('has-content');
    }
  });
}

// ===== CONFETTI =====
function fireConfetti() {
  const colors = ['#F5C518', '#e6b800', '#d4a017', '#1a1a1a', '#333', '#F5C518', '#FFD700'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top = '-10px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 0.8) + 's';
    piece.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
    const size = Math.random() * 6 + 4;
    piece.style.width = size + 'px';
    piece.style.height = size + 'px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }
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
  if (!confirm('🗑️ Reset ALL progress? This will clear all checkboxes, time logs, and journal entries. This cannot be undone.')) return;
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (res.ok) {
      state = await res.json();
    }
  } catch (e) {
    state = { ...DEFAULT_STATE };
  }
  renderPanels();
  updateStats();
  switchDay(1);
  switchJournalDay(1);
  showToast('♻️ All progress reset');
}

// ===== COMMENTS (always-visible right gutter) =====
let activeComposeTaskId = null;
let _gutterRaf = null;
let _gutterInitialized = false;

function initCommentGutter() {
  if (_gutterInitialized) return;
  _gutterInitialized = true;

  // Close compose on click outside
  document.addEventListener('click', e => {
    if (activeComposeTaskId &&
        !e.target.closest('.comment-card') &&
        !e.target.closest('.comment-trigger')) {
      closeCompose();
    }
  });

  // Reposition cards on scroll/resize
  const reposition = () => {
    if (_gutterRaf) cancelAnimationFrame(_gutterRaf);
    _gutterRaf = requestAnimationFrame(() => positionCommentCards());
  };
  window.addEventListener('scroll', reposition, { passive: true });
  window.addEventListener('resize', reposition, { passive: true });
}

function updateCommentGutter() {
  initCommentGutter();

  // Remove old cards
  document.querySelectorAll('.comment-card').forEach(el => el.remove());

  const allComments = state.comments || {};
  const taskIds = new Set(Object.keys(allComments));
  if (activeComposeTaskId) taskIds.add(activeComposeTaskId);

  const cards = [];
  taskIds.forEach(taskId => {
    const taskEl = document.getElementById('task-' + taskId);
    if (!taskEl || taskEl.offsetParent === null) return;
    const comments = allComments[taskId] || [];
    if (comments.length === 0 && taskId !== activeComposeTaskId) return;
    cards.push({ taskId, comments, isComposing: taskId === activeComposeTaskId });
  });

  cards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'comment-card' + (card.isComposing ? ' composing' : '');
    el.dataset.taskId = card.taskId;

    let itemsHtml = card.comments.map((c, i) => `
      <div class="comment-item">
        <p class="comment-text">${escapeHtml(c.text)}</p>
        <div class="comment-meta">
          <span class="comment-time">${formatCommentTime(c.t)}</span>
          <button class="comment-delete" onclick="event.stopPropagation(); removeComment('${card.taskId}', ${i})">Delete</button>
        </div>
      </div>
    `).join('');

    const composeHtml = card.isComposing ? `
      <div class="comment-compose">
        <textarea class="comment-input" id="commentInput" placeholder="Reply..." rows="1"
          onclick="event.stopPropagation()"
          onkeydown="handleCommentKeydown(event, '${card.taskId}')"></textarea>
        <div class="comment-compose-actions">
          <button class="comment-submit" onclick="event.stopPropagation(); submitComment('${card.taskId}')">Comment</button>
          ${card.comments.length > 0 ? `<button class="comment-resolve" onclick="event.stopPropagation(); resolveComments('${card.taskId}')">Resolve</button>` : ''}
        </div>
      </div>
    ` : '';

    el.innerHTML = (itemsHtml ? '<div class="comment-list">' + itemsHtml + '</div>' : '') + composeHtml;

    // Prevent card click from closing compose
    el.addEventListener('click', e => e.stopPropagation());

    document.body.appendChild(el);
  });

  positionCommentCards();

  // Focus compose input
  if (activeComposeTaskId) {
    setTimeout(() => {
      const input = document.getElementById('commentInput');
      if (input && document.activeElement.tagName !== 'TEXTAREA') input.focus();
    }, 30);
  }
}

function positionCommentCards() {
  const appEl = document.querySelector('.app');
  if (!appEl) return;
  const appRect = appEl.getBoundingClientRect();
  const cards = Array.from(document.querySelectorAll('.comment-card'));

  // Position each card at task Y, right of app
  const positioned = [];
  cards.forEach(card => {
    const taskEl = document.getElementById('task-' + card.dataset.taskId);
    if (!taskEl || taskEl.offsetParent === null) {
      card.style.display = 'none';
      return;
    }

    const taskRect = taskEl.getBoundingClientRect();
    // Hide if task is offscreen
    if (taskRect.bottom < 0 || taskRect.top > window.innerHeight + 100) {
      card.style.opacity = '0';
      card.style.pointerEvents = 'none';
      return;
    }

    card.style.display = 'flex';
    card.style.opacity = '1';
    card.style.pointerEvents = 'auto';
    card.style.left = (appRect.right + 16) + 'px';
    card._desiredTop = taskRect.top;
    positioned.push(card);
  });

  // Sort by desired top, then prevent overlap
  positioned.sort((a, b) => a._desiredTop - b._desiredTop);
  let lastBottom = 0;
  positioned.forEach(card => {
    let top = card._desiredTop;
    if (top < lastBottom + 6) top = lastBottom + 6;
    // Keep in viewport
    const h = card.offsetHeight || 80;
    if (top + h > window.innerHeight - 10) top = window.innerHeight - h - 10;
    if (top < 10) top = 10;
    card.style.top = top + 'px';
    lastBottom = top + h;
  });
}

function toggleCommentCard(taskId) {
  if (activeComposeTaskId === taskId) {
    closeCompose();
  } else {
    openCompose(taskId);
  }
}

function openCompose(taskId) {
  document.querySelectorAll('.task-item.commenting').forEach(el => el.classList.remove('commenting'));
  activeComposeTaskId = taskId;
  const taskEl = document.getElementById('task-' + taskId);
  if (taskEl) taskEl.classList.add('commenting');
  updateCommentGutter();
}

function closeCompose() {
  document.querySelectorAll('.task-item.commenting').forEach(el => el.classList.remove('commenting'));
  activeComposeTaskId = null;
  updateCommentGutter();
}

function formatCommentTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function handleCommentKeydown(e, taskId) {
  e.stopPropagation();
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    submitComment(taskId);
  } else if (e.key === 'Escape') {
    closeCompose();
  }
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

  updateCommentGutter();
  updateCommentIndicators();
  showToast('💬 Comment added');
}

function removeComment(taskId, idx) {
  if (!state.comments || !state.comments[taskId]) return;
  postEvent({ op: 'comment_rm', id: taskId, idx: idx });
  state.comments[taskId].splice(idx, 1);
  if (state.comments[taskId].length === 0) delete state.comments[taskId];

  updateCommentGutter();
  updateCommentIndicators();
}

function resolveComments(taskId) {
  if (!state.comments || !state.comments[taskId]) return;
  const count = state.comments[taskId].length;
  for (let i = count - 1; i >= 0; i--) {
    postEvent({ op: 'comment_rm', id: taskId, idx: i });
  }
  delete state.comments[taskId];

  closeCompose();
  updateCommentIndicators();
  showToast('✅ Resolved');
}

function updateCommentIndicators() {
  document.querySelectorAll('.comment-trigger').forEach(trigger => {
    const taskId = trigger.dataset.taskId;
    const count = (state.comments && state.comments[taskId] && state.comments[taskId].length) || 0;
    const badge = trigger.querySelector('.comment-count');
    if (count > 0) {
      trigger.classList.add('has-comments');
      if (badge) badge.textContent = count;
    } else {
      trigger.classList.remove('has-comments');
      if (badge) badge.textContent = '';
    }
  });
}

// ===== INIT =====
async function init() {
  // Load persisted state from SQLite before rendering anything
  await loadStateFromServer();
  currentJournalDay = state.journalDay || 1;

  createParticles();
  renderPanels();
  updateStats();

  // Day pills
  document.querySelectorAll('.day-pill').forEach(pill => {
    pill.addEventListener('click', () => switchDay(parseInt(pill.dataset.day)));
  });
  switchDay(state.activeDay);

  // Timer
  document.getElementById('timerStart').addEventListener('click', startTimer);
  document.getElementById('timerPause').addEventListener('click', pauseTimer);
  document.getElementById('timerStop').addEventListener('click', stopTimer);

  // Sync timer dropdown with active day
  document.getElementById('timerDay').value = state.activeDay;

  // Journal
  document.querySelectorAll('.journal-tab').forEach(tab => {
    tab.addEventListener('click', () => switchJournalDay(parseInt(tab.dataset.jday)));
  });
  document.getElementById('journalText').value = state.journal[currentJournalDay] || '';
  updateJournalTabDots();

  document.getElementById('journalSave').addEventListener('click', function() {
    saveJournalEntry();
    this.classList.add('saved');
    this.textContent = '✓ Saved';
    setTimeout(() => {
      this.classList.remove('saved');
      this.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Note`;
    }, 1500);
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', resetAll);

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Day pill sync with timer dropdown
  document.querySelectorAll('.day-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.getElementById('timerDay').value = parseInt(pill.dataset.day);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
