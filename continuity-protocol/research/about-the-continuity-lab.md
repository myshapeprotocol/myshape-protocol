# About The Continuity Lab / 关于 The Continuity Lab

*一份给你记者朋友的介绍材料*

---

## 我们是什么

The Continuity Lab 是一个**研究组织**，不是公司。没有产品，不融资，不卖东西。

我们研究一个具体问题：

> **在数字世界里，怎么证明"当前在操作的人还是刚才那个人"？**

不是靠刷脸，不是靠密码，不是靠指纹。是靠**物理动作的连续性**——手机在手里的晃动节奏、加速度的变化模式、运动的时间纹理。这些东西每个人不同，而且无法被 AI 完美伪造。

## 我们做了什么

我们写了一份协议草案，叫 **CPS-0001 (Continuity Protocol Core)**。

它定义了一种叫"连续性收据（Continuity Receipt）"的数据格式——任何设备、任何传感器（IMU、摄像头、激光雷达、编码器、心率传感器……）都能用它来表达：

> **"这段连续传感器数据在观测期间没有被替换、篡改或打断。"**

关键设计原则：
- **不证明"你是谁"**——只证明"这段时间一直是同一个来源"
- **不依赖特定硬件**——任何人用任何传感器都能实现
- **验证方不需要知道数据是怎么产生的**——只需要收据本身和协议规范

## 当前的阶段

协议已经跑通了完整的闭环：

```
任何传感器引擎 → 连续性收据 → 验证器（V₁-V₇） → 消费方决定（允许/拒绝）
```

我们有一个参考实现，有测试向量，有验证器，甚至有一个完全独立的第二套引擎（证明协议不依赖我们自己的实现）。代码都开放在 GitHub 上，Apache 2.0 许可证。

**但没有人用。**

## 为什么要做调研

协议本身在技术上跑通了。但我们不确定它解决的是不是一个**真实存在的问题**。

这么多年来做互联网安全，经验告诉我们：学术上漂亮的东西，市场和工程上未必需要。所以我们想做一件事：**不卖协议，先验证需求**。

我们想知道：
- 做机器人、XR、自动驾驶、工业传感器、可穿戴设备的工程师——他们处理连续传感器数据的时候，有没有遇到过"需要证明数据连续且未被替换"的场景？
- 如果有人已经自己搞了一套内部格式来解决这个问题——那说明问题是真实的，只是还没有共同语言。
- 如果所有人都觉得"这不是个问题"——那我们就知道了，协议该归档。

## 调研需要什么

我们希望记者朋友介绍 3-5 个做**机器人、XR、工业 IoT、自动驾驶、可穿戴设备**的工程师或研究员。

不要求他们评价协议。只希望他们回答几个关于"传感器数据跨系统流转时怎么保证连续性"的问题。选择题为主，5 分钟能填完。

如果其中有 1-2 个人愿意聊深，我们有一份 20 分钟的访谈提纲，但不是必须的。

## 网上能找到我们

- 网站：[myshape.com](https://myshape.com)
- Lab 网站：[thecontinuitylab.org](https://thecontinuitylab.org)
- GitHub：[github.com/myshapeprotocol](https://github.com/myshapeprotocol)
- Bluesky：[@myshapeprotocol.bsky.social](https://bsky.app/profile/myshapeprotocol.bsky.social)
- Telegram：[@myshapeprotocol](https://t.me/myshapeprotocol)

## 协议规范

- 完整规范：[myshape.com/research/notes/008-continuity-protocol-core](https://myshape.com/research/notes/008-continuity-protocol-core)
- 实现指南：[github.com/myshapeprotocol/myshape-protocol/tree/master/continuity-protocol](https://github.com/myshapeprotocol/myshape-protocol/tree/master/continuity-protocol)

---

## 一份可转发的简短摘要

> The Continuity Lab 是一个研究组织。他们写了一项开源的协议草案 CPS-0001，用来表达"连续传感器数据的完整性和未被中断的连续性"。目前协议跑通了，但他们想知道这个问题在真实工程领域是否存在。他们在找做机器人、XR、自动驾驶、工业传感器或可穿戴设备的工程师做一份 5 分钟的问卷。不卖东西，纯研究。
