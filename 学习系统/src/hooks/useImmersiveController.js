import { useEffect, useRef, useState } from 'react';

export function useImmersiveController(page) {
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const toolbarHideTimer = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.immersive = immersiveMode ? 'true' : '';
    if (!immersiveMode) {
      clearTimeout(toolbarHideTimer.current);
      setToolbarVisible(true);
      return undefined;
    }
    setToolbarVisible(true);
    toolbarHideTimer.current = setTimeout(() => setToolbarVisible(false), 3000);
    const onKey = (e) => { if (e.key === 'Escape') setImmersiveMode(false); };
    const onMouseMove = () => {
      setToolbarVisible(true);
      clearTimeout(toolbarHideTimer.current);
      toolbarHideTimer.current = setTimeout(() => setToolbarVisible(false), 3000);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousemove', onMouseMove);
      clearTimeout(toolbarHideTimer.current);
    };
  }, [immersiveMode]);

  useEffect(() => {
    if (page === 'quiz') {
      setImmersiveMode(true);
    } else if (page !== 'learn' && page !== 'mock-interview') {
      setImmersiveMode(false);
    }
  }, [page]);

  return { immersiveMode, setImmersiveMode, toolbarVisible };
}
