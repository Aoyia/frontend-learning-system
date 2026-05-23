import { useEffect, useRef } from 'react';
import { PET_STAGES, getPetView } from '../utils/pet.js';

export function PetPanel({ petState, petEvents, onClose }) {
  const view = getPetView(petState);
  const activeNodeRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeNodeRef.current) {
        activeNodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pet-panel-mask" onClick={onClose}>
      <section className="pet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pet-panel-head">
          <div>
            <div className="pet-panel-eyebrow">学习战宠</div>
            <h2>{view.current.realm} · {view.current.name}</h2>
            <p>{view.current.desc}</p>
          </div>
          <button className="pet-panel-close" onClick={onClose} title="关闭面板">×</button>
        </div>

        <div className="pet-panel-main">
          <div className="pet-panel-hero">
            <div className="pet-panel-hero-avatar-wrapper">
              <img src={view.current.image} alt={view.current.name} />
            </div>
            <div className="pet-panel-stats">
              <div>
                <span>累计修为</span>
                <strong>{petState.xp || 0}</strong>
              </div>
              <div>
                <span>今日修为</span>
                <strong>{petState.todayXp || 0}</strong>
              </div>
              <div>
                <span>闭关连修</span>
                <strong>{petState.streak || 0}天</strong>
              </div>
            </div>
          </div>
          <div className="pet-panel-progress">
            <div className="pet-progress-row">
              <span>{view.next ? `距下个境界 ${view.next.realm} · ${view.next.name}` : '已达成当前最高境界'}</span>
              <strong>{view.next ? `还需 ${view.xpToNext} 修为` : '大圆满'}</strong>
            </div>
            <div className="pet-large-progress">
              <span style={{ width: `${view.progress}%` }} />
            </div>
          </div>
        </div>

        <div className="pet-stage-track-container">
          <div className="pet-stage-track">
            {PET_STAGES.map(stage => {
              const unlocked = (petState.xp || 0) >= stage.threshold;
              const active = stage.index === view.current.index;
              return (
                <div
                  key={stage.name}
                  ref={active ? activeNodeRef : null}
                  className={`pet-stage-node ${unlocked ? 'unlocked' : ''} ${active ? 'active' : ''}`}
                  title={`${stage.realm} · ${stage.name} (${unlocked ? '已解锁' : `需 ${stage.threshold} 修为`})`}
                >
                  <div className="pet-stage-avatar-box">
                    <img src={stage.image} alt={stage.name} />
                  </div>
                  <div className="pet-stage-info">
                    <strong>{stage.realm}</strong>
                    <span>{stage.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pet-timeline-container">
          <h3>最近修炼</h3>
          {petEvents.length ? (
            <div className="pet-timeline">
              {petEvents.map(event => (
                <div className="pet-timeline-item" key={event.id}>
                  <div className="pet-timeline-dot" />
                  <strong>{event.title}</strong>
                  <span>{event.detail}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="pet-timeline-empty">完成阅读或刷题后，这里会记录战宠成长。</div>
          )}
        </div>
      </section>
    </div>
  );
}
