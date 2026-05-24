import { LEARNING_CONTENT } from '../../data/learning-content.js';

export function WrongBookPage({ wrongBookCache, onStartWrongBook, onReadChapter }) {
  const records = Object.values(wrongBookCache).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const total = records.length;
  const moduleStats = LEARNING_CONTENT.modules.map(module => ({
    module,
    count: records.filter(record => record.moduleId === module.id).length,
  }));

  if (!total) {
    return (
      <div className="max-w-[700px] mx-auto">
        <h2 className="text-[22px] font-bold mb-1.5 text-text-strong">🧩 错题本</h2>
        <p className="text-text-secondary text-[13px] mb-6">错题会在作业和刷题提交后自动收集，答对后自动移出错题本。</p>
        <div className="text-center py-15 px-5 text-text-secondary">
          <div className="text-[48px] mb-4">✓</div>
          <p className="text-[15px]">当前没有错题。可以先去学习或刷题，系统会自动记录需要复习的题目。</p>
          <div className="mt-5">
            <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover" onClick={() => onStartWrongBook()}>开始错题练习</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto">
      <h2 className="text-[22px] font-bold mb-1.5 text-text-strong">🧩 错题本</h2>
      <p className="text-text-secondary text-[13px] mb-6">当前共 {total} 道错题。优先练错题，答对后自动移出错题本，再回推荐章节补知识点。</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4 cursor-pointer transition-all duration-200 text-center hover:border-primary" onClick={() => onStartWrongBook()}>
          <div className="text-[24px] mb-2">🔥</div>
          <div className="text-[14px] font-semibold text-text-strong">全部错题</div>
          <div className="text-[12px] text-text-secondary mt-1">{total} 题 · 综合复盘</div>
        </div>
        {moduleStats.filter(item => item.count > 0).map(({ module, count }) => (
          <div className="bg-surface border border-border rounded-xl p-4 cursor-pointer transition-all duration-200 text-center hover:border-primary" key={module.id} onClick={() => onStartWrongBook(module.id)}>
            <div className="text-[24px] mb-2">{module.icon}</div>
            <div className="text-[14px] font-semibold text-text-strong">{module.name}</div>
            <div className="text-[12px] text-text-secondary mt-1">{count} 题 · 针对练习</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2.5 mt-2">
        {records.slice(0, 12).map(record => (
          <div className="flex items-start md:items-center justify-between gap-3.5 p-3.5 px-4 bg-surface border border-border rounded-xl flex-col md:flex-row w-full" key={record.qid}>
            <div>
              <div className="text-[14px] leading-normal text-text mb-1 font-medium">{record.question}</div>
              <div className="text-[12px] text-text-secondary">
                {record.moduleName} / {record.docTitle} · 错 {record.wrongCount || 1} 次
              </div>
            </div>
            <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary whitespace-nowrap" onClick={() => onReadChapter(record.moduleId, record.docIdx)}>复习章节</button>
          </div>
        ))}
      </div>
    </div>
  );
}
