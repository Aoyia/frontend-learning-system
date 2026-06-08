import React, { useState, useEffect } from 'react';
import { LEARNING_CONTENT } from '../../data/learning-content.js';

export default function Sidebar({ currentModuleId, currentDocIdx, progressCache, onNavToDoc }) {
  const [openModules, setOpenModules] = useState(() => new Set([currentModuleId]));

  useEffect(() => {
    setOpenModules(prev => new Set([...prev, currentModuleId]));
  }, [currentModuleId]);

  return (
    <aside data-component="sidebar" className="hidden md:block w-[260px] min-w-[260px] bg-surface border-r border-border overflow-y-auto pb-4">
      {LEARNING_CONTENT.modules.map(m => {
        const isOpen = openModules.has(m.id);
        return (
          <div data-element="module-group" data-state={isOpen ? 'open' : 'closed'} className="mb-1" key={m.id}>
            <div
              data-element="module-header"
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-text-secondary cursor-pointer uppercase tracking-wider select-none hover:text-text"
              onClick={() => setOpenModules(prev => {
                const next = new Set(prev);
                if (next.has(m.id)) next.delete(m.id);
                else next.add(m.id);
                return next;
              })}
            >
              <span>{m.icon}</span> {m.name}
              <span className={`ml-auto transition-transform duration-200 text-[10px] ${isOpen ? 'rotate-90' : ''}`}>▶</span>
            </div>
            <div className={`hidden ${isOpen ? '!block' : ''}`}>
              {m.docs.length === 0 ? (
                <div className="py-3.5 px-6 text-[12px] text-text-secondary italic leading-relaxed text-center border-l-2 border-transparent">
                  📂 章节目录为空，请检查右上角 🔒 的 Token 配置或网络连接。
                </div>
              ) : (
                m.docs.map((doc, i) => {
                  const done = progressCache[`${m.id}__${i}`];
                  const active = m.id === currentModuleId && i === currentDocIdx;
                  const itemState = active ? 'active' : (done ? 'done' : 'pending');
                  return (
                    <div
                      key={doc.title}
                      data-element="doc-item"
                      data-state={itemState}
                      className={`flex items-center gap-2.5 py-2 pr-4 pl-7 text-[13px] text-text-secondary cursor-pointer border-l-2 border-transparent transition-all duration-150 hover:bg-surface-alt hover:text-text ${active ? 'bg-primary-light text-primary border-primary' : ''}`}
                      onClick={() => onNavToDoc(m.id, i)}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${done ? 'bg-success' : 'bg-border'}`} />
                      <span>{doc.title}</span>
                      <span className="text-[11px] text-text-secondary ml-auto">{i + 1}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
