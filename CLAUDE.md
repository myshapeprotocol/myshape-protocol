# CLAUDE.md — MyShape Protocol 项目规范

> 本文档供 AI Agent（Claude、Cursor、Copilot 等）在执行任务前阅读。
> 所有代码生成、文案撰写、设计建议必须遵循以下规范。

---

## 1. 品牌红线（最高优先级）

### 绝对禁止的词汇和概念
- ❌ man, woman, male, female, boy, girl
- ❌ skin, muscle, flesh, body, chest, breasts, genital
- ❌ strong, handsome, pretty, brawny, beautiful
- ❌ biometric, fingerprint, face recognition, retina scan
- ❌ avatar, profile picture, headshot

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

1. `any` 类型未完全消除（strict 模式开启后逐步修复）
2. 多个组件的内联 `<style>` 尚未完全提取到 CSS 文件
3. 部分 CIV layer 页面仍使用 `"use client"` — 可考虑拆分为 Server + Client 组件
4. `useSound.ts` hook 存在但未被复用（JoinWaitlist 自实现了逻辑）
5. `public/protocol-body.glb` 可能已废弃 — 需确认是否删除
6. `src/components/joinwaitlist/index.tsx` — 确认作用（可能冗余）
