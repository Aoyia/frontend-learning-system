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
    <div className="roadmap-page">
      <section className="roadmap-hero">
        <div>
          <div className="roadmap-kicker">学习方向校准</div>
          <h1>{model.title}</h1>
          <p>{model.subtitle}</p>
        </div>
        <div className="roadmap-hero-actions">
          <button className="btn btn-primary" onClick={onOpenBreaker}>打开技术破冰</button>
          <button className="btn btn-outline" onClick={onOpenDrill}>小批量刷题</button>
        </div>
      </section>

      <section className="roadmap-summary-grid">
        <div className="roadmap-summary-card">
          <span className="summary-label">能力维度</span>
          <strong>{model.capabilities.length}</strong>
          <span>按腾讯中高级前端面试拆分</span>
        </div>
        <div className="roadmap-summary-card">
          <span className="summary-label">关键文档进度</span>
          <strong>{doneDocs}/{totalDocs}</strong>
          <span>来自当前学习系统已有内容</span>
        </div>
        <div className="roadmap-summary-card">
          <span className="summary-label">错题复训</span>
          <strong>{wrongCount}</strong>
          <span>优先从错题最多的能力维度回补</span>
        </div>
        <div className="roadmap-summary-card emphasis">
          <span className="summary-label">下一步建议</span>
          <strong>{weakest?.capability.name || '先建立地图'}</strong>
          <span>{weakest ? `当前完成 ${weakest.state.percent}%` : '从技术破冰开始'}</span>
        </div>
      </section>

      <section className="roadmap-principles">
        {model.principles.map(item => (
          <div className="principle-item" key={item}>{item}</div>
        ))}
      </section>

      <section className="roadmap-section">
        <div className="roadmap-section-header">
          <h2>能力模型</h2>
          <p>每个能力都绑定已有文档、专项刷题和腾讯面试追问，避免只收藏资料不校准输出。</p>
        </div>
        <div className="capability-grid">
          {capabilityStates.map(({ capability, state }) => {
            const primaryDoc = state.firstUndone;
            const primaryModule = getModuleProgress(capability.drillModuleIds[0], progressCache)?.module;
            return (
              <article className="capability-card" key={capability.id}>
                <div className="capability-card-top">
                  <h3>{capability.name}</h3>
                  <span>{state.percent}%</span>
                </div>
                <p className="capability-target">{capability.levelTarget}</p>
                <div className="capability-progress">
                  <div style={{ width: `${state.percent}%` }} />
                </div>
                <div className="capability-meta">
                  <span>{state.doneCount}/{state.docLinks.length || 0} 关键文档</span>
                  <span>{state.wrongCount} 道相关错题</span>
                </div>
                <div className="capability-focus">
                  {capability.focus.map(item => <span key={item}>{item}</span>)}
                </div>
                <div className="capability-signals">
                  {capability.interviewSignals.map(signal => <div key={signal}>{signal}</div>)}
                </div>
                <div className="capability-docs">
                  {state.docLinks.slice(0, 5).map(({ module, docIdx, doc }) => (
                    <button key={`${module.id}-${docIdx}`} onClick={() => onOpenDoc(module.id, docIdx)}>
                      {doc.title}
                    </button>
                  ))}
                  {!state.docLinks.length && <span>当前公开内容中暂无可用文档</span>}
                </div>
                <div className="capability-actions">
                  {primaryDoc && (
                    <button className="mini-btn primary" onClick={() => onOpenDoc(primaryDoc.module.id, primaryDoc.docIdx)}>
                      学下一篇
                    </button>
                  )}
                  {primaryModule && (
                    <button className="mini-btn" onClick={() => onOpenDrill(primaryModule.id)}>
                      刷专项题
                    </button>
                  )}
                  {state.wrongCount > 0 && (
                    <button className="mini-btn ghost" onClick={() => onOpenWrongBook(capability.drillModuleIds[0])}>
                      错题复训
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="roadmap-section">
        <div className="roadmap-section-header">
          <h2>推荐学习路径</h2>
          <p>每一轮学习都保持“地图 - 深文 - 小题量校准 - 项目追问 - 错题复训”的节奏。</p>
        </div>
        <div className="roadmap-phase-list">
          {model.roadmapPhases.map((phase, idx) => (
            <div className="roadmap-phase" key={phase.id}>
              <div className="phase-index">{idx + 1}</div>
              <div className="phase-body">
                <h3>{phase.name}</h3>
                <p>{phase.goal}</p>
                <div className="phase-actions">
                  {phase.actions.map(action => <span key={action}>{action}</span>)}
                </div>
                <div className="phase-output">{phase.output}</div>
              </div>
              <button className="mini-btn" onClick={() => handlePhaseAction(phase.primaryAction)}>进入</button>
            </div>
          ))}
        </div>
      </section>

      <section className="roadmap-section">
        <div className="roadmap-section-header">
          <h2>腾讯追问校准</h2>
          <p>刷题结束后，用这些追问检查自己能不能从“知道答案”走到“能解决客户问题”。</p>
        </div>
        <div className="followup-grid">
          {model.capabilities.map(capability => (
            <div className="followup-card" key={capability.id}>
              <h3>{capability.name}</h3>
              {capability.tencentFollowups.map(question => <p key={question}>{question}</p>)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
