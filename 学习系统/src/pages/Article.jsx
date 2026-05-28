import React, { useMemo } from 'react';
import { renderMarkdownWithHeadings } from '../utils/markdown.js';
import { getDifficultyClass, sourceTypeLabel } from '../utils/quiz.js';
import { ArticleToc } from '../components/ArticleToc.jsx';

export function Article({ module, docIdx, progressCache, onHome, onModuleHome, onNavToDoc, onMarkDone, onStartQuiz, onGoDrill, immersiveMode, onToggleImmersive }) {
  const doc = module.docs[docIdx];
  const isDone = progressCache[`${module.id}__${docIdx}`];
  const prev = docIdx > 0 ? module.docs[docIdx - 1] : null;
  const next = docIdx < module.docs.length - 1 ? module.docs[docIdx + 1] : null;
  const rendered = useMemo(() => renderMarkdownWithHeadings(doc.content), [doc.content]);
  const meta = doc.docMeta || {};
  const sourceLabel = sourceTypeLabel(meta.sourceType);

  const diffClass = getDifficultyClass(doc.difficulty);
  const diffBadgeColor = diffClass === 'easy' ? 'bg-success-light text-success' : diffClass === 'medium' ? 'bg-warning-light text-warning' : 'bg-danger-light text-danger';

  return (
    <div data-component="article-page" className={`grid grid-cols-1 ${immersiveMode ? 'xl:grid-cols-[minmax(0,900px)_220px] max-w-[1180px]' : 'xl:grid-cols-[minmax(0,800px)_220px] max-w-[1080px]'} gap-7 items-start justify-center mx-auto`}>
      <div className={`w-full mx-auto ${immersiveMode ? 'max-w-[900px]' : 'max-w-[800px]'}`}>
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
          <div data-element="read-actions" className="mt-6 p-4 px-5 bg-success-light border border-success/30 rounded-xl flex items-center justify-between gap-4">
            <div className="text-[14px] text-success font-semibold">📖 读完了吗？标记为已读，并做随堂作业</div>
            <div className="flex gap-2.5">
              <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={() => onMarkDone(module.id, docIdx, false)}>仅标记已读</button>
              <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover" onClick={() => onMarkDone(module.id, docIdx, true)}>已读 + 开始作业</button>
            </div>
          </div>
        )}

        {isDone && (
          <div data-element="read-actions" className="mt-6 flex gap-2.5 flex-wrap">
            <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover" onClick={() => onStartQuiz(module.id, docIdx)}>做随堂作业</button>
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
      <ArticleToc items={rendered.tocItems} />
    </div>
  );
}
