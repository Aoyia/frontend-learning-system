import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import hljs from 'highlight.js';
import { LEARNING_CONTENT } from '../data/learning-content.js';

// 子组件导入
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import ModuleSelect from './components/ModuleSelect';
import Article from './components/Article';
import DrillSelect from './components/DrillSelect';
import WrongBookPage from './components/WrongBookPage';
import QuizPage from './components/QuizPage';
import QuizResult from './components/QuizResult';
import AnswerCard from './components/AnswerCard';

// 逻辑与数据库工具导入
import { openDB, dbGetAll, dbPut, dbDelete } from './utils/db';
import {
  isAnswerCorrect,
  getDocQuestions,
  getDrillQuestions,
  getQuestionByQid,
  createQuizState,
  DEFAULT_DRILL_LIMIT,
  QUICK_DRILL_LIMIT
} from './utils/quiz';

const PAGES = ['home', 'learn', 'drill', 'wrongbook'];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem('learn-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });
  const [immersiveMode, setImmersiveMode] = useState(false);
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
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const toastTimer = useRef(null);
  const toolbarHideTimer = useRef(null);
  const contentRef = useRef(null);

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
    if (page !== 'quiz' || quizState) return;

    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'quiz') return;
    const searchParams = new URLSearchParams(location.search);

    const [, type, moduleId, docIdxText] = parts;
    const module = LEARNING_CONTENT.modules.find(m => m.id === moduleId);
    let docIdx = null;
    let questions = [];
    let fallback = '/';

    if (type === 'doc') {
      fallback = module ? `/learn/${moduleId}/0` : '/learn';
      docIdx = Number(docIdxText);
      if (!module || !Number.isInteger(docIdx) || docIdx < 0 || docIdx >= module.docs.length) {
        navigate(fallback, { replace: true });
        return;
      }
      questions = getDocQuestions(moduleId, docIdx);
    } else if (type === 'drill') {
      fallback = '/drill';
      if (!module) {
        navigate(fallback, { replace: true });
        return;
      }
      const limitParam = searchParams.get('limit');
      const limit = limitParam === 'all' ? null : Number(limitParam) || DEFAULT_DRILL_LIMIT;
      questions = getDrillQuestions(moduleId, drillStatCache, limit);
    } else if (type === 'wrongbook') {
      fallback = '/wrongbook';
      if (!db) return;
      const targetModuleId = moduleId === 'all' ? null : moduleId;
      const records = Object.values(wrongBookCache)
        .filter(record => !targetModuleId || record.moduleId === targetModuleId)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      questions = records.map(record => getQuestionByQid(record.qid)).filter(Boolean);
    } else {
      navigate('/', { replace: true });
      return;
    }

    if (!questions.length) {
      navigate(fallback, { replace: true });
      return;
    }

    setCurrentModuleId(moduleId);
    setQuizState(createQuizState(type, moduleId, docIdx, questions));
    setAnswerCardCollapsed(false);
    setMobileAnswerCardOpen(false);
  }, [db, drillStatCache, location.pathname, location.search, navigate, page, quizState, wrongBookCache]);

  useEffect(() => {
    if (page === 'result' && !quizState) {
      navigate('/', { replace: true });
    }
  }, [navigate, page, quizState]);

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
    contentRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    document.querySelectorAll('pre code:not(.language-mermaid)').forEach(el => hljs.highlightElement(el));

    let cancelled = false;

    (async () => {
      const hasMermaidCode = document.querySelector('.md-body pre code.language-mermaid')
        || document.querySelector('.md-body .mermaid');
      if (!hasMermaidCode) return;

      const { default: mermaid } = await import('mermaid');
      if (cancelled) return;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: theme === 'light' ? 'default' : 'dark',
      });

      document.querySelectorAll('.md-body').forEach(body => {
        body.querySelectorAll('pre code.language-mermaid').forEach(codeEl => {
          const source = codeEl.textContent || '';
          const wrapper = document.createElement('div');
          wrapper.className = 'mermaid';
          wrapper.setAttribute('data-mermaid-source', source);
          wrapper.textContent = source;
          const pre = codeEl.closest('pre');
          if (pre) pre.replaceWith(wrapper);
        });

        body.querySelectorAll('.mermaid[data-mermaid-source]').forEach(el => {
          const source = el.getAttribute('data-mermaid-source') || '';
          el.textContent = source;
          el.removeAttribute('data-processed');
        });
      });

      const nodes = Array.from(document.querySelectorAll('.md-body .mermaid'));
      if (nodes.length) {
        mermaid.run({ nodes }).catch(() => {
          // Mermaid 语法错误时保留原始文本，避免页面崩溃。
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, currentModuleId, currentDocIdx, quizState?.currentPageIdx, quizState?.submittedPages, theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('learn-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.immersive = immersiveMode ? 'true' : '';
    if (!immersiveMode) {
      clearTimeout(toolbarHideTimer.current);
      setToolbarVisible(true);
      return;
    }
    setToolbarVisible(true);
    toolbarHideTimer.current = setTimeout(() => setToolbarVisible(false), 3000);
    const onKey = (e) => { if (e.key === 'Escape') setImmersiveMode(false); };
    const onMouseMove = () => {
      setToolbarVisible(true);
      clearTimeout(toolbarHideTimer.current);
      toolbarHideTimer.current = setTimeout(() => setToolbarVisible(false), 3000);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousemove', onMouseMove);
      clearTimeout(toolbarHideTimer.current);
    };
  }, [immersiveMode]);

  useEffect(() => {
    if (page !== 'learn') setImmersiveMode(false);
  }, [page]);

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
    startQuiz('doc', moduleId, docIdx, questions);
  }

  // 修改了此处以支持 limit 的正确传递和使用
  function startDrill(moduleId, limit = DEFAULT_DRILL_LIMIT) {
    const questions = getDrillQuestions(moduleId, drillStatCache, limit);
    if (!questions.length) {
      showToast('该模块暂无题目');
      return;
    }
    startQuiz('drill', moduleId, null, questions, { limit });
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
    startQuiz('wrongbook', moduleId || 'all', null, questions);
  }

  function startQuiz(type, moduleId, docIdx, questions, options = {}) {
    const query = type === 'drill' ? `?limit=${options.limit || 'all'}` : '';
    navigate(`/quiz/${type}/${moduleId}${docIdx === null || docIdx === undefined ? '' : `/${docIdx}`}${query}`);
    setCurrentModuleId(moduleId);
    setQuizState(createQuizState(type, moduleId, docIdx, questions));
    setAnswerCardCollapsed(false);
    setMobileAnswerCardOpen(false);
  }

  // 移除了 flushSync 或保持局部修改，以便 toggleOption 可以流畅工作
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
      {immersiveMode && (
        <div className={`immersive-toolbar${toolbarVisible ? '' : ' hidden'}`}>
          <span>专注阅读</span>
          <div className="immersive-toolbar-sep" />
          <button className="immersive-toolbar-exit" onClick={() => setImmersiveMode(false)}>
            退出 <kbd>Esc</kbd>
          </button>
        </div>
      )}
      <nav className="nav">
        <div className="nav-logo">⚡ 前端知识库</div>
        <div className="nav-tabs">
          {PAGES.map(name => (
            <button key={name} className={`nav-tab ${activeNavPage === name ? 'active' : ''}`} onClick={() => setRoute(name)}>
              {name === 'home' ? '首页' : name === 'learn' ? '📖 学习' : name === 'drill' ? '🎯 刷题' : '🧩 错题本'}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
            title="切换白天/夜间模式"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
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
        <main className="content" ref={contentRef}>
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
              immersiveMode={immersiveMode}
              onToggleImmersive={() => setImmersiveMode(v => !v)}
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

export default App;
