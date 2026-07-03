import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';

export function OralDrillPanel({
  quizState,
  onToggleOption,
  onSubmitPage,
  onNextPage,
  onShowResult,
  onJumpToQuestion,
  onPrevPage, // 新增：上一题回调
  onNextPageDirect, // 新增：右上角极速下一题回调
}) {
  const globalIdx = quizState.currentPageIdx * quizState.pageSize; // 因为 pageSize === 1，所以等于 currentPageIdx
  const q = quizState.questions[globalIdx];
  
  const isSubmitted = quizState.submittedPages.includes(quizState.currentPageIdx);
  const isLastPage = quizState.currentPageIdx === quizState.questions.length - 1;

  // 状态：'answering' | 'evaluating' | 'submitted'
  const [status, setStatus] = useState(isSubmitted ? 'submitted' : 'answering');
  
  // 计时器状态
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(!isSubmitted);
  
  // 手动输入/默写思路大纲
  const [userWrittenText, setUserWrittenText] = useState('');
  
  // 自评选中关键词列表
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  
  // AI 智能诊断状态
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  
  // 线索折叠状态
  const [showTips, setShowTips] = useState(false);

  // ================ 交互式大厂主考官现场追问状态 ================
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupWrittenText, setFollowupWrittenText] = useState('');
  const [followupSelectedKeywords, setFollowupSelectedKeywords] = useState([]);
  const [followupAiLoading, setFollowupAiLoading] = useState(false);
  const [followupAiResult, setFollowupAiResult] = useState(null);
  const [followupStatus, setFollowupStatus] = useState('answering'); // 'answering' | 'evaluating' | 'submitted'

  // 每次题目或提交状态改变，同步重置状态
  useEffect(() => {
    const submitted = quizState.submittedPages.includes(quizState.currentPageIdx);
    setStatus(submitted ? 'submitted' : 'answering');
    setSeconds(0);
    setIsTimerRunning(!submitted);
    setShowTips(false);
    setAiLoading(false);
    
    // 如果已经提交，则恢复用户勾选的关键词和手动输入内容及 AI 诊断结果
    if (submitted && quizState.selections[globalIdx]) {
      const savedData = quizState.selections[globalIdx];
      setSelectedKeywords(savedData.keywords || []);
      setUserWrittenText(savedData.writtenText || '');
      setAiResult(savedData.aiResult || null);
      if (savedData.timeSpent) setSeconds(savedData.timeSpent);

      // 恢复追问数据
      setShowFollowup(!!savedData.followupData);
      setFollowupWrittenText(savedData.followupData?.writtenText || '');
      setFollowupSelectedKeywords(savedData.followupData?.keywords || []);
      setFollowupAiResult(savedData.followupData?.aiResult || null);
      setFollowupStatus(savedData.followupData?.status || 'answering');
    } else {
      setSelectedKeywords([]);
      setUserWrittenText('');
      setAiResult(null);

      // 重置追问数据
      setShowFollowup(false);
      setFollowupWrittenText('');
      setFollowupSelectedKeywords([]);
      setFollowupAiResult(null);
      setFollowupStatus('answering');
    }
  }, [globalIdx]);

  // 计时器逻辑
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleRetry = () => {
    setStatus('answering');
    setUserWrittenText('');
    setSelectedKeywords([]);
    setAiResult(null);
    setSeconds(0);
    setIsTimerRunning(true);
    // 重置已保存的本题数据
    onToggleOption(globalIdx, null);
  };

  // 调用通义千问 API 做智能回答评估
  const runAiEvaluation = async () => {
    const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
    const model = import.meta.env.VITE_CHAT_MODEL || 'qwen3.5-35b-a3b';
    
    if (!apiKey) {
      console.warn('DashScope API Key 未配置，将降级为常规手动自评。');
      return null;
    }

    const systemPrompt = `你是一位专业的前端技术面试官。你的任务是评估用户针对特定前端面试题的回答思路大纲质量。
请根据题目问题、高分话术参考、以及必须涵盖的核心关键词，来分析用户的实际作答文本，给出智能的打分与改进建议。

对于 advice 字段：针对用户表达的逻辑性、条理性及内容缺陷，给出 2 到 3 句专业具体的面试改进建议。必须针对用户遗漏的关键技术点或表达模糊处，给出一到两个高分示范表达短句，格式为『推荐表达：“……”』，以便候选人能够直接在面试中组织语言。

你的输出必须是一个合法的 JSON 格式，不要包含任何 markdown 块或多余解释。格式必须精确对齐如下：
{
  "score": 0到100的整数（代表语义覆盖率与表述深度）,
  "hitKeywords": [分析用户文本中语义上提到了的核心关键词列表，必须从给出的关键词列表中筛选],
  "missingKeywords": [未提到的核心关键词列表，必须从给出的关键词列表中筛选],
  "advice": "针对用户表达的逻辑性、条理性及内容缺陷，给出 2 到 3 句专业具体的面试改进建议"
}`;

    const userPrompt = `
【面试真题】
${q.question}

【高频核心关键词】
${(q.keywords || []).join(', ')}

【高分话术参考】
${q.recommendStructure}

【用户的实际作答文本】
${userWrittenText.trim() || '(用户未提供任何思路大纲文本，直接查看了答案)'}

请进行语义匹配分析，判断用户的回答涵盖了哪些核心词（即便字面不完全一致，如果语义或者简称表达到了也算命中），计算得分并给出具体建议。
`;

    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`API 响应失败: ${response.status}`);
      }

      const data = await response.json();
      const jsonStr = data.choices[0].message.content;
      const cleanedStr = jsonStr.replace(/^```json\s*|```$/g, '').trim();
      return JSON.parse(cleanedStr);
    } catch (err) {
      console.error('调用千问大模型失败', err);
      return null;
    }
  };

  // 我说完了，看参考答案与 AI 自评
  const handleShowAnswer = async () => {
    setIsTimerRunning(false);
    setStatus('evaluating');
    
    // 如果有 API Key 且用户输入了内容，则运行 AI 自评
    const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
    if (apiKey && userWrittenText.trim()) {
      setAiLoading(true);
      const result = await runAiEvaluation();
      if (result) {
        setAiResult(result);
        // 自动将 AI 识别出来的命中关键词勾选上
        if (Array.isArray(result.hitKeywords)) {
          setSelectedKeywords(result.hitKeywords.filter(k => q.keywords?.includes(k)));
        }
      }
      setAiLoading(false);
    }
  };

  // 切换选中关键词
  const handleToggleKeyword = (kw) => {
    setSelectedKeywords(prev => {
      if (prev.includes(kw)) {
        return prev.filter(k => k !== kw);
      } else {
        return [...prev, kw];
      }
    });
  };

  // 计算当前的匹配分数和正确性
  const totalKeywordsCount = q.keywords?.length || 0;
  const matchPct = totalKeywordsCount > 0 
    ? Math.round((selectedKeywords.length / totalKeywordsCount) * 100)
    : 0;
    
  // 如果有 AI 结果，以 AI 的评分为主要参考，没有则按勾选占比
  const scoreToSubmit = aiResult ? aiResult.score : matchPct;
  const isAnswerOk = scoreToSubmit >= 60;

  // 提交本次评估
  const handleSubmit = () => {
    const selectedData = {
      isCorrect: isAnswerOk,
      score: scoreToSubmit,
      keywords: selectedKeywords,
      timeSpent: seconds,
      writtenText: userWrittenText,
      aiResult: aiResult,
      // 保存追问数据包
      followupData: showFollowup ? {
        writtenText: followupWrittenText,
        keywords: followupSelectedKeywords,
        aiResult: followupAiResult,
        status: followupStatus,
      } : null
    };
    
    // 保存选择
    onToggleOption(globalIdx, selectedData);
    
    // 异步执行提交流程 (更新 IndexedDB + 刷新 submittedPages)
    setTimeout(() => {
      onSubmitPage();
      setStatus('submitted');
    }, 100);
  };

  // 调用通义千问 API 对追问做智能评估
  const runFollowupAiEvaluation = async () => {
    const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
    const model = import.meta.env.VITE_CHAT_MODEL || 'qwen3.5-35b-a3b';
    
    if (!apiKey) {
      console.warn('DashScope API Key 未配置，将降级为常规手动自评。');
      return null;
    }

    const systemPrompt = `你是一位专业的前端技术面试官。你的任务是评估用户针对“大厂面试追问问题”的回答思路大纲质量。
请根据追问问题、追问高分话术参考、以及追问的核心关键词，来分析用户的实际作答文本，给出智能的打分与改进建议。

对于 advice 字段：给出 2 到 3 句专业具体的面试改进建议。必须针对用户追问回答中的漏洞或表述不清，给出相应的示范表达短句，格式为『推荐表达：“……”』，帮助其把追问的技术细节说透。

你的输出必须是一个合法的 JSON 格式，不要包含任何 markdown 块或多余解释。格式必须精确对齐如下：
{
  "score": 0到100的整数,
  "hitKeywords": [分析用户文本中语义上提到了的核心关键词列表，必须从给出的关键词列表中筛选],
  "missingKeywords": [未提到的核心关键词列表，必须从给出的关键词列表中筛选],
  "advice": "改进建议与示范表达短句（如『推荐表达：“……”』）"
}`;

    const userPrompt = `
【面试深度追问真题】
${q.followupQuestion}

【追问核心关键词】
${(q.followupKeywords || []).join(', ')}

【追问高分话术参考】
${q.followupAnswer}

【用户的实际作答文本】
${followupWrittenText.trim() || '(用户未提供任何思路大纲，直接查看了追问答案)'}

请进行语义匹配分析，判断用户的回答涵盖了哪些核心词（包含同义词与简称匹配），计算得分并给出具体建议。
`;

    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`API 响应失败: ${response.status}`);
      }

      const data = await response.json();
      const jsonStr = data.choices[0].message.content;
      const cleanedStr = jsonStr.replace(/^```json\s*|```$/g, '').trim();
      return JSON.parse(cleanedStr);
    } catch (err) {
      console.error('调用千问大模型追问评估失败', err);
      return null;
    }
  };

  const handleFollowupShowAnswer = async () => {
    setFollowupStatus('evaluating');
    const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
    if (apiKey && followupWrittenText.trim()) {
      setFollowupAiLoading(true);
      const result = await runFollowupAiEvaluation();
      if (result) {
        setFollowupAiResult(result);
        if (Array.isArray(result.hitKeywords)) {
          setFollowupSelectedKeywords(result.hitKeywords.filter(k => q.followupKeywords?.includes(k)));
        }
      }
      setFollowupAiLoading(false);
    }
  };

  const handleFollowupSave = (finalKeywords) => {
    setFollowupStatus('submitted');
    
    // 更新 selection 数据
    const currentSel = quizState.selections[globalIdx] || {};
    const updatedData = {
      ...currentSel,
      followupData: {
        writtenText: followupWrittenText,
        keywords: finalKeywords || followupSelectedKeywords,
        aiResult: followupAiResult,
        status: 'submitted',
      }
    };
    onToggleOption(globalIdx, updatedData);
  };

  // 渲染推荐结构 HTML
  const getRecommendHtml = () => {
    if (!q.recommendStructure) return '';
    return marked.parse(q.recommendStructure);
  };

  // 熟练度展示标签
  const renderEvaluationResult = () => {
    const userSel = quizState.selections[globalIdx] || { score: scoreToSubmit, isCorrect: isAnswerOk };
    const score = userSel.score ?? scoreToSubmit;
    let label = '需加强';
    let labelColor = 'text-danger bg-danger-light/30 border-danger/30';
    if (score === 100) {
      label = '完美';
      labelColor = 'text-success bg-success-light/30 border-success/30';
    } else if (score >= 60) {
      label = '良好';
      labelColor = 'text-warning bg-warning-light/30 border-warning/30';
    }
    return (
      <div className="flex items-center gap-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${labelColor}`}>
          熟练度：{label} ({score}分)
        </span>
        <span className="text-sm text-text-secondary">
          命中词汇：{selectedKeywords.length} / {totalKeywordsCount}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-slide-up pb-8">
      {/* 题头真题背景 */}
      <div className="bg-gradient-to-r from-surface-alt/65 to-transparent p-5 pl-6 rounded-r-xl border-l-4 border-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold text-primary tracking-wider uppercase bg-primary-light/20 px-2 py-0.5 rounded">
            🗣️ 面试口试演练
          </span>
          {q._tags && q._tags.includes('ai-agent') && (
            <span className="text-[10px] font-black text-white tracking-wider uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-0.5 animate-pulse"
                  style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #a855f7 100%)' }}>
              🤖 AIGC 智能体专项
            </span>
          )}
          {q.scene && (
            <span className="text-xs text-text-secondary/70 truncate max-w-[280px] md:max-w-md" title={q.scene}>
              · {q.scene}
            </span>
          )}
        </div>
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-[18px] md:text-[20px] font-bold text-text-strong leading-relaxed m-0 flex-1">
            Q{quizState.currentPageIdx + 1}：{q.question}
          </h2>
          <div className="flex items-center gap-1.5 select-none shrink-0 mt-1">
            {onPrevPage && (
              <button
                onClick={onPrevPage}
                className="px-2.5 py-1.5 rounded bg-surface border border-border/40 text-text-secondary hover:text-primary hover:border-primary text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-0.5"
                title="上一题"
              >
                ◀ 上一题
              </button>
            )}
            {onNextPageDirect && (
              <button
                onClick={onNextPageDirect}
                className="px-2.5 py-1.5 rounded bg-surface border border-border/40 text-text-secondary hover:text-primary hover:border-primary text-[10px] font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-0.5"
                title="下一题"
              >
                下一题 ▶
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* 左栏：模拟作答区 */}
        <div className="bg-surface border border-border/15 rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col gap-5">
          <h3 className="text-sm font-bold text-text-secondary border-b border-border/15 pb-2.5 m-0 flex items-center justify-between">
            <span>步骤 1：开口演练与思路输入</span>
            {seconds > 0 && <span className="text-primary font-mono text-xs">计时：{formatTime(seconds)}</span>}
          </h3>

          {status === 'answering' ? (
            <div className="flex flex-col gap-5 py-2">
              {/* 计时器条 */}
              <div className="flex items-center justify-between gap-4 bg-surface-alt/20 p-4 rounded-xl border border-border/10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full border-2 border-primary text-primary flex items-center justify-center font-mono font-bold text-sm shadow-sm">
                    {formatTime(seconds)}
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary/60">建议表达时长 02:00</div>
                    <div className="text-xs font-semibold text-text-secondary mt-0.5">
                      建议闭眼尝试开口表达，并在下方框内记录重点思路
                    </div>
                  </div>
                </div>
              </div>

              {/* 手动打字默写大纲 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-secondary flex justify-between">
                  <span>✍️ 我的思路默写/关键字草稿：</span>
                  <span className="text-text-secondary/40 font-normal">{(userWrittenText || '').length} 字</span>
                </label>
                <textarea
                  value={userWrittenText}
                  onChange={(e) => setUserWrittenText(e.target.value)}
                  placeholder="在此手动输入您针对这道题目的口述要点、逻辑大纲（例如：1. 编译优化包含静态提升和事件缓存... 2. 运行时基于 LIS 算法做移动优化...），以此强迫脑力思考与手写输出对照。"
                  className="w-full min-h-[160px] bg-surface-alt/40 border border-border/25 rounded-xl p-4 text-sm text-text placeholder:text-text-secondary/45 focus:outline-none focus:border-primary transition-colors resize-y leading-relaxed"
                />
              </div>

              {/* 折叠作答线索提示 */}
              <div className="rounded-lg overflow-hidden bg-surface-alt/25">
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="w-full bg-transparent hover:bg-surface-alt/30 border-0 px-4 py-2.5 text-xs text-text-secondary font-semibold text-left cursor-pointer transition-colors duration-150 flex items-center justify-between"
                >
                  <span>💡 查看作答思路线索 (脑子一片空白时点此)</span>
                  <span>{showTips ? '▲ 折叠' : '▼ 展开'}</span>
                </button>
                {showTips && (
                  <div className="p-4 text-xs text-text-secondary/80 leading-relaxed border-t border-border/10">
                    {q.recommendStructure ? (
                      <p>“您可以从结论开始说起，重点覆盖下面提到的一些技术关键词。例如这道题关键要说清如何给静态 and 动态做隔离优化...”</p>
                    ) : (
                      <p>“请对着大纲梳理逻辑，口头复述其核心原理，注重语速和条理性。”</p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleShowAnswer}
                className="w-full mt-4 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all select-none active:scale-[0.99] cursor-pointer border-0"
              >
                我记录好了，查看参考答案与 AI 自评
              </button>
            </div>
          ) : (
            // 已经是自评或者已提交状态：展示之前的记录
            <div className="flex flex-col gap-4 py-2">
              <div className="bg-surface-alt/25 p-4 rounded-xl border border-border/15 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-secondary/60 font-bold uppercase tracking-wider">✍️ 我的手写思路大纲：</span>
                  <span className="text-[11px] text-text-secondary/50 font-mono">表达耗时：{formatTime(seconds)}</span>
                </div>
                <div className="text-xs text-text/80 leading-relaxed bg-surface p-3 rounded-lg border border-border/10 whitespace-pre-wrap min-h-[90px] font-sans">
                  {userWrittenText ? userWrittenText : <span className="text-text-secondary/40 italic">未手动输入思路大纲</span>}
                </div>
              </div>
              
              {/* 如果有 AI 结果，展示 AI 改进建议 */}
              {aiResult && (
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-col gap-2.5 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-primary font-bold uppercase tracking-wider flex items-center gap-1.25">
                      🤖 Qwen 智能模拟面试官诊断反馈：
                    </span>
                    <span className="text-xs text-primary font-bold">{aiResult.score} 分</span>
                  </div>
                  <div className="text-xs text-text/85 leading-relaxed bg-surface/40 p-3 rounded-lg border border-primary/5 whitespace-pre-wrap">
                    {aiResult.advice}
                  </div>
                </div>
              )}

              <div className="text-xs text-text-secondary/70 bg-surface-alt/20 p-3 rounded-lg border border-border/15">
                ✔️ 参考右侧“推荐表达”，评估自己的表达完整度，并勾选你提到的关键词。
              </div>
            </div>
          )}
        </div>

        {/* 右栏：参考自评区 */}
        <div className={`bg-surface border rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col gap-5 transition-all duration-300 ${
          status !== 'answering' 
            ? 'border-primary/20 ring-1 ring-primary/5 shadow-[0_8px_30px_rgba(var(--primary-rgb),0.02)]' 
            : 'border-border/15'
        }`}>
          <h3 className="text-sm font-bold text-text-secondary border-b border-border/15 pb-2.5 m-0 flex items-center justify-between">
            <span>步骤 2：比对参考与自检</span>
            {status === 'answering' && <span className="text-[11px] text-text-secondary/40 font-normal">答题后解锁</span>}
          </h3>

          {status === 'answering' ? (
            <div className="relative overflow-hidden py-4 flex flex-col justify-between min-h-[340px] select-none">
              {/* 模糊的答案伪内容，产生毛玻璃穿透感 */}
              <div className="filter blur-[4.5px] pointer-events-none opacity-20 flex flex-col gap-5 px-1">
                <div>
                  <div className="h-3.5 w-24 bg-text-secondary/40 rounded mb-2.5"></div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-text-secondary/20 rounded"></div>
                    <div className="h-2 w-[92%] bg-text-secondary/20 rounded"></div>
                    <div className="h-2 w-[85%] bg-text-secondary/20 rounded"></div>
                  </div>
                </div>
                <div>
                  <div className="h-3.5 w-32 bg-text-secondary/40 rounded mb-2.5"></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-16 bg-text-secondary/15 rounded-full"></div>
                    <div className="h-6 w-20 bg-text-secondary/15 rounded-full"></div>
                    <div className="h-6 w-12 bg-text-secondary/15 rounded-full"></div>
                    <div className="h-6 w-14 bg-text-secondary/15 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* 毛玻璃锁定遮罩 */}
              <div className="absolute inset-0 backdrop-blur-[3.5px] bg-surface/60 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3.5 shadow-inner animate-[pulse_2s_infinite]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-text-strong tracking-wide">🧠 录入思路以解封参考答案</div>
                <div className="text-[10px] text-text-secondary/70 mt-1.5 max-w-[220px] leading-relaxed">
                  手动录入或开口默写您的答题草稿，点击左侧按钮解锁 AI 智能评估与黄金口述模板
                </div>
              </div>
            </div>
          ) : aiLoading ? (
            // 脑电波式科技感 AI 加载状态
            <div className="flex flex-col items-center justify-center py-20 text-center select-none animate-pulse">
              <div className="flex items-center gap-1.5 mb-4">
                <span className="w-2.5 h-6 bg-primary rounded animate-[bounce_0.8s_infinite]" />
                <span className="w-2.5 h-10 bg-primary rounded animate-[bounce_0.8s_infinite_0.15s]" />
                <span className="w-2.5 h-7 bg-primary rounded animate-[bounce_0.8s_infinite_0.3s]" />
                <span className="w-2.5 h-5 bg-primary rounded animate-[bounce_0.8s_infinite_0.45s]" />
              </div>
              <div className="text-xs font-bold text-primary">🤖 千问大模型正在进行语义匹配与打分...</div>
              <div className="text-[10px] text-text-secondary/60 mt-1.5">模型正在对您的答题大纲与核心考点做深层比对</div>
            </div>
          ) : (
            // 自评中 & 已提交 渲染结构与选择
            <div className="flex flex-col gap-5">
              {/* 推荐表达模板 */}
              <div>
                <h4 className="text-xs font-bold text-text-secondary m-0 mb-2">💡 面试高分口述模板：</h4>
                <div 
                  className="markdown-body text-xs text-text/90 leading-relaxed bg-surface-alt/45 p-4 rounded-xl border border-border/25 max-h-[220px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: getRecommendHtml() }}
                />
              </div>

              {/* 关键词打勾复选框 */}
              <div>
                <h4 className="text-xs font-bold text-text-secondary m-0 mb-2">
                  🎯 核心关键词自检 (AI 已为您自动打勾，您可以微调手改)：
                </h4>
                {totalKeywordsCount > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {q.keywords.map((kw, idx) => {
                      const isChecked = selectedKeywords.includes(kw);
                      const disabled = status === 'submitted';
                      return (
                        <label
                          key={idx}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all duration-180 select-none ${
                            disabled ? 'cursor-default' : 'cursor-pointer active:scale-95'
                          } ${
                            isChecked
                              ? 'bg-primary-light/20 border-primary text-primary font-bold'
                              : 'bg-surface-alt/25 border-border/40 text-text-secondary'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={disabled}
                            onChange={() => handleToggleKeyword(kw)}
                            className="w-3.5 h-3.5 accent-primary border-border"
                          />
                          {kw}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-text-secondary/50">该题无专属关键词，请以话术模板为对照。</div>
                )}
              </div>

              {/* 结算结果 & 按钮逻辑 */}
              {status === 'evaluating' && (
                <div className="border-t border-border/30 pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>得分依据：{aiResult ? '🤖 千问 AI 综合打分' : '📊 核心词勾选占比'}</span>
                    <span>{isAnswerOk ? '🟢 达到熟练标准 (>=60)' : '🔴 需要加强练习'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2.5 rounded-lg border border-border bg-surface-alt text-text-secondary hover:text-primary hover:border-primary text-xs font-bold transition-all select-none active:scale-95 cursor-pointer"
                    >
                      🔄 再试一次
                    </button>
                    <button
                      onClick={handleSubmit}
                      className={`flex-1 py-2.5 rounded-lg border-0 text-white text-xs font-bold transition-all select-none active:scale-[0.98] cursor-pointer ${
                        isAnswerOk ? 'bg-success hover:bg-success-hover' : 'bg-warning hover:bg-warning-hover'
                      }`}
                    >
                      💾 提交本次演练评估 ({isAnswerOk ? '标记为已掌握' : '标记为需巩固，加进错题本'})
                    </button>
                  </div>
                </div>
              )}

              {status === 'submitted' && (
                <div className="border-t border-border/30 pt-4 flex flex-col gap-4 animate-slide-up">
                  {renderEvaluationResult()}
                  
                  {/* 下一步操作 */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2.5 rounded-lg border border-border bg-surface-alt text-text-secondary hover:text-primary hover:border-primary text-xs font-bold transition-all select-none active:scale-95 cursor-pointer"
                    >
                      🔄 再试一次
                    </button>
                    {!isLastPage ? (
                      <button
                        onClick={onNextPage}
                        className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all active:scale-95 cursor-pointer border-0"
                      >
                        下一题 →
                      </button>
                    ) : (
                      <button
                        onClick={onShowResult}
                        className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all active:scale-95 cursor-pointer border-0"
                      >
                        口试报告与总结 →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ============================== ⚔️ 大厂面试官现场 Follow-up 深度追问挑战 ============================== */}
      {q.followupQuestion && (status === 'evaluating' || status === 'submitted') && (
        <div className="mt-4 bg-gradient-to-b from-primary/5 to-transparent border-t-2 border-primary/20 pt-6 animate-slide-up select-none">
          <div className="px-1 pb-4 flex justify-between items-center">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span>⚔️ 大厂面试官现场 Follow-up 深度追问挑战</span>
            </span>
            {!showFollowup && (
              <button
                onClick={() => {
                  setShowFollowup(true);
                  setFollowupStatus('answering');
                }}
                className="px-4 py-2 rounded bg-primary hover:bg-primary-hover text-white text-[11px] font-bold cursor-pointer transition-all border-0 shadow-sm active:scale-95 animate-bounce"
              >
                接受追问挑战！
              </button>
            )}
          </div>

          {showFollowup && (
            <div className="flex flex-col gap-5 mt-2">
              {/* 追问题干 */}
              <div className="bg-gradient-to-r from-danger/5 to-transparent p-4 pl-5 rounded-r-xl border-l-4 border-danger relative">
                <span className="absolute top-3.5 right-4 text-[10px] font-bold text-danger bg-danger-light/10 border border-danger/15 px-2 py-0.5 rounded">
                  深度拷问
                </span>
                <h4 className="text-xs font-bold text-text-strong m-0 leading-relaxed pr-12">
                  💬 面试官：“{q.followupQuestion}”
                </h4>
              </div>

              {followupStatus === 'answering' ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={followupWrittenText}
                    onChange={(e) => setFollowupWrittenText(e.target.value)}
                    placeholder="在此手动默写您的追问回答大纲。面试官深挖了技术取舍、弱网熔断兜底、沙箱逃逸防御等底层细节，请结合简历专属攻防要点进行口述记录..."
                    className="w-full min-h-[110px] bg-surface-alt/40 border border-border/30 rounded-xl p-4 text-xs text-text placeholder:text-text-secondary/45 focus:outline-none focus:border-primary transition-colors resize-y leading-relaxed"
                  />
                  <button
                    onClick={handleFollowupShowAnswer}
                    className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all border-0 cursor-pointer shadow-sm active:scale-98"
                  >
                    我说完了，查看追问参考答案及 AI 评估
                  </button>
                </div>
              ) : (
                // 追问自评/展示状态
                <div className="flex flex-col gap-4 animate-slide-up">
                  {followupAiLoading ? (
                    <div className="py-8 text-center flex flex-col items-center gap-2">
                      <div className="animate-spin h-5 w-5 text-primary border-2 border-primary border-t-transparent rounded-full" />
                      <div className="text-xs font-bold text-primary">🤖 Qwen 面试官正在诊断您的追问表现...</div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* 追问答案话术 */}
                      <div>
                        <h5 className="text-[11px] font-bold text-text-secondary m-0 mb-1.5">💡 追问高分话术参考：</h5>
                        <div className="text-xs text-text/85 leading-relaxed bg-surface-alt/45 border border-border/25 p-4 rounded-xl max-h-[180px] overflow-y-auto whitespace-pre-wrap">
                          {q.followupAnswer}
                        </div>
                      </div>

                      {/* 追问关键词 */}
                      {q.followupKeywords?.length > 0 && (
                        <div>
                          <h5 className="text-[11px] font-bold text-text-secondary m-0 mb-1.5">🎯 追问核心词自检 (可手动微调)：</h5>
                          <div className="flex flex-wrap gap-2">
                            {q.followupKeywords.map((kw, idx) => {
                              const isChecked = followupSelectedKeywords.includes(kw);
                              const disabled = followupStatus === 'submitted';
                              return (
                                <label
                                  key={idx}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 transition-all ${
                                    disabled ? 'cursor-default' : 'cursor-pointer active:scale-95'
                                  } ${
                                    isChecked
                                      ? 'bg-primary-light/20 border-primary text-primary font-bold'
                                      : 'bg-surface-alt/25 border-border/40 text-text-secondary'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={disabled}
                                    onChange={() => {
                                      const next = followupSelectedKeywords.includes(kw)
                                        ? followupSelectedKeywords.filter(k => k !== kw)
                                        : [...followupSelectedKeywords, kw];
                                      setFollowupSelectedKeywords(next);
                                      if (disabled) {
                                        handleFollowupSave(next);
                                      }
                                    }}
                                    className="w-3.5 h-3.5 accent-primary border-border"
                                  />
                                  {kw}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 追问 AI 诊断 */}
                      {followupAiResult && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-primary">🤖 追问 AI 诊断评估 (得分：{followupAiResult.score}分)</span>
                          <div className="text-xs text-text/80 leading-relaxed bg-surface/50 p-3 rounded border border-primary/5">
                            {followupAiResult.advice}
                          </div>
                        </div>
                      )}

                      {followupStatus === 'evaluating' && (
                        <button
                          onClick={() => handleFollowupSave(followupSelectedKeywords)}
                          className="w-full py-2.5 rounded-lg bg-success hover:bg-success-hover text-white text-xs font-bold transition-all border-0 cursor-pointer shadow-sm active:scale-95"
                        >
                          保存本次追问自评
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
