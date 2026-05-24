import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { PET_STAGES, getPetView } from '../utils/pet.js';
import { PetAuraBg } from './PetAuraBg.jsx';



const LADDER_STAGES = [
  { label: '启灵', minIndex: 0 },
  { label: '炼气', minIndex: 2 },
  { label: '筑基', minIndex: 4 },
  { label: '结丹', minIndex: 7 },
  { label: '元婴', minIndex: 10 },
  { label: '化神', minIndex: 11 },
];

export function PetPanel({ petState, petEvents, onClose }) {
  const view = getPetView(petState);
  const [previewStage, setPreviewStage] = useState(null);
  const [showCodices, setShowCodices] = useState(false);

  const displayStage = previewStage || view.current;
  const isPreviewing = previewStage !== null && previewStage.index !== view.current.index;

  const radius = 136;
  const strokeDash = 2 * Math.PI * radius;
  const fillProgress = isPreviewing ? 100 : view.progress;
  const strokeOffset = strokeDash - (strokeDash * fillProgress) / 100;

  const prevRealm  = useRef(null);
  const panelRef   = useRef(null);

  useEffect(() => {
    const realm = displayStage.realm;
    if (prevRealm.current === null) {
      prevRealm.current = realm;
      return;
    }
    if (prevRealm.current === realm) return;
    prevRealm.current = realm;

    const panel = panelRef.current;
    if (panel) {
      gsap.fromTo(panel,
        { x: -6 },
        { x: 0, duration: 0.35, ease: 'elastic.out(1, 0.3)' }
      );
    }
  }, [displayStage.realm]);

  return (
    <div className="pet-panel-mask" onClick={onClose}>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="aura-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--realm-color-primary)" />
            <stop offset="100%" stopColor="var(--realm-color-secondary)" />
          </linearGradient>
        </defs>
      </svg>

      <section
        ref={panelRef}
        className="pet-panel"
        data-realm={displayStage.realm}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-4 mb-2">
          <div>
            <div className="text-secondary text-[11px] font-extrabold tracking-wider uppercase mb-1.5">学习战宠</div>
            <h2 className="text-[22px] font-extrabold text-text-strong m-0 mb-1.5">{displayStage.realm} · {displayStage.name}</h2>
            <p className="text-text-secondary text-[13px] leading-relaxed m-0">{displayStage.desc}</p>
            {isPreviewing && (
              <button className="mt-2 px-3 py-1.25 border border-border rounded-md bg-surface text-text-secondary text-[11px] font-semibold cursor-pointer transition-all duration-200 inline-flex items-center gap-1 w-fit hover:border-secondary hover:text-secondary hover:bg-secondary/5" onClick={() => setPreviewStage(null)}>
                ↩ 返回我当前的实际境界
              </button>
            )}
          </div>
          <button
            className="w-8 h-8 rounded-full border border-border bg-surface-alt text-text-secondary cursor-pointer grid place-items-center text-[18px] leading-none transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-danger hover:text-danger hover:rotate-90"
            onClick={onClose}
            aria-label="关闭面板"
            title="关闭面板"
          >
            ×
          </button>
        </div>

        {/* 神兽展示区 */}
        <div className="flex flex-col items-center my-2.5 relative">
          {isPreviewing && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/15 border border-warning/30 text-warning text-[11px] font-bold tracking-wide mb-2.5 w-fit">✨ 预览境界形态</span>
          )}

          <div className="pet-zenith-avatar-wrapper">
            {/* 境界背景光效 —— 在宠物最底层 */}
            <PetAuraBg realm={displayStage.realm} />
            {/* SVG 聚灵修为圆环 */}
            <svg className="absolute w-[288px] h-[288px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1] pointer-events-none" viewBox="0 0 288 288" style={{ overflow: 'visible' }}>
              <circle className="fill-none stroke-border stroke-1" cx="144" cy="144" r={radius} />
              <circle
                className="pet-aura-ring-fill"
                cx="144"
                cy="144"
                r={radius}
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
              />
            </svg>
            <img
              key={displayStage.index}
              className="pet-zenith-avatar w-56 h-56 object-contain relative z-10"
              src={displayStage.image}
              alt={displayStage.name}
            />
          </div>

          {/* 扁平化数据属性 */}
          <div className="flex justify-center gap-3 items-center mt-4.5 text-text-secondary text-[12px] tracking-wider">
            <span className="inline-flex items-center">累计修为 <strong className="text-text font-bold ml-0.75">{petState.xp || 0}</strong></span>
            <span className="text-border text-[10px]">|</span>
            <span className="inline-flex items-center">今日修为 <strong className="text-text font-bold ml-0.75">+{petState.todayXp || 0}</strong></span>
            <span className="text-border text-[10px]">|</span>
            <span className="inline-flex items-center">连修天数 <strong className="text-text font-bold ml-0.75">{petState.streak || 0}天</strong></span>
          </div>
        </div>

        {/* 大境界修仙天梯 */}
        <div className="w-full my-5 relative">
          <div className="absolute left-2.5 right-2.5 top-1.5 h-[1px] bg-border z-0" />
          <div className="flex justify-between relative z-1">
            {LADDER_STAGES.map(stage => {
              const unlocked = (petState.xp || 0) >= PET_STAGES.find(s => s.realm === stage.label).threshold;
              const isCurrentlyActive = view.current.realm === stage.label;
              const isSelected = displayStage.realm === stage.label;

              let dotClass = "w-2 h-2 rounded-full border-2 border-surface box-content transition-all duration-300 ease-out ";
              if (isCurrentlyActive || isSelected) {
                dotClass += "bg-secondary shadow-[0_0_8px_var(--accent2)] scale-[1.2]";
              } else if (unlocked) {
                dotClass += "bg-secondary";
              } else {
                dotClass += "bg-text-secondary";
              }

              return (
                <div
                  key={stage.label}
                  onClick={() => {
                    const target = PET_STAGES.find(s => s.realm === stage.label);
                    if (target) setPreviewStage(target);
                  }}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer flex-1 transition-all duration-300 ease-out ${unlocked ? 'opacity-75' : 'opacity-30'} ${(isCurrentlyActive || isSelected) ? 'opacity-100 scale-105' : ''}`}
                  title={`${stage.label} 境界 (${unlocked ? '已解锁，点击可预览形态' : '暂未解锁'})`}
                >
                  <div className={dotClass} />
                  <span className={`text-[11px] font-medium transition-colors duration-300 ${unlocked ? 'text-text' : 'text-text-secondary'}`}>{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 图鉴入口按钮 */}
        <button className="block mx-auto mt-3 bg-transparent border border-border rounded-lg px-4 py-1.5 text-text-secondary text-[11px] cursor-pointer tracking-widest transition-all duration-250 ease-out hover:border-secondary hover:text-secondary hover:bg-secondary/4" onClick={() => setShowCodices(true)}>
          📖 开启神兽图志
        </button>

        {/* 底部流式日志走字栏 */}
        <div className="border-t border-border pt-4 mt-2.5">
          {petEvents.length ? (
            <div className="flex items-center gap-2 text-[11px] text-text-secondary leading-normal bg-surface-alt px-3 py-2 rounded-lg" title="修行历程摘要">
              <span className="text-secondary font-extrabold shrink-0">⚡</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left">
                <strong>{petEvents[0].title}</strong>：{petEvents[0].detail}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-text-secondary leading-normal bg-surface-alt px-3 py-2 rounded-lg">
              <span className="text-secondary font-extrabold shrink-0">⚡</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-left">道友尚未开始修炼，快去阅读讲义或刷题获取修为吧！</span>
            </div>
          )}
        </div>

        {/* 全屏半透明神兽进化图志 Overlay */}
        {showCodices && (
          <div className="fixed inset-0 bg-[var(--pet-codex-bg)] backdrop-blur-md z-[600] flex flex-col p-10 overflow-y-auto animate-[pet-fade-in_0.3s_cubic-bezier(0.25,1,0.5,1)_forwards]" onClick={() => setShowCodices(false)}>
            <div className="flex justify-between items-center mb-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-[20px] font-extrabold text-text-strong">神兽进化图志</h3>
              <button
                className="w-8 h-8 rounded-full border border-border bg-surface-alt text-text-secondary cursor-pointer grid place-items-center text-[18px] leading-none transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-danger hover:text-danger hover:rotate-90"
                onClick={() => setShowCodices(false)}
                aria-label="关闭图志"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-4" onClick={(e) => e.stopPropagation()}>
              {PET_STAGES.map(stage => {
                const unlocked = (petState.xp || 0) >= stage.threshold;
                const isCurrent = stage.index === view.current.index;
                const isSelected = displayStage.index === stage.index;

                let cardCls = "border border-border rounded-xl bg-surface-alt p-4 py-3 flex flex-col items-center gap-2 text-center transition-all duration-250 ease-out cursor-pointer ";
                if (isCurrent) {
                  cardCls += "opacity-100 border-primary shadow-[0_0_15px_rgba(108,99,255,0.15)] bg-[radial-gradient(circle,rgba(108,99,255,0.06)_0%,var(--surface2)_100%)]";
                } else if (unlocked) {
                  cardCls += "opacity-85 hover:opacity-100 hover:-translate-y-0.5 hover:border-secondary";
                } else {
                  cardCls += "opacity-25";
                }

                return (
                  <div
                    key={stage.name}
                    onClick={() => {
                      setPreviewStage(stage);
                      setShowCodices(false);
                    }}
                    className={cardCls}
                    title={`${stage.realm} · ${stage.name} (${unlocked ? '已解锁，点击可预览法相' : `需 ${stage.threshold} 修为`})`}
                  >
                    <img className="w-14.5 h-14.5 object-contain" src={stage.image} alt={stage.name} style={{ filter: unlocked ? 'none' : 'grayscale(100%) opacity(40%)' }} />
                    <strong className="text-[13px] font-bold text-text-strong">{stage.realm}</strong>
                    <span className="text-[11px] text-text-secondary">{stage.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
