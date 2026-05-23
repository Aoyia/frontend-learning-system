import { LEARNING_CONTENT } from '../../data/learning-content.js';

export function QuizResult({ quizState, onStartDocQuiz, onNextDoc, onBackModule, onBackDrill, onStartDrill, onBackWrongBook, onStartWrongBook, onBackBreaker, onStartBreakerQuiz }) {
  const total = quizState.questions.length;
  const pct = Math.round((quizState.score / total) * 100);
  const emoji = pct >= 90 ? '🎉' : pct >= 70 ? '👍' : pct >= 50 ? '🤔' : '😅';
  const msg = pct >= 90 ? '优秀！掌握得非常扎实' : pct >= 70 ? '不错！继续加油' : pct >= 50 ? '还需要再复习一下' : '建议重新阅读本篇内容';
  const moduleDocLen = quizState.type === 'doc' ? LEARNING_CONTENT.modules.find(x => x.id === quizState.moduleId).docs.length : 0;
  const hasNextDoc = quizState.type === 'doc' ? quizState.docIdx + 1 < moduleDocLen : false;

  return (
    <div className="quiz-wrap">
      <div className="quiz-result">
        <div className="score-circle">
          <div className="score-num">{pct}%</div>
          <div className="score-label">{quizState.score}/{total}</div>
        </div>
        <h3>{emoji} {msg}</h3>
        <p>共 {total} 题，答对 {quizState.score} 题</p>
        <div className="actions">
          {quizState.type === 'doc' ? (
            <>
              <button className="btn btn-outline" onClick={() => onStartDocQuiz(quizState.moduleId, quizState.docIdx)}>再做一次</button>
              <button
                className="btn btn-primary"
                onClick={() => hasNextDoc ? onNextDoc(quizState.moduleId, quizState.docIdx + 1) : onBackModule()}
              >
                {hasNextDoc ? '下一篇' : '返回模块'}
              </button>
            </>
          ) : quizState.type === 'wrongbook' ? (
            <>
              <button className="btn btn-outline" onClick={onBackWrongBook}>返回错题本</button>
              <button className="btn btn-primary" onClick={() => onStartWrongBook(quizState.moduleId === 'all' ? null : quizState.moduleId)}>继续练错题</button>
            </>
          ) : quizState.type === 'breaker' ? (
            <>
              <button className="btn btn-outline" onClick={onBackBreaker}>返回卡片</button>
              <button className="btn btn-primary" onClick={() => onStartBreakerQuiz(quizState.moduleId)}>再做一次</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={onBackDrill}>换模块</button>
              <button className="btn btn-primary" onClick={() => onStartDrill(quizState.moduleId)}>再刷一组</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
