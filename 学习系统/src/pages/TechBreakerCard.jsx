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
      <div className="w-full mx-auto max-w-[800px]">
        <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={onBack}>返回技术破冰地图</button>
        <div className="text-center py-15 text-text-secondary">
          <p>没有找到对应的技术破冰卡片。</p>
        </div>
      </div>
    );
  }

  const quizCount = card.quiz?.length || 0;
  const diffClass = getDifficultyClass(card.difficulty);
  const diffBadgeColor = diffClass === 'easy' ? 'bg-success-light text-success' : diffClass === 'medium' ? 'bg-warning-light text-warning' : 'bg-danger-light text-danger';

  return (
    <div data-component="tech-breaker-card" className="grid grid-cols-1 xl:grid-cols-[minmax(0,800px)_220px] max-w-[1080px] gap-7 items-start justify-center mx-auto">
      <div className="w-full mx-auto max-w-[800px]">
        <div className="mb-6 pb-5 border-b border-border">
          <div className="text-[12px] text-text-secondary mb-2">
            <span className="cursor-pointer hover:text-primary" onClick={onHome}>首页</span> / <span className="cursor-pointer hover:text-primary" onClick={onBack}>技术破冰地图</span> / {card.title}
          </div>
          <div className="text-[26px] font-bold mb-2 text-text-strong">{card.title}</div>
          <div className="flex gap-3 flex-wrap items-center">
            <span className="text-[12px] px-2.5 py-0.5 rounded-[20px] bg-primary-light text-primary">技术破冰</span>
            {card.difficulty && <span className={`inline-flex items-center px-2 py-0.5 rounded-[20px] text-[11px] font-semibold ${diffBadgeColor}`}>{card.difficulty}</span>}
            <span className="text-[12px] px-2.5 py-0.5 rounded-[20px] bg-surface-alt text-text-secondary">Canvas 节点：{nodeId}</span>
          </div>
        </div>

        <div className="md-body" dangerouslySetInnerHTML={{ __html: rendered.html }} />

        <div className="mt-6 p-4 px-5 bg-success-light border border-success/30 rounded-xl flex items-center justify-between gap-4 max-md:flex-col max-md:items-stretch">
          <div className="text-[14px] text-success font-semibold">这张卡片用于破冰导读。读完后可以做卡片自测，或回到地图继续按知识关系浏览。</div>
          <div className="flex gap-2.5 flex-wrap">
            <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={onBack}>返回地图</button>
            <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed" disabled={!quizCount} onClick={() => onStartQuiz(nodeId)}>
              {quizCount ? `开始卡片自测（${quizCount} 题）` : '暂无自测题'}
            </button>
          </div>
        </div>
      </div>
      <ArticleToc items={rendered.tocItems} />
    </div>
  );
}
