import { formatAnswer, isAnswerCorrect } from '../utils/quiz.js';
import { marked } from 'marked';

export function QuestionBlock({ question, globalIdx, isSubmitted, selected, answered, onToggleOption, onReadChapter }) {
  const typeLabel = question.type === 'single' ? '单选' : question.type === 'multiple' ? '多选' : '判断';
  const renderOptionMarkdown = text => ({ __html: marked.parse(text || '').trim() });

  return (
    <div data-component="question-block" className="bg-surface border border-border rounded-xl p-6 mb-4" id={`qq-${globalIdx}`}>
      <div data-element="question-meta" className="flex items-center gap-2 text-[12px] text-text-secondary mb-2.5">
        <span>第 {globalIdx + 1} 题</span>
        <span className={`question-type-badge ${question.type}`}>{typeLabel}</span>
      </div>
      <div 
        data-element="question-stem" 
        className="text-[16px] font-medium leading-relaxed mb-5 text-text-strong md-body quiz-question-text"
        dangerouslySetInnerHTML={{ __html: marked.parse(question.question || '') }}
      />
      <div data-element="options" className="flex flex-col gap-2.5">
        {question.options.map((opt, i) => {
          const keyLabel = question.type === 'judgment' ? (i === 0 ? '✓' : '✗') : 'ABCDEF'[i];
          
          // 动态拼接 Tailwind 状态类，保障在单行与多行下完美自适应高度
          let optionClass = "flex items-start gap-3 p-2.5 px-3.5 bg-surface-alt border border-border rounded-lg transition-all duration-150 text-[14px] leading-relaxed ";
          let optKeyClass = "min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ";
          let optState = "default";
          
          if (isSubmitted) {
            const isCorrect = Array.isArray(question.answer) ? question.answer.includes(i) : question.answer === i;
            const isSelected = Array.isArray(answered) ? answered.includes(i) : answered === i;
            optionClass += "cursor-default ";
            if (isCorrect) {
              optionClass += "border-success bg-success-light ";
              optKeyClass += "bg-success text-white";
              optState = "correct";
            } else if (isSelected) {
              optionClass += "border-danger bg-danger-light ";
              optKeyClass += "bg-danger text-white";
              optState = "wrong";
            } else {
              optKeyClass += "bg-border text-text-secondary";
              optState = "unselected";
            }
          } else {
            const isSel = Array.isArray(selected) ? selected.includes(i) : selected === i;
            optionClass += "cursor-pointer hover:border-primary hover:bg-primary/10 ";
            if (isSel && selected !== undefined) {
              optionClass += "border-primary bg-primary-light ";
              optKeyClass += "bg-primary text-white";
              optState = "selected";
            } else {
              optKeyClass += "bg-border text-text-secondary";
              optState = "unselected";
            }
          }
          
          return (
            <div key={opt} data-element="option" data-state={optState} className={optionClass} onClick={isSubmitted ? undefined : () => onToggleOption(globalIdx, i)}>
              <span className={optKeyClass}>{keyLabel}</span>
              <div className="min-w-0 flex-1 break-all text-text [&_p]:m-0" dangerouslySetInnerHTML={renderOptionMarkdown(opt)} />
            </div>
          );
        })}
      </div>
      {isSubmitted && (
        <div data-element="explanation" className="mt-3.5 p-3.5 bg-primary-muted rounded-lg text-[13px] text-text-secondary leading-relaxed flex flex-col gap-1.5">
          <div><strong className="text-text-strong">正确答案：</strong>{formatAnswer(question, question.answer)}</div>
          {answered !== undefined && !isAnswerCorrect(question, answered) && (
            <div><strong className="text-text-strong">你的答案：</strong>{formatAnswer(question, answered)}</div>
          )}
          {question.explain && (
            <div
              className="quiz-explain-text text-text-secondary"
              dangerouslySetInnerHTML={{ __html: marked.parse(question.explain) }}
            />
          )}
          {question._moduleId && (
            <div data-element="recommend-link" className="mt-2.5 pt-2.5 border-t border-primary/18 flex items-center gap-2 flex-wrap text-text-secondary">
              <span>推荐阅读：</span>
              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/learn/${question._moduleId}/${question._docIdx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary cursor-pointer text-[13px] font-semibold p-0 hover:underline"
              >
                {question._moduleName} / {question._docTitle}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
