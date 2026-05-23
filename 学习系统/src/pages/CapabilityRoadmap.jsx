import { LEARNING_CONTENT } from '../../data/learning-content.js';
import { TENCENT_FRONTEND_CAPABILITY_MODEL } from '../../data/capability-model.js';

function findModule(moduleId) {
  return LEARNING_CONTENT.modules.find(module => module.id === moduleId) || null;
}

function resolveDocRef(ref) {
  const module = findModule(ref.moduleId);
  if (!module) return null;
  const docIdx = module.docs.findIndex(doc => doc.title.includes(ref.titleIncludes));
  if (docIdx < 0) return null;
  return { module, docIdx, doc: module.docs[docIdx] };
}

function getCapabilityState(capability, progressCache, wrongBookCache) {
  const docLinks = capability.docRefs.map(resolveDocRef).filter(Boolean);
  const doneCount = docLinks.filter(({ module, docIdx }) => progressCache[`${module.id}__${docIdx}`]).length;
  const wrongCount = Object.values(wrongBookCache).filter(record => {
    if (capability.drillModuleIds.includes(record.moduleId)) return true;
    return capability.focus.some(keyword => record.docTitle?.includes(keyword) || record.question?.includes(keyword));
  }).length;
  const firstUndone = docLinks.find(({ module, docIdx }) => !progressCache[`${module.id}__${docIdx}`]) || docLinks[0] || null;

  return {
    docLinks,
    doneCount,
    wrongCount,
    firstUndone,
    percent: docLinks.length ? Math.round((doneCount / docLinks.length) * 100) : 0,
  };
}

function getModuleProgress(moduleId, progressCache) {
  const module = findModule(moduleId);
  if (!module) return null;
  const done = module.docs.filter((_, idx) => progressCache[`${module.id}__${idx}`]).length;
  return { module, done, total: module.docs.length };
}

export function CapabilityRoadmap({
  progressCache,
  wrongBookCache,
  onOpenBreaker,
  onOpenModule,
  onOpenDoc,
  onOpenDrill,
  onOpenWrongBook,
}) {
  const model = TENCENT_FRONTEND_CAPABILITY_MODEL;
  const capabilityStates = model.capabilities.map(capability => ({
    capability,
    state: getCapabilityState(capability, progressCache, wrongBookCache),
  }));
  const totalDocs = capabilityStates.reduce((sum, item) => sum + item.state.docLinks.length, 0);
  const doneDocs = capabilityStates.reduce((sum, item) => sum + item.state.doneCount, 0);
  const wrongCount = Object.keys(wrongBookCache).length;
  const weakest = [...capabilityStates]
    .filter(item => item.state.docLinks.length)
    .sort((a, b) => a.state.percent - b.state.percent || b.state.wrongCount - a.state.wrongCount)[0];

  function handlePhaseAction(action) {
    if (action === 'breaker') onOpenBreaker();
    if (action === 'learn') onOpenModule(LEARNING_CONTENT.modules[0]?.id);
    if (action === 'drill') onOpenDrill();
    if (action === 'wrongbook') onOpenWrongBook();
    if (action === 'project') {
      const projectModule = findModule('project-prep-special');
      if (projectModule) onOpenModule(projectModule.id);
      else onOpenModule(LEARNING_CONTENT.modules[0]?.id);
    }
  }

  return (
    <div className="max-w-[1180px] mx-auto grid gap-6.5">
      <section className="flex max-md:flex-col items-end max-md:items-stretch justify-between gap-6 py-4.5 px-0 pb-2 border-b border-border">
        <div>
          <div className="text-secondary text-[12px] font-bold mb-2">学习方向校准</div>
          <h1 className="text-[30px] font-bold leading-tight mb-2.5 text-text-strong">{model.title}</h1>
          <p className="max-w-[680px] text-text-secondary leading-relaxed text-[14px]">{model.subtitle}</p>
        </div>
        <div className="flex gap-2.5 flex-wrap justify-end">
          <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover" onClick={onOpenBreaker}>打开技术破冰</button>
          <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={onOpenDrill}>小批量刷题</button>
        </div>
      </section>

      <section className="grid grid-cols-4 max-md:grid-cols-1 gap-3">
        <div className="border border-border rounded-lg bg-surface p-4 grid gap-1.5">
          <span className="color-text2 text-[12px] font-bold">能力维度</span>
          <strong className="text-text text-[24px] leading-tight">{model.capabilities.length}</strong>
          <span className="text-text-secondary text-[12px] leading-normal">按腾讯中高级前端面试拆分</span>
        </div>
        <div className="border border-border rounded-lg bg-surface p-4 grid gap-1.5">
          <span className="color-text2 text-[12px] font-bold">关键文档进度</span>
          <strong className="text-text text-[24px] leading-tight">{doneDocs}/{totalDocs}</strong>
          <span className="text-text-secondary text-[12px] leading-normal">来自当前学习系统已有内容</span>
        </div>
        <div className="border border-border rounded-lg bg-surface p-4 grid gap-1.5">
          <span className="color-text2 text-[12px] font-bold">错题复训</span>
          <strong className="text-text text-[24px] leading-tight">{wrongCount}</strong>
          <span className="text-text-secondary text-[12px] leading-normal">优先从错题最多的能力维度回补</span>
        </div>
        <div className="border border-secondary/45 rounded-lg bg-gradient-to-br from-secondary/12 to-primary/8 bg-surface p-4 grid gap-1.5">
          <span className="color-text2 text-[12px] font-bold">下一步建议</span>
          <strong className="text-text text-[24px] leading-tight">{weakest?.capability.name || '先建立地图'}</strong>
          <span className="text-text-secondary text-[12px] leading-normal">{weakest ? `当前完成 ${weakest.state.percent}%` : '从技术破冰开始'}</span>
        </div>
      </section>

      <section className="grid grid-cols-3 max-md:grid-cols-1 gap-3">
        {model.principles.map(item => (
          <div className="border-l-3 border-primary rounded-r-lg bg-surface p-3 px-4 text-[13px] text-text-secondary" key={item}>{item}</div>
        ))}
      </section>

      <section className="grid gap-4.5">
        <div className="mb-1">
          <h2 className="text-[20px] font-bold mb-1.5 text-text-strong">能力模型</h2>
          <p className="text-[13px] text-text-secondary">每个能力都绑定已有文档、专项刷题和腾讯面试追问，避免只收藏资料不校准输出。</p>
        </div>
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3.5">
          {capabilityStates.map(({ capability, state }) => {
            const primaryDoc = state.firstUndone;
            const primaryModule = getModuleProgress(capability.drillModuleIds[0], progressCache)?.module;
            return (
              <article className="border border-border rounded-lg bg-surface p-4.5 grid gap-3" key={capability.id}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-[17px] font-semibold leading-snug text-text-strong">{capability.name}</h3>
                  <span className="text-secondary text-[18px] font-extrabold">{state.percent}%</span>
                </div>
                <p className="text-text-secondary text-[13px] leading-relaxed">{capability.levelTarget}</p>
                <div className="h-1.25 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-inherit bg-gradient-to-r from-primary to-secondary" style={{ width: `${state.percent}%` }} />
                </div>
                <div className="flex gap-2 flex-wrap text-text-secondary text-[12px]">
                  <span>{state.doneCount}/{state.docLinks.length || 0} 关键文档</span>
                  <span>·</span>
                  <span>{state.wrongCount} 道相关错题</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {capability.focus.map(item => <span className="rounded-full bg-surface-alt text-text-secondary px-2.25 py-1 text-[11px]" key={item}>{item}</span>)}
                </div>
                <div className="grid gap-1.5 text-text-secondary text-[12px] leading-relaxed">
                  {capability.interviewSignals.map(signal => (
                    <div className="flex items-center gap-2" key={signal}>
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 flex-wrap pt-0.5 border-t border-border/40 pt-2">
                  {state.docLinks.slice(0, 5).map(({ module, docIdx, doc }) => (
                    <button key={`${module.id}-${docIdx}`} className="border border-border rounded-[7px] bg-transparent text-text-secondary cursor-pointer text-[12px] leading-normal p-1.25 px-2 max-w-full text-left transition-all duration-150 hover:border-primary hover:text-primary" onClick={() => onOpenDoc(module.id, docIdx)}>
                      {doc.title}
                    </button>
                  ))}
                  {!state.docLinks.length && <span className="text-text-secondary text-[12px]">当前公开内容中暂无可用文档</span>}
                </div>
                <div className="flex gap-2 flex-wrap pt-0.5">
                  {primaryDoc && (
                    <button className="border border-primary bg-primary text-white rounded-[7px] p-1.25 px-2.25 text-[12px] font-semibold cursor-pointer transition-all duration-180 hover:bg-primary-hover hover:border-primary-hover" onClick={() => onOpenDoc(primaryDoc.module.id, primaryDoc.docIdx)}>
                      学下一篇
                    </button>
                  )}
                  {primaryModule && (
                    <button className="border border-border bg-surface-alt text-text-secondary rounded-[7px] p-1.25 px-2.25 text-[12px] font-semibold cursor-pointer transition-all duration-180 hover:border-primary hover:text-primary" onClick={() => onOpenDrill(primaryModule.id)}>
                      刷专项题
                    </button>
                  )}
                  {state.wrongCount > 0 && (
                    <button className="border border-border bg-transparent text-text-secondary rounded-[7px] p-1.25 px-2.25 text-[12px] font-semibold cursor-pointer transition-all duration-180 hover:border-primary hover:text-primary" onClick={() => onOpenWrongBook(capability.drillModuleIds[0])}>
                      错题复训
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4.5">
        <div className="mb-1">
          <h2 className="text-[20px] font-bold mb-1.5 text-text-strong">推荐学习路径</h2>
          <p className="text-[13px] text-text-secondary">每一轮学习都保持“地图 - 深文 - 小题量校准 - 项目追问 - 错题复训”的节奏。</p>
        </div>
        <div className="grid gap-2.5">
          {model.roadmapPhases.map((phase, idx) => (
            <div className="grid grid-cols-[42px_minmax(0,1fr)_auto] max-md:grid-cols-1 gap-3.5 items-center border border-border rounded-lg bg-surface p-3.5" key={phase.id}>
              <div className="w-8.5 h-8.5 rounded-full grid place-items-center bg-surface-alt text-secondary font-extrabold text-[15px]">{idx + 1}</div>
              <div className="flex flex-col">
                <h3 className="text-[15px] font-bold mb-1 text-text-strong">{phase.name}</h3>
                <p className="text-text-secondary text-[12px] leading-relaxed">{phase.goal}</p>
                <div className="flex gap-1.75 flex-wrap my-2">
                  {phase.actions.map(action => <span className="bg-surface-alt rounded-full text-text-secondary text-[11px] px-2 py-0.5" key={action}>{action}</span>)}
                </div>
                <div className="text-text-secondary text-[12px] leading-relaxed font-semibold text-secondary">{phase.output}</div>
              </div>
              <button className="border border-border bg-surface-alt text-text-secondary rounded-[7px] p-1.5 px-3.5 text-[12px] font-semibold cursor-pointer transition-all duration-180 hover:border-primary hover:text-primary max-md:w-full" onClick={() => handlePhaseAction(phase.primaryAction)}>进入</button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4.5">
        <div className="mb-1">
          <h2 className="text-[20px] font-bold mb-1.5 text-text-strong">腾讯追问校准</h2>
          <p className="text-[13px] text-text-secondary">刷题结束后，用这些追问检查自己能不能从“知道答案”走到“能解决客户问题”。</p>
        </div>
        <div className="grid grid-cols-3 max-md:grid-cols-1 gap-3">
          {model.capabilities.map(capability => (
            <div className="border border-border rounded-lg bg-surface p-3.75" key={capability.id}>
              <h3 className="text-[14px] font-semibold mb-2.5 text-text-strong">{capability.name}</h3>
              {capability.tencentFollowups.map(question => <p className="text-text-secondary text-[12px] leading-relaxed mb-2 last:mb-0" key={question}>{question}</p>)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

