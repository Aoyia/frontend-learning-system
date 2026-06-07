# 实战：搭建 AI Code Review 自动化流水线
**作者**：雨夜寻晴天  
**日期**：2026-06-02

- **原始链接**: https://juejin.cn/post/7646348958055628850
- **原始博客**: 掘金

---

## 背景
最近刚加入一个新团队，跑了一段时间后发现代码审查这块挺拖后腿的。MR 提上去等半天没人看，催了又显得不礼貌；好不容易有人看了，又经常是"LGTM"凑数，真正的问题反而没人指出来。

作为前端负责人，我觉得得想个办法把这个环节自动化一部分

![AI Code Review 自动化门禁封面](images/review_img_1.png)——不是完全替代人工 Review，而是先把明显的问题（语法、命名、边界条件、潜在的 bug 模式）用机器跑一遍，这样人工 Reviewer 就能把精力集中在设计、架构、业务逻辑这些更难被自动化的地方。

刚好我们用的是 GitLab，有现成的 GitLab CI。我就花了 2 天时间搭了一套 AI Review Service：每次 MR 创建/更新时，CI 自动触发，把 diff 送到一个 AI 服务，返回批注意见，再直接以评论的形式贴在 MR 里。

整个过程踩了不少坑——模型选择、提示词调试、Runner 权限、超时处理……但最后看到 AI 真的能在 MR 页面里逐行指出问题的时候，感觉值了。

## 一、为什么要搞这个？
先说说我们团队的几个痛点：
- **Review 效率低**：MR 提上去经常半天没人看，催多了又怕同事反感。
- **Review 质量参差不齐**：不少人只是随手点个"LGTM"，真正的问题没被发现。
- **没有公共 Runner**：团队暂未提供 GitLab Runner，想在本地调试但缺少环境。

所以我决定：
1. 在自己电脑上搭建一套 GitLab CI 环境，先把流程跑起来。
2. 单独搭一个 AI 代码审查服务，让 AI 自动挑出明显的代码问题。
3. 把两者串联起来，实现 MR 提交时自动触发 AI 审查并贴评论。

## 二、核心架构
整个系统分为两个核心项目：

```text
┌─────────────────────────────────────────────────────────────────┐
│                    GitLab CI Pipeline                          │
│  ┌─────────────────┐    ┌─────────────────────────────────┐    │
│  │ frontend-project│───▶│ .gitlab-ci.yml                  │    │
│  │                 │    │  - ai-review job               │    │
│  └─────────────────┘    │  - 调用 ai_review.py 脚本      │    │
│                         └─────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Review Service                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ai-review-service/                                      │   │
│  │  ├── app.py          # 主服务代码                      │   │
│  │  ├── specs/          # 代码审查规范文件                │   │
│  │  │   └── frontend-code-review.md                       │   │
│  │  ├── examples/       # CI/CD 配置模板                  │   │
│  │  ├── .env            # 环境变量配置                    │   │
│  │  └── scripts/        # 辅助脚本                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 三、AI Review Service 实现

### 3.1 项目结构
```bash
ai-review-service/
├── app.py                 # Flask 服务主入口
├── .env                   # 环境变量（已配置 gitignore）
├── .env.example           # 环境变量示例
├── requirements.txt       # Python 依赖
├── README.md              # 项目文档
├── specs/                 # 代码审查规范目录
│   ├── frontend-code-review.md  # 团队代码审查规范
│   └── references/        # 参考资料
├── examples/              # 示例配置（供多项目复用）
│   ├── gitlab-publish.py  # GitLab 评论发布脚本
│   ├── .gitlab-ci.yml     # CI/CD 配置模板
│   └── README.md          # 集成指南
└── scripts/               # 辅助脚本
    └── sync-specs.sh      # 规范文件同步脚本
```

### 3.2 关键功能

#### 自动同步规范文件
服务启动时会自动从 GitLab 仓库拉取最新的代码审查规范：
```python
def sync_specs_from_git():
    """从 GitLab 仓库同步代码审查规范文件"""
    print("\n🔄 正在同步代码审查规范文件...")
    
    specs_dir = os.path.dirname(REVIEW_SPEC_PATH)
    spec_file_name = os.path.basename(REVIEW_SPEC_PATH)
    
    # 创建临时目录克隆仓库
    with tempfile.TemporaryDirectory() as temp_dir:
        repo_dir = os.path.join(temp_dir, 'skills')
        
        # 克隆仓库（只获取最新版本）
        result = subprocess.run(
            ['git', 'clone', '--depth', '1', SKILLS_REPO_URL, repo_dir],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        # 复制规范文件和参考资料
        shutil.copy2(source_spec, REVIEW_SPEC_PATH)
        shutil.copytree(source_references, dest_references)
```
在 `.env` 中配置：
```env
# 自动同步配置
AUTO_SYNC_SPEC=true
SKILLS_REPO_URL=https://git.example.com/username/skills.git
```

#### 双重审查模式
AI 审查采用双重模式：
- **「规范审查」**：严格按照团队定义的代码规范进行审查（优先级最高）
- **「专家审查」**：在规范基础上，AI 发挥专业知识发现其他潜在问题
```python
# app.py 中构建提示词
prompt = f"""
你是一位资深的前端代码审查专家，请按照以下规范进行代码审查：

## 📋 团队代码审查规范
{spec_content}

## 🔍 审查要求
1. 首先检查代码是否符合上述团队规范
2. 然后作为资深专家发现其他潜在问题
3. 根据问题严重程度评分：P0扣10分，P1扣5分，P2扣2分
"""
```

#### 新增同步接口
![AI Code Review 自动化门禁插图](images/review_img_2.png)

提供手动触发同步的接口：
```bash
# POST /sync-specs
curl -X POST http://localhost:5001/api/sync-specs \
  -H "Authorization: Bearer your-token-here"
```

### 3.3 启动服务
```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
python app.py
```
服务启动后输出：
```ruby
🚀 AI Review 服务启动中...
🔄 正在同步代码审查规范文件...
📥 克隆仓库: https://git.example.com/username/skills.git
✅ 规范文件已更新: /path/to/specs/frontend-code-review.md
✅ 参考资料已更新: /path/to/specs/references
📡 服务地址: http://localhost:5001
🔑 测试令牌: your-token-here
📝 审查接口: POST /api/review
```

## 四、前端项目集成

### 4.1 CI 配置
在 `frontend-project/.gitlab-ci.yml` 中添加 AI 审查任务：
```yaml
ai-review:
  stage: review
  tags:
    - mac-runner
  script:
    - |
      echo "🤖 AI Code Review 开始"
      if [ -n "$AI_REVIEW_API" ] && [ -n "$AI_REVIEW_TOKEN" ]; then
        RESPONSE=$(curl -s -X POST "$AI_REVIEW_API" \
          -H "Authorization: Bearer $AI_REVIEW_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"project\": \"$CI_PROJECT_PATH\", \"mr_iid\": $CI_MERGE_REQUEST_IID}")
        
        echo ""
        echo "========================================"
        echo "📊 AI 审查结果"
        echo "========================================"
        
        REVIEW_RESULT=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('review_result','unknown'))")
        SCORE=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('score',0))")
        
        echo "状态: $REVIEW_RESULT"
        echo "得分: $SCORE / 100"
        echo ""
        echo "💡 审查建议:"
        echo "----------------------------------------"
        
        echo "$RESPONSE" | python3 -c "
      import sys, json
      data = json.load(sys.stdin)
      suggestions = data.get('suggestions', [])
      if not suggestions:
          print('  未发现明显问题')
      else:
          for i, s in enumerate(suggestions, 1):
              t = s.get('type', 'info')
              emoji = {'error': '❌', 'warning': '⚠️', 'improvement': '💡', 'info': 'ℹ️'}.get(t, '📌')
              loc = s.get('file', '')
              if s.get('line'): loc += ':' + str(s.get('line'))
              msg = s.get('message', '')
              print(f'{i}. {emoji} [{t.upper()}] {loc}')
              print(f'   {msg}')
              print()
      "
        
        echo "========================================"
        
        if [ -n "$GITLAB_TOKEN" ] && [ -n "$GITLAB_URL" ]; then
          echo ""
          echo "📝 发布审查结果到 MR..."
          export PROJECT_ENCODED=$(echo "$CI_PROJECT_PATH" | sed 's/\//%2F/g')
          echo "$RESPONSE" | python3 scripts/ai_review.py
        fi
      else
        echo "⚠️ AI_REVIEW_API 或 AI_REVIEW_TOKEN 未配置，跳过 AI Review"
      fi
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  allow_failure: true
```

### 4.2 AI 审查脚本
`scripts/ai_review.py` 负责发布评论到 MR：
```python
#!/usr/bin/env python3
import sys, json, os, subprocess

def main():
    # 从 stdin 读取 AI 返回的审查结果
    data = json.load(sys.stdin)
    score = data.get('score', 0)
    suggestions = data.get('suggestions', [])
    summary = data.get('summary', '')
    
    # 构建 Markdown 评论
    md = f"## 🤖 AI Code Review 结果\n\n**得分**: {score} / 100\n\n"
    
    if summary:
        md += f"**总结**: {summary}\n\n"
        
    if suggestions:
        md += "### 💡 审查建议\n\n"
        for i, s in enumerate(suggestions[:10], 1):
            emoji = {'error': '❌', 'warning': '⚠️', 'improvement': '💡', 'info': 'ℹ️'}.get(s['type'], '📌')
            file = s.get('file', '')
            line = s.get('line', '')
            location = f"{file}:{line}" if file else ''
            md += f"{i}. {emoji} **[{s['type'].upper()}]** {location}\n{s['message']}\n\n"
    else:
        md += "✅ 未发现明显问题，代码质量良好！\n\n"
    
    md += "---\n*此评论由 AI 自动生成*"
    
    # 发布到 MR
    gitlab_url = os.environ.get('GITLAB_URL', '')
    gitlab_token = os.environ.get('GITLAB_TOKEN', '')
    mr_iid = os.environ.get('CI_MERGE_REQUEST_IID', '')
    project_encoded = os.environ.get('PROJECT_ENCODED', '')
    
    if gitlab_url and gitlab_token and mr_iid and project_encoded:
        payload = json.dumps({'body': md}, ensure_ascii=False)
        url = f"{gitlab_url.rstrip('/')}/api/v4/projects/{project_encoded}/merge_requests/{mr_iid}/notes"
        
        # 使用标准输入传递数据，避免参数解析问题
        result = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST', url,
             '-H', f'PRIVATE-TOKEN: {gitlab_token}',
             '-H', 'Content-Type: application/json; charset=utf-8',
             '-d', '@-'],
            input=payload.encode('utf-8'),
            capture_output=True
        )
        
        if result.returncode == 0 and result.stdout.decode().strip() == '201':
            print("✅ 评论发布成功")
        else:
            print(f"❌ 评论发布失败: {result.stdout.decode()}")

if __name__ == "__main__":
    main()
```

## 五、CI/CD 变量配置
在 GitLab 项目的 CI/CD 变量中配置以下环境变量：

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| AI_REVIEW_API | AI 审查服务地址 | http://localhost:5001/api/review |
| AI_REVIEW_TOKEN | 认证令牌 | your-review-token |
| GITLAB_TOKEN | GitLab API Token（需 api scope） | your-gitlab-token |
| GITLAB_URL | GitLab 地址 | https://git.example.com |

## 六、踩坑记

### 6.1 Token 权限不够
一开始用的 GitLab Token 只有 `read_api` 权限，发布评论到 MR 时报 401。后来给 Token 加上了 `api` scope 就好了。

### 6.2 subprocess 参数类型混合
一开始把 `-d` 参数传成了 bytes 类型，导致跨平台问题：
```python
# 错误示例
'-d', payload.encode('utf-8')  # bytes 类型
```
正确写法：
```python
# 使用标准输入传递
'-d', '@-',
input=payload.encode('utf-8')
```

### 6.3 Artifacts 过期问题
CI 流水线中 `get-changed-files` 作业的 artifacts 默认只保留 1 小时，导致下游作业依赖失败：
```yaml
# 修复前
expire_in: 1 hour

# 修复后
expire_in: 1 week
```

### 6.4 中文乱码问题
在 CI 脚本中处理中文时用了 `msg.encode().decode('unicode_escape')`，导致中文变成乱码。直接打印即可：
```python
# 错误
msg = msg.encode().decode('unicode_escape')

# 正确
msg = s.get('message', '')
```

### 6.5 目录权限不足
Runner 用 `shell` 执行器时，默认在 `~/builds` 下创建工作目录：
```bash
mkdir -p ~/builds
chown -R $(whoami):staff ~/builds
```

## 七、效果展示
每次提交 MR，CI 都会自动调用 AI 审查并发布评论：
```markdown
## 🤖 AI Code Review 结果

**得分**: 85 / 100

**总结**: 代码整体质量良好，主要问题集中在类型定义和代码复用方面。

### 💡 审查建议

1. ❌ **[ERROR]** src/views/test.ts:41
变量 `data` 使用了 `any` 类型，建议添加明确的类型定义。

2. ⚠️ **[WARNING]** src/utils/format.ts:15
函数命名不够语义化，`formatValue` 建议改为 `formatCurrency`。

3. 💡 **[IMPROVEMENT]** src/api/user.ts:28
此请求逻辑与其他接口重复，建议提取通用请求函数。

---
*此评论由 AI 自动生成*
```

## 八、多项目复用
为方便多项目集成，在 `ai-review-service/examples/` 目录提供了模板：
```bash
# 复制模板到目标项目
cp ai-review-service/examples/gitlab-publish.py your-project/scripts/
cp ai-review-service/examples/.gitlab-ci.yml your-project/
```

## 九、总结
整个流程走下来，核心就是三个部分：
- **「AI Review Service」**：接收代码变更，返回审查意见，支持自动同步规范文件。
- **「CI 配置」**：MR 事件触发审查，调用服务并发布评论。
- **「审查脚本」**：格式化审查结果，通过 GitLab API 发布到 MR。

最大的收获是让团队的代码规范有了一个自动化的"守门人"。新人 MR 里常见的低级错误被 AI 提前拦住，老同事也能从琐碎的 nitpick 中解放出来，把精力放在更有价值的架构讨论上。

如果你也想尝试，建议先从简单的脚本开始，踩过的坑都在上面了，希望能帮你少走弯路～
