import React from 'react';
import { LEARNING_CONTENT } from '../../data/learning-content.js';
import { DEFAULT_DRILL_LIMIT, QUICK_DRILL_LIMIT } from '../utils/quiz.js';

export default function DrillSelect({ drillStatCache, onStartDrill }) {
  return (
    <div className="module-select-page">
      <h2>🎯 模块刷题</h2>
      <p>默认轻量练习 20 题，先完成一小批，再根据错题和未练题持续循环。</p>
      <div className="module-select-cards">
        {LEARNING_CONTENT.modules.map(m => {
          const total = m.docs.reduce((n, d) => n + (d.quiz ? d.quiz.length : 0), 0);
          const allQids = [];
          m.docs.forEach((d, di) => (d.quiz || []).forEach((_, qi) => allQids.push(`${m.id}__${di}__${qi}`)));
          const done = allQids.filter(id => drillStatCache[id]).length;
          const latestCorrect = allQids.filter(id => drillStatCache[id]?.lastCorrect).length;
          const latestPct = done ? Math.round((latestCorrect / done) * 100) : 0;
          return (
            <div className="module-select-card" key={m.id} onClick={() => onStartDrill(m.id, DEFAULT_DRILL_LIMIT)}>
              <div className="icon">{m.icon}</div>
              <div className="name">{m.name}</div>
              <div className="count">{total} 题 · 已练 {done} · 最近正确率 {latestPct}%</div>
              <div className="module-card-actions">
                <button className="mini-btn primary" onClick={(e) => { e.stopPropagation(); onStartDrill(m.id, DEFAULT_DRILL_LIMIT); }}>
                  练 {Math.min(DEFAULT_DRILL_LIMIT, total)} 题
                </button>
                <button className="mini-btn" onClick={(e) => { e.stopPropagation(); onStartDrill(m.id, QUICK_DRILL_LIMIT); }}>
                  短练 {Math.min(QUICK_DRILL_LIMIT, total)}
                </button>
                <button className="mini-btn ghost" onClick={(e) => { e.stopPropagation(); onStartDrill(m.id, null); }}>
                  全量复盘
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
