import { formatAnswer, isAnswerCorrect } from '../utils/quiz.js';
import { marked } from 'marked';

export function QuestionBlock({ question, globalIdx, isSubmitted, selected, answered, onToggleOption, onReadChapter }) {
  const typeLabel = question.type === 'single' ? '单选' : question.type === 'multiple' ? '多选' : '判断';
  const renderOptionMarkdown = text => ({ __html: marked.parse(text || '').trim() });

  return (
    <div className="quiz-question" id={`qq-${globalIdx}`}>
      <div className="quiz-question-num">第 {globalIdx + 1} 题 · {typeLabel}</div>
      {question._moduleName && question._docTitle && (
        <div className="quiz-question-context">
          {question._moduleName} / {question._docTitle}
        </div>
      )}
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
              <div className="quiz-option-content" dangerouslySetInnerHTML={renderOptionMarkdown(opt)} />
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
          {question.explain && (
            <div
              className="quiz-explain-text"
              dangerouslySetInnerHTML={{ __html: marked.parse(question.explain) }}
            />
          )}
          {question._moduleId && (
            <div className="recommended-reading">
              <span>推荐阅读：</span>
              <button className="reading-link" onClick={() => onReadChapter(question._moduleId, question._docIdx)}>
                {question._moduleName} / {question._docTitle}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
