import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { PetWidget } from './PetWidget.jsx';
import { SyncModal } from './SyncModal.jsx';
import { SyncPromptCard } from './SyncPromptCard.jsx';
import { PrivateResources } from '../pages/PrivateResources.jsx';

const PAGES = ['home', 'roadmap', 'breaker', 'learn', 'drill', 'wrongbook', 'mock-interview'];

const CULTIVATION_MEMES = [
  '参天造化露 +1',
  '法力运转加速！',
  '修为松动！',
  '以学代修，突破！',
  '注入前端灵力！',
  '灵气暴走！',
  '筑基近在咫尺！',
  '道友，代码熟了！',
  '炼丹中，勿扰！',
  '前端金丹 +1'
];

export default function Navbar({
  page,
  setRoute,
  isAdmin,
  user,
  setUser,
  petState,
  db,
  reloadLocalCaches,
  loadPrivateModule,
  theme,
  toggleTheme,
  syncModalOpen,
  setSyncModalOpen,
  showSyncPrompt,
  handleDismissSyncPrompt,
  handleAcceptSyncPrompt,
  setPetPanelOpen,
  onToggleImmersive,
}) {
  const logoImgRef = useRef(null);
  const logoSpeedRef = useRef(0);
  const [flyEffects, setFlyEffects] = useState([]);
  const [githubModalOpen, setGithubModalOpen] = useState(false);

  useEffect(() => {
    const logo = logoImgRef.current;
    if (!logo) return;

    let angle = 0;
    let isHovered = false;
    let frameId = null;

    const handleMouseEnter = () => { isHovered = true; };
    const handleMouseLeave = () => { isHovered = false; };

    logo.addEventListener('mouseenter', handleMouseEnter);
    logo.addEventListener('mouseleave', handleMouseLeave);

    const update = () => {
      if (isHovered) {
        logoSpeedRef.current = Math.min(logoSpeedRef.current + 0.45, 25);
      } else {
        logoSpeedRef.current = Math.max(logoSpeedRef.current - 0.18, 0);
      }

      if (logoSpeedRef.current > 0) {
        angle = (angle + logoSpeedRef.current) % 360;
        logo.style.transform = `rotate(${angle}deg)`;

        if (logoSpeedRef.current > 8) {
          const intensity = Math.min((logoSpeedRef.current - 8) / 1.5, 10);
          logo.style.filter = `drop-shadow(0 0 ${intensity}px rgba(76, 175, 80, 0.9))`;
        } else {
          logo.style.filter = 'none';
        }
      } else {
        logo.style.filter = 'none';
        // 自动平滑对齐摆正
        if (!isHovered && angle !== 0) {
          const targetAngle = angle > 180 ? 360 : 0;
          const diff = targetAngle - angle;
          if (Math.abs(diff) < 0.5) {
            angle = 0;
            logo.style.transform = 'rotate(0deg)';
          } else {
            angle += diff * 0.16; // 阻尼回位缓动
            logo.style.transform = `rotate(${angle}deg)`;
          }
        }
      }

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      logo.removeEventListener('mouseenter', handleMouseEnter);
      logo.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const handleLogoPractise = useCallback(() => {
    logoSpeedRef.current = Math.min(logoSpeedRef.current + 22, 65);
    const text = CULTIVATION_MEMES[Math.floor(Math.random() * CULTIVATION_MEMES.length)];
    const id = Math.random().toString(36).substring(2, 9);
    setFlyEffects(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setFlyEffects(prev => prev.filter(item => item.id !== id));
    }, 900);
  }, []);

  const activeNavPage = useMemo(() => {
    // 答题状态页导航高亮逻辑
    return page;
  }, [page]);

  return (
    <>
      {/* ===== 顶部导航栏：三区布局 [Logo | Tabs | Actions] ===== */}
      <nav data-component="top-nav" className="sticky top-0 z-[100] h-14 top-nav-glass border-b border-border flex items-center">

        {/* 左区：Logo */}
        <div data-element="logo" className="shrink-0 flex items-center gap-2 pl-4 md:pl-6 pr-3 md:pr-4">
          <div className="relative flex items-center justify-center cursor-pointer select-none" onClick={handleLogoPractise}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-8 h-8 object-contain" ref={logoImgRef} />
            {flyEffects.map(effect => (
              <span key={effect.id} className="logo-fly-text">{effect.text}</span>
            ))}
          </div>
          <span className="hidden sm:block text-[15px] font-bold text-primary whitespace-nowrap">中高级前端知识对齐</span>
        </div>

        {/* 分隔线 */}
        <div className="shrink-0 w-px h-5 bg-border" />

        {/* 中区：导航 Tabs（弹性伸缩，内部可横向滚动） */}
        <div data-element="nav-tabs" className="flex-1 min-w-0 overflow-x-auto scrollbar-none flex items-center gap-1 px-2 md:px-3">
          {PAGES.map(name => (
            <button
              key={name}
              data-element="nav-tab"
              data-state={activeNavPage === name ? 'active' : 'inactive'}
              className={`shrink-0 px-3 py-1.5 rounded-lg cursor-pointer text-[13px] md:text-[14px] whitespace-nowrap transition-all duration-200 border-0 font-medium
                ${activeNavPage === name
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-transparent text-text-secondary hover:bg-surface-alt hover:text-text'
                }`}
              onClick={() => setRoute(name)}
            >
              {name === 'home'
                ? '首页'
                : name === 'roadmap'
                  ? '🧭 路线'
                  : name === 'breaker'
                    ? '🗺️ 破冰'
                    : name === 'learn'
                      ? '📖 学习'
                      : name === 'drill'
                        ? '🎯 刷题与口试'
                        : name === 'wrongbook'
                          ? '🧩 错题本'
                          : '🎙️ 模拟面试'}
            </button>
          ))}
        </div>

        {/* 右区：操作按钮 */}
        <div data-element="actions" className="shrink-0 flex items-center gap-1.5 pr-4 md:pr-6 pl-2">
          {isAdmin && (
            <button
              className={`w-9 h-9 flex items-center justify-center rounded-lg border cursor-pointer transition-all duration-200 hover:border-primary hover:bg-surface hover:text-primary ${
                localStorage.getItem('github_pat') ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-surface-alt border-border'
              }`}
              onClick={() => setGithubModalOpen(true)}
              title={localStorage.getItem('github_pat') ? '已配置私有库 (点击管理)' : '未配置私有库 (点击绑定)'}
            >
              🔒
            </button>
          )}
          <PetWidget petState={petState} onOpen={() => setPetPanelOpen(true)} />
          <button
            className={`w-9 h-9 flex items-center justify-center rounded-lg border cursor-pointer transition-all duration-200 hover:border-primary hover:bg-surface hover:text-primary ${
              user ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface-alt border-border'
            }`}
            onClick={() => setSyncModalOpen(true)}
            title={user ? `云同步已连接: ${user.email} (点击管理)` : '云同步未连接 (点击登录)'}
          >
            {user ? '☁️' : '🔄'}
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-surface-alt text-[16px] cursor-pointer transition-all duration-200 hover:border-primary hover:bg-surface hover:text-primary"
            onClick={toggleTheme}
            title="切换白天/夜间模式"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {onToggleImmersive && (
            <button
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-surface-alt text-[13px] cursor-pointer transition-all duration-200 hover:border-primary hover:bg-surface hover:text-primary"
              onClick={() => onToggleImmersive(true)}
              title="收起顶部栏 (按 Esc 键或鼠标滑至右上角恢复)"
            >
              ▲
            </button>
          )}
        </div>
      </nav>

      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        db={db}
        user={user}
        onSyncComplete={reloadLocalCaches}
        onAuthChange={setUser}
      />
      {showSyncPrompt && (
        <SyncPromptCard
          onOpenSync={handleAcceptSyncPrompt}
          onClose={handleDismissSyncPrompt}
        />
      )}
      <PrivateResources
        isOpen={githubModalOpen}
        onClose={() => setGithubModalOpen(false)}
        onSaveSuccess={loadPrivateModule}
      />
    </>
  );
}
