import { DEFAULT_DRILL_LIMIT, QUICK_DRILL_LIMIT } from '../utils/quiz.js';

export function DrillSelect({ modules = [], drillStatCache, onStartDrill, onStartOralDrill }) {
  return (
    <div data-component="drill-select" className="max-w-[700px] mx-auto">
      <h2 className="text-[22px] font-bold mb-1.5 text-text-strong">🎯 模块刷题</h2>
      <p className="text-text-secondary text-[13px] mb-6">默认轻量练习 20 题，先完成一小批，再根据错题 and 未练题持续循环。</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {modules.map(m => {
          const total = m.docs.reduce((n, d) => n + (d.quiz ? d.quiz.length : 0), 0);
          const hasExpression = m.docs.some(d => (d.quiz || []).some(q => q.type === 'expression'));
          
          const allQids = [];
          m.docs.forEach((d, di) => (d.quiz || []).forEach((_, qi) => allQids.push(`${m.id}__${di}__${qi}`)));
          const done = allQids.filter(id => drillStatCache[id]).length;
          const latestCorrect = allQids.filter(id => drillStatCache[id]?.lastCorrect).length;
          const latestPct = done ? Math.round((latestCorrect / done) * 100) : 0;
          return (
            <div className="bg-surface border-2 border-border rounded-xl p-4 cursor-pointer transition-all duration-200 text-center hover:border-primary flex flex-col justify-between" key={m.id} onClick={() => onStartDrill(m.id, DEFAULT_DRILL_LIMIT)}>
              <div>
                <div className="text-[24px] mb-2">{m.icon}</div>
                <div className="text-[14px] font-semibold text-text-strong">{m.name}</div>
                <div className="text-[12px] text-text-secondary mt-1">{total} 题 · 已练 {done} · 最近正确率 {latestPct}%</div>
              </div>
              <div className="flex justify-center gap-1.5 flex-wrap mt-3">
                <button className="w-fit border border-primary bg-primary text-white rounded-[7px] px-2 py-1 text-[12px] font-semibold cursor-pointer transition-all duration-180 hover:bg-primary-hover hover:border-primary-hover" onClick={(e) => { e.stopPropagation(); onStartDrill(m.id, DEFAULT_DRILL_LIMIT); }}>
                  练 {Math.min(DEFAULT_DRILL_LIMIT, total)} 题
                </button>
                <button className="w-fit border border-border bg-surface-alt text-text-secondary rounded-[7px] px-2 py-1 text-[12px] font-semibold cursor-pointer transition-all duration-180 hover:border-primary hover:text-primary" onClick={(e) => { e.stopPropagation(); onStartDrill(m.id, QUICK_DRILL_LIMIT); }}>
                  短练 {Math.min(QUICK_DRILL_LIMIT, total)}
                </button>
                <button className="w-fit border border-transparent bg-transparent text-text-secondary rounded-[7px] px-2 py-1 text-[12px] font-semibold cursor-pointer transition-all duration-180 hover:border-primary hover:text-primary" onClick={(e) => { e.stopPropagation(); onStartDrill(m.id, null); }}>
                  全量复盘
                </button>
                {hasExpression && (
                  <button 
                    className="w-full mt-2 border-0 text-white rounded-[7px] py-1 text-[12px] font-bold cursor-pointer transition-all duration-180 hover:brightness-110 active:scale-95" 
                    style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
                    onClick={(e) => { e.stopPropagation(); onStartOralDrill(m.id); }}
                  >
                    🗣️ 口试表达演练
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
