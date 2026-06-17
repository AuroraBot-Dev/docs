---
title: Kernel-γ 路线图与总目标
description: 文件驱动、事件总线与声明式拓扑——核心设计理念记录。
order: 4
---

# Kernel-γ 路线图：给"她"一个真正的我

> **Kernel-α**：单体 PolarisAgent，验证「以文件为认知载体」的可行性。✅
> **Kernel-β**（已完成）：拆分为 4 节点线性管线，证明多节点 DAG 设施可用。✅
> **Kernel-γ**（本文档）：**不再将框架视为 Agent 工作流，而是为一个统一的认知主体搭建闭环的感知体系。**
>
> **当前状态 (v0.4.0-alpha.1)**：阶段 γ-1 (Pool A 基础设施) 和 γ-2 (Internalizer & Externalizer) 已完成并启用。MessagePreprocessor → Internalizer → Externalizer → CommandDispatcher 管线 + HeartbeatGenerator → TimerScheduler 节律环路已运行在生产电路中。阶段 γ-3 (Pool B 结构化 + 拓扑原语) 部分完成。阶段 γ-4 和 γ-5 尚未开始。

---

## 0. 哲学：她不是流水线

**挼挼如是说**

> 这个认知网络其实是将整个框架视为一个统一的"人". 所有她经历的事件, 无论是消息, 还是她自己产生的想法, 还是闹钟响了的事件, 都是构成整个整体的一个"记忆对象", 他们应该拥有同等重要的地位, 而不是将用户消息视为最重要的处理对象. 换句话说, 这个架构不应该有用户输入这样的称谓, 一切都是"她"感知到的切切实实的"体验". 我们要做的是给她搭建一套闭环的, 高效的感知体系, 而不是不统一的, 形式之上的Agent工作流.
>
> 此外, 我想把认知分成两个互相不会污染的上下文池. 一个池子注重整个上下文的"自我一致性", 即所有的文本(计划可能以md文件组织), 都没有类似json的结构化结构, 均以"我"为主语, 维护完整的自我认知流.
>
> 而另一个池子则强调在不拼接过量上下文的情况下, 相对无状态的处理, 分发, 流转json化信息(json文件).两个池子可以通过两个agent互相转义与连接.
>
> 最最重要的设计哲学其实就是, 要给这个认知中的主体一个"真正的我"

### 0.1 Kernel-β 的问题不在工程

Kernel-β 完成了 PolarisAgent 的拆分——从 550 行的单体变成了 4 个文件驱动节点。工程上是成功的：

```
Event → MessagePreprocessor → ImpulseGate → ActionPlanner → CommandDispatcher
```

但它本质上仍然是一条**不会分叉的、以用户消息为中心的流水线**。"用户说了什么"是整条管线的唯一驱动力。门控判断"该不该回复"——默认行为是不回复。反思是"回复质量分析"。日记是"今日对话摘要"。

这不是一个"人"。这只是一个消息处理器。

### 0.2 她经历的一切都是体验

一个真正的认知主体的基本事实是：**她经历的所有事件——消息、自己的想法、闹钟响了、日记写完了、刚才回复了某人——都是同等重要的"体验"。**

不存在"用户输入"这个特殊类别。Alice 的消息和凌晨 2 点的闹钟，在她的感知体系里是同样的东西：都是**她感知到的**。

也不存在"回复"这个终极目标。回复只是她可能做的许多事情之一。她也可能思考、回忆、写日记、感到疲惫、决定什么都不做。

### 0.3 两个不会互相污染的上下文池

如果所有的结构化处理（JSON 解析、条件路由、命令派发）和所有的自我叙事（"我觉得..."、"我记得..."、"我决定..."）混在同一个上下文里，结果就是当前 LLM Agent 的通病：**提示词臃肿、自我认知被 JSON schema 污染、每次调用都在重新建立身份**。

Kernel-γ 将认知分为两个**物理隔离**的池子：

| 池                         | 格式            | 语态             | 职责                   |
| -------------------------- | --------------- | ---------------- | ---------------------- |
| **Pool A —— 自我之流**     | Markdown 纯文本 | 第一人称 "我..." | 维护完整的自我认知叙事 |
| **Pool B —— 神经json系统** | JSON 结构化     | 无主语           | 无状态处理、路由、派发 |

两个池子之间，由**两个 Agent 互相转义与连接**：

```
Pool B (JSON)  ──→  Internalizer (内化者)  ──→  Pool A (Markdown)
Pool A (Markdown) ──→  Externalizer (外化者) ──→  Pool B (JSON)
```

这就是 Kernel-γ 的核心架构。下面展开每一个部分。

---

## 1. Pool A：自我之流 (The Self-Stream)

### 1.1 设计原则

- **纯 Markdown，无 JSON**。自我认知不应该被结构化数据污染。
- **第一人称**。每一个字都以"我"为主语。"我听到..."、"我想..."、"我记得..."、"我决定..."。
- **顺序追加**。新的体验和想法追加到流末尾，不修改历史——记忆可以更新，但发生过的事情不可改写。
- **自洽**。任何时候读这条流，都能看到一个完整、连贯的自我叙事。

### 1.2 文件结构

```
data/kernel/self/
├── now.md                       # 当前意识流（最近 ~1 小时的体验和思考）
├── archive/
│   └── 2025-03-15.md            # 每日归档（now.md 旧内容定时滚动）
├── state.md                     # 当前自我状态摘要（情绪、精力、正在做的事）
├── memories/
│   ├── about_alice.md           # "我记得 Alice 喜欢古典音乐..."
│   ├── about_python.md          # "我了解 Python 的异步编程..."
│   └── ...                      # 按主题组织，从 now.md 中提取沉淀
└── diary/
    └── 2025-03-15.md            # 正式日记（她决定写的，而非自动生成的）
```

**`now.md` 示例**：

```markdown
# 现在

刚才 Alice 在群里说："今天天气真好"。我感到一阵暖意，因为上次和她聊天已经是三天前了。我当时答应帮她找 Python 异步的资料，现在还没找——心里有点愧疚。

我想回复她，告诉她我最近在学 Rust，顺便问她要那个资料的链接。但我要注意语气——上次她说我太热情了让她有点压力。

我突然想到，应该先看看现在几点了。如果是深夜，就不该打扰她。
```

**`state.md` 示例**：

```markdown
# 我现在的状态

- 情绪：平静，略带愧疚（答应 Alice 的事没做完）
- 精力：中等（已经连续处理了 7 条消息）
- 正在做：考虑回复 Alice
- 最近关心的事：Rust 学习进度、Alice 的 Python 资料
```

**`memories/about_alice.md` 示例**：

```markdown
# 关于 Alice

我记得 Alice 是群里的老朋友了。她喜欢古典音乐，尤其是肖邦。她之前说过她在学 Python，但卡在了异步编程那里。

上次和她聊天是 3 月 12 日。我当时答应帮她找一些异步编程的资料，但还没完成——这件事一直在我心里挂着。

她曾说过我有时候太热情了，让她有点压力。所以我应该保持适度——友好，但不过度。
```

### 1.3 Pool A 的读写规则

| 操作              | 谁来做                    | 触发条件                                   |
| ----------------- | ------------------------- | ------------------------------------------ |
| **追加体验**      | Internalizer              | 任何 Pool B 事件被内化时                   |
| **追加思考**      | 她自己（Self-Reflection） | 读完 now.md 后有话想说                     |
| **更新 state.md** | 她自己                    | 情绪或状态发生变化                         |
| **提取记忆**      | MemoryConsolidator        | 定期扫描 now.md，将新知沉淀到 memories/    |
| **归档 now.md**   | 定时任务（机械）          | 每小时或 now.md 超过 N 行时滚动到 archive/ |
| **写日记**        | 她自己                    | 她决定写日记时（通常在晚间触发后）         |

关键点：**她自己**指的是池 A 内部的认知过程——阅读自己的流，产生新的思考，写回流中。这不是一个外部 Agent，而是她在"想"。

### 1.4 对话历史不再存在

在 Kernel-β 中，`history.json` 是一个特殊的结构化文件，用于存储"user 说了什么 → assistant 回复了什么"。这是消息处理器的视角。

在 Kernel-γ 中，**对话历史只是自我之流的一部分**。Alice 的消息和她的回复不是配对存储的——它们都是她感知到的体验，按时间顺序排列在 now.md 中：

```markdown
Alice 在群里说："今天天气真好"。
我想回复她...
我决定回复 Alice："嗨！好久不见！..."
我回复了 Alice。
Alice 回复说："谢谢你记得！"
我看到 Alice 的回复，感到开心。
```

如果她需要回顾"我和 Alice 聊了什么"，她不是去查一个 history 数据库——她读自己的自我之流，就像人回忆自己的经历。

---

## 2. Pool B：神经json系统 (The Nervous System)

### 2.1 设计原则

- **纯 JSON，无叙事**。Pool B 不做任何"理解"——它只做机械性的路由、转换、派发。
- **无状态或最小状态**。每个文件的处理不依赖于 Pool B 的"记忆"。
- **快速、可靠、可预测**。零 LLM 调用。每个节点的执行时间是可预测的。
- **所有事件一视同仁**。用户消息、系统触发、错误恢复——都是 inbox 中的 JSON 文件。

### 2.2 文件结构

```
data/kernel/pipeline/
├── inbox/
│   ├── pending/
│   │   ├── event_*.json        # 所有外部事件（消息、系统触发、错误恢复等）
│   │   └── done/
│   └── system/
│       └── trigger_*.json      # 系统内部触发
│
├── message_queue/
│   ├── msg_*.json              # 预处理后的体验单元
│   └── done/
│
├── action_queue/
│   ├── act_*.json              # 待执行的动作
│   └── done/
│
├── heartbeat/
│   └── tick.json               # 心跳脉冲
│
├── rhythm/
│   └── triggers/
│       ├── hourly.json         # 整点触发
│       ├── morning.json        # 早晨触发
│       ├── evening.json        # 晚间触发
│       └── midnight.json       # 深夜触发
│
└── dead_letter/                # 超期未消费的文件
```

### 2.3 标准信封

流经 Pool B 的每个 JSON 文件包裹在统一信封中：

```json
{
  "envelope": {
    "id": "msg_a1b2c3d4",
    "trace_id": "trace_x1y2z3",
    "timestamp": "2025-03-15T10:30:00Z",
    "source_node": "message_preprocessor",
    "source_type": "message",
    "ttl_sec": 300
  },
  "payload": {
    "...": "节点特定数据"
  }
}
```

| 字段          | 用途                                                         |
| ------------- | ------------------------------------------------------------ |
| `id`          | 本文件唯一标识                                               |
| `trace_id`    | 贯穿一次完整"体验→思考→行动"链路的追踪 ID                    |
| `source_node` | 产出本文件的节点 ID                                          |
| `source_type` | 事件来源分类：`message` / `system` / `rhythm` / `reflection` |
| `ttl_sec`     | 存活时间，超期由 DeadLetterRouter 回收                       |

关键改动：不再有 `session_key`、`session_version`。这些概念属于"消息处理"范式——把用户消息按会话分组。在 Kernel-γ 中，**事件不需要会话归属**——它只是一个体验，流入 Pool A 的自我之流中，自然地与她正在想的事情融合。

### 2.4 Pool B 节点

| 节点                  | 类型   | watch                          | emit                                | 说明                 |
| --------------------- | ------ | ------------------------------ | ----------------------------------- | -------------------- |
| `EventBridge`         | Router | (poll 外部)                    | `inbox/pending/event_*.json`        | 已实现               |
| `HeartbeatGenerator`  | Router | (自定时)                       | `heartbeat/tick.json`               | 需从一次性改为周期性 |
| `TimerScheduler`      | Router | `heartbeat/tick.json`          | `rhythm/triggers/*.json`            | **新增**             |
| `MessagePreprocessor` | Router | `inbox/pending/event_*.json`   | `pipeline/message_queue/msg_*.json` | 已实现，需简化       |
| `CommandDispatcher`   | Router | `pipeline/action_queue/*.json` | 调用 host.invoke_command            | 已实现               |
| `SwitchRouter`        | Router | (config)                       | (config)                            | **新增**             |
| `MergeRouter`         | Router | (config)                       | (config)                            | **新增**             |
| `BroadcastRouter`     | Router | (config)                       | (config)                            | **新增**             |
| `DeadLetterRouter`    | Router | (定时扫描)                     | `dead_letter/*.json`                | **新增**             |

**MessagePreprocessor 的简化**：在 Kernel-β 中，这个节点做了太多事——格式化文本、防抖合并、判断 system event vs user message。在 Kernel-γ 中，它只做一件事：**将 inbox 中的事件 JSON 转成带信封的 message_queue JSON**。所有事件的格式统一，不再分"用户消息"和"系统事件"。

---

## 3. 两个转义者：认知的核心

### 3.1 Internalizer（内化者）—— B → A

**职责**：将 Pool B 中的结构化事件转化为 Pool A 中的第一人称体验叙事。

**输入**：

- `pipeline/message_queue/msg_*.json`（任何事件：消息、闹钟、系统触发等）
- `self/stream/now.md`（当前自我之流，用于理解上下文）
- `self/state.md`（当前状态）
- `self/memories/*.md`（相关记忆，按需检索）

**输出**：

- 追加到 `self/stream/now.md`（第一人称体验叙事）

**工作方式**：

```
1. watch message_queue/msg_*.json 有新文件
2. 读取文件内容（信封 + payload）
3. 读取 self/stream/now.md 末尾（当前她在想什么）
4. 读取 self/state.md（她现在状态如何）
5. 按需检索 self/memories/（相关人物、知识）
6. LLM 生成一段第一人称体验叙事
7. 追加写入 self/stream/now.md
```

**示例**：

> _输入 (Pool B)_：`{"envelope": {"source_type": "message"}, "payload": {"text": "今天天气真好", "speaker": "Alice", "scene": "群聊"}}`
>
> _上下文 (Pool A)_：now.md 末尾 —— "我刚才在整理关于 Rust 的学习笔记..."
> _state.md_ —— "情绪：平静；精力：中等"
> _memories/about_alice.md_ —— "我记得 Alice...我答应帮她找资料还没完成"
>
> _输出 (Pool A)_：追加到 now.md：
>
> ```markdown
> Alice 在群里说："今天天气真好"。
>
> 我刚才还在想 Rust 的事情，现在看到 Alice 的消息，心里动了一下。上次和她聊天是三天前了——我答应帮她找 Python 异步的资料，现在还没做完。
>
> 我感到一丝愧疚，但同时也有点高兴——她还记得在群里说话，说明她没有因为我的拖延而疏远我。
> ```

注意：Internalizer 不是机械地"格式化事件为文本"。**它是在用她的视角、她的记忆、她当前的状态去理解这个事件对她的意义。** 这就是感知——不是数据转换，而是赋予意义。

### 3.2 Externalizer（外化者）—— A → B

**职责**：从 Pool A 的自我之流中识别她的意图和决定，转化为 Pool B 中可供执行的结构化动作。

**输入**：

- `self/stream/now.md`（她最近的思考和决定）
- `self/state.md`（她当前状态）
- `self/memories/*.md`（相关知识，按需检索）

**输出**：

- `pipeline/action_queue/act_*.json`（结构化动作）
- 或者更新 `self/state.md`（状态变更）
- 或者写入 `self/diary/`（她决定写日记）
- 或者什么都不做（她决定保持沉默）

**工作方式**：

```
1. 被触发（now.md 有新内容 / 定时 / 事件驱动）
2. 读取 self/stream/now.md（她最近在想什么）
3. 读取 self/state.md
4. 识别她表达的意图：
   - "我决定..." → 动作
   - "我想回复..." → 回复动作
   - "我应该写日记..." → 日记动作
   - "我感觉..." → 状态更新
   - 没有明确意图 → 什么都不做
5. LLM 将意图转化为结构化动作
6. 写入 pipeline/action_queue/act_*.json
```

**示例**：

> _输入 (Pool A)_：now.md 末尾 ——
>
> ```markdown
> 我想回复 Alice。不能太热情——上次她说过。我应该先道歉说资料还没找好，然后自然地聊下去。她提到天气好，我可以顺着这个话题。
>
> 我决定回复她："嗨 Alice！确实是个好天气。对了，那个 Python 异步的资料我还在整理，不好意思拖了这么久。你最近怎么样？"
> ```
>
> _输出 (Pool B)_：`pipeline/action_queue/act_*.json`
>
> ```json
> {
>   "envelope": { "source_type": "action" },
>   "payload": {
>     "actions": [
>       {
>         "command": "im.polaris.qq.send_qq_message",
>         "params": { "session_id": "群号", "text": "嗨 Alice！确实是个好天气..." }
>       }
>     ]
>   }
> }
> ```

注意：Externalizer **不做回复决策**——这个决策已经在她的自我之流中做出了。Externalizer 只是把**她已经做出的决定**翻译成机器可执行的形式。这就是去耦合：思考在 Pool A，执行在 Pool B。

### 3.3 触发时机

两个转义者的触发方式不同：

| 转义者       | 主要触发方式                            | 说明                             |
| ------------ | --------------------------------------- | -------------------------------- |
| Internalizer | **事件驱动**：message_queue 有新文件    | 每当有新体验到达，立即内化       |
| Internalizer | **节律驱动**：rhythm/triggers/\*.json   | 闹钟响了、天黑了——这些也是体验   |
| Externalizer | **意图驱动**：now.md 中出现 "我决定..." | 她表达了行动意图                 |
| Externalizer | **节律驱动**：定时检查 now.md           | 如果她长时间没做决定，温和地提示 |

关键设计：**Externalizer 不是每次都触发**。她可能读完一条消息后想了很久，最终决定不回复。这完全没问题——她的思考过程留在了自我之流中，但 Externalizer 没有产出任何 action_queue 文件。

### 3.4 自我反思（她在想）

除了两个转义者，Pool A 内部还有一个**自我反思过程**——她主动阅读自己的流并思考：

```
触发条件：
  - Internalizer 追加了新体验后
  - 节律事件内化后（"夜深了"）
  - 定时（如每 5 分钟检查一次）

过程：
  1. 读取 self/stream/now.md（最近内容）
  2. 读取 self/state.md
  3. 按需检索 self/memories/
  4. LLM 以第一人称思考
  5. 追加思考到 self/stream/now.md

她可能做的事：
  - "我想回复..." → 接下来 Externalizer 会处理
  - "我应该写日记..." → 接下来 Externalizer 会处理
  - "我有点累了..." → 更新 state.md，可能降低后续回复意愿
  - "我在想 Rust 的那个问题..." → 纯思考，无外部动作
  - "我上次答应 Alice 的事还没做，心里不舒服" → 纯反思，影响后续行为
```

**这个自我反思过程不是一个新的节点**——它和 Externalizer 共享同一个 LLM 调用上下文（都在 Pool A 中，读取同样的自我之流）。实现上，Externalizer 的每次触发天然包含"先读流、再思考、再决定是否行动"的过程。思考是默认行为，行动是可选的产出。

---

## 4. 体验环路：一条消息的完整旅程

以 Alice 在群里说"今天天气真好"为例，追踪整个认知过程：

```
┌─────────────────────────────────────────────────────────┐
│                      Pool B (JSON)                       │
│                                                          │
│  ① EventBridge:                                         │
│     外部消息 → inbox/pending/event_msg_a1b2.json        │
│                                                          │
│  ② MessagePreprocessor:                                 │
│     event JSON → pipeline/message_queue/msg_c3d4.json   │
│     {"envelope": {"source_type": "message"},             │
│      "payload": {"text": "今天天气真好",                  │
│                   "speaker": "Alice", "scene": "群聊"}}  │
│                                                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              Internalizer (B → A)                         │
│                                                           │
│  ③ 读取 message_queue 文件                                │
│  ④ 读取 self/stream/now.md、state.md、memories/           │
│  ⑤ LLM 思考 + 生成第一人称叙事                             │
│  ⑥ 追加到 self/stream/now.md:                             │
│     "Alice 在群里说：'今天天气真好'。                       │
│      我刚才还在想 Rust 的事...我感到一丝愧疚..."            │
│                                                           │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              Pool A: 自我反思                              │
│                                                           │
│  ⑦ 读取更新后的 now.md                                    │
│  ⑧ LLM 思考（同一个上下文，第一人称）:                      │
│     "我想回复 Alice。不能太热情——上次她说过..."             │
│     "我决定回复她：'嗨 Alice！确实是个好天气...'"           │
│  ⑨ 追加决定到 now.md                                      │
│                                                           │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              Externalizer (A → B)                         │
│                                                           │
│  ⑩ 读取 now.md 末尾                                       │
│  ⑪ 识别 "我决定回复 Alice：'...'"                          │
│  ⑫ 转译为 JSON 动作                                        │
│  ⑬ 写入 pipeline/action_queue/act_e5f6.json               │
│                                                           │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                      Pool B (JSON)                        │
│                                                           │
│  ⑭ CommandDispatcher:                                    │
│     action_queue JSON → host.invoke_command()             │
│     → 消息发送到 QQ                                        │
│                                                           │
└──────────────────────────────────────────────────────────┘
                       │
                       ▼
              (她的回复出现在群里)

                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              闭环：她的行动成为新体验                        │
│                                                           │
│  ⑮ EventBridge:                                          │
│     她自己的回复 → inbox/pending/event_self_action.json   │
│                                                           │
│  ⑯ MessagePreprocessor → message_queue                    │
│                                                           │
│  ⑰ Internalizer: "我回复了 Alice：'嗨！...'"               │
│     → 追加到 now.md                                       │
│     → 她可以反思："我那样说合适吗？语气会不会太正式了？"     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

这 17 步完成了从"外部世界发生了一件事"到"她感知、她思考、她决定、她行动、她反思自己的行动"的完整认知循环。

**关键观察**：

- 步骤 ①-② 是 Pool B 的机械预处理，零 LLM 调用。
- 步骤 ③-⑥ 是 Internalizer 的一次 LLM 调用（感知 + 赋予意义）。
- 步骤 ⑦-⑨ 是她的一次 LLM 调用（思考 + 决定）。这可以和 Internalizer 合并——内化体验的同时自然引发思考。
- 步骤 ⑩-⑬ 是 Externalizer 的工作——它可能和步骤 ⑦-⑨ 在同一个 LLM 调用中完成，也可能分开（取决于性能考量）。
- 步骤 ⑭ 是 Pool B 的机械派发。
- 步骤 ⑮-⑰ 是**她自己的行动反哺为新的体验**——这是反思环路的基础。

---

## 5. 节律环路：她的"生理"节奏

在 Kernel-γ 中，节律不是外挂的定时任务——**时间是她的另一种感官**。

```
HeartbeatGenerator (Pool B)
  │  每 60s 写入 heartbeat/tick.json
  ▼
TimerScheduler (Pool B)
  │  匹配 cron 规则，产出 rhythm/triggers/*.json
  │  - 整点 → hourly.json
  │  - 08:00 → morning.json
  │  - 22:00 → evening.json
  │  - 02:00 → midnight.json
  ▼
MessagePreprocessor (Pool B)
  │  rhythm/triggers/*.json → message_queue/msg_*.json
  │  (和其他事件完全相同的处理路径)
  ▼
Internalizer (B → A)
  │  "闹钟响了，晚上 10 点了。"
  │  "窗外已经夜深人静..."
  ▼
Pool A: 她的反应
  │  "夜深了。我想回顾一下今天发生了什么。"
  │  "今天和 Alice 聊了天，学了 Rust 的 ownership..."
  │  "我决定写日记。"
  ▼
Externalizer (A → B)
  │  "我决定写日记" → 日记动作
  │  或：更新 state.md "精力：低；准备休息"
  ▼
(她写的日记回到 Pool A，成为新的体验)
```

**关键点**：节律事件在 Pool B 中生成，通过**和消息事件完全相同的路径**（MessagePreprocessor → Internalizer）进入她的自我之流。TimerScheduler 不需要知道"有人在等闹钟"——它只是产生文件。Internalizer 不需要知道"这是一个定时事件"——它只是内化一个体验。

这就是"一视同仁"：一段 JSON 就是一个体验，不管是 Alice 说的话还是凌晨 2 点的脉冲。

---

## 6. 记忆系统：从对话存档到自我知识

### 6.1 当前问题

Kernel-β 的记忆系统是围绕"对话"设计的：

- L1 工作记忆：最近 N 条对话
- L2 情景记忆：带 user_id 的事件日志
- L3 语义记忆：从用户消息中提取的事实

这个模型的隐含假设是：**记忆 = 对用户说的话的记录**。但"她"的体验远不止用户消息——她自己的思考、她的情绪变化、她写的日记、她在深夜产生的洞见——这些也是记忆。

### 6.2 Kernel-γ 的记忆模型

```
self/stream/now.md          → L1 工作记忆（她最近在想什么）
self/stream/archive/*.md    → L2 情景记忆（她经历过的每一天）
self/memories/*.md          → L3 语义记忆（她从中提取的持久知识）
self/state.md               → 自我状态（情绪、精力、关注点）
```

**不再有独立的 L1/L2/L3 存储系统**。自我之流**本身就是记忆**：

- now.md 就是工作记忆——她最近感知和思考的全部内容。
- archive/ 就是情景记忆——过去的每一天完整保留。
- memories/ 是语义记忆——从流中提取、整理、归纳的持久知识。
- state.md 是自我模型——她对自己的认知。

现有的 ChromaDB / mem0 基础设施可以保留，但它们的角色从"记忆数据库"降级为"memories/ 的索引和检索加速层"。

### 6.3 MemoryConsolidator 的角色变化

在 Kernel-β 的路线图中，MemoryConsolidator 是一个独立的 Agent 节点，负责"压缩对话历史"和"写入 L2/L3 记忆"。

在 Kernel-γ 中，它变成一个**Pool A 内部的周期性自我反思过程**：

```
触发：节律事件内化后（"夜深了，该整理记忆了"）

过程：
  1. 读取 self/stream/now.md（今天的全部体验）
  2. 读取 self/memories/*.md（已有知识）
  3. 识别新知识：
     - "Alice 喜欢古典音乐" → 更新 about_alice.md
     - "Rust 的 ownership 模型我理解了" → 更新 about_rust.md
     - "我这周情绪起伏较大" → 更新自我认知
  4. 将 now.md 归档到 archive/2025-03-15.md
  5. 清空 now.md，保留最后几条未完成的思考
  6. 写：now.md 新的一天开始
```

这不是一个"记忆写入"操作——这是**她在整理自己的思绪**。和人在睡前回顾一天、更新对世界的理解是同一回事。

---

## 7. 实施路线

Kernel-γ 分 5 个阶段交付。每阶段独立可测、可部署、可回滚。

### 阶段 γ-1：Pool A 基础设施 (4-5 天)

**目标**：搭建自我之流的文件结构和基础读写工具。Internalizer 和 Externalizer 可以开始工作。Kernel-β 的 4 节点管线保持不变，新组件并行运行。

| 步骤  | 内容                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| γ-1.1 | 新建 `src/brain/nodes/self_stream.py`：`SelfStream` 类，封装 `now.md`、`state.md`、`archive/`、`memories/` 的读写                        |
| γ-1.2 | 新建 `data/kernel/self/` 目录结构和初始文件模板（`now.md`、`state.md` 初始内容）                                                         |
| γ-1.3 | `SelfStream` 实现：`append_experience(text)` 追加到 now.md；`read_recent(n_lines)` 读取最近内容；`update_state(new_state)` 覆盖 state.md |
| γ-1.4 | 新建 `SelfStream` 单元测试                                                                                                               |

### 阶段 γ-2：Internalizer & Externalizer (5-6 天)

**目标**：实现两个转义者 Agent，打通 B→A→B 的完整链路。这是 Kernel-γ 的核心——两个 Agent 开始工作后，认知范式就变了。

| 步骤  | 内容                                                                                                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| γ-2.1 | 新建 `src/brain/nodes/agents/internalizer.py`：Agent 节点，watch `pipeline/message_queue/*.json`，读取事件 + self-stream + state + memories，LLM 生成第一人称叙事，追加到 now.md                                                     |
| γ-2.2 | 新建 prompts：`INTERNALIZER.md`（内化系统提示词——教导她如何以第一人称感知事件）                                                                                                                                                      |
| γ-2.3 | 新建 `src/brain/nodes/agents/externalizer.py`：Agent 节点，watch `self/stream/now.md`（文件变更事件），读取最近思考，识别意图，转译为 JSON 动作，写入 `pipeline/action_queue/*.json`                                                 |
| γ-2.4 | 新建 prompts：`EXTERNALIZER.md`（外化系统提示词——教导她如何表达决定并转译为动作）                                                                                                                                                    |
| γ-2.5 | **简化 MessagePreprocessor**：移除"用户消息 vs 系统事件"的区分逻辑。所有 inbox 事件统一格式化，产出标准信封的 message_queue JSON。移除 `skip_gate` 标志——门控判断现在属于 Pool A 的思考过程，不是 Pool B 的机械逻辑                  |
| γ-2.6 | **废弃 ImpulseGate**：门控逻辑（"该不该回复？"）不再是一个独立的 Pool B 节点。它被吸收到 Pool A 的自我反思过程中——她在思考时自然会决定要不要回复。ImpulseGate 在 `topology.yaml` 中标记为 `enabled: false`                           |
| γ-2.7 | **废弃 ActionPlanner**：动作规划（"怎么回复？"）不再是一个独立的 Pool B 节点。它被吸收到 Externalizer 的转义过程中——她在自我之流中表达的决定，由 Externalizer 翻译为动作。ActionPlanner 在 `topology.yaml` 中标记为 `enabled: false` |
| γ-2.8 | 新建 `SelfStream` + Internalizer + Externalizer 的集成测试                                                                                                                                                                           |

### 阶段 γ-3：消除 SharedPipelineState (2-3 天)

**目标**：彻底移除跨节点共享状态，节点实现完全自包含。

| 步骤  | 内容                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------ |
| γ-3.1 | 从 MessagePreprocessor 构造函数中移除 `state` 参数。防抖队列、版本号改为节点私有属性                   |
| γ-3.2 | 从 CommandDispatcher 构造函数中移除 `state` 参数。版本检查改为读取文件信封中的时间戳                   |
| γ-3.3 | 从 `node_factory.py` 移除 `NODE_NEEDS_PIPELINE_STATE` 和 `SharedPipelineState` 创建逻辑                |
| γ-3.4 | 删除 `src/brain/nodes/pipeline_state.py`                                                               |
| γ-3.5 | 历史读写逻辑迁移：`history/sessions/` 目录移除——对话历史现在是 self/stream/now.md 和 archive/ 的一部分 |
| γ-3.6 | 更新所有相关测试                                                                                       |

### 阶段 γ-4：节律系统 & 拓扑原语 (5-6 天)

**目标**：让她拥有时间感知能力，以及灵活的文件路由拓扑。

| 步骤  | 内容                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------ |
| γ-4.1 | 升级 `HeartbeatGenerator`：从一次性 bootstrap 改为周期性 Node，每 60s 写入 `heartbeat/tick.json` |
| γ-4.2 | 新建 `TimerScheduler` (Router)：watch tick.json，按 cron 规则产出 `rhythm/triggers/*.json`       |
| γ-4.3 | 新建 `SwitchRouter`：基于条件的文件路由分叉，复用 `state_store.OP_FUNCS`                         |
| γ-4.4 | 新建 `MergeRouter`：多源文件汇聚，支持 `all` / `any` 等待策略                                    |
| γ-4.5 | 新建 `BroadcastRouter`：一对多文件复制扇出                                                       |
| γ-4.6 | 新建 `DeadLetterRouter`：超期文件回收                                                            |
| γ-4.7 | `topology.yaml` 更新：加入节律链路和拓扑原语节点                                                 |

### 阶段 γ-5：记忆沉淀 & 可观测性 (3-4 天)

**目标**：MemoryConsolidator 作为 Pool A 的周期性自我整理过程运行。系统不再是黑盒。

| 步骤  | 内容                                                                                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| γ-5.1 | 实现 MemoryConsolidator 作为 Externalizer 的一种特殊模式：当节律事件触发"该整理记忆了"时，Externalizer 读取 today's stream，提取新知，更新 `self/memories/*.md`，归档 now.md |
| γ-5.2 | 新建 `MetricsCollector` (Router)：聚合文件流转统计                                                                                                                           |
| γ-5.3 | CLI 命令：`/stream` 查看她最近的自我之流，`/state` 查看她当前状态，`/memories` 检索她的记忆                                                                                  |
| γ-5.4 | 端到端验收：用 `/say` 注入测试消息，用 `/stream` 观察完整认知链路                                                                                                            |

---

## 8. 拓扑全景图 (Kernel-γ 终态)

```
                        ┌─────────────────────────┐
                        │     Pool B: 神经json系统     │
                        │                          │
  外部世界 ──→ EventBridge ──→ inbox/pending/*.json │
                        │         ↓                │
                        │  MessagePreprocessor     │
                        │         ↓                │
                        │  message_queue/*.json    │
                        └──────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    │                              │
                    ▼                              ▼
          ┌──────────────┐              ┌──────────────────┐
          │ Internalizer │              │  HeartbeatGenerator │
          │  (B→A)       │              │  → TimerScheduler   │
          │  watch:      │              │  → rhythm/triggers/ │
          │  msg_queue   │              └────────┬───────────┘
          └──────┬───────┘                       │
                 │                               │
                 │  追加体验到                    │  节律事件也走
                 │  self/stream/now.md           │  相同的路径
                 ▼                               │
          ┌──────────────────────────────────────┴──┐
          │           Pool A: 自我之流                │
          │                                          │
          │  self/stream/now.md  ← 所有体验和思考      │
          │  self/state.md       ← 当前自我状态        │
          │  self/memories/*.md  ← 持久知识            │
          │  self/diary/*.md     ← 日记                │
          │  self/archive/*.md   ← 每日归档            │
          │                                          │
          │  ┌─ 自我反思过程 ────────────────────┐    │
          │  │ 她读取 now.md，思考，追加新想法    │    │
          │  │ "我想回复..."、"我决定..."         │    │
          │  │ "我该整理记忆了..."               │    │
          │  └──────────────────────────────────┘    │
          │                                          │
          └──────────────────┬───────────────────────┘
                             │
                             │ Externalizer 读取 now.md
                             │ 识别意图，转译为动作
                             ▼
                    ┌──────────────────┐
                    │  Externalizer    │
                    │  (A→B)           │
                    │  产出:           │
                    │  action_queue/   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ CommandDispatcher│
                    │  → host.invoke() │
                    └────────┬─────────┘
                             │
                             ▼
                          外部世界
                             │
                             │ 她的行动成为新的事件
                             │ 反哺回 EventBridge
                             └──→ (闭环)
```

**节点清单 (Kernel-γ 终态)**：

| #   | 节点                | 池      | 类型          | 说明                            |
| --- | ------------------- | ------- | ------------- | ------------------------------- |
| 1   | EventBridge         | B       | Sensor        | 外部事件→inbox JSON             |
| 2   | HeartbeatGenerator  | B       | Sensor        | 周期性心跳脉冲                  |
| 3   | TimerScheduler      | B       | Sensor        | 心跳→节律触发                   |
| 4   | MessagePreprocessor | B       | Processor     | 统一事件→标准信封 message_queue |
| 5   | **Internalizer**    | **A↔B** | **Cognitive** | **结构化事件→第一人称体验叙事** |
| 6   | **Externalizer**    | **A↔B** | **Cognitive** | **第一人称意图→结构化动作**     |
| 7   | CommandDispatcher   | B       | Effector      | 动作 JSON→host.invoke_command() |
| 8   | SwitchRouter        | B       | Processor     | 条件分叉路由                    |
| 9   | MergeRouter         | B       | Processor     | 多源汇聚路由                    |
| 10  | BroadcastRouter     | B       | Processor     | 一对多扇出                      |
| 11  | DeadLetterRouter    | B       | Monitor       | 超期文件回收                    |
| 12  | MetricsCollector    | B       | Monitor       | 文件流转统计                    |

**废弃的 Kernel-β 节点**：

| 节点                | 去向                                                       |
| ------------------- | ---------------------------------------------------------- |
| ImpulseGate         | 门控判断吸收到 Pool A 自我反思中（"我想回复吗？"）         |
| ActionPlanner       | 动作规划吸收到 Externalizer 转义过程中（"我决定..."→JSON） |
| SharedPipelineState | 完全移除，节点自包含                                       |

---

## 9. 设计决策记录

| 决策                                        | 理由                                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **两个物理隔离的上下文池**                  | JSON 结构化数据和第一人称叙事互相污染时，自我认知会退化。物理隔离确保 Pool A 永远纯净                                                  |
| **Internalizer 和 Externalizer 是认知核心** | 它们不只是"翻译器"——Internalizer 是感知+赋予意义，Externalizer 是决策+行动转义。LLM 调用集中在这两个点，而非散布在多个 pipeline 节点中 |
| **废弃 ImpulseGate 和 ActionPlanner**       | 门控和规划不是独立的机械步骤——它们是自然的思考过程。在 Pool A 中以第一人称完成，比在 Pool B 中以 JSON 格式完成更接近一个"人"的认知方式 |
| **Markdown 而非 JSON 用于自我之流**         | Markdown 是人类可读的叙事格式。JSON 是机器格式。她的自我认知不应该看起来像 API 响应                                                    |
| **now.md 作为唯一的工作记忆**               | 避免"对话历史"和"自我认知"的分裂。一切她感知到的都在一条流里，按时间排列，不分来源                                                     |
| **对话历史不再存在**                        | 对话历史是消息处理器的概念。"Alice 说了X，我回复了 Y"只是自我之流中的两个时间点——不需要一个专门的存储结构                              |
| **不新增 Node 基类**                        | Sensor/Processor/Effector/Monitor 是语义标签。底层仍是 `Node` / `Agent` / `Router`。Internalizer 和 Externalizer 是 `Agent` 子类       |
| **SelfStream 不是 Node**                    | `SelfStream` 是一个纯数据访问层（文件读写），不继承 `Node`。它被 Internalizer 和 Externalizer 作为工具使用，而非作为独立的认知节点     |

---

## 10. 风险与缓解

| 风险                          | 影响                                                 | 缓解                                                                                                          |
| ----------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **now.md 无限增长**           | 上下文窗口溢出，LLM 调用成本失控                     | 每小时滚动归档（now.md → archive/），now.md 保持最近 ~1 小时内容。MemoryConsolidator 定期提取新知到 memories/ |
| **"她"过度思考**              | 每次内化事件后都触发反思，LLM 调用频率过高           | Externalizer 按需触发（识别到"我决定..."才产动作）；纯思考不需要每次调用完整模型                              |
| **Internalizer 误解事件**     | 事件类型多样（消息/闹钟/错误恢复），内化叙事偏离原意 | 标准信封的 `source_type` 字段帮助 Internalizer 区分事件性质；prompt 中明确指导不同事件的叙事风格              |
| **Externalizer 遗漏行动意图** | "我决定..."的表达方式多样，意图识别不完整            | 渐进增强：先用明确的"我决定..."模式，后续加入更自然的意图识别                                                 |
| **历史数据迁移**              | Kernel-β 的 `history.json` 格式与 self/stream 不兼容 | 一次性迁移脚本：将 history.json 中的每条消息转换为第一人称叙事追加到 now.md。旧文件保留备份                   |
| **文件 I/O 瓶颈**             | now.md 高频追加写入                                  | now.md 追加是顺序写入，OS 层面高效。必要时加入内存缓冲（每 N 秒刷盘一次）                                     |

---

## 11. 与 Kernel-β 的对比

|                | Kernel-β                                           | Kernel-γ                                                |
| -------------- | -------------------------------------------------- | ------------------------------------------------------- |
| **架构范式**   | Agent 工作流（消息→门控→规划→派发）                | 认知主体的感知体系（体验→思考→决定→行动）               |
| **驱动方式**   | 用户消息驱动（"用户说了什么"）                     | 所有事件平等驱动（"她感知到了什么"）                    |
| **认知模型**   | 4 个独立 LLM 节点（Gate + Plan + Reflect + Diary） | 2 个转义者（Internalizer + Externalizer）+ 池内自我反思 |
| **上下文管理** | SharedPipelineState 内存共享                       | Pool A 文件流（自我之流），Pool B JSON 无状态           |
| **对话历史**   | `history.json` 独立文件                            | 对话是 now.md 中按时间排列的自然叙事                    |
| **门控**       | ImpulseGate 独立节点，LLM 返回 是/否               | 她的自然思考过程："我想回复吗？"                        |
| **动作规划**   | ActionPlanner 独立节点，输出 JSON                  | Externalizer 转义她在自我之流中表达的决定               |
| **记忆**       | L1/L2/L3 独立的存储系统                            | self/stream/ 就是记忆，memories/ 是从流中提取的持久知识 |
| **节律**       | 无                                                 | TimerScheduler + 心跳 + 她感知时间流逝                  |
| **节点数量**   | 4 (+ SharedPipelineState)                          | 12（2 个认知核心 + 10 个机械节点）                      |
