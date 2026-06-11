import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from '@arco-design/web-react';
import '@arco-design/web-react/es/style/index.css';
import '@arco-design/web-react/es/Tooltip/style/index.css';

export function ArticleToc({ items, className = '', onItemClick }) {
  const [activeId, setActiveId] = useState(items[0]?.id || '');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef(null);
  const itemKey = items.map(item => item.id).join('|');

  useEffect(() => {
    setActiveId(items[0]?.id || '');
  }, [itemKey, items]);

  useEffect(() => {
    if (!items.length) return undefined;
    const scrollRoot = document.querySelector('.content');
    const updateActive = () => {
      const offsetTop = (scrollRoot?.getBoundingClientRect().top || 0) + 96;
      let current = items[0]?.id || '';
      items.forEach(item => {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= offsetTop) {
          current = item.id;
        }
      });
      setActiveId(current);
    };

    updateActive();
    scrollRoot?.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    return () => {
      scrollRoot?.removeEventListener('scroll', updateActive);
      window.removeEventListener('resize', updateActive);
    };
  }, [itemKey, items]);

  useEffect(() => () => {
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
  }, []);

  if (!items.length) return null;

  function scrollToHeading(id) {
    if (onItemClick) {
      onItemClick(id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleTocScroll() {
    setIsScrolling(true);
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => setIsScrolling(false), 700);
  }

  const tocClass = `${className} sticky top-6 max-h-[calc(100vh-104px)] overflow-y-auto overflow-x-hidden pl-4 py-3 border-l border-border text-text-secondary [scrollbar-gutter:stable] [scrollbar-width:thin] ${isScrolling ? '[scrollbar-color:var(--border)_transparent]' : '[scrollbar-color:transparent_transparent]'} transition-all`;

  return (
    <aside data-component="article-toc" className={tocClass} aria-label="文章目录" onScroll={handleTocScroll}>
      <div className="mb-2 text-text text-[12px] font-bold">目录</div>
      <div className="grid gap-0.5">
        {items.map(item => {
          const isDepth3 = item.depth === 3;
          const isActive = activeId === item.id;

          return (
            <Tooltip
              key={item.id}
              content={item.text}
              position="left"
              trigger="hover"
              mini
            >
              <button
                data-element="toc-item"
                data-state={isActive ? 'active' : 'inactive'}
                className={`w-full truncate border-0 rounded-md bg-transparent text-text-secondary cursor-pointer text-[12px] leading-relaxed p-1.5 px-2 text-left transition-all duration-150 hover:bg-surface-alt hover:text-text ${isDepth3 ? 'pl-5 text-[11px]' : ''} ${isActive ? 'bg-primary-light text-primary font-bold' : ''}`}
                onClick={() => scrollToHeading(item.id)}
              >
                {item.text}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </aside>
  );
}
