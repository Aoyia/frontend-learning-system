const fs = require('fs');
const path = require('path');

// 要检查的 12 个文件列表
const files = [
  'AI-Agent前端面试准备.md',
  '公式规则循环引用问题.md',
  '前端通用技术亮点面试准备.md',
  '性能优化面试准备.md',
  '性能优化面试准备-面试版.md',
  '插件化架构面试准备.md',
  '插件开发全链路面试准备.md',
  '表单渲染引擎面试准备.md',
  '规则引擎面试准备.md',
  '面试复盘报告提升通过率.md',
  '项目证据链与开放方案题专项.md',
  '项目面试准备总索引.md'
];

const baseDir = path.resolve(__dirname, '../../面试准备资料');
let hasError = false;

files.forEach(fileName => {
  const filePath = path.join(baseDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${fileName}`);
    hasError = true;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const quizMatch = content.match(/<!--\s*quiz:\s*([\s\S]*?)\s*-->/);
  
  if (!quizMatch) {
    console.error(`❌ 文件 ${fileName} 中未找到 <!-- quiz: [...] --> 标记`);
    hasError = true;
    return;
  }

  try {
    const quizData = JSON.parse(quizMatch[1].trim());
    if (!Array.isArray(quizData)) {
      throw new Error("解析出的内容不是数组");
    }
    
    console.log(`\n🔍 检查文件: ${fileName} (共 ${quizData.length} 道题)`);

    // 统计题型数量
    let singleCount = 0;
    let multipleCount = 0;
    let judgmentCount = 0;
    
    let lastType = 'single';
    
    quizData.forEach((q, idx) => {
      if (!q.type || !['single', 'multiple', 'judgment'].includes(q.type)) {
        throw new Error(`第 ${idx + 1} 题类型无效: ${q.type}`);
      }
      if (!q.question || !Array.isArray(q.options) || q.answer === undefined || !q.explain) {
        throw new Error(`第 ${idx + 1} 题字段缺失: 检查 question, options, answer, explain`);
      }

      // 类型检查与顺序检查 (single -> multiple -> judgment)
      if (q.type === 'single') {
        singleCount++;
        if (lastType !== 'single') {
          throw new Error(`第 ${idx + 1} 题位置错误，单选题必须全部排在最前面`);
        }
      } else if (q.type === 'multiple') {
        multipleCount++;
        if (lastType === 'judgment') {
          throw new Error(`第 ${idx + 1} 题位置错误，多选题必须排在判断题前面`);
        }
        lastType = 'multiple';
      } else if (q.type === 'judgment') {
        judgmentCount++;
        lastType = 'judgment';
      }
    });

    console.log(`   - 单选题: ${singleCount} 道, 多选题: ${multipleCount} 道, 判断题: ${judgmentCount} 道`);
    
    if (quizData.length !== 15) {
      throw new Error(`题目总量不符合要求，目前有 ${quizData.length} 题，要求刚好 15 题`);
    }
    if (singleCount !== 8 || multipleCount !== 5 || judgmentCount !== 2) {
      throw new Error(`题型数量比例错误，要求 8单选 + 5多选 + 2判断`);
    }
    
    console.log(`   ✅ 校验通过`);
  } catch (err) {
    console.error(`❌ 文件 ${fileName} 校验失败: ${err.message}`);
    hasError = true;
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log('\n🎉 所有文件校验成功！');
  process.exit(0);
}
