import React, { useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { renderMarkdownWithHeadings } from '../utils/markdown.js';
import { getDifficultyClass, sourceTypeLabel } from '../utils/quiz.js';
import { ArticleToc } from '../components/ArticleToc.jsx';

export function Article({ 
  module, 
  docIdx, 
  progressCache, 
  onHome, 
  onModuleHome, 
  onNavToDoc, 
  onMarkDone, 
  onStartQuiz, 
  onStartOralDrill,
  onGoDrill, 
  immersiveMode, 
  onToggleImmersive, 
  customScrollTo 
}) {
  const doc = module.docs[docIdx];
  const location = useLocation();
  const navigate = useNavigate();
  const hasExpression = useMemo(() => (doc.quiz || []).some(q => q.type === 'expression'), [doc]);

  useEffect(() => {
    if (!doc || !location.hash) return;

    // 延迟 150ms 确保 markdown DOM 已完全渲染并挂载
    const timer = setTimeout(() => {
      try {
        const id = decodeURIComponent(location.hash.slice(1));
        const element = document.getElementById(id);
        if (element) {
          if (customScrollTo) {
            customScrollTo(element);
          } else {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      } catch (e) {
        console.error('Failed to scroll to hash anchor:', e);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [location.hash, doc?.content, customScrollTo]); // 监听 hash 与文章内容数据的变化
  
  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-secondary max-w-md mx-auto min-h-[40vh]">
        <span className="text-4xl mb-4">⚠️</span>
        <h3 className="text-lg font-bold text-text-strong mb-2">文章暂未加载或不存在</h3>
        <p className="text-[13px] leading-relaxed mb-5">
          请检查您的网络连接是否顺畅，或者点击页面右上角的 🔒 锁图标，重新检查并保存您的 GitHub 个人访问令牌 (PAT) 与仓库配置。
        </p>
        <button 
          className="px-4 py-2 rounded-lg border border-border bg-surface hover:bg-surface-alt transition-colors duration-150 cursor-pointer text-[13px] font-semibold text-text-strong" 
          onClick={onHome}
        >
          返回首页
        </button>
      </div>
    );
  }

  const isDone = progressCache[`${module.id}__${docIdx}`];
  const prev = docIdx > 0 ? module.docs[docIdx - 1] : null;
  const next = docIdx < module.docs.length - 1 ? module.docs[docIdx + 1] : null;
  const rendered = useMemo(() => renderMarkdownWithHeadings(doc.content), [doc.content]);
  const meta = doc.docMeta || {};
  const sourceLabel = sourceTypeLabel(meta.sourceType);

  const diffClass = getDifficultyClass(doc.difficulty);
  const diffBadgeColor = diffClass === 'easy' ? 'bg-success-light text-success' : diffClass === 'medium' ? 'bg-warning-light text-warning' : 'bg-danger-light text-danger';

  return (
    <div data-component="article-page" className={`grid grid-cols-1 ${immersiveMode ? 'lg:grid-cols-[minmax(0,720px)_220px] xl:grid-cols-[220px_minmax(0,720px)_220px] max-w-[720px] lg:max-w-[968px] xl:max-w-[1220px]' : 'min-[1360px]:grid-cols-[minmax(0,800px)_220px] max-w-[800px] min-[1360px]:max-w-[1080px]'} gap-7 items-start justify-center mx-auto`}>
      {immersiveMode && <div className="hidden xl:block" />}
      <div className={`w-full mx-auto ${immersiveMode ? 'max-w-[720px]' : 'max-w-[800px]'}`}>
        <div data-element="article-meta" className="mb-6 pb-5 border-b border-border">
          <div data-element="breadcrumb" className="text-[12px] text-text-secondary mb-2">
            <span className="cursor-pointer hover:text-primary" onClick={onHome}>首页</span> / <span className="cursor-pointer hover:text-primary" onClick={onModuleHome}>{module.name}</span> / {doc.title}
          </div>
          <div className="text-[26px] font-bold mb-2 text-text-strong">{doc.title}</div>
          <div className="flex gap-3 flex-wrap items-center">
            <span className="text-[12px] px-2.5 py-0.5 rounded-[20px] bg-primary-light text-primary">{module.name}</span>
            <span className="text-[12px] px-2.5 py-0.5 rounded-[20px] bg-surface-alt text-text-secondary">{docIdx + 1} / {module.docs.length}</span>
            {doc.difficulty && <span className={`inline-flex items-center px-2 py-0.5 rounded-[20px] text-[11px] font-semibold ${diffBadgeColor}`}>{doc.difficulty}</span>}
            {sourceLabel && <span className="text-[12px] px-2.5 py-0.5 rounded-[20px] bg-success-light text-success">{sourceLabel}</span>}
            {meta.updated && <span className="text-[12px] px-2.5 py-0.5 rounded-[20px] bg-surface-alt text-text-secondary">更新 {meta.updated}</span>}
            {isDone && <span className="inline-flex items-center px-2 py-0.5 rounded-[20px] text-[11px] font-semibold bg-success-light text-success">✓ 已读</span>}
            <button className="flex items-center gap-1.25 bg-transparent border border-border rounded-md px-2.5 py-1 cursor-pointer text-[12px] text-text-secondary transition-all duration-150 whitespace-nowrap hover:border-primary hover:text-primary" onClick={onToggleImmersive} title={immersiveMode ? '退出专注模式 (Esc)' : '进入专注阅读模式'}>
              {immersiveMode ? '⊠ 退出专注' : '⊡ 专注阅读'}
            </button>
          </div>
          {(meta.sourceTitle || meta.sourceAuthor || meta.sourceUrl || meta.originalPath) && (
            <div className="mt-3.5 p-3 px-3.5 border border-border rounded-lg bg-surface-alt text-text-secondary text-[12px] grid gap-1.5">
              {meta.sourceTitle && <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2 items-start"><span>来源标题</span>{meta.sourceTitle}</div>}
              {meta.sourceAuthor && <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2 items-start"><span>作者</span>{meta.sourceAuthor}</div>}
              {meta.sourceUrl && (
                <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2 items-start">
                  <span>原文链接</span>
                  <a className="text-primary break-all no-underline hover:underline" href={meta.sourceUrl} target="_blank" rel="noopener noreferrer">{meta.sourceUrl}</a>
                </div>
              )}
              {meta.originalPath && <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2 items-start"><span>原始位置</span>{meta.originalPath}</div>}
            </div>
          )}
        </div>
        <div data-element="article-body" className="md-body" dangerouslySetInnerHTML={{ __html: rendered.html }} />

        {!isDone && (
          <div data-element="read-actions" className="mt-6 p-4 px-5 bg-success-light border border-success/30 rounded-xl flex items-center justify-between gap-4 flex-wrap">
            <div className="text-[14px] text-success font-semibold">📖 读完了吗？标记为已读，并做随堂作业</div>
            <div className="flex gap-2.5 flex-wrap">
              <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={() => onMarkDone(module.id, docIdx, false)}>仅标记已读</button>
              {hasExpression && (
                <button 
                  className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-bold transition-all duration-200 text-white hover:brightness-110 active:scale-95" 
                  style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
                  onClick={() => { onMarkDone(module.id, docIdx, false); onStartOralDrill(module.id, docIdx); }}
                >
                  🔮 开始口试演练
                </button>
              )}
              <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover" onClick={() => onMarkDone(module.id, docIdx, true)}>已读 + 开始作业</button>
            </div>
          </div>
        )}

        {isDone && (
          <div data-element="read-actions" className="mt-6 flex gap-2.5 flex-wrap">
            {hasExpression && (
              <button 
                className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-bold transition-all duration-200 text-white hover:brightness-110 active:scale-95" 
                style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
                onClick={() => onStartOralDrill(module.id, docIdx)}
              >
                🔮 开始口试表达演练
              </button>
            )}
            <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={() => onStartQuiz(module.id, docIdx)}>做随堂作业</button>
            <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={onGoDrill}>去模块刷题</button>
          </div>
        )}

        <div data-element="prev-next" className="flex justify-between mt-10 pt-5 border-t border-border gap-3">
          {prev ? (
            <button className="flex-1 p-3 px-4 bg-surface border border-border rounded-xl cursor-pointer transition-all duration-200 text-[13px] text-text-secondary text-left hover:border-primary hover:text-text" onClick={() => onNavToDoc(module.id, docIdx - 1)}>
              <div className="text-[11px] text-text-secondary mb-1">← 上一篇</div>
              <div className="font-semibold text-text-strong">{prev.title}</div>
            </button>
          ) : <div className="flex-1" />}
          {next ? (
            <button className="flex-1 p-3 px-4 bg-surface border border-border rounded-xl cursor-pointer transition-all duration-200 text-[13px] text-text-secondary text-right hover:border-primary hover:text-text" onClick={() => onNavToDoc(module.id, docIdx + 1)}>
              <div className="text-[11px] text-text-secondary mb-1">下一篇 →</div>
              <div className="font-semibold text-text-strong">{next.title}</div>
            </button>
          ) : <div className="flex-1" />}
        </div>
      </div>
      <ArticleToc 
        items={rendered.tocItems} 
        className={immersiveMode ? 'hidden lg:block' : 'hidden min-[1360px]:block'}
        onItemClick={(id) => navigate({ pathname: location.pathname, search: location.search, hash: `#${id}` })}
      />
    </div>
  );
}
