import React from "react";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, ChevronLeft, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { QuadrantId, Task } from "../types";
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
  if (completedCount >= 6) {
    return "bg-yellow-400";
  }
  if (completedCount >= 3) {
    return "bg-blue-500/60";
  }
  if (completedCount >= 1) {
    return "bg-blue-500/30";
  }
  return "bg-white/5";
};

const MetricCard = ({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md">
    <div className="flex items-center gap-3">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ${accent}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{title}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();

  const {
    focusDays,
    totalCompleted,
    currentStreak,
    completionMap,
    quadrantCounts,
  } = React.useMemo(() => {
    if (typeof window === "undefined") {
      return {
        focusDays: 0,
        totalCompleted: 0,
        currentStreak: 0,
        completionMap: new Map<string, number>(),
        quadrantCounts: {
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
        } as Record<QuadrantId, number>,
      };
    }

    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("tasks_")
    );
    let days = 0;
    let completedTotal = 0;
    const map = new Map<string, number>();
    const quadrantCounter: Record<QuadrantId, number> = {
      q1: 0,
      q2: 0,
      q3: 0,
      q4: 0,
    };
    const completedDates = new Set<string>();

    keys.forEach((key) => {
      const date = key.replace("tasks_", "");
      const tasks = parseTasks(localStorage.getItem(key));
      if (tasks.length > 0) {
        days += 1;
      }
      const completed = tasks.filter((task) => task.isCompleted).length;
      if (completed > 0) {
        completedDates.add(date);
      }
      completedTotal += completed;
      map.set(date, completed);
      tasks.forEach((task) => {
        if (task.quadrantId) {
          quadrantCounter[task.quadrantId] += 1;
        }
      });
    });

    let streak = 0;
    let cursor = dayjs().format("YYYY-MM-DD");
    while (completedDates.has(cursor)) {
      streak += 1;
      cursor = dayjs(cursor).subtract(1, "day").format("YYYY-MM-DD");
    }

    return {
      focusDays: days,
      totalCompleted: completedTotal,
      currentStreak: streak,
      completionMap: map,
      quadrantCounts: quadrantCounter,
    };
  }, []);

  const heatmapDates = React.useMemo(() => {
    const today = dayjs().startOf("day");
    return Array.from({ length: 90 }, (_, index) =>
      today.subtract(89 - index, "day")
    );
  }, []);

  const quadrantItems = React.useMemo(
    () => [
      { id: "q1", label: "Q1 重要且紧急", color: "bg-neon-red" },
      { id: "q2", label: "Q2 重要不紧急", color: "bg-neon-blue" },
      { id: "q3", label: "Q3 紧急不重要", color: "bg-neon-yellow" },
      { id: "q4", label: "Q4 不重要不紧急", color: "bg-neon-gray" },
    ],
    []
  );

  const totalQuadrant = Object.values(quadrantCounts).reduce(
    (sum, value) => sum + value,
    0
  );

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
          <p className="text-sm text-slate-400">最近一个季度的专注轨迹</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="累计完成"
            value={`${totalCompleted} 项`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="text-neon-blue"
          />
          <MetricCard
            title="专注天数"
            value={`${focusDays} 天`}
            icon={<CalendarDays className="h-5 w-5" />}
            accent="text-neon-yellow"
          />
          <MetricCard
            title="连续打卡"
            value={`${currentStreak} 天`}
            icon={<Flame className="h-5 w-5" />}
            accent="text-neon-red"
          />

          <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md md:col-span-1">
            <h2 className="text-sm font-semibold text-white">象限精力分布</h2>
            <div className="mt-4 space-y-4">
              {quadrantItems.map((item) => {
                const count =
                  quadrantCounts[item.id as QuadrantId] ?? 0;
                const percent = totalQuadrant
                  ? Math.round((count / totalQuadrant) * 100)
                  : 0;
                return (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>{item.label}</span>
                      <span>{count} 项</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-md md:col-span-2">
            <h2 className="text-sm font-semibold text-white">
              近 90 天专注热力图
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              每格代表一天的完成任务数量
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {heatmapDates.map((date) => {
                const dateKey = date.format("YYYY-MM-DD");
                const completed = completionMap.get(dateKey) ?? 0;
                const tooltip = `${date.format("M月D日")}: 完成 ${completed} 项任务`;
                return (
                  <div
                    key={dateKey}
                    title={tooltip}
                    className={`h-6 w-6 rounded-md ${getHeatClass(completed)}`}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
