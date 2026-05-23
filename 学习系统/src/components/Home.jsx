import React from 'react';
import { LEARNING_CONTENT } from '../../data/learning-content.js';

export default function Home({ progressCache, onOpenModule }) {
  return (
    <div className="home">
      <div className="home-hero">
        <h1>🚀 前端工程知识学习系统</h1>
        <p>系统性学习 CI/CD、DevOps、Jenkins 等核心知识，学完即测，模块刷题</p>
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
