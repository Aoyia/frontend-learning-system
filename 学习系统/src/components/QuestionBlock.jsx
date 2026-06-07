import { useState, useEffect, useMemo } from 'react';
import { formatAnswer, isAnswerCorrect } from '../utils/quiz.js';
import { marked } from 'marked';

export function QuestionBlock({ question, globalIdx, isSubmitted, selected, answered, onToggleOption, onReadChapter, immersiveMode }) {
  const typeLabel = question.type === 'single' ? '单选' : question.type === 'multiple' ? '多选' : '判断';

  const renderAnswerDetails = (ans) => {
    const getOptText = (idx) => {
      if (idx === undefined || idx === null) return '未作答';
      let text = question.options[idx] || '';
      // 去除 markdown 或者 html 格式
      text = text.replace(/<[^>]*>/g, '').replace(/[#*`~_\-[\]()]/g, '').trim();
      // 截取前 35 个字符
      if (text.length > 35) {
        text = text.slice(0, 35) + '...';
      }
      const letter = question.type === 'judgment' ? (idx === 0 ? '✓ 对' : '✗ 错') : 'ABCDEF'[idx];
      return `${letter} (${text})`;
    };
    
    if (Array.isArray(ans)) {
      return ans.map(getOptText).join(' | ');
    }
    return getOptText(ans);
  };

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
        className="text-[17px] font-semibold leading-relaxed mb-5 text-text-strong md-body quiz-question-text flex items-start gap-2"
      >
        <span className="text-primary font-bold shrink-0 select-none flex items-center gap-1.5">
          Q{globalIdx + 1}.
          {question.type === 'multiple' && (
            <span className="text-[10px] font-bold tracking-wide bg-primary/8 text-primary px-1.5 py-0.5 rounded opacity-90 select-none">
              多选
            </span>
          )}
        </span>
        <div className="flex-1 [&_p]:m-0" dangerouslySetInnerHTML={parsedQuestionStem} />
      </div>
      <div data-element="options" className="flex flex-col gap-2">
        {question.options.map((opt, i) => {
          const keyLabel = question.type === 'judgment' ? (i === 0 ? '✓' : '✗') : 'ABCDEF'[i];
          
          let optionClass = "quiz-option-item flex items-start gap-3 transition-all duration-150 text-[16px] leading-relaxed ";
          let optKeyClass = "quiz-option-key text-[15px] font-semibold text-text-secondary w-5 shrink-0 select-none ";
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
        <div data-element="explanation-container" className={`mt-4 ${immersiveMode ? 'border-t border-dashed border-border/30' : 'border-t border-border/40'} pt-3`}>
          <div 
            className="flex items-center justify-between text-[12px] text-text-secondary cursor-pointer select-none pb-2" 
            onClick={() => setShowExplain(v => !v)}
          >
            <div className="flex items-center gap-2">
              <span className={`rounded-full ${immersiveMode ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${isCorrect ? 'bg-success' : 'bg-danger'}`} />
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
            <div 
              data-element="explanation" 
              className={`p-3.5 ${
                immersiveMode 
                  ? 'bg-transparent border-l-2 border-primary/20 pl-4.5 rounded-none' 
                  : 'bg-primary-muted rounded-lg'
              } text-[13px] text-text-secondary leading-relaxed flex flex-col gap-1.5 transition-all duration-300`}
            >
              {/* 精致且易读的答案对比卡片 */}
              <div className="flex flex-col gap-2 mb-3 p-3 bg-surface-alt/60 border border-border/40 rounded-xl select-none">
                <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row text-[13px]">
                  <span className="shrink-0 font-bold bg-success/8 text-success px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">正确答案</span>
                  <span className="text-text font-medium leading-relaxed">{renderAnswerDetails(question.answer)}</span>
                </div>
                {answered !== undefined && !isCorrect && (
                  <div className="flex items-start sm:items-center gap-2 flex-col sm:flex-row text-[13px] border-t border-border/20 pt-2">
                    <span className="shrink-0 font-bold bg-danger/8 text-danger px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">你的答案</span>
                    <span className="text-text font-medium leading-relaxed">{renderAnswerDetails(answered)}</span>
                  </div>
                )}
              </div>
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
