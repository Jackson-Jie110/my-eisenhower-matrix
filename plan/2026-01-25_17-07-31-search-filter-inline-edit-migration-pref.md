---
mode: plan
cwd: d:\D盘备份\VS Code代码\Python\Projects\my-eisenhower-matrix
task: implement search/filter + inline edit + migration preference
complexity: medium
planning_method: builtin
created_at: 2026-01-25T17:07:39+08:00
---

# Plan: 搜索/过滤 + 内联编辑 + 迁移偏好记忆落地

🎯 任务概述
基于现有矩阵应用，落地三项高优先级效率功能：搜索/过滤、任务内联编辑、迁移偏好记忆。计划需覆盖新增、删除、修改三类改动，并保持当前数据结构与本地存储兼容。

📋 执行计划
1. 盘点现有任务数据结构与页面交互入口，明确可复用的状态与组件修改点。
2. 设计搜索/过滤的 UI 与状态管理策略，确定筛选范围（标题/备注/象限/完成状态）。
3. 设计内联编辑的触发与保存流程，明确键盘交互与失焦提交规则。
4. 设计迁移偏好记忆的存储键与生命周期，避免与已有确认抑制冲突。
5. 分阶段实现：先补状态与存储，再接入 UI 与交互，再统一文案与空态。
6. 添加必要的回归检查清单（键盘/拖拽/迁移弹窗/存档导入导出）。
7. 输出变更摘要与后续可选优化建议，等待确认后提交代码。

⚠️ 风险与注意事项
- 过滤/搜索可能与现有排序冲突，需要定义清晰的显示优先级。
- 内联编辑需避免与拖拽/快捷键冲突，必要时禁用拖拽或进入编辑锁定。

📎 参考
- `src/pages/MatrixPage.tsx`
- `src/components/Task/TaskCard.tsx`
- `src/hooks/useTaskStore.ts`
- `docs/06_SiteReview.md`
