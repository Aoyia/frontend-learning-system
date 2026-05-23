import React, { useMemo } from 'react';
import { renderMarkdownWithHeadings } from '../utils/markdown.js';
import { getDifficultyClass } from '../utils/quiz.js';
import { getBreakerCard } from '../utils/techBreaker.js';
import { ArticleToc } from '../components/ArticleToc.jsx';

export function TechBreakerCard({ nodeId, onBack, onHome, onStartQuiz }) {
  const card = getBreakerCard(nodeId);
  const rendered = useMemo(() => renderMarkdownWithHeadings(card?.content || ''), [card?.content]);
  if (!card) {
    return (
      <div className="article-wrap">
        <button className="btn btn-outline" onClick={onBack}>返回技术破冰地图</button>
        <div className="empty-state">
          <p>没有找到对应的技术破冰卡片。</p>
        </div>
      </div>
    );
  }

  const quizCount = card.quiz?.length || 0;

  return (
    <div className="article-shell">
      <div className="article-wrap breaker-card-wrap">
        <div className="article-header">
          <div className="article-breadcrumb">
            <span onClick={onHome}>首页</span> / <span onClick={onBack}>技术破冰地图</span> / {card.title}
          </div>
          <div className="article-title">{card.title}</div>
          <div className="article-meta">
            <span className="article-tag accent">技术破冰</span>
            {card.difficulty && <span className={`badge badge-${getDifficultyClass(card.difficulty)}`}>{card.difficulty}</span>}
            <span className="article-tag">Canvas 节点：{nodeId}</span>
          </div>
        </div>

        <div className="md-body" dangerouslySetInnerHTML={{ __html: rendered.html }} />

        <div className="done-banner">
          <div className="done-banner-text">这张卡片用于破冰导读。读完后可以做卡片自测，或回到地图继续按知识关系浏览。</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={onBack}>返回地图</button>
            <button className="btn btn-primary" disabled={!quizCount} onClick={() => onStartQuiz(nodeId)}>
              {quizCount ? `开始卡片自测（${quizCount} 题）` : '暂无自测题'}
            </button>
          </div>
        </div>
      </div>
      <ArticleToc items={rendered.tocItems} />
    </div>
  );
}
