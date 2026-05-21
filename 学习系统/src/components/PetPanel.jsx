import { PET_STAGES, getPetView } from '../utils/pet.js';

export function PetPanel({ petState, petEvents, onClose }) {
  const view = getPetView(petState);
  return (
    <div className="pet-panel-mask" onClick={onClose}>
      <section className="pet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pet-panel-head">
          <div>
            <div className="pet-panel-eyebrow">学习战宠</div>
            <h2>{view.current.realm} · {view.current.name}</h2>
            <p>{view.current.desc}</p>
          </div>
          <button className="pet-panel-close" onClick={onClose}>×</button>
        </div>

        <div className="pet-panel-main">
          <div className="pet-panel-hero">
            <img src={view.current.image} alt={view.current.name} />
            <div className="pet-panel-stats">
              <div><span>累计修为</span><strong>{petState.xp || 0}</strong></div>
              <div><span>今日修为</span><strong>{petState.todayXp || 0}</strong></div>
              <div><span>闭关连修</span><strong>{petState.streak || 0} 天</strong></div>
            </div>
          </div>
          <div className="pet-panel-progress">
            <div className="pet-progress-row">
              <span>{view.next ? `距 ${view.next.realm} · ${view.next.name}` : '已到当前最高境界'}</span>
              <strong>{view.next ? `${view.xpToNext} 修为` : '圆满'}</strong>
            </div>
            <div className="pet-large-progress"><span style={{ width: `${view.progress}%` }} /></div>
          </div>
        </div>

        <div className="pet-stage-grid">
          {PET_STAGES.map(stage => {
            const unlocked = (petState.xp || 0) >= stage.threshold;
            const active = stage.index === view.current.index;
            return (
              <div key={stage.name} className={`pet-stage-card ${unlocked ? 'unlocked' : ''} ${active ? 'active' : ''}`}>
                <img src={stage.image} alt={stage.name} />
                <div>
                  <strong>{stage.realm}</strong>
                  <span>{stage.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pet-event-list">
          <h3>最近修炼</h3>
          {petEvents.length ? petEvents.map(event => (
            <div className="pet-event" key={event.id}>
              <strong>{event.title}</strong>
              <span>{event.detail}</span>
            </div>
          )) : (
            <div className="pet-event empty">完成阅读或刷题后，这里会记录战宠成长。</div>
          )}
        </div>
      </section>
    </div>
  );
}
