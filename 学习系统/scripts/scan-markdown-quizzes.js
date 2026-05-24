import fs from 'fs';
import path from 'path';

const docsDir = '/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/docs';
const outputFilePath = '/Users/neoyuan/.gemini/antigravity/brain/0a26f310-a740-495a-b6b7-df0916744a6d/scratch/scanned_quizzes.txt';

// 确保目录存在
const scratchDir = path.dirname(outputFilePath);
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

function getMdFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getMdFiles(filePath, fileList);
    } else if (filePath.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const mdFiles = getMdFiles(docsDir);
let outputText = '';

mdFiles.forEach(file => {
  const raw = fs.readFileSync(file, 'utf8');
  // 简单提取 frontmatter 的 module 字段
  const moduleMatch = raw.match(/module:\s*(\S+)/);
  if (!moduleMatch) return; // 跳过无 module 声明的文件

  const relativePath = path.relative(docsDir, file);
  outputText += `========================================\n`;
  outputText += `FILE: ${relativePath} (Module: ${moduleMatch[1]})\n`;
  outputText += `========================================\n\n`;

  // 匹配 ## 面试题自测 后面的部分
  const quizSectionMatch = raw.match(/\n## [^\n]*面试题自测([\s\S]*)$/m);
  if (!quizSectionMatch) {
    outputText += `[无自测题目]\n\n`;
    return;
  }

  const quizSection = quizSectionMatch[1];
  // 提取所有 Q 块的头
  const qMatches = [...quizSection.matchAll(/\n### Q\d+(?:\s+\[([^\]]*)\])?\s*\n([\s\S]*?)(?=\n### Q\d+|\n## |\n$)/g)];

  if (qMatches.length === 0) {
    outputText += `[未解析出题目]\n\n`;
    return;
  }

  qMatches.forEach((m, idx) => {
    const qType = m[1] || 'single';
    const body = m[2].trim();
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

    const question = lines[0] || '';
    const options = lines.filter(l => /^[A-F]\./.test(l));
    const answerLine = lines.find(l => l.startsWith('答案：'));
    const answer = answerLine ? answerLine : '';

    outputText += `Q${idx + 1} [${qType}]: ${question}\n`;
    options.forEach(opt => {
      outputText += `  ${opt}\n`;
    });
    outputText += `  ${answer}\n\n`;
  });
  outputText += `\n`;
});

fs.writeFileSync(outputFilePath, outputText, 'utf8');
console.log(`[SUCCESS] 扫描完成。结果已保存至: ${outputFilePath}`);
