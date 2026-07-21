# Continuity Discovery Interview / 连续性发现访谈

**Goal: Find out whether people are already inventing their own Continuity Receipts — without knowing it.**

**目标：找到那些已经在发明自己的"连续性收据"、却不知道这个概念存在的人。**

This is not a sales call. You are not pitching CPS-0001. You are researching whether a problem exists that no one has a common language for yet.

这不是销售电话。你不是在推销 CPS-0001。你在研究一个问题是否真实存在——一个目前没有人有共同语言来表达的问题。

---

## Rules / 规则

1. **Do not mention CPS-0001, Continuity Protocol, MyShape, or receipts for the first 80% of the conversation.**
   **前 80% 的对话中，不要提 CPS-0001、Continuity Protocol、MyShape 或 receipt。**

2. Ask open-ended questions. "How do you…" not "Do you need…"
   问开放式问题。"你是怎么……"而不是"你需要……吗？"

3. The most valuable answer is "We built our own thing for that." That's the signal.
   最有价值的回答是："我们自己搞了一个东西来处理这个。"——这就是信号。

4. Take notes. After 20 interviews, you're looking for patterns — not individual answers.
   做笔记。20 次访谈后，你在找规律——不是单个答案。

---

## Phase 1 — Context / 背景 (5 min)

Don't ask about "continuity." Ask about their data.
不要问"连续性"。问他们的数据。

| # | Question / 问题 | What you're listening for / 你在听什么 |
|:---|:---|:---|
| 1.1 | What kind of sensor data does your system work with? (IMU, camera, lidar, encoder, heart rate, eye tracking, etc.)<br>你们的系统处理什么类型的传感器数据？（IMU、摄像头、激光雷达、编码器、心率、眼动追踪等） | Do they have continuous sensor data at all? If no, this interview is likely not a match.<br>他们到底有没有连续传感器数据？如果没有，这次访谈可能不适合。 |
| 1.2 | How fast is this data coming? Once per second? 60 times per second?<br>这些数据进来多快？每秒一次？每秒 60 次？ | High-frequency data has more continuity signal.<br>高频数据有更多连续性信号。 |
| 1.3 | How long does a typical session or task last? Seconds? Minutes? Hours?<br>一个典型的会话或任务持续多久？秒？分钟？小时？ | Longer sessions → more continuity risk.<br>会话越长 → 连续性风险越高。 |

---

## Phase 2 — Data Flow / 数据流动 (5 min)

Find whether their data crosses system boundaries.
搞清楚他们的数据是否跨系统。

| # | Question / 问题 | Signal / 信号 |
|:---|:---|:---|
| 2.1 | Does this sensor data stay in one system, or does it move between systems?<br>这些传感器数据是在一个系统内用，还是会在不同系统之间流转？ | If data stays in one place, continuity may not matter to them.<br>如果数据不出系统，连续性对他们可能不重要。 |
| 2.2 | When it moves, what information gets lost along the way?<br>数据流转过程中，哪些信息会丢失？ | They might describe exactly the problem CPS-0001 solves — without knowing it.<br>他们可能正在描述 CPS-0001 要解决的问题——只是自己不知道。 |
| 2.3 | How do you know the data you received is the same data that was sent?<br>你怎么确定收到的数据就是发出来的数据？ | Are they checking integrity? If so, how?<br>他们在做完整性检查吗？怎么做的？ |

---

## Phase 3 — The Continuity Signal / 连续性信号 (5 min)

This is the core. Listen carefully.
这是核心。仔细听。

| # | Question / 问题 | Signal / 信号 |
|:---|:---|:---|
| 3.1 | Have you ever had a situation where you needed to prove that data from time A and data from time B came from the same source — same device, same session, same person?<br>你有没有遇到过这种情况：需要证明时间 A 和时间 B 的数据来自同一个来源——同一个设备、同一个会话、同一个人？ | Direct continuity need.<br>直接的连续性需求。 |
| 3.2 | How did you prove it? Or did you just not prove it?<br>你怎么证明的？还是根本就没证？ | If they say "we just trust it" → no pain. If they describe a workaround → high pain.<br>如果他们说"我们就是信的"→ 不痛。如果他们描述了一个变通方案 → 很痛。 |
| 3.3 | Is there a moment you look back and think "if we had a way to prove that data was continuous, it would have saved us"?<br>有没有哪个时刻你回头看，觉得"如果能证明数据是连续的，我们就能避免那个问题"？ | This is the money question. A specific story = strong evidence.<br>这是最关键的问题。一个具体的故事 = 强有力的证据。 |

---

## Phase 4 — The Gap / 缺口 (3 min)

| # | Question / 问题 | Signal / 信号 |
|:---|:---|:---|
| 4.1 | Is there something you wish existed that would make handling continuous sensor evidence easier?<br>你有没有想过"要是存在一个什么东西，能让处理连续传感器证据更简单就好了"？ | If they describe a protocol object → jackpot.<br>如果他们描述了一个类似协议对象的东西 → 头奖。 |
| 4.2 | Have you ever built something internally to handle this — even a simple format or convention?<br>你们内部有没有自己搞过一个东西来处理这个——哪怕是一个简单的格式或者约定？ | "We invented our own" = the problem is real.<br>"我们自己发明了一套" = 问题是真实的。 |

---

## Phase 5 — Reveal / 揭示 (2 min)

Only now do you mention CPS-0001.
到这里才提到 CPS-0001。

| # | What you say / 你要说的话 |
|:---|:---|
| 5.1 | "There's a research group that's been working on a standard way to express 'this sensor data comes from a continuous, unbroken observation session.' It doesn't identify who — it proves that the data wasn't tampered with or replaced across time. Would something like that be useful in your world?"<br><br>"有一个研究团队一直在做一个标准化的方式，来表达'这段传感器数据来自一个连续的、未被中断的观测会话'。它不证明'你是谁'——它证明'数据在这段时间内没有被篡改或替换'。这种东西在你的领域有用吗？" |
| 5.2 | "Would you be willing to look at a one-page spec and tell me if it maps to anything you've encountered?"<br><br>"你愿不愿意看一页的规范，然后告诉我它是否跟你们碰到过的情况对得上？" |

---

## After the Interview / 访谈后

Fill this out immediately. / 立即填写：

```
日期 Date:
姓名/角色 Person/Role:
公司/项目 Company/Project:
领域 Domain: [ ] 机器人 Robotics  [ ] XR/空间计算  [ ] 可穿戴 Wearables  [ ] 工业 Industrial  [ ] Agent/AI  [ ] 安全 Security  [ ] 医疗 Medical  [ ] 其他 Other

有连续传感器数据吗？ Has continuous sensor data:   [ ] 是 Yes  [ ] 否 No
数据跨系统流转吗？ Data crosses system boundary: [ ] 是 Yes  [ ] 否 No
有过连续性问题吗？ Has had a continuity problem: [ ] 是 Yes  [ ] 否 No — 描述 describe:
自己造过解决方案吗？ Built their own solution:     [ ] 是 Yes  [ ] 否 No — 描述 describe:
对标准感兴趣吗？ Interested in a standard:     [ ] 是 Yes  [ ] 也许 Maybe  [ ] 否 No

备注 Notes:
```

---

## Target / 目标人群

| Tier / 梯队 | Who / 谁 | How to reach / 怎么找到 |
|:---|:---|:---|
| 1 | XR/空间计算工程师 | Discord, GitHub, X |
| 1 | 机器人系统工程师 | ROS Discourse, GitHub, 行业会议 |
| 1 | 医疗可穿戴数据工程师 | HL7 FHIR 社区, 研究实验室 |
| 2 | 零信任安全架构师 | LinkedIn, 安全会议 |
| 2 | Agent 框架开发者 | GitHub Discussions, Discord |
| 2 | 工业物联网集成商 | OPC UA 论坛, 行业出版物 |
| 3 | 独立研究者 | arXiv 传感器数据预印本, 冷邮件 cold email |

**Goal / 目标: 20 次访谈。大约第 5 次开始出现规律。到第 15 次形成统计信号。**

---

## What Success Looks Like / 成功的定义

Not "someone agrees to use CPS-0001."
不是"有人同意使用 CPS-0001"。

Success is / 成功是:

> **Three or more unrelated teams, in different domains, describe the same problem — proving that sequential sensor evidence is unbroken across time or system boundaries — and none of them have a common way to express it.**
>
> **三个以上不相关的团队，在不同领域，描述同一个问题——需要证明连续的传感器证据在时间或系统边界上没有断裂——而且他们都没有共同的方式来表达它。**

If you find that pattern, the protocol has a reason to exist.
如果你找到了这个规律，协议就有了存在的理由。
