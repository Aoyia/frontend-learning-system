import React from 'react';
import { LEARNING_CONTENT } from '../../data/learning-content.js';

export default function WrongBookPage({ wrongBookCache, onStartWrongBook, onReadChapter }) {
  const records = Object.values(wrongBookCache).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const total = records.length;
  const moduleStats = LEARNING_CONTENT.modules.map(module => ({
    module,
    count: records.filter(record => record.moduleId === module.id).length,
  }));

  if (!total) {
    return (
      <div className="module-select-page">
        <h2>🧩 错题本</h2>
        <p>错题会在作业和刷题提交后自动收集，答对后自动移出错题本。</p>
        <div className="empty-state">
          <div className="icon">✓</div>
          <p>当前没有错题。可以先去学习或刷题，系统会自动记录需要复习的题目。</p>
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => onStartWrongBook()}>开始错题练习</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-select-page">
      <h2>🧩 错题本</h2>
      <p>当前共 {total} 道错题。优先练错题，答对后自动移出错题本，再回推荐章节补知识点。</p>
      <div className="module-select-cards">
        <div className="module-select-card" onClick={() => onStartWrongBook()}>
          <div className="icon">🔥</div>
          <div className="name">全部错题</div>
          <div className="count">{total} 题 · 综合复盘</div>
        </div>
        {moduleStats.filter(item => item.count > 0).map(({ module, count }) => (
          <div className="module-select-card" key={module.id} onClick={() => onStartWrongBook(module.id)}>
            <div className="icon">{module.icon}</div>
            <div className="name">{module.name}</div>
            <div className="count">{count} 题 · 针对练习</div>
          </div>
        ))}
      </div>
      <div className="wrongbook-list">
        {records.slice(0, 12).map(record => (
          <div className="wrongbook-item" key={record.qid}>
            <div className="wrongbook-item-main">
              <div className="wrongbook-item-title">{record.question}</div>
              <div className="wrongbook-item-meta">
                {record.moduleName} / {record.docTitle} · 错 {record.wrongCount || 1} 次
              </div>
            </div>
            <button className="btn btn-outline" onClick={() => onReadChapter(record.moduleId, record.docIdx)}>复习章节</button>
          </div>
        ))}
      </div>
    </div>
  );
}
