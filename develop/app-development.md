---
title: App 开发指南
description: 从目录结构到生命周期，系统化说明 AuroraBot 的 App 开发方式。
order: 2
---

# App 开发指南

::: warning
施工中... 指文本大致正确, 但是不完整或缺乏人工审核, 暂时仅供参考.
:::

App 是 AuroraBot 的感知与执行模块。一个 App 不负责推理——它只做两件事：把外部变化上报为事件，执行认知引擎决定的命令。

**挼挼如是说**

> 就是给 AuroraBot 写应用啦, 和你用的差不多, 就是没有 UI 而已~

## 设计哲学

就像给自己写CLI工具一样, 原子化操作. 其他应用给你的反馈就是事件, 你点的按钮就是操作命令

## 设计准则

1. App 负责感知与执行，不负责复杂决策
2. App 应暴露原子命令，避免在 App 内部编排复杂业务流程
3. App 的私有数据由 App 自己管理，内核不访问 App 私有数据

## 标准目录结构

```text
apps/<your_app>/
  __init__.py
  manifest.yaml
  runtime.py
  README.md
  config.example.json
```

## 核心文件说明

### `manifest.yaml` — 能力声明

声明以下信息：

- 包名与版本
- 可调用的命令及其参数与返回值

示例：

```yaml
package: im.polaris.example
name: 示例应用
version: 1.0.0
brain_version: ">=0.4.0"
app_desc: >-
  描述这个应用适合在什么场景下被调用。
commands:
  - name: do_something
    description: 执行一个示例动作
    parameters:
      text:
        type: string
        description: 要处理的文本
        required: true
    returns:
      success:
        type: boolean
        description: 是否成功
```

### `runtime.py` — 实现逻辑

App 的实际运行逻辑。框架会在注册时注入 `PlatformAPI` 实例，然后按生命周期调度。

示例：

```python
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.platform.application_api import PlatformAPI


class ExampleApplication:
    def __init__(self) -> None:
        self._api: PlatformAPI | None = None

    def _bind(self, api: "PlatformAPI") -> None:
        self._api = api

    def manifest_path(self) -> Path:
        return Path(__file__).with_name("manifest.yaml")

    async def on_start(self) -> None:
        pass

    async def on_tick(self) -> None:
        pass

    async def on_stop(self) -> None:
        pass

    def do_something(self, text: str) -> dict:
        return {"success": True}
```

## PlatformAPI 提供的常用能力

`_bind(self, api)` 被调用后，即可通过 `api` 访问以下能力：

### `api.emit_event(event)`

将外部变化上报为 `AppEvent`。

```python
api.emit_event(
    AppEvent(
        source=api.package,
        type="message.received",
        session_id="12345",
        summary="收到一条消息",
        payload={"text": "你好"},
    )
)
```

### `api.data_dir`

每个 App 的独立数据目录，适合存放：

- 配置文件
- 缓存
- 临时状态
- 运行日志或快照

### `api.log(level, message)`

通过统一日志器记录运行信息。

### `api.package`

`manifest.yaml` 中声明的包名。

## 生命周期

App 的完整生命周期：

1. 平台发现并实例化 App
2. 调用 `_bind(api)` 注入 `PlatformAPI`
3. 调用 `on_start()` 执行初始化
4. 循环调用 `on_tick()`（频率由 `APP_FRAME_INTERVAL` 控制）
5. 退出时调用 `on_stop()` 执行清理

### `on_start()` — 初始化

适合做的：

- 读本地配置
- 初始化连接
- 注册回调
- 恢复上次的运行状态

### `on_tick()` — 定时帧

适合做的：

- 检查时间条件
- 处理队列中的任务
- 派发到期任务

不应做的：

- 长时间阻塞——会拖慢整个 tick 循环
- 重型同步 I/O

### `on_stop()` — 清理

适合做的：

- 将内存中的状态持久化到磁盘
- 关闭连接
- 释放资源

## 开发建议

### App 负责执行，认知引擎负责决策

不应在 App 中编写"看到关键词 A 就自动走流程 B"这类硬编码决策逻辑。应将外部变化上报为事件，由认知引擎的节点决定后续动作。

### 命令粒度保持原子化

好的命令应满足：

- 功能明确——单一职责
- 参数清晰——输入输出规格完整
- 可组合——多个原子命令可串联完成复杂任务
- 可测试——输入输出规整，便于单元测试

### 保证容错但不降级处理

- 在 `on_tick()`、文件读取、外部通信等易出错的环节，要尽量考虑异常情况，避免直接崩溃。
- 当发生异常时, 尽量上报为事件, 由认知引擎的节点处理, 不擅自降级处理。

## 推荐的开发流程

1. 先设计 `manifest.yaml` — 声明 API
2. 再实现 `runtime.py` — 编写运行逻辑
3. 用 `config.example.json` 说明配置格式
4. 补个 `README.md` 说明边界与限制
5. 通过 `app.py`（或未来的 `aur`）做独立调试

## 自检清单

- 是否声明了清晰的 `package`
- 是否为每个命令写了准确描述
- 是否避免了在 App 中承担复杂决策
- 是否把私有状态都放在 `api.data_dir`
- 是否处理了配置缺失与文件损坏等异常

## 继续阅读

- 想理解平台如何调度 App：读 [平台运行时](../architecture/platform-runtime.html)
- 想理解命令怎么最终被执行：读 [认知架构](../architecture/brain-architecture.html)
