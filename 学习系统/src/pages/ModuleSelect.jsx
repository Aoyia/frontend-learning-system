import { LEARNING_CONTENT } from '../../data/learning-content.js';

export function ModuleSelect({ progressCache, onOpenModule }) {
  return (
    <div className="max-w-[700px] mx-auto">
      <h2 className="text-[22px] font-bold mb-1.5 text-text-strong">选择学习模块</h2>
      <p className="text-text-secondary text-[13px] mb-6">每个模块包含多篇连续性文档，学完每篇后有随堂作业</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {LEARNING_CONTENT.modules.map(m => {
          const total = m.docs.length;
          const done = m.docs.filter((_, i) => progressCache[`${m.id}__${i}`]).length;
          return (
            <div className="bg-surface border-2 border-border rounded-xl p-4 cursor-pointer transition-all duration-200 text-center hover:border-primary" key={m.id} onClick={() => onOpenModule(m.id)}>
              <div className="text-[24px] mb-2">{m.icon}</div>
              <div className="text-[14px] font-semibold text-text-strong">{m.name}</div>
              <div className="text-[12px] text-text-secondary mt-1">{total} 篇 · {done} 已读</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
