# CLAUDE.md — MyShape Protocol 项目规范

> 本文档供 AI Agent（Claude、Cursor、Copilot 等）在执行任务前阅读。
> 所有代码生成、文案撰写、设计建议必须遵循以下规范。

---

## 0. AI Agent 行为准则（最高优先级 · Karpathy 四原则）

### 0.1 先想再写
- **不假设、不隐藏困惑。** 不确定时问，有歧义时列举选项
- 实现前先陈述假设。如果更简单的方案存在，直接说

### 0.2 简洁至上
- 只写被要求的功能。不写"可能以后需要"的抽象
- 50 行能写完绝不写 200 行。写完之后问自己：能被更简洁地表达吗？

### 0.3 手术式修改
- **只碰要求改的部分。** 不顺手"优化"无关代码
- 不重构没坏的东西。不改相邻的注释、格式、代码
- 看到无关的 dead code 可以提，但不删（除非你的改动让它变成孤儿）

### 0.4 目标驱动执行
- 把模糊指令转化为可验证目标
- 多步骤任务先列计划，每步标注验证方式
- 强验收标准让你独立闭环。弱标准（"搞好它"）需要反复澄清

---

## 1. 品牌红线（最高优先级）

### 绝对禁止的词汇和概念
> 完整禁止词列表见 `MyShape_Documentation/AI_Agent_Guidelines.md` §6
- ❌ 性别化术语 (gendered terms)
- ❌ 身体/肉体词汇 (corporeal terms)
- ❌ 外貌判断词 (appearance judgments)
- ❌ 生物识别术语 (bio-identification terms)
- ❌ 头像/照片概念 (profile-image concepts)

### 必须使用的品牌词汇
- ✅ entity, agent, silhouette (abstract)
- ✅ wireframe anatomy, data-outline, particle body
- ✅ ethereal data energy, energy field
- ✅ non-binary aesthetic, non-corporeal
- ✅ motion-signature, kinetic verification
- ✅ genesis ritual, halo scan (circular deep-sense)
- ✅ sovereign identity, data-body, identity mesh

### 核心文案公式
```
MyShape Protocol —
The Sovereign 3D Identity Layer for the Decentralized Human.
AI-native identity | zero-knowledge presence | motion-signature verification
```

---

## 2. 技术栈

| 层 | 技术 | 版本 |
|:---|:---|:---|
| Framework | Next.js App Router | 16.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| 3D | Three.js + @react-three/fiber | 0.182 / 9.x |
| Motion | MediaPipe Pose + Framer Motion | - |
| Backend | Supabase | 2.x |
| Email | Resend | 6.x |
| TypeScript | strict mode | 5.x |

---

## 3. 代码风格

### TypeScript
- `strict: true` — 不允许隐式 `any`、不允许 `null` 不安全操作
- Props 必须显式类型接口（不能用 `any`）
- 禁止 `err: any`，改用 `unknown` 或具体类型

### 组件
- 文件命名：PascalCase（`Header.tsx`、`JoinWaitlist.tsx`）
- `"use client"` 组件放在 `src/components/` 中
- 避免在 `src/app/` 目录中放置非路由组件

### CSS
- 新增 `@keyframes` → 放入 `src/styles/animations.css`（唯一源）
- 组件级样式 → 用 `src/components/<name>/<name>.css`
- 禁止在组件内使用 `<style>` 标签（全局污染）
- 禁止使用 `!important`
- 优先 Tailwind 工具类，其次 CSS 文件，最后 JS 内联样式

### API Routes
- 密钥从 `process.env` 读取，运行时校验
- 禁止在源代码中硬编码任何凭据
- 客户端在 handler 内延迟初始化（不用模块级 placeholder）
- **所有路由必须接入 rate limiter** — 使用 `@/lib/rate-limiter` 中的对应实例
- **`.single()` 查询必须区分 PGRST116**（无行）和其他错误

### Security
- CSP + HSTS + X-Content-Type-Options + X-Frame-Options + Referrer-Policy 已在 `next.config.ts` 配置
- Rate limiter 实例: `apiLookupLimiter`(10/min) / `otpSendLimiter`(3/5min) / `otpVerifyLimiter`(5/5min) / `formSubmitLimiter`(3/hr) / `nodeCreationLimiter`(3/hr) / `researchUploadLimiter`(5/day)
- Error boundaries: `error.tsx`(page) + `global-error.tsx`(layout) + `ErrorFallback`(shared UI)
- 无硬编码凭据 — 所有密钥通过 `validateEnv()` 运行时校验

---

## 4. SEO / GEO 规范

### 每个页面必须有
- `title` + `description` metadata（Server Component）
- 或者 `CanonicalLink` 组件（Client Component）
- 语义化的 H1→H3 标题层级
- 描述文本中使用品牌关键词（"AI-native identity", "motion-signature" 等）

### JSON-LD 优先
- 根布局已包含 Organization + WebSite + DefinedTerms
- 新页面如需额外结构化数据 → 追加到 layout 或页面级 `<script type="application/ld+json">`

---

## 5. 路由规范

| 规范 URL | 镜像 URL（禁止索引） | 说明 |
|:---|:---|:---|
| `/` | - | 首页 |
| `/genesis` | `/civ-layer/genesis` | Genesis 仪式 |
| `/vision` | `/civ-layer/vision` | 愿景 |
| `/papers` | `/civ-layer/papers` | 论文 |
| `/protocol` | `/civ-layer/publication` | 协议架构 |
| `/identity` | - | 身份层 |
| `/protocol/motion-pipeline` | - | 运动管道 |

**规则**：新增内容放在主路由，禁止在 `/civ-layer/` 下创建新的实质内容路由。

---

## 6. Supabase 数据模型

### `protocol_nodes` 表
| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `email` | text (PK) | 节点邮箱 |
| `node_handle` | text | genesis 标识 |
| `otp_code` | text | 6 位验证码 |
| `status` | text | PENDING_VERIFICATION / ACTIVE |
| `created_at` | timestamptz | 创建时间 |

---

## 7. 提交规范

```
<type>: <description>
# 例：
feat: add identity verification pipeline
fix: resolve AudioContext memory leak in JoinWaitlist
refactor: extract animation keyframes to shared CSS
chore: upgrade Next.js to 16.1.6
```

---

## 8. 已知技术债务（供优先级参考）

1. ✅ ~~`any` 类型未完全消除~~ — 已清零（2026-06-27）
2. ✅ ~~内联 `<style>` 标签残留~~ — 已全部提取至 `animations.css`（2026-06-28）
3. ✅ ~~CIV layer `"use client"`~~ — 已拆分：`page.tsx`（Server + metadata）+ `*Client.tsx`（交互）
4. ✅ ~~`useSound.ts` hook~~ — 已移除
5. ✅ ~~`public/protocol-b-o-d-y.glb`~~ — 已移除
6. ✅ ~~`src/components/joinwaitlist/index.tsx`~~ — 已移除
7. ✅ ~~Architecture 页面大量内联 `style={{}}`~~ — 14→5，剩余全为动态值（2026-07-02）
8. ✅ ~~主路由纯客户端页面~~ — 全部已拆分：`page.tsx`（Server + metadata）+ `*Client.tsx`（交互）
9. ✅ ~~SHA-256 哈希为 stub~~ — 已替换为 `@noble/hashes`（2026-07-02）
10. ✅ ~~ZK 模幂纯 JS 实现~~ — 已替换为 `@noble/curves`（2026-07-02）
11. ✅ ~~4 个死引擎文件~~ — 已移至 `docs/engine-concepts/`（2026-07-02）
12. ✅ ~~API rate limiting 碎片化~~ — 已提取共享 `RateLimiter` 类（2026-07-02）
13. ✅ ~~PGRST116 错误被静默吞掉~~ — 已修复 3 个路由（2026-07-02）
14. ✅ ~~无自动化测试~~ — 已搭建 Vitest + 145 tests / 11 suites（2026-07-02）
15. ✅ ~~MotionDemo 1229 行~~ — 已拆分为 11 子组件 → 1066 行（2026-07-02）
16. ✅ ~~HeroDemo 779 行~~ — 已提取 2 模块 → 680 行（2026-07-02）
17. ✅ ~~无生产 Error Boundary~~ — 已添加 3 层（global/root/page）（2026-07-02）
18. ✅ ~~加载页全内联样式~~ — 已 Tailwind 化（2026-07-02）
19. ✅ ~~安全头缺失~~ — 已添加 CSP/HSTS（2026-07-02）
20. ✅ ~~8 个 API 路由缺 rate limit~~ — 已加固 OTP/verify/subscribe 等（2026-07-02）
21. ✅ ~~LinkedIn 数据丢失 bug~~ — `data.linkedin` 从未赋值 → 已修复（2026-07-02）
22. ✅ ~~设计令牌缺失~~ — 已添加 19 CSS 变量（2026-07-02）
23. ✅ Supabase 执行 `010_entropy_growth.sql` — 迁移已应用，所有字段已存在（2026-07-03 验证）
24. ✅ ~~Architecture 页面内联样式~~ — 14→5，原 7 条技术债已全部解决（2026-07-02）
