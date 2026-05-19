import { LEARNING_CONTENT } from '../../data/learning-content.js';

export function Home({ progressCache, onOpenBreaker, onOpenModule }) {
  return (
    <div className="home">
      <div className="home-hero">
        <h1>🚀 中高级前端学习与面试校准系统</h1>
        <p>先用技术破冰建立知识地图，再进入专题学习、作业、自测和错题复盘。</p>
      </div>
      <div className="home-entry-grid">
        <button className="home-entry-card primary" onClick={onOpenBreaker}>
          <span className="home-entry-icon">🗺️</span>
          <span className="home-entry-title">技术破冰地图</span>
          <span className="home-entry-desc">按 Obsidian Canvas 浏览知识图谱，从节点进入破冰卡片。</span>
        </button>
        <button className="home-entry-card" onClick={() => onOpenModule(LEARNING_CONTENT.modules[0]?.id)}>
          <span className="home-entry-icon">📖</span>
          <span className="home-entry-title">系统学习模块</span>
          <span className="home-entry-desc">进入深度长文、博客文档、作业和模块刷题。</span>
        </button>
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
