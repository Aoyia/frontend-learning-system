import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from '@arco-design/web-react';
import '@arco-design/web-react/es/Drawer/style/index.css';
import { OralDrillPanel } from '../components/OralDrillPanel.jsx';
import { withQuestionSource } from '../utils/quiz.js';
import { LEARNING_CONTENT } from '../../data/learning-content.js';

// 获取所有 type === 'expression' 的口试表达题目
function getOralQuestions() {
  const list = [];
  LEARNING_CONTENT.modules.forEach(m => {
    m.docs.forEach((d, docIdx) => {
      if (d.quiz) {
        d.quiz.forEach((q, quizIdx) => {
          if (q.type === 'expression') {
            list.push(withQuestionSource(m, d, docIdx, q, quizIdx));
          }
        });
      }
    });
  });
  return list;
}

export function MockInterviewPage({ wrongBookCache, onAddToWrongBook, onNavToWrongBook }) {
  const [activeTab, setActiveTab] = useState('interview'); // 'interview' | 'library'
  const [oralQuestions, setOralQuestions] = useState([]);

  // 加载题目
  useEffect(() => {
    setOralQuestions(getOralQuestions());
  }, [LEARNING_CONTENT.modules]);

  // ==================== 题库列表模式状态 ====================
  const [selectedModule, setSelectedModule] = useState('all');
  const [expandedQid, setExpandedQid] = useState(null);
  const [activeDrillQuestion, setActiveDrillQuestion] = useState(null);
  const [singleDrillSelections, setSingleDrillSelections] = useState({});
  const [singleDrillSubmitted, setSingleDrillSubmitted] = useState([]);

  // ==================== 全真模拟面试模式状态 ====================
  const [isAigcMode, setIsAigcMode] = useState(true); // AIGC专场优先
  // step 0: 自我介绍, step 1: 专业拷打, step 2: 模拟反问, step 3: 复盘报告
  const [step, setStep] = useState(0);

  // 阶段 1：自我介绍
  const [selfIntroText, setSelfIntroText] = useState('');
  const [selfIntroLoading, setSelfIntroLoading] = useState(false);
  const [selfIntroResult, setSelfIntroResult] = useState(null);

  // 阶段 2：专业拷打
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [interviewSelections, setInterviewSelections] = useState({});
  const [interviewSubmittedPages, setInterviewSubmittedPages] = useState([]);

  // 阶段 3：模拟反问
  const [reverseQaText, setReverseQaText] = useState('');
  const [reverseQaLoading, setReverseQaLoading] = useState(false);
  const [reverseQaResult, setReverseQaResult] = useState(null);

  // 整理题库模块分类
  const modulesList = [
    { id: 'all', name: '全部模块' },
    ...LEARNING_CONTENT.modules.map(m => ({ id: m.id, name: m.name }))
  ];

  // 过滤口试题库列表
  const filteredLibraryQuestions = selectedModule === 'all'
    ? oralQuestions
    : oralQuestions.filter(q => q._moduleId === selectedModule);

  // 初始化全真模拟面试：随机抽取 4 道口试题（2 道通用基础 + 2 道项目定制深挖）
  // 初始化全真模拟面试：高度匹配简历设计
  const startNewInterview = () => {
    if (oralQuestions.length === 0) return;
    
    // 1. 过滤出与杨忠源简历（低代码、规则引擎、插件化、AI Agent）高度匹配的“亮点拷打题池”
    // 优先匹配包含 'yang-zhongyuan' 标签的简历专属题
    const yangPool = oralQuestions.filter(q => 
      q._moduleId === 'project-prep-special' && 
      q._tags && q._tags.includes('yang-zhongyuan')
    );
    
    // 2. 备份普通匹配题池
    const matchedPoolBackup = oralQuestions.filter(q => 
      q._moduleId === 'project-prep-special' && 
      !(q._tags && q._tags.includes('yang-zhongyuan'))
    );

    // 3. 过滤出通用基础/其他大类题池
    const generalPool = oralQuestions.filter(q => q._moduleId !== 'project-prep-special');

    let projectQuestions = [];
    if (isAigcMode) {
      // AIGC 专场：从杨忠源专属题池中强匹配带 'ai-agent' 标签的 7 道 AI 专属题
      const aiPool = yangPool.filter(q => q._tags && q._tags.includes('ai-agent'));
      if (aiPool.length >= 2) {
        projectQuestions = [...aiPool].sort(() => Math.random() - 0.5).slice(0, 2);
      } else {
        const combined = [...aiPool, ...yangPool.filter(q => !(q._tags && q._tags.includes('ai-agent')))];
        projectQuestions = combined.slice(0, Math.min(2, combined.length));
      }
    } else {
      // 通用混合专场
      if (yangPool.length >= 2) {
        projectQuestions = [...yangPool].sort(() => Math.random() - 0.5).slice(0, 2);
      } else {
        const combinedMatched = [...yangPool, ...matchedPoolBackup];
        projectQuestions = combinedMatched.sort(() => Math.random() - 0.5).slice(0, Math.min(2, combinedMatched.length));
      }
    }

    let generalQuestions = [];
    if (generalPool.length >= 2) {
      generalQuestions = [...generalPool].sort(() => Math.random() - 0.5).slice(0, 2);
    } else {
      generalQuestions = [...generalPool].sort(() => Math.random() - 0.5).slice(0, Math.min(2, generalPool.length));
    }

    let selected = [
      ...generalQuestions,
      ...projectQuestions
    ];

    // 兜底：若池不够，全量随机抽取 4 道
    if (selected.length < 4) {
      const sorted = [...oralQuestions].sort(() => Math.random() - 0.5).slice(0, Math.min(4, oralQuestions.length));
      selected = sorted.sort((a, b) => {
        const aMatched = a._moduleId === 'project-prep-special' ? 1 : 0;
        const bMatched = b._moduleId === 'project-prep-special' ? 1 : 0;
        return aMatched - bMatched;
      });
    }

    setInterviewQuestions(selected);
    setCurrentQuestionIdx(0);
    setInterviewSelections({});
    setInterviewSubmittedPages([]);
    setSelfIntroText('');
    setSelfIntroResult(null);
    setReverseQaText('');
    setReverseQaResult(null);
    setStep(0);
  };

  // 导入自我介绍必背模板
  const loadSelfIntroTemplate = () => {
    setSelfIntroText(
`面试官您好，我叫杨中原，有 4 年前端经验，主要做复杂业务平台和低代码表单平台。过去在上海df负责低代码平台里的公式规则、插件系统、自开发、基础组件库、CI 流水线和需求开发技术评审等内容

我最主要负责的两块是：

一是公式规则：解决字段联动、显示隐藏、必填只读和数值计算；
二是插件系统：解决非核心能力的热插拔、按客户需求启动以及主包瘦身。
技术栈主要是 Vue 2、Vue 3 、vite，最近也在关注 AI Agent 的流式渲染、思考链的展示渲染。现在希望找一个业务和工程复杂度更高的平台，把复杂系统治理、性能优化和 AI 辅助研发这些经验继续用起来`
    );
  };

  // 导入推荐反问模板
  const loadReverseQaTemplate = () => {
    setReverseQaText(
`1. 咱们团队目前核心的业务场景和技术栈是什么？现阶段面临的最大工程或性能挑战是什么（例如详情页首屏时间）？
2. 看到团队在探索 AI Agent，能介绍下目前在前端 UI 流式渲染和 AI 结合低代码这块的具体落地规划吗？
3. 如果我有幸能入职，在试用期内的核心目标和最需要解决的痛点是什么？`
    );
  };

  // 调用大模型对自我介绍进行 AI 诊断
  const handleEvaluateSelfIntro = async () => {
    if (!selfIntroText.trim()) return;
    setSelfIntroLoading(true);

    const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
    const model = import.meta.env.VITE_CHAT_MODEL || 'qwen3.5-35b-a3b';

    if (!apiKey) {
      // 模拟诊断（降级）
      setTimeout(() => {
        setSelfIntroResult({
          score: 80,
          detectedHighlights: ['4年经验', '公式规则', '插件系统', 'Vue 2'],
          advice: '整体结构非常清晰。建议在介绍公式规则时，进一步突出“计算次数下降了80%”等可量化的业绩数据，例如『建议修改为：“我主导了公式规则引擎的重构，通过引入依赖收集和缓存机制，使冗余计算次数下降了 80%，显著提升了超长表单的录入流畅度。”』。离职动机部分可以表现得更聚焦于个人成长与挑战。'
        });
        setSelfIntroLoading(false);
      }, 1500);
      return;
    }

    const systemPrompt = `你是一位专业的前端技术面试官。你的任务是评估候选人自我介绍的内容质量。
请根据自我介绍核心要素（基本背景如经验年限、核心擅长项目难点如公式规则优化/插件系统、离职原因/未来规划）分析其文本，计算得分并给出专业诊断建议。
对于 advice 字段：请给出 2 到 3 句极其具体可行、符合研发主管口吻的修改意见。必须针对诊断出的弱项或缺失点，提供至少一个可以直接套用的高分示范表达短句，格式为『建议修改为：“……”』。
输出必须为严格的 JSON 格式，如下（不要包含 markdown 块或多余解释）：
{
  "score": 0到100的整数,
  "detectedHighlights": [识别出的核心亮点数组，如"4年经验", "公式规则优化", "插件系统"等],
  "advice": "诊断意见与高分示范表达短句（如『建议修改为：“……”』）"
}`;

    try {
      const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: selfIntroText }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const cleanedStr = data.choices[0].message.content.replace(/^```json\s*|```$/g, '').trim();
        setSelfIntroResult(JSON.parse(cleanedStr));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSelfIntroLoading(false);
    }
  };

  // 调用大模型对反问环节进行 AI 点评和解答
  const handleEvaluateReverseQa = async () => {
    if (!reverseQaText.trim()) return;
    setReverseQaLoading(true);

    const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
    const model = import.meta.env.VITE_CHAT_MODEL || 'qwen3.5-35b-a3b';

    if (!apiKey) {
      // 模拟反馈
      setTimeout(() => {
        setReverseQaResult({
          score: 95,
          answer: '好的，我来解答你的问题。我们团队目前主要负责审批和表单的底层建设，核心的性能瓶颈是在超大字段渲染时的网络等待和渲染卡顿，我们最近正在做预渲染（Prerender）和接口聚合。关于 AI 的落地，我们已经实现了流式 UMD 组件 Schema 动态读取和 Agent 自动推荐。你入职后的首期目标就是负责将插件系统的 IndexedDB 二次加载缓存机制落地，并解决现有 formula 运行时的卡顿回退。',
          review: '提问非常专业，切中团队痛点。第一题和第二题体现了很好的工程主人翁意识，第三题展现了脚踏实地的执行力。建议更进一步追问细节，例如『您可以这样提问：“咱们团队目前在落地 Web 端的 Schema 渲染时，首屏的 LCP 指标通常能维持在多少秒以内？对于体积较大的 UMD 包有没有做一些离线缓存策略？”』。面试官会非常喜欢这类提问。'
        });
        setReverseQaLoading(false);
      }, 1500);
      return;
    }

    const systemPrompt = `你是一位经验丰富的前端技术面试官或研发主管。
现在进入面试最后的“候选人反问”环节。用户向你提出了几个反问问题。
你的任务有两个：
1. 扮演该高要求技术团队的面试官，真诚、专业地回答用户的反问（模拟回答我们团队当前的性能瓶颈治理方案，如预渲染、接口并行，或 AI 应用落地规划，如 RAG/表单 Agent 检索）；
2. 点评候选人提问的深度和专业性，指出哪些问题问得很有水平，哪些略显被动，并给出打分。
对于 review 字段：点评候选人的反问水平，并给出如何提问才能让人眼前一亮的改进建议。必须结合面试公司的技术背景，提供至少一个推荐的高端反问示范短句，格式为『您可以这样提问：“……”』。
输出必须为严格的 JSON 格式，如下（不要包含 markdown 块或多余解释）：
{
  "score": 0到100的整数,
  "answer": "你作为面试官对候选人所提问题的模拟解答内容（不少于150字，需体现极强的技术底蕴与团队真实感）",
  "review": "点评内容与高端反问示范短句（如『您可以这样提问：“……”』）"
}`;

    try {
      const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: reverseQaText }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const cleanedStr = data.choices[0].message.content.replace(/^```json\s*|```$/g, '').trim();
        setReverseQaResult(JSON.parse(cleanedStr));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReverseQaLoading(false);
    }
  };

  // 全真面试答题拷打阶段：保存单题 selections 并自动跳转
  const handleSaveInterviewSelection = (globalIdx, data) => {
    if (data === null) {
      setInterviewSelections(prev => {
        const next = { ...prev };
        delete next[currentQuestionIdx];
        return next;
      });
      setInterviewSubmittedPages(prev => prev.filter(p => p !== currentQuestionIdx));
      return;
    }
    setInterviewSelections(prev => ({
      ...prev,
      [currentQuestionIdx]: data
    }));
  };

  const handleInterviewSubmit = () => {
    setInterviewSubmittedPages(prev => [...prev, currentQuestionIdx]);
  };

  const handleInterviewNext = () => {
    if (step === 1 && currentQuestionIdx === 0) {
      setCurrentQuestionIdx(1);
    } else if (step === 1 && currentQuestionIdx === 1) {
      setStep(2); // 进入项目深挖阶段
      setCurrentQuestionIdx(2);
    } else if (step === 2 && currentQuestionIdx === 2) {
      setCurrentQuestionIdx(3);
    } else if (step === 2 && currentQuestionIdx === 3) {
      setStep(3); // 进入模拟反问
    }
  };

  // ==================== 掌握与跳过核心逻辑 ====================
  const handleSkipQuestion = (isMastered) => {
    // 构造跳过的 selections 数据
    const skipData = {
      isCorrect: isMastered,
      score: isMastered ? 100 : null, // 掌握计满分，待巩固计 null/跳过
      keywords: isMastered ? (interviewQuestions[currentQuestionIdx].keywords || []) : [],
      timeSpent: 0,
      writtenText: isMastered ? '(用户标记为已掌握本题，直接跳过)' : '(用户标记为待巩固，跳过未答)',
      aiResult: isMastered ? { score: 100, advice: '直接标记为已掌握。' } : null,
      isSkipped: !isMastered,
      isMastered: isMastered
    };

    setInterviewSelections(prev => ({
      ...prev,
      [currentQuestionIdx]: skipData
    }));
    
    // 标记为已提交状态
    setInterviewSubmittedPages(prev => [...prev, currentQuestionIdx]);
    
    // 自动切到下一题或下一阶段
    setTimeout(() => {
      if (step === 1 && currentQuestionIdx === 0) {
        setCurrentQuestionIdx(1);
      } else if (step === 1 && currentQuestionIdx === 1) {
        setStep(2);
        setCurrentQuestionIdx(2);
      } else if (step === 2 && currentQuestionIdx === 2) {
        setCurrentQuestionIdx(3);
      } else if (step === 2 && currentQuestionIdx === 3) {
        setStep(3);
      }
    }, 100);
  };

  // 一键将所有模拟面试中“未掌握/跳过”的题目保存到错题本
  const [importedQids, setImportedQids] = useState([]);
  const handleImportAllUnmastered = async () => {
    const unmastered = interviewQuestions.filter((q, idx) => {
      const sel = interviewSelections[idx];
      return !sel || sel.isCorrect === false || sel.isSkipped === true;
    });

    for (const q of unmastered) {
      await onAddToWrongBook(q, '(模拟面试跳过待巩固)', 0);
    }

    setImportedQids(unmastered.map(q => q._qid));
  };

  // 计算复盘报告得分与通过率
  const getInterviewReport = () => {
    const introScore = selfIntroResult ? selfIntroResult.score : 0;
    const reverseScore = reverseQaResult ? reverseQaResult.score : 0;
    
    // 计算专业拷打题分值
    let totalScore = 0;
    let countedQuestions = 0;
    interviewQuestions.forEach((q, idx) => {
      const sel = interviewSelections[idx];
      if (sel) {
        if (sel.isMastered) {
          totalScore += 100;
          countedQuestions++;
        } else if (sel.isSkipped) {
          totalScore += 0;
          countedQuestions++;
        } else {
          totalScore += sel.score || 0;
          countedQuestions++;
        }
      }
    });

    const drillScoreAvg = countedQuestions > 0 ? Math.round(totalScore / countedQuestions) : 0;
    const totalAvg = Math.round((introScore * 0.2) + (drillScoreAvg * 0.6) + (reverseScore * 0.2));
    
    let passPrediction = '需持续巩固';
    let passColor = 'text-danger';
    if (totalAvg >= 85) {
      passPrediction = isAigcMode ? 'AIGC 前端专家 Offer 通关级' : '极高机会通过 (Offer 预警)';
      passColor = isAigcMode ? 'text-primary font-black drop-shadow-[0_2px_8px_rgba(168,85,247,0.35)]' : 'text-success';
    } else if (totalAvg >= 65) {
      passPrediction = isAigcMode ? 'AIGC 准通关评级' : '机会良好 (复盘建议已生成)';
      passColor = 'text-warning';
    }

    return {
      introScore,
      drillScoreAvg,
      reverseScore,
      totalAvg,
      passPrediction,
      passColor
    };
  };

  const report = getInterviewReport();

  // 计算当前单题自由演练的索引，用于上一题/下一题极速切换
  const activeDrillIdx = filteredLibraryQuestions.findIndex(q => q._qid === activeDrillQuestion?._qid);
  const hasPrevDrill = activeDrillIdx > 0;
  const hasNextDrill = activeDrillIdx < filteredLibraryQuestions.length - 1;

  return (
    <div className="max-w-[1100px] mx-auto pt-2 pb-12">
      {/* 选项卡栏 */}
      <div className="flex border-b border-border/40 mb-6 gap-6 select-none">
        <button
          onClick={() => setActiveTab('interview')}
          className={`pb-3 text-[15px] font-bold cursor-pointer transition-all bg-transparent border-0 flex items-center gap-2 ${
            activeTab === 'interview' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text'
          }`}
        >
          🎙️ 全真模拟面试
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`pb-3 text-[15px] font-bold cursor-pointer transition-all bg-transparent border-0 flex items-center gap-2 ${
            activeTab === 'library' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text'
          }`}
        >
          📚 口试表达题库 (${oralQuestions.length})
        </button>
      </div>

      {/* ============================== TAB 1: 全真模拟面试 ============================== */}
      {activeTab === 'interview' && (
        <div className="w-full">
          {interviewQuestions.length === 0 ? (
            <div className="bg-surface border border-border/15 rounded-2xl p-6 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-center flex flex-col items-center gap-5">
              <div className="text-[52px]">🎙️</div>
              <h2 className="text-[22px] font-bold text-text-strong m-0">全真智能模拟面试专区</h2>
              <p className="text-text-secondary text-sm max-w-lg leading-relaxed">
                本模块将引导您进入「自我介绍 → 2 道基础拷打 + 2 道项目深挖 → 模拟反问面试官」的完整真实闭环。
                中途可使用「我已掌握」快速跳题，最终将为您智能评估通过率并生成专属诊断报告。
              </p>
              <div className="flex items-center gap-3 bg-surface-alt/45 border border-border/15 px-5 py-3 rounded-2xl select-none max-w-md w-full justify-between mt-2 shadow-inner">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🤖</span>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-extrabold text-text-strong">大厂 AIGC 智能体 application 专家专场</span>
                    <span className="text-[10px] text-text-secondary/80">开启后 100% 强制锁定 AIGC 专属核心项目深挖考题</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAigcMode}
                    onChange={(e) => setIsAigcMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-border/40 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <button
                onClick={startNewInterview}
                className="px-8 py-3.5 rounded-xl text-white font-bold text-sm border-0 cursor-pointer shadow-lg hover:brightness-110 active:scale-95 transition-all mt-2"
                style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
              >
                🚀 开始一轮全真模拟面试
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-6">
              {/* 面试进度状态指示器 */}
              <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-6 overflow-x-auto gap-4 flex-wrap select-none">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧭</span>
                  <span className="text-sm font-bold text-text-strong">Mock 面试流：</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex flex-col items-start gap-1 relative py-1">
                    <span className={`${step === 0 ? 'text-primary font-bold' : 'text-text-secondary/70'}`}>
                      1. 自我介绍
                    </span>
                    {step === 0 && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full animate-[pulse_1.5s_infinite]" />}
                  </div>
                  <span className="text-text-secondary/20">/</span>
                  <div className="flex flex-col items-start gap-1 relative py-1">
                    <span className={`${step === 1 ? 'text-primary font-bold' : 'text-text-secondary/70'}`}>
                      2. 基础知识 ({step === 1 ? currentQuestionIdx + 1 : step > 1 ? 2 : 0}/2)
                    </span>
                    {step === 1 && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full animate-[pulse_1.5s_infinite]" />}
                  </div>
                  <span className="text-text-secondary/20">/</span>
                  <div className="flex flex-col items-start gap-1 relative py-1">
                    <span className={`${step === 2 ? 'text-primary font-bold' : 'text-text-secondary/70'}`}>
                      3. 项目深挖 ({step === 2 ? currentQuestionIdx - 1 : step > 2 ? 2 : 0}/2)
                    </span>
                    {step === 2 && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full animate-[pulse_1.5s_infinite]" />}
                  </div>
                  <span className="text-text-secondary/20">/</span>
                  <div className="flex flex-col items-start gap-1 relative py-1">
                    <span className={`${step === 3 ? 'text-primary font-bold' : 'text-text-secondary/70'}`}>
                      4. 模拟反问
                    </span>
                    {step === 3 && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full animate-[pulse_1.5s_infinite]" />}
                  </div>
                  <span className="text-text-secondary/20">/</span>
                  <div className="flex flex-col items-start gap-1 relative py-1">
                    <span className={`${step === 4 ? 'text-primary font-bold' : 'text-text-secondary/70'}`}>
                      5. 复盘评估
                    </span>
                    {step === 4 && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full animate-[pulse_1.5s_infinite]" />}
                  </div>
                </div>
              </div>

              {/* ───────────────── 阶段 1：自我介绍 ───────────────── */}
              {step === 0 && (
                <div className="flex flex-col gap-6 animate-slide-up">
                  <div className="bg-surface-alt/30 p-4 rounded-xl border border-border/30">
                    <h3 className="text-sm font-bold text-text-strong m-0 mb-1 flex items-center gap-1.5">
                      <span>🗣️ 阶段提示：自我介绍是建立第一印象的关键</span>
                    </h3>
                    <p className="text-xs text-text-secondary m-0 leading-relaxed">
                      优秀的自我介绍应包含：姓名与工作年限、核心技术特长与成果证据链（如公式规则和插件系统优化细节）、积极的职业动机。建议尽量背诵默写或录入大纲。
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-text-secondary">✍️ 输入我的自我介绍思路/大纲文本：</label>
                      <button
                        onClick={loadSelfIntroTemplate}
                        className="text-xs text-primary bg-transparent border-0 cursor-pointer font-bold hover:underline"
                      >
                        导入复盘必背自我介绍参考模板
                      </button>
                    </div>
                    <textarea
                      value={selfIntroText}
                      onChange={(e) => setSelfIntroText(e.target.value)}
                      placeholder="在此处默写或打字录入您的自我介绍。越精确、越丰满，AI 的评估结果和关键词勾选就越智能。"
                      className="w-full min-h-[220px] bg-surface-alt/40 border border-border/30 rounded-xl p-4 text-sm text-text placeholder:text-text-secondary/45 focus:outline-none focus:border-primary transition-colors resize-y leading-relaxed"
                    />
                  </div>

                  {selfIntroLoading ? (
                    <div className="py-12 text-center flex flex-col items-center gap-3">
                      <div className="animate-spin h-6 w-6 text-primary border-2 border-primary border-t-transparent rounded-full" />
                      <div className="text-xs font-bold text-primary">🤖 Qwen 面试官正在审核评估您的自我介绍亮点与缺陷...</div>
                    </div>
                  ) : selfIntroResult ? (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col gap-4 animate-slide-up">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          🤖 自我介绍智能诊断结果 (得分：{selfIntroResult.score}分)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selfIntroResult.detectedHighlights?.map((h, i) => (
                          <span key={i} className="text-[10px] font-bold text-primary bg-primary-light/20 border border-primary/20 px-2 py-0.75 rounded-full">
                            ★ {h}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-text/85 leading-relaxed bg-surface/50 p-3 rounded-lg border border-primary/5">
                        {selfIntroResult.advice}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex gap-3 justify-end mt-4">
                    <button
                      onClick={handleEvaluateSelfIntro}
                      disabled={selfIntroLoading || !selfIntroText.trim()}
                      className="px-6 py-2.5 rounded-lg border border-primary bg-transparent text-primary hover:bg-primary/5 font-bold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🔍 进行 AI 智能诊断
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-2.5 rounded-lg border-0 bg-primary text-white hover:bg-primary-hover font-bold text-xs cursor-pointer shadow-sm"
                    >
                      下一阶段：基础知识考核 →
                    </button>
                  </div>
                </div>
              )}

              {/* ───────────────── 阶段 2 & 3：基础考核与项目深挖 ───────────────── */}
              {(step === 1 || step === 2) && interviewQuestions.length > 0 && (
                <div className="animate-slide-up flex flex-col gap-4">
                  {/* 顶端进度与跳过掌握按钮区 */}
                  <div className="flex items-center justify-between bg-surface-alt/25 p-3.5 rounded-xl gap-4 flex-wrap select-none">
                    <div className="text-xs text-text-secondary">
                      正在面对：
                      <span className="font-bold text-text-strong ml-1">
                        {step === 1 ? `2. 基础知识考核 (第 ${currentQuestionIdx + 1} / 2 题)` : `3. 项目亮点深挖 (第 ${currentQuestionIdx - 1} / 2 题)`}
                      </span>
                    </div>
                    
                    {/* 掌握与跳过按钮区域 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSkipQuestion(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 font-bold text-xs cursor-pointer transition-all active:scale-95 border-0 flex items-center gap-1"
                      >
                        ✓ 我已掌握（算满分）
                      </button>
                      <button
                        onClick={() => handleSkipQuestion(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 font-bold text-xs cursor-pointer transition-all active:scale-95 border-0 flex items-center gap-1"
                      >
                        ✗ 待巩固，跳过不答
                      </button>
                    </div>
                  </div>

                  {/* 渲染口试面板 */}
                  <OralDrillPanel
                    key={currentQuestionIdx}
                    quizState={{
                      currentPageIdx: 0,
                      pageSize: 1,
                      questions: [interviewQuestions[currentQuestionIdx]],
                      submittedPages: interviewSubmittedPages.includes(currentQuestionIdx) ? [0] : [],
                      selections: {
                        0: interviewSelections[currentQuestionIdx]
                      }
                    }}
                    onToggleOption={handleSaveInterviewSelection}
                    onSubmitPage={handleInterviewSubmit}
                    onNextPage={handleInterviewNext}
                    onShowResult={handleInterviewNext}
                    onPrevPage={currentQuestionIdx > 0 ? () => {
                      const prevIdx = currentQuestionIdx - 1;
                      if (prevIdx < 2 && step === 2) {
                        setStep(1); // 跨阶段回退
                      }
                      setCurrentQuestionIdx(prevIdx);
                    } : null}
                    onNextPageDirect={currentQuestionIdx < interviewQuestions.length - 1 ? () => {
                      const nextIdx = currentQuestionIdx + 1;
                      if (nextIdx >= 2 && step === 1) {
                        setStep(2); // 跨阶段推进
                      }
                      setCurrentQuestionIdx(nextIdx);
                    } : null}
                  />
                </div>
              )}

              {/* ───────────────── 阶段 4：模拟反问 ───────────────── */}
              {step === 3 && (
                <div className="flex flex-col gap-6 animate-slide-up">
                  <div className="bg-surface-alt/30 p-5 rounded-xl border border-border/30 relative">
                    <div className="absolute top-4 right-4 text-xs font-bold text-primary bg-primary-light/10 border border-primary/20 px-2 py-0.5 rounded">
                      面试官提问中...
                    </div>
                    <h3 className="text-sm font-bold text-text-strong m-0 mb-2 flex items-center gap-1.5">
                      <span>👤 技术面试官/研发主管：</span>
                    </h3>
                    <p className="text-xs text-text/85 italic leading-relaxed m-0 bg-surface/40 p-3 rounded-lg border border-border/10">
                      “杨先生，我这边的问题基本就问完了。通常在面试的最后，候选人都会有一些关于团队业务、技术痛点、或技术规划的疑问。你有什么想要问我的吗？”
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-text-secondary">✍️ 输入我的反问列表：</label>
                      <button
                        onClick={loadReverseQaTemplate}
                        className="text-xs text-primary bg-transparent border-0 cursor-pointer font-bold hover:underline"
                      >
                        导入高水平反问示范模板
                      </button>
                    </div>
                    <textarea
                      value={reverseQaText}
                      onChange={(e) => setReverseQaText(e.target.value)}
                      placeholder="例如可以问：1. 团队当前最大性能工程挑战... 2. 低代码平台未来的 AI 结合业务落地规划... 3. 试用期的期望等。"
                      className="w-full min-h-[160px] bg-surface-alt/40 border border-border/30 rounded-xl p-4 text-sm text-text placeholder:text-text-secondary/45 focus:outline-none focus:border-primary transition-colors resize-y leading-relaxed"
                    />
                  </div>

                  {reverseQaLoading ? (
                    <div className="py-12 text-center flex flex-col items-center gap-3">
                      <div className="animate-spin h-6 w-6 text-primary border-2 border-primary border-t-transparent rounded-full" />
                      <div className="text-xs font-bold text-primary">🤖 Qwen 面试官正在思考回答您的问题，并评估提问深度...</div>
                    </div>
                  ) : reverseQaResult ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up">
                      {/* 面试官解答内容 */}
                      <div className="bg-surface-alt/40 border border-border/25 rounded-xl p-4 flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                          👤 面试官真实解答模拟：
                        </span>
                        <div className="text-xs text-text/85 leading-relaxed bg-surface p-3 rounded-lg border border-border/10 whitespace-pre-wrap">
                          {reverseQaResult.answer}
                        </div>
                      </div>
                      
                      {/* 点评诊断内容 */}
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                            🤖 技术官提问水准诊断 (得分：{reverseQaResult.score}分)：
                          </span>
                        </div>
                        <div className="text-xs text-text/85 leading-relaxed bg-surface/50 p-3 rounded-lg border border-primary/5 whitespace-pre-wrap">
                          {reverseQaResult.review}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex gap-3 justify-end mt-4">
                    <button
                      onClick={handleEvaluateReverseQa}
                      disabled={reverseQaLoading || !reverseQaText.trim()}
                      className="px-6 py-2.5 rounded-lg border border-primary bg-transparent text-primary hover:bg-primary/5 font-bold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      💬 向面试官提问并获取评估
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="px-6 py-2.5 rounded-lg border-0 bg-primary text-white hover:bg-primary-hover font-bold text-xs cursor-pointer shadow-sm"
                    >
                      生成面试复盘报告 →
                    </button>
                  </div>
                </div>
              )}

              {/* ───────────────── 阶段 5：复盘评估报告 ───────────────── */}
              {step === 4 && (() => {
                // 计算每个维度的得分比例
                const getQuestionScore = (idx) => {
                  const sel = interviewSelections[idx];
                  if (!sel) return 0;
                  if (sel.isMastered) return 100;
                  if (sel.isSkipped) return 0;
                  return sel.score || 0;
                };
                const basicScore = Math.round((getQuestionScore(0) + getQuestionScore(1)) / 2);

                let agentScore = 60; // 默认给个基础底分
                let ruleScore = 60;
                let pluginScore = 60;

                const checkCategory = (q) => {
                  const text = (q.question + ' ' + (q.keywords || []).join(' ')).toLowerCase();
                  if (text.includes('agent') || text.includes('sse') || text.includes('xss') || text.includes('iframe') || text.includes('postmessage') || text.includes('zod')) {
                    return 'agent';
                  }
                  if (text.includes('babel') || text.includes('bignumber') || text.includes('function') || text.includes('依赖') || text.includes('环') || text.includes('performance') || text.includes('promise') || text.includes('lru')) {
                    return 'rule';
                  }
                  if (text.includes('插件') || text.includes('plugin') || text.includes('umd') || text.includes('extension') || text.includes('indexeddb') || text.includes('hook') || text.includes('泄露')) {
                    return 'plugin';
                  }
                  return 'other';
                };

                [2, 3].forEach(idx => {
                  const q = interviewQuestions[idx];
                  if (!q) return;
                  const cat = checkCategory(q);
                  const score = getQuestionScore(idx);
                  if (cat === 'agent') agentScore = score;
                  else if (cat === 'rule') ruleScore = score;
                  else if (cat === 'plugin') pluginScore = score;
                });

                // SVG 雷达图几何常数
                const R = 58;
                const cx = 100;
                const cy = 95;
                const angles = [
                  -Math.PI / 2,     // 12点: 自我介绍
                  -Math.PI / 6,     // 2点: 基础知识
                  Math.PI / 6,      // 4点: AI Agent 平台
                  Math.PI / 2,      // 6点: 规则与计算引擎
                  5 * Math.PI / 6,  // 8点: 运行时插件化
                  7 * Math.PI / 6   // 10点: 模拟反问
                ];
                const dimensionNames = ["自我介绍", "基础知识", "AI Agent", "规则与计算", "插件架构", "模拟反问"];
                const dimensionScores = [
                  report.introScore,
                  basicScore,
                  agentScore,
                  ruleScore,
                  pluginScore,
                  report.reverseScore
                ];

                // 计算雷达图多边形顶点 points 字符串
                const pointsStr = angles.map((angle, i) => {
                  const r = R * (Math.max(12, dimensionScores[i]) / 100);
                  const x = cx + r * Math.cos(angle);
                  const y = cy + r * Math.sin(angle);
                  return `${x},${y}`;
                }).join(' ');

                const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

                // 自动提取最强亮点与最弱盲点
                const scoreItems = dimensionNames.map((name, i) => ({ name, score: dimensionScores[i] }));
                const sortedScores = [...scoreItems].sort((a, b) => b.score - a.score);
                const strongest = sortedScores[0];
                const weakest = sortedScores[sortedScores.length - 1];

                return (
                  <div className="flex flex-col gap-6 animate-slide-up">
                    
                    {/* 毛玻璃科技感双栏大盘容器 */}
                    <div className="backdrop-blur-md bg-surface-alt/15 rounded-3xl border border-white/[0.08] p-6 relative overflow-hidden select-none shadow-xl">
                      <div className="absolute top-[-30px] right-[-30px] w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        
                        {/* 左侧：纯内联 SVG 雷达图 */}
                        <div className="md:col-span-5 flex justify-center py-2 relative">
                          <svg width="220" height="200" viewBox="0 0 220 200" className="drop-shadow-[0_4px_12px_rgba(99,102,241,0.15)]">
                            <defs>
                              <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="rgba(168, 85, 247, 0.15)" />
                                <stop offset="80%" stopColor="rgba(99, 102, 241, 0.45)" />
                                <stop offset="100%" stopColor="rgba(99, 102, 241, 0.6)" />
                              </radialGradient>
                            </defs>
                            
                            {/* 同心环背景 */}
                            {gridLevels.map((lvl, levelIdx) => {
                              const points = angles.map(angle => {
                                const x = cx + R * lvl * Math.cos(angle);
                                const y = cy + R * lvl * Math.sin(angle);
                                return `${x},${y}`;
                              }).join(' ');
                              return (
                                <polygon
                                  key={levelIdx}
                                  points={points}
                                  fill="none"
                                  stroke="rgba(255, 255, 255, 0.07)"
                                  strokeWidth="0.85"
                                  strokeDasharray={levelIdx < 4 ? "2, 2" : "none"}
                                />
                              );
                            })}

                            {/* 骨架轴线 */}
                            {angles.map((angle, i) => {
                              const x = cx + R * Math.cos(angle);
                              const y = cy + R * Math.sin(angle);
                              return (
                                <line
                                  key={i}
                                  x1={cx}
                                  y1={cy}
                                  x2={x}
                                  y2={y}
                                  stroke="rgba(255, 255, 255, 0.07)"
                                  strokeWidth="0.85"
                                />
                              );
                            })}

                            {/* 绘制实际得分雷达面 */}
                            <polygon
                              points={pointsStr}
                              fill="url(#radarGrad)"
                              stroke="rgba(168, 85, 247, 0.85)"
                              strokeWidth="2"
                            />

                            {/* 顶点标记圆圈 */}
                            {angles.map((angle, i) => {
                              const r = R * (Math.max(12, dimensionScores[i]) / 100);
                              const x = cx + r * Math.cos(angle);
                              const y = cy + r * Math.sin(angle);
                              const isAgent = dimensionNames[i] === "AI Agent";
                              return (
                                <g key={i}>
                                  {isAgent && isAigcMode && (
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="7"
                                      fill="none"
                                      stroke="rgba(6, 182, 212, 0.75)"
                                      strokeWidth="1.5"
                                      className="animate-pulse"
                                    />
                                  )}
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="3"
                                    fill="#fff"
                                    stroke={isAgent && isAigcMode ? "rgba(6, 182, 212, 1)" : "rgba(168, 85, 247, 1)"}
                                    strokeWidth="1.5"
                                  />
                                </g>
                              );
                            })}

                            {/* 维度文字与标签 */}
                            {angles.map((angle, i) => {
                              const labelR = R + 18;
                              const x = cx + labelR * Math.cos(angle);
                              const y = cy + labelR * Math.sin(angle) + (angle === Math.PI / 2 ? 6 : angle === -Math.PI / 2 ? -2 : 2);
                              let textAnchor = "middle";
                              if (Math.cos(angle) > 0.1) textAnchor = "start";
                              else if (Math.cos(angle) < -0.1) textAnchor = "end";

                              const isAgent = dimensionNames[i] === "AI Agent";
                              return (
                                <g key={i}>
                                  <text
                                    x={x}
                                    y={y - 4}
                                    fill={isAgent && isAigcMode ? "rgba(6, 182, 212, 0.9)" : "rgba(255, 255, 255, 0.55)"}
                                    fontSize={isAgent && isAigcMode ? "10" : "9.5"}
                                    fontWeight="bold"
                                    textAnchor={textAnchor}
                                  >
                                    {dimensionNames[i]} {isAgent && isAigcMode && "🤖"}
                                  </text>
                                  <text
                                    x={x}
                                    y={y + 6}
                                    fill={isAgent && isAigcMode ? "rgba(6, 182, 212, 1)" : "rgba(168, 85, 247, 1)"}
                                    fontSize="10"
                                    fontWeight="900"
                                    fontFamily="monospace"
                                    textAnchor={textAnchor}
                                  >
                                    {dimensionScores[i]}分
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>

                        {/* 右侧：综合分大盘与 Offer 评级 */}
                        <div className="md:col-span-7 flex flex-col gap-4 text-center md:text-left">
                          <div className="flex flex-col md:flex-row items-center gap-5">
                            {/* 总分环 */}
                            <div className="w-24 h-24 rounded-full border-[3px] border-primary/25 flex flex-col items-center justify-center bg-surface/50 relative shadow-inner shrink-0">
                              <span className="text-[28px] font-black text-primary font-mono">{report.totalAvg}</span>
                              <span className="text-[9px] text-text-secondary/60 font-bold uppercase tracking-wider">综合总分</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <h3 className="text-lg font-bold text-text-strong m-0">模拟面试智能通关报告</h3>
                              <p className="text-xs text-text-secondary m-0 leading-relaxed max-w-md">
                                基于自我介绍亮点判定 (20%)、专业口试题掌握度 (60%)、反问问题深度 (20%) 的加权合算。
                              </p>
                              <div className="text-xs font-semibold mt-1">
                                Offer 几率预测：<span className={`font-extrabold ${report.passColor}`}>{report.passPrediction}</span>
                              </div>
                            </div>
                          </div>

                          {/* 诊断小提示卡片 */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-left">
                            <div className="bg-success-light/10 border border-success/20 rounded-xl p-3.5 flex items-start gap-2.5">
                              <span className="text-sm">🏆</span>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-bold text-success">优势：{strongest.name} ({strongest.score}分)</span>
                                <p className="text-[10px] text-text-secondary leading-relaxed m-0">
                                  {strongest.score >= 80 
                                    ? "在此维度有极强表达说服力，大话术锚点健全。面试时可主动诱导该方向展示深度。"
                                    : "为当前相对强项，但仍建议在话术中多加入1个取舍思考或数字口径以确保稳定性。"
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="bg-danger-light/10 border border-danger/20 rounded-xl p-3.5 flex items-start gap-2.5">
                              <span className="text-sm">⚠️</span>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-bold text-danger">薄弱：{weakest.name} ({weakest.score}分)</span>
                                <p className="text-[10px] text-text-secondary leading-relaxed m-0">
                                  {weakest.score < 60 
                                    ? "该维度存在盲区，可能跳过了核心问题。已被加入错题本，请务必在临考前进行专项闭眼复训！"
                                    : "已达及格标准，但在大厂压力盘问下较易被击穿，请注重容灾回退及微任务批处理等边界原理防御。"
                                  }
                                </p>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* 阶段得分卡片列表 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center select-none">
                      <div className="bg-surface border border-border/30 rounded-xl p-4">
                        <div className="text-xs text-text-secondary font-bold mb-1">1. 自我介绍得分</div>
                        <div className="text-[22px] font-extrabold text-text-strong font-mono">{report.introScore} <span className="text-xs text-text-secondary/40 font-normal">/ 100</span></div>
                      </div>
                      <div className="bg-surface border border-border/30 rounded-xl p-4">
                        <div className="text-xs text-text-secondary font-bold mb-1">2. 专业拷打平均分</div>
                        <div className="text-[22px] font-extrabold text-text-strong font-mono">{report.drillScoreAvg} <span className="text-xs text-text-secondary/40 font-normal">/ 100</span></div>
                      </div>
                      <div className="bg-surface border border-border/30 rounded-xl p-4">
                        <div className="text-xs text-text-secondary font-bold mb-1">3. 模拟反问得分</div>
                        <div className="text-[22px] font-extrabold text-text-strong font-mono">{report.reverseScore} <span className="text-xs text-text-secondary/40 font-normal">/ 100</span></div>
                      </div>
                    </div>

                    {/* 拷打题掌握明细 */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold text-text-secondary m-0 border-b border-border/25 pb-2">
                        💡 口试题掌握明细评估及错题转化：
                      </h4>
                      <div className="grid gap-3">
                        {interviewQuestions.map((q, idx) => {
                          const sel = interviewSelections[idx];
                          const isOk = sel?.isCorrect;
                          const isSkipped = sel?.isSkipped;
                          let statusLabel = '需加强';
                          let badgeColor = 'bg-danger-light/35 border-danger/25 text-danger';
                          if (isOk) {
                            statusLabel = '掌握';
                            badgeColor = 'bg-success-light/35 border-success/25 text-success';
                          } else if (isSkipped) {
                            statusLabel = '待巩固(跳过)';
                            badgeColor = 'bg-warning-light/35 border-warning/25 text-warning';
                          }

                          return (
                            <div key={idx} className="bg-surface border border-border/35 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-text-strong">
                                  Q{idx + 1}：{q.question}
                                </span>
                                <span className="text-[10px] text-text-secondary/50">
                                  模块：{q._moduleName} · {q._docTitle}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.75 border rounded text-[10px] font-bold ${badgeColor}`}>
                                  {statusLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 汇总动作栏 */}
                    <div className="flex gap-3 justify-end border-t border-border/25 pt-5 mt-4">
                      <button
                        onClick={handleImportAllUnmastered}
                        disabled={importedQids.length > 0}
                        className="px-6 py-2.5 rounded-lg border border-warning/30 bg-warning-light/10 text-warning hover:bg-warning-light/20 font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                      >
                        {importedQids.length > 0 ? '✓ 已一键加入错题本' : '🧩 一键将未掌握/跳过题目加入错题本'}
                      </button>
                      <button
                        onClick={onNavToWrongBook}
                        className="px-6 py-2.5 rounded-lg border border-primary bg-transparent text-primary hover:bg-primary/5 font-bold text-xs cursor-pointer transition-all"
                      >
                        📖 查看我的错题本
                      </button>
                      <button
                        onClick={startNewInterview}
                        className="px-6 py-2.5 rounded-lg border-0 bg-primary text-white hover:bg-primary-hover font-bold text-xs cursor-pointer transition-all shadow-sm"
                      >
                        🔄 开启下一轮新面试
                      </button>
                    </div>

                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
      {/* ============================== TAB 2: 口试表达题库列表 ============================== */}
      {activeTab === 'library' && (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
          
          {/* 左侧：题库列表和分类树 */}
          <div className="w-full flex flex-col gap-4">
            {/* 分类过滤器 */}
            <div className="bg-surface border border-border/30 rounded-xl p-4 flex flex-wrap gap-1.5 select-none shadow-sm">
              {modulesList.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModule(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                    selectedModule === m.id
                      ? 'bg-primary border-primary text-white font-bold'
                      : 'bg-surface-alt/45 border-border/40 text-text-secondary hover:border-primary hover:text-primary'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* 列表渲染 */}
            <div className="grid gap-3">
              {filteredLibraryQuestions.length === 0 ? (
                <div className="text-center py-16 bg-surface border border-border/30 rounded-xl text-text-secondary text-xs">
                  该分类下暂无口试表达题目
                </div>
              ) : (
                filteredLibraryQuestions.map((q, idx) => {
                  const isExpanded = expandedQid === q._qid;
                  const isWrong = wrongBookCache[q._qid];
                  
                  return (
                    <div
                      key={q._qid}
                      className={`bg-surface border rounded-xl transition-all duration-200 shadow-sm ${
                        isExpanded ? 'border-primary/50 shadow-md' : 'border-border/30 hover:border-border'
                      }`}
                    >
                      {/* 点击展开题干头部 */}
                      <div
                        onClick={() => setExpandedQid(isExpanded ? null : q._qid)}
                        className="p-4 cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-primary bg-primary-light/10 border border-primary/20 px-1.5 py-0.5 rounded">
                              {q._moduleName}
                            </span>
                            {isWrong && (
                              <span className="text-[10px] font-bold text-danger bg-danger-light/15 border border-danger/15 px-1 py-0.25 rounded">
                                🧩 错题本在练
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-text-strong m-0 leading-relaxed">
                            {idx + 1}. {q.question}
                          </h3>
                        </div>
                        <span className="text-text-secondary/40 text-xs">
                          {isExpanded ? '▲ 折叠' : '▼ 展开'}
                        </span>
                      </div>

                      {/* 展开的详情面板 */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-border/15 flex flex-col gap-4 animate-slide-up">
                          {q.scene && (
                            <div className="text-xs text-text-secondary">
                              <span className="font-bold text-text-strong">适用场景：</span>{q.scene}
                            </div>
                          )}

                          {q.keywords?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="text-xs font-bold text-text-strong mr-1">核心关键词：</span>
                              {q.keywords.map((kw, i) => (
                                <code key={i} className="text-[10px] font-bold font-mono bg-surface-alt/70 border border-border/30 px-1.5 py-0.5 rounded text-text-secondary">
                                  {kw}
                                </code>
                              ))}
                            </div>
                          )}

                          {q.recommendStructure && (
                            <div>
                              <span className="text-xs font-bold text-text-strong">💡 高分话术骨架：</span>
                              <div className="text-xs text-text/80 leading-relaxed bg-surface-alt/30 border border-border/25 rounded-xl p-3.5 mt-1.5 max-h-[160px] overflow-y-auto whitespace-pre-wrap font-sans">
                                {q.recommendStructure}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => {
                                setActiveDrillQuestion(q);
                                // 重置该单题的作答状态
                                setSingleDrillSelections(prev => {
                                  const next = { ...prev };
                                  delete next[q._qid];
                                  return next;
                                });
                                setSingleDrillSubmitted(prev => prev.filter(id => id !== q._qid));
                              }}
                              className="px-5 py-2.5 rounded-lg border-0 bg-primary text-white hover:bg-primary-hover font-bold text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
                            >
                              🗣️ 针对此题一键练习
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 右侧单题自由演练抽屉 */}
          <Drawer
            title={
              <div className="flex items-center gap-2 text-text-strong font-bold">
                <span>⚡ 单题自由演练</span>
              </div>
            }
            width="80%"
            visible={!!activeDrillQuestion}
            onOk={() => setActiveDrillQuestion(null)}
            onCancel={() => setActiveDrillQuestion(null)}
            footer={null}
            unmountOnExit
            className="drill-panel-drawer"
            style={{ maxWidth: '100vw' }}
            maskStyle={{
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.4)'
            }}
          >
            {activeDrillQuestion && (
              <div className="animate-slide-up">
                <OralDrillPanel
                  key={activeDrillQuestion._qid}
                  quizState={{
                    currentPageIdx: 0,
                    pageSize: 1,
                    questions: [activeDrillQuestion],
                    submittedPages: singleDrillSubmitted.includes(activeDrillQuestion._qid) ? [0] : [],
                    selections: {
                      0: singleDrillSelections[activeDrillQuestion._qid]
                    }
                  }}
                  onToggleOption={(idx, data) => {
                    if (data === null) {
                      setSingleDrillSelections(prev => {
                        const next = { ...prev };
                        delete next[activeDrillQuestion._qid];
                        return next;
                      });
                      setSingleDrillSubmitted(prev => prev.filter(id => id !== activeDrillQuestion._qid));
                      return;
                    }
                    setSingleDrillSelections(prev => ({
                      ...prev,
                      [activeDrillQuestion._qid]: data
                    }));
                    // 如果成绩合格，自动同步更新错题本
                    if (data.isCorrect) {
                      onAddToWrongBook(activeDrillQuestion, data.writtenText, data.score, true);
                    } else {
                      onAddToWrongBook(activeDrillQuestion, data.writtenText, data.score, false);
                    }
                  }}
                  onSubmitPage={() => {
                    setSingleDrillSubmitted(prev => [...prev, activeDrillQuestion._qid]);
                  }}
                  onNextPage={() => setActiveDrillQuestion(null)}
                  onShowResult={() => setActiveDrillQuestion(null)}
                  onPrevPage={hasPrevDrill ? () => {
                    setActiveDrillQuestion(filteredLibraryQuestions[activeDrillIdx - 1]);
                  } : null}
                  onNextPageDirect={hasNextDrill ? () => {
                    setActiveDrillQuestion(filteredLibraryQuestions[activeDrillIdx + 1]);
                  } : null}
                />
              </div>
            )}
          </Drawer>

        </div>
      )}

    </div>
  );
}
