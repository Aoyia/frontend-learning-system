import { getPetView } from '../utils/pet.js';

export function PetHomeCard({ petState, onOpen }) {
  const view = getPetView(petState);
  return (
    <section className="pet-home-card">
      <div className="pet-home-visual">
        <img src={view.current.image} alt={view.current.name} />
      </div>
      <div className="pet-home-content">
        <div className="pet-home-kicker">今日修炼</div>
        <h2>{view.current.realm} · {view.current.name}</h2>
        <p>{view.current.desc}</p>
        <div className="pet-home-metrics">
          <span>累计修为 <strong>{petState.xp || 0}</strong></span>
          <span>今日 +{petState.todayXp || 0}</span>
          <span>连修 {petState.streak || 0} 天</span>
        </div>
        <div className="pet-progress-row">
          <span>{view.next ? `下一小境界：${view.next.realm} · ${view.next.name}` : '当前已化神圆满'}</span>
          <strong>{view.progress}%</strong>
        </div>
        <div className="pet-large-progress"><span style={{ width: `${view.progress}%` }} /></div>
        <button className="mini-btn primary" onClick={onOpen}>查看进化路线</button>
      </div>
    </section>
  );
}
