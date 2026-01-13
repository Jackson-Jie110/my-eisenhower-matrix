# 01_PRD.md - 产品需求文档 (Final)

## 1. 项目概述 (Project Overview)
**产品名称**：Flat Matrix (AI 驱动的极简四象限)
**核心价值**：结合“艾森豪威尔矩阵”与“扁平化设计美学 (Flat Design)”，通过 AI 辅助决策，帮助用户高效管理任务。
**核心差异点**：
1.  **视觉风格**：极致的 Flat Design，无阴影、强对比、大色块、无圆角渐变。
2.  **AI 赋能**：支持自然语言输入的语义分析，一键自动将任务分配至对应象限。
3.  **数据主权**：基于 LocalStorage 的本地存储，支持生成每日图片导出，支持历史归档回顾。

## 2. 用户流程 (User Flow)

```mermaid
graph TD
    A[用户打开网站] --> B{检查 API Key}
    B -->|无/默认| C[使用内置免费 Key]
    B -->|用户自定义| D[使用用户 Key (设置页配置)]
    
    C & D --> E[进入主界面]
    
    E --> F[顶部：输入任务 & 备注]
    F --> G[添加到待办池 (Backlog)]
    
    G --> H{分类方式}
    H -->|方式 A: 手动拖拽| I[拖入四象限]
    H -->|方式 B: AI 分析| J[AI 自动分配 (直接落位)]
    
    I & J --> K[任务落入象限]
    
    K --> L[标记完成 (划线保留)]
    K --> M[拖回待办池 (后悔药)]
    K --> N[删除任务]
    
    E --> O[保存/导出]
    O --> P[生成今日图片 (PNG)]
    O --> Q[自动存入历史归档 (LocalStorage)]
```

## 3. 功能模块详解 (Functional Specs)

### 3.1 全局设置与 AI 配置
* **API Key 管理**：
    * **默认模式**：内置一个免费的 API Key（由开发者配置在 `.env` 或代码中），确保小白用户开箱即用。
    * **自定义模式**：在“设置 (Settings)”模态框中，提供输入框允许用户填写自己的 OpenAI/DeepSeek API Key。
    * **指引**：设置页需包含简短文案，指导用户如何获取 Key。

### 3.2 任务输入区 (Top Section)
* **布局**：位于页面顶部 (Top)。
* **交互组件**：
    1.  **主输入框**：输入任务标题 (如 "完成高数作业")，支持回车提交。
    2.  **备注/上下文 (Context)**：折叠式或小图标触发的输入框，用于补充细节 (如 "明天截止", "如果不做会被骂")，辅助 AI 判断。
    3.  **操作按钮**：
        * `Add` (添加)：仅添加到待办池。
        * `Magic Sort` (AI 整理)：将输入框内容（或待办池中的任务）发送给 AI，自动分析并飞入对应象限。

### 3.3 待办池 (Backlog)
* **位置**：位于输入区下方或并在顶部，采用横向滚动或紧凑列表布局。
* **功能**：暂存未分类的任务。
* **交互**：作为 Drag Source (拖拽源)，可拖入任意象限。

### 3.4 四象限矩阵 (Matrix Display)
* **布局**：占据页面主体 (Bottom)，分为均等的四个区域。
* **视觉定义 (基于 Flat Design)**：
    * **Q1 (重要+紧急)**：背景色 `bg-red-100`，强调色 `text-red-900`。
    * **Q2 (重要+不紧急)**：背景色 `bg-blue-100`，强调色 `text-blue-900`。
    * **Q3 (紧急+不重要)**：背景色 `bg-amber-100` (或黄色)，强调色 `text-amber-900`。
    * **Q4 (不重要+不紧急)**：背景色 `bg-gray-100`，强调色 `text-gray-900`。
* **交互**：每个象限都是 Droppable (可放置区域)。

### 3.5 任务卡片交互细节
* **拖拽 (DnD)**：
    * 支持 `待办池 -> 象限`。
    * 支持 `象限 -> 象限` (调整优先级)。
    * 支持 `象限 -> 待办池` (撤回/后悔药)。
    * **动效**：拖拽时卡片要有缩放效果 (`scale-105`)，释放时平滑吸附。
* **状态管理**：
    * **完成 (Done)**：点击卡片 Checkbox。
        * *表现*：文字添加删除线 (Strikethrough)，卡片透明度降低 (Opacity 0.6)，**保留在原位置**不消失。
    * **删除 (Delete)**：悬停显示删除图标，点击物理删除。

### 3.6 数据与导出系统
* **本地存储**：
    * 使用 `LocalStorage` 实时保存 `tasks` 数组，防止刷新丢失。
    * **历史归档**：实现简单的“时光机”功能，按日期存储每日的任务快照 (JSON 格式)。
* **图片导出**：
    * 功能：点击“导出今日”按钮。
    * 实现：使用 `html2canvas` 将四象限容器渲染为图片并自动下载。

## 4. UI/UX 视觉规范 (Design System)
> **注意：具体的 CSS 样式实现必须严格参考 `docs/AGENTS.md` 中的设计系统。**

* **核心风格**：Flat Design (扁平化)。
* **特征**：
    * **No Shadows**：绝对禁止使用 `box-shadow`。
    * **Borders**：使用实色背景区分区块，或者使用粗边框 (`border-2`/`border-4`)。
    * **Typography**：字体使用 **Outfit**，标题加粗，层级分明。
    * **Animations**：使用 `transform` (scale, translate) 进行交互反馈，拒绝模糊和渐变。

## 5. 技术栈与架构 (Tech Stack)
* **Core**: React 18 + TypeScript + Vite
* **State Management**: Zustand (轻量、无样板代码)
* **Styling**: Tailwind CSS (配合 `tailwind.config.js` 配置 Design Tokens)
* **Icons**: Lucide React
* **Drag & Drop**: @dnd-kit/core (比 react-beautiful-dnd 更现代、模块化)
* **AI Integration**: OpenAI SDK (用于调用 GPT-4o-mini 或 DeepSeek API)
* **Utils**: 
    * `clsx` & `tailwind-merge` (样式合并)
    * `html2canvas` (图片生成)
    * `dayjs` (时间处理)