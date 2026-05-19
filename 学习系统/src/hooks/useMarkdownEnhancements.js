import { useEffect } from 'react';
import hljs from 'highlight.js';

export function useMarkdownEnhancements({ page, currentModuleId, currentDocIdx, quizPageIdx, submittedPages, theme }) {
  useEffect(() => {
    document.querySelectorAll('pre code:not(.language-mermaid)').forEach(el => hljs.highlightElement(el));

    let cancelled = false;

    (async () => {
      const hasMermaidCode = document.querySelector('.md-body pre code.language-mermaid')
        || document.querySelector('.md-body .mermaid');
      if (!hasMermaidCode) return;

      const { default: mermaid } = await import('mermaid');
      if (cancelled) return;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: theme === 'light' ? 'default' : 'dark',
      });

      document.querySelectorAll('.md-body').forEach(body => {
        body.querySelectorAll('pre code.language-mermaid').forEach(codeEl => {
          const source = codeEl.textContent || '';
          const wrapper = document.createElement('div');
          wrapper.className = 'mermaid';
          wrapper.setAttribute('data-mermaid-source', source);
          wrapper.textContent = source;
          const pre = codeEl.closest('pre');
          if (pre) pre.replaceWith(wrapper);
        });

        body.querySelectorAll('.mermaid[data-mermaid-source]').forEach(el => {
          const source = el.getAttribute('data-mermaid-source') || '';
          el.textContent = source;
          el.removeAttribute('data-processed');
        });
      });

      const nodes = Array.from(document.querySelectorAll('.md-body .mermaid'));
      if (nodes.length) {
        mermaid.run({ nodes }).catch(() => {
          // Mermaid 语法错误时保留原始文本，避免页面崩溃。
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, currentModuleId, currentDocIdx, quizPageIdx, submittedPages, theme]);
}
