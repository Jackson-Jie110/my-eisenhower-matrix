import React from "react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Task } from "../types";
import { ParticlesBackground } from "../components/ui/ParticlesBackground";

const pageMotion = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, scale: 1.1, transition: { duration: 0.3 } },
};

const parseTasks = (raw: string | null) => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as Task[];
    }
  } catch {
    return [];
  }
  return [];
};

const getHeatClass = (completedCount: number) => {
  if (completedCount >= 7) {
    return "bg-yellow-400";
  }
  if (completedCount >= 4) {
    return "bg-blue-500/60";
  }
  if (completedCount >= 1) {
    return "bg-blue-500/30";
  }
  return "bg-white/5";
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const { focusDays, totalCompleted, completionMap } = React.useMemo(() => {
    if (typeof window === "undefined") {
      return {
        focusDays: 0,
        totalCompleted: 0,
        completionMap: new Map<string, number>(),
      };
    }

    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("tasks_")
    );
    let days = 0;
    let completedTotal = 0;
    const map = new Map<string, number>();

    keys.forEach((key) => {
      const date = key.replace("tasks_", "");
      const tasks = parseTasks(localStorage.getItem(key));
      if (tasks.length > 0) {
        days += 1;
      }
      const completed = tasks.filter((task) => task.isCompleted).length;
      completedTotal += completed;
      map.set(date, completed);
    });

    return {
      focusDays: days,
      totalCompleted: completedTotal,
      completionMap: map,
    };
  }, []);

  const heatmapDates = React.useMemo(() => {
    const today = dayjs().startOf("day");
    return Array.from({ length: 365 }, (_, index) =>
      today.subtract(364 - index, "day")
    );
  }, []);

  return (
    <motion.div
      variants={pageMotion}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative min-h-screen overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <ParticlesBackground />
      </div>
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="space-y-3">
          <button
            type="button"
            onClick={() => navigate("/archive")}
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            返回
          </button>
          <h1 className="text-3xl font-semibold text-white">仪表盘</h1>
          <p className="text-sm text-slate-400">
            总专注天数 {focusDays} 天 · 累计完成任务 {totalCompleted} 项
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-white">年度专注热力图</h2>
          <p className="mt-1 text-xs text-slate-400">
            最近 365 天完成情况
          </p>
          <div className="mt-6 overflow-x-auto">
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {heatmapDates.map((date) => {
                const dateKey = date.format("YYYY-MM-DD");
                const completed = completionMap.get(dateKey) ?? 0;
                return (
                  <div
                    key={dateKey}
                    title={`${dateKey}: 完成 ${completed} 项任务`}
                    className={`h-3 w-3 rounded-sm ${getHeatClass(completed)}`}
                  />
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
