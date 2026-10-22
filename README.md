# Global Intelligence

免费的中英文新闻知识库：GitHub Pages + Jekyll + Markdown + 原生 JavaScript。通过 iPhone 上的 GitHub Issue Form 手动投稿，由 GitHub Actions 校验、归档和发布。

- 网站：https://justin2524.github.io/global-intelligence/
- 仓库：https://github.com/Justin2524/global-intelligence
- 手机投稿：https://github.com/Justin2524/global-intelligence/issues/new?template=publish-report.yml
- [手机操作说明](MOBILE-PUBLISHING.md) · [安全边界](SECURITY.md) · [验收记录](TEST-RESULTS.md)

以上是配置的目标地址；实际发布状态以验收记录及 Actions 的成功结果为准。

## 网站功能

首页展示最新日报、最新周报与专题；Daily Briefings、Weekly Economist 使用相同数据结构与不同阅读布局。Topics 支持四类专题筛选，Knowledge Base 收录长期知识，Archive 提供日期归档及中文、英文、正文、标签全文搜索。搜索条件可组合，保存在 URL 中。

支持 Markdown 标题、列表、引用、表格、代码块、来源链接和公式。文章目录自动生成；移动端目录默认折叠，导航可横向滚动。无外部字体、跟踪脚本、数据库或付费 API。公式在构建时转换为原生 MathML，不依赖浏览器端 CDN。

种子数据均明确标记 **Demo**，不代表真实新闻、行情或真实一期《经济学人》报道。Weekly 仅存放原创摘要、分析及原文链接，不公开转载付费全文。

## 投稿格式

表单只需要三项：Daily / Weekly、YYYY-MM-DD、完整 Markdown 正文。

- 正文必须从一个 `# 标题` 开始，最多一个一级标题。
- Daily 必须有十个二级标题，顺序为 `## 1. 标题` 至 `## 10. 标题`。
- Weekly 至少两个二级标题。
- 至少一个 `http(s)` Markdown 来源链接；正文 80 字符以上、最多 60 KB。
- 不要粘贴整篇代码围栏或 Front Matter。
- 日期范围为 2000–2100 年；不存在的日期会被拒绝。

正文可以包含以下可选元数据，无需增加表单字段：

```markdown
# 报告标题

一句话摘要。

分类：macro, technology
标签：AI, 生产率
```

分类定义在 `_data/topics.yml` 和 `scripts/content.mjs`：`macro` 金融宏观、`technology` AI 与科技、`markets` 金融市场、`geopolitics` 国际政治与地缘风险。不填分类时 Daily 默认 macro，Weekly 默认 geopolitics；不会自动推断事实。最多 12 个标签，每个最多 40 字。

复制示例：[Daily 模板](templates/daily.md)、[Weekly 模板](templates/weekly.md)。模板是 Demo，正式发布时请替换标题、内容及来源。

## 目录与数据结构

```text
.github/ISSUE_TEMPLATE/   手机投稿表单
.github/workflows/        归档、构建、部署与结果通知
reports/                 Markdown 唯一内容源
_data/topics.yml         栏目定义
_data/reports.json       构建时生成，Git 忽略
_layouts/                首页框架、日报、周报、知识布局
_plugins/report_pages.rb 从安全数据生成文章路由
assets/                  自托管 CSS、JS、搜索逻辑
scripts/                 校验、转换、构建检查和线上验证
tests/                   Node 内置测试，不依赖测试框架
templates/               可复制的 Markdown 示例
```

文件名为 `reports/YYYY-MM-DD-daily.md` 或 `reports/YYYY-MM-DD-weekly.md`。知识条目由仓库维护者直接添加，文件名为 `YYYY-MM-DD-knowledge-slug.md`。Front Matter 使用 JSON（合法 YAML 子集），避免从用户文本拼接 YAML：

```yaml
---
{
  "schema": 1,
  "title": "文章标题",
  "date": "2026-10-22",
  "type": "daily",
  "topics": ["macro"],
  "tags": ["AI"],
  "summary": "摘要",
  "demo": false,
  "issue": 1,
  "source_issue": "https://github.com/Justin2524/global-intelligence/issues/1",
  "submitted_by": "Justin2524",
  "body_sha256": "由程序计算"
}
---
```

不要手工修改已归档文章的正文或哈希。纠错可通过 Owner 审阅代码修改，重新计算哈希后提交；Issue 投稿流程始终拒绝覆盖。

## 本地开发

需要 Node.js 22+、Ruby 3.3+、Bundler。所有依赖安装到项目内；不需要全局 npm 包。

```sh
npm ci
bundle config set --local path .vendor/bundle
bundle install
npm test
npm run build
npm run verify
bundle exec jekyll serve --baseurl /global-intelligence
```

访问 `http://127.0.0.1:4000/global-intelligence/`。修改 Markdown 后重新运行 `npm run prepare-content`，Jekyll 本身不直接读取 `reports/` 原文。

本次交付机器在 `.vendor/ruby` 中包含独立 Ruby，使用前执行 `export PATH="$PWD/.vendor/ruby/bin:$PATH"`。这是被 Git 忽略的本机构建工具，不上传仓库。

## 部署流程

1. `build`（contents: read）：校验 Owner 与表单结构，转换正文，运行测试与 Jekyll，上传 Pages artifact 和单篇归档文件。
2. `archive`（仅 Issue，contents: write）：确认 main 未发生并发变化，仅提交本次经过校验的文章；同一 Issue、同一内容重试不会新建或覆盖。
3. `deploy`（pages: write / id-token: write）：在**同一次工作流**中部署 Pages artifact，不依赖 GITHUB_TOKEN 提交再触发 push。
4. `verify`（contents: read）：检查线上首页、搜索索引、文章页及正文 SHA-256。
5. `notify`（issues: write / actions: read）：只有部署与在线验证通过才评论「发布成功」并关闭 Issue；失败保留 Issue，附错误与工作流链接。

仓库 Settings → Pages → Build and deployment → Source 必须选择 **GitHub Actions**。不要选择从分支发布，否则安全预处理与自定义页面生成器不会按这个流程运行。`github-pages` 环境必须允许 main 部署。若组织策略或分支保护禁止 Actions 写入 main，归档将失败而不是绕过保护。

工作流串行执行。GitHub concurrency 可能替换等待中的 run；如果 Issue 长时间没有评论，查看 Actions 并重跑该 Issue 对应的原始工作流。避免连续快速提交，等待一篇完成后再提交下一篇。

## 维护与边界

- 本站公开，Issues 与 Markdown 也公开，不粘贴隐私或付费全文。
- GitHub 不提供可信的 Issue Form 模板 ID；本项目严格校验表单结构、标签、标题和不可变 Owner ID，不能证明 Owner 一定使用网页表单而非 API。详见 SECURITY.md。
- 公共用户可以创建 Issue，但不能通过发布校验；失败记录会保留。
- 原始 HTML 被当作文字，危险链接被过滤，外部图片显示为替代文本，不加载第三方追踪资源。
- 公式使用 `$...$`，独占行 `$$` 包围块级公式。金额中的美元符号可用 `\$` 转义。不受支持的公式会拒绝构建。
- 搜索下载完整公开索引，适用于个人规模档案；数量大时可再做按年份分片。
- 真实 iPhone 硬件验收与浏览器移动视口模拟是不同的测试，不混同报告。

官方参考：[Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[Issue Forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)、[GITHUB_TOKEN](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token)。
