## MIAOMC Nest Worker

MIAOMC Nest Worker 是 MIAOMC Nest 项目中的一个核心组件，负责处理与 Docker 容器相关的任务。它作为一个独立的服务运行，接受来自 Queen 的指令，并通过 Docker API 管理容器的生命周期，同时处理周期性任务和事件循环，Worker 不存储任何状态信息，由 Queen 负责调度和状态管理，来避免分布式环境中的状态混乱问题。

### 主要功能

- **容器管理**：通过 Docker API 管理容器的生命周期，包括创建、
- **事件循环**: 处理周期性任务，例如同步容器状态、清理资源等。
- **无状态**: Worker 不存储任何状态信息，由 Queen 负责调度和状态管理。
- **Confirm Before Action**: 在执行关键操作前，Worker 会向 Queen 请求确认，确保操作的安全性和正确性。
- **HMAC 验证**: 使用 HMAC 验证请求的合法性，防止未经授权的访问。

### 技术栈

基于 TypeScript 编写 使用 Dockerode 作为 Docker API 的 Node.js 客户端 使用 Fastify 作为 HTTP 服务器框架
