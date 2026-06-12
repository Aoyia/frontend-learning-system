import { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { LEARNING_CONTENT } from '../../data/learning-content.js';
import { dbPut } from '../storage/learnDb.js';
import {
  DEFAULT_DRILL_LIMIT,
  createQuizState,
  getDocQuestions,
  getDrillQuestions,
  getQuestionByQid,
  isAnswerCorrect,
} from '../utils/quiz.js';
import { getBreakerCard, getBreakerQuestions } from '../utils/techBreaker.js';
import { makeQuizReward } from '../utils/pet.js';

export function useQuizManager({
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
}) {
  const [quizState, setQuizState] = useState(null);
  const [answerCardCollapsed, setAnswerCardCollapsed] = useState(false);
  const [mobileAnswerCardOpen, setMobileAnswerCardOpen] = useState(false);

  const startQuiz = useCallback((type, moduleId, docIdx, questions, options = {}) => {
    const query = type === 'drill' ? `?limit=${options.limit || 'all'}` : '';
    navigate(`/quiz/${type}/${moduleId}${docIdx === null || docIdx === undefined ? '' : `/${docIdx}`}${query}`);
    setCurrentModuleId(moduleId);
    setQuizState(createQuizState(type, moduleId, docIdx, questions));
    setAnswerCardCollapsed(false);
    setMobileAnswerCardOpen(false);
  }, [navigate, setCurrentModuleId]);

  const startDocQuiz = useCallback((moduleId, docIdx) => {
    const questions = getDocQuestions(moduleId, docIdx);
    if (!questions.length) {
      showToast('该篇暂无题目');
      return;
    }
    startQuiz('doc', moduleId, docIdx, questions);
  }, [startQuiz, showToast]);

  const startBreakerQuiz = useCallback((nodeId) => {
    const questions = getBreakerQuestions(nodeId);
    if (!questions.length) {
      showToast('这张技术破冰卡片暂无自测题');
      return;
    }
    startQuiz('breaker', nodeId, null, questions);
  }, [startQuiz, showToast]);

  const startDrill = useCallback((moduleId, limit = DEFAULT_DRILL_LIMIT) => {
    const questions = getDrillQuestions(moduleId, drillStatCache, limit);
    if (!questions.length) {
      showToast('该模块暂无题目');
      return;
    }
    startQuiz('drill', moduleId, null, questions, { limit });
  }, [drillStatCache, startQuiz, showToast]);

  const startWrongBook = useCallback((moduleId = null) => {
    const records = Object.values(wrongBookCache)
      .filter(record => !moduleId || record.moduleId === moduleId)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const questions = records.map(record => getQuestionByQid(record.qid)).filter(Boolean);
    if (!questions.length) {
      showToast(moduleId ? '该模块暂无错题' : '当前没有错题');
      return;
    }
    startQuiz('wrongbook', moduleId || 'all', null, questions);
  }, [wrongBookCache, startQuiz, showToast]);

  const toggleOption = useCallback((globalIdx, optIdx) => {
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
  }, []);

  const saveDrillStat = useCallback(async (question, selected) => {
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
  }, [db, drillStatCache, setDrillStatCache]);

  const updateWrongBook = useCallback(async (question, selected) => {
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
  }, [db, wrongBookCache, setWrongBookCache]);

  const submitPage = useCallback(() => {
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
  }, [quizState, saveDrillStat, updateWrongBook]);

  const nextPage = useCallback(() => {
    setQuizState(prev => {
      const nextPageIdx = prev.currentPageIdx + 1;
      return {
        ...prev,
        currentPageIdx: nextPageIdx,
        activeQuestionIdx: nextPageIdx * prev.pageSize,
      };
    });
    customScrollTo(0);
  }, [customScrollTo]);

  const showQuizResult = useCallback(async () => {
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
  }, [db, quizState, grantPetReward, navigate]);

  const jumpToQuestion = useCallback((globalIdx) => {
    flushSync(() => {
      setQuizState(prev => {
        const targetPage = Math.floor(globalIdx / prev.pageSize);
        return { 
          ...prev, 
          currentPageIdx: targetPage,
          activeQuestionIdx: globalIdx,
        };
      });
    });
    const el = document.getElementById(`qq-${globalIdx}`);
    if (el) {
      customScrollTo(el);
    }
  }, [customScrollTo]);

  // 监听路由变化，解析参数初始化/恢复答题状态
  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'quiz') return;
    if (quizState) return; // 已经有答题状态了，不重复初始化

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
        const docIdxMatch = savedState.docIdx == docIdx;

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
  }, [db, drillStatCache, location.pathname, location.search, navigate, quizState, wrongBookCache, setCurrentModuleId]);

  // 答题状态实时同步到 localStorage
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

  // 结果页恢复
  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'result' && !quizState) {
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
  }, [navigate, location.pathname, quizState]);

  return {
    quizState,
    setQuizState,
    answerCardCollapsed,
    setAnswerCardCollapsed,
    mobileAnswerCardOpen,
    setMobileAnswerCardOpen,
    startDocQuiz,
    startBreakerQuiz,
    startDrill,
    startWrongBook,
    toggleOption,
    submitPage,
    nextPage,
    showQuizResult,
    jumpToQuestion,
  };
}
