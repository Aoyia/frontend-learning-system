import React, { useState, useEffect } from 'react';
import { LEARNING_CONTENT } from '../../data/learning-content.js';

export default function Sidebar({ currentModuleId, currentDocIdx, progressCache, onNavToDoc }) {
  const [openModules, setOpenModules] = useState(() => new Set([currentModuleId]));

  useEffect(() => {
    setOpenModules(prev => new Set([...prev, currentModuleId]));
  }, [currentModuleId]);

  return (
    <aside className="sidebar">
      {LEARNING_CONTENT.modules.map(m => {
        const isOpen = openModules.has(m.id);
        return (
          <div className="sidebar-module" key={m.id}>
            <div
              className={`sidebar-module-header ${isOpen ? 'open' : ''}`}
              onClick={() => setOpenModules(prev => {
                const next = new Set(prev);
                if (next.has(m.id)) next.delete(m.id);
                else next.add(m.id);
                return next;
              })}
            >
              <span>{m.icon}</span> {m.name}
              <span className="chevron">▶</span>
            </div>
            <div className={`sidebar-module-list ${isOpen ? 'open' : ''}`}>
              {m.docs.map((doc, i) => {
                const done = progressCache[`${m.id}__${i}`];
                const active = m.id === currentModuleId && i === currentDocIdx;
                return (
                  <div
                    key={doc.title}
                    className={`sidebar-item ${done ? 'done' : ''} ${active ? 'active' : ''}`}
                    onClick={() => onNavToDoc(m.id, i)}
                  >
                    <span className="dot" />
                    <span>{doc.title}</span>
                    <span className="item-idx">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
