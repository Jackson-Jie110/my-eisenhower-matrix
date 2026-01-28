# Flat Matrix

> 极简主义四象限时间管理利器

Flat Matrix 是一个基于艾森豪威尔矩阵（Eisenhower Matrix）的个人效能工作台：融合「时间维度」与「键盘流」交互，让你在沉浸式界面中快速录入、整理与流转任务。数据仅保存在本地（LocalStorage），隐私优先、开箱即用。

## 核心功能

- **四象限矩阵**：经典 Q1 / Q2 / Q3 / Q4 分类，支持拖拽排序与跨象限流转（基于 `@dnd-kit`）。
- **键盘流（Keyboard Mastery）**：录入 + 整理无缝切换，尽量做到“不离开键盘”。
- **时间穿越**：按日期查看历史矩阵，路由驱动（`/matrix/:date`）。
- **定制日历组件**：基于 `react-day-picker`，深色毛玻璃风格，适配全局 Glassmorphism 视觉语言。
- **自动迁移**：每日首次访问自动检测昨日未完成任务，支持一键迁移。
- **极致 UI/UX**：深色磨砂玻璃、粒子背景、庆祝彩带、响应式拖拽（`pointerWithin` 算法优化）。
- **数据洞察**：仪表盘支持热力图与完成率统计。

## 快捷键指南

| 场景 | 快捷键 | 行为 |
|------|--------|------|
| 录入 | `Enter` | 提交任务 / 聚焦输入框 |
| 切换 | `Alt + 1` | 聚焦待办任务池（进入整理流） |
| 选择 | `1-9` | 选中待办任务（按序号） |
| 分发 | `Q / W / E / R` | 移动至对应象限 |
| 删除 | `Delete` | 删除选中任务 |
| 取消 | `Esc` | 取消选中 / 失焦 |

## 技术栈

- **Core**：React 18、TypeScript、Vite
- **State & Storage**：Zustand（配合 LocalStorage 持久化）
- **UI & Styling**：Tailwind CSS、Framer Motion（动效）、Lucide React（图标）
- **Interaction**：@dnd-kit（拖拽）、react-day-picker（日历）、自研快捷键 Hook（`src/hooks/useKeyboardShortcuts.ts`，可替换/扩展为 `react-hotkeys-hook`）

## 快速开始

```bash
git clone [repository-url]
cd flat-matrix
npm install
npm run dev
```

## 脚本

- `npm run dev`：本地开发（Vite）
- `npm run build`：生产构建（TypeScript build + Vite build）
- `npm run preview`：本地预览构建产物
- `npm run lint`：ESLint 检查

## 数据与隐私

- 默认使用浏览器本地存储（LocalStorage）保存任务与偏好设置。
- 不依赖后端服务，不上传数据；清空浏览器站点数据会清空本地内容。
