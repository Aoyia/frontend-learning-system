import React, { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import { LEARNING_CONTENT } from '../data/learning-content.js';
import { dbDelete, dbPut } from './storage/learnDb.js';
import { Home } from './pages/Home.jsx';
import { CapabilityRoadmap } from './pages/CapabilityRoadmap.jsx';
import { TechBreakerMap } from './pages/TechBreakerMap.jsx';
import { TechBreakerCard } from './pages/TechBreakerCard.jsx';
import { ModuleSelect } from './pages/ModuleSelect.jsx';
import { Article } from './pages/Article.jsx';
import { DrillSelect } from './pages/DrillSelect.jsx';
import { WrongBookPage } from './pages/WrongBookPage.jsx';
import { QuizPage } from './pages/QuizPage.jsx';
import { QuizResult } from './pages/QuizResult.jsx';
import Sidebar from './components/Sidebar.jsx';
import AnswerCard from './components/AnswerCard.jsx';
import { PetWidget } from './components/PetWidget.jsx';
import { PetPanel } from './components/PetPanel.jsx';
import { supabase } from './storage/supabaseClient.js';
import { SyncModal } from './components/SyncModal.jsx';
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
import {
  PET_EVENT_LIMIT,
  applyPetReward,
  getPetStage,
  makePetEvent,
  makeQuizReward,
  makeReadReward,
} from './utils/pet.js';
import { useImmersiveController } from './hooks/useImmersiveController.js';
import { useLearningDb } from './hooks/useLearningDb.js';
import { useMarkdownEnhancements } from './hooks/useMarkdownEnhancements.js';
import { useThemeController } from './hooks/useThemeController.js';

const PAGES = ['home', 'roadmap', 'breaker', 'learn', 'drill', 'wrongbook'];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeController();
  const {
    db,
    progressCache,
    setProgressCache,
    drillStatCache,
    setDrillStatCache,
    wrongBookCache,
    setWrongBookCache,
    petState,
    setPetState,
    petEvents,
    setPetEvents,
  } = useLearningDb();
  const [page, setPage] = useState('home');
  const { immersiveMode, setImmersiveMode, toolbarVisible } = useImmersiveController(page);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [currentDocIdx, setCurrentDocIdx] = useState(0);
  const [currentBreakerNodeId, setCurrentBreakerNodeId] = useState(null);
  const [quizState, setQuizState] = useState(null);
  const [answerCardCollapsed, setAnswerCardCollapsed] = useState(false);
  const [mobileAnswerCardOpen, setMobileAnswerCardOpen] = useState(false);
  const [petPanelOpen, setPetPanelOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const contentRef = useRef(null);
  const logoImgRef = useRef(null);
  const logoSpeedRef = useRef(0);
  const [flyEffects, setFlyEffects] = useState([]);
  const [user, setUser] = useState(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  // 监听 Supabase 登录状态变化
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 同步完成后重载本地 IndexedDB 缓存并刷新视图
  async function reloadLocalCaches() {
    if (!db) return;
    const { dbGetAll } = await import('./storage/learnDb.js');
    const { PET_STATE_ID, createDefaultPetState } = await import('./utils/pet.js');
    
    const progress = await dbGetAll(db, 'progress');
    const stats = await dbGetAll(db, 'drillStat');
    const wrongBook = await dbGetAll(db, 'wrongBook');
    const savedPetState = await dbGetAll(db, 'petState');
    const savedPetEvents = await dbGetAll(db, 'petEvents');
    
    setProgressCache(Object.fromEntries(progress.map(r => [r.id, r.done])));
    setDrillStatCache(Object.fromEntries(stats.map(r => [r.qid, r])));
    setWrongBookCache(Object.fromEntries(wrongBook.filter(r => !r.isDeleted).map(r => [r.qid, r])));
    setPetState(savedPetState.find(r => r.id === PET_STATE_ID) || createDefaultPetState());
    setPetEvents(savedPetEvents.sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, 12));
    
    showToast('云端数据同步成功！');
  }

  useEffect(() => {
    const logo = logoImgRef.current;
    if (!logo) return;

    let angle = 0;
    let isHovered = false;
    let frameId = null;

    const handleMouseEnter = () => { isHovered = true; };
    const handleMouseLeave = () => { isHovered = false; };

    logo.addEventListener('mouseenter', handleMouseEnter);
    logo.addEventListener('mouseleave', handleMouseLeave);

    const update = () => {
      if (isHovered) {
        logoSpeedRef.current = Math.min(logoSpeedRef.current + 0.45, 25);
      } else {
        logoSpeedRef.current = Math.max(logoSpeedRef.current - 0.18, 0);
      }

      if (logoSpeedRef.current > 0) {
        angle = (angle + logoSpeedRef.current) % 360;
        logo.style.transform = `rotate(${angle}deg)`;

        if (logoSpeedRef.current > 8) {
          const intensity = Math.min((logoSpeedRef.current - 8) / 1.5, 10);
          logo.style.filter = `drop-shadow(0 0 ${intensity}px rgba(76, 175, 80, 0.9))`;
        } else {
          logo.style.filter = 'none';
        }
      } else {
        logo.style.filter = 'none';
        // 自动平滑对齐摆正
        if (!isHovered && angle !== 0) {
          const targetAngle = angle > 180 ? 360 : 0;
          const diff = targetAngle - angle;
          if (Math.abs(diff) < 0.5) {
            angle = 0;
            logo.style.transform = 'rotate(0deg)';
          } else {
            angle += diff * 0.16; // 阻尼回位缓动
            logo.style.transform = `rotate(${angle}deg)`;
          }
        }
      }

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      logo.removeEventListener('mouseenter', handleMouseEnter);
      logo.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const CULTIVATION_MEMES = [
    '参天造化露 +1',
    '法力运转加速！',
    '修为松动！',
    '以学代修，突破！',
    '注入前端灵力！',
    '灵气暴走！',
    '筑基近在咫尺！',
    '道友，代码熟了！',
    '炼丹中，勿扰！',
    '前端金丹 +1'
  ];

  function handleLogoPractise() {
    logoSpeedRef.current = Math.min(logoSpeedRef.current + 22, 65);
    const text = CULTIVATION_MEMES[Math.floor(Math.random() * CULTIVATION_MEMES.length)];
    const id = Math.random().toString(36).substring(2, 9);
    setFlyEffects(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setFlyEffects(prev => prev.filter(item => item.id !== id));
    }, 900);
  }


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
    if (parts[0] === 'roadmap') {
      setPage('roadmap');
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

    // 尝试从 localStorage 恢复 quizState
    const savedStateStr = localStorage.getItem('active_quiz_state');
    let restored = false;
    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        const typeMatch = savedState.type === type;
        const moduleMatch = savedState.moduleId === moduleId;
        const docIdxMatch = savedState.docIdx == docIdx; // 兼容 null 与 undefined，或数字与字符串的松散比较

        if (typeMatch && moduleMatch && docIdxMatch && savedState.questions && savedState.questions.length === questions.length) {
          setQuizState(savedState);
          restored = true;
        }
      } catch (e) {
        console.error('解析本地保存的刷题状态失败', e);
      }
    }

    if (!restored) {
      setQuizState(createQuizState(type, moduleId, docIdx, questions));
    }

    setAnswerCardCollapsed(false);
    setMobileAnswerCardOpen(false);
  }, [db, drillStatCache, location.pathname, location.search, navigate, page, quizState, wrongBookCache]);

  // 监听 quizState 变化，自动持久化到 localStorage 中，或者在离开刷题/结果页时清除
  useEffect(() => {
    if (quizState) {
      localStorage.setItem('active_quiz_state', JSON.stringify(quizState));
    } else {
      const parts = location.pathname.split('/').filter(Boolean);
      if (parts[0] !== 'quiz' && parts[0] !== 'result') {
        localStorage.removeItem('active_quiz_state');
      }
    }
  }, [quizState, location.pathname]);

  useEffect(() => {
    if (page === 'result' && !quizState) {
      const savedStateStr = localStorage.getItem('active_quiz_state');
      if (savedStateStr) {
        try {
          const savedState = JSON.parse(savedStateStr);
          if (savedState && savedState.questions) {
            setQuizState(savedState);
            return;
          }
        } catch (e) {
          console.error('解析结果页本地状态失败', e);
        }
      }
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

  async function grantPetReward(reward) {
    if (!reward?.xp) return;
    const now = Date.now();
    const previousStage = getPetStage(petState.xp || 0);
    const nextState = applyPetReward(petState, reward, now);
    const event = makePetEvent(reward, nextState, previousStage, now);
    setPetState(nextState);
    setPetEvents(prev => [event, ...prev].slice(0, PET_EVENT_LIMIT));
    if (db) {
      await dbPut(db, 'petState', nextState);
      await dbPut(db, 'petEvents', event);
    }
    showToast(`${event.title} · 修为 +${nextState.xp - (petState.xp || 0)}`);
  }

  function setRoute(nextPage, opts = {}) {
    if (nextPage === 'home') navigate('/');
    if (nextPage === 'roadmap') navigate('/roadmap');
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
    const alreadyDone = progressCache[key];
    setProgressCache(prev => ({ ...prev, [key]: true }));
    if (db) await dbPut(db, 'progress', { id: key, done: true });
    if (!alreadyDone) {
      const module = LEARNING_CONTENT.modules.find(m => m.id === moduleId);
      const docTitle = module?.docs?.[docIdx]?.title || '学习文章';
      await grantPetReward(makeReadReward(docTitle));
    }
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
      await dbPut(db, 'wrongBook', { qid: question._qid, isDeleted: true, updatedAt: Date.now() });
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
    await grantPetReward(makeQuizReward(quizState));
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
        <div data-component="immersive-toolbar" className={`fixed top-4 right-5 z-[999] flex items-center gap-2.5 bg-surface border border-border rounded-[24px] px-4 py-1.75 shadow-[0_4px_24px_rgba(0,0,0,0.3)] text-[13px] text-text-secondary transition-all duration-400 ease-in-out ${toolbarVisible ? 'opacity-1 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <span>专注阅读</span>
          <div className="w-[1px] h-3.5 bg-border" />
          <button className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-text text-[13px] font-semibold p-0 hover:text-primary" onClick={() => setImmersiveMode(false)}>
            退出 <kbd className="text-[11px] bg-surface-alt border border-border rounded px-1.25 py-0.25 font-sans">Esc</kbd>
          </button>
        </div>
      )}
      {/* ===== 顶部导航栏：三区布局 [Logo | Tabs | Actions] ===== */}
      <nav data-component="top-nav" className="sticky top-0 z-[100] h-14 bg-surface border-b border-border flex items-center">

        {/* 左区：Logo */}
        <div data-element="logo" className="shrink-0 flex items-center gap-2 pl-4 md:pl-6 pr-3 md:pr-4">
          <div className="relative flex items-center justify-center cursor-pointer select-none" onClick={handleLogoPractise}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-8 h-8 object-contain" ref={logoImgRef} />
            {flyEffects.map(effect => (
              <span key={effect.id} className="logo-fly-text">{effect.text}</span>
            ))}
          </div>
          <span className="hidden sm:block text-[15px] font-bold text-primary whitespace-nowrap">中高级前端知识对齐</span>
        </div>

        {/* 分隔线 */}
        <div className="shrink-0 w-px h-5 bg-border" />

        {/* 中区：导航 Tabs（弹性伸缩，内部可横向滚动） */}
        <div data-element="nav-tabs" className="flex-1 min-w-0 overflow-x-auto scrollbar-none flex items-center gap-1 px-2 md:px-3">
          {PAGES.map(name => (
            <button
              key={name}
              data-element="nav-tab"
              data-state={activeNavPage === name ? 'active' : 'inactive'}
              className={`shrink-0 px-3 py-1.5 rounded-lg cursor-pointer text-[13px] md:text-[14px] whitespace-nowrap transition-all duration-200 border-0 font-medium
                ${activeNavPage === name
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-transparent text-text-secondary hover:bg-surface-alt hover:text-text'
                }`}
              onClick={() => setRoute(name)}
            >
              {name === 'home'
                ? '首页'
                : name === 'roadmap'
                  ? '🧭 路线'
                  : name === 'breaker'
                    ? '🗺️ 破冰'
                    : name === 'learn'
                      ? '📖 学习'
                      : name === 'drill'
                        ? '🎯 刷题'
                        : '🧩 错题本'}
            </button>
          ))}
        </div>

        <div data-element="actions" className="shrink-0 flex items-center gap-1.5 pr-4 md:pr-6 pl-2">
          <PetWidget petState={petState} onOpen={() => setPetPanelOpen(true)} />
          <button
            className={`w-9 h-9 flex items-center justify-center rounded-lg border cursor-pointer transition-all duration-200 hover:border-primary hover:bg-surface hover:text-primary ${
              user ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface-alt border-border'
            }`}
            onClick={() => setSyncModalOpen(true)}
            title={user ? `云同步已连接: ${user.email} (点击管理)` : '云同步未连接 (点击登录)'}
          >
            {user ? '☁️' : '🔄'}
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-surface-alt text-[16px] cursor-pointer transition-all duration-200 hover:border-primary hover:bg-surface hover:text-primary"
            onClick={toggleTheme}
            title="切换白天/夜间模式"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <div className={`flex-1 flex overflow-hidden ${immersiveMode ? 'h-screen' : 'h-[calc(100vh-56px)]'} relative`}>
        {page === 'learn' && currentModule && (
          <Sidebar
            currentModuleId={currentModuleId}
            currentDocIdx={currentDocIdx}
            progressCache={progressCache}
            onNavToDoc={navToDoc}
          />
        )}
        <main data-element="main-content" className={`content flex-1 overflow-y-auto ${page === 'breaker' && !currentBreakerNodeId ? 'p-0 overflow-hidden' : 'p-8 px-12 max-md:p-4 max-md:px-5 max-md:pb-18'}`} ref={contentRef}>
          {page === 'home' && (
            <Home
              progressCache={progressCache}
              petState={petState}
              onOpenPet={() => setPetPanelOpen(true)}
              onOpenRoadmap={() => setRoute('roadmap')}
              onOpenBreaker={() => setRoute('breaker')}
              onOpenModule={(moduleId) => setRoute('learn', { moduleId, docIdx: 0 })}
            />
          )}
          {page === 'roadmap' && (
            <CapabilityRoadmap
              progressCache={progressCache}
              wrongBookCache={wrongBookCache}
              onOpenBreaker={() => setRoute('breaker')}
              onOpenModule={(moduleId) => setRoute('learn', { moduleId, docIdx: 0 })}
              onOpenDoc={navToDoc}
              onOpenDrill={(moduleId) => {
                if (moduleId) startDrill(moduleId);
                else setRoute('drill');
              }}
              onOpenWrongBook={(moduleId) => {
                if (moduleId) startWrongBook(moduleId);
                else setRoute('wrongbook');
              }}
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
      {petPanelOpen && (
        <PetPanel
          petState={petState}
          petEvents={petEvents}
          onClose={() => setPetPanelOpen(false)}
        />
      )}
      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        db={db}
        user={user}
        onSyncComplete={reloadLocalCaches}
        onAuthChange={setUser}
      />
    </>
  );
}


export default App;
