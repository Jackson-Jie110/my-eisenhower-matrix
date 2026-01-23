import React from "react";
import { Bug, CalendarCheck, CalendarX, Trash2 } from "lucide-react";

export const DebugPanel = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!import.meta.env.DEV) {
    return null;
  }

  const mockTasks = (date: string) => {
    const tasks = [
      {
        id: "debug-1",
        title: "Debug任务1 (未完成)",
        isCompleted: false,
        quadrantId: "q1",
        createdAt: Date.now(),
      },
      {
        id: "debug-2",
        title: "Debug任务2 (未完成)",
        isCompleted: false,
        quadrantId: "q2",
        createdAt: Date.now(),
      },
      {
        id: "debug-3",
        title: "Debug任务3 (已完成)",
        isCompleted: true,
        quadrantId: "q3",
        createdAt: Date.now(),
      },
    ];
    localStorage.setItem(`tasks_${date}`, JSON.stringify(tasks));
  };

  const handleScenarioA = () => {
    if (
      window.confirm(
        "即将清空数据并模拟：1月19日有数据 -> 跳转至 1月23日。\n预期：页面空白，无迁移弹窗。"
      )
    ) {
      localStorage.clear();
      mockTasks("2026-01-19");
      window.location.href = "/matrix/2026-01-23";
    }
  };

  const handleScenarioB = () => {
    if (
      window.confirm(
        "即将清空数据并模拟：1月19日有数据 -> 跳转至 1月20日。\n预期：弹出“昨日任务未完成”提示框。"
      )
    ) {
      localStorage.clear();
      mockTasks("2026-01-19");
      window.location.href = "/matrix/2026-01-20";
    }
  };

  const handleClear = () => {
    if (window.confirm("确定清空所有本地数据吗？")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {isOpen ? (
        <div className="mb-4 w-64 rounded-lg border border-white/10 bg-slate-900/90 p-3 shadow-2xl backdrop-blur-md">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            DevTools
          </div>

          <button
            onClick={handleScenarioA}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-white/10"
            type="button"
          >
            <CalendarX className="h-4 w-4 text-orange-400" />
            <div>
              <div className="font-bold text-slate-200">场景 A: 断更测试</div>
              <div className="text-[10px] text-slate-500">
                19号数据 -&gt; 进23号 (无弹窗)
              </div>
            </div>
          </button>

          <button
            onClick={handleScenarioB}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-white/10"
            type="button"
          >
            <CalendarCheck className="h-4 w-4 text-green-400" />
            <div>
              <div className="font-bold text-slate-200">场景 B: 连续测试</div>
              <div className="text-[10px] text-slate-500">
                19号数据 -&gt; 进20号 (有弹窗)
              </div>
            </div>
          </button>

          <div className="my-1 h-px bg-white/10" />

          <button
            onClick={handleClear}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-red-300 transition-colors hover:bg-red-500/20"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            <span>清空所有数据</span>
          </button>
        </div>
      ) : null}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-indigo-500 active:scale-95"
        type="button"
      >
        <Bug className="h-5 w-5" />
      </button>
    </div>
  );
};
