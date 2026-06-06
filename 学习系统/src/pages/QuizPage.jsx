import { useEffect } from 'react';
import { QuestionBlock } from '../components/QuestionBlock.jsx';

export function QuizPage({ quizState, onToggleOption, onSubmitPage, onNextPage, onShowResult, onReadChapter }) {
  const totalQ = quizState.questions.length;
  const totalPages = Math.ceil(totalQ / quizState.pageSize);
  const start = quizState.currentPageIdx * quizState.pageSize;
  const end = Math.min(start + quizState.pageSize, totalQ);
  const questions = quizState.questions.slice(start, end);
  const isSubmitted = quizState.submittedPages.includes(quizState.currentPageIdx);
  const isLastPage = quizState.currentPageIdx === totalPages - 1;
  const progress = totalPages > 0 
    ? (((quizState.currentPageIdx + (isSubmitted ? 1 : 0)) / totalPages) * 100).toFixed(0)
    : 0;
  const unansweredCount = isSubmitted ? 0 : questions.filter((_, li) => quizState.selections[start + li] === undefined).length;
  const allSelected = isSubmitted || unansweredCount === 0;
  const submitBtnClass = allSelected 
    ? "px-5 py-1.75 rounded-lg border-0 cursor-pointer text-[13px] font-bold transition-all duration-180 bg-primary text-white hover:bg-primary-hover select-none active:scale-[0.98]"
    : "px-5 py-1.75 rounded-lg border border-dashed border-border cursor-not-allowed text-[13px] font-bold transition-all duration-180 bg-transparent text-text-secondary select-none opacity-40";

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      const q = quizState.questions[start];
      if (!q) return;

      if (!isSubmitted) {
        if (q.type === 'judgment') {
          if (key === 't' || key === 'y' || key === '1' || e.key === '✓') {
            onToggleOption(start, 0);
          } else if (key === 'f' || key === 'n' || key === '2' || e.key === '✗') {
            onToggleOption(start, 1);
          }
        } else {
          const optionKeys = ['a', 'b', 'c', 'd', 'e', 'f'];
          const numKeys = ['1', '2', '3', '4', '5', '6'];
          let optIdx = optionKeys.indexOf(key);
          if (optIdx === -1) {
            optIdx = numKeys.indexOf(key);
          }
          if (optIdx !== -1 && optIdx < q.options.length) {
            onToggleOption(start, optIdx);
          }
        }
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isSubmitted) {
          if (allSelected) {
            onSubmitPage();
          }
        } else {
          if (!isLastPage) {
            onNextPage();
          } else {
            onShowResult();
          }
        }
      } else if (e.key === 'ArrowRight') {
        if (isSubmitted && !isLastPage) {
          onNextPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quizState, isSubmitted, allSelected, isLastPage, start, onToggleOption, onSubmitPage, onNextPage, onShowResult]);

  return (
    <div data-component="quiz-page" className="max-w-[700px] mx-auto pt-4 relative">
      {/* 顶部 2px 极细定位进度线 */}
      <div className="fixed top-0 left-0 right-0 h-[1.5px] bg-white/10 dark:bg-white/10 z-[9999] pointer-events-none">
        <div 
          className="h-full bg-primary opacity-70 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 极简答题页头部信息 */}
      <div data-element="quiz-header" className="mb-6 flex items-center justify-between text-text-secondary select-none">
        <div className="text-[12px] font-bold tracking-widest uppercase opacity-75">
          {quizState.type === 'doc' ? '📝 随堂自测' : quizState.type === 'wrongbook' ? '🧩 错题练习' : quizState.type === 'breaker' ? '🗺️ 卡片自测' : '🎯 模块刷题'}
        </div>
        <div className="text-[12px] font-semibold opacity-75">
          {quizState.currentPageIdx + 1} / {totalPages}
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

      {/* 答题交互动作与键盘快捷键提示 */}
      <div data-element="quiz-actions" className="flex items-center justify-between mt-6 border-t border-border/40 pt-4">
        <div className="text-[11px] text-text-secondary opacity-35 hover:opacity-70 transition-opacity duration-200 flex items-center gap-3 select-none">
          {!isSubmitted ? (
            <>
              <span>[ A-D / 1-4 ] 选择</span>
              {allSelected && <span>[ Space / Enter ] 提交</span>}
            </>
          ) : (
            <span>[ Space / Enter / → ] {isLastPage ? '查看结果' : '下一题'}</span>
          )}
        </div>

        <div className="flex gap-2.5">
          {!isSubmitted && (
            <button
              className={submitBtnClass}
              disabled={!allSelected}
              onClick={onSubmitPage}
            >
              {allSelected ? '确认提交' : `还需回答 ${unansweredCount} 题`}
            </button>
          )}
          {isSubmitted && !isLastPage && (
            <button 
              className="px-5 py-1.75 rounded-lg border border-border cursor-pointer text-[13px] font-bold transition-all duration-180 bg-surface text-text hover:border-primary hover:text-primary select-none active:scale-[0.98]" 
              onClick={onNextPage}
            >
              下一题 →
            </button>
          )}
          {isSubmitted && isLastPage && (
            <button 
              className="px-5 py-1.75 rounded-lg border-0 cursor-pointer text-[13px] font-bold transition-all duration-180 bg-primary text-white hover:bg-primary-hover select-none active:scale-[0.98]" 
              onClick={onShowResult}
            >
              最终结果 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

