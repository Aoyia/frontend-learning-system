import React, { useEffect, useRef, useState } from 'react';

export function ArticleToc({ items }) {
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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleTocScroll() {
    setIsScrolling(true);
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => setIsScrolling(false), 700);
  }

  return (
    <aside className={`article-toc ${isScrolling ? 'is-scrolling' : ''}`} aria-label="文章目录" onScroll={handleTocScroll}>
      <div className="article-toc-title">目录</div>
      <div className="article-toc-list">
        {items.map(item => (
          <button
            key={item.id}
            className={`article-toc-item depth-${item.depth} ${activeId === item.id ? 'active' : ''}`}
            onClick={() => scrollToHeading(item.id)}
            title={item.text}
          >
            {item.text}
          </button>
        ))}
      </div>
    </aside>
  );
}
