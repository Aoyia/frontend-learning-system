import { LEARNING_CONTENT } from '../../data/learning-content.js';

export function ModuleSelect({ progressCache, onOpenModule }) {
  return (
    <div className="module-select-page">
      <h2>选择学习模块</h2>
      <p>每个模块包含多篇连续性文档，学完每篇后有随堂作业</p>
      <div className="module-select-cards">
        {LEARNING_CONTENT.modules.map(m => {
          const total = m.docs.length;
          const done = m.docs.filter((_, i) => progressCache[`${m.id}__${i}`]).length;
          return (
            <div className="module-select-card" key={m.id} onClick={() => onOpenModule(m.id)}>
              <div className="icon">{m.icon}</div>
              <div className="name">{m.name}</div>
              <div className="count">{total} 篇 · {done} 已读</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
