import { QuestionBlock } from '../components/QuestionBlock.jsx';

export function QuizPage({ quizState, onToggleOption, onSubmitPage, onNextPage, onShowResult, onReadChapter }) {
  const totalQ = quizState.questions.length;
  const totalPages = Math.ceil(totalQ / quizState.pageSize);
  const start = quizState.currentPageIdx * quizState.pageSize;
  const end = Math.min(start + quizState.pageSize, totalQ);
  const questions = quizState.questions.slice(start, end);
  const isSubmitted = quizState.submittedPages.includes(quizState.currentPageIdx);
  const isLastPage = quizState.currentPageIdx === totalPages - 1;
  const progress = ((quizState.currentPageIdx + (isSubmitted ? 1 : 0)) / totalPages * 100).toFixed(0);
  const unansweredCount = isSubmitted ? 0 : questions.filter((_, li) => quizState.selections[start + li] === undefined).length;
  const allSelected = isSubmitted || unansweredCount === 0;

  return (
    <div className="quiz-wrap">
      <div className="quiz-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <h2>{quizState.type === 'doc' ? '📝 随堂作业' : quizState.type === 'wrongbook' ? '🧩 错题练习' : quizState.type === 'breaker' ? '🗺️ 卡片自测' : '🎯 模块刷题'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>第 {quizState.currentPageIdx + 1} / {totalPages} 页 · 共 {totalQ} 题</span>
          </div>
        </div>
        <div className="quiz-progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {questions.map((q, li) => (
        <QuestionBlock
          key={start + li}
          question={q}
          globalIdx={start + li}
          isSubmitted={isSubmitted}
          selected={quizState.selections[start + li]}
          answered={quizState.answers[start + li]}
          onToggleOption={onToggleOption}
          onReadChapter={onReadChapter}
        />
      ))}

      <div className="quiz-actions">
        {!isSubmitted && (
          <button
            className="btn btn-primary"
            disabled={!allSelected}
            onClick={onSubmitPage}
          >
            {allSelected ? '提交答案' : `还需回答 ${unansweredCount} 题`}
          </button>
        )}
        {isSubmitted && !isLastPage && <button className="btn btn-primary" onClick={onNextPage}>下一页 →</button>}
        {isSubmitted && isLastPage && <button className="btn btn-primary" onClick={onShowResult}>查看最终结果</button>}
      </div>
    </div>
  );
}
