import { LEARNING_CONTENT } from '../../data/learning-content.js';
import { PetHomeCard } from '../components/PetHomeCard.jsx';

export function Home({ progressCache, petState, onOpenPet, onOpenRoadmap, onOpenBreaker, onOpenModule }) {
  return (
    <div className="max-w-[900px] mx-auto">
      <div className="text-center py-10 px-0">
        <h1 className="text-[32px] font-bold mb-3 text-text-strong">🚀 中高级前端学习与面试校准系统</h1>
        <p className="text-text-secondary text-[15px]">先用技术破冰建立知识地图，再进入专题学习、作业、自测和错题复盘。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-1 mx-0 mb-7.5">
        <button
          className="min-h-[126px] border border-secondary/45 rounded-xl bg-gradient-to-br from-secondary/12 to-primary/8 text-text p-4.5 text-left cursor-pointer grid gap-2 transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(108,99,255,0.14)]"
          onClick={onOpenRoadmap}
        >
          <span className="text-[26px]">🧭</span>
          <span className="text-[17px] font-bold text-text-strong">中高级学习路线</span>
          <span className="text-[13px] text-text-secondary leading-relaxed">按腾讯中高级前端能力模型，校准学习进度、错题和项目追问。</span>
        </button>
        <button
          className="min-h-[126px] border border-border rounded-xl bg-surface text-text p-4.5 text-left cursor-pointer grid gap-2 transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(108,99,255,0.14)]"
          onClick={onOpenBreaker}
        >
          <span className="text-[26px]">🗺️</span>
          <span className="text-[17px] font-bold text-text-strong">技术破冰地图</span>
          <span className="text-[13px] text-text-secondary leading-relaxed">按 Obsidian Canvas 浏览知识图谱，从节点进入破冰卡片。</span>
        </button>
        <button
          className="min-h-[126px] border border-border rounded-xl bg-surface text-text p-4.5 text-left cursor-pointer grid gap-2 transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(108,99,255,0.14)]"
          onClick={() => onOpenModule(LEARNING_CONTENT.modules[0]?.id)}
        >
          <span className="text-[26px]">📖</span>
          <span className="text-[17px] font-bold text-text-strong">系统学习模块</span>
          <span className="text-[13px] text-text-secondary leading-relaxed">进入深度长文、博客文档、作业和模块刷题。</span>
        </button>
      </div>
      <PetHomeCard petState={petState} onOpen={onOpenPet} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        {LEARNING_CONTENT.modules.map(m => {
          const total = m.docs.length;
          const done = m.docs.filter((_, i) => progressCache[`${m.id}__${i}`]).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div
              className="bg-surface border border-border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(108,99,255,0.15)]"
              key={m.id}
              onClick={() => onOpenModule(m.id)}
            >
              <div className="text-[28px] mb-3">{m.icon}</div>
              <div className="text-[16px] font-semibold mb-1.5 text-text-strong">{m.name}</div>
              <div className="text-[13px] text-text-secondary leading-relaxed">{m.desc}</div>
              <div className="mt-3.5 flex items-center gap-2.5">
                <div className="flex-1 h-1 bg-border rounded-[2px] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-[2px] transition-[width] duration-400" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[12px] text-text-secondary">{done}/{total}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
