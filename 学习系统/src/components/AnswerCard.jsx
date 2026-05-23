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

  return (
    <aside
      className={`answer-card-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}
      style={{ display: 'flex' }}
    >
      <div className="ac-collapsed-bar" onClick={onToggle}>
        <span className="ac-collapsed-title">答题卡</span>
      </div>
      <div className="ac-inner">
        <div className="ac-header">
          <div>
            <div className="ac-header-title">答题卡</div>
            <div className="ac-progress-text">已处理 {correctCnt + wrongCnt + selectedCnt} / {totalQ}</div>
          </div>
          <button className="ac-toggle-btn" onClick={onToggle} title="折叠">{collapsed ? '‹' : '›'}</button>
        </div>
        <div className="answer-card-body">
          {groups.map(group => (
            <div className="answer-card-page" key={group.pageNo}>
              <div className={`answer-card-page-label${group.isCurrent ? ' current' : ''}`}>
                P{group.pageNo}{group.isCurrent ? ' 当前' : ''}
              </div>
              <div className="answer-card-grid">
                {group.cells.map(cell => (
                  <div
                    key={cell.gi}
                    className={`ac-cell ${cell.cls}${group.isCurrent ? ' is-current-page' : ''}`}
                    title={`第 ${cell.gi + 1} 题 · ${cell.title}`}
                    onClick={() => onJumpToQuestion(cell.gi)}
                  >
                    {cell.gi + 1}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="answer-card-summary">
          <div className="ac-sum-item"><div className="ac-sum-dot" style={{ background: 'var(--success)' }} />对 {correctCnt}</div>
          <div className="ac-sum-item"><div className="ac-sum-dot" style={{ background: 'var(--danger)' }} />错 {wrongCnt}</div>
          <div className="ac-sum-item"><div className="ac-sum-dot" style={{ background: 'var(--accent)' }} />已选 {selectedCnt}</div>
          <div className="ac-sum-item"><div className="ac-sum-dot" style={{ background: 'var(--border)' }} />未做 {unansweredCnt}</div>
        </div>
      </div>
    </aside>
  );
}
