import fs from 'fs';
import path from 'path';

const baseDir = '/Users/neoyuan/Desktop/aoyi/个人中高级前端题库/学习系统/docs/';

const filesToRefactor = [
  {
    path: path.join(baseDir, 'engineering/frontend-engineering-deep-dive.md'),
    replacements: [
      {
        old: `### Q5 [single]\nVite 的 HMR 速度比 Webpack 快的核心原因是？\nA. Vite 使用了更快的网络协议\nB. Vite 只需重新编译变化的单个模块，不需要重新打包整个 chunk\nC. Vite 禁用了 source map 所以更快\nD. Vite 把 HMR 逻辑放在了 Service Worker 中\n答案：B`,
        new: `### Q5 [single]\nVite 的 HMR 速度比 Webpack 快的核心原因是？\nA. Vite 使用了底层的 HTTP/3 协议并行推送资源\nB. Vite 只需重新编译当前发生变动的单个模块，基于原生 ESM 按需拉取，无需重新组装和打包整个 Chunk 依赖链\nC. Vite 通过预先在服务端生成静态文件索引列表避开了网络往返检查\nD. Vite 在开发环境禁用了 AST 解析并直接依靠正则匹配模块依赖\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'performance/performance-complete.md'),
    replacements: [
      {
        old: `### Q16 [single]\n以下关于 \`font-display: swap\` 的说法，哪个是正确的？\nA. 完全消除自定义字体的 CLS\nB. 先显示系统回退字体，自定义字体加载完成后替换，避免 FOIT（字体不可见闪烁）\nC. 让字体异步加载，不阻塞页面渲染\nD. 仅在 Chrome 中有效\n答案：B`,
        new: `### Q16 [single]\n以下关于 \`font-display: swap\` 的说法，哪个是正确的？\nA. 完全消除由于字体解析耗时而导致的布局偏移（CLS）\nB. 在自定义字体加载完成前优先显示系统回退（Fallback）字体，加载完成后再切换，以避免 FOIT（无样式文本闪烁）\nC. 在字体文件加载完成前，阻塞页面渲染以保证首屏排版的绝对稳定性\nD. 允许自定义字体与系统默认衬线字体在渲染时进行无缝的多通道混合绘制\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'scenarios/high-frequency-scenarios.md'),
    replacements: [
      {
        old: `### Q7 [single]\n在 JavaScript 中手写实现 LRU（最近最少使用）缓存时，使用 \`Map\` 替代普通 Object 的关键优势是利用了 Map 的什么特性？\nA. Map 的键可以是任意类型\nB. Map 的迭代顺序与插入顺序一致，可以通过 keys().next().value 获取最久未使用的键\nC. Map 比 Object 占用更少内存\nD. Map 的 get/set 操作时间复杂度是 O(log n)\n答案：B`,
        new: `### Q7 [single]\n在 JavaScript 中手写实现 LRU（最近最少使用）缓存时，使用 \`Map\` 替代普通 Object 的关键优势是利用了 Map 的什么特性？\nA. Map 的键可以是任意类型，避开了对键的强制字符串序列化转换\nB. Map 的迭代顺序与插入顺序一致，可以通过 keys().next().value 获取最久未使用的键\nC. Map 的 delete 删键操作不会导致 V8 引擎内部发生隐藏类（Hidden Class）降级或字典模式退化\nD. Map 底层哈希表在发生碰撞时能够通过红黑树结构实现 O(1) 的常数级查找性能\n答案：B`
      }
    ]
  },
  {
    path: path.join(baseDir, 'vue/vue3-computed-scheduler.md'),
    replacements: [
      {
        old: `### Q14 [single]\n在 Vue 3 中，\`computed\` 计算属性为什么不直接在依赖变化时同步执行 getter，而是先标记 DIRTY 等待下一次读取时再计算？\nA. 避免未被读取的 computed 浪费计算资源\nB. 方便序列化到 localStorage\nC. 为了兼容 SSR 环境\nD. 因为 getter 必须是异步函数\n答案：A`,
        new: `### Q14 [single]\n在 Vue 3 中，\`computed\` 计算属性为什么不直接在依赖变化时同步执行 getter，而是先标记 DIRTY 等待下一次读取时再计算？\nA. 避免未被读取的 computed 浪费计算资源\nB. 防止在依赖未真正改变时重复构建计算树，保障多层嵌套下的依赖流稳定\nC. 确保计算属性能够直接将内部状态注册到浏览器的宏任务更新队列中\nD. 能够与 watch 共享同一个全局调度队列，防止组件触发重复渲染\n答案：A`
      }
    ]
  },
  {
    path: path.join(baseDir, 'vue/vue3-provide-inject.md'),
    replacements: [
      {
        old: `### Q5 [single]\n在 Vue 3 中，\`inject\` 查找依赖时使用 \`key in provides\` 而不是 \`hasOwnProperty\` 的关键原因是？\nA. \`in\` 可以沿原型链查找\nB. \`in\` 会自动创建默认值\nC. \`in\` 可以让普通值变成 ref\nD. \`hasOwnProperty\` 不能判断字符串 key\n答案：A`,
        new: `### Q5 [single]\n在 Vue 3 中，\`inject\` 查找依赖时使用 \`key in provides\` 而不是 \`hasOwnProperty\` 的关键原因是？\nA. \`in\` 运算符可以沿原型链（Prototype Chain）继承关系定位祖先组件提供的同名数据\nB. \`in\` 运算符能够支持响应式代理（Proxy）上的 \`has\` 捕获器，实现依赖调度的追踪\nC. \`hasOwnProperty\` 会由于组件实例的解构而丢失对上层原型链上共享状态的感知\nD. 避免在依赖对象为空（\`null\`）或未定义时触发 \`Object.prototype\` 属性缺失的运行时异常\n答案：A`
      }
    ]
  }
];

let totalApplied = 0;
for (const fileConfig of filesToRefactor) {
  if (!fs.existsSync(fileConfig.path)) {
    console.warn(`[WARN] 文件不存在: ${fileConfig.path}`);
    continue;
  }
  let content = fs.readFileSync(fileConfig.path, 'utf8');
  let fileApplied = 0;

  for (const replacement of fileConfig.replacements) {
    // 统一换行符为 \n 方便匹配
    const normContent = content.replace(/\r\n/g, '\n');
    const normOld = replacement.old.replace(/\r\n/g, '\n');
    
    if (normContent.includes(normOld)) {
      content = normContent.replace(normOld, replacement.new);
      fileApplied++;
      totalApplied++;
    } else {
      console.warn(`[WARN] 无法在文件 ${path.basename(fileConfig.path)} 中匹配到替换项。`);
    }
  }

  if (fileApplied > 0) {
    fs.writeFileSync(fileConfig.path, content, 'utf8');
    console.log(`[SUCCESS] 成功更新了文件: ${path.basename(fileConfig.path)}`);
  }
}

console.log(`[SUMMARY] 相对核心模块（Markdown 专项自测）共替换了 ${totalApplied}/${filesToRefactor.length} 个文件。`);
