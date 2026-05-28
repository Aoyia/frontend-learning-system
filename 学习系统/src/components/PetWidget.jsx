import { getPetView } from '../utils/pet.js';

export function PetWidget({ petState, onOpen }) {
  const view = getPetView(petState);
  return (
    <button
      data-component="pet-widget"
      className="h-9.5 min-w-[130px] p-[3px] pr-3 pl-1 border border-border rounded-full bg-white/3 backdrop-blur-md text-text inline-flex items-center gap-2.5 cursor-pointer mr-2 transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-secondary/60 hover:bg-secondary/6 hover:-translate-y-0.5"
      onClick={onOpen}
      title={`学习战宠：${view.current.realm} · ${view.current.name} (修为: ${petState.xp || 0})，点击查看进化路线`}
    >
      <img className="w-7 h-7 object-contain rounded-full bg-white/4 p-0.5" src={view.current.image} alt={view.current.name} />
      <span className="flex flex-col gap-0.75 flex-1 text-left">
        <span className="text-[11px] font-bold tracking-wider text-text leading-none">{view.current.realm}</span>
        <span className="h-[3px] rounded-full bg-white/10 overflow-hidden">
          <span className="block h-full rounded-inherit bg-gradient-to-r from-secondary to-primary transition-[width] duration-350 ease-out" style={{ width: `${view.progress}%` }} />
        </span>
      </span>
    </button>
  );
}

