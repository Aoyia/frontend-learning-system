import { useState, useEffect, useMemo } from 'react';
import { formatAnswer, isAnswerCorrect } from '../utils/quiz.js';
import { marked } from 'marked';

export function QuestionBlock({ question, globalIdx, isSubmitted, selected, answered, onToggleOption, onReadChapter }) {
  const typeLabel = question.type === 'single' ? '单选' : question.type === 'multiple' ? '多选' : '判断';

  const parsedQuestionStem = useMemo(() => ({ 
    __html: marked.parse(question.question || '') 
  }), [question.question]);

  const parsedOptions = useMemo(() => {
    return question.options.map(opt => ({ 
      __html: marked.parse(opt || '').trim() 
    }));
  }, [question.options]);

  const parsedExplain = useMemo(() => {
    return question.explain ? { __html: marked.parse(question.explain) } : null;
  }, [question.explain]);

  const isCorrect = isSubmitted && answered !== undefined && isAnswerCorrect(question, answered);
  const [showExplain, setShowExplain] = useState(false);

  useEffect(() => {
    if (isSubmitted) {
      setShowExplain(!isCorrect);
    }
  }, [isSubmitted, isCorrect]);

  return (
    <div data-component="question-block" className="quiz-question-block bg-transparent border-0 p-0 mb-6" id={`qq-${globalIdx}`}>
      <div 
        data-element="question-stem" 
        className="text-[17px] font-semibold leading-relaxed mb-5 text-text-strong md-body quiz-question-text"
        dangerouslySetInnerHTML={parsedQuestionStem}
      />
      <div data-element="options" className="flex flex-col gap-2">
        {question.options.map((opt, i) => {
          const keyLabel = question.type === 'judgment' ? (i === 0 ? '✓' : '✗') : 'ABCDEF'[i];
          
          let optionClass = "quiz-option-item flex items-start gap-3 transition-all duration-150 text-[14px] leading-relaxed ";
          let optKeyClass = "quiz-option-key text-[13px] font-semibold text-text-secondary w-5 shrink-0 select-none ";
          let optState = "default";
          
          if (isSubmitted) {
            const isOptCorrect = Array.isArray(question.answer) ? question.answer.includes(i) : question.answer === i;
            const isOptSelected = Array.isArray(answered) ? answered.includes(i) : answered === i;
            optionClass += "cursor-default ";
            if (isOptCorrect) {
              optionClass += "correct ";
              optKeyClass += "text-success ";
              optState = "correct";
            } else if (isOptSelected) {
              optionClass += "wrong ";
              optKeyClass += "text-danger ";
              optState = "wrong";
            } else {
              optState = "unselected";
            }
          } else {
            const isSel = Array.isArray(selected) ? selected.includes(i) : selected === i;
            optionClass += "cursor-pointer ";
            if (isSel && selected !== undefined) {
              optionClass += "selected ";
              optKeyClass += "text-primary ";
              optState = "selected";
            } else {
              optState = "unselected";
            }
          }
          
          return (
            <div key={i} data-element="option" data-state={optState} className={optionClass} onClick={isSubmitted ? undefined : () => onToggleOption(globalIdx, i)}>
              <span className={optKeyClass}>{keyLabel}</span>
              <div className="min-w-0 flex-1 break-all text-text [&_p]:m-0" dangerouslySetInnerHTML={parsedOptions[i]} />
            </div>
          );
        })}
      </div>

      {isSubmitted && (
        <div data-element="explanation-container" className="mt-4 border-t border-border/40 pt-3">
          <div 
            className="flex items-center justify-between text-[12px] text-text-secondary cursor-pointer select-none pb-2" 
            onClick={() => setShowExplain(v => !v)}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isCorrect ? 'bg-success' : 'bg-danger'}`} />
              <span className="font-bold text-text-strong">
                {isCorrect ? '回答正确！' : '回答错误'}
              </span>
              <span className="opacity-75">· 正确答案是 {formatAnswer(question, question.answer)}</span>
            </div>
            <button className="text-secondary bg-transparent border-0 cursor-pointer p-0 text-[12px] font-semibold hover:underline">
              {showExplain ? '收起解析 ↑' : '查看解析 ↓'}
            </button>
          </div>
          
          {showExplain && (
            <div data-element="explanation" className="p-3.5 bg-primary-muted rounded-lg text-[13px] text-text-secondary leading-relaxed flex flex-col gap-1.5 transition-all duration-300">
              {answered !== undefined && !isCorrect && (
                <div><strong className="text-text-strong">你的答案：</strong>{formatAnswer(question, answered)}</div>
              )}
              {parsedExplain && (
                <div
                  className="quiz-explain-text text-text-secondary"
                  dangerouslySetInnerHTML={parsedExplain}
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
      )}
    </div>
  );
}
