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
          <span>今日修为 <strong>+{petState.todayXp || 0}</strong></span>
          <span>连修天数 <strong>{petState.streak || 0} 天</strong></span>
        </div>
        <div className="pet-progress-row">
          <span>{view.next ? `下一小境界：${view.next.realm} · ${view.next.name}` : '已臻大圆满境界'}</span>
          <strong>{view.progress}%</strong>
        </div>
        <div className="pet-large-progress"><span style={{ width: `${view.progress}%` }} /></div>
        <button className="mini-btn primary" onClick={onOpen}>查看进化路线</button>
      </div>
    </section>
  );
}
