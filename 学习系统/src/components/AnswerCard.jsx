import React from 'react';
import { isAnswerCorrect } from '../utils/quiz.js';

export default function AnswerCard({ quizState, collapsed, mobileOpen, onToggle, onJumpToQuestion }) {
  const totalQ = quizState.questions.length;
  const totalPages = Math.ceil(totalQ / quizState.pageSize);
  let correctCnt = 0;
  let wrongCnt = 0;
  let selectedCnt = 0;
  let unansweredCnt = 0;
  const groups = [];

  for (let p = 0; p < totalPages; p++) {
    const pageStart = p * quizState.pageSize;
    const pageEnd = Math.min(pageStart + quizState.pageSize, totalQ);
    const isSubmittedPage = quizState.submittedPages.includes(p);
    const cells = [];
    for (let gi = pageStart; gi < pageEnd; gi++) {
      const q = quizState.questions[gi];
      let cls;
      let title;
      if (isSubmittedPage) {
        const ok = isAnswerCorrect(q, quizState.answers[gi]);
        cls = ok ? 'correct' : 'wrong';
        title = ok ? '答对' : '答错';
        if (ok) correctCnt++;
        else wrongCnt++;
      } else if (quizState.selections[gi] !== undefined) {
        cls = 'selected-unsub';
        title = '已选未提交';
        selectedCnt++;
      } else {
        cls = 'unanswered';
        title = '未作答';
        unansweredCnt++;
      }
      cells.push({ gi, cls, title });
    }
    groups.push({ pageNo: p + 1, isCurrent: p === quizState.currentPageIdx, cells });
  }

  // 动态结合桌面端侧边折叠与移动端底部拉开抽屉的布局样式
  const sidebarClass = `flex flex-col h-full bg-surface border-l border-border overflow-hidden transition-all duration-200 ` +
    `${collapsed ? 'w-[42px] min-w-[42px]' : 'w-[220px] min-w-[220px]'} ` +
    `max-md:fixed max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:z-[150] max-md:w-full max-md:h-[min(68vh,460px)] max-md:border-l-0 max-md:border-t max-md:border-border max-md:transition-transform max-md:duration-300 max-md:ease-out ${mobileOpen ? 'max-md:translate-y-0' : 'max-md:translate-y-[calc(100%-44px)]'}`;

  const collapsedBarClass = `cursor-pointer select-none text-text-secondary ` +
    `max-md:flex max-md:h-11 max-md:items-center max-md:justify-center max-md:gap-2.5 max-md:w-full max-md:bg-surface max-md:border-b max-md:border-border ` +
    `${collapsed ? 'md:flex' : 'md:hidden'} md:h-full md:flex-col md:items-center md:justify-center md:gap-2.5 md:[writing-mode:vertical-rl]`;

  const innerClass = `flex flex-col flex-1 min-h-0 ${collapsed ? 'md:hidden' : 'md:flex'} max-md:h-[calc(100%-44px)]`;

  return (
    <aside data-component="answer-card" data-state={collapsed ? 'collapsed' : 'expanded'} className={sidebarClass}>
      <div data-element="toggle-bar" className={collapsedBarClass} onClick={onToggle}>
        <span className="text-[12px] font-semibold tracking-wider max-md:text-text-secondary max-md:font-semibold">答题卡</span>
      </div>
      <div data-element="content" className={innerClass}>
        <div data-element="header" className="hidden md:flex items-center justify-between p-3 px-3 border-b border-border font-semibold text-[14px] text-text-strong">
          <div>
            <div className="text-[14px] font-bold text-text-strong">答题卡</div>
            <div className="text-text-secondary text-[11px] font-medium mt-0.5">已处理 {correctCnt + wrongCnt + selectedCnt} / {totalQ}</div>
          </div>
          <button className="w-6.5 h-6.5 rounded-md border border-border bg-transparent text-text-secondary cursor-pointer text-[16px] flex items-center justify-center hover:text-text hover:border-text" onClick={onToggle} title="折叠">{collapsed ? '‹' : '›'}</button>
        </div>
        <div data-element="grid" className="flex-1 overflow-y-auto p-3 px-3">
          {groups.map(group => (
            <div className="mt-2.5 first:mt-0" key={group.pageNo}>
              <div className={`text-[11px] text-text-secondary uppercase tracking-wide mb-1.5 font-semibold ${group.isCurrent ? 'text-secondary' : ''}`}>
                P{group.pageNo}{group.isCurrent ? ' 当前' : ''}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.cells.map(cell => {
                  let cellCls = "";
                  if (cell.cls === 'correct') cellCls = "bg-success-light text-success border-success";
                  else if (cell.cls === 'wrong') cellCls = "bg-danger-light text-danger border-danger";
                  else if (cell.cls === 'selected-unsub') cellCls = "bg-primary-light text-primary border-primary";
                  else cellCls = "bg-surface-alt text-text-secondary border-border";

                  return (
                    <div
                      key={cell.gi}
                      data-element="cell"
                      data-state={cell.cls}
                      className={`w-7.5 h-7.5 rounded-[7px] flex items-center justify-center text-[12px] font-semibold cursor-pointer border transition-all duration-150 select-none hover:brightness-125 ${cellCls} ${group.isCurrent ? 'ring-1 ring-secondary ring-inset' : ''}`}
                      title={`第 ${cell.gi + 1} 题 · ${cell.title}`}
                      onClick={() => onJumpToQuestion(cell.gi)}
                    >
                      {cell.gi + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div data-element="stats" className="p-2.5 px-3.5 border-t border-border grid grid-cols-2 gap-x-2.5 gap-y-2 text-[12px] text-text-secondary max-md:flex max-md:flex-wrap max-md:gap-x-4">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0 bg-success" />对 {correctCnt}</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0 bg-danger" />错 {wrongCnt}</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0 bg-primary" />已选 {selectedCnt}</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full shrink-0 bg-border" />未做 {unansweredCnt}</div>
        </div>
      </div>
    </aside>
  );
}
