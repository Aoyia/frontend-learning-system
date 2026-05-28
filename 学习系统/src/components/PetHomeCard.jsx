import { getPetView } from '../utils/pet.js';

export function PetHomeCard({ petState, onOpen }) {
  const view = getPetView(petState);
  return (
    <section data-component="pet-home-card" className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 bg-surface border border-border rounded-xl p-5 md:p-6 transition-all duration-200 hover:border-primary hover:shadow-[0_8px_30px_rgba(108,99,255,0.08)] bg-gradient-to-br from-surface to-surface-alt/30">
      
      {/* 左侧：战宠法相浮动预览 */}
      <div data-element="pet-avatar" className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-surface-alt border border-border flex items-center justify-center shrink-0 relative p-1.5 shadow-inner bg-gradient-to-tr from-primary/5 to-secondary/5 group">
        <img
          src={view.current.image}
          alt={view.current.name}
          className="w-full h-full object-contain filter drop-shadow(0 6px 12px rgba(0,0,0,0.15)) group-hover:scale-108 transition-transform duration-350 ease-out"
        />
      </div>

      {/* 右侧：核心数据与修为进度 */}
      <div data-element="pet-info" className="flex-1 flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-primary font-bold text-[10px] tracking-wider uppercase bg-primary-light border border-primary/20 rounded px-2 py-0.5">
            今日修行
          </span>
          <button
            data-element="action-btn"
            className="px-3 py-1.5 rounded-lg border-0 cursor-pointer text-[12px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover shadow-sm"
            onClick={onOpen}
          >
            查看进化路线
          </button>
        </div>

        <h2 className="text-[18px] md:text-[20px] font-extrabold text-text-strong m-0 leading-tight">
          {view.current.realm} · {view.current.name}
        </h2>
        
        <p className="text-[13px] text-text-secondary m-0 leading-relaxed">
          {view.current.desc}
        </p>

        {/* 修为三维数据 */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-secondary border-t border-b border-border/60 py-2.5 my-0.5">
          <span>累计修为 <strong className="text-text font-bold ml-0.75">{petState.xp || 0}</strong></span>
          <span className="text-border">|</span>
          <span>今日修为 <strong className="text-text font-bold ml-0.75">+{petState.todayXp || 0}</strong></span>
          <span className="text-border">|</span>
          <span>连修天数 <strong className="text-text font-bold ml-0.75">{petState.streak || 0} 天</strong></span>
        </div>

        {/* 下一阶进度槽 */}
        <div className="w-full">
          <div className="flex justify-between items-center text-[12px] text-text-secondary font-medium mb-1">
            <span>
              {view.next ? `下一小境界：${view.next.realm} · ${view.next.name}` : '已臻大圆满境界'}
            </span>
            <strong className="text-primary">{view.progress}%</strong>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${view.progress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
