import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { LEARNING_CONTENT } from '../data/learning-content.js';

const DB_NAME = 'learnDB';
const DB_VER = 2;
const PAGES = ['home', 'learn', 'drill', 'wrongbook'];

function normalizeMarkdown(content) {
  return content
    .replace(/^---\n[\s\S]*?\n---\n?/, '')
    .replace(/==([\s\S]*?)==/g, '<mark>$1</mark>')
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1');
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('progress')) d.createObjectStore('progress', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('quizRecord')) d.createObjectStore('quizRecord', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('drillStat')) d.createObjectStore('drillStat', { keyPath: 'qid' });
      if (!d.objectStoreNames.contains('wrongBook')) d.createObjectStore('wrongBook', { keyPath: 'qid' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

function dbGetAll(db, store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

function dbPut(db, store, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

function dbDelete(db, store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isAnswerCorrect(question, selected) {
  if (Array.isArray(question.answer)) {
    return Array.isArray(selected)
      && selected.length === question.answer.length
      && selected.every(i => question.answer.includes(i));
  }
  return question.answer === selected;
}

function getDifficultyClass(difficulty) {
  if (difficulty === '入门') return 'easy';
  if (difficulty === '进阶') return 'medium';
  return 'hard';
}

function withQuestionSource(module, doc, docIdx, question, quizIdx) {
  return {
    ...question,
    _qid: `${module.id}__${docIdx}__${quizIdx}`,
    _moduleId: module.id,
    _moduleName: module.name,
    _docIdx: docIdx,
    _docTitle: doc.title,
    _quizIdx: quizIdx,
  };
}

function getDocQuestions(moduleId, docIdx) {
  const module = LEARNING_CONTENT.modules.find(m => m.id === moduleId);
  const doc = module?.docs[docIdx];
  if (!module || !doc) return [];
  return (doc.quiz || []).map((q, qi) => withQuestionSource(module, doc, docIdx, q, qi));
}

function getModuleQuestions(moduleId) {
  const module = LEARNING_CONTENT.modules.find(m => m.id === moduleId);
  if (!module) return [];
  return module.docs.flatMap((doc, docIdx) =>
    (doc.quiz || []).map((q, qi) => withQuestionSource(module, doc, docIdx, q, qi))
  );
}

function getQuestionByQid(qid) {
  const [moduleId, docIdxText, quizIdxText] = qid.split('__');
  const docIdx = Number(docIdxText);
  const quizIdx = Number(quizIdxText);
  return getDocQuestions(moduleId, docIdx)[quizIdx] || null;
}

function formatAnswer(question, answer) {
  const toText = idx => {
    if (idx === undefined || idx === null) return '未选择';
    if (question.type === 'judgment') return question.options[idx] || '未选择';
    return `${'ABCDEF'[idx]}. ${question.options[idx] || ''}`;
  };
  return Array.isArray(answer) ? answer.map(toText).join('；') : toText(answer);
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [db, setDb] = useState(null);
  const [progressCache, setProgressCache] = useState({});
  const [drillStatCache, setDrillStatCache] = useState({});
  const [wrongBookCache, setWrongBookCache] = useState({});
  const [page, setPage] = useState('home');
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [currentDocIdx, setCurrentDocIdx] = useState(0);
  const [quizState, setQuizState] = useState(null);
  const [answerCardCollapsed, setAnswerCardCollapsed] = useState(false);
  const [mobileAnswerCardOpen, setMobileAnswerCardOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const currentModule = useMemo(
    () => LEARNING_CONTENT.modules.find(m => m.id === currentModuleId) || null,
    [currentModuleId]
  );

  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) {
      setPage('home');
      setQuizState(null);
      setMobileAnswerCardOpen(false);
      return;
    }
    if (parts[0] === 'learn') {
      setPage('learn');
      setQuizState(null);
      setMobileAnswerCardOpen(false);
      if (parts[1]) {
        const moduleId = parts[1];
        const module = LEARNING_CONTENT.modules.find(m => m.id === moduleId);
        if (!module) {
          navigate('/learn', { replace: true });
          return;
        }
        const docIdx = Number(parts[2] ?? 0);
        setCurrentModuleId(moduleId);
        setCurrentDocIdx(Number.isInteger(docIdx) && docIdx >= 0 && docIdx < module.docs.length ? docIdx : 0);
      } else {
        setCurrentModuleId(null);
      }
      return;
    }
    if (parts[0] === 'drill') {
      setPage('drill');
      setQuizState(null);
      setMobileAnswerCardOpen(false);
      return;
    }
    if (parts[0] === 'wrongbook') {
      setPage('wrongbook');
      setQuizState(null);
      setMobileAnswerCardOpen(false);
      return;
    }
    if (parts[0] === 'quiz') {
      setPage('quiz');
      setMobileAnswerCardOpen(false);
      return;
    }
    if (parts[0] === 'result') {
      setPage('result');
      setMobileAnswerCardOpen(false);
      return;
    }
    navigate('/', { replace: true });
  }, [location.pathname, navigate]);

  useEffect(() => {
    let alive = true;
    openDB().then(async database => {
      if (!alive) return;
      const progress = await dbGetAll(database, 'progress');
      const stats = await dbGetAll(database, 'drillStat');
      const wrongBook = await dbGetAll(database, 'wrongBook');
      if (!alive) return;
      setDb(database);
      setProgressCache(Object.fromEntries(progress.map(r => [r.id, r.done])));
      setDrillStatCache(Object.fromEntries(stats.map(r => [r.qid, r])));
      setWrongBookCache(Object.fromEntries(wrongBook.map(r => [r.qid, r])));
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
  }, [page, currentModuleId, currentDocIdx, quizState?.currentPageIdx, quizState?.submittedPages]);

  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function setRoute(nextPage, opts = {}) {
    if (nextPage === 'home') navigate('/');
    if (nextPage === 'learn') navigate(opts.moduleId ? `/learn/${opts.moduleId}/${opts.docIdx ?? 0}` : '/learn');
    if (nextPage === 'drill') navigate('/drill');
    if (nextPage === 'wrongbook') navigate('/wrongbook');
  }

  function navToDoc(moduleId, docIdx) {
    navigate(`/learn/${moduleId}/${docIdx}`);
  }

  async function markDone(moduleId, docIdx, startQuiz) {
    const key = `${moduleId}__${docIdx}`;
    setProgressCache(prev => ({ ...prev, [key]: true }));
    if (db) await dbPut(db, 'progress', { id: key, done: true });
    if (startQuiz) startDocQuiz(moduleId, docIdx);
  }

  function startDocQuiz(moduleId, docIdx) {
    const questions = getDocQuestions(moduleId, docIdx);
    if (!questions.length) {
      showToast('该篇暂无题目');
      return;
    }
    startQuiz('doc', moduleId, docIdx, shuffle(questions));
  }

  function startDrill(moduleId) {
    const questions = getModuleQuestions(moduleId);
    if (!questions.length) {
      showToast('该模块暂无题目');
      return;
    }
    startQuiz('drill', moduleId, null, shuffle(questions));
  }

  function startWrongBook(moduleId = null) {
    const records = Object.values(wrongBookCache)
      .filter(record => !moduleId || record.moduleId === moduleId)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const questions = records.map(record => getQuestionByQid(record.qid)).filter(Boolean);
    if (!questions.length) {
      showToast(moduleId ? '该模块暂无错题' : '当前没有错题');
      return;
    }
    startQuiz('wrongbook', moduleId || 'all', null, shuffle(questions));
  }

  function startQuiz(type, moduleId, docIdx, questions) {
    window.scrollTo(0, 0);
    navigate(`/quiz/${type}/${moduleId}${docIdx === null || docIdx === undefined ? '' : `/${docIdx}`}`);
    setCurrentModuleId(moduleId);
    setQuizState({
      type,
      moduleId,
      docIdx,
      questions,
      pageSize: 5,
      currentPageIdx: 0,
      selections: {},
      answers: {},
      submittedPages: [],
      score: 0,
    });
    setAnswerCardCollapsed(false);
    setMobileAnswerCardOpen(false);
  }

  function toggleOption(globalIdx, optIdx) {
    setQuizState(prev => {
      const q = prev.questions[globalIdx];
      const selections = { ...prev.selections };
      if (q.type === 'multiple') {
        const arr = Array.isArray(selections[globalIdx]) ? [...selections[globalIdx]] : [];
        const pos = arr.indexOf(optIdx);
        if (pos === -1) arr.push(optIdx);
        else arr.splice(pos, 1);
        if (arr.length) selections[globalIdx] = arr;
        else delete selections[globalIdx];
      } else {
        selections[globalIdx] = optIdx;
      }
      return { ...prev, selections };
    });
  }

  async function saveDrillStat(question, selected) {
    if (!db || !question?._qid) return;
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
    setDrillStatCache(cache => ({ ...cache, [qid]: next }));
    await dbPut(db, 'drillStat', next);
  }

  async function updateWrongBook(question, selected) {
    if (!db || !question?._qid) return;
    const ok = isAnswerCorrect(question, selected);
    if (ok) {
      setWrongBookCache(cache => {
        const next = { ...cache };
        delete next[question._qid];
        return next;
      });
      await dbDelete(db, 'wrongBook', question._qid);
      return;
    }
    const prev = wrongBookCache[question._qid];
    const next = {
      qid: question._qid,
      moduleId: question._moduleId,
      moduleName: question._moduleName,
      docIdx: question._docIdx,
      docTitle: question._docTitle,
      quizIdx: question._quizIdx,
      question: question.question,
      type: question.type,
      userAnswer: selected,
      correctAnswer: question.answer,
      explain: question.explain,
      wrongCount: (prev?.wrongCount || 0) + 1,
      createdAt: prev?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    setWrongBookCache(cache => ({ ...cache, [question._qid]: next }));
    await dbPut(db, 'wrongBook', next);
  }

  function submitPage() {
    const { currentPageIdx, pageSize, questions, type, selections } = quizState;
    const start = currentPageIdx * pageSize;
    const end = Math.min(start + pageSize, questions.length);
    // 先执行异步副作用（必须在纯 setState 外部调用）
    for (let gi = start; gi < end; gi++) {
      const q = questions[gi];
      const selected = selections[gi];
      if (type === 'drill') saveDrillStat(q, selected);
      updateWrongBook(q, selected);
    }
    setQuizState(prev => {
      const answers = { ...prev.answers };
      let score = prev.score;
      for (let gi = start; gi < end; gi++) {
        const q = prev.questions[gi];
        const selected = prev.selections[gi];
        answers[gi] = selected;
        if (isAnswerCorrect(q, selected)) score++;
      }
      return {
        ...prev,
        answers,
        score,
        submittedPages: [...prev.submittedPages, prev.currentPageIdx],
      };
    });
  }

  function nextPage() {
    setQuizState(prev => ({ ...prev, currentPageIdx: prev.currentPageIdx + 1 }));
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function showQuizResult() {
    if (!quizState) return;
    const total = quizState.questions.length;
    const pct = Math.round((quizState.score / total) * 100);
    if (db) {
      await dbPut(db, 'quizRecord', {
        moduleId: quizState.moduleId,
        docIdx: quizState.docIdx,
        score: quizState.score,
        total,
        pct,
        time: Date.now(),
      });
    }
    navigate('/result');
    setMobileAnswerCardOpen(false);
  }

  function jumpToQuestion(globalIdx) {
    flushSync(() => {
      setQuizState(prev => {
        const targetPage = Math.floor(globalIdx / prev.pageSize);
        return { ...prev, currentPageIdx: targetPage };
      });
    });
    document.getElementById(`qq-${globalIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const activeNavPage = page === 'quiz' || page === 'result'
    ? (quizState?.type === 'wrongbook' ? 'wrongbook' : quizState?.type === 'drill' ? 'drill' : 'learn')
    : page;

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      <nav className="nav">
        <div className="nav-logo">⚡ 前端知识库</div>
        <div className="nav-tabs">
          {PAGES.map(name => (
            <button key={name} className={`nav-tab ${activeNavPage === name ? 'active' : ''}`} onClick={() => setRoute(name)}>
              {name === 'home' ? '首页' : name === 'learn' ? '📖 学习' : name === 'drill' ? '🎯 刷题' : '🧩 错题本'}
            </button>
          ))}
        </div>
      </nav>

      <div className="main">
        {page === 'learn' && currentModule && (
          <Sidebar
            currentModuleId={currentModuleId}
            currentDocIdx={currentDocIdx}
            progressCache={progressCache}
            onNavToDoc={navToDoc}
          />
        )}
        <main className="content">
          {page === 'home' && <Home progressCache={progressCache} onOpenModule={(moduleId) => setRoute('learn', { moduleId, docIdx: 0 })} />}
          {page === 'learn' && !currentModule && <ModuleSelect progressCache={progressCache} onOpenModule={(moduleId) => setRoute('learn', { moduleId, docIdx: 0 })} />}
          {page === 'learn' && currentModule && (
            <Article
              module={currentModule}
              docIdx={currentDocIdx}
              progressCache={progressCache}
              onHome={() => setRoute('home')}
              onModuleHome={() => setRoute('learn', { moduleId: currentModule.id, docIdx: 0 })}
              onNavToDoc={navToDoc}
              onMarkDone={markDone}
              onStartQuiz={startDocQuiz}
              onGoDrill={() => setRoute('drill')}
            />
          )}
          {page === 'drill' && <DrillSelect drillStatCache={drillStatCache} onStartDrill={startDrill} />}
          {page === 'wrongbook' && (
            <WrongBookPage
              wrongBookCache={wrongBookCache}
              onStartWrongBook={startWrongBook}
              onReadChapter={navToDoc}
            />
          )}
          {page === 'quiz' && quizState && (
            <QuizPage
              quizState={quizState}
              onToggleOption={toggleOption}
              onSubmitPage={submitPage}
              onNextPage={nextPage}
              onShowResult={showQuizResult}
              onReadChapter={navToDoc}
            />
          )}
          {page === 'result' && quizState && (
            <QuizResult
              quizState={quizState}
              onStartDocQuiz={startDocQuiz}
              onNextDoc={navToDoc}
              onBackModule={() => setRoute('learn', { moduleId: quizState.moduleId, docIdx: 0 })}
              onBackDrill={() => setRoute('drill')}
              onStartDrill={startDrill}
              onBackWrongBook={() => setRoute('wrongbook')}
              onStartWrongBook={startWrongBook}
            />
          )}
        </main>
        {page === 'quiz' && quizState && (
          <AnswerCard
            quizState={quizState}
            collapsed={answerCardCollapsed}
            mobileOpen={mobileAnswerCardOpen}
            onToggle={() => {
              if (window.matchMedia('(max-width: 768px)').matches) setMobileAnswerCardOpen(v => !v);
              else setAnswerCardCollapsed(v => !v);
            }}
            onJumpToQuestion={jumpToQuestion}
          />
        )}
      </div>
    </>
  );
}

function Home({ progressCache, onOpenModule }) {
  return (
    <div className="home">
      <div className="home-hero">
        <h1>🚀 前端工程知识学习系统</h1>
        <p>系统性学习 CI/CD、DevOps、Jenkins 等核心知识，学完即测，模块刷题</p>
      </div>
      <div className="module-cards">
        {LEARNING_CONTENT.modules.map(m => {
          const total = m.docs.length;
          const done = m.docs.filter((_, i) => progressCache[`${m.id}__${i}`]).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div className="module-card" key={m.id} onClick={() => onOpenModule(m.id)}>
              <div className="module-card-icon">{m.icon}</div>
              <div className="module-card-title">{m.name}</div>
              <div className="module-card-desc">{m.desc}</div>
              <div className="module-card-progress">
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div className="progress-text">{done}/{total}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModuleSelect({ progressCache, onOpenModule }) {
  return (
    <div className="module-select-page">
      <h2>选择学习模块</h2>
      <p>每个模块包含多篇连续性文档，学完每篇后有随堂作业</p>
      <div className="module-select-cards">
        {LEARNING_CONTENT.modules.map(m => {
          const total = m.docs.length;
          const done = m.docs.filter((_, i) => progressCache[`${m.id}__${i}`]).length;
          return (
            <div className="module-select-card" key={m.id} onClick={() => onOpenModule(m.id)}>
              <div className="icon">{m.icon}</div>
              <div className="name">{m.name}</div>
              <div className="count">{total} 篇 · {done} 已读</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sidebar({ currentModuleId, currentDocIdx, progressCache, onNavToDoc }) {
  const [openModules, setOpenModules] = useState(() => new Set([currentModuleId]));

  useEffect(() => {
    setOpenModules(prev => new Set([...prev, currentModuleId]));
  }, [currentModuleId]);

  return (
    <aside className="sidebar">
      {LEARNING_CONTENT.modules.map(m => {
        const isOpen = openModules.has(m.id);
        return (
          <div className="sidebar-module" key={m.id}>
            <div
              className={`sidebar-module-header ${isOpen ? 'open' : ''}`}
              onClick={() => setOpenModules(prev => {
                const next = new Set(prev);
                if (next.has(m.id)) next.delete(m.id);
                else next.add(m.id);
                return next;
              })}
            >
              <span>{m.icon}</span> {m.name}
              <span className="chevron">▶</span>
            </div>
            <div className={`sidebar-module-list ${isOpen ? 'open' : ''}`}>
              {m.docs.map((doc, i) => {
                const done = progressCache[`${m.id}__${i}`];
                const active = m.id === currentModuleId && i === currentDocIdx;
                return (
                  <div
                    key={doc.title}
                    className={`sidebar-item ${done ? 'done' : ''} ${active ? 'active' : ''}`}
                    onClick={() => onNavToDoc(m.id, i)}
                  >
                    <span className="dot" />
                    <span>{doc.title}</span>
                    <span className="item-idx">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}

function Article({ module, docIdx, progressCache, onHome, onModuleHome, onNavToDoc, onMarkDone, onStartQuiz, onGoDrill }) {
  const doc = module.docs[docIdx];
  const isDone = progressCache[`${module.id}__${docIdx}`];
  const prev = docIdx > 0 ? module.docs[docIdx - 1] : null;
  const next = docIdx < module.docs.length - 1 ? module.docs[docIdx + 1] : null;
  const html = marked.parse(normalizeMarkdown(doc.content));

  return (
    <div className="article-wrap">
      <div className="article-header">
        <div className="article-breadcrumb">
          <span onClick={onHome}>首页</span> / <span onClick={onModuleHome}>{module.name}</span> / {doc.title}
        </div>
        <div className="article-title">{doc.title}</div>
        <div className="article-meta">
          <span className="article-tag accent">{module.name}</span>
          <span className="article-tag">{docIdx + 1} / {module.docs.length}</span>
          {doc.difficulty && <span className={`badge badge-${getDifficultyClass(doc.difficulty)}`}>{doc.difficulty}</span>}
          {isDone && <span className="badge badge-easy">✓ 已读</span>}
        </div>
      </div>
      <div className="md-body" dangerouslySetInnerHTML={{ __html: html }} />

      {!isDone && (
        <div className="done-banner">
          <div className="done-banner-text">📖 读完了吗？标记为已读，并做随堂作业</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => onMarkDone(module.id, docIdx, false)}>仅标记已读</button>
            <button className="btn btn-primary" onClick={() => onMarkDone(module.id, docIdx, true)}>已读 + 开始作业</button>
          </div>
        </div>
      )}

      {isDone && (
        <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onStartQuiz(module.id, docIdx)}>做随堂作业</button>
          <button className="btn btn-outline" onClick={onGoDrill}>去模块刷题</button>
        </div>
      )}

      <div className="article-nav">
        {prev ? (
          <button className="article-nav-btn" onClick={() => onNavToDoc(module.id, docIdx - 1)}>
            <div className="label">← 上一篇</div>
            <div className="title">{prev.title}</div>
          </button>
        ) : <div />}
        {next ? (
          <button className="article-nav-btn right" onClick={() => onNavToDoc(module.id, docIdx + 1)}>
            <div className="label">下一篇 →</div>
            <div className="title">{next.title}</div>
          </button>
        ) : <div />}
      </div>
    </div>
  );
}

function DrillSelect({ drillStatCache, onStartDrill }) {
  return (
    <div className="module-select-page">
      <h2>🎯 模块刷题</h2>
      <p>不局限于单篇，对整个模块题库进行随机练习</p>
      <div className="module-select-cards">
        {LEARNING_CONTENT.modules.map(m => {
          const total = m.docs.reduce((n, d) => n + (d.quiz ? d.quiz.length : 0), 0);
          const allQids = [];
          m.docs.forEach((d, di) => (d.quiz || []).forEach((_, qi) => allQids.push(`${m.id}__${di}__${qi}`)));
          const done = allQids.filter(id => drillStatCache[id]).length;
          const latestCorrect = allQids.filter(id => drillStatCache[id]?.lastCorrect).length;
          const latestPct = done ? Math.round((latestCorrect / done) * 100) : 0;
          return (
            <div className="module-select-card" key={m.id} onClick={() => onStartDrill(m.id)}>
              <div className="icon">{m.icon}</div>
              <div className="name">{m.name}</div>
              <div className="count">{total} 题 · 已练 {done} · 最近正确率 {latestPct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WrongBookPage({ wrongBookCache, onStartWrongBook, onReadChapter }) {
  const records = Object.values(wrongBookCache).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const total = records.length;
  const moduleStats = LEARNING_CONTENT.modules.map(module => ({
    module,
    count: records.filter(record => record.moduleId === module.id).length,
  }));

  if (!total) {
    return (
      <div className="module-select-page">
        <h2>🧩 错题本</h2>
        <p>错题会在作业和刷题提交后自动收集，答对后自动移出错题本。</p>
        <div className="empty-state">
          <div className="icon">✓</div>
          <p>当前没有错题。可以先去学习或刷题，系统会自动记录需要复习的题目。</p>
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => onStartWrongBook()}>开始错题练习</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-select-page">
      <h2>🧩 错题本</h2>
      <p>当前共 {total} 道错题。优先练错题，答对后自动移出错题本，再回推荐章节补知识点。</p>
      <div className="module-select-cards">
        <div className="module-select-card" onClick={() => onStartWrongBook()}>
          <div className="icon">🔥</div>
          <div className="name">全部错题</div>
          <div className="count">{total} 题 · 综合复盘</div>
        </div>
        {moduleStats.filter(item => item.count > 0).map(({ module, count }) => (
          <div className="module-select-card" key={module.id} onClick={() => onStartWrongBook(module.id)}>
            <div className="icon">{module.icon}</div>
            <div className="name">{module.name}</div>
            <div className="count">{count} 题 · 针对练习</div>
          </div>
        ))}
      </div>
      <div className="wrongbook-list">
        {records.slice(0, 12).map(record => (
          <div className="wrongbook-item" key={record.qid}>
            <div className="wrongbook-item-main">
              <div className="wrongbook-item-title">{record.question}</div>
              <div className="wrongbook-item-meta">
                {record.moduleName} / {record.docTitle} · 错 {record.wrongCount || 1} 次
              </div>
            </div>
            <button className="btn btn-outline" onClick={() => onReadChapter(record.moduleId, record.docIdx)}>复习章节</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizPage({ quizState, onToggleOption, onSubmitPage, onNextPage, onShowResult, onReadChapter }) {
  const totalQ = quizState.questions.length;
  const totalPages = Math.ceil(totalQ / quizState.pageSize);
  const start = quizState.currentPageIdx * quizState.pageSize;
  const end = Math.min(start + quizState.pageSize, totalQ);
  const questions = quizState.questions.slice(start, end);
  const isSubmitted = quizState.submittedPages.includes(quizState.currentPageIdx);
  const isLastPage = quizState.currentPageIdx === totalPages - 1;
  const progress = ((quizState.currentPageIdx + (isSubmitted ? 1 : 0)) / totalPages * 100).toFixed(0);
  const allSelected = isSubmitted || questions.every((_, li) => quizState.selections[start + li] !== undefined);

  return (
    <div className="quiz-wrap">
      <div className="quiz-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <h2>{quizState.type === 'doc' ? '📝 随堂作业' : quizState.type === 'wrongbook' ? '🧩 错题练习' : '🎯 模块刷题'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>第 {quizState.currentPageIdx + 1} / {totalPages} 页 · 共 {totalQ} 题</span>
          </div>
        </div>
        <div className="quiz-progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {questions.map((q, li) => (
        <QuestionBlock
          key={start + li}
          question={q}
          globalIdx={start + li}
          isSubmitted={isSubmitted}
          selected={quizState.selections[start + li]}
          answered={quizState.answers[start + li]}
          onToggleOption={onToggleOption}
          onReadChapter={onReadChapter}
        />
      ))}

      <div className="quiz-actions">
        {!isSubmitted && (
          <button
            className="btn btn-primary"
            disabled={!allSelected}
            style={allSelected ? undefined : { opacity: .5, cursor: 'not-allowed' }}
            onClick={onSubmitPage}
          >
            提交答案
          </button>
        )}
        {isSubmitted && !isLastPage && <button className="btn btn-primary" onClick={onNextPage}>下一页 →</button>}
        {isSubmitted && isLastPage && <button className="btn btn-primary" onClick={onShowResult}>查看最终结果</button>}
      </div>
    </div>
  );
}

function QuestionBlock({ question, globalIdx, isSubmitted, selected, answered, onToggleOption, onReadChapter }) {
  const typeLabel = question.type === 'single' ? '单选' : question.type === 'multiple' ? '多选' : '判断';

  return (
    <div className="quiz-question" id={`qq-${globalIdx}`}>
      <div className="quiz-question-num">第 {globalIdx + 1} 题 · {typeLabel}</div>
      <div className="quiz-question-text">{question.question}</div>
      <div className="quiz-options">
        {question.options.map((opt, i) => {
          const keyLabel = question.type === 'judgment' ? (i === 0 ? '✓' : '✗') : 'ABCDEF'[i];
          let cls = '';
          if (isSubmitted) {
            const isCorrect = Array.isArray(question.answer) ? question.answer.includes(i) : question.answer === i;
            const isSelected = Array.isArray(answered) ? answered.includes(i) : answered === i;
            cls = isCorrect ? 'correct disabled' : (isSelected ? 'wrong disabled' : 'disabled');
          } else {
            const isSel = Array.isArray(selected) ? selected.includes(i) : selected === i;
            cls = isSel && selected !== undefined ? 'selected' : '';
          }
          return (
            <div key={opt} className={`quiz-option ${cls}`} onClick={isSubmitted ? undefined : () => onToggleOption(globalIdx, i)}>
              <span className="opt-key">{keyLabel}</span>
              <span>{opt}</span>
            </div>
          );
        })}
      </div>
      {isSubmitted && (
        <div className="quiz-explain show">
          <div><strong>正确答案：</strong>{formatAnswer(question, question.answer)}</div>
          {answered !== undefined && !isAnswerCorrect(question, answered) && (
            <div><strong>你的答案：</strong>{formatAnswer(question, answered)}</div>
          )}
          {question.explain && <div className="quiz-explain-text">💡 {question.explain}</div>}
          {question._moduleId && (
            <div className="recommended-reading">
              <span>推荐阅读：</span>
              <button className="reading-link" onClick={() => onReadChapter(question._moduleId, question._docIdx)}>
                {question._moduleName} / {question._docTitle}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuizResult({ quizState, onStartDocQuiz, onNextDoc, onBackModule, onBackDrill, onStartDrill, onBackWrongBook, onStartWrongBook }) {
  const total = quizState.questions.length;
  const pct = Math.round((quizState.score / total) * 100);
  const emoji = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : pct >= 50 ? '🤔' : '😅';
  const msg = pct >= 90 ? '优秀！掌握得非常扎实' : pct >= 70 ? '不错！继续加油' : pct >= 50 ? '还需要再复习一下' : '建议重新阅读本篇内容';
  const moduleDocLen = quizState.type === 'doc' ? LEARNING_CONTENT.modules.find(x => x.id === quizState.moduleId).docs.length : 0;
  const hasNextDoc = quizState.type === 'doc' ? quizState.docIdx + 1 < moduleDocLen : false;

  return (
    <div className="quiz-wrap">
      <div className="quiz-result">
        <div className="score-circle">
          <div className="score-num">{pct}%</div>
          <div className="score-label">{quizState.score}/{total}</div>
        </div>
        <h3>{emoji} {msg}</h3>
        <p>共 {total} 题，答对 {quizState.score} 题</p>
        <div className="actions">
          {quizState.type === 'doc' ? (
            <>
              <button className="btn btn-outline" onClick={() => onStartDocQuiz(quizState.moduleId, quizState.docIdx)}>再做一次</button>
              <button
                className="btn btn-primary"
                onClick={() => hasNextDoc ? onNextDoc(quizState.moduleId, quizState.docIdx + 1) : onBackModule()}
              >
                {hasNextDoc ? '下一篇' : '返回模块'}
              </button>
            </>
          ) : quizState.type === 'wrongbook' ? (
            <>
              <button className="btn btn-outline" onClick={onBackWrongBook}>返回错题本</button>
              <button className="btn btn-primary" onClick={() => onStartWrongBook(quizState.moduleId === 'all' ? null : quizState.moduleId)}>继续练错题</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={onBackDrill}>换模块</button>
              <button className="btn btn-primary" onClick={() => onStartDrill(quizState.moduleId)}>再刷一组</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AnswerCard({ quizState, collapsed, mobileOpen, onToggle, onJumpToQuestion }) {
  const totalQ = quizState.questions.length;
  const totalPages = Math.ceil(totalQ / quizState.pageSize);
  let correctCnt = 0;
  let wrongCnt = 0;
  let selectedCnt = 0;
  let unansweredCnt = 0;
  const groups = [];

  for (let p = 0; p < totalPages; p++) {
    const pageStart = p * quizState.pageSize;
    const pageEnd = Math.min(pageStart + quizState.pageSize, totalQ);
    const isSubmittedPage = quizState.submittedPages.includes(p);
    const cells = [];
    for (let gi = pageStart; gi < pageEnd; gi++) {
      const q = quizState.questions[gi];
      let cls;
      let title;
      if (isSubmittedPage) {
        const ok = isAnswerCorrect(q, quizState.answers[gi]);
        cls = ok ? 'correct' : 'wrong';
        title = ok ? '答对' : '答错';
        if (ok) correctCnt++;
        else wrongCnt++;
      } else if (quizState.selections[gi] !== undefined) {
        cls = 'selected-unsub';
        title = '已选未提交';
        selectedCnt++;
      } else {
        cls = 'unanswered';
        title = '未作答';
        unansweredCnt++;
      }
      cells.push({ gi, cls, title });
    }
    groups.push({ pageNo: p + 1, isCurrent: p === quizState.currentPageIdx, cells });
  }

  return (
    <aside
      className={`answer-card-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}
      style={{ display: 'flex' }}
    >
      <div className="ac-collapsed-bar" onClick={onToggle}>
        <span style={{ fontSize: 16 }}>🗒️</span>
        <span className="ac-collapsed-title">答题卡</span>
      </div>
      <div className="ac-inner">
        <div className="ac-header">
          <span className="ac-header-title">🗒️ 答题卡</span>
          <button className="ac-toggle-btn" onClick={onToggle} title="折叠">{collapsed ? '‹' : '›'}</button>
        </div>
        <div className="answer-card-legend">
          <div className="legend-item"><div className="legend-dot unanswered" />未作答</div>
          <div className="legend-item"><div className="legend-dot selected" />已选未交</div>
          <div className="legend-item"><div className="legend-dot correct" />答对</div>
          <div className="legend-item"><div className="legend-dot wrong" />答错</div>
        </div>
        <div className="answer-card-body">
          {groups.map(group => (
            <div key={group.pageNo}>
              <div className="answer-card-page-label">第 {group.pageNo} 页{group.isCurrent ? ' （当前）' : ''}</div>
              <div className="answer-card-grid">
                {group.cells.map(cell => (
                  <div
                    key={cell.gi}
                    className={`ac-cell ${cell.cls}${group.isCurrent ? ' is-current-page' : ''}`}
                    title={`第 ${cell.gi + 1} 题 · ${cell.title}`}
                    onClick={() => onJumpToQuestion(cell.gi)}
                  >
                    {cell.gi + 1}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="answer-card-summary">
          <div className="ac-sum-item"><div className="ac-sum-dot" style={{ background: 'var(--success)' }} />答对 {correctCnt}</div>
          <div className="ac-sum-item"><div className="ac-sum-dot" style={{ background: 'var(--danger)' }} />答错 {wrongCnt}</div>
          <div className="ac-sum-item"><div className="ac-sum-dot" style={{ background: 'var(--accent)' }} />已选未交 {selectedCnt}</div>
          <div className="ac-sum-item"><div className="ac-sum-dot" style={{ background: 'var(--border)' }} />未做 {unansweredCnt}</div>
        </div>
      </div>
    </aside>
  );
}

export default App;
