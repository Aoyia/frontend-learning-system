import { getPetView } from '../utils/pet.js';

export function PetWidget({ petState, onOpen }) {
  const view = getPetView(petState);
  return (
    <button
      className="pet-widget"
      onClick={onOpen}
      title={`学习战宠：${view.current.realm} · ${view.current.name} (修为: ${petState.xp || 0})，点击查看进化路线`}
    >
      <img className="pet-widget-avatar" src={view.current.image} alt={view.current.name} />
      <span className="pet-widget-info">
        <span className="pet-widget-name">{view.current.realm}</span>
        <span className="pet-widget-progress">
          <span style={{ width: `${view.progress}%` }} />
        </span>
      </span>
    </button>
  );
}
