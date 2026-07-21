# Continuity Discovery Survey / 连续性发现调查

**5-minute survey. No sales. Pure research. / 5 分钟调查。纯研究，不推销。**

We are researching whether teams working with sensor data have encountered a specific pain point. Your honest answers help us determine whether a real problem exists — or doesn't.

我们正在研究处理传感器数据的团队是否遇到了一个特定的痛点。你的真实回答会帮助我们判断一个真实的问题是否存在。

---

## Part 1 — Your Domain / 你的领域

**1. What domain do you work in? / 你在哪个领域工作？**

- [ ] Robotics / 机器人
- [ ] XR / Spatial Computing / 空间计算
- [ ] Wearables / 可穿戴设备
- [ ] Industrial IoT / 工业物联网
- [ ] Autonomous Vehicles / 自动驾驶
- [ ] AI Agent / Multi-Agent Systems / AI Agent 系统
- [ ] Security / Zero Trust / 安全/零信任
- [ ] Medical / Healthcare / 医疗/健康
- [ ] Other / 其他: ___________

**2. Your role? / 你的角色？**

- [ ] Engineer / 工程师
- [ ] Researcher / 研究员
- [ ] Architect / 架构师
- [ ] Product / 产品
- [ ] Other / 其他: ___________

---

## Part 2 — Your Data / 你的数据

**3. Does your system work with continuous sensor data (IMU, camera, lidar, encoder, heart rate, etc.)?**
**你们的系统是否处理连续传感器数据？**

- [ ] Yes, extensively / 是，大量处理
- [ ] Yes, occasionally / 是，偶尔处理
- [ ] No / 不处理 → *(如果选 No，后面的不用填了，谢谢！)*

**4. How fast does this data typically arrive? / 数据通常以多快的频率到达？**

- [ ] < 1 Hz (less than once per second / 低于每秒一次)
- [ ] 1–10 Hz
- [ ] 10–100 Hz
- [ ] > 100 Hz

**5. How long is a typical session or task? / 典型的会话或任务持续多久？**

- [ ] < 1 minute / 少于 1 分钟
- [ ] 1–10 minutes / 1–10 分钟
- [ ] 10 minutes – 1 hour / 10 分钟到 1 小时
- [ ] > 1 hour / 超过 1 小时

---

## Part 3 — Data Flow / 数据流动

**6. Does this sensor data move between different systems or stay in one place?**
**这些传感器数据是在不同系统之间流转，还是只在一个系统内使用？**

- [ ] Stays in one system / 只在一个系统内
- [ ] Moves between systems / 在不同系统间流转
- [ ] Sometimes / 有时候

**7. When sensor data moves between systems, what happens to the "source" information?**
**当传感器数据在系统之间流转时，"来源"信息会发生什么？**

- [ ] We preserve full provenance / 我们保留完整溯源链
- [ ] We preserve some — timestamps and device ID / 保留部分，如时间戳和设备 ID
- [ ] Most source context is lost / 大部分来源信息会丢失
- [ ] We never thought about this / 没想过这个问题
- [ ] Data doesn't move between systems / 数据不出系统

---

## Part 4 — The Pain Point / 痛点

**8. Have you ever needed to prove that "this sensor data at time B is from the same source as time A"?**
**你有没有需要证明"时间 B 的传感器数据和时间 A 来自同一个来源"？**

- [ ] Yes, frequently / 是，经常需要
- [ ] Yes, occasionally / 是，偶尔需要
- [ ] Rarely / 很少需要
- [ ] Never / 从来不需要

**9. If yes — how do you prove it today? / 如果需要——你现在怎么证明？**

- [ ] We built our own internal format / convention / 我们内部自己造了一套格式/约定
- [ ] We use a database / ledger / timestamp chain / 用数据库/账本/时间戳链
- [ ] We trust the transport layer (TLS, VPN) / 信任传输层（TLS、VPN）
- [ ] We don't prove it — we just trust / 不证，就是信
- [ ] Not applicable / 不适用

**10. Have you ever thought: "I wish there was a standard way to package sensor evidence with time + integrity proof"?**
**你有没有想过："能不能有一种标准的方式，把传感器证据连同时间和完整性证明一起打包"？**

- [ ] Yes — and we've looked for one / 是——而且我们找过
- [ ] Yes — but we've never looked / 是——但没找过
- [ ] Never thought about it / 没想过
- [ ] We use something that already does this / 我们已经在用能做到这点的东西了

---

## Part 5 — Curiosity / 好奇心

**11. A research group has been working on a protocol object that expresses "this sensor data is from a continuous, unbroken observation session" — without identifying who the subject is. Would you be curious enough to read a one-page summary?**
**有一个研究团队一直在做一个协议对象，用来表达"这段传感器数据是一个连续的、未被中断的观测会话的产物"——不证明是谁，只证明连续性。你会有兴趣看一眼一页的摘要吗？**

- [ ] Yes, I'd read it / 是，我会看看
- [ ] Maybe / 也许
- [ ] No / 不感兴趣

**12. Can we reach you? (Optional) / 可以联系你吗？（选填）**

Email / 邮箱: ___________  
WeChat / 微信: ___________  
Or just DM: ___________

---

## That's it. Thank you. / 结束了。谢谢。

*The Continuity Lab — Research Discovery, 2026*
