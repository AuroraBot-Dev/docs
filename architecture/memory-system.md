---
title: 记忆系统
description: L1 工作记忆 / L2 情景记忆 / L3 语义记忆——三级联合记忆的存储与检索方式。
order: 6
---

# 记忆系统

记忆系统是 CortexForge 认知引擎的 memory 子系统。`UnifiedMemoryManager` 封装了 L1/L2/L3 的写入与检索接口，认知节点通过它存取记忆。

**挼挼如是说**

> 大部分 bot 的记忆是多翻几轮对话。AuroraBot 不一样——L1 记住刚才说了啥，L2 按时间线存档，L3 用向量相似度找"跟现在最相关的"。三层各司其职，谁也不替代谁。

## 三级结构

| 层级            | 类               | 存储方式         | 容量        | 用途           |
| --------------- | ---------------- | ---------------- | ----------- | -------------- |
| **L1 工作记忆** | `WorkingMemory`  | 内存列表（FIFO） | 最近 10 条  | 当前会话上下文 |
| **L2 情景记忆** | `EpisodicMemory` | JSON 文件追加    | 50 条后压缩 | 按时间线存档   |
| **L3 语义记忆** | `SemanticMemory` | ChromaDB 向量    | 无上限      | 语义相似度检索 |

核心数据流：

```python
# 写入（一键写入）
memory.process_interaction(content=msg, role="user", user_id="xxx")
    → L1: working.add(content, role)           # 追加到内存列表
    → L2: episodic.record_event(type, content) # 追加到 JSON 文件
    → L3: semantic.extract_and_store(text)     # LLM 提取事实 → ChromaDB

# 读取（一键检索）
context = memory.retrieve_context(query, user_id)
    → L1: working.get_context()                # 全量返回
    → L2: episodic.retrieve_since(timestamp)   # 按时间范围
    → L3: semantic.retrieve(query, k=5)        # 向量相似度 top-k
```

### L1 工作记忆

`src/brain/memory/working.py`

- 纯内存列表，`max_items = 10`
- 超出容量时 FIFO 淘汰最早记录
- 不持久化，进程重启后清空

### L2 情景记忆

`src/brain/memory/episodic.py`

- 追加写入 `data/memory/episodes.json`
- 超过 50 条触发折叠压缩：调用 DeepSeek API 将历史记录浓缩为一条 summary
- 带防抖去重：连续相同内容不重复写入
- 按时间范围检索，返回时间线片段

### L3 语义记忆

`src/brain/memory/semantic.py`

- 基于本地 ChromaDB 持久化向量存储
- 写入时通过 LLM 从文本提取结构化事实和关系
- 检索时按向量相似度返回 top-k 相关记忆
- 支持 `MemoryItem` 的增删改查

## 统一入口

```python
class UnifiedMemoryManager:
    def process_interaction(content, role, user_id) → None   # 一键写入
    def retrieve_context(query, user_id) → MemoryContext     # 一键检索
    def initialize_system_prompt(user_id, core_prompt) → None  # 初始化
```

Agent 节点通过构造时注入的 `UnifiedMemoryManager` 实例调用这些方法，无需关心底层 L1/L2/L3 的流转。

## 当前覆盖范围

目前的记忆写入来源：

| 来源                     | 写入方式                                                                      |
| ------------------------ | ----------------------------------------------------------------------------- |
| 外部事件（对话等）       | `MemoryRouter` 读取 `memory/pending/event_*.json`，调用 `process_interaction` |
| PlanAgent / ExecuteAgent | 执行期间通过 `_memory` 引用写入                                               |

## 设计约束

- 节点不直接操作 L1/L2/L3，统一通过 `UnifiedMemoryManager` 存取
- `process_interaction()` 一键写入三层，保证 L1 ↔ L2 ↔ L3 数据一致
- L1 纯内存、不持久化，进程重启后清空
- L2 按时间线追加，带防抖去重: 连续相同内容不重复写入
- L3 写入时通过 LLM 提取结构化事实，检索时按向量相似度 top-k 返回

## 下一步阅读

- 想了解记忆在认知管线中的位置: 读 [认知引擎架构](./brain-architecture.html)
- 想了解节点系统: 读 [节点系统](./node-system.html)
- 想了解 Circuit 调度: 读 [内核运行时](./kernel-runtime.html)
