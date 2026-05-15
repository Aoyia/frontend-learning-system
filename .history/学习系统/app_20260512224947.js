// ============================================================
//  app.js  —  主应用逻辑
// ============================================================

// ---------- IndexedDB 层 ----------
const DB_NAME = 'learnDB';
const DB_VER  = 1;
let db;

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('progress')) {
        d.createObjectStore('progress', { keyPath: 'id' });
      }
      if (!d.objectStoreNames.contains('quizRecord')) {
        d.createObjectStore('quizRecord', { keyPath: 'id', autoIncrement: true });
      }
      if (!d.objectStoreNames.contains('drillStat')) {
        d.createObjectStore('drillStat', { keyPath: 'qid' });
      }
    };
    req.onsuccess  = e => res(e.target.result);
    req.onerror    = e => rej(e.target.error);
  });
}

function dbGet(store, key) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

function dbPut(store, val) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(val);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

function dbGetAll(store) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

// ---------- 状态 ----------
let currentPage   = 'home';    // home | learn | drill
let currentModule = null;      // module id
let currentDocIdx = null;      // doc index within module
let quizState     = null;      // 当前测验状态
let drillState    = null;      // 当前刷题状态
let progressCache = {};        // { docId: true }
let drillStatCache = {};       // { qid: { correct, wrong } }

function isAnswerCorrect(question, selected) {
  if (Array.isArray(question.answer)) {
    return Array.isArray(selected)
      && selected.length === question.answer.length
      && selected.every(i => question.answer.includes(i));
  }
  return question.answer === selected;
}

async function saveDrillStat(question, selected) {
  if (!question || !question._qid) return;
  const qid = question._qid;
  const prev = drillStatCache[qid] || { qid, correct: 0, wrong: 0, total: 0, lastCorrect: false };
  const ok = isAnswerCorrect(question, selected);
  const next = {
    ...prev,
    total: (prev.total || 0) + 1,
    correct: (prev.correct || 0) + (ok ? 1 : 0),
    wrong: (prev.wrong || 0) + (ok ? 0 : 1),
    lastCorrect: ok,
    updatedAt: Date.now(),
  };
  drillStatCache[qid] = next;
  await dbPut('drillStat', next);
}

// ---------- 初始化 ----------
async function init() {
  db = await openDB();

  // 加载进度缓存
  const all = await dbGetAll('progress');
  all.forEach(r => { progressCache[r.id] = r.done; });

  const stats = await dbGetAll('drillStat');
  stats.forEach(r => { drillStatCache[r.qid] = r; });

  showPage('home');
}

// ---------- 页面路由 ----------
function showPage(page, opts = {}) {
  currentPage = page;
  document.querySelectorAll('.nav-tab').forEach((t, i) => {
    const pages = ['home', 'learn', 'drill'];
    t.classList.toggle('active', pages[i] === page);
  });

  const sidebar = document.getElementById('sidebar');

  if (page === 'home') {
    sidebar.style.display = 'none';
    renderHome();
  } else if (page === 'learn') {
    sidebar.style.display = '';
    if (opts.moduleId) {
      currentModule = opts.moduleId;
      currentDocIdx = opts.docIdx || 0;
    }
    if (!currentModule) {
      // 没有选模块，直接显示学习模块列表
      sidebar.style.display = 'none';
      renderLearnModuleSelect();
    } else {
      renderSidebar();
      renderArticle(currentModule, currentDocIdx);
    }
  } else if (page === 'drill') {
    sidebar.style.display = 'none';
    renderDrillModuleSelect();
  }
}

// ---------- 首页 ----------
function renderHome() {
  const modules = CONTENT.modules;
  const cards = modules.map(m => {
    const total = m.docs.length;
    const done  = m.docs.filter((_, i) => progressCache[`${m.id}__${i}`]).length;
    const pct   = total ? Math.round(done / total * 100) : 0;
    return `
      <div class="module-card" onclick="showPage('learn',{moduleId:'${m.id}',docIdx:0})">
        <div class="module-card-icon">${m.icon}</div>
        <div class="module-card-title">${m.name}</div>
        <div class="module-card-desc">${m.desc}</div>
        <div class="module-card-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="progress-text">${done}/${total}</div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="home">
      <div class="home-hero">
        <h1>🚀 前端工程知识学习系统</h1>
        <p>系统性学习 CI/CD、DevOps、Jenkins 等核心知识，学完即测，模块刷题</p>
      </div>
      <div class="module-cards">${cards}</div>
    </div>`;
}

// ---------- 学习模块选择页 ----------
function renderLearnModuleSelect() {
  const cards = CONTENT.modules.map(m => {
    const total = m.docs.length;
    const done  = m.docs.filter((_, i) => progressCache[`${m.id}__${i}`]).length;
    return `
      <div class="module-select-card" onclick="showPage('learn',{moduleId:'${m.id}',docIdx:0})">
        <div class="icon">${m.icon}</div>
        <div class="name">${m.name}</div>
        <div class="count">${total} 篇 · ${done} 已读</div>
      </div>`;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="module-select-page">
      <h2>选择学习模块</h2>
      <p>每个模块包含多篇连续性文档，学完每篇后有随堂作业</p>
      <div class="module-select-cards">${cards}</div>
    </div>`;
}

// ---------- 侧边栏 ----------
function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  const modules = CONTENT.modules;

  sidebar.innerHTML = modules.map(m => {
    const isOpen = m.id === currentModule;
    const items  = m.docs.map((doc, i) => {
      const done   = progressCache[`${m.id}__${i}`];
      const active = m.id === currentModule && i === currentDocIdx;
      return `
        <div class="sidebar-item ${done ? 'done' : ''} ${active ? 'active' : ''}"
             onclick="navToDoc('${m.id}', ${i})">
          <span class="dot"></span>
          <span>${doc.title}</span>
          <span class="item-idx">${i + 1}</span>
        </div>`;
    }).join('');

    return `
      <div class="sidebar-module">
        <div class="sidebar-module-header ${isOpen ? 'open' : ''}"
             onclick="toggleSidebarModule(this)">
          <span>${m.icon}</span> ${m.name}
          <span class="chevron">▶</span>
        </div>
        <div class="sidebar-module-list ${isOpen ? 'open' : ''}">${items}</div>
      </div>`;
  }).join('');
}

function toggleSidebarModule(el) {
  el.classList.toggle('open');
  el.nextElementSibling.classList.toggle('open');
}

function navToDoc(moduleId, docIdx) {
  currentModule = moduleId;
  currentDocIdx = docIdx;
  quizState = null;
  renderSidebar();
  renderArticle(moduleId, docIdx);
}

// ---------- 文章页 ----------
function renderArticle(moduleId, docIdx) {
  const m   = CONTENT.modules.find(x => x.id === moduleId);
  if (!m) return;
  const doc = m.docs[docIdx];
  if (!doc) return;

  const isDone = progressCache[`${moduleId}__${docIdx}`];
  const prev   = docIdx > 0 ? m.docs[docIdx - 1] : null;
  const next   = docIdx < m.docs.length - 1 ? m.docs[docIdx + 1] : null;

  const htmlContent = marked.parse(doc.content);

  document.getElementById('content').innerHTML = `
    <div class="article-wrap">
      <div class="article-header">
        <div class="article-breadcrumb">
          <span onclick="showPage('home')">首页</span> /
          <span onclick="showPage('learn',{moduleId:'${moduleId}',docIdx:0})">${m.name}</span> /
          ${doc.title}
        </div>
        <div class="article-title">${doc.title}</div>
        <div class="article-meta">
          <span class="article-tag accent">${m.name}</span>
          <span class="article-tag">${docIdx + 1} / ${m.docs.length}</span>
          ${doc.difficulty ? `<span class="badge badge-${doc.difficulty === '入门' ? 'easy' : doc.difficulty === '进阶' ? 'medium' : 'hard'}">${doc.difficulty}</span>` : ''}
          ${isDone ? '<span class="badge badge-easy">✓ 已读</span>' : ''}
        </div>
      </div>
      <div class="md-body" id="md-body">${htmlContent}</div>

      ${isDone ? '' : `
        <div class="done-banner" id="done-banner">
          <div class="done-banner-text">📖 读完了吗？标记为已读，并做随堂作业</div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-outline" onclick="markDone('${moduleId}',${docIdx}, false)">仅标记已读</button>
            <button class="btn btn-primary" onclick="markDone('${moduleId}',${docIdx}, true)">已读 + 开始作业</button>
          </div>
        </div>
      `}

      ${isDone ? `
        <div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="startDocQuiz('${moduleId}',${docIdx})">做随堂作业</button>
          <button class="btn btn-outline" onclick="showPage('drill')">去模块刷题</button>
        </div>
      ` : ''}

      <div class="article-nav">
        ${prev ? `<button class="article-nav-btn" onclick="navToDoc('${moduleId}',${docIdx-1})">
            <div class="label">← 上一篇</div>
            <div class="title">${prev.title}</div>
          </button>` : '<div></div>'}
        ${next ? `<button class="article-nav-btn right" onclick="navToDoc('${moduleId}',${docIdx+1})">
            <div class="label">下一篇 →</div>
            <div class="title">${next.title}</div>
          </button>` : '<div></div>'}
      </div>
    </div>`;

  // 代码高亮
  document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
}

async function markDone(moduleId, docIdx, startQuiz) {
  const key = `${moduleId}__${docIdx}`;
  progressCache[key] = true;
  await dbPut('progress', { id: key, done: true });
  if (startQuiz) {
    startDocQuiz(moduleId, docIdx);
  } else {
    renderSidebar();
    renderArticle(moduleId, docIdx);
  }
}

// ---------- 随堂测验 ----------
function startDocQuiz(moduleId, docIdx) {
  const m   = CONTENT.modules.find(x => x.id === moduleId);
  const doc = m.docs[docIdx];
  if (!doc.quiz || doc.quiz.length === 0) {
    alert('该篇暂无题目');
    return;
  }
  quizState = {
    type: 'doc',
    moduleId,
    docIdx,
    questions: shuffle([...doc.quiz]),
    current: 0,
    answers: [],
    score: 0,
  };
  renderQuiz();
}

function renderQuiz() {
  const s = quizState;
  if (!s) return;

  const q = s.questions[s.current];
  const answered = s.answers[s.current];
  const total = s.questions.length;

  document.getElementById('sidebar').style.display = 'none';

  document.getElementById('content').innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-header">
        <h2>${s.type === 'doc' ? '📝 随堂作业' : '🎯 模块测验'}</h2>
        <p>第 ${s.current + 1} / ${total} 题</p>
        <div class="quiz-progress-bar">
          <div class="progress-fill" style="width:${(s.current/total*100).toFixed(0)}%"></div>
        </div>
      </div>
      ${renderQuestion(q, answered, s.current)}
      <div class="quiz-actions">
        ${answered !== undefined ? `
          ${s.current < total - 1
            ? `<button class="btn btn-primary" onclick="nextQuestion()">下一题 →</button>`
            : `<button class="btn btn-primary" onclick="showQuizResult()">查看结果</button>`}
        ` : ''}
      </div>
    </div>`;
}

function renderQuestion(q, answered, idx) {
  const keys = q.type === 'judgment' ? ['对', '错'] : ['A','B','C','D','E','F'].slice(0, q.options.length);

  const opts = q.options.map((opt, i) => {
    let cls = '';
    if (answered !== undefined) {
      const isCorrect = Array.isArray(q.answer) ? q.answer.includes(i) : q.answer === i;
      const isSelected = Array.isArray(answered) ? answered.includes(i) : answered === i;
      if (isCorrect) cls = 'correct';
      else if (isSelected) cls = 'wrong';
      cls += ' disabled';
    } else {
      const isSelected = Array.isArray(answered) ? answered?.includes(i) : answered === i;
      if (isSelected) cls = 'selected';
    }
    const keyLabel = q.type === 'judgment' ? (i === 0 ? '✓' : '✗') : keys[i];
    return `
      <div class="quiz-option ${cls}" onclick="selectOption(${idx}, ${i})">
        <span class="opt-key">${keyLabel}</span>
        <span>${opt}</span>
      </div>`;
  }).join('');

  const explainHtml = answered !== undefined && q.explain
    ? `<div class="quiz-explain show">💡 ${q.explain}</div>`
    : `<div class="quiz-explain"></div>`;

  const typeLabel = q.type === 'single' ? '单选' : q.type === 'multiple' ? '多选' : '判断';

  return `
    <div class="quiz-question">
      <div class="quiz-question-num">第 ${idx + 1} 题 · ${typeLabel}</div>
      <div class="quiz-question-text">${q.question}</div>
      <div class="quiz-options">${opts}</div>
      ${explainHtml}
    </div>`;
}

function selectOption(qIdx, optIdx) {
  const s = quizState;
  const q = s.questions[qIdx];
  if (s.answers[qIdx] !== undefined) return; // 已答

  if (q.type === 'multiple') {
    // 多选：先收集，再提交（简化：点两次不同选项，按钮确认）
    if (!s._multiTemp) s._multiTemp = [];
    const t = s._multiTemp;
    const pos = t.indexOf(optIdx);
    if (pos === -1) t.push(optIdx); else t.splice(pos, 1);
    // 更新 UI 预选状态
    document.querySelectorAll('.quiz-option').forEach((el, i) => {
      el.classList.toggle('selected', t.includes(i));
    });
    // 添加确认按钮
    let confirmBtn = document.getElementById('multi-confirm');
    if (!confirmBtn) {
      const actions = document.querySelector('.quiz-actions');
      const btn = document.createElement('button');
      btn.id = 'multi-confirm';
      btn.className = 'btn btn-primary';
      btn.textContent = '确认选择';
      btn.onclick = () => submitMulti(qIdx);
      actions.prepend(btn);
    }
  } else {
    s.answers[qIdx] = optIdx;
    // 判断对错
    const correct = q.answer === optIdx;
    if (correct) s.score++;
    if (s.type === 'drill') {
      saveDrillStat(q, optIdx);
    }
    renderQuiz();
  }
}

function submitMulti(qIdx) {
  const s = quizState;
  const q = s.questions[qIdx];
  const sel = s._multiTemp || [];
  s.answers[qIdx] = sel;
  s._multiTemp = null;
  // 判断对错（完全一致）
  const correct = Array.isArray(q.answer) &&
    sel.length === q.answer.length &&
    sel.every(i => q.answer.includes(i));
  if (correct) s.score++;
  if (s.type === 'drill') {
    saveDrillStat(q, sel);
  }
  renderQuiz();
}

function nextQuestion() {
  quizState.current++;
  quizState._multiTemp = null;
  renderQuiz();
}

function showQuizResult() {
  const s = quizState;
  const total = s.questions.length;
  const pct   = Math.round(s.score / total * 100);
  const emoji = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : pct >= 50 ? '🤔' : '😅';
  const msg   = pct >= 90 ? '优秀！掌握得非常扎实' : pct >= 70 ? '不错！继续加油' : pct >= 50 ? '还需要再复习一下' : '建议重新阅读本篇内容';

  // 保存记录
  dbPut('quizRecord', {
    moduleId: s.moduleId,
    docIdx: s.docIdx,
    score: s.score,
    total,
    pct,
    time: Date.now(),
  });

  document.getElementById('sidebar').style.display = '';

  document.getElementById('content').innerHTML = `
    <div class="quiz-wrap">
      <div class="quiz-result">
        <div class="score-circle">
          <div class="score-num">${pct}%</div>
          <div class="score-label">${s.score}/${total}</div>
        </div>
        <h3>${emoji} ${msg}</h3>
        <p>共 ${total} 题，答对 ${s.score} 题</p>
        <div class="actions">
          ${s.type === 'doc' && s.moduleId ? `
            <button class="btn btn-outline" onclick="startDocQuiz('${s.moduleId}',${s.docIdx})">再做一次</button>
            <button class="btn btn-primary" onclick="navToDoc('${s.moduleId}',${s.docIdx + 1 < CONTENT.modules.find(x=>x.id===s.moduleId).docs.length ? s.docIdx+1 : s.docIdx})">
              ${s.docIdx + 1 < CONTENT.modules.find(x=>x.id===s.moduleId).docs.length ? '下一篇' : '返回模块'}
            </button>
          ` : `
            <button class="btn btn-outline" onclick="renderDrillModuleSelect()">换模块</button>
            <button class="btn btn-primary" onclick="startDrill('${s.moduleId}')">再刷一组</button>
          `}
        </div>
      </div>
    </div>`;
}

// ---------- 刷题 ----------
function renderDrillModuleSelect() {
  document.getElementById('sidebar').style.display = 'none';
  currentPage = 'drill';
  document.querySelectorAll('.nav-tab').forEach((t, i) => {
    t.classList.toggle('active', i === 2);
  });

  const cards = CONTENT.modules.map(m => {
    const total = m.docs.reduce((n, d) => n + (d.quiz ? d.quiz.length : 0), 0);
    // 统计刷题进度与最近正确率
    const allQids = [];
    m.docs.forEach((d, di) => (d.quiz || []).forEach((q, qi) => allQids.push(`${m.id}__${di}__${qi}`)));
    const done    = allQids.filter(id => drillStatCache[id]).length;
    const latestCorrect = allQids.filter(id => drillStatCache[id]?.lastCorrect).length;
    const latestPct = done ? Math.round((latestCorrect / done) * 100) : 0;
    return `
      <div class="module-select-card" onclick="startDrill('${m.id}')">
        <div class="icon">${m.icon}</div>
        <div class="name">${m.name}</div>
        <div class="count">${total} 题 · 已练 ${done} · 最近正确率 ${latestPct}%</div>
      </div>`;
  }).join('');

  document.getElementById('content').innerHTML = `
    <div class="module-select-page">
      <h2>🎯 模块刷题</h2>
      <p>不局限于单篇，对整个模块题库进行随机练习</p>
      <div class="module-select-cards">${cards}</div>
    </div>`;
}

function startDrill(moduleId) {
  const m = CONTENT.modules.find(x => x.id === moduleId);
  if (!m) return;

  // 收集模块内所有题目
  const allQ = [];
  m.docs.forEach((doc, di) => {
    (doc.quiz || []).forEach((q, qi) => {
      allQ.push({ ...q, _qid: `${moduleId}__${di}__${qi}` });
    });
  });

  if (allQ.length === 0) {
    alert('该模块暂无题目');
    return;
  }

  drillState = {
    moduleId,
    questions: shuffle(allQ),
    current: 0,
    answers: [],
    score: 0,
  };

  // 复用 quizState 渲染
  quizState = {
    type: 'drill',
    moduleId,
    questions: drillState.questions,
    current: 0,
    answers: [],
    score: 0,
  };

  renderQuiz();
}

// ---------- 工具函数 ----------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- 启动 ----------
init();
