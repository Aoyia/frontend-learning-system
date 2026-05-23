import React from 'react';
import { isAnswerCorrect } from '../utils/quiz.js';
import { formatAnswer } from '../utils/helpers.js';

export default function QuizPage({ quizState, onToggleOption, onSubmitPage, onNextPage, onShowResult, onReadChapter }) {
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
          <h2>{quizState.type === 'doc' ? '📝 随堂作业' : quizState.type === 'wrongbook' ? '🧩 错题练习' : '🎯 模块刷题'}</h2>
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

function QuestionBlock({ question, globalIdx, isSubmitted, selected, answered, onToggleOption, onReadChapter }) {
  const typeLabel = question.type === 'single' ? '单选' : question.type === 'multiple' ? '多选' : '判断';

  return (
    <div className="quiz-question" id={`qq-${globalIdx}`}>
      <div className="quiz-question-num">第 {globalIdx + 1} 题 · {typeLabel}</div>
      <div className="quiz-question-text">{question.question}</div>
      <div className="quiz-options">
        {question.options.map((opt, i) => {
          const keyLabel = question.type === 'judgment' ? (i === 0 ? '✓' : '✗') : 'ABCDEF'[i];
          let cls = '';
          if (isSubmitted) {
            const isCorrect = Array.isArray(question.answer) ? question.answer.includes(i) : question.answer === i;
            const isSelected = Array.isArray(answered) ? answered.includes(i) : answered === i;
            cls = isCorrect ? 'correct disabled' : (isSelected ? 'wrong disabled' : 'disabled');
          } else {
            const isSel = Array.isArray(selected) ? selected.includes(i) : selected === i;
            cls = isSel && selected !== undefined ? 'selected' : '';
          }
          return (
            <div key={opt} className={`quiz-option ${cls}`} onClick={isSubmitted ? undefined : () => onToggleOption(globalIdx, i)}>
              <span className="opt-key">{keyLabel}</span>
              <span>{opt}</span>
            </div>
          );
        })}
      </div>
      {isSubmitted && (
        <div className="quiz-explain show">
          <div><strong>正确答案：</strong>{formatAnswer(question, question.answer)}</div>
          {answered !== undefined && !isAnswerCorrect(question, answered) && (
            <div><strong>你的答案：</strong>{formatAnswer(question, answered)}</div>
          )}
          {question.explain && <div className="quiz-explain-text">💡 {question.explain}</div>}
          {question._docTitle && (
            <div className="recommended-reading">
              <strong>推荐阅读：</strong>
              <button
                className="reading-link"
                onClick={() => onReadChapter(question._moduleId, question._docIdx)}
              >
                {question._moduleName} / {question._docTitle}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
