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
    <div className="max-w-[760px] mx-auto">
      <div className="mb-7">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-[22px] font-bold mb-1.5 text-text-strong">{quizState.type === 'doc' ? '📝 随堂作业' : quizState.type === 'wrongbook' ? '🧩 错题练习' : quizState.type === 'breaker' ? '🗺️ 卡片自测' : '🎯 模块刷题'}</h2>
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] text-text-secondary">第 {quizState.currentPageIdx + 1} / {totalPages} 页 · 共 {totalQ} 题</span>
          </div>
        </div>
        <div className="h-1 bg-border rounded-[2px] mt-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-[2px] transition-[width] duration-400" style={{ width: `${progress}%` }} />
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

      <div className="flex justify-end gap-2.5 mt-5">
        {!isSubmitted && (
          <button
            className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!allSelected}
            onClick={onSubmitPage}
          >
            {allSelected ? '提交答案' : `还需回答 ${unansweredCount} 题`}
          </button>
        )}
        {isSubmitted && !isLastPage && <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover" onClick={onNextPage}>下一页 →</button>}
        {isSubmitted && isLastPage && <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover" onClick={onShowResult}>查看最终结果</button>}
      </div>
    </div>
  );
}
