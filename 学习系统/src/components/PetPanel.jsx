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

  const radius = 72;
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
        <div className="pet-panel-head">
          <div>
            <div className="pet-panel-eyebrow">学习战宠</div>
            <h2>{displayStage.realm} · {displayStage.name}</h2>
            <p>{displayStage.desc}</p>
            {isPreviewing && (
              <button className="pet-preview-reset-btn" onClick={() => setPreviewStage(null)}>
                ↩ 返回我当前的实际境界
              </button>
            )}
          </div>
          <button
            className="pet-panel-close"
            onClick={onClose}
            aria-label="关闭面板"
            title="关闭面板"
          >
            ×
          </button>
        </div>

        {/* 神兽展示区 */}
        <div className="pet-zenith-container">
          {isPreviewing && (
            <span className="pet-preview-badge">✨ 预览境界形态</span>
          )}



          <div className="pet-zenith-avatar-wrapper">
            {/* 境界背景光效 —— 在宠物最底层 */}
            <PetAuraBg realm={displayStage.realm} />
            {/* SVG 聚灵修为圆环 */}
            <svg className="pet-aura-ring" viewBox="0 0 160 160" style={{ overflow: 'visible' }}>
              <circle className="pet-aura-ring-bg" cx="80" cy="80" r={radius} />
              <circle
                className="pet-aura-ring-fill"
                cx="80"
                cy="80"
                r={radius}
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
              />
            </svg>
            <img
              key={displayStage.index}
              className="pet-zenith-avatar"
              src={displayStage.image}
              alt={displayStage.name}
            />
          </div>

          {/* 扁平化数据属性 */}
          <div className="pet-zenith-metrics">
            <span>累计修为 <strong>{petState.xp || 0}</strong></span>
            <span className="separator">|</span>
            <span>今日修为 <strong>+{petState.todayXp || 0}</strong></span>
            <span className="separator">|</span>
            <span>连修天数 <strong>{petState.streak || 0}天</strong></span>
          </div>
        </div>

        {/* 大境界修仙天梯 */}
        <div className="pet-ladder-container">
          <div className="pet-ladder-line" />
          <div className="pet-ladder">
            {LADDER_STAGES.map(stage => {
              const unlocked = (petState.xp || 0) >= PET_STAGES.find(s => s.realm === stage.label).threshold;
              const isCurrentlyActive = view.current.realm === stage.label;
              const isSelected = displayStage.realm === stage.label;

              return (
                <div
                  key={stage.label}
                  onClick={() => {
                    const target = PET_STAGES.find(s => s.realm === stage.label);
                    if (target) setPreviewStage(target);
                  }}
                  className={`pet-ladder-node ${unlocked ? 'unlocked' : ''} ${(isCurrentlyActive || isSelected) ? 'active' : ''}`}
                  title={`${stage.label} 境界 (${unlocked ? '已解锁，点击可预览形态' : '暂未解锁'})`}
                >
                  <div className="pet-ladder-dot" />
                  <span>{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 图鉴入口按钮 */}
        <button className="pet-codex-trigger-btn" onClick={() => setShowCodices(true)}>
          📖 开启神兽图志
        </button>

        {/* 底部流式日志走字栏 */}
        <div className="pet-ticker-container">
          {petEvents.length ? (
            <div className="pet-ticker" title="修行历程摘要">
              <span className="pet-ticker-icon">⚡</span>
              <span className="pet-ticker-content">
                <strong>{petEvents[0].title}</strong>：{petEvents[0].detail}
              </span>
            </div>
          ) : (
            <div className="pet-ticker">
              <span className="pet-ticker-icon">⚡</span>
              <span className="pet-ticker-content">道友尚未开始修炼，快去阅读讲义或刷题获取修为吧！</span>
            </div>
          )}
        </div>

        {/* 全屏半透明神兽进化图志 Overlay */}
        {showCodices && (
          <div className="pet-codex-overlay" onClick={() => setShowCodices(false)}>
            <div className="pet-codex-head" onClick={(e) => e.stopPropagation()}>
              <h3>神兽进化图志</h3>
              <button
                className="pet-panel-close"
                onClick={() => setShowCodices(false)}
                aria-label="关闭图志"
              >
                ×
              </button>
            </div>
            <div className="pet-codex-grid" onClick={(e) => e.stopPropagation()}>
              {PET_STAGES.map(stage => {
                const unlocked = (petState.xp || 0) >= stage.threshold;
                const isCurrent = stage.index === view.current.index;
                const isSelected = displayStage.index === stage.index;

                return (
                  <div
                    key={stage.name}
                    onClick={() => {
                      setPreviewStage(stage);
                      setShowCodices(false);
                    }}
                    className={`pet-codex-card ${unlocked ? 'unlocked' : ''} ${isCurrent ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                    title={`${stage.realm} · ${stage.name} (${unlocked ? '已解锁，点击可预览法相' : `需 ${stage.threshold} 修为`})`}
                  >
                    <img src={stage.image} alt={stage.name} />
                    <strong>{stage.realm}</strong>
                    <span>{stage.name}</span>
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
