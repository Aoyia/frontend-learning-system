import { useEffect, useRef, useState } from 'react';

export function useThemeController() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem('learn-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });
  const themeTransitionTimer = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('learn-theme', theme);
  }, [theme]);

  useEffect(() => () => {
    if (themeTransitionTimer.current) window.clearTimeout(themeTransitionTimer.current);
    document.documentElement.classList.remove('theme-transitioning');
  }, []);

  function toggleTheme() {
    if (typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const root = document.documentElement;
      root.classList.remove('theme-transitioning');
      void root.offsetWidth;
      root.classList.add('theme-transitioning');
      if (themeTransitionTimer.current) window.clearTimeout(themeTransitionTimer.current);
      themeTransitionTimer.current = window.setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 320);
    }
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  return { theme, toggleTheme };
}
