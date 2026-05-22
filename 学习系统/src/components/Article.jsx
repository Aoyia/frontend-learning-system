import React from 'react';
import { marked } from 'marked';
import { normalizeMarkdown, getDifficultyClass, sourceTypeLabel } from '../utils/helpers.js';

marked.use({
  renderer: {
    link(href, title, text) {
      const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
      if (isExternal) {
        const t = title ? ` title="${title}"` : ` title="${href}"`;
        return `<a href="${href}"${t} target="_blank" rel="noopener noreferrer" class="doc-ref">${text}</a>`;
      }
      return `<a href="${href}">${text}</a>`;
    },
  },
});

export default function Article({ module, docIdx, progressCache, onHome, onModuleHome, onNavToDoc, onMarkDone, onStartQuiz, onGoDrill, immersiveMode, onToggleImmersive }) {
  const doc = module.docs[docIdx];
  const isDone = progressCache[`${module.id}__${docIdx}`];
  const prev = docIdx > 0 ? module.docs[docIdx - 1] : null;
  const next = docIdx < module.docs.length - 1 ? module.docs[docIdx + 1] : null;
  const html = marked.parse(normalizeMarkdown(doc.content));
  const meta = doc.docMeta || {};
  const sourceLabel = sourceTypeLabel(meta.sourceType);

  return (
    <div className="article-wrap">
      <div className="article-header">
        <div className="article-breadcrumb">
          <span onClick={onHome}>首页</span> / <span onClick={onModuleHome}>{module.name}</span> / {doc.title}
        </div>
        <div className="article-title">{doc.title}</div>
        <div className="article-meta">
          <span className="article-tag accent">{module.name}</span>
          <span className="article-tag">{docIdx + 1} / {module.docs.length}</span>
          {doc.difficulty && <span className={`badge badge-${getDifficultyClass(doc.difficulty)}`}>{doc.difficulty}</span>}
          {sourceLabel && <span className="article-tag source">{sourceLabel}</span>}
          {meta.updated && <span className="article-tag">更新 {meta.updated}</span>}
          {isDone && <span className="badge badge-easy">✓ 已读</span>}
          <button className="immersive-toggle-btn" onClick={onToggleImmersive} title={immersiveMode ? '退出专注模式 (Esc)' : '进入专注阅读模式'}>
            {immersiveMode ? '⊠ 退出专注' : '⊡ 专注阅读'}
          </button>
        </div>
        {(meta.sourceTitle || meta.sourceAuthor || meta.sourceUrl || meta.originalPath) && (
          <div className="article-source-card">
            {meta.sourceTitle && <div><span>来源标题</span>{meta.sourceTitle}</div>}
            {meta.sourceAuthor && <div><span>作者</span>{meta.sourceAuthor}</div>}
            {meta.sourceUrl && (
              <div>
                <span>原文链接</span>
                <a href={meta.sourceUrl} target="_blank" rel="noopener noreferrer">{meta.sourceUrl}</a>
              </div>
            )}
            {meta.originalPath && <div><span>原始位置</span>{meta.originalPath}</div>}
          </div>
        )}
      </div>
      <div className="md-body" dangerouslySetInnerHTML={{ __html: html }} />

      {!isDone && (
        <div className="done-banner">
          <div className="done-banner-text">📖 读完了吗？标记为已读，并做随堂作业</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => onMarkDone(module.id, docIdx, false)}>仅标记已读</button>
            <button className="btn btn-primary" onClick={() => onMarkDone(module.id, docIdx, true)}>已读 + 开始作业</button>
          </div>
        </div>
      )}

      {isDone && (
        <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onStartQuiz(module.id, docIdx)}>做随堂作业</button>
          <button className="btn btn-outline" onClick={onGoDrill}>去模块刷题</button>
        </div>
      )}

      <div className="article-nav">
        {prev ? (
          <button className="article-nav-btn" onClick={() => onNavToDoc(module.id, docIdx - 1)}>
            <div className="label">← 上一篇</div>
            <div className="title">{prev.title}</div>
          </button>
        ) : <div />}
        {next ? (
          <button className="article-nav-btn right" onClick={() => onNavToDoc(module.id, docIdx + 1)}>
            <div className="label">下一篇 →</div>
            <div className="title">{next.title}</div>
          </button>
        ) : <div />}
      </div>
    </div>
  );
}
