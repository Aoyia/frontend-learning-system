import stage01 from '../assets/pet/pet-stage-01-ling-egg.png';
import stage02 from '../assets/pet/pet-stage-02-egg-crack.png';
import stage03 from '../assets/pet/pet-stage-03-qi-entry.png';
import stage04 from '../assets/pet/pet-stage-04-qi-middle.png';
import stage05 from '../assets/pet/pet-stage-05-foundation-entry.png';
import stage06 from '../assets/pet/pet-stage-06-foundation-middle.png';
import stage07 from '../assets/pet/pet-stage-07-foundation-peak.png';
import stage08 from '../assets/pet/pet-stage-08-core-entry.png';
import stage09 from '../assets/pet/pet-stage-09-core-middle.png';
import stage10 from '../assets/pet/pet-stage-10-core-peak.png';
import stage11 from '../assets/pet/pet-stage-11-nascent-soul.png';
import stage12 from '../assets/pet/pet-stage-12-spirit-transform.png';

export const PET_STATE_ID = 'learning-pet';
export const PET_EVENT_LIMIT = 12;

export const PET_STAGES = [
  { index: 0, threshold: 0, realm: '启灵', name: '灵蛋初现', image: stage01, desc: '代码灵纹在蛋壳上亮起，学习战宠开始吸收第一缕灵气。' },
  { index: 1, threshold: 60, realm: '启灵', name: '灵纹开裂', image: stage02, desc: '灵纹裂开，前端知识能量开始外泄。' },
  { index: 2, threshold: 150, realm: '炼气', name: '炼气入门', image: stage03, desc: '开始补齐 JS、Vue 和 Web API 基础，能独立完成小周天。' },
  { index: 3, threshold: 280, realm: '炼气', name: '炼气中期', image: stage04, desc: '基础刷题节奏稳定，能把错题转成下一轮修炼材料。' },
  { index: 4, threshold: 460, realm: '筑基', name: '筑基初期', image: stage05, desc: '知识骨架成型，开始用固定结构回答核心问题。' },
  { index: 5, threshold: 700, realm: '筑基', name: '筑基中期', image: stage06, desc: '模块化学习节奏稳定，能把专题、作业和自测串起来。' },
  { index: 6, threshold: 1000, realm: '筑基', name: '筑基圆满', image: stage07, desc: '答题模板与错题复训闭环成型，进入项目深挖训练。' },
  { index: 7, threshold: 1380, realm: '结丹', name: '结丹初期', image: stage08, desc: '项目证据链开始凝聚，回答能落到背景、取舍和指标。' },
  { index: 8, threshold: 1840, realm: '结丹', name: '结丹中期', image: stage09, desc: '能接住性能、工程化、规则引擎和插件系统追问。' },
  { index: 9, threshold: 2380, realm: '结丹', name: '结丹圆满', image: stage10, desc: '开放场景题和项目追问更稳定，能主动讲边界和兜底。' },
  { index: 10, threshold: 3000, realm: '元婴', name: '元婴初成', image: stage11, desc: '能举一反三，形成第二套方案和演进路径。' },
  { index: 11, threshold: 3720, realm: '化神', name: '化神守护', image: stage12, desc: '体系化应对中高级前端面试，成为前端守护者。' },
];

export function createDefaultPetState() {
  return {
    id: PET_STATE_ID,
    xp: 0,
    todayXp: 0,
    streak: 0,
    lastStudyDate: '',
    updatedAt: Date.now(),
  };
}

export function getDateKey(time = Date.now()) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayKey(time = Date.now()) {
  return getDateKey(time - 24 * 60 * 60 * 1000);
}

export function getPetStage(xp = 0) {
  let current = PET_STAGES[0];
  for (const stage of PET_STAGES) {
    if (xp >= stage.threshold) current = stage;
    else break;
  }
  return current;
}

export function getPetView(state = createDefaultPetState()) {
  const current = getPetStage(state.xp);
  const next = PET_STAGES[current.index + 1] || null;
  const start = current.threshold;
  const end = next?.threshold ?? current.threshold;
  const progress = next ? Math.min(100, Math.round(((state.xp - start) / (end - start)) * 100)) : 100;
  return {
    state,
    current,
    next,
    progress,
    xpToNext: next ? Math.max(0, next.threshold - state.xp) : 0,
  };
}

export function makeReadReward(docTitle) {
  return {
    xp: 20,
    title: '吸收灵气',
    detail: `读完「${docTitle}」，修为 +20`,
  };
}

export function makeQuizReward(quizState) {
  const total = quizState.questions.length;
  const correct = quizState.score;
  const isPerfect = total > 0 && correct === total;
  const typeMap = {
    doc: { base: 15, perCorrect: 3, title: '小周天运行' },
    drill: { base: 20, perCorrect: 3, title: '实战历练' },
    wrongbook: { base: 35, perCorrect: 5, title: '斩心魔' },
    breaker: { base: 12, perCorrect: 2, title: '破冰试炼' },
  };
  const rule = typeMap[quizState.type] || typeMap.doc;
  const perfectBonus = isPerfect ? 20 : 0;
  return {
    xp: rule.base + correct * rule.perCorrect + perfectBonus,
    title: isPerfect ? '顿悟突破' : rule.title,
    detail: `完成 ${total} 题，答对 ${correct} 题，修为 +${rule.base + correct * rule.perCorrect + perfectBonus}`,
  };
}

export function applyPetReward(state, reward, now = Date.now()) {
  const base = state || createDefaultPetState();
  const today = getDateKey(now);
  const isNewDay = base.lastStudyDate !== today;
  const streak = isNewDay
    ? (base.lastStudyDate === getYesterdayKey(now) ? (base.streak || 0) + 1 : 1)
    : (base.streak || 1);
  const streakBonus = isNewDay ? 10 : 0;
  const xpGain = reward.xp + streakBonus;
  return {
    ...base,
    xp: (base.xp || 0) + xpGain,
    todayXp: (isNewDay ? 0 : base.todayXp || 0) + xpGain,
    streak,
    lastStudyDate: today,
    updatedAt: now,
  };
}

export function makePetEvent(reward, nextState, previousStage, now = Date.now()) {
  const nextStage = getPetStage(nextState.xp);
  const stageChanged = nextStage.index > previousStage.index;
  const today = getDateKey(now);
  return {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: stageChanged ? `突破到 ${nextStage.realm} · ${nextStage.name}` : reward.title,
    detail: stageChanged ? `${reward.detail}，成功突破新境界。` : reward.detail,
    xp: nextState.xp,
    stageIndex: nextStage.index,
    date: today,
    time: now,
  };
}
