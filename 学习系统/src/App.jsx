import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { LEARNING_CONTENT } from '../data/learning-content.js';
import { dbPut } from './storage/learnDb.js';
import { Home } from './pages/Home.jsx';
import { CapabilityRoadmap } from './pages/CapabilityRoadmap.jsx';
import { TechBreakerMap } from './pages/TechBreakerMap.jsx';
import { TechBreakerCard } from './pages/TechBreakerCard.jsx';
import { ModuleSelect } from './pages/ModuleSelect.jsx';
import { Article } from './pages/Article.jsx';
import { DrillSelect } from './pages/DrillSelect.jsx';
import { WrongBookPage } from './pages/WrongBookPage.jsx';
import { MockInterviewPage } from './pages/MockInterviewPage.jsx';
import { QuizPage } from './pages/QuizPage.jsx';
import { QuizResult } from './pages/QuizResult.jsx';
import Sidebar from './components/Sidebar.jsx';
import AnswerCard from './components/AnswerCard.jsx';
import { PetPanel } from './components/PetPanel.jsx';
import { supabase } from './storage/supabaseClient.js';
import {
  setActiveContent,
} from './utils/quiz.js';
import { getBreakerCard } from './utils/techBreaker.js';
import {
  PET_EVENT_LIMIT,
  applyPetReward,
  getPetStage,
  makePetEvent,
  makeReadReward,
} from './utils/pet.js';
import { useImmersiveController } from './hooks/useImmersiveController.js';
import { useLearningDb } from './hooks/useLearningDb.js';
import { useMarkdownEnhancements } from './hooks/useMarkdownEnhancements.js';
import { useThemeController } from './hooks/useThemeController.js';

// 导入拆分出的组件与 Hooks
import Navbar from './components/Navbar.jsx';
import { useGithubPrivateModule } from './hooks/useGithubPrivateModule.js';
import { useCloudSync } from './hooks/useCloudSync.js';
import { useQuizManager } from './hooks/useQuizManager.js';

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
  const [petPanelOpen, setPetPanelOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const contentRef = useRef(null);
  const scrollBlurOverlayRef = useRef(null);
  const activeAnimationRef = useRef(null);

  const customScrollTo = useCallback((target) => {
    const scrollRoot = contentRef.current;
    if (!scrollRoot || target === undefined || target === null) return;

    if (activeAnimationRef.current) {
      cancelAnimationFrame(activeAnimationRef.current);
    }

    let targetTop = 0;
    if (typeof target === 'number') {
      targetTop = target;
    } else {
      const scrollRootRect = scrollRoot.getBoundingClientRect();
      const elementRect = target.getBoundingClientRect();
      targetTop = scrollRoot.scrollTop + elementRect.top - scrollRootRect.top - 24;
    }

    const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
    const finalTarget = Math.max(0, Math.min(targetTop, maxScroll));

    let currentTop = scrollRoot.scrollTop;
    let velocity = 0;
    
    // 二阶临界阻尼弹簧参数
    const kSpring = 220; 
    const cDamping = 30; 
    
    let lastTime = performance.now();
    const overlay = scrollBlurOverlayRef.current;

    const animate = (time) => {
      let dt = (time - lastTime) / 1000;
      lastTime = time;

      if (dt > 0.1) dt = 0.1;
      if (dt <= 0) {
        activeAnimationRef.current = requestAnimationFrame(animate);
        return;
      }

      const distance = finalTarget - currentTop;
      const acceleration = kSpring * distance - cDamping * velocity;
      velocity += acceleration * dt;
      currentTop += velocity * dt;

      scrollRoot.scrollTop = currentTop;

      const absVelocity = Math.abs(velocity);
      const blurRadius = Math.min(absVelocity * 0.005, 10);
      const opacity = Math.min(absVelocity / 400, 1);

      if (overlay) {
        overlay.style.backdropFilter = `blur(${blurRadius}px)`;
        overlay.style.webkitBackdropFilter = `blur(${blurRadius}px)`;
        overlay.style.opacity = `${opacity}`;
      }

      if (Math.abs(distance) < 0.5 && absVelocity < 5) {
        scrollRoot.scrollTop = finalTarget;
        if (overlay) {
          overlay.style.transition = 'opacity 0.25s ease, backdrop-filter 0.25s ease, -webkit-backdrop-filter 0.25s ease';
          overlay.style.opacity = '0';
          overlay.style.backdropFilter = 'blur(0px)';
          overlay.style.webkitBackdropFilter = 'blur(0px)';
          setTimeout(() => {
            if (overlay) overlay.style.transition = 'none';
          }, 260);
        }
        activeAnimationRef.current = null;
      } else {
        activeAnimationRef.current = requestAnimationFrame(animate);
      }
    };

    activeAnimationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    return () => {
      if (activeAnimationRef.current) {
        cancelAnimationFrame(activeAnimationRef.current);
      }
    };
  }, []);

  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim());
    return adminEmails.includes(user.email);
  }, [user]);

  // 1. 消息提示封装
  const showToast = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // 2. 奖励结算封装
  const grantPetReward = useCallback(async (reward) => {
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
  }, [db, petState, setPetState, setPetEvents, showToast]);

  // 3. GitHub 私密模块 Hook
  const { contentVersion, loadPrivateModule } = useGithubPrivateModule({
    isAdmin,
    page,
    currentModuleId,
    currentDocIdx,
    showToast,
  });

  // 同步完成后重载本地 IndexedDB 缓存并刷新视图
  const reloadLocalCaches = useCallback(async () => {
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
  }, [db, setProgressCache, setDrillStatCache, setWrongBookCache, setPetState, setPetEvents, showToast]);

  // 4. 云同步 Hook
  const {
    syncModalOpen,
    setSyncModalOpen,
    showSyncPrompt,
    handleDismissSyncPrompt,
    handleAcceptSyncPrompt,
  } = useCloudSync({
    db,
    user,
    authLoaded,
    progressCache,
    drillStatCache,
    wrongBookCache,
    petState,
    reloadLocalCaches,
    showToast,
  });

  // 5. 答题管理 Hook
  const {
    quizState,
    answerCardCollapsed,
    setAnswerCardCollapsed,
    mobileAnswerCardOpen,
    setMobileAnswerCardOpen,
    startDocQuiz,
    startDocOralDrill,
    startModuleOralDrill,
    startBreakerQuiz,
    startDrill,
    startWrongBook,
    toggleOption,
    submitPage,
    nextPage,
    showQuizResult,
    jumpToQuestion,
  } = useQuizManager({
    db,
    location,
    navigate,
    drillStatCache,
    setDrillStatCache,
    wrongBookCache,
    setWrongBookCache,
    grantPetReward,
    showToast,
    setCurrentModuleId,
    customScrollTo,
  });

  // 监听 Supabase 登录状态变化
  useEffect(() => {
    if (!supabase) {
      setAuthLoaded(true);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoaded(true);
    }).catch(() => {
      setAuthLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoaded(true);
      if (!session) {
        localStorage.removeItem('github_pat');
        localStorage.removeItem('github_repo');
        localStorage.removeItem('github_branch');
        // 安全抹除内存中的私密模块
        LEARNING_CONTENT.modules = LEARNING_CONTENT.modules.filter(m => m.id !== 'private-interview');
        setActiveContent(LEARNING_CONTENT);
        reloadLocalCaches(); // 触发重载
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [reloadLocalCaches]);

  const setRoute = useCallback((nextPage, opts = {}) => {
    if (nextPage === 'home') navigate('/');
    if (nextPage === 'roadmap') navigate('/roadmap');
    if (nextPage === 'breaker') navigate(opts.nodeId ? `/breaker/card/${opts.nodeId}` : '/breaker');
    if (nextPage === 'learn') navigate(opts.moduleId ? `/learn/${opts.moduleId}/${opts.docIdx ?? 0}` : '/learn');
    if (nextPage === 'drill') navigate('/drill');
    if (nextPage === 'wrongbook') navigate('/wrongbook');
    if (nextPage === 'mock-interview') navigate('/mock-interview');
  }, [navigate]);

  const navToDoc = useCallback((moduleId, docIdx) => {
    navigate(`/learn/${moduleId}/${docIdx}`);
  }, [navigate]);

  const markDone = useCallback(async (moduleId, docIdx, startQuiz) => {
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
  }, [db, progressCache, setProgressCache, grantPetReward, startDocQuiz]);

  const currentModule = useMemo(
    () => LEARNING_CONTENT.modules.find(m => m.id === currentModuleId) || null,
    [currentModuleId]
  );

  // 路由解析逻辑与渲染分发保持同步
  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) {
      setPage('home');
      setMobileAnswerCardOpen(false);
      return;
    }
    if (parts[0] === 'roadmap') {
      setPage('roadmap');
      setMobileAnswerCardOpen(false);
      return;
    }
    if (parts[0] === 'breaker') {
      setPage('breaker');
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
      setMobileAnswerCardOpen(false);
      return;
    }
    if (parts[0] === 'wrongbook') {
      setPage('wrongbook');
      setMobileAnswerCardOpen(false);
      return;
    }
    if (parts[0] === 'mock-interview') {
      setPage('mock-interview');
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
  }, [location.pathname, navigate, isAdmin, contentVersion]);

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

  const activeNavPage = page === 'quiz' || page === 'result'
    ? (quizState?.type === 'wrongbook' ? 'wrongbook' : quizState?.type === 'drill' ? 'drill' : quizState?.type === 'breaker' ? 'breaker' : 'learn')
    : page;

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      {immersiveMode && (
        <div data-component="immersive-toolbar" className={`fixed top-4 right-5 z-[999] transition-all duration-400 ease-in-out ${toolbarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <button 
            className="bg-transparent border-0 p-0 cursor-pointer text-text-secondary hover:text-primary select-none opacity-40 hover:opacity-100 transition-all duration-150 active:scale-[0.9] flex items-center justify-center gap-1.5" 
            onClick={() => setImmersiveMode(false)}
            title="退出专注模式 (Esc)"
          >
            <svg 
              className="w-3.5 h-3.5" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M8 3v5H3M21 8h-5V3M3 16h5v5M16 21v-5h5" />
            </svg>
            <kbd className="text-[9px] bg-transparent border border-border/30 rounded px-1 py-0.25 font-sans text-text-secondary opacity-70 font-medium scale-90">Esc</kbd>
          </button>
        </div>
      )}

      <div className={`transition-all duration-300 ease-in-out origin-top ${immersiveMode ? 'h-0 overflow-hidden -translate-y-full opacity-0' : 'h-14 opacity-100 translate-y-0'}`}>
        <Navbar 
          page={activeNavPage}
          setRoute={setRoute}
          isAdmin={isAdmin}
          user={user}
          setUser={setUser}
          petState={petState}
          db={db}
          reloadLocalCaches={reloadLocalCaches}
          loadPrivateModule={loadPrivateModule}
          theme={theme}
          toggleTheme={toggleTheme}
          syncModalOpen={syncModalOpen}
          setSyncModalOpen={setSyncModalOpen}
          showSyncPrompt={showSyncPrompt}
          handleDismissSyncPrompt={handleDismissSyncPrompt}
          handleAcceptSyncPrompt={handleAcceptSyncPrompt}
          setPetPanelOpen={setPetPanelOpen}
          onToggleImmersive={setImmersiveMode}
        />
      </div>

      <div className={`flex-1 flex overflow-hidden ${immersiveMode ? 'h-screen h-[100dvh]' : 'h-[calc(100vh-56px)] h-[calc(100dvh-56px)]'} relative`}>
        {page === 'learn' && currentModule && (
          <Sidebar
            currentModuleId={currentModuleId}
            currentDocIdx={currentDocIdx}
            progressCache={progressCache}
            onNavToDoc={navToDoc}
          />
        )}
        <div className="flex-1 relative overflow-hidden h-full flex flex-col">
          {/* 自动定位滚动的毛玻璃遮罩 */}
          <div 
            className="pointer-events-none absolute inset-0 z-40 scroll-blur-overlay opacity-0"
            ref={scrollBlurOverlayRef}
          />
          <main 
            data-element="main-content" 
            className={`content flex-1 overflow-y-auto ${page === 'breaker' && !currentBreakerNodeId ? 'p-0 overflow-hidden' : 'p-8 pb-14 px-12 max-md:p-4 max-md:px-5 max-md:pb-20'}`} 
            ref={contentRef}
          >
            {page === 'home' && (
              <Home
                progressCache={progressCache}
                petState={petState}
                onOpenPet={() => setPetPanelOpen(true)}
                onOpenRoadmap={() => setRoute('roadmap')}
                onOpenBreaker={() => setRoute('breaker')}
                onOpenModule={(moduleId) => setRoute('learn', { moduleId, docIdx: 0 })}
                onOpenMockInterview={() => setRoute('mock-interview')}
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
                onStartOralDrill={startDocOralDrill}
                onGoDrill={() => setRoute('drill')}
                immersiveMode={immersiveMode}
                onToggleImmersive={() => setImmersiveMode(v => !v)}
                customScrollTo={customScrollTo}
              />
            )}
            {page === 'drill' && (
              <DrillSelect 
                modules={LEARNING_CONTENT.modules} 
                drillStatCache={drillStatCache} 
                onStartDrill={startDrill} 
                onStartOralDrill={startModuleOralDrill} 
              />
            )}
            {page === 'wrongbook' && (
              <WrongBookPage
                wrongBookCache={wrongBookCache}
                onStartWrongBook={startWrongBook}
                onReadChapter={navToDoc}
              />
            )}
            {page === 'mock-interview' && (
              <MockInterviewPage
                wrongBookCache={wrongBookCache}
                onAddToWrongBook={async (question, userWrittenText, score, clear = false) => {
                  if (!db || !question?._qid) return;
                  if (clear) {
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
                    moduleId: question._moduleId || 'project-prep-special',
                    moduleName: question._moduleName || '项目面试准备',
                    docIdx: question._docIdx || 0,
                    docTitle: question._docTitle || '面试复盘报告',
                    quizIdx: question._quizIdx || 0,
                    question: question.question,
                    type: question.type,
                    userAnswer: { writtenText: userWrittenText, score },
                    correctAnswer: question.keywords || [],
                    explain: question.recommendStructure || '',
                    wrongCount: (prev?.wrongCount || 0) + 1,
                    createdAt: prev?.createdAt || Date.now(),
                    updatedAt: Date.now(),
                  };
                  setWrongBookCache(cache => ({ ...cache, [question._qid]: next }));
                  await dbPut(db, 'wrongBook', next);
                }}
                onNavToWrongBook={() => setRoute('wrongbook')}
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
                immersiveMode={immersiveMode}
                onToggleImmersive={() => setImmersiveMode(v => !v)}
                onJumpToQuestion={jumpToQuestion}
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
        </div>
        {page === 'quiz' && quizState && (
          <AnswerCard
            quizState={quizState}
            collapsed={answerCardCollapsed}
            mobileOpen={mobileAnswerCardOpen}
            immersiveMode={immersiveMode}
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
    </>
  );
}

export default App;
