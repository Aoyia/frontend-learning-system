import { LEARNING_CONTENT } from '../../data/learning-content.js';

export function QuizResult({ quizState, onStartDocQuiz, onNextDoc, onBackModule, onBackDrill, onStartDrill, onBackWrongBook, onStartWrongBook, onBackBreaker, onStartBreakerQuiz }) {
  const total = quizState.questions.length;
  const pct = Math.round((quizState.score / total) * 100);
  const emoji = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : pct >= 50 ? '🤔' : '😅';
  const msg = pct >= 90 ? '优秀！掌握得非常扎实' : pct >= 70 ? '不错！继续加油' : pct >= 50 ? '还需要再复习一下' : '建议重新阅读本篇内容';
  const moduleDocLen = quizState.type === 'doc' ? LEARNING_CONTENT.modules.find(x => x.id === quizState.moduleId).docs.length : 0;
  const hasNextDoc = quizState.type === 'doc' ? quizState.docIdx + 1 < moduleDocLen : false;

  return (
    <div data-component="quiz-result" className="max-w-[760px] mx-auto">
      <div className="text-center py-10 px-5">
        <div className="w-[120px] h-[120px] rounded-full border-4 border-primary flex flex-col items-center justify-center mx-auto mb-5">
          <div className="text-[32px] font-bold text-primary">{pct}%</div>
          <div className="text-[12px] text-text-secondary">{quizState.score}/{total}</div>
        </div>
        <h3 className="text-[22px] font-bold mb-2 text-text-strong">{emoji} {msg}</h3>
        <p className="text-text-secondary mb-6">共 {total} 题，答对 {quizState.score} 题</p>
        <div className="flex gap-3 justify-center flex-wrap">
          {quizState.type === 'doc' ? (
            <>
              <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={() => onStartDocQuiz(quizState.moduleId, quizState.docIdx)}>再做一次</button>
              <button
                className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover"
                onClick={() => hasNextDoc ? onNextDoc(quizState.moduleId, quizState.docIdx + 1) : onBackModule()}
              >
                {hasNextDoc ? '下一篇' : '返回模块'}
              </button>
            </>
          ) : quizState.type === 'wrongbook' ? (
            <>
              <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={onBackWrongBook}>返回错题本</button>
              <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover" onClick={() => onStartWrongBook(quizState.moduleId === 'all' ? null : quizState.moduleId)}>继续练错题</button>
            </>
          ) : quizState.type === 'breaker' ? (
            <>
              <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={onBackBreaker}>返回卡片</button>
              <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover" onClick={() => onStartBreakerQuiz(quizState.moduleId)}>再做一次</button>
            </>
          ) : (
            <>
              <button className="px-5 py-2 rounded-lg border border-border bg-transparent text-text cursor-pointer text-[14px] font-semibold transition-all duration-200 hover:border-primary hover:text-primary" onClick={onBackDrill}>换模块</button>
              <button className="px-5 py-2 rounded-lg border-0 cursor-pointer text-[14px] font-semibold transition-all duration-200 bg-primary text-white hover:bg-primary-hover" onClick={() => onStartDrill(quizState.moduleId)}>再刷一组</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
