import { useEffect, useRef } from 'react';
import { QuestionBlock } from '../components/QuestionBlock.jsx';
import { isAnswerCorrect } from '../utils/quiz.js';
import { OralDrillPanel } from '../components/OralDrillPanel.jsx';

export function QuizPage({ 
  quizState, 
  onToggleOption, 
  onSubmitPage, 
  onNextPage, 
  onShowResult, 
  onReadChapter, 
  immersiveMode, 
  onToggleImmersive,
  onJumpToQuestion 
}) {
  if (quizState?.type === 'expression') {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 py-4">
        <OralDrillPanel
          quizState={quizState}
          onToggleOption={onToggleOption}
          onSubmitPage={onSubmitPage}
          onNextPage={onNextPage}
          onShowResult={onShowResult}
          onJumpToQuestion={onJumpToQuestion}
        />
      </div>
    );
  }

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

  // 沉浸单题模式所需的计算属性
  const activeQuestionIdx = quizState.activeQuestionIdx !== undefined 
    ? quizState.activeQuestionIdx 
    : start;
  const activeLocalIdx = Math.max(0, Math.min(questions.length - 1, activeQuestionIdx - start));
  const currentQ = questions[activeLocalIdx];
  const globalActiveIdx = start + activeLocalIdx;

  // 自动切题定时器
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleOptionSelect = (qIdx, optIdx) => {
    onToggleOption(qIdx, optIdx);
    const q = quizState.questions[qIdx];
    if (immersiveMode && q && (q.type === 'single' || q.type === 'judgment')) {
      const localIdx = qIdx - start;
      if (localIdx < questions.length - 1) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          onJumpToQuestion(qIdx + 1);
        }, 300);
      }
    }
  };

  // 提交按钮样式（在沉浸模式下渲染为无背景细边药丸形状，允许空题提交）
  const submitBtnClass = immersiveMode
    ? "px-5 py-1.75 rounded-full border border-primary bg-transparent text-primary hover:bg-primary/5 cursor-pointer text-[13px] font-medium transition-all duration-180 select-none active:scale-[0.98]"
    : "px-5 py-1.75 rounded-lg border-0 cursor-pointer text-[13px] font-bold transition-all duration-180 bg-primary text-white hover:bg-primary-hover select-none active:scale-[0.98]";

  const showActions = !immersiveMode || activeLocalIdx === questions.length - 1;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      // 在沉浸模式下使用 globalActiveIdx，非沉浸模式下用 start
      const targetIdx = immersiveMode ? globalActiveIdx : start;
      const q = quizState.questions[targetIdx];
      if (!q) return;

      if (!isSubmitted) {
        if (q.type === 'judgment') {
          if (key === 't' || key === 'y' || key === '1' || e.key === '✓') {
            handleOptionSelect(targetIdx, 0);
          } else if (key === 'f' || key === 'n' || key === '2' || e.key === '✗') {
            handleOptionSelect(targetIdx, 1);
          }
        } else {
          const optionKeys = ['a', 'b', 'c', 'd', 'e', 'f'];
          const numKeys = ['1', '2', '3', '4', '5', '6'];
          let optIdx = optionKeys.indexOf(key);
          if (optIdx === -1) {
            optIdx = numKeys.indexOf(key);
          }
          if (optIdx !== -1 && optIdx < q.options.length) {
            handleOptionSelect(targetIdx, optIdx);
          }
        }
      }

      // 沉浸模式下的键盘左右键快速切题
      if (immersiveMode) {
        if (e.key === 'ArrowLeft') {
          if (activeLocalIdx > 0) {
            e.preventDefault();
            onJumpToQuestion(globalActiveIdx - 1);
          }
          return;
        } else if (e.key === 'ArrowRight') {
          if (activeLocalIdx < questions.length - 1) {
            e.preventDefault();
            onJumpToQuestion(globalActiveIdx + 1);
          }
          return;
        }
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isSubmitted) {
          onSubmitPage();
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
  }, [quizState, isSubmitted, allSelected, isLastPage, start, onToggleOption, onSubmitPage, onNextPage, onShowResult, immersiveMode, activeLocalIdx, globalActiveIdx, onJumpToQuestion, questions.length]);

  return (
    <div data-component="quiz-page" className={`max-w-[700px] mx-auto ${immersiveMode ? 'pt-10' : 'pt-4'} relative`}>
      {/* 顶部 2px 极细定位进度线 */}
      <div className="fixed top-0 left-0 right-0 h-[1.5px] bg-white/10 dark:bg-white/10 z-[9999] pointer-events-none">
        <div 
          className="h-full bg-primary opacity-70 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 极简答题页头部信息：启用沉浸模式后完全隐去，最大化视觉降噪 */}
      {!immersiveMode && (
        <div data-element="quiz-header" className="mb-6 flex items-center justify-between text-text-secondary select-none">
          <div className="flex items-center gap-3">
            <div className="text-[12px] font-bold tracking-widest uppercase opacity-75">
              {quizState.type === 'doc' ? '📝 随堂自测' : quizState.type === 'wrongbook' ? '🧩 错题练习' : quizState.type === 'breaker' ? '🗺️ 卡片自测' : '🎯 模块刷题'}
            </div>
            <button 
              className="bg-transparent border-0 p-0 cursor-pointer text-text-secondary hover:text-primary select-none opacity-50 hover:opacity-100 transition-all duration-150 active:scale-[0.9] flex items-center justify-center"
              onClick={onToggleImmersive}
              title="进入专注模式"
            >
              <svg 
                className="w-3.5 h-3.5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" />
              </svg>
            </button>
          </div>
          <div className="text-[12px] font-semibold opacity-75">
            {quizState.currentPageIdx + 1} / {totalPages}
          </div>
        </div>
      )}

      {/* 题目内容区域：添加 transition 容器以实现动画过渡 */}
      <div 
        key={immersiveMode ? globalActiveIdx : quizState.currentPageIdx} 
        className="quiz-transition-container"
      >
        {immersiveMode ? (
          currentQ && (
            <QuestionBlock
              key={globalActiveIdx}
              question={currentQ}
              globalIdx={globalActiveIdx}
              isSubmitted={isSubmitted}
              selected={quizState.selections[globalActiveIdx]}
              answered={quizState.answers[globalActiveIdx]}
              onToggleOption={handleOptionSelect}
              onReadChapter={onReadChapter}
              immersiveMode={immersiveMode}
            />
          )
        ) : (
          questions.map((q, li) => (
            <QuestionBlock
              key={start + li}
              question={q}
              globalIdx={start + li}
              isSubmitted={isSubmitted}
              selected={quizState.selections[start + li]}
              answered={quizState.answers[start + li]}
              onToggleOption={onToggleOption}
              onReadChapter={onReadChapter}
              immersiveMode={immersiveMode}
            />
          ))
        )}
      </div>

      {/* 提交后的快捷对错导航组件 */}
      {isSubmitted && (
        <div className="flex flex-col gap-2.5 my-6 p-4 bg-surface-alt/40 border border-border/40 rounded-xl select-none animate-slide-up">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-secondary/60 font-bold tracking-wider uppercase">
              本组答题报告
            </span>
            <span className="text-[11px] text-text-secondary/60 font-semibold">
              点击题号可快速导航跳转
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {questions.map((q, li) => {
              const globalIdx = start + li;
              const correct = isAnswerCorrect(q, quizState.answers[globalIdx]);
              const isActive = immersiveMode ? globalActiveIdx === globalIdx : false;
              
              return (
                <button
                  key={globalIdx}
                  onClick={() => onJumpToQuestion(globalIdx)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold border transition-all duration-200 cursor-pointer active:scale-95 ${
                    correct 
                      ? 'bg-success-light text-success border-success/30 hover:bg-success-light/80 hover:border-success/50' 
                      : 'bg-danger-light text-danger border-danger/30 hover:bg-danger-light/80 hover:border-danger/50'
                  } ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                  title={`第 ${globalIdx + 1} 题 · ${correct ? '回答正确' : '回答错误'}`}
                >
                  Q{globalIdx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 沉浸模式下的单题快捷控制条 */}
      {immersiveMode && (
        <div data-element="single-nav" className="flex items-center justify-between mt-5 mb-5 px-1 select-none">
          <button
            className={`flex items-center gap-1 bg-transparent border-0 p-1.5 cursor-pointer text-text-secondary transition-colors duration-150 rounded-full hover:text-primary ${
              activeLocalIdx === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100'
            }`}
            disabled={activeLocalIdx === 0}
            onClick={() => onJumpToQuestion(globalActiveIdx - 1)}
            title="上一题"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <span className="text-[12px] font-semibold text-text-secondary/70">
            {activeLocalIdx + 1} / {questions.length}
          </span>

          <button
            className={`flex items-center gap-1 bg-transparent border-0 p-1.5 cursor-pointer text-text-secondary transition-colors duration-150 rounded-full hover:text-primary ${
              activeLocalIdx === questions.length - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100'
            }`}
            disabled={activeLocalIdx === questions.length - 1}
            onClick={() => onJumpToQuestion(globalActiveIdx + 1)}
            title="下一题"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* 答题交互动作与键盘快捷键提示：沉浸模式下只在最后一题出现 */}
      {showActions && (
        <div data-element="quiz-actions" className="flex items-center justify-between mt-6 border-t border-border/40 pt-4">
          {!immersiveMode ? (
            <div className="text-[11px] text-text-secondary opacity-35 hover:opacity-70 transition-opacity duration-200 flex items-center gap-3 select-none">
              {!isSubmitted ? (
                <>
                  <span>[ A-D / 1-4 ] 选择</span>
                  <span>[ Space / Enter ] 提交</span>
                </>
              ) : (
                <span>[ Space / Enter / → ] {isLastPage ? '查看结果' : '下一题'}</span>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex gap-2.5">
            {!isSubmitted && (
              <button
                className={submitBtnClass}
                onClick={onSubmitPage}
              >
                确认提交
              </button>
            )}
            {isSubmitted && !isLastPage && (
              <button 
                className={immersiveMode
                  ? "px-5 py-1.75 rounded-full border border-border bg-transparent cursor-pointer text-[13px] font-medium text-text hover:border-primary hover:text-primary select-none transition-all active:scale-[0.98]"
                  : "px-5 py-1.75 rounded-lg border border-border cursor-pointer text-[13px] font-bold transition-all duration-180 bg-surface text-text hover:border-primary hover:text-primary select-none active:scale-[0.98]"}
                onClick={onNextPage}
              >
                下一题 →
              </button>
            )}
            {isSubmitted && isLastPage && (
              <button 
                className={immersiveMode
                  ? "px-5 py-1.75 rounded-full border border-primary bg-transparent cursor-pointer text-[13px] font-medium text-primary hover:bg-primary/5 select-none transition-all active:scale-[0.98]"
                  : "px-5 py-1.75 rounded-lg border-0 cursor-pointer text-[13px] font-bold transition-all duration-180 bg-primary text-white hover:bg-primary-hover select-none active:scale-[0.98]"}
                onClick={onShowResult}
              >
                最终结果 →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
