import { LEARNING_CONTENT } from '../../data/learning-content.js';

export const QUESTION_TYPE_ORDER = {
  single: 0,
  multiple: 1,
  judgment: 2,
};

export const QUICK_DRILL_LIMIT = 10;
export const DEFAULT_DRILL_LIMIT = 20;

export function isAnswerCorrect(question, selected) {
  if (Array.isArray(question.answer)) {
    return Array.isArray(selected)
      && selected.length === question.answer.length
      && selected.every(i => question.answer.includes(i));
  }
  return question.answer === selected;
}

export function getDifficultyClass(difficulty) {
  if (difficulty === '入门') return 'easy';
  if (difficulty === '进阶') return 'medium';
  return 'hard';
}

export function withQuestionSource(module, doc, docIdx, question, quizIdx) {
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

export function orderQuestionsByType(questions) {
  return questions
    .map((question, originalOrder) => ({ question, originalOrder }))
    .sort((a, b) => {
      const typeDiff = (QUESTION_TYPE_ORDER[a.question.type] ?? 99) - (QUESTION_TYPE_ORDER[b.question.type] ?? 99);
      return typeDiff || a.originalOrder - b.originalOrder;
    })
    .map(item => item.question);
}

export function getRawModuleQuestions(moduleId) {
  const module = LEARNING_CONTENT.modules.find(m => m.id === moduleId);
  if (!module) return [];
  return module.docs.flatMap((doc, docIdx) =>
    (doc.quiz || []).map((q, qi) => withQuestionSource(module, doc, docIdx, q, qi))
  );
}

export function getDrillTypeQuotas(limit) {
  const single = Math.max(1, Math.round(limit * 0.55));
  const multiple = Math.max(1, Math.round(limit * 0.25));
  return {
    single,
    multiple,
    judgment: Math.max(1, limit - single - multiple),
  };
}

export function rankQuestionForDrill(question, drillStatCache) {
  const stat = drillStatCache[question._qid];
  if (!stat) return 0;
  if (!stat.lastCorrect) return 1;
  return 2;
}

export function selectDrillBatch(questions, drillStatCache, limit = DEFAULT_DRILL_LIMIT) {
  if (!limit || questions.length <= limit) return orderQuestionsByType(questions);

  const quotas = getDrillTypeQuotas(limit);
  const selected = [];
  const selectedIds = new Set();
  const pickFromType = (type, count) => {
    questions
      .filter(question => question.type === type)
      .map((question, originalOrder) => ({ question, originalOrder }))
      .sort((a, b) => {
        const rankDiff = rankQuestionForDrill(a.question, drillStatCache) - rankQuestionForDrill(b.question, drillStatCache);
        const timeDiff = (drillStatCache[a.question._qid]?.updatedAt || 0) - (drillStatCache[b.question._qid]?.updatedAt || 0);
        return rankDiff || timeDiff || a.originalOrder - b.originalOrder;
      })
      .slice(0, count)
      .forEach(({ question }) => {
        selected.push(question);
        selectedIds.add(question._qid);
      });
  };

  pickFromType('single', quotas.single);
  pickFromType('multiple', quotas.multiple);
  pickFromType('judgment', quotas.judgment);

  if (selected.length < limit) {
    questions
      .filter(question => !selectedIds.has(question._qid))
      .map((question, originalOrder) => ({ question, originalOrder }))
      .sort((a, b) => {
        const rankDiff = rankQuestionForDrill(a.question, drillStatCache) - rankQuestionForDrill(b.question, drillStatCache);
        const timeDiff = (drillStatCache[a.question._qid]?.updatedAt || 0) - (drillStatCache[b.question._qid]?.updatedAt || 0);
        return rankDiff || timeDiff || a.originalOrder - b.originalOrder;
      })
      .slice(0, limit - selected.length)
      .forEach(({ question }) => selected.push(question));
  }

  return orderQuestionsByType(selected);
}

export function getDocQuestions(moduleId, docIdx) {
  const module = LEARNING_CONTENT.modules.find(m => m.id === moduleId);
  const doc = module?.docs[docIdx];
  if (!module || !doc) return [];
  return orderQuestionsByType((doc.quiz || []).map((q, qi) => withQuestionSource(module, doc, docIdx, q, qi)));
}

export function getModuleQuestions(moduleId) {
  return orderQuestionsByType(getRawModuleQuestions(moduleId));
}

export function getDrillQuestions(moduleId, drillStatCache, limit = DEFAULT_DRILL_LIMIT) {
  const questions = getRawModuleQuestions(moduleId);
  return selectDrillBatch(questions, drillStatCache, limit);
}

export function getQuestionByQid(qid) {
  const [moduleId, docIdxText, quizIdxText] = qid.split('__');
  const docIdx = Number(docIdxText);
  const quizIdx = Number(quizIdxText);
  return getDocQuestions(moduleId, docIdx).find(question => question._quizIdx === quizIdx) || null;
}

export function createQuizState(type, moduleId, docIdx, questions) {
  return {
    type,
    moduleId,
    docIdx,
    questions,
    pageSize: 1,
    currentPageIdx: 0,
    selections: {},
    answers: {},
    submittedPages: [],
    score: 0,
  };
}

export function formatAnswer(question, answer) {
  const toText = idx => {
    if (idx === undefined || idx === null) return '未选择';
    if (question.type === 'judgment') return question.options[idx] || '未选择';
    return 'ABCDEF'[idx] || '未选择';
  };
  return Array.isArray(answer) ? answer.map(toText).join(', ') : toText(answer);
}

export function sourceTypeLabel(type) {
  if (type === 'blog') return '博客';
  if (type === 'note') return '笔记';
  if (type === 'official') return '官方资料';
  if (type === 'original') return '原创';
  return type;
}
