import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { LEARNING_CONTENT } from '../data/learning-content.js';
import { dbDelete, dbPut } from './storage/learnDb.js';
import { Home } from './pages/Home.jsx';
import { TechBreakerMap } from './pages/TechBreakerMap.jsx';
import { TechBreakerCard } from './pages/TechBreakerCard.jsx';
import { ModuleSelect } from './pages/ModuleSelect.jsx';
import { Article } from './pages/Article.jsx';
import { DrillSelect } from './pages/DrillSelect.jsx';
import { WrongBookPage } from './pages/WrongBookPage.jsx';
import { QuizPage } from './pages/QuizPage.jsx';
import { QuizResult } from './pages/QuizResult.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { AnswerCard } from './components/AnswerCard.jsx';
import {
  DEFAULT_DRILL_LIMIT,
  createQuizState,
  getDocQuestions,
  getDrillQuestions,
  getQuestionByQid,
  isAnswerCorrect,
  orderQuestionsByType,
} from './utils/quiz.js';
import { getBreakerCard, getBreakerQuestions } from './utils/techBreaker.js';
import { useImmersiveController } from './hooks/useImmersiveController.js';
import { useLearningDb } from './hooks/useLearningDb.js';
import { useMarkdownEnhancements } from './hooks/useMarkdownEnhancements.js';
import { useThemeController } from './hooks/useThemeController.js';

const PAGES = ['home', 'breaker', 'learn', 'drill', 'wrongbook'];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeController();
  const { db, progressCache, setProgressCache, drillStatCache, setDrillStatCache, wrongBookCache, setWrongBookCache } = useLearningDb();
  const [page, setPage] = useState('home');
  const { immersiveMode, setImmersiveMode, toolbarVisible } = useImmersiveController(page);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [currentDocIdx, setCurrentDocIdx] = useState(0);
  const [currentBreakerNodeId, setCurrentBreakerNodeId] = useState(null);
  const [quizState, setQuizState] = useState(null);
  const [answerCardCollapsed, setAnswerCardCollapsed] = useState(false);
  const [mobileAnswerCardOpen, setMobileAnswerCardOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
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
    if (parts[0] === 'breaker') {
      setPage('breaker');
      setQuizState(null);
      setMobileAnswerCardOpen(false);
      const nodeId = parts[1] === 'card' ? parts[2] : null;
      if (nodeId && !getBreakerCard(nodeId)) {
        navigate('/breaker', { replace: true });
        return;
      }
      setCurrentBreakerNodeId(nodeId || null);
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
    } else if (type === 'breaker') {
      fallback = `/breaker/card/${moduleId}`;
      if (!getBreakerCard(moduleId)) {
        navigate('/breaker', { replace: true });
        return;
      }
      questions = getBreakerQuestions(moduleId);
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
    setQuizState(createQuizState(type, moduleId, docIdx, orderQuestionsByType(questions)));
    setAnswerCardCollapsed(false);
    setMobileAnswerCardOpen(false);
  }, [db, drillStatCache, location.pathname, location.search, navigate, page, quizState, wrongBookCache]);

  useEffect(() => {
    if (page === 'result' && !quizState) {
      navigate('/', { replace: true });
    }
  }, [navigate, page, quizState]);

  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  useMarkdownEnhancements({
    page,
    currentModuleId,
    currentDocIdx,
    quizPageIdx: quizState?.currentPageIdx,
    submittedPages: quizState?.submittedPages,
    theme,
  });

  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function setRoute(nextPage, opts = {}) {
    if (nextPage === 'home') navigate('/');
    if (nextPage === 'breaker') navigate(opts.nodeId ? `/breaker/card/${opts.nodeId}` : '/breaker');
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

  function startBreakerQuiz(nodeId) {
    const questions = getBreakerQuestions(nodeId);
    if (!questions.length) {
      showToast('这张技术破冰卡片暂无自测题');
      return;
    }
    startQuiz('breaker', nodeId, null, questions);
  }

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
    startQuiz('wrongbook', moduleId || 'all', null, orderQuestionsByType(questions));
  }

  function startQuiz(type, moduleId, docIdx, questions, options = {}) {
    const query = type === 'drill' ? `?limit=${options.limit || 'all'}` : '';
    navigate(`/quiz/${type}/${moduleId}${docIdx === null || docIdx === undefined ? '' : `/${docIdx}`}${query}`);
    setCurrentModuleId(moduleId);
    setQuizState(createQuizState(type, moduleId, docIdx, questions));
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
      if (type !== 'breaker') updateWrongBook(q, selected);
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
    ? (quizState?.type === 'wrongbook' ? 'wrongbook' : quizState?.type === 'drill' ? 'drill' : quizState?.type === 'breaker' ? 'breaker' : 'learn')
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
              {name === 'home' ? '首页' : name === 'breaker' ? '🗺️ 破冰' : name === 'learn' ? '📖 学习' : name === 'drill' ? '🎯 刷题' : '🧩 错题本'}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
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
        <main className={`content ${page === 'breaker' && !currentBreakerNodeId ? 'content-map' : ''}`} ref={contentRef}>
          {page === 'home' && (
            <Home
              progressCache={progressCache}
              onOpenBreaker={() => setRoute('breaker')}
              onOpenModule={(moduleId) => setRoute('learn', { moduleId, docIdx: 0 })}
            />
          )}
          {page === 'breaker' && !currentBreakerNodeId && (
            <TechBreakerMap
              onOpenCard={(nodeId) => setRoute('breaker', { nodeId })}
            />
          )}
          {page === 'breaker' && currentBreakerNodeId && (
            <TechBreakerCard
              nodeId={currentBreakerNodeId}
              onBack={() => setRoute('breaker')}
              onHome={() => setRoute('home')}
              onStartQuiz={startBreakerQuiz}
            />
          )}
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
              onBackBreaker={() => setRoute('breaker', { nodeId: quizState.moduleId })}
              onStartBreakerQuiz={startBreakerQuiz}
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
